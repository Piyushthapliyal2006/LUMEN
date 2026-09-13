"use client"
import dynamic from "next/dynamic"
import type { ChatSession } from "./sidebar"
import { SearchBar } from "./search-bar"

const Sidebar = dynamic(() => import("./sidebar").then((module) => module.Sidebar), {
  ssr: false,
  loading: () => <div className="h-full w-12 shrink-0 border-r border-border bg-background" aria-hidden="true" />,
})
import { WidgetCards } from "./widget-cards"
import { useEffect, useState } from "react"
import { Check, Copy, Pencil } from "lucide-react"
import type { ReactNode } from "react"
import { AiComparison, type Provider } from "./ai-comparison"

type MessageAttachment = { name: string; type: string; preview?: string }
type MessageSource = { title: string; url: string; domain: string }
type Message = { role: "user" | "assistant"; content: string; attachments?: MessageAttachment[]; sources?: MessageSource[] }

function formatAssistantText(content: string): ReactNode {
  const cleaned = content
    .replace(/\[\d+(?:†L\d+(?:-L\d+)?)?\]/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")

  return cleaned.split(/(\*\*.*?\*\*|__.*?__)/g).map((part, index) => {
    const isBold = (part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))
    const text = isBold ? part.slice(2, -2) : part.replace(/\*/g, "")
    return isBold ? <strong key={index}>{text}</strong> : text
  })
}

export function Search() {
  const [showWidgets, setShowWidgets] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<ChatSession[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [accountStorageKey, setAccountStorageKey] = useState("")
  const [conversationId, setConversationId] = useState("")
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null)
  const [aiTools, setAiTools] = useState<Provider[]>([])
  const [showSpaces, setShowSpaces] = useState(false)
  const [spaceNames, setSpaceNames] = useState(["My Space"])
  const [spaceDraft, setSpaceDraft] = useState("")
  const [spaceItems, setSpaceItems] = useState<Record<string, string[]>>({ "My Space": [] })

  const addAiTool = (provider: Provider) => {
    setAiTools((current) => current.includes(provider) ? current : [...current, provider])
  }

  useEffect(() => {
    const savedConversationId = window.sessionStorage.getItem("lumen-conversation-id") || crypto.randomUUID()
    window.sessionStorage.setItem("lumen-conversation-id", savedConversationId)
    setConversationId(savedConversationId)
  }, [])

  useEffect(() => {
    const emailCookie = document.cookie.split("; ").find((cookie) => cookie.startsWith("lumen-account-email="))
    const email = emailCookie ? decodeURIComponent(emailCookie.slice("lumen-account-email=".length)) : "guest"
    setAccountStorageKey(`lumen-chat-history-${email.toLowerCase()}`)
  }, [])

  useEffect(() => {
    if (!accountStorageKey) return
    try {
      const savedHistory = window.localStorage.getItem(accountStorageKey)
      if (savedHistory) setHistory(JSON.parse(savedHistory) as ChatSession[])
    } catch {
      window.localStorage.removeItem(accountStorageKey)
    } finally {
      setHistoryLoaded(true)
    }
  }, [accountStorageKey])

  useEffect(() => {
    if (historyLoaded && accountStorageKey) {
      window.localStorage.setItem(accountStorageKey, JSON.stringify(history))
    }
  }, [history, historyLoaded, accountStorageKey])

  const handleLogout = () => {
    if (accountStorageKey) window.localStorage.removeItem(accountStorageKey)
    window.localStorage.removeItem("lumen-chat-history")
    window.sessionStorage.removeItem("lumen-conversation-id")
    setHistory([])
    setMessages([])
    setShowWidgets(false)
    setHistoryLoaded(true)
    setActiveHistoryId(null)
    setConversationId(crypto.randomUUID())
    setChatKey((current) => current + 1)
  }

  const handleNewChat = () => {
    if (messages.length > 0) {
      const firstUserMessage = messages.find((message) => message.role === "user")
      const session: ChatSession = {
        id: activeHistoryId || `${Date.now()}`,
        title: firstUserMessage?.content || "Untitled chat",
        messages: [...messages],
      }
      setHistory((current) => {
        if (!activeHistoryId) return [session, ...current]
        return current.map((item) => item.id === activeHistoryId ? session : item)
      })
    }
    setShowWidgets(false)
    setMessages([])
    setActiveHistoryId(null)
    const nextConversationId = crypto.randomUUID()
    window.sessionStorage.setItem("lumen-conversation-id", nextConversationId)
    setConversationId(nextConversationId)
    setChatKey((current) => current + 1)
  }

  const handleSelectHistory = (session: ChatSession) => {
    setMessages(session.messages)
    setActiveHistoryId(session.id)
    setConversationId(session.id)
    window.sessionStorage.setItem("lumen-conversation-id", session.id)
    setShowWidgets(true)
    setChatKey((current) => current + 1)
  }

  const handleShareHistory = async (session: ChatSession) => {
    await navigator.clipboard.writeText(`Lumen chat: ${session.title}`)
  }

  const handleDeleteHistory = (session: ChatSession) => {
    setHistory((current) => current.filter((item) => item.id !== session.id))
    if (activeHistoryId === session.id) {
      setMessages([])
      setActiveHistoryId(null)
      setShowWidgets(false)
      const nextConversationId = crypto.randomUUID()
      window.sessionStorage.setItem("lumen-conversation-id", nextConversationId)
      setConversationId(nextConversationId)
      setChatKey((current) => current + 1)
    }
  }

  const requestResponse = async (query: string, files: File[] = []) => {
    const formData = new FormData()
    formData.append("prompt", query)
    formData.append("conversationId", conversationId)
    files.forEach((file) => formData.append("files", file))
    const response = await fetch("/api/chat", {
      method: "POST",
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Unable to fetch a response")
    return {
      text: typeof data?.text === "string" ? data.text : "",
      sources: Array.isArray(data?.sources) ? data.sources as MessageSource[] : [],
    }
  }

  const handleSearch = async (query: string, files: File[] = []) => {
    setShowWidgets(true)
    const attachments = files.map((file) => ({
      name: file.name,
      type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*"),
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))
    setMessages((current) => [
      ...current,
      { role: "user", content: query, attachments },
      { role: "assistant", content: "" },
    ])
    try {
      const responseData = await requestResponse(query, files)

      setMessages((current) => {
        const next = [...current]
        next[next.length - 1] = { ...next[next.length - 1], content: responseData.text, sources: responseData.sources }
        return next
      })
    } catch {
      setMessages((current) => {
        const next = [...current]
        next[next.length - 1] = { role: "assistant", content: "I couldn't process that request. Please try again." }
        return next
      })
    }
  }

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessage(index)
    window.setTimeout(() => setCopiedMessage(null), 1500)
  }

  const handleEditSubmit = async (index: number) => {
    const nextText = editText.trim()
    if (!nextText) return
    setEditingMessage(null)
    setMessages((current) => [
      ...current.slice(0, index),
      { ...current[index], content: nextText },
      { role: "assistant", content: "" },
    ])
    try {
      const responseData = await requestResponse(nextText)
      setMessages((current) => {
        const next = [...current]
        next[index + 1] = { role: "assistant", content: responseData.text, sources: responseData.sources }
        return next
      })
    } catch {
      setMessages((current) => {
        const next = [...current]
        next[index + 1] = { role: "assistant", content: "I couldn't process that request. Please try again." }
        return next
      })
    }
  }

  const hasConversation = messages.length > 0

  return (
    <>
      <Sidebar
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        onAddAiTool={addAiTool}
        onOpenSpaces={() => setShowSpaces(true)}
        historyItems={history}
        onSelectHistory={handleSelectHistory}
        onShareHistory={handleShareHistory}
        onDeleteHistory={handleDeleteHistory}
      />

      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        {showSpaces ? (
          <section className="flex-1 overflow-y-auto px-8 py-10">
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div><h1 className="text-2xl font-semibold">Spaces</h1><p className="mt-1 text-sm text-muted-foreground">Organize your conversations into focused collections.</p></div>
                <button type="button" onClick={() => setShowSpaces(false)} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">Back to search</button>
              </div>
              <form onSubmit={(event) => { event.preventDefault(); const name = spaceDraft.trim(); if (!name) return; setSpaceNames((current) => [...current, name]); setSpaceItems((current) => ({ ...current, [name]: [] })); setSpaceDraft("") }} className="mb-6 flex max-w-sm gap-2"><input value={spaceDraft} onChange={(event) => setSpaceDraft(event.target.value)} placeholder="Name a new space" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none" /><button type="submit" className="rounded-md bg-foreground px-3 py-2 text-sm text-background">Create</button></form>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{spaceNames.map((name) => <article key={name} className="min-h-40 rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><h2 className="font-medium">{name}</h2><button type="button" aria-label={`Delete ${name}`} onClick={() => { setSpaceNames((current) => current.filter((item) => item !== name)); setSpaceItems((current) => { const next = { ...current }; delete next[name]; return next }) }} className="text-xs text-muted-foreground hover:text-destructive">Delete</button></div><div className="mt-5 space-y-1">{(spaceItems[name] ?? []).map((item) => <div key={item} className="truncate rounded bg-muted px-2 py-1 text-xs">{item}</div>)}</div><button type="button" onClick={() => { const next = history.find((item) => !spaceItems[name]?.includes(item.title)); if (next) setSpaceItems((current) => ({ ...current, [name]: [...(current[name] ?? []), next.title] })) }} className="mt-6 w-full rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-accent">Add history</button></article>)}</div>
            </div>
          </section>
        ) : (
        <div className="flex h-screen flex-col">
          {hasConversation ? (
            <section className="flex-1 overflow-y-auto px-4 pb-4 pt-6" aria-live="polite">
              <div className="mx-auto w-full max-w-3xl space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={message.role === "user"
                      ? "group ml-auto flex max-w-[85%] flex-col items-end gap-2 text-sm text-foreground"
                      : "max-w-[90%] px-0 py-2 text-sm leading-6 text-foreground whitespace-pre-wrap"}
                  >
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {message.attachments.map((attachment) => (
                          attachment.preview ? (
                            <img
                              key={attachment.name}
                              src={attachment.preview}
                              alt={attachment.name}
                              className="max-h-40 max-w-[220px] rounded-lg object-contain"
                            />
                          ) : (
                            <div key={attachment.name} className="flex w-[280px] max-w-full items-center gap-3 rounded-2xl border border-border/70 bg-muted/70 px-3 py-2.5 text-left shadow-sm">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                                <span className="text-[9px] font-bold text-red-500">PDF</span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-foreground">{attachment.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">PDF</p>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                    {message.role === "user" && editingMessage === index ? (
                      <div className="flex w-full max-w-md flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                          className="min-h-20 w-full rounded-2xl border border-orange-500/50 bg-muted px-4 py-2.5 text-sm text-foreground outline-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingMessage(null)} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">Cancel</button>
                          <button onClick={() => void handleEditSubmit(index)} className="rounded-md bg-orange-600 px-2.5 py-1 text-xs text-white hover:bg-orange-700">Send</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={message.role === "user" ? "w-fit rounded-2xl bg-muted px-4 py-2.5" : ""}>
                          {message.content ? (message.role === "assistant" ? formatAssistantText(message.content) : message.content) : <span className="inline-flex gap-1" aria-label="Lumen is responding"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500 [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500 [animation-delay:300ms]" /></span>}
                        </div>
                        {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.sources.map((source) => (
                              <a
                                key={source.url}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex max-w-[220px] items-center gap-2 rounded-xl border border-border/70 bg-muted/60 px-3 py-2 text-left transition-colors hover:bg-accent"
                              >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background text-[10px] font-bold text-orange-600">↗</span>
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-medium text-foreground">{source.title}</span>
                                  <span className="block truncate text-[10px] text-muted-foreground">{source.domain}</span>
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                        {message.role === "user" && message.content && (
                          <div className="pointer-events-none flex items-center gap-1 self-end pr-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                            <button onClick={() => void handleCopy(message.content, index)} title="Copy prompt" aria-label="Copy prompt" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                              {copiedMessage === index ? <Check className="h-3.5 w-3.5 text-orange-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => { setEditingMessage(index); setEditText(message.content) }} title="Edit prompt" aria-label="Edit prompt" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 md:px-6">
              <div className="w-full max-w-4xl space-y-8 md:space-y-12">
                <header className="flex items-center justify-center text-center">
                  <h1
                    className="leading-[0.72] tracking-[-0.06em] text-foreground text-[2.7rem] sm:text-[3.6rem] md:text-[5.1rem] lg:text-[6rem]"
                    style={{
                      fontFamily: '"Canela-LightItalic", "Canela", "Cormorant Garamond", "Times New Roman", serif',
                      fontStyle: "italic",
                      fontWeight: 300,
                    }}
                  >
                    Let&apos;s Figure Out
                  </h1>
                </header>

                <div className="mx-auto w-full max-w-3xl pt-2">
                  <SearchBar key={chatKey} onSearch={handleSearch} />
                </div>

                {showWidgets && <WidgetCards />}
              </div>
            </div>
          )}

          {aiTools.length > 0 && (
            <AiComparison providers={aiTools} messages={messages} />
          )}

          {hasConversation && (
            <div className="sticky bottom-0 border-t border-border/40 bg-background/85 px-4 pb-10 pt-3 backdrop-blur-sm">
              <div className="mx-auto w-full max-w-3xl">
                <SearchBar key={chatKey} onSearch={handleSearch} />
              </div>
            </div>
          )}
        </div>
        )}
      </main>
    </>
  )
}
