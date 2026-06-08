<template>
  <a-card class="general-card" :title="t('license.import')">
    <p class="form-desc">{{ t('license.importDesc') }}</p>
    <a-upload
      :auto-upload="false"
      :limit="1"
      accept=".lic"
      :file-list="fileList"
      @change="handleFileChange"
    >
      <template #upload-button>
        <a-button>
          <template #icon><icon-upload /></template>
          {{ t('license.selectFile') }}
        </a-button>
      </template>
    </a-upload>
    <div v-if="selectedFile" class="selected-file">
      <icon-file />
      <span>{{ selectedFile.name }}</span>
    </div>
    <p class="file-hint">{{ t('license.fileHint') }}</p>
    <a-button
      type="primary"
      :disabled="!selectedFile"
      :loading="loading"
      style="margin-top: 12px"
      @click="handleImport"
    >
      {{ loading ? t('license.importing') : t('license.importButton') }}
    </a-button>
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FileItem } from '@arco-design/web-vue'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'import', file: File): void
}>()

const { t } = useI18n()
const fileList = ref<FileItem[]>([])
const selectedFile = ref<File | null>(null)

function handleFileChange(fileItemList: FileItem[], fileItem: FileItem) {
  if (fileItem.file) {
    selectedFile.value = fileItem.file
    fileList.value = [fileItem]
  }
}

function handleImport() {
  if (selectedFile.value) {
    emit('import', selectedFile.value)
  }
}
</script>

<style scoped lang="less">
.form-desc {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--color-text-3);
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background-color: var(--color-fill-1);
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text-2);
}

.file-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-4);
}
</style>
