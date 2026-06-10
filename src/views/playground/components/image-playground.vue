<template>
  <div class="image-playground">
    <!-- Prompt input -->
    <div class="prompt-area">
      <a-textarea
        v-model="prompt"
        :placeholder="t('playground.imagePromptPlaceholder')"
        :auto-size="{ minRows: 2, maxRows: 5 }"
        :disabled="generating"
        @keydown="handleKeydown"
      />
      <a-button
        type="primary"
        :disabled="!prompt.trim() || !selectedModel || generating"
        :loading="generating"
        @click="handleGenerate"
      >
        <template #icon><icon-image /></template>
        {{ t('playground.generate') }}
      </a-button>
    </div>

    <!-- Generating hint -->
    <div v-if="generating" class="generating-hint">
      <icon-loading class="spin" />
      {{ t('playground.generatingImage') }}
    </div>

    <!-- Error -->
    <div v-if="errorMessage" class="error-message">
      <icon-exclamation-circle style="font-size: 14px" />
      {{ errorMessage }}
    </div>

    <!-- Image gallery -->
    <div v-if="batches.length > 0" class="image-gallery">
      <div v-for="batch in batches" :key="batch.id" class="batch-section">
        <div class="batch-header">
          <span class="batch-prompt">{{ batch.prompt }}</span>
          <span class="batch-meta">
            <span v-if="batch.provider" class="meta-tag">{{ batch.provider }}</span>
            <span v-if="batch.cost" class="meta-tag">
              {{ t('playground.imageCost', { cost: batch.cost.toFixed(4) }) }}
            </span>
          </span>
        </div>
        <div class="batch-images">
          <a-image-preview-group infinite>
            <div class="image-grid">
              <div v-for="(img, idx) in batch.images" :key="idx" class="image-card">
                <a-image
                  :src="getImageSrc(img)"
                  fit="contain"
                  class="generated-image"
                  :preview-props="{
                    actionsLayout: [
                      'rotateLeft',
                      'rotateRight',
                      'zoomIn',
                      'zoomOut',
                      'originalSize',
                    ],
                  }"
                />
                <div class="image-actions">
                  <a-button size="mini" type="text" @click="downloadImage(img, idx)">
                    <template #icon><icon-download /></template>
                  </a-button>
                </div>
              </div>
            </div>
          </a-image-preview-group>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="batches.length === 0 && !generating" class="empty-state">
      <icon-image style="font-size: 32px; color: var(--color-text-4)" />
      <div class="empty-title">{{ t('playground.noImages') }}</div>
      <div class="empty-desc">{{ t('playground.noImagesDesc') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { playgroundApi } from '@/api/playground'
import type { PlaygroundImageData, PlaygroundImageRequest, ImageGenerationBatch } from '@/types'

const props = defineProps<{
  selectedModel: string
  imageParams: {
    size: string
    quality: string
    n: number
  }
}>()

const { t } = useI18n()

const prompt = ref('')
const generating = ref(false)
const errorMessage = ref('')
const batches = ref<ImageGenerationBatch[]>([])
let batchCounter = 0

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleGenerate()
  }
}

async function handleGenerate() {
  const text = prompt.value.trim()
  if (!text || !props.selectedModel || generating.value) return

  errorMessage.value = ''
  generating.value = true

  const request: PlaygroundImageRequest = {
    model: props.selectedModel,
    prompt: text,
    n: props.imageParams.n,
    size: props.imageParams.size || undefined,
    quality: props.imageParams.quality || undefined,
  }

  try {
    const res = await playgroundApi.imageGenerate(request)
    const data = res.data
    batchCounter++
    batches.value.unshift({
      id: batchCounter,
      prompt: text,
      images: data.images || [],
      model: data.model,
      provider: data.provider,
      cost: data.cost,
    })
    prompt.value = ''
  } catch {
    errorMessage.value = t('playground.imageError')
  } finally {
    generating.value = false
  }
}

function getImageSrc(img: PlaygroundImageData): string {
  if (img.b64_json) {
    return `data:image/png;base64,${img.b64_json}`
  }
  return img.url || ''
}

async function downloadImage(img: PlaygroundImageData, idx: number) {
  const src = getImageSrc(img)
  if (!src) return
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-${idx + 1}.png`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    // fallback: open in new tab
    window.open(src, '_blank')
  }
}
</script>

<style scoped lang="less">
.image-playground {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.prompt-area {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-2);
  flex-shrink: 0;

  :deep(.arco-textarea-wrapper) {
    flex: 1;
  }
}

.generating-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 13px;
  color: var(--color-text-3);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin: 8px 0;
  background: rgb(var(--red-1));
  color: rgb(var(--red-6));
  border-radius: 6px;
  font-size: 13px;
}

.image-gallery {
  flex: 1;
  overflow-y: auto;
  padding-top: 16px;
}

.batch-section {
  position: relative;
  margin-bottom: 20px;

  & + .batch-section {
    padding-top: 16px;
    border-top: 1px solid var(--color-border-1);
  }
}

.batch-header {
  position: relative;
  z-index: 0;
  margin-bottom: 12px;
  overflow: hidden;
}

.batch-images {
  position: relative;
  z-index: 1;
}

.batch-prompt {
  font-size: 13px;
  color: var(--color-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.batch-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.meta-tag {
  font-size: 11px;
  color: var(--color-text-4);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.image-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-2);
  aspect-ratio: 1;
  background: var(--color-fill-2);

  &:hover .image-actions {
    opacity: 1;
  }
}

.generated-image {
  width: 100%;
  height: 100%;

  :deep(img) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
}

.image-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-2);
  margin-top: 12px;
}

.empty-desc {
  font-size: 13px;
  margin-top: 4px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
