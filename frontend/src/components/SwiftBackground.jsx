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

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight
    let lastArea = width * height
    let lastAspect = width / (height || 1)
    let resizeTimer = null

    const updateCanvasSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    updateCanvasSize()

    // Grid-based spread ensures even distribution across the viewport without clumping
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

    let nodes = []
    let words = []

    const initializeElements = (w, h) => {
      const nodeCount = Math.min(120, Math.max(55, Math.floor((w * h) / 18000)))
      const wordCount = Math.min(45, Math.max(20, Math.floor((w * h) / 45000)))

      const nodePositions = gridSpread(nodeCount, w, h)
      nodes = nodePositions.map((pos) => ({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: 1.5 + Math.random() * 1.5,
      }))

      const wordPositions = gridSpread(wordCount, w, h)
      words = wordPositions.map((pos, i) => ({
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        label: SWIFT_KEYWORDS[i % SWIFT_KEYWORDS.length],
        bold: Math.random() < 0.15,
        opacity: 0.2 + Math.random() * 0.25,
      }))

      lastArea = w * h
      lastAspect = w / (h || 1)
    }

    initializeElements(width, height)

    const CONNECT_DIST = 150
    const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST

    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      const newDpr = Math.min(window.devicePixelRatio || 1, 2)
      if (newWidth === width && newHeight === height && newDpr === dpr) return

      const prevWidth = width
      const prevHeight = height

      updateCanvasSize()

      // Proportional scaling immediately during resize:
      // Prevents bunching, clipping, or voids without causing stutter during window drag
      if (prevWidth > 0 && prevHeight > 0) {
        const scaleX = width / prevWidth
        const scaleY = height / prevHeight
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].x *= scaleX
          nodes[i].y *= scaleY
        }
        for (let i = 0; i < words.length; i++) {
          words[i].x *= scaleX
          words[i].y *= scaleY
        }
      }

      // Detect major resizes: orientation change, window maximize/tile, or >20% change in area/aspect
      const currentArea = width * height
      const currentAspect = width / (height || 1)
      const isMajorResize =
        Math.abs(currentArea / (lastArea || 1) - 1) > 0.2 ||
        Math.abs(currentAspect - lastAspect) > 0.25

      clearTimeout(resizeTimer)
      if (isMajorResize) {
        // Debounce grid regeneration to cleanly redistribute and resize counts after resizing completes
        resizeTimer = setTimeout(() => {
          initializeElements(width, height)
        }, 120)
      }
    }

    window.addEventListener('resize', handleResize)

    const fontNormal = "400 13px 'SF Mono', 'Fira Code', monospace"
    const fontBold = "600 13px 'SF Mono', 'Fira Code', monospace"

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      const dark = document.documentElement.classList.contains('dark')

      // 1. Move nodes & bounce off viewport edges
      const nodeLen = nodes.length
      for (let i = 0; i < nodeLen; i++) {
        const node = nodes[i]
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      // 2. Lines between nearby nodes
      // Pre-set lineWidth once to prevent context state thrashing
      ctx.lineWidth = 0.8
      for (let i = 0; i < nodeLen; i++) {
        const n1 = nodes[i]
        const x1 = n1.x
        const y1 = n1.y
        for (let j = i + 1; j < nodeLen; j++) {
          const n2 = nodes[j]
          const dx = x1 - n2.x
          const dy = y1 - n2.y
          const distSq = dx * dx + dy * dy

          if (distSq < CONNECT_DIST_SQ) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / CONNECT_DIST) * 0.18
            ctx.beginPath()
            ctx.strokeStyle = dark
              ? `rgba(255,255,255,${alpha * 0.35})`
              : `rgba(45,45,45,${alpha * 1.9})`
            ctx.moveTo(x1, y1)
            ctx.lineTo(n2.x, n2.y)
            ctx.stroke()
          }
        }
      }

      // 3. Batch draw all node dots in a single fill call
      ctx.beginPath()
      ctx.fillStyle = dark
        ? 'rgba(255, 255, 255, 0.4)'
        : 'rgba(45, 45, 45, 0.5)'
      for (let i = 0; i < nodeLen; i++) {
        const node = nodes[i]
        ctx.moveTo(node.x + node.r, node.y)
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      }
      ctx.fill()

      // 4. Update words & draw in two passes (normal and bold) to avoid font re-parsing overhead
      const wordLen = words.length
      for (let i = 0; i < wordLen; i++) {
        const word = words[i]
        word.x += word.vx
        word.y += word.vy
        if (word.x < -80 || word.x > width + 80) word.vx *= -1
        if (word.y < 0 || word.y > height) word.vy *= -1
      }

      // Pass A: Regular words
      ctx.font = fontNormal
      for (let i = 0; i < wordLen; i++) {
        const word = words[i]
        if (!word.bold) {
          ctx.fillStyle = dark
            ? `rgba(255,255,255,${word.opacity * 0.25})`
            : `rgba(30,30,30,${word.opacity * 0.85})`
          ctx.fillText(word.label, word.x, word.y)
        }
      }

      // Pass B: Bold words
      ctx.font = fontBold
      for (let i = 0; i < wordLen; i++) {
        const word = words[i]
        if (word.bold) {
          ctx.fillStyle = dark
            ? `rgba(255,255,255,${word.opacity * 0.25})`
            : `rgba(30,30,30,${word.opacity * 0.85})`
          ctx.fillText(word.label, word.x, word.y)
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    // Pause when tab is hidden to save 100% CPU/battery
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
      clearTimeout(resizeTimer)
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
