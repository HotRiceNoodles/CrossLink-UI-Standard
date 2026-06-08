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

        <!-- License -->
        <a-card class="general-card" :title="t('settings.licenseInfo')">
          <a-grid :cols="24" :col-gap="16" :row-gap="16">
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.licenseTier') }}</span>
                <span class="field-value">{{ tierLabel(license?.tier || 'community') }}</span>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.licenseEdition') }}</span>
                <span class="field-value">{{ editionLabel }}</span>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.licenseStatus') }}</span>
                <a-tag :color="license?.is_valid ? 'green' : 'red'" size="small">
                  {{ license?.is_valid ? t('dashboard.valid') : t('dashboard.invalid') }}
                </a-tag>
              </div>
            </a-grid-item>
            <a-grid-item :span="12">
              <div class="field-item">
                <span class="field-label">{{ t('settings.licenseExpiry') }}</span>
                <span class="field-value">
                  {{ license?.expires_at ? license.expires_at.slice(0, 10) : '--' }}
                </span>
              </div>
            </a-grid-item>
          </a-grid>
          <router-link :to="{ name: 'license' }" class="license-link">
            {{ t('settings.viewLicenseDetail') }} →
          </router-link>
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
        <a-card class="general-card" :title="t('settings.featureSettings')">
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
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { systemApi } from '@/api/system'
import { licenseApi } from '@/api/license'
import { settingsApi } from '@/api/settings'
import { useUserStore } from '@/store/modules/user'
import { useTierLabel } from '@/utils/license'
import type { SystemInfo, LicenseStatus, SystemSettings } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const tierLabel = useTierLabel()

const loading = ref(true)
const systemInfo = ref<SystemInfo | null>(null)
const license = ref<LicenseStatus | null>(null)
const logContentEnabled = ref(false)
const logContentLoading = ref(false)

const user = computed(() => userStore.user)
const editionLabel = computed(() => tierLabel(license.value?.edition || 'community'))

async function handleLogContentChange(value: boolean | number | string) {
  logContentLoading.value = true
  try {
    await settingsApi.updateSettings({ log_content: !!value })
    Message.success(t('settings.updateSuccess'))
  } catch {
    logContentEnabled.value = !value
    Message.error(t('settings.updateFail'))
  } finally {
    logContentLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [sysRes, licRes, settingsRes] = await Promise.allSettled([
      systemApi.info(),
      licenseApi.status(),
      settingsApi.getSettings(),
    ])

    if (sysRes.status === 'fulfilled') {
      systemInfo.value = sysRes.value.data
    }
    if (licRes.status === 'fulfilled') {
      license.value = licRes.value.data
    }
    if (settingsRes.status === 'fulfilled') {
      const settings = settingsRes.value.data as SystemSettings
      logContentEnabled.value = settings.log_content
    }
  } finally {
    loading.value = false
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

.license-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 13px;
  color: rgb(var(--arcoblue-6));
  text-decoration: none;

  &:hover {
    color: rgb(var(--arcoblue-5));
  }
}
</style>
