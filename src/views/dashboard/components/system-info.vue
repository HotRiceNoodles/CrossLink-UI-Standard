<template>
  <a-grid :cols="24" :col-gap="16" :row-gap="16" class="system-info">
    <a-grid-item :span="8">
      <a-card class="general-card info-card">
        <div class="info-inner">
          <div class="info-icon version-icon">
            <icon-settings />
          </div>
          <div class="info-detail">
            <span class="info-label">{{ t('dashboard.systemVersion') }}</span>
            <span class="info-value">{{ systemInfo.version || '--' }}</span>
          </div>
        </div>
      </a-card>
    </a-grid-item>

    <a-grid-item :span="8">
      <a-card class="general-card info-card">
        <div class="info-inner">
          <div class="info-icon license-icon">
            <icon-safe />
          </div>
          <div class="info-detail">
            <span class="info-label">{{ t('dashboard.licenseStatus') }}</span>
            <div class="info-value-with-tag">
              <a-tag :color="license.is_valid ? 'green' : 'red'" size="small">
                {{ license.is_valid ? t('dashboard.valid') : t('dashboard.invalid') }}
              </a-tag>
              <span class="info-edition">{{ editionLabel }}</span>
            </div>
          </div>
        </div>
      </a-card>
    </a-grid-item>

    <a-grid-item :span="8">
      <a-card class="general-card info-card">
        <div class="info-inner">
          <div class="info-icon db-icon">
            <icon-storage />
          </div>
          <div class="info-detail">
            <span class="info-label">{{ t('dashboard.dbStatus') }}</span>
            <div class="info-value-with-tag">
              <a-tag :color="systemInfo.db_status === 'ok' ? 'green' : 'red'" size="small">
                {{
                  systemInfo.db_status === 'ok' ? t('dashboard.normal') : t('dashboard.abnormal')
                }}
              </a-tag>
            </div>
          </div>
        </div>
      </a-card>
    </a-grid-item>
  </a-grid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SystemInfo, LicenseStatus } from '@/types'
import { useTierLabel } from '@/utils/license'

const { t } = useI18n()
const tierLabelFn = useTierLabel()

const props = defineProps<{
  systemInfo: SystemInfo
  license: LicenseStatus
}>()

const editionLabel = computed(() => tierLabelFn(props.license.edition))
</script>

<style scoped lang="less">
.system-info {
  margin-top: 16px;
}

.info-card {
  height: 100%;
}

.info-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
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

.version-icon {
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
}

.license-icon {
  background-color: rgba(var(--green-1), 0.8);
  color: rgb(var(--green-6));
}

.db-icon {
  background-color: rgba(var(--arcoblue-1), 0.8);
  color: rgb(var(--arcoblue-6));
}

.info-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-3);
  line-height: 1;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  line-height: 1.4;
}

.info-value-with-tag {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-edition {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-2);
}
</style>
