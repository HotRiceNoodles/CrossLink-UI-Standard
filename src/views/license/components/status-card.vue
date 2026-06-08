<template>
  <a-card class="general-card" :title="t('license.currentStatus')">
    <!-- Hero Row -->
    <div class="status-hero">
      <div class="tier-badge" :class="tierClass">
        <icon-safe class="tier-icon" />
        <span class="tier-name">{{ tierLabel }}</span>
      </div>
      <div class="validity-block">
        <a-tag :color="validityColor" size="large">
          {{ license?.is_valid ? t('license.valid') : t('license.invalid') }}
        </a-tag>
        <span v-if="daysRemaining !== null" class="days-remaining">
          {{ t('license.daysRemaining', [daysRemaining]) }}
        </span>
      </div>
    </div>

    <a-divider style="margin: 16px 0" />

    <!-- Details Grid -->
    <a-grid :cols="24" :col-gap="16" :row-gap="16">
      <a-grid-item :span="8">
        <div class="field-item">
          <span class="field-label">{{ t('license.edition') }}</span>
          <span class="field-value">{{ editionLabel }}</span>
        </div>
      </a-grid-item>
      <a-grid-item :span="8">
        <div class="field-item">
          <span class="field-label">{{ t('license.expiryDate') }}</span>
          <span class="field-value">{{ expiryDisplay }}</span>
        </div>
      </a-grid-item>
      <a-grid-item :span="8">
        <div class="field-item">
          <span class="field-label">{{ t('license.fingerprint') }}</span>
          <span class="field-value mono copyable" @click="copyField(license?.fingerprint)">
            {{ license?.fingerprint || '--' }}
            <icon-copy class="copy-icon" />
          </span>
        </div>
      </a-grid-item>
      <a-grid-item :span="8">
        <div class="field-item">
          <span class="field-label">{{ t('license.cryptoMode') }}</span>
          <span class="field-value">{{ license?.crypto_mode || '--' }}</span>
        </div>
      </a-grid-item>
      <a-grid-item :span="8">
        <div class="field-item">
          <span class="field-label">{{ t('license.maxNodes') }}</span>
          <span class="field-value">{{ maxNodesDisplay }}</span>
        </div>
      </a-grid-item>
      <a-grid-item v-if="license?.license_id" :span="8">
        <div class="field-item">
          <span class="field-label">{{ t('license.licenseId') }}</span>
          <span class="field-value mono copyable" @click="copyField(license!.license_id)">
            {{ license.license_id }}
            <icon-copy class="copy-icon" />
          </span>
        </div>
      </a-grid-item>
    </a-grid>

    <!-- Community note -->
    <a-alert v-if="license?.tier === 'community'" type="info" style="margin-top: 16px">
      {{ t('license.communityNote') }}
    </a-alert>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { useTierLabel } from '@/utils/license'
import { copyToClipboard } from '@/utils/clipboard'
import type { LicenseStatus } from '@/types'
import dayjs from 'dayjs'

const props = defineProps<{
  license: LicenseStatus | null
}>()

const { t } = useI18n()
const tierLabelFn = useTierLabel()

const tierLabel = computed(() => tierLabelFn(props.license?.tier || 'community'))
const editionLabel = computed(() => tierLabelFn(props.license?.edition || 'community'))

const validityColor = computed(() => (props.license?.is_valid ? 'green' : 'red'))

const tierClass = computed(() => {
  const tier = props.license?.tier || 'community'
  return `tier-${tier}`
})

const daysRemaining = computed(() => {
  if (!props.license?.expires_at) return null
  const diff = dayjs(props.license.expires_at).diff(dayjs(), 'day')
  return diff > 0 ? diff : 0
})

const expiryDisplay = computed(() => {
  if (!props.license?.expires_at) return t('license.noExpiry')
  return dayjs(props.license.expires_at).format('YYYY-MM-DD')
})

const maxNodesDisplay = computed(() => {
  if (!props.license?.max_nodes) return t('common.unlimited')
  return String(props.license.max_nodes)
})

async function copyField(value: string | null | undefined) {
  if (!value) return
  try {
    await copyToClipboard(value)
    Message.success(t('common.copied'))
  } catch {
    Message.error(t('common.copyFail'))
  }
}
</script>

<style scoped lang="less">
.status-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 8px;

  .tier-icon {
    font-size: 22px;
  }

  .tier-name {
    font-size: 16px;
    font-weight: 600;
  }
}

.tier-community {
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
}

.tier-pro {
  background-color: rgba(var(--green-1), 0.8);
  color: rgb(var(--green-6));
}

.tier-enterprise {
  background-color: rgba(var(--orange-1), 0.8);
  color: rgb(var(--orange-6));
}

.validity-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.days-remaining {
  font-size: 13px;
  color: var(--color-text-3);
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

  &.mono {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    word-break: break-all;
  }

  &.copyable {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    .copy-icon {
      font-size: 13px;
      color: var(--color-text-4);
      opacity: 0;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }

    &:hover .copy-icon {
      opacity: 1;
    }

    &:hover {
      color: rgb(var(--arcoblue-6));
    }
  }
}
</style>
