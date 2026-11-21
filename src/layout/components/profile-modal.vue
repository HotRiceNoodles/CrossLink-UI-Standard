<template>
  <a-modal
    :visible="visible"
    :title="t('profile.profileTitle')"
    :width="460"
    :mask-closable="false"
    unmount-on-close
    @cancel="$emit('update:visible', false)"
  >
    <a-spin :loading="loading" style="width: 100%">
      <a-space direction="vertical" fill style="width: 100%" :size="14">
        <!-- 只读资料 -->
        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item :label="t('login.username')">
            {{ profile?.username }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('profile.role')">
            {{ profile?.role_name }}
          </a-descriptions-item>
          <a-descriptions-item v-if="profile?.created_at" :label="t('profile.createdAt')">
            {{ formatTime(profile.created_at) }}
          </a-descriptions-item>
          <a-descriptions-item v-if="profile?.last_login_at" :label="t('profile.lastLogin')">
            {{ formatTime(profile.last_login_at) }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 自助修改：仅 display_name / email（角色/组织属管理面语义） -->
        <a-form :model="form" layout="vertical">
          <a-form-item :label="t('profile.displayName')" required>
            <a-input
              v-model="form.display_name"
              :placeholder="t('profile.displayNamePlaceholder')"
              :max-length="64"
            />
          </a-form-item>
          <a-form-item :label="t('profile.email')" validate-trigger="blur">
            <a-input v-model="form.email" :placeholder="t('profile.emailPlaceholder')" />
            <span v-if="emailError" class="email-error">{{ emailError }}</span>
          </a-form-item>
        </a-form>
      </a-space>
    </a-spin>

    <template #footer>
      <a-button @click="$emit('update:visible', false)">{{ t('common.cancel') }}</a-button>
      <a-button
        type="primary"
        :loading="saving"
        :disabled="!form.display_name?.trim()"
        @click="save"
      >
        {{ t('common.save') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { profileApi } from '@/api/profile'
import { useUserStore } from '@/store'
import { useLoading } from '@/hooks/loading'
import { formatTime } from '@/utils/format'
import type { UserProfile } from '@/types'

const props = defineProps<{ visible: boolean }>()
defineEmits<{ 'update:visible': [value: boolean] }>()

const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading()
const { loading: saving, setLoading: setSaving } = useLoading()

const profile = ref<UserProfile | null>(null)
const form = ref({ display_name: '', email: '' })
const emailError = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function load() {
  setLoading(true)
  try {
    const res = await profileApi.get()
    profile.value = res.data
    form.value = {
      display_name: res.data.display_name || '',
      email: res.data.email || '',
    }
  } catch {
    Message.error(t('common.operationFail'))
  } finally {
    setLoading(false)
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      emailError.value = ''
      load()
    }
  },
)

async function save() {
  const email = form.value.email.trim()
  if (email && !EMAIL_RE.test(email)) {
    emailError.value = t('profile.invalidEmail')
    return
  }
  emailError.value = ''
  setSaving(true)
  try {
    const res = await profileApi.update({
      display_name: form.value.display_name.trim(),
      email: email || undefined,
    })
    profile.value = res.data
    Message.success(t('common.updateSuccess'))
    // 同步登录态展示名（navbar 立即生效）
    if (userStore.user) {
      userStore.setUser({ ...userStore.user, display_name: res.data.display_name })
    }
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    Message.error(e.response?.data?.error || t('common.operationFail'))
  } finally {
    setSaving(false)
  }
}
</script>

<style scoped lang="less">
.email-error {
  color: rgb(var(--red-6));
  font-size: 12px;
}
</style>
