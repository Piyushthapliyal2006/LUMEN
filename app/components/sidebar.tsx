"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Compass,
  Grid3x3,
  TrendingUp,
  MoreHorizontal,
  Bell,
  Plus,
  Pin,
  Target,
  Star,
  LayoutGrid,
  FolderClosed,
  BarChart3,
  Search,
  Users,
  Bitcoin,
  MoreVertical,
  Calendar,
  Mail,
  Share2,
  Trash2,
  Menu,
  X,
  Sparkles,
  Bot,
  MessageCircle,
  BrainCircuit,
  Moon,
  Sun,
  UserCircle,
  PanelLeft,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { AccountMenu } from "./account-menu"

export type ChatMessage = { role: "user" | "assistant"; content: string }

export type ChatSession = {
  id: string
  title: string
  messages: ChatMessage[]
}

type SidebarProps = {
  onNewChat?: () => void
  onLogout?: () => void
  historyItems?: ChatSession[]
  onSelectHistory?: (session: ChatSession) => void
  onShareHistory?: (session: ChatSession) => void
  onDeleteHistory?: (session: ChatSession) => void
  onAddAiTool?: (tool: "gemini" | "mistral" | "huggingface") => void
}

export function Sidebar({ onNewChat, onLogout, historyItems = [], onSelectHistory, onShareHistory, onDeleteHistory, onAddAiTool }: SidebarProps) {
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [pinnedPanel, setPinnedPanel] = useState<string | null>(null)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [logoSrc, setLogoSrc] = useState("/firelogo.png")
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [email, setEmail] = useState("")
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [accountName, setAccountName] = useState("Account")
  const [accountPicture, setAccountPicture] = useState("")

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const source = new window.Image()
    source.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = source.naturalWidth
      canvas.height = source.naturalHeight
      const context = canvas.getContext("2d")
      if (!context) return

      context.drawImage(source, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      for (let index = 0; index < imageData.data.length; index += 4) {
        const red = imageData.data[index]
        const green = imageData.data[index + 1]
        const blue = imageData.data[index + 2]
        const colorRange = Math.max(red, green, blue) - Math.min(red, green, blue)
        if (colorRange < 12) imageData.data[index + 3] = 0
      }
      context.putImageData(imageData, 0, 0)
      setLogoSrc(canvas.toDataURL("image/png"))
    }
    source.src = "/firelogo.png"
  }, [])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("lumen-theme")
    const nextTheme = savedTheme === "dark" ? "dark" : "light"
    setTheme(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")

    const savedAccount = window.localStorage.getItem("lumen-account-created")
    const authCompleted = new URLSearchParams(window.location.search).get("auth") === "success"
    const readCookie = (name: string) => {
      const value = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))
      if (!value) return ""
      let decoded = value.slice(name.length + 1)
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const next = decodeURIComponent(decoded)
          if (next === decoded) break
          decoded = next
        } catch {
          break
        }
      }
      return decoded
    }
    const savedName = readCookie("lumen-account-name")
    const savedPicture = readCookie("lumen-account-picture")
    if (savedName) setAccountName(savedName)
    if (savedPicture) setAccountPicture(savedPicture)
    if (authCompleted) {
      window.localStorage.setItem("lumen-account-created", "true")
      window.history.replaceState({}, "", window.location.pathname)
    }
    setIsSignedIn(savedAccount === "true" || authCompleted)
    setShowAuthPrompt(savedAccount !== "true" && !authCompleted)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem("lumen-theme", theme)
  }, [theme])

  const handlePanelChange = (panel: string) => {
    setOpenPanel(panel)
  }

  const handleNewChat = () => {
    onNewChat?.()
    setPinnedPanel(null)
    setOpenPanel(null)
  }

  const handleAccountAccess = () => {
    window.localStorage.setItem("lumen-account-created", "true")
    setIsSignedIn(true)
    setShowAuthPrompt(false)
  }

  const handleLogout = () => {
    window.localStorage.removeItem("lumen-account-created")
    document.cookie = "lumen-account-name=; Max-Age=0; path=/"
    document.cookie = "lumen-account-picture=; Max-Age=0; path=/"
    document.cookie = "lumen-account-email=; Max-Age=0; path=/"
    setIsSignedIn(false)
    setAccountName("Account")
    setAccountPicture("")
    setShowAccountMenu(false)
    setShowAuthPrompt(true)
    onLogout?.()
  }

  const handlePinToggle = (panel: string) => {
    if (pinnedPanel === panel) {
      setPinnedPanel(null)
      setOpenPanel(null)
    } else {
      setPinnedPanel(panel)
      setOpenPanel(panel)
    }
  }

  const sidebarContent = (
    <div
      className="relative flex w-12 shrink-0 border-r border-border bg-background py-3 transition-colors duration-200 ease-in-out z-50 h-full"
      onMouseLeave={() => {
        if (!pinnedPanel) {
          setOpenPanel(null)
        }
      }}
    >
      <div className="flex flex-col h-full w-12 shrink-0 items-center">
        {/* Logo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarExpanded((expanded) => !expanded)}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          className={`mb-5 h-9 shrink-0 overflow-visible rounded-md border-0 p-0 shadow-none transition-all hover:bg-accent hover:shadow-none ${hasMounted && sidebarExpanded ? "w-9 bg-accent" : "w-9 bg-transparent"}`}
          aria-label={hasMounted && sidebarExpanded ? "Collapse navigation" : "Expand navigation"}
          title={hasMounted && sidebarExpanded ? "Collapse navigation" : "Expand navigation"}
        >
          {hasMounted && (logoHovered || sidebarExpanded) ? (
            <PanelLeft className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Image
              src={logoSrc}
              alt="Lumen flame logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={handleNewChat}
          aria-label="Open a new chat"
          className="mb-8 h-10 w-10 shrink-0 rounded-full bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-5 w-5 shrink-0" />
        </Button>

        <nav className="flex flex-1 flex-col gap-1">
          <div className="relative mb-2">
            <Button
              variant="ghost"
              onClick={() => handlePanelChange("history")}
              onMouseEnter={() => handlePanelChange("history")}
              className={`h-10 w-10 shrink-0 mx-auto transition-colors ${
                openPanel === "history"
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Clock className="h-5 w-5" />
            </Button>
            <span className="sr-only">History</span>
          </div>

          <div className="relative mb-2">
            <Button
              variant="ghost"
              onMouseEnter={() => handlePanelChange("plugins")}
              className={`h-10 w-10 shrink-0 mx-auto transition-colors ${
                openPanel === "plugins"
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </Button>
            <span className="sr-only">Plugins</span>
          </div>

          <div className="relative mb-2">
            <Button
              variant="ghost"
              onMouseEnter={() => handlePanelChange("spaces")}
              className={`h-10 w-10 shrink-0 mx-auto transition-colors ${
                openPanel === "spaces"
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Grid3x3 className="h-5 w-5" />
            </Button>
            <span className="sr-only">Spaces</span>
          </div>

          <div className="relative mb-2">
            <Button
              variant="ghost"
              onMouseEnter={() => handlePanelChange("more")}
              className={`h-10 w-10 shrink-0 mx-auto transition-colors ${
                openPanel === "more"
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
            <span className="sr-only">More</span>
          </div>

          <div className="relative mb-2">
            <Button
              variant="ghost"
              onMouseEnter={() => handlePanelChange("notifications")}
              className={`h-10 w-10 shrink-0 transition-colors ${
                openPanel === "notifications"
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Bell className="h-5 w-5 shrink-0" />
            </Button>
          </div>
        </nav>

        <div className="flex flex-col gap-1 pt-4 items-center">
          <div className="relative mb-1">
            <Button
              variant="ghost"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <span className="sr-only">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </div>

          <Button
            variant="ghost"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent p-0"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-visible ring-2 ring-primary/60 bg-muted">
              {accountPicture ? (
                <img src={accountPicture} alt="Google profile" className="h-9 w-9 rounded-full object-cover" />
              ) : isSignedIn ? (
                <span className="text-sm font-semibold text-muted-foreground">{accountName.charAt(0).toUpperCase()}</span>
              ) : (
                <UserCircle className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
              )}
              {isSignedIn && (
                <span className="absolute -bottom-1 -right-1 text-[7px] font-bold bg-primary text-primary-foreground px-1 py-0.5 rounded">
                  pro
                </span>
              )}
            </div>
          </Button>
          <span className="sr-only">Account</span>

        </div>
      </div>

      {hasMounted && sidebarExpanded && (
        <div className="absolute inset-y-0 left-0 z-[60] flex w-[254px] flex-col border-r border-border bg-background px-2 py-3 shadow-2xl">
          <div className="flex items-center justify-between px-2 pb-4">
            <button
              type="button"
              onClick={() => setSidebarExpanded(false)}
              aria-label="Collapse navigation"
              className="flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold hover:bg-accent"
            >
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
              Lumen
            </button>
            <span className="text-xs text-muted-foreground">Navigation</span>
          </div>
          <div className="space-y-1">
            <button type="button" onClick={handleNewChat} className="flex w-full items-center gap-3 rounded-lg bg-muted px-3 py-2 text-left text-sm hover:bg-accent">
              <Plus className="h-4 w-4" /> New chat
            </button>
            {[
              { label: "History", icon: Clock, panel: "history" },
              { label: "Plugins", icon: Sparkles, panel: "plugins" },
              { label: "Spaces", icon: LayoutGrid, panel: "spaces" },
              { label: "More", icon: MoreHorizontal, panel: "more" },
            ].map(({ label, icon: Icon, panel }) => (
              <button
                key={panel}
                type="button"
                onClick={() => { setSidebarExpanded(false); handlePanelChange(panel) }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <div className="mt-6 border-t border-border px-3 pt-4 text-xs font-medium text-muted-foreground">Recent</div>
          <ScrollArea className="mt-2 flex-1 px-1">
            <div className="space-y-1">
              {historyItems.slice(0, 12).map((item) => (
                <button key={item.id} type="button" onClick={() => { onSelectHistory?.(item); setSidebarExpanded(false) }} className="block w-full truncate rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
                  {item.title}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {openPanel && hasMounted && !sidebarExpanded && (
        <div key={openPanel} className="absolute left-full top-0 z-50 h-full w-[190px] border-r border-border bg-background shadow-xl">
          {openPanel === "history" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold">History</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 transition-colors ${pinnedPanel === "history" ? "text-primary" : ""}`}
                  onClick={() => handlePinToggle("history")}
                >
                  <Pin
                    className={`h-3.5 w-3.5 transition-transform ${pinnedPanel === "history" ? "rotate-45" : ""}`}
                  />
                </Button>
              </div>
              <div className="px-3 py-1.5">
                <h3 className="text-[11px] font-medium text-muted-foreground">Recent</h3>
              </div>
              <ScrollArea className="flex-1 px-1.5">
                <div className="space-y-0 pb-2">
                  {historyItems.length === 0 && (
                    <p className="px-2 py-4 text-xs text-muted-foreground">No saved chats yet.</p>
                  )}
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex w-full items-center rounded transition-all duration-200 hover:bg-accent"
                    >
                      <button
                        onClick={() => onSelectHistory?.(item)}
                        className="min-w-0 flex-1 px-2 py-1.5 pr-14 text-left text-[13px] leading-tight text-foreground"
                      >
                        <span className="block truncate pr-1">{item.title}</span>
                      </button>
                      <div className="invisible absolute right-1 z-10 flex items-center gap-0.5 rounded bg-accent px-0.5 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                        <button
                          onClick={() => onShareHistory?.(item)}
                          aria-label={`Share ${item.title}`}
                          title="Share chat"
                          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteHistory?.(item)}
                          aria-label={`Delete ${item.title}`}
                          title="Delete chat"
                          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="px-3 py-2">
                <button className="text-xs text-primary hover:underline">View All</button>
              </div>
            </div>
          )}

          {openPanel === "plugins" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold">Plugins</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 transition-colors ${pinnedPanel === "plugins" ? "text-primary" : ""}`}
                  onClick={() => handlePinToggle("plugins")}
                >
                  <Pin
                    className={`h-3.5 w-3.5 transition-transform ${pinnedPanel === "plugins" ? "rotate-45" : ""}`}
                  />
                </Button>
              </div>
              <div className="p-1.5">
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Target className="h-4 w-4 shrink-0" />
                  <span className="font-normal">For You</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Star className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Top</span>
                </button>
              </div>
              <div className="px-3 pb-2 pt-1">
                <h3 className="px-1 text-[11px] font-medium text-muted-foreground">AI tools</h3>
              </div>
              <div className="space-y-0.5 px-1.5">
                {[
                  { name: "Gemini", icon: Sparkles },
                  { name: "ChatGPT", icon: MessageCircle },
                  { name: "Hugging Face", icon: Bot },
                  { name: "Mistral", icon: BrainCircuit },
                ].map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-accent"
  aria-label={`${name} plugin`}
  onClick={() => name !== "ChatGPT" && onAddAiTool?.(name === "Gemini" ? "gemini" : name === "Mistral" ? "mistral" : "huggingface")}
  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-normal">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {openPanel === "spaces" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold">Spaces</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 transition-colors ${pinnedPanel === "spaces" ? "text-primary" : ""}`}
                  onClick={() => handlePinToggle("spaces")}
                >
                  <Pin
                    className={`h-3.5 w-3.5 transition-transform ${pinnedPanel === "spaces" ? "rotate-45" : ""}`}
                  />
                </Button>
              </div>
              <div className="p-1.5">
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Templates</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Create new Space</span>
                </button>
              </div>
              <div className="px-1.5 pb-1.5">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <h3 className="text-[11px] font-medium text-muted-foreground">Private</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <FolderClosed className="h-4 w-4 shrink-0" />
                  <span className="font-normal">My Space</span>
                </button>
              </div>
            </div>
          )}

          {openPanel === "finance" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold">Finance</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 transition-colors ${pinnedPanel === "finance" ? "text-primary" : ""}`}
                  onClick={() => handlePinToggle("finance")}
                >
                  <Pin
                    className={`h-3.5 w-3.5 transition-transform ${pinnedPanel === "finance" ? "rotate-45" : ""}`}
                  />
                </Button>
              </div>
              <div className="p-1.5">
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <span className="text-base shrink-0">🇺🇸</span>
                  <span className="font-normal">US Markets</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Bitcoin className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Crypto</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Earnings</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Predictions</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Screener</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Politicians</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Star className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Watchlist</span>
                </button>
              </div>
              <div className="px-3 py-1.5">
                <h3 className="text-[11px] font-medium text-muted-foreground">Get started</h3>
              </div>
              <div className="p-1.5">
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Stock analysis</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Stock comparison</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Crypto price</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Currency conversion</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Market news</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Explainer</span>
                </button>
              </div>
            </div>
          )}

          {openPanel === "more" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="p-1.5 pt-3">
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <Grid3x3 className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Spaces</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  <span className="font-normal">Finance</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <span className="text-base shrink-0">✈️</span>
                  <span className="font-normal">Travel</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <span className="text-base shrink-0">📚</span>
                  <span className="font-normal">Academic</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <span className="text-base shrink-0">🏆</span>
                  <span className="font-normal">Sports</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] hover:bg-accent rounded transition-colors">
                  <span className="text-base shrink-0">🎯</span>
                  <span className="font-normal">Patents</span>
                </button>
              </div>
              <div className="mt-auto px-1.5 pb-3 pt-2">
                <button className="w-full flex items-center justify-between px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors group">
                  <span className="font-normal">Customize Sidebar</span>
                  <span className="text-base transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </div>
          )}

          {openPanel === "notifications" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-2.5">
                <h2 className="text-sm font-semibold">Notifications</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-muted/50 mb-4">
                  <Mail className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">Your notifications will appear here</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {sidebarContent}
      <AccountMenu
        isOpen={showAccountMenu}
        onClose={() => setShowAccountMenu(false)}
        accountName={accountName}
        accountPicture={accountPicture}
        onLogout={handleLogout}
      />
      {showAuthPrompt && (
        <div className="fixed bottom-5 right-5 z-[60] w-[320px] rounded-xl border border-border bg-card p-5 text-card-foreground shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAuthPrompt(false)}
            aria-label="Close sign in prompt"
            className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mb-5 text-center">
            <Image
              src={logoSrc}
              alt="Lumen flame logo"
              width={48}
              height={48}
              className="mx-auto mb-3 h-12 w-12 object-contain"
            />
            <h2 className="text-base font-semibold">Log in or sign up for free</h2>
            <p className="mt-1 text-sm text-muted-foreground">Save and sync your searches</p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => { window.location.href = "/api/auth/google" }} className="w-full bg-foreground text-background hover:bg-foreground/90">
              Continue with Google
            </Button>
            <Button onClick={handleAccountAccess} variant="secondary" className="w-full">
              Continue with Apple
            </Button>
            <div className="my-4 border-t border-border" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              aria-label="Email address"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <Button
              onClick={handleAccountAccess}
              disabled={!email.trim()}
              variant="secondary"
              className="w-full"
            >
              Continue with email
            </Button>
            <button onClick={handleAccountAccess} className="w-full pt-3 text-xs text-primary hover:underline">
              Single sign-on (SSO)
            </button>
          </div>
        </div>
      )}
    </>
  )
}
