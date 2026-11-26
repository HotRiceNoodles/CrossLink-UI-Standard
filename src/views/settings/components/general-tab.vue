<template>
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
              <span class="field-value">
                {{ t('settings.frontend') }} v{{ appVersion }} · {{ t('settings.backend') }} v{{
                  backendVersion || '--'
                }}
              </span>
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
                    systemInfo?.db_status === 'ok' ? t('dashboard.normal') : t('dashboard.abnormal')
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

      <!-- 网关协议能力：运行中网关准入的 beta tokens / 方言扩展参数 / effort 版本 -->
      <a-card class="general-card" :title="t('settings.capabilitiesTitle')">
        <a-spin :loading="capLoading" style="width: 100%">
          <a-alert v-if="capError" type="warning">
            {{ t('settings.capabilitiesUnavailable') }}
          </a-alert>
          <template v-else-if="capabilities">
            <div class="cap-row">
              <span class="cap-label">{{ t('settings.capBetaTokens') }}</span>
              <div class="cap-values">
                <a-tag v-for="b in capabilities.beta_tokens" :key="b" class="mono" size="small">
                  {{ b }}
                </a-tag>
                <span v-if="!capabilities.beta_tokens.length" class="cap-empty">-</span>
              </div>
            </div>
            <div class="cap-row">
              <span class="cap-label">{{ t('settings.capDialectParams') }}</span>
              <div class="cap-values">
                <a-tag v-for="p in capabilities.dialect_params" :key="p" class="mono" size="small">
                  {{ p }}
                </a-tag>
                <span v-if="!capabilities.dialect_params.length" class="cap-empty">-</span>
              </div>
            </div>
            <div class="cap-row">
              <span class="cap-label">{{ t('settings.capEffortVersions') }}</span>
              <div class="cap-values">
                <a-tag
                  v-for="v in capabilities.anthropic_effort_versions"
                  :key="v"
                  class="mono"
                  size="small"
                  color="arcoblue"
                >
                  {{ v }}
                </a-tag>
                <span v-if="!capabilities.anthropic_effort_versions.length" class="cap-empty">
                  -
                </span>
              </div>
            </div>
            <div class="cap-tip">{{ t('settings.capabilitiesTip') }}</div>
          </template>
        </a-spin>
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

      <!-- 系统初始设置向导重开入口 -->
      <a-card v-if="canSetup" class="general-card" :title="t('setup.title')">
        <div class="feature-item">
          <div class="feature-info">
            <span class="feature-label">{{ t('setup.reopen') }}</span>
            <span class="feature-desc">{{ t('setup.subtitle') }}</span>
          </div>
          <a-button type="primary" @click="reopenSetup">{{ t('setup.reopen') }}</a-button>
        </div>
      </a-card>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { systemApi } from '@/api/system'
import { useLoading } from '@/hooks/loading'
import { settingsApi } from '@/api/settings'
import { useUserStore } from '@/store/modules/user'
import { ONBOARDING_EVENT, useOnboardingGuard } from '@/composables/use-onboarding-wizard'
import { SETUP_REOPEN_EVENT } from '@/composables/use-system-setup'
import type { GatewayCapabilities, SystemInfo } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

const { loading, setLoading } = useLoading(true)
const systemInfo = ref<SystemInfo | null>(null)
const appVersion = __APP_VERSION__
const backendVersion = ref('')
const logContentEnabled = ref(false)
const { loading: logContentLoading, setLoading: setLogContentLoading } = useLoading()

const user = computed(() => userStore.user)
const canSetup = computed(() => userStore.hasPermission('system:update'))

const { blocked: onboardingBlocked, runOnboarding: runOnboardingGuarded } = useOnboardingGuard()

function reopenOnboarding() {
  // 企业版全局视角时弹提示，其余情况派发事件打开向导。
  if (onboardingBlocked.value) {
    runOnboardingGuarded() // 仅弹提示，不打开
    return
  }
  window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT))
}

function reopenSetup() {
  window.dispatchEvent(new CustomEvent(SETUP_REOPEN_EVENT))
}

async function handleLogContentChange(value: boolean | number | string) {
  setLogContentLoading(true)
  try {
    await settingsApi.updateContentLog(!!value)
    Message.success(t('settings.updateSuccess'))
  } catch {
    logContentEnabled.value = !value
    Message.error(t('settings.updateFail'))
  } finally {
    setLogContentLoading(false)
  }
}

// ---- 网关协议能力（只读镜像，永不漂移）----
const capabilities = ref<GatewayCapabilities | null>(null)
const capLoading = ref(false)
const capError = ref(false)

async function fetchCapabilities() {
  capLoading.value = true
  capError.value = false
  try {
    const res = await systemApi.gatewayCapabilities()
    capabilities.value = res.data
  } catch {
    capError.value = true
  } finally {
    capLoading.value = false
  }
}

onMounted(async () => {
  fetchCapabilities()
  setLoading(true)
  try {
    const [sysRes, contentLogRes, versionRes] = await Promise.allSettled([
      systemApi.info(),
      settingsApi.getContentLog(),
      systemApi.getBackendVersion(),
    ])

    if (sysRes.status === 'fulfilled') {
      systemInfo.value = sysRes.value.data
    }
    if (contentLogRes.status === 'fulfilled') {
      logContentEnabled.value = contentLogRes.value.data.enabled
    }
    // getBackendVersion resolve 的是裸字符串（非 ApiResponse），失败降级 '--'
    if (versionRes.status === 'fulfilled') {
      backendVersion.value = versionRes.value
    }
  } finally {
    setLoading(false)
  }
})
</script>

<style scoped lang="less">
.cap-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;

  .cap-label {
    width: 140px;
    flex-shrink: 0;
    color: var(--color-text-2);
    font-size: 13px;
    padding-top: 2px;
  }

  .cap-values {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .cap-empty {
    color: var(--color-text-4);
  }

  .mono {
    font-family: var(--cl-font-mono);
  }
}

.cap-tip {
  margin-top: 4px;
  color: var(--color-text-3);
  font-size: 12px;
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
  background-color: rgba(var(--cl-primary-1), 0.8);
  color: rgb(var(--cl-primary-6));
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
