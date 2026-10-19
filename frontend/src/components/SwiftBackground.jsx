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

    // Canvas covers the FULL document height — scrolls with the page
    const setSize = () => {
      canvas.width = document.documentElement.scrollWidth
      canvas.height = document.documentElement.scrollHeight
    }
    setSize()

    // Re-measure when page layout shifts (lazy images, dynamic sections, etc.)
    const ro = new ResizeObserver(setSize)
    ro.observe(document.body)

    const W = canvas.width
    const H = canvas.height

    // Grid-based spread — no clumping, covers the whole document evenly
    const gridSpread = (count, w, h, jitter = 0.82) => {
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

    // Scale keyword count to full page height — kept sparse to avoid clutter
    const repeatCount = Math.ceil((H / 900) * SWIFT_KEYWORDS.length * 0.4)
    const allKeywords = Array.from(
      { length: repeatCount },
      (_, i) => SWIFT_KEYWORDS[i % SWIFT_KEYWORDS.length]
    )

    // --- Floating words (no dots, no lines) ---
    const wordPositions = gridSpread(allKeywords.length, W, H)
    const words = allKeywords.map((label, i) => ({
      x: wordPositions[i].x,
      y: wordPositions[i].y,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      label,
      bold: Math.random() < 0.15,
      opacity: 0.18 + Math.random() * 0.28,
      fontSize: 11 + Math.random() * 5,
    }))

    // --- Constellation nodes (dots + lines, no labels) ---
    // ~1 node per 8000px² → dense enough to form proper constellations
    const NODE_COUNT = Math.max(150, Math.floor((W * H) / 8000))
    const nodePositions = gridSpread(NODE_COUNT, W, H)
    const nodes = nodePositions.map((pos) => ({
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 0.32,
      vy: (Math.random() - 0.5) * 0.32,
      r: 1.5 + Math.random() * 2,
      opacity: 0.25 + Math.random() * 0.3,
    }))

    const CONNECT_DIST = 150

    const draw = () => {
      
      ctx.clearRect(0, 0, W, H)
      const dark = document.documentElement.classList.contains("dark");
      // Move nodes, bounce off full document bounds
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      // Lines between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = dark
              ? `rgba(255,255,255,${alpha * 0.35})`
              : `rgba(45,45,45,${alpha * 1.9})`;
            ctx.lineWidth = 0.8
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Dots
      for (const node of nodes) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fillStyle = dark
          ? `rgba(255,255,255,${node.opacity * 0.35})`
          : `rgba(45,45,45,${node.opacity * 1.4})`;
        ctx.fill()
      }

      // Move words, bounce off full document bounds
      for (const word of words) {
        word.x += word.vx
        word.y += word.vy
        if (word.x < -80 || word.x > W + 80) word.vx *= -1
        if (word.y < 0 || word.y > H) word.vy *= -1

        ctx.font = `${word.bold ? '600' : '400'} ${word.fontSize}px 'SF Mono', 'Fira Code', monospace`
        ctx.fillStyle = dark
          ? `rgba(255,255,255,${word.opacity * 0.22})`
          : `rgba(30,30,30,${word.opacity * 0.8})`;
        ctx.fillText(word.label, word.x, word.y)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
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
