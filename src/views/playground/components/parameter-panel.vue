<template>
  <div class="parameter-panel" :class="{ collapsed }">
    <div class="panel-toggle" @click="emit('update:collapsed', !collapsed)">
      <icon-settings class="toggle-icon" />
      <span v-if="!collapsed" class="toggle-text">{{ t('playground.parameters') }}</span>
      <icon-right v-if="collapsed" class="toggle-arrow" />
      <icon-left v-else class="toggle-arrow" />
    </div>

    <template v-if="!collapsed">
      <div class="panel-content">
        <!-- Model selector (shared) -->
        <div class="param-section">
          <div class="param-label">{{ t('playground.model') }}</div>
          <a-select
            :model-value="selectedModel"
            :placeholder="t('playground.selectModel')"
            :disabled="streaming"
            allow-search
            @change="(v: string) => emit('update:selectedModel', v)"
          >
            <a-option
              v-for="m in modelList"
              :key="m.id"
              :value="m.model_name"
              :label="m.model_name"
            />
          </a-select>
        </div>

        <!-- ===== Chat-specific params ===== -->
        <template v-if="mode === 'chat'">
          <!-- System Prompt -->
          <div class="param-section">
            <div class="param-label" @click="systemPromptExpanded = !systemPromptExpanded">
              {{ t('playground.systemPrompt') }}
              <icon-down v-if="!systemPromptExpanded" class="expand-icon" />
              <icon-up v-else class="expand-icon" />
            </div>
            <a-textarea
              v-if="systemPromptExpanded"
              :model-value="chatParams.systemPrompt"
              :placeholder="t('playground.systemPromptPlaceholder')"
              :auto-size="{ minRows: 3, maxRows: 8 }"
              @input="(v: string) => updateParam('systemPrompt', v)"
            />
            <div v-else-if="chatParams.systemPrompt" class="param-summary">
              {{
                chatParams.systemPrompt.slice(0, 60) +
                (chatParams.systemPrompt.length > 60 ? '...' : '')
              }}
            </div>
          </div>

          <!-- Temperature -->
          <div class="param-section">
            <div class="param-label-row">
              <span class="param-label">{{ t('playground.temperature') }}</span>
              <a-input-number
                :model-value="chatParams.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                :precision="1"
                size="mini"
                style="width: 72px"
                @change="(v: number) => updateParam('temperature', v)"
              />
            </div>
            <a-slider
              :model-value="chatParams.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              @change="(v: number) => updateParam('temperature', v)"
            />
          </div>

          <!-- Top P -->
          <div class="param-section">
            <div class="param-label-row">
              <span class="param-label">{{ t('playground.topP') }}</span>
              <a-input-number
                :model-value="chatParams.topP"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                size="mini"
                style="width: 72px"
                @change="(v: number) => updateParam('topP', v)"
              />
            </div>
            <a-slider
              :model-value="chatParams.topP"
              :min="0"
              :max="1"
              :step="0.05"
              @change="(v: number) => updateParam('topP', v)"
            />
          </div>

          <!-- Max Tokens -->
          <div class="param-section">
            <div class="param-label-row">
              <span class="param-label">{{ t('playground.maxTokens') }}</span>
              <a-input-number
                :model-value="chatParams.maxTokens"
                :min="1"
                :max="128000"
                :step="1"
                size="mini"
                style="width: 100px"
                @change="(v: number) => updateParam('maxTokens', v)"
              />
            </div>
          </div>

          <!-- Streaming toggle -->
          <div class="param-section">
            <div class="param-label-row">
              <span class="param-label">{{ t('playground.streaming') }}</span>
              <a-switch
                :model-value="useStreaming"
                @change="(v: boolean) => emit('update:useStreaming', v)"
              />
            </div>
          </div>
        </template>

        <!-- ===== Image-specific params ===== -->
        <template v-if="mode === 'image'">
          <!-- Size -->
          <div class="param-section">
            <div class="param-label">{{ t('playground.imageSize') }}</div>
            <a-select
              :model-value="imageParams.size"
              :placeholder="'1024x1024'"
              allow-clear
              @change="(v: string) => emit('imageParamChange', 'size', v || '')"
            >
              <a-option value="1024x1024" label="1024 × 1024" />
              <a-option value="1792x1024" label="1792 × 1024" />
              <a-option value="1024x1792" label="1024 × 1792" />
              <a-option value="512x512" label="512 × 512" />
            </a-select>
          </div>

          <!-- Quality -->
          <div class="param-section">
            <div class="param-label">{{ t('playground.imageQuality') }}</div>
            <a-select
              :model-value="imageParams.quality"
              :placeholder="t('playground.imageQualityPlaceholder')"
              allow-clear
              @change="(v: string) => emit('imageParamChange', 'quality', v || '')"
            >
              <a-option value="standard" :label="t('playground.qualityStandard')" />
              <a-option value="hd" :label="t('playground.qualityHd')" />
            </a-select>
          </div>

          <!-- Number of images -->
          <div class="param-section">
            <div class="param-label-row">
              <span class="param-label">{{ t('playground.imageCount') }}</span>
              <a-input-number
                :model-value="imageParams.n"
                :min="1"
                :max="4"
                :step="1"
                size="mini"
                style="width: 72px"
                @change="(v: number) => emit('imageParamChange', 'n', v)"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- Clear button -->
      <div class="panel-footer">
        <a-button long @click="emit('clear')">
          <template #icon><icon-delete /></template>
          {{ mode === 'chat' ? t('playground.clearChat') : t('playground.clearImages') }}
        </a-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProviderModel } from '@/types'

interface ChatParams {
  systemPrompt: string
  temperature: number
  topP: number
  maxTokens: number
}

interface ImageParams {
  size: string
  quality: string
  n: number
}

defineProps<{
  mode: 'chat' | 'image'
  modelList: ProviderModel[]
  selectedModel: string
  chatParams: ChatParams
  imageParams: ImageParams
  useStreaming: boolean
  collapsed: boolean
  streaming: boolean
}>()

const emit = defineEmits<{
  'update:selectedModel': [value: string]
  'update:useStreaming': [value: boolean]
  'update:collapsed': [value: boolean]
  clear: []
  paramChange: [key: string, value: unknown]
  imageParamChange: [key: string, value: unknown]
}>()

const { t } = useI18n()
const systemPromptExpanded = ref(false)

function updateParam(key: string, value: unknown) {
  emit('paramChange', key, value)
}
</script>

<style scoped lang="less">
.parameter-panel {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.34, 0.69, 0.1, 1);
  overflow: hidden;

  &.collapsed {
    width: 48px;
  }
}

.panel-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border-1);
  cursor: pointer;
  user-select: none;
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 600;

  &:hover {
    color: var(--color-text-1);
    background: var(--color-fill-1);
  }
}

.toggle-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.toggle-text {
  flex: 1;
}

.toggle-arrow {
  font-size: 12px;
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.param-section {
  margin-bottom: 16px;
}

.param-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-3);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.param-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;

  .param-label {
    margin-bottom: 0;
  }
}

.expand-icon {
  font-size: 12px;
  cursor: pointer;
}

.param-summary {
  font-size: 12px;
  color: var(--color-text-3);
  font-style: italic;
  line-height: 1.4;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-1);
}
</style>
