"use client"

import { useEffect, useRef, useState } from "react"

const TAU = Math.PI * 2

type Particle = {
  radius: number
  angle: number
  speed: number
  size: number
  alpha: number
  wobble: number
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    radius: 0.18 + Math.random() * 0.82,
    angle: Math.random() * TAU,
    speed: 0.08 + Math.random() * 0.18,
    size: 0.35 + Math.random() * 1.8,
    alpha: 0.18 + Math.random() * 0.72,
    wobble: Math.random() * TAU,
  }))
}

export function OptimizedBlackHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d", { alpha: true })
    if (!context) return

    let animationFrame = 0
    let disposed = false
    let width = 0
    let height = 0
    let pixelRatio = 1
    let lastTime = performance.now()
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const particles = createParticles(180)

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75)
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const draw = (time: number) => {
      if (disposed) return
      const delta = Math.min(50, time - lastTime)
      lastTime = time
      const motionScale = reducedMotion.matches ? 0 : delta * 0.001
      const centerX = width * 0.72
      const centerY = height * 0.5
      const radius = Math.min(width, height) * 0.26

      context.clearRect(0, 0, width, height)
      const glow = context.createRadialGradient(centerX, centerY, radius * 0.35, centerX, centerY, radius * 2.2)
      glow.addColorStop(0, "rgba(244, 113, 34, 0.12)")
      glow.addColorStop(0.45, "rgba(234, 88, 12, 0.055)")
      glow.addColorStop(1, "rgba(0, 0, 0, 0)")
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      context.save()
      context.translate(centerX, centerY)
      context.scale(1, 0.38)
      const ring = context.createRadialGradient(0, 0, radius * 0.62, 0, 0, radius * 1.45)
      ring.addColorStop(0, "rgba(0, 0, 0, 0)")
      ring.addColorStop(0.48, "rgba(251, 146, 60, 0.05)")
      ring.addColorStop(0.68, "rgba(249, 115, 22, 0.42)")
      ring.addColorStop(0.75, "rgba(253, 186, 116, 0.08)")
      ring.addColorStop(1, "rgba(0, 0, 0, 0)")
      context.fillStyle = ring
      context.beginPath()
      context.arc(0, 0, radius * 1.45, 0, TAU)
      context.fill()
      context.restore()

      context.save()
      context.translate(centerX, centerY)
      context.scale(1, 0.38)
      context.globalCompositeOperation = "lighter"
      for (const particle of particles) {
        particle.angle += particle.speed * motionScale
        const distance = radius * (0.72 + particle.radius * 0.78)
        const x = Math.cos(particle.angle) * distance
        const y = Math.sin(particle.angle) * distance
        const shimmer = 0.72 + Math.sin(time * 0.002 + particle.wobble) * 0.28
        context.fillStyle = `rgba(251, 146, 60, ${particle.alpha * shimmer})`
        context.beginPath()
        context.arc(x, y, particle.size, 0, TAU)
        context.fill()
      }
      context.restore()

      const shadow = context.createRadialGradient(centerX, centerY, radius * 0.02, centerX, centerY, radius * 0.72)
      shadow.addColorStop(0, "rgba(0, 0, 0, 1)")
      shadow.addColorStop(0.78, "rgba(0, 0, 0, 0.98)")
      shadow.addColorStop(1, "rgba(0, 0, 0, 0)")
      context.fillStyle = shadow
      context.beginPath()
      context.arc(centerX, centerY, radius * 0.74, 0, TAU)
      context.fill()

      animationFrame = window.requestAnimationFrame(draw)
    }

    const visibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationFrame)
      } else {
        lastTime = performance.now()
        animationFrame = window.requestAnimationFrame(draw)
      }
    }

    resize()
    setIsReady(true)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    document.addEventListener("visibilitychange", visibilityChange)
    animationFrame = window.requestAnimationFrame(draw)

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", visibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700 ${isReady ? "opacity-100" : "opacity-0"}`}
    />
  )
}

export default OptimizedBlackHole
