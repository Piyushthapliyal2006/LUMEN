"use client"
import { OptimizedBlackHole } from "./components/optimized-black-hole"
import { Search } from "./components/search-interface"

export default function Home() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#030303]">
      <OptimizedBlackHole />
      <div className="relative z-10 flex h-full w-full">
        <Search />
      </div>
    </div>
  )
}
