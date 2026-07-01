<template>
  <a-modal
    :visible="visible"
    :title="t('profile.changePassword')"
    :mask-closable="false"
    :ok-loading="loading"
    unmount-on-close
    @cancel="handleClose"
    @before-ok="handleSubmit"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <a-form-item field="old_password" :label="t('profile.oldPassword')">
        <a-input-password
          v-model="formData.old_password"
          :placeholder="t('profile.oldPasswordPlaceholder')"
        />
      </a-form-item>

      <a-form-item field="new_password" :label="t('profile.newPassword')">
        <a-input-password
          v-model="formData.new_password"
          :placeholder="t('profile.newPasswordPlaceholder')"
        />
      </a-form-item>

      <a-form-item field="confirm_password" :label="t('profile.confirmPassword')">
        <a-input-password
          v-model="formData.confirm_password"
          :placeholder="t('profile.confirmPasswordPlaceholder')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { systemApi } from '@/api/system'
import { useLoading } from '@/hooks/loading'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { t } = useI18n()

const formRef = ref()
const { loading, setLoading } = useLoading()

const formData = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const rules = computed(() => ({
  old_password: [{ required: true, message: t('profile.oldPasswordRequired') }],
  new_password: [
    { required: true, message: t('profile.newPasswordRequired') },
    { minLength: 8, message: t('profile.passwordMinLength') },
  ],
  confirm_password: [
    { required: true, message: t('profile.confirmPasswordRequired') },
    {
      validator: (value: string, cb: (msg?: string) => void) => {
        if (value !== formData.new_password) {
          cb(t('profile.passwordMismatch'))
        }
      },
    },
  ],
}))

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit(done: (closed: boolean) => void) {
  const err = await formRef.value?.validate()
  if (err) {
    done(false)
    return
  }

  setLoading(true)
  try {
    await systemApi.changePassword({
      old_password: formData.old_password,
      new_password: formData.new_password,
    })
    Message.success(t('profile.passwordChangedSuccess'))
    formData.old_password = ''
    formData.new_password = ''
    formData.confirm_password = ''
    done(true)
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || t('profile.passwordChangeFail'))
    done(false)
  } finally {
    setLoading(false)
  }
}
</script>
