<template>
  <div class="force-change-form">
    <div class="force-change-header">
      <h2 class="force-change-title">{{ t('login.forceChangeTitle') }}</h2>
      <p class="force-change-desc">{{ t('login.forceChangeDesc') }}</p>
    </div>

    <a-alert v-if="errorMsg" type="danger" :closable="false" class="force-change-error">
      {{ errorMsg }}
    </a-alert>

    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      @submit-success="handleSubmit"
    >
      <a-form-item field="new_password" :label="t('login.forceNewPassword')">
        <a-input-password
          v-model="formData.new_password"
          :placeholder="t('login.forceNewPasswordPlaceholder')"
          size="large"
        >
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item field="confirm_password" :label="t('login.forceConfirmPassword')">
        <a-input-password
          v-model="formData.confirm_password"
          :placeholder="t('login.forceConfirmPasswordPlaceholder')"
          size="large"
        >
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" long size="large" :loading="loading">
          {{ t('login.forceChangeTitle') }}
        </a-button>
      </a-form-item>

      <a-form-item>
        <a-button type="text" long size="large" @click="handleCancel">
          {{ t('login.forceChangeCancel') }}
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

const emit = defineEmits<{ cancel: [] }>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref()
const { loading, setLoading } = useLoading()
const errorMsg = ref('')

const formData = reactive({
  new_password: '',
  confirm_password: '',
})

const rules = computed(() => ({
  new_password: [
    { required: true, message: t('login.forceNewPasswordRequired') },
    { minLength: 8, message: t('login.forcePasswordMinLength') },
  ],
  confirm_password: [
    { required: true, message: t('login.forceConfirmPasswordRequired') },
    {
      validator: (value: string, cb: (msg?: string) => void) => {
        if (value !== formData.new_password) {
          cb(t('login.forcePasswordMismatch'))
        }
      },
    },
  ],
}))

function handleCancel() {
  userStore.logout()
  emit('cancel')
}

async function handleSubmit() {
  setLoading(true)
  errorMsg.value = ''

  try {
    const res = await authApi.changeForcedPassword({
      new_password: formData.new_password,
      confirm_password: formData.confirm_password,
    })

    userStore.setAuth(res.data)
    userStore.initOrgContext()
    Message.success(t('login.forceChangeSuccess'))

    // Same routing logic as login-form
    if (userStore.isEnterprise) {
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
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    errorMsg.value = error.response?.data?.error || t('login.forceChangeFail')
  } finally {
    setLoading(false)
  }
}
</script>

<style scoped lang="less">
.force-change-form {
  width: 100%;
}

.force-change-header {
  margin-bottom: 32px;
}

.force-change-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0 0 8px;
}

.force-change-desc {
  font-size: 14px;
  color: var(--color-text-3);
  margin: 0;
}

.force-change-error {
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
