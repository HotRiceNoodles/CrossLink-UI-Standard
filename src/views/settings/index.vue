<template>
  <div class="settings-page">
    <a-card class="general-card">
      <a-tabs :active-key="activeTab" @change="onTabChange">
        <a-tab-pane key="general" :title="t('settings.tabGeneral')">
          <general-tab />
        </a-tab-pane>
        <a-tab-pane
          v-if="userStore.hasPermission('system:view')"
          key="config"
          :title="t('systemConfig.tabTitle')"
        >
          <runtime-config-tab />
        </a-tab-pane>
        <a-tab-pane key="doctor" :title="t('doctor.tabTitle')">
          <doctor-tab />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import GeneralTab from './components/general-tab.vue'
import RuntimeConfigTab from './components/runtime-config-tab.vue'
import DoctorTab from './components/doctor-tab.vue'

const { t } = useI18n()
const userStore = useUserStore()

const activeTab = ref('general')

function onTabChange(key: string | number) {
  activeTab.value = String(key)
}
</script>

<style scoped lang="less">
.settings-page {
  padding: 0;

  :deep(.arco-tabs-content) {
    // tab 内容自带上边距，去掉默认的 padding-first 使卡片更紧凑
    padding-top: 8px;
  }
}
</style>
