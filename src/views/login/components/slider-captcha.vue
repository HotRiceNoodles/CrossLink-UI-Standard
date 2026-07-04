<template>
  <div class="slider-captcha">
    <div
      class="sc-stage"
      :class="{ 'sc-stage--error': !!errorTip }"
      :style="{ width: bgWidthPx, height: bgHeightPx }"
    >
      <img v-if="bgSrc" class="sc-bg" :src="bgSrc" alt="captcha" draggable="false" />
      <img
        v-if="puzzleSrc"
        ref="pieceRef"
        class="sc-piece"
        :src="puzzleSrc"
        :style="{ top: gapYPx, left: pieceX + 'px', width: pieceWidthPx }"
        draggable="false"
        @load="onPieceLoad"
      />

      <a-spin v-if="!bgSrc" class="sc-loading" />
      <div v-if="errorTip" class="sc-error-tip">{{ errorTip }}</div>

      <button
        type="button"
        class="sc-refresh"
        :title="t('login.captchaRefresh')"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <icon-refresh />
      </button>
    </div>

    <div
      ref="trackRef"
      class="sc-track"
      :class="{ 'sc-track--loading': loading, 'sc-track--done': done }"
      :style="{ width: bgWidthPx }"
    >
      <span class="sc-track-tip">{{ trackTip }}</span>
      <div
        class="sc-handle"
        :class="{ 'sc-handle--dragging': dragging, 'sc-handle--disabled': loading || !challenge }"
        :style="{ width: handleWidthPx, left: pieceX + 'px' }"
        @pointerdown="onPointerDown"
      >
        <icon-drag-dot-vertical v-if="!done" />
        <icon-check v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconRefresh, IconDragDotVertical, IconCheck } from '@arco-design/web-vue/es/icon'
import type { CaptchaChallenge, CaptchaPoint } from '@/types'

const props = defineProps<{
  challenge: CaptchaChallenge | null
  loading?: boolean
  errorTip?: string
}>()

const emit = defineEmits<{
  verified: [payload: { final_x: number; points: CaptchaPoint[] }]
  refresh: []
}>()

const { t } = useI18n()

const trackRef = ref<HTMLDivElement>()
const pieceRef = ref<HTMLImageElement>()

const pieceWidth = ref(44) // piece_size default; refined from puzzle_image naturalWidth
const pieceX = ref(0)
const dragging = ref(false)
const done = ref(false)

const bgSrc = computed(() =>
  props.challenge ? `data:image/png;base64,${props.challenge.bg_image}` : '',
)
const puzzleSrc = computed(() =>
  props.challenge ? `data:image/png;base64,${props.challenge.puzzle_image}` : '',
)

const bgWidthPx = computed(() => `${props.challenge?.bg_width ?? 300}px`)
const bgHeightPx = computed(() => `${props.challenge?.bg_height ?? 150}px`)
const gapYPx = computed(() => `${props.challenge?.gap_y ?? 0}px`)
const pieceWidthPx = computed(() => `${pieceWidth.value}px`)
const handleWidthPx = computed(() => `${pieceWidth.value}px`)

// Handle (and the piece) can travel from 0 .. maxTravel so the piece never
// overruns the right edge of the background. pieceX === handle offset ===
// final_x, in background-image pixels (1:1, no scaling).
const maxTravel = computed(() => (props.challenge?.bg_width ?? 300) - pieceWidth.value)

const trackTip = computed(() => {
  if (dragging.value) return ''
  if (done.value) return t('login.captchaSuccess')
  return t('login.captchaTip')
})

function onPieceLoad(e: Event) {
  const img = e.target as HTMLImageElement
  if (img.naturalWidth > 0) pieceWidth.value = img.naturalWidth
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

let startTs = 0
let points: CaptchaPoint[] = []
let grabOffsetX = 0
let activePointerId: number | null = null

function onPointerDown(e: PointerEvent) {
  if (props.loading || !props.challenge || !trackRef.value) return
  e.preventDefault()

  const trackRect = trackRef.value.getBoundingClientRect()
  const handleEl = e.currentTarget as HTMLElement
  const handleRect = handleEl.getBoundingClientRect()
  grabOffsetX = e.clientX - handleRect.left

  startTs = performance.now()
  points = [{ x: 0, y: 0, t: 0 }]
  dragging.value = true
  done.value = false
  activePointerId = e.pointerId
  handleEl.setPointerCapture(e.pointerId)

  const startX = clamp(e.clientX - trackRect.left - grabOffsetX, 0, maxTravel.value)
  pieceX.value = startX
  points[0].x = startX

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId || !trackRef.value) return
    const rect = trackRef.value.getBoundingClientRect()
    const x = clamp(ev.clientX - rect.left - grabOffsetX, 0, maxTravel.value)
    const y = ev.clientY - rect.top
    pieceX.value = x
    points.push({ x, y, t: Math.round(performance.now() - startTs) })
  }

  const onUp = (ev: PointerEvent) => {
    if (ev.pointerId !== activePointerId) return
    handleEl.removeEventListener('pointermove', onMove)
    handleEl.removeEventListener('pointerup', onUp)
    handleEl.removeEventListener('pointercancel', onUp)
    try {
      handleEl.releasePointerCapture(ev.pointerId)
    } catch {
      /* noop */
    }
    activePointerId = null
    dragging.value = false

    if (points.length >= 2) {
      done.value = true
      emit('verified', { final_x: Math.round(pieceX.value), points })
    }
  }

  handleEl.addEventListener('pointermove', onMove)
  handleEl.addEventListener('pointerup', onUp)
  handleEl.addEventListener('pointercancel', onUp)
}

// Reset internal state whenever a new challenge is issued.
watch(
  () => props.challenge?.captcha_id,
  () => {
    pieceX.value = 0
    dragging.value = false
    done.value = false
    points = []
  },
)
</script>

<style scoped lang="less">
.slider-captcha {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  user-select: none;
}

.sc-stage {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-fill-2);
  border: 1px solid var(--color-border-2);
  transition: border-color 0.2s;

  &--error {
    border-color: rgb(var(--danger-6));
  }
}

.sc-bg {
  display: block;
  width: 100%;
  height: 100%;
}

.sc-piece {
  position: absolute;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
  pointer-events: none;
}

.sc-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sc-error-tip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 8px;
  font-size: 12px;
  text-align: center;
  color: #fff;
  background: rgba(var(--danger-6), 0.85);
}

.sc-refresh {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-2);
  background: rgba(var(--gray-1), 0.7);
  backdrop-filter: blur(2px);
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: rgba(var(--gray-1), 0.95);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.sc-track {
  position: relative;
  height: 40px;
  border-radius: 20px;
  background: var(--color-fill-3);
  border: 1px solid var(--color-border-2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &--loading {
    opacity: 0.6;
  }
}

.sc-track-tip {
  font-size: 13px;
  color: var(--color-text-3);
  pointer-events: none;
}

.sc-handle {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  background: rgb(var(--primary-6));
  border-radius: 20px;
  cursor: grab;
  touch-action: none;
  transition: background 0.15s;

  &--dragging {
    cursor: grabbing;
    background: rgb(var(--primary-5));
  }
  &--disabled {
    cursor: not-allowed;
  }
}
</style>
