"use client"
import { Sidebar } from "./sidebar"
import { SearchBar } from "./search-bar"
import { WidgetCards } from "./widget-cards"
import { useState } from "react"

export function Search() {
  const [showWidgets, setShowWidgets] = useState(false)
  const [chatKey, setChatKey] = useState(0)

  const handleNewChat = () => {
    setShowWidgets(false)
    setChatKey((current) => current + 1)
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

            <SearchBar key={chatKey} onSearch={() => setShowWidgets(true)} />


            {showWidgets && <WidgetCards />}
          </div>
        </div>
      </main>
    </>
  )
}
