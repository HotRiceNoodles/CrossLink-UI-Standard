<template>
  <div class="license-page">
    <a-spin :loading="loading" style="width: 100%">
      <div class="page-content">
        <status-card :license="license" />
        <activate-form v-if="canManage" :loading="activateLoading" @activate="handleActivate" />
        <import-form v-if="canManage" :loading="importLoading" @import="handleImport" />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { licenseApi } from '@/api/license'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/store/modules/user'
import type { LicenseStatus } from '@/types'
import StatusCard from './components/status-card.vue'
import ActivateForm from './components/activate-form.vue'
import ImportForm from './components/import-form.vue'
import { useLoading } from '@/hooks/loading'

const { t } = useI18n()
const userStore = useUserStore()

const { loading, setLoading } = useLoading(true)
const { loading: activateLoading, setLoading: setActivateLoading } = useLoading()
const { loading: importLoading, setLoading: setImportLoading } = useLoading()
const license = ref<LicenseStatus | null>(null)

// A build that exposes a device fingerprint supports licensing; a true
// community build returns an empty fingerprint and cannot be activated.
const hasFingerprint = computed(() => !!license.value?.fingerprint?.trim())

const canManage = computed(() => hasFingerprint.value && userStore.hasPermission('license:manage'))

async function fetchLicenseStatus() {
  try {
    const res = await licenseApi.status()
    license.value = res.data
    // Sync tier to store if changed
    if (res.data.tier && res.data.tier !== userStore.tier) {
      userStore.setTier(res.data.tier)
    }
  } catch {
    Message.error(t('license.fetchFail'))
  }
}

async function syncPermissionsAndRefresh() {
  // Re-fetch permissions to sync tier and permission changes
  try {
    const permRes = await authApi.permissions()
    userStore.setPermissions(permRes.data.permissions)
    userStore.setTier(permRes.data.tier)
  } catch {
    // Non-critical — tier already updated from license status
  }
  await fetchLicenseStatus()
}

async function handleActivate(licenseKey: string) {
  setActivateLoading(true)
  try {
    await licenseApi.activate(licenseKey)
    Message.success(t('license.activateSuccess'))
    await syncPermissionsAndRefresh()
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || t('license.activateFail'))
  } finally {
    setActivateLoading(false)
  }
}

async function handleImport(file: File) {
  setImportLoading(true)
  try {
    await licenseApi.importLic(file)
    Message.success(t('license.importSuccess'))
    await syncPermissionsAndRefresh()
  } catch (err: unknown) {
    const error = err as { response?: { data?: { error?: string } } }
    Message.error(error.response?.data?.error || t('license.importFail'))
  } finally {
    setImportLoading(false)
  }
}

onMounted(async () => {
  setLoading(true)
  await fetchLicenseStatus()
  setLoading(false)
})
</script>

<style scoped lang="less">
.license-page {
  padding: 0;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
