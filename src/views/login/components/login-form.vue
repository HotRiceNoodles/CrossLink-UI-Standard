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

    <a-modal
      v-model:visible="captchaVisible"
      :title="t('login.captchaTitle')"
      :footer="false"
      :mask-closable="false"
      :closable="!loading"
      :width="380"
      :align-center="true"
      @cancel="onCaptchaCancel"
    >
      <div class="captcha-modal-body">
        <p class="captcha-modal-tip">{{ t('login.captchaTip') }}</p>
        <SliderCaptcha
          :challenge="captchaChallenge"
          :loading="loading"
          :error-tip="captchaErrorTip"
          @verified="onCaptchaVerified"
          @refresh="refreshCaptcha"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import { authApi } from '@/api/auth'
import { orgApi } from '@/api/rbac'
import { Message } from '@arco-design/web-vue'
import { useLoading } from '@/hooks/loading'
import SliderCaptcha from './slider-captcha.vue'
import type { CaptchaAnswer, CaptchaChallenge } from '@/types'

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

// 'unknown' = not probed yet, 'disabled' = backend gate off, 'trusted' = trust
// cookie valid (skip slider), 'required' = must solve a slider per login.
type CaptchaMode = 'unknown' | 'disabled' | 'trusted' | 'required'

const captchaMode = ref<CaptchaMode>('unknown')
const captchaVisible = ref(false)
const captchaChallenge = ref<CaptchaChallenge | null>(null)
const captchaErrorTip = ref('')

function errorCode(err: unknown): string | undefined {
  return (err as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code
}

function isCaptchaDisabled(err: unknown): boolean {
  return errorCode(err) === 'captcha_disabled'
}

async function probeCaptchaMode() {
  try {
    const res = await authApi.captchaIssue()
    captchaMode.value = res.data && 'trusted' in res.data ? 'trusted' : 'required'
  } catch (err) {
    captchaMode.value = isCaptchaDisabled(err) ? 'disabled' : 'required'
  }
}

async function refreshCaptcha() {
  captchaErrorTip.value = ''
  captchaChallenge.value = null
  try {
    const res = await authApi.captchaIssue()
    if (res.data && 'trusted' in res.data) {
      // Device got trusted mid-flow (rare) — close modal and proceed.
      captchaVisible.value = false
      captchaMode.value = 'trusted'
      await doLogin()
      return
    }
    captchaChallenge.value = res.data
  } catch (err) {
    if (isCaptchaDisabled(err)) {
      captchaMode.value = 'disabled'
      captchaVisible.value = false
      await doLogin()
    } else {
      captchaErrorTip.value = t('login.captchaFailed')
    }
  }
}

async function openCaptchaModal() {
  captchaErrorTip.value = ''
  captchaVisible.value = true
  await refreshCaptcha()
}

function onCaptchaCancel() {
  if (loading.value) return
  captchaVisible.value = false
  setLoading(false)
}

async function onCaptchaVerified(payload: { final_x: number; points: CaptchaAnswer['points'] }) {
  if (!captchaChallenge.value) return
  await doLogin({
    captcha_id: captchaChallenge.value.captcha_id,
    captcha_answer: { final_x: payload.final_x, points: payload.points },
  })
}

async function handleLogin() {
  errorMsg.value = ''

  if (captchaMode.value === 'required') {
    // Fetch a fresh challenge (the on-mount probe is only a mode check and may
    // be stale); loading covers the fetch, then we wait for the user to drag.
    setLoading(true)
    await openCaptchaModal()
    setLoading(false)
    return
  }
  await doLogin()
}

async function doLogin(captchaPayload?: { captcha_id: string; captcha_answer: CaptchaAnswer }) {
  setLoading(true)
  errorMsg.value = ''

  try {
    const res = await authApi.login({
      username: formData.username,
      password: formData.password,
      captcha_id: captchaPayload?.captcha_id,
      captcha_answer: captchaPayload?.captcha_answer,
    })

    userStore.setAuth(res.data)
    userStore.initOrgContext()

    captchaVisible.value = false

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
    const code = errorCode(err)
    const error = err as { response?: { data?: { error?: string } } }

    if (code === 'captcha_required') {
      // Wrong position / flagged trajectory / expired — keep modal open, re-issue.
      captchaErrorTip.value = t('login.captchaFailed')
      await refreshCaptcha()
      return
    }

    // For any other failure the captcha (if any) is consumed; close the modal.
    captchaVisible.value = false
    errorMsg.value = error.response?.data?.error || t('login.loginFail')
  } finally {
    setLoading(false)
  }
}

onMounted(() => {
  probeCaptchaMode()
})
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

.captcha-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0 12px;
}

.captcha-modal-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-3);
  text-align: center;
}
</style>
