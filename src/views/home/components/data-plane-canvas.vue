<template>
  <canvas ref="canvasRef" class="data-plane-canvas" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface Node {
  x: number
  y: number
  r: number
}

interface Edge {
  from: number
  to: number
  // phase in [0, 1) — position of the travelling light along the curve
  phase: number
  speed: number
}

const NODE_COUNT = 10

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let width = 0
let height = 0
let dpr = 1

const nodes: Node[] = []
const edges: Edge[] = []

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function buildGraph() {
  nodes.length = 0
  edges.length = 0
  if (!width || !height) return

  // Distribute nodes around the viewport edge band, keep center clear.
  const margin = Math.min(width, height) * 0.08
  const cx = width / 2
  const cy = height / 2
  const rx = width / 2 - margin
  const ry = height / 2 - margin

  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2 + (i % 2 === 0 ? 0.15 : -0.15)
    // Push nodes to an elliptical band, slightly varied radius
    const rad = 0.7 + (i % 3) * 0.12
    nodes.push({
      x: cx + Math.cos(angle) * rx * rad,
      y: cy + Math.sin(angle) * ry * rad,
      r: 2 + (i % 3),
    })
  }

  // Connect each node to 2 nearby partners → connected mesh, not a hairball
  for (let i = 0; i < NODE_COUNT; i++) {
    const candidates = Array.from({ length: NODE_COUNT }, (_, j) => j)
      .filter((j) => j !== i)
      .map((j) => ({ j, d: dist(nodes[i], nodes[j]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    candidates.forEach(({ j }) => {
      if (!edges.some((e) => (e.from === i && e.to === j) || (e.from === j && e.to === i))) {
        edges.push({
          from: i,
          to: j,
          phase: Math.random(),
          speed: 0.002 + Math.random() * 0.004,
        })
      }
    })
  }
}

function dist(a: Node, b: Node): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  dpr = window.devicePixelRatio || 1
  width = rect.width
  height = rect.height
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  buildGraph()
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)

  // Edges
  for (const e of edges) {
    const a = nodes[e.from]
    const b = nodes[e.to]
    if (!a || !b) continue
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    // Canvas does not resolve CSS vars → use a concrete low-contrast gray.
    ctx.strokeStyle = 'rgba(201, 205, 212, 0.6)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Travelling light
    const t = e.phase
    const px = a.x + (b.x - a.x) * t
    const py = a.y + (b.y - a.y) * t
    ctx.beginPath()
    ctx.arc(px, py, 1.6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(22, 93, 255, 0.55)'
    ctx.fill()
  }

  // Nodes
  for (const n of nodes) {
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
    grad.addColorStop(0, 'rgba(22, 93, 255, 0.35)')
    grad.addColorStop(1, 'rgba(22, 93, 255, 0)')
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(22, 93, 255, 0.7)'
    ctx.fill()
  }
}

function tick() {
  if (!reducedMotion) {
    for (const e of edges) {
      e.phase += e.speed
      if (e.phase > 1) e.phase -= 1
    }
  }
  draw()
  rafId = reducedMotion ? 0 : requestAnimationFrame(tick)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resize()
  if (reducedMotion) {
    draw() // single static frame
  } else {
    rafId = requestAnimationFrame(tick)
  }
  resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(canvas)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.data-plane-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
