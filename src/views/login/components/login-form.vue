<template>
  <div class="login-form">
    <div class="login-form-header">
      <h2 class="login-form-title">{{ t('login.title') }}</h2>
      <p class="login-form-subtitle">{{ t('login.subtitle') }}</p>
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
          :placeholder="t('login.usernamePlaceholder')"
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
          :placeholder="t('login.passwordPlaceholder')"
          size="large"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" long size="large" :loading="loading">
          {{ t('login.title') }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import { authApi } from '@/api/auth'
import { orgApi } from '@/api/rbac'
import { Message } from '@arco-design/web-vue'
import { useLoading } from '@/hooks/loading'

const emit = defineEmits<{ forceChange: [] }>()

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const { loading, setLoading } = useLoading()
const errorMsg = ref('')

const formData = reactive({
  username: '',
  password: '',
})

const rules = computed(() => ({
  username: [{ required: true, message: t('login.usernameRequired') }],
  password: [{ required: true, message: t('login.passwordRequired') }],
}))

async function handleLogin() {
  setLoading(true)
  errorMsg.value = ''

  try {
    const res = await authApi.login({
      username: formData.username,
      password: formData.password,
    })

    userStore.setAuth(res.data)
    userStore.initOrgContext()

    // If user must change password on first login, switch to force-change form
    if (res.data.user.force_password_change) {
      emit('forceChange')
      return
    }

    Message.success(t('login.loginSuccess'))

    if (userStore.isEnterprise) {
      // Enterprise edition: multi-tenant mode
      if (userStore.isPlatformAdmin) {
        const orgsRes = await orgApi.list()
        userStore.setAvailableOrgs(orgsRes.data)
        const redirect = (route.query.redirect as string) || '/overview'
        router.push(redirect)
      } else {
        const orgId = res.data.user.org_id
        if (orgId) {
          router.push(`/org/${orgId}/dashboard`)
        } else {
          router.push('/dashboard')
        }
      }
    } else {
      // Community/Pro: single-tenant, flat routes
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    errorMsg.value = error.response?.data?.error || t('login.loginFail')
  } finally {
    setLoading(false)
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
