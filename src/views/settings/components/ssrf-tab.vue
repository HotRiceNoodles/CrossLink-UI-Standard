<template>
  <div class="ssrf-tab">
    <a-spin :loading="loading" style="width: 100%">
      <div class="tab-body">
        <div class="tab-toolbar">
          <span class="page-desc">{{ t('ssrf.desc') }}</span>
          <a-button size="small" :loading="loading" @click="load">
            <template #icon><icon-refresh /></template>
            {{ t('systemConfig.refresh') }}
          </a-button>
        </div>

        <a-alert v-if="loadError" type="error">{{ t('ssrf.loadFail') }}</a-alert>

        <template v-if="status">
          <!-- Degraded: memory keeps the last-known-good policy; show why -->
          <a-alert v-if="status.degraded" type="warning">
            {{ t('ssrf.degraded') }}: {{ status.degraded }}
          </a-alert>

          <a-descriptions :column="2" size="small" bordered class="status-desc">
            <a-descriptions-item :label="t('ssrf.source')">
              <a-tag :color="sourceColor(status.source)">
                {{ t(`ssrf.source_${status.source}`) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item :label="t('ssrf.version')">
              v{{ status.version }}
            </a-descriptions-item>
            <a-descriptions-item :label="t('ssrf.effectiveTitle')" :span="2">
              <template v-if="status.effective_cidrs.length">
                <a-tag v-for="cidr in status.effective_cidrs" :key="cidr" class="cidr-tag">
                  {{ cidr }}
                </a-tag>
              </template>
              <span v-else class="strict-empty">{{ t('ssrf.strictEmpty') }}</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('ssrf.overrideStatus')" :span="2">
              <a-tag v-if="status.override_active" color="arcoblue">
                {{ t('ssrf.overrideActive') }}
              </a-tag>
              <span v-else>{{ t('ssrf.noOverride') }}</span>
            </a-descriptions-item>
            <a-descriptions-item :label="t('ssrf.consistency')" :span="2">
              {{
                status.consistency.broadcast === 'redis'
                  ? t('ssrf.broadcastRedis')
                  : t('ssrf.broadcastTtl', { seconds: status.consistency.window_seconds })
              }}
            </a-descriptions-item>
            <a-descriptions-item
              v-if="status.override_active"
              :label="t('ssrf.fallbackTitle')"
              :span="2"
            >
              {{ t('ssrf.fallbackTo', { source: t(`ssrf.source_${status.fallback_source}`) }) }}
              <template v-if="status.fallback_cidrs?.length">
                <a-tag v-for="cidr in status.fallback_cidrs" :key="cidr" class="cidr-tag">
                  {{ cidr }}
                </a-tag>
              </template>
              <span v-else class="strict-empty">{{ t('ssrf.strictEmpty') }}</span>
            </a-descriptions-item>
          </a-descriptions>

          <!-- Editor: platform admins only — this is a GLOBAL policy, tenant
               (org) admins must not edit it even with system:update. -->
          <template v-if="canEdit">
            <a-divider style="margin: 16px 0" />
            <a-alert v-if="!redisReauth" type="warning" style="margin-bottom: 12px">
              {{ t('ssrf.errorRedisRequired') }}
            </a-alert>
            <div class="editor-header">
              <span style="font-weight: 600">{{ t('ssrf.editorTitle') }}</span>
            </div>
            <a-textarea
              v-model="draft"
              :auto-size="{ minRows: 4, maxRows: 10 }"
              :placeholder="t('ssrf.editorPlaceholder')"
              :disabled="!redisReauth"
              class="cidr-editor"
            />
            <div class="editor-tip">{{ t('ssrf.editorTip') }}</div>
            <a-space style="margin-top: 12px">
              <a-button type="primary" :disabled="!redisReauth" @click="openReauth('apply')">
                {{ t('ssrf.save') }}
              </a-button>
              <a-popconfirm
                v-if="status.override_active"
                :content="t('ssrf.deleteConfirm')"
                type="warning"
                @ok="openReauth('reset')"
              >
                <a-button status="danger" :disabled="!redisReauth">
                  {{ t('ssrf.deleteOverride') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="userStore.hasPermission('system:update')">
            <a-divider style="margin: 16px 0" />
            <a-alert type="info">{{ t('ssrf.readOnly') }}</a-alert>
          </template>
        </template>
      </div>
    </a-spin>

    <!-- Sensitive-op re-auth: mint a single-use token with the account
         password, then carry it as X-Reauth-Token on the write. -->
    <a-modal
      v-model:visible="reauthVisible"
      :title="t('ssrf.reauthTitle')"
      :width="420"
      :ok-loading="writing"
      :mask-closable="false"
      @ok="executeWrite"
      @cancel="closeReauth"
    >
      <a-space direction="vertical" fill style="width: 100%">
        <span style="color: var(--color-text-3); font-size: 13px">
          {{ t('ssrf.reauthTip') }}
        </span>
        <a-input-password
          v-model="reauthPassword"
          :placeholder="t('ssrf.passwordPlaceholder')"
          @keyup.enter="executeWrite"
        />
      </a-space>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { ssrfApi } from '@/api/ssrf'
import { useLoading } from '@/hooks/loading'
import { useUserStore } from '@/store/modules/user'
import type { SsrfAllowlistStatus } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()
const { loading, setLoading } = useLoading()

const status = ref<SsrfAllowlistStatus | null>(null)
const loadError = ref(false)
const draft = ref('')

// 写入是全局敏感操作：平台管理员 + system:update + Redis 共享重认证
const canEdit = computed(
  () => userStore.isPlatformAdmin && userStore.hasPermission('system:update'),
)
const redisReauth = computed(() => status.value?.consistency.reauth === 'redis')

async function load() {
  setLoading(true)
  loadError.value = false
  try {
    const res = await ssrfApi.status()
    status.value = res.data
    // 编辑器预填当前生效列表（仅当来自页面覆盖时）
    draft.value = res.data.override_active ? res.data.effective_cidrs.join('\n') : ''
  } catch {
    loadError.value = true
  } finally {
    setLoading(false)
  }
}

// --- re-auth + write flow ---
const reauthVisible = ref(false)
const reauthPassword = ref('')
const writing = ref(false)
let pendingAction: 'apply' | 'reset' | null = null

function openReauth(action: 'apply' | 'reset') {
  pendingAction = action
  reauthPassword.value = ''
  reauthVisible.value = true
}

function closeReauth() {
  reauthVisible.value = false
  reauthPassword.value = ''
  pendingAction = null
}

// 后端错误码 → 文案；未知错误回落到后端 message
function writeErrorMsg(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { error_code?: string; error?: string } } })?.response
    ?.data
  const map: Record<string, string> = {
    reauth_invalid: t('ssrf.errorReauthInvalid'),
    reauth_rate_limited: t('ssrf.errorReauthRateLimited'),
    reauth_unavailable: t('ssrf.errorReauthUnavailable'),
    reauth_required: t('ssrf.errorReauthRequired'),
    reauth_redis_required: t('ssrf.errorRedisRequired'),
    conflict: t('ssrf.errorConflict'),
    ssrf_allowlist_invalid: t('ssrf.errorInvalid'),
  }
  return (data?.error_code && map[data.error_code]) || data?.error || fallback
}

async function executeWrite() {
  if (!pendingAction || !status.value) return
  if (!reauthPassword.value) {
    Message.warning(t('ssrf.passwordPlaceholder'))
    return
  }
  writing.value = true
  try {
    // 1. 密码换单次令牌（令牌一次性，不做缓存）
    const reauth = await ssrfApi.reauth(reauthPassword.value)
    // 2. 携带 X-Reauth-Token 执行写入（409 conflict 时后端带回最新版本）
    if (pendingAction === 'apply') {
      const cidrs = draft.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      await ssrfApi.apply(cidrs, status.value.version, reauth.data.token)
      Message.success(t('ssrf.applySuccess'))
    } else {
      await ssrfApi.reset(status.value.version, reauth.data.token)
      Message.success(t('ssrf.resetSuccess'))
    }
    closeReauth()
    await load()
  } catch (err: unknown) {
    Message.error(writeErrorMsg(err, t('common.operationFail')))
    // 冲突/失效后本地 version 已过期，刷新状态；密码错误则留在弹窗重试
    const code = (err as { response?: { data?: { error_code?: string } } })?.response?.data
      ?.error_code
    if (code === 'conflict' || code === 'reauth_redis_required') {
      closeReauth()
      await load()
    }
  } finally {
    writing.value = false
  }
}

function sourceColor(source: string): string {
  const map: Record<string, string> = {
    db: 'arcoblue',
    env: 'green',
    yaml: 'cyan',
    strict: 'red',
  }
  return map[source] || 'blue'
}

onMounted(load)
</script>

<style scoped lang="less">
.ssrf-tab {
  .tab-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tab-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .page-desc {
      color: var(--color-text-3);
      font-size: 13px;
    }
  }

  .cidr-tag {
    margin: 0 4px 4px 0;
    font-family: var(--cl-font-mono);
  }

  .strict-empty {
    color: var(--color-text-3);
  }

  .status-desc {
    margin-top: 4px;
  }

  .editor-header {
    margin-bottom: 8px;
  }

  .cidr-editor {
    font-family: var(--cl-font-mono);
  }

  .editor-tip {
    margin-top: 4px;
    color: var(--color-text-3);
    font-size: 12px;
  }
}
</style>
