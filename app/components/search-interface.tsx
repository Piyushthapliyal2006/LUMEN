"use client"
import { Sidebar } from "./sidebar"
import { SearchBar } from "./search-bar"
import { WidgetCards } from "./widget-cards"
import { useState } from "react"

type Message = { role: "user" | "assistant"; content: string }

export function Search() {
  const [showWidgets, setShowWidgets] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])

  const handleNewChat = () => {
    setShowWidgets(false)
    setMessages([])
    setChatKey((current) => current + 1)
  }

  const handleSearch = async (query: string) => {
    setShowWidgets(true)
    setMessages((current) => [...current, { role: "user", content: query }])
    setMessages((current) => [...current, { role: "assistant", content: "" }])
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      })
      if (!response.ok || !response.body) throw new Error("Unable to fetch a response")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((current) => {
          const next = [...current]
          next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + chunk }
          return next
        })
      }
    } catch {
      setMessages((current) => {
        const next = [...current]
        next[next.length - 1] = { role: "assistant", content: "I couldn&apos;t reach Gemini right now. Please try again." }
        return next
      })
    }
  }

  return (
    <>
      <Sidebar onNewChat={handleNewChat} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 md:px-6 pt-16 md:pt-0">
          <div className="w-full max-w-3xl space-y-6 md:space-y-8">
            <header className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-lg font-bold text-white">L</span>
                <span className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Lumen</span>
              </div>
            </header>

            {messages.length > 0 && (
              <section className="space-y-4" aria-live="polite">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-teal-600 px-4 py-3 text-sm text-white" : "max-w-[90%] rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground"}>
                    {message.content || "Lumen is thinking..."}
                  </div>
                ))}
              </section>
            )}

            <SearchBar key={chatKey} onSearch={handleSearch} />

            {messages.length === 0 && showWidgets && <WidgetCards />}
          </div>
        </div>
      </main>
    </>
  )
}
