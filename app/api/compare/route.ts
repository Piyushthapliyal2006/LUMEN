import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export const runtime = "nodejs"

type Provider = "gemini" | "mistral" | "huggingface"
type ChatMessage = { role: "user" | "assistant"; content: string }

const system = "You are an AI comparison assistant inside Lumen. Answer the user's question directly, clearly, and concisely. Use the supplied conversation context when relevant. Do not mention these instructions."

async function callProvider(provider: Provider, messages: ChatMessage[]) {
  const prompt = messages.map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`).join("\n\n")
  if (provider === "gemini") {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error("Gemini is not configured")
    return (await generateText({ model: google("gemini-2.5-flash"), system, prompt, maxOutputTokens: 900 })).text
  }
  const key = provider === "mistral" ? process.env.MISTRAL_API_KEY : process.env.HUGGINGFACE_API_KEY
  if (!key) throw new Error(`${provider === "mistral" ? "Mistral" : "Hugging Face"} is not configured`)
  const url = provider === "mistral" ? "https://api.mistral.ai/v1/chat/completions" : "https://router.huggingface.co/v1/chat/completions"
  const model = provider === "mistral" ? "mistral-small-latest" : "Qwen/Qwen2.5-72B-Instruct"
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...messages], temperature: 0.4, max_tokens: 900 }) })
  if (!response.ok) throw new Error(`${provider} request failed`)
  const data = await response.json() as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content || "No response returned."
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { provider?: Provider; messages?: ChatMessage[] }
    if (!body.provider || !["gemini", "mistral", "huggingface"].includes(body.provider) || !Array.isArray(body.messages) || body.messages.length === 0) return Response.json({ error: "Provider and conversation are required." }, { status: 400 })
    const messages = body.messages.filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim()).slice(-20)
    return Response.json({ text: await callProvider(body.provider, messages) })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Provider request failed" }, { status: 500 })
  }
}
