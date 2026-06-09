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
        <!-- Model selector -->
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

        <!-- System Prompt -->
        <div class="param-section">
          <div class="param-label" @click="systemPromptExpanded = !systemPromptExpanded">
            {{ t('playground.systemPrompt') }}
            <icon-down v-if="!systemPromptExpanded" class="expand-icon" />
            <icon-up v-else class="expand-icon" />
          </div>
          <a-textarea
            v-if="systemPromptExpanded"
            :model-value="params.systemPrompt"
            :placeholder="t('playground.systemPromptPlaceholder')"
            :auto-size="{ minRows: 3, maxRows: 8 }"
            @input="(v: string) => updateParam('systemPrompt', v)"
          />
          <div v-else-if="params.systemPrompt" class="param-summary">
            {{ params.systemPrompt.slice(0, 60) }}{{ params.systemPrompt.length > 60 ? '...' : '' }}
          </div>
        </div>

        <!-- Temperature -->
        <div class="param-section">
          <div class="param-label-row">
            <span class="param-label">{{ t('playground.temperature') }}</span>
            <a-input-number
              :model-value="params.temperature"
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
            :model-value="params.temperature"
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
              :model-value="params.topP"
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
            :model-value="params.topP"
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
              :model-value="params.maxTokens"
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
      </div>

      <!-- Clear button -->
      <div class="panel-footer">
        <a-button long @click="emit('clear')">
          <template #icon><icon-delete /></template>
          {{ t('playground.clearChat') }}
        </a-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProviderModel } from '@/types'

interface Params {
  systemPrompt: string
  temperature: number
  topP: number
  maxTokens: number
}

defineProps<{
  modelList: ProviderModel[]
  selectedModel: string
  params: Params
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
