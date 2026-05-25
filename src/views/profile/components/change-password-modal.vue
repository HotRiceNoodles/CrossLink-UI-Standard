<template>
  <a-modal
    :visible="visible"
    title="修改密码"
    :mask-closable="false"
    @cancel="handleClose"
    @before-ok="handleSubmit"
    :ok-loading="loading"
    unmount-on-close
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
    >
      <a-form-item field="old_password" label="旧密码">
        <a-input-password
          v-model="formData.old_password"
          placeholder="请输入旧密码"
        />
      </a-form-item>

      <a-form-item field="new_password" label="新密码">
        <a-input-password
          v-model="formData.new_password"
          placeholder="至少 8 个字符"
        />
      </a-form-item>

      <a-form-item field="confirm_password" label="确认新密码">
        <a-input-password
          v-model="formData.confirm_password"
          placeholder="再次输入新密码"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { systemApi } from '@/api/system'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const rules = {
  old_password: [{ required: true, message: '请输入旧密码' }],
  new_password: [
    { required: true, message: '请输入新密码' },
    { minLength: 8, message: '密码至少 8 个字符' },
  ],
  confirm_password: [
    { required: true, message: '请确认新密码' },
    {
      validator: (value: string, cb: (msg?: string) => void) => {
        if (value !== formData.new_password) {
          cb('两次输入的密码不一致')
        }
      },
    },
  ],
}

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit(done: (closed: boolean) => void) {
  const err = await formRef.value?.validate()
  if (err) {
    done(false)
    return
  }

  loading.value = true
  try {
    await systemApi.changePassword({
      old_password: formData.old_password,
      new_password: formData.new_password,
    })
    Message.success('密码修改成功')
    formData.old_password = ''
    formData.new_password = ''
    formData.confirm_password = ''
    done(true)
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || '密码修改失败')
    done(false)
  } finally {
    loading.value = false
  }
}
</script>
