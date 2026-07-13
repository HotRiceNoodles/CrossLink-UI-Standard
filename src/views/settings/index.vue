<template>
  <div class="settings-page">
    <a-spin :loading="loading" style="width: 100%">
      <div class="page-content">
        <!-- Account & License -->
        <a-card class="general-card" :title="t('settings.accountInfo')">
          <a-grid :cols="24" :col-gap="16" :row-gap="16">
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.username') }}</span>
                <span class="field-value">
                  {{ systemInfo?.admin_username || user?.username || '--' }}
                </span>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.role') }}</span>
                <span class="field-value">{{ user?.role_name || '--' }}</span>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.version') }}</span>
                <span class="field-value">{{ systemInfo?.version || '--' }}</span>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.tokenExpiry') }}</span>
                <span class="field-value">{{ systemInfo?.token_expiry ?? '--' }}</span>
              </div>
            </a-grid-item>
          </a-grid>
        </a-card>

        <!-- Connection Status -->
        <a-card class="general-card" :title="t('settings.connectionStatus')">
          <a-grid :cols="24" :col-gap="16" :row-gap="16">
            <a-grid-item :span="12">
              <div class="status-item">
                <div class="status-icon db-icon">
                  <icon-storage />
                </div>
                <div class="status-detail">
                  <span class="status-label">{{ t('settings.database') }}</span>
                  <a-tag :color="systemInfo?.db_status === 'ok' ? 'green' : 'red'" size="small">
                    {{
                      systemInfo?.db_status === 'ok'
                        ? t('dashboard.normal')
                        : t('dashboard.abnormal')
                    }}
                  </a-tag>
                </div>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="status-item">
                <div class="status-icon cache-icon">
                  <icon-thunderbolt />
                </div>
                <div class="status-detail">
                  <span class="status-label">{{ t('settings.cache') }}</span>
                  <a-tag
                    :color="
                      systemInfo?.redis_status === 'ok'
                        ? 'green'
                        : systemInfo?.redis_status
                          ? 'red'
                          : 'gray'
                    "
                    size="small"
                  >
                    {{
                      systemInfo?.redis_status === 'ok'
                        ? t('dashboard.normal')
                        : systemInfo?.redis_status
                          ? t('dashboard.abnormal')
                          : t('settings.notAvailable')
                    }}
                  </a-tag>
                </div>
              </div>
            </a-grid-item>
          </a-grid>
        </a-card>

        <!-- Feature Settings -->
        <a-card
          v-if="settingsAvailable"
          class="general-card"
          :title="t('settings.featureSettings')"
        >
          <div class="feature-item">
            <div class="feature-info">
              <span class="feature-label">{{ t('settings.logContent') }}</span>
              <span class="feature-desc">{{ t('settings.logContentDesc') }}</span>
            </div>
            <a-switch
              v-model="logContentEnabled"
              :loading="logContentLoading"
              @change="handleLogContentChange"
            />
          </div>
        </a-card>

        <!-- Onboarding 向导重开入口 -->
        <a-card class="general-card" :title="t('onboarding.title')">
          <div class="feature-item">
            <div class="feature-info">
              <span class="feature-label">{{ t('onboarding.reopen') }}</span>
              <span class="feature-desc">{{ t('onboarding.subtitle') }}</span>
            </div>
            <a-button @click="reopenOnboarding">{{ t('onboarding.reopen') }}</a-button>
          </div>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { systemApi } from '@/api/system'
import { useLoading } from '@/hooks/loading'
import { settingsApi } from '@/api/settings'
import { useUserStore } from '@/store/modules/user'
import { ONBOARDING_EVENT } from '@/composables/use-onboarding-wizard'
import type { SystemInfo, SystemSettings } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

const { loading, setLoading } = useLoading(true)
const systemInfo = ref<SystemInfo | null>(null)
const settingsAvailable = ref(false)
const logContentEnabled = ref(false)
const { loading: logContentLoading, setLoading: setLogContentLoading } = useLoading()

const user = computed(() => userStore.user)

function reopenOnboarding() {
  window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT))
}

async function handleLogContentChange(value: boolean | number | string) {
  setLogContentLoading(true)
  try {
    await settingsApi.updateSettings({ log_content: !!value })
    Message.success(t('settings.updateSuccess'))
  } catch {
    logContentEnabled.value = !value
    Message.error(t('settings.updateFail'))
  } finally {
    setLogContentLoading(false)
  }
}

onMounted(async () => {
  setLoading(true)
  try {
    const [sysRes, settingsRes] = await Promise.allSettled([
      systemApi.info(),
      settingsApi.getSettings(),
    ])

    if (sysRes.status === 'fulfilled') {
      systemInfo.value = sysRes.value.data
    }
    if (settingsRes.status === 'fulfilled') {
      settingsAvailable.value = true
      const settings = settingsRes.value.data as SystemSettings
      logContentEnabled.value = settings.log_content
    }
  } finally {
    setLoading(false)
  }
})
</script>

<style scoped lang="less">
.settings-page {
  padding: 0;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 13px;
  color: var(--color-text-3);
}

.field-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-1);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(.arco-icon) {
    font-size: 20px;
  }
}

.db-icon {
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
}

.cache-icon {
  background-color: rgba(var(--orange-1), 0.8);
  color: rgb(var(--orange-6));
}

.status-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 13px;
  color: var(--color-text-3);
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.feature-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.feature-desc {
  font-size: 13px;
  color: var(--color-text-3);
}
</style>
