import { streamText } from "ai"

export async function POST(request: Request) {
  const body = await request.json()
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""

  if (!prompt) {
    return Response.json({ error: "A prompt is required." }, { status: 400 })
  }

  const result = streamText({
    model: "google/gemini-2.5-flash",
    system: "You are Lumen, a helpful and concise research assistant. Answer clearly and accurately. If you are unsure, say so.",
    prompt,
  })

  return result.toTextStreamResponse()
}
