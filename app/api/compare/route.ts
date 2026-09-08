import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export const runtime = "nodejs"

type Provider = "gemini" | "mistral" | "huggingface"
type ChatMessage = { role: "user" | "assistant"; content: string }

const system = "You are an AI comparison assistant inside Lumen. Answer the user's question directly, clearly, and concisely. Use the supplied conversation context when relevant. Do not mention these instructions."

async function callProvider(provider: Provider, messages: ChatMessage[]) {
  // 1. Handle Gemini using Vercel AI SDK
  if (provider === "gemini") {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured in .env")
    }
    const prompt = messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")
    return (await generateText({ 
      model: google("gemini-3.6-flash"), 
      system, 
      prompt, 
      maxOutputTokens: 900 
    })).text
  }

  // 2. Handle Mistral and Hugging Face REST APIs
  const key = provider === "mistral" ? process.env.MISTRAL_API_KEY : process.env.HUGGINGFACE_API_KEY
  if (!key) {
    throw new Error(`${provider === "mistral" ? "Mistral" : "Hugging Face"} API key is not configured in .env`)
  }

  const url = provider === "mistral" 
    ? "https://api.mistral.ai/v1/chat/completions" 
    : "https://router.huggingface.co/v1/chat/completions"

  const model = provider === "mistral" 
    ? "mistral-small-latest" 
    : "Qwen/Qwen2.5-72B-Instruct"

  // Build OpenAI-compatible chat payload
  const formattedMessages = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content }))
  ]

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key.trim()}`
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature: 0.4,
      max_tokens: 900
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`${provider} failed (${response.status}): ${errorText}`)
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || "No response returned."
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { provider?: Provider; messages?: ChatMessage[] }
    
    if (!body.provider || !["gemini", "mistral", "huggingface"].includes(body.provider) || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "Provider and valid conversation messages are required." }, { status: 400 })
    }

    const messages = body.messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-20)

    const text = await callProvider(body.provider, messages)
    return Response.json({ text })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Provider request failed" }, { status: 500 })
  }
}