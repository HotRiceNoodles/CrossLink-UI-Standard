<template>
  <a-modal
    :visible="visible"
    :title="t('auth.users.resetPasswordTitle')"
    :mask-closable="false"
    :ok-loading="loading"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div style="margin-bottom: 12px">
      <span style="color: var(--color-text-2)">
        {{ user?.display_name || user?.username }}
      </span>
    </div>
    <a-form :model="form" layout="vertical">
      <a-form-item :label="t('auth.users.resetPasswordPlaceholder')">
        <a-input-password
          v-model="form.new_password"
          :placeholder="t('auth.users.passwordPlaceholder')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import type { UserRow } from '@/composables/use-team-users'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  user: UserRow | null
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
  confirm: [newPassword: string]
}>()

const loading = ref(false)
const form = reactive({ new_password: '' })

// Reset form when modal opens
watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.new_password = ''
    }
  },
)

function handleConfirm() {
  if (!form.new_password || form.new_password.length < 8) {
    Message.warning(t('auth.users.passwordMinLength'))
    return
  }
  emit('confirm', form.new_password)
}

function handleCancel() {
  emit('update:visible', false)
}
</script>
