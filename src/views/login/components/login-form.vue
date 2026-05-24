<template>
  <div class="login-form">
    <div class="login-form-header">
      <h2 class="login-form-title">登录</h2>
      <p class="login-form-subtitle">搭桥 管理后台</p>
    </div>

    <a-alert v-if="errorMsg" type="danger" :closable="false" class="login-error">
      {{ errorMsg }}
    </a-alert>

    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      @submit-success="handleLogin"
    >
      <a-form-item field="username" hide-label>
        <a-input
          v-model="formData.username"
          placeholder="用户名"
          size="large"
        >
          <template #prefix>
            <icon-user />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item field="password" hide-label>
        <a-input-password
          v-model="formData.password"
          placeholder="密码"
          size="large"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          long
          size="large"
          :loading="loading"
        >
          登录
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store'
import { authApi } from '@/api/auth'
import { Message } from '@arco-design/web-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const errorMsg = ref('')

const formData = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
}

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    const res = await authApi.login({
      username: formData.username,
      password: formData.password,
    })

    userStore.setAuth(res.data)
    Message.success('登录成功')

    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    errorMsg.value = error.response?.data?.error || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
.login-form {
  width: 100%;
}

.login-form-header {
  margin-bottom: 32px;
}

.login-form-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px;
}

.login-form-subtitle {
  font-size: 14px;
  color: var(--color-text-3);
  margin: 0;
}

.login-error {
  margin-bottom: 16px;
}

:deep(.arco-input-size-large) {
  height: 44px;
}

:deep(.arco-btn-size-large) {
  height: 44px;
  font-size: 15px;
}
</style>
