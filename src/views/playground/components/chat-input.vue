<template>
  <div class="chat-input">
    <div class="input-wrapper">
      <a-textarea
        ref="textareaRef"
        v-model="inputText"
        :placeholder="
          disabled ? t('playground.selectModelFirst') : t('playground.inputPlaceholder')
        "
        :disabled="disabled || sending"
        :auto-size="{ minRows: 1, maxRows: 6 }"
        @keydown="handleKeydown"
      />
      <div class="input-actions">
        <a-button
          v-if="streaming"
          type="outline"
          status="danger"
          size="small"
          @click="emit('stop')"
        >
          <template #icon><icon-pause /></template>
          {{ t('playground.stop') }}
        </a-button>
        <a-button v-else type="primary" size="small" :disabled="!canSend" @click="handleSend">
          <template #icon><icon-send /></template>
          {{ t('playground.send') }}
        </a-button>
      </div>
    </div>
    <div v-if="sending && !streaming" class="input-hint">
      <icon-loading class="spin" />
      {{ t('playground.generating') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  disabled: boolean
  streaming: boolean
  sending: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
  stop: []
}>()

const { t } = useI18n()
const inputText = ref('')
const textareaRef = ref()

const canSend = computed(() => inputText.value.trim().length > 0 && !props.disabled)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.disabled || props.sending) return
  emit('send', text)
  inputText.value = ''
}
</script>

<style scoped lang="less">
.chat-input {
  border-top: 1px solid var(--color-border-2);
  padding: 12px 16px;
  background: var(--color-bg-2);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;

  :deep(.arco-textarea-wrapper) {
    flex: 1;
  }
}

.input-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-3);
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
