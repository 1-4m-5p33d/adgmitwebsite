import { useEffect, useRef } from 'react'

const SWIFT_KEYWORDS = [
  'enum', 'self', 'let', 'await', 'extension', 'View',
  'import', 'switch', 'var', 'return', 'some', 'SwiftUI',
  'func', 'async', 'case', '[]', 'if', 'true', 'false',
  'nil', 'in', 'protocol', 'struct', 'class', 'guard',
  'throws', 'try', 'defer', 'where', 'mutating', 'static',
  '@State', 'init', 'override', '->', '{', '}', 'for',
  'open', 'final', 'lazy', 'weak', 'unowned', 'typealias',
  'associatedtype', 'convenience', 'required', 'indirect',
  'fileprivate', 'internal', 'public', 'private', 'any',
  'actor', 'isolated', 'nonisolated', 'consuming',
]

const SwiftBackground = () => {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    // Grid-based spread ensures even distribution without clumping
    const gridSpread = (count, w, h, jitter = 0.8) => {
      const cols = Math.ceil(Math.sqrt(count * (w / h)))
      const rows = Math.ceil(count / cols)
      const cellW = w / cols
      const cellH = h / rows
      const points = []
      for (let r = 0; r < rows && points.length < count; r++) {
        for (let c = 0; c < cols && points.length < count; c++) {
          points.push({
            x: cellW * c + cellW * (0.5 - jitter / 2 + Math.random() * jitter),
            y: cellH * r + cellH * (0.5 - jitter / 2 + Math.random() * jitter),
          })
        }
      }
      return points
    }

    // Dynamic viewport-capped counts (keeps CPU usage ultra-low)
    const NODE_COUNT = Math.min(60, Math.max(30, Math.floor((width * height) / 32000)))
    const WORD_COUNT = Math.min(32, Math.max(16, Math.floor((width * height) / 60000)))

    // --- Constellation nodes (dots + lines) ---
    const nodePositions = gridSpread(NODE_COUNT, width, height)
    const nodes = nodePositions.map((pos) => ({
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r: 1.5 + Math.random() * 1.5,
    }))

    // --- Floating keywords ---
    const wordPositions = gridSpread(WORD_COUNT, width, height)
    const words = wordPositions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      label: SWIFT_KEYWORDS[i % SWIFT_KEYWORDS.length],
      bold: Math.random() < 0.15,
      opacity: 0.2 + Math.random() * 0.25,
    }))

    const CONNECT_DIST = 140
    const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      // Re-clamp positions to within new viewport
      for (const node of nodes) {
        if (node.x > width) node.x = width * Math.random()
        if (node.y > height) node.y = height * Math.random()
      }
      for (const word of words) {
        if (word.x > width) word.x = width * Math.random()
        if (word.y > height) word.y = height * Math.random()
      }
    }

    window.addEventListener('resize', handleResize)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const dark = document.documentElement.classList.contains('dark')

      // 1. Update nodes positions & bounce off viewport bounds
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      // 2. Lines between nearby nodes (using squared distance to avoid Math.sqrt)
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j]
          const dx = n1.x - n2.x
          const dy = n1.y - n2.y
          const distSq = dx * dx + dy * dy

          if (distSq < CONNECT_DIST_SQ) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / CONNECT_DIST) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = dark
              ? `rgba(255,255,255,${alpha * 0.35})`
              : `rgba(45,45,45,${alpha * 1.9})`
            ctx.lineWidth = 0.8
            ctx.moveTo(n1.x, n1.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.stroke()
          }
        }
      }

      // 3. Batch draw all dots in a single path
      ctx.beginPath()
      ctx.fillStyle = dark
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(45, 45, 45, 0.5)'
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        ctx.moveTo(node.x + node.r, node.y)
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      }
      ctx.fill()

      // 4. Update and draw floating words
      // Set font once per style to prevent expensive font cache thrashing
      const fontNormal = "400 13px 'SF Mono', 'Fira Code', monospace"
      const fontBold = "600 13px 'SF Mono', 'Fira Code', monospace"

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        word.x += word.vx
        word.y += word.vy
        if (word.x < -80 || word.x > width + 80) word.vx *= -1
        if (word.y < 0 || word.y > height) word.vy *= -1

        ctx.font = word.bold ? fontBold : fontNormal
        ctx.fillStyle = dark
          ? `rgba(255,255,255,${word.opacity * 0.25})`
          : `rgba(30,30,30,${word.opacity * 0.85})`
        ctx.fillText(word.label, word.x, word.y)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    // Pause when tab is in background to save 100% CPU/battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animRef.current) cancelAnimationFrame(animRef.current)
      } else {
        animRef.current = requestAnimationFrame(draw)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    animRef.current = requestAnimationFrame(draw)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

export default SwiftBackground
