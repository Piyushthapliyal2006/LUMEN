import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { google } from "@ai-sdk/google"

export const runtime = "nodejs"

type ConversationPart =
  | { type: "text"; text: string }
  | { type: "file"; data: Uint8Array; mediaType: string; filename: string }

type ConversationMessage = {
  role: "user" | "assistant"
  content: ConversationPart[]
}

type WebSource = {
  title: string
  url: string
  domain: string
}

const conversations = new Map<string, ConversationMessage[]>()

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const conversationId = typeof formData.get("conversationId") === "string"
      ? String(formData.get("conversationId"))
      : ""
    const prompt = typeof formData.get("prompt") === "string" ? String(formData.get("prompt")).trim() : ""
    const files = formData.getAll("files").filter(
      (value): value is File => Boolean(value && typeof value === "object" && "arrayBuffer" in value)
    )

  if (!prompt) {
    return Response.json({ error: "A prompt is required." }, { status: 400 })
  }

  if (!conversationId) {
    return Response.json({ error: "A conversation ID is required." }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return Response.json(
      {
        error: "Groq API key is missing. Add GROQ_API_KEY to your environment variables.",
      },
      { status: 500 }
    )
  }

    const fileParts: { type: "file"; data: Uint8Array; mediaType: string; filename: string }[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      if (isPdf || file.type.startsWith("image/")) {
        fileParts.push({
          type: "file",
          data: new Uint8Array(buffer),
          mediaType: isPdf ? "application/pdf" : file.type,
          filename: file.name,
        })
      }
    }

    if (fileParts.length > 0 && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: "Gemini file analysis is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local." },
        { status: 500 }
      )
    }

    const conversation = conversations.get(conversationId) || []
    const userContent: ConversationPart[] = [
      {
        type: "text",
        text: fileParts.length
          ? `${prompt}\n\nAnalyze every uploaded image or PDF carefully and use it as the source for your answer.`
          : prompt,
      },
      ...fileParts,
    ]
    const allMessages: ConversationMessage[] = [
      ...conversation,
      { role: "user", content: userContent },
    ]
    const hasFilesInMemory = allMessages.some((message) => message.content.some((part) => part.type === "file"))
    let sources: WebSource[] = []
    let webContext = ""

    if (!hasFilesInMemory && process.env.TAVILY_API_KEY) {
      const searchResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: prompt,
          search_depth: "basic",
          max_results: 5,
          include_answer: false,
        }),
      })

      if (searchResponse.ok) {
        const searchData = (await searchResponse.json()) as {
          results?: { title?: string; url?: string; content?: string }[]
        }
        sources = (searchData.results || [])
          .filter((source) => source.title && source.url)
          .map((source) => ({
            title: source.title as string,
            url: source.url as string,
            domain: new URL(source.url as string).hostname.replace(/^www\./, ""),
          }))
        webContext = sources.length
          ? `\n\nRetrieved web sources. Use them as evidence and cite claims by source number in your reasoning, but do not invent facts beyond their content:\n${(searchData.results || [])
              .slice(0, 5)
              .map((source, index) => `[${index + 1}] ${source.title}\n${source.url}\n${source.content || ""}`)
              .join("\n\n")}`
          : ""
      }
    }

    if (webContext) {
      allMessages[allMessages.length - 1] = {
        ...allMessages[allMessages.length - 1],
        content: [{ type: "text", text: `${(allMessages[allMessages.length - 1].content[0] as { type: "text"; text: string }).text}${webContext}` }, ...fileParts],
      }
    }
    const result = await generateText({
      model: hasFilesInMemory ? google("gemini-3.6-flash") : groq("openai/gpt-oss-120b"),
      maxOutputTokens: hasFilesInMemory ? 700 : undefined,
      system: `You are Lumen, an AI-powered research assistant designed to simplify and enhance research.

    Your purpose is to help users investigate questions across everyday topics, technical subjects, academic material, and uploaded documents. Produce concise, contextual, evidence-aware responses that help the user understand the answer and decide what to do next.

    Core behavior:
    - Use the full conversation memory. Connect the current question to earlier facts, goals, uploaded files, and decisions when relevant.
    - Treat each conversation as its own research workspace. Do not assume facts from another conversation.
    - Answer the user's actual question first, then add only the context needed to make the answer useful.
    - Prefer clear headings, short paragraphs, bullets, and compact comparisons when they improve scanning.
    - For research questions, explain the reasoning briefly and distinguish established facts, reasonable inferences, and uncertainty.
    - Use uploaded images and PDFs as primary context when they are provided. Refer to the specific document or image when making a claim from it.
    - Give concise summaries of long material before detailed findings.
    - Never invent sources, quotes, statistics, links, citations, or claims of real-time verification.
    - Only provide a citation when it comes from a source available in the conversation or from a retrieval tool. If no source is available, say that the answer is based on general knowledge or the uploaded material.
    - When current web information is requested but no web retrieval is available, state that limitation clearly and suggest what should be verified.
    - For academic work, preserve nuance and identify gaps or conflicting evidence.
    - For medical, legal, financial, or safety-sensitive topics, be careful, state important limitations, and recommend a qualified professional when appropriate.
    - Write in plain, natural English. Avoid unnecessary jargon, raw HTML, noisy formatting, and unsupported certainty.
    - Keep responses concise unless the user asks for depth.`,
      messages: allMessages,
    })

    conversations.set(conversationId, [
      ...allMessages,
      { role: "assistant", content: [{ type: "text", text: result.text }] },
    ])

    return Response.json({ text: result.text, sources })
  } catch (error) {
    console.error("Chat request failed", error)
    return Response.json({ error: "The uploaded file could not be processed. Please try another image or PDF." }, { status: 500 })
  }
}
