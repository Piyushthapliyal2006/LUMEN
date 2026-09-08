"use client"

import { useState } from "react"
import { Search, X, GripVertical, Loader2 } from "lucide-react"

type Provider = "gemini" | "mistral" | "huggingface"
type Message = { role: "user" | "assistant"; content: string }
const labels: Record<Provider, string> = { gemini: "Gemini", mistral: "Mistral", huggingface: "Hugging Face" }
const accents: Record<Provider, string> = { gemini: "#4285f4", mistral: "#f97316", huggingface: "#facc15" }

export function AiComparison({ providers, messages }: { providers: Provider[]; messages: Message[] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [removed, setRemoved] = useState<Provider[]>([])
  const visible = providers.filter((provider) => !removed.includes(provider))
  if (!visible.length) return null

  const submit = async (provider: Provider, value: string) => {
    const query = value.trim()
    if (!query) return
    const context = [...messages, { role: "user" as const, content: query }]
    setLoading((current) => ({ ...current, [provider]: true }))
    setAnswers((current) => ({ ...current, [provider]: "" }))
    try {
      const response = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, messages: context }) })
      const data = await response.json()
      setAnswers((current) => ({ ...current, [provider]: response.ok ? data.text : data.error }))
    } catch { setAnswers((current) => ({ ...current, [provider]: "Unable to reach this provider." })) } finally { setLoading((current) => ({ ...current, [provider]: false })) }
  }

  const resize = (provider: Provider, event: React.PointerEvent) => {
    const startX = event.clientX
    const initial = widths[provider] || 100 / visible.length
    const move = (moveEvent: PointerEvent) => setWidths((current) => ({ ...current, [provider]: Math.min(70, Math.max(20, initial + ((moveEvent.clientX - startX) / window.innerWidth) * 100)) }))
    const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop) }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop)
  }

  return <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 md:flex-row md:overflow-hidden" aria-label="AI comparison workspace">
    {visible.map((provider) => <div key={provider} className="flex min-h-[280px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm" style={{ flexBasis: `${widths[provider] || 100 / visible.length}%` }}>
      <header className="flex items-center justify-between border-b border-border/70 px-3 py-2" style={{ borderTop: `2px solid ${accents[provider]}` }}><span className="text-sm font-semibold">{labels[provider]}</span><button onClick={() => setRemoved((current) => [...current, provider])} aria-label={`Remove ${labels[provider]}`} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button></header>
      <div className="flex-1 overflow-y-auto p-4 text-sm leading-6 whitespace-pre-wrap">{answers[provider] || <span className="text-muted-foreground">Ask {labels[provider]} the same question to compare its answer.</span>}{loading[provider] && <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-muted-foreground" />}</div>
      <form onSubmit={(event) => { event.preventDefault(); void submit(provider, drafts[provider] || "") }} className="border-t border-border/70 p-2"><div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2"><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input value={drafts[provider] || ""} onChange={(event) => setDrafts((current) => ({ ...current, [provider]: event.target.value }))} placeholder={`Ask ${labels[provider]}...`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label={`Ask ${labels[provider]}`} /></div></form>
      {provider !== visible[visible.length - 1] && <button onPointerDown={(event) => resize(provider, event)} aria-label={`Resize ${labels[provider]} panel`} className="group absolute hidden md:block"><GripVertical className="h-4 w-4 text-muted-foreground/50" /></button>}
    </div>)}
  </section>
}

export type { Provider }
