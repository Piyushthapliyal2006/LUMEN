"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Focus, Paperclip, Mic, Send, X, FileText, Image as ImageIcon } from "lucide-react"

const suggestions = ["test", "test internet speed", "test my speed", "testament", "test my internet speed"]

type Mode = "search" | "deep-research"

const modeTooltips: Record<Mode, {
  title: string
  description: string
  proEnabled: boolean
  proDescription: string
  footer: string
  badge?: string
}> = {
  search: {
    title: "Search",
    description: "Get fast answers to everyday questions",
    proEnabled: true,
    proDescription: "Advanced search with 10x the sources; powered by top models",
    footer: "Unlimited access for subscribers",
  },
  "deep-research": {
    title: "Deep research",
    description: "Create in-depth reports with more sources, charts, and advanced reasoning",
    proEnabled: true,
    proDescription: "In-depth reports with more sources, charts, and advanced reasoning",
    footer: "Extended access for subscribers",
  },
}

type SearchBarProps = {
  onSearch?: (query: string, files: File[]) => Promise<void> | void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [activeMode, setActiveMode] = useState<Mode>("search")
  const [hoveredMode, setHoveredMode] = useState<Mode | null>(null)
  const [tooltipOffset, setTooltipOffset] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const buttonRefs = useRef<{ [key in Mode]?: HTMLButtonElement }>({})

  const handleSubmit = async () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || isSubmitting) return
    setIsSubmitting(true)
    setQuery("")
    setShowSuggestions(false)
    try {
      await onSearch?.(trimmedQuery, files)
      setFiles([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const validFiles = selectedFiles.filter((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      return (isPdf || isImage) && file.size <= 10 * 1024 * 1024
    })
    setFiles((current) => [...current, ...validFiles].slice(0, 5))
    event.target.value = ""
  }

  const handleMouseEnter = (mode: Mode) => {
    setHoveredMode(mode)
    const button = buttonRefs.current[mode]
    if (button) {
      const buttonRect = button.getBoundingClientRect()
      const containerRect = button.closest(".relative")?.getBoundingClientRect()
      if (containerRect) {
        const buttonCenter = buttonRect.left + buttonRect.width / 2 - containerRect.left
        setTooltipOffset(buttonCenter)
      }
    }
  }

  return (
    <div className="relative">
      <div
        className={`animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl border-2 bg-card shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:shadow-[0_4px_30px_rgb(0,0,0,0.06)] ${
          isFocused ? "border-orange-500/50 ring-1 ring-orange-500/20" : "border-orange-500/20 hover:border-orange-500/30"
        }`}
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3 md:px-5">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
                {file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? <FileText className="h-3.5 w-3.5 shrink-0 text-orange-600" /> : <ImageIcon className="h-3.5 w-3.5 shrink-0 text-orange-600" />}
                <span className="max-w-[180px] truncate">{file.name}</span>
                <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}>
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Input */}
        <div className="px-4 md:px-5 py-3 md:py-3.5">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onFocus={() => {
              setIsFocused(true)
              if (query.length > 0) setShowSuggestions(true)
            }}
            onBlur={() => {
              setIsFocused(false)
              setTimeout(() => setShowSuggestions(false), 150)
            }}
            placeholder="Ask anything..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                event.preventDefault()
                void handleSubmit()
              }
            }}
            className="w-full border-0 bg-transparent text-[14px] md:text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between px-2 md:px-2.5 py-2 gap-2">
          <div className="relative flex items-center gap-0.5 rounded-lg bg-accent/30 p-0.5">
            <Button
              ref={(el) => {
                if (el) buttonRefs.current.search = el
              }}
              variant="ghost"
              size="icon"
              onMouseEnter={() => handleMouseEnter("search")}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => setActiveMode("search")}
              className={`h-8 w-8 md:h-9 md:w-9 rounded-md ${
                activeMode === "search"
                  ? "border-2 border-orange-500/60 bg-background text-orange-600 dark:text-orange-400"
                  : "border-2 border-transparent text-muted-foreground"
              }`}
            >
              <Search className="h-4 w-4 md:h-[17px] md:w-[17px]" />
            </Button>
            <Button
              ref={(el) => {
                if (el) buttonRefs.current["deep-research"] = el
              }}
              variant="ghost"
              size="icon"
              onMouseEnter={() => handleMouseEnter("deep-research")}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => setActiveMode("deep-research")}
              className={`h-8 w-8 md:h-9 md:w-9 rounded-md ${
                activeMode === "deep-research"
                  ? "border-2 border-orange-500/60 bg-background text-orange-600 dark:text-orange-400"
                  : "border-2 border-transparent text-muted-foreground"
              }`}
            >
              <Focus className="h-4 w-4 md:h-[17px] md:w-[17px]" />
            </Button>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach images or PDF files"
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground"
            >
              <Paperclip className="h-4 w-4 md:h-[17px] md:w-[17px]" />
            </Button>
            <input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFiles} />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg text-muted-foreground transition-all hover:bg-accent/60 hover:text-foreground"
            >
              <Mic className="h-4 w-4 md:h-[17px] md:w-[17px]" />
            </Button>
            <Button
              size="icon"
              onClick={() => void handleSubmit()}
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-orange-600 text-white transition-all hover:bg-orange-700 active:scale-95 shrink-0"
            >
              <Send className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
              <span className="sr-only">Send search</span>
            </Button>
          </div>
        </div>

        {showSuggestions && query && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 border-t border-border/40">
            {suggestions
              .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
              .map((suggestion, index) => (
                <button
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setQuery(suggestion)
                    setShowSuggestions(false)
                  }}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent/50"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-normal">{suggestion}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {hoveredMode && (
        <div
          className="pointer-events-none absolute top-full mt-2 whitespace-nowrap rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md"
          style={{
            left: `${tooltipOffset}px`,
            transform: "translateX(-50%)",
          }}
        >
          {modeTooltips[hoveredMode].title}
        </div>
      )}
    </div>
  )
}
