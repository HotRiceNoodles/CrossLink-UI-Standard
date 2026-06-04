<template>
  <div class="permission-editor">
    <div class="permission-header">
      <a-tag color="arcoblue">{{ t('auth.roles.selectedCount', [modelValue.length]) }}</a-tag>
    </div>
    <a-collapse :default-active-key="permissionCatalog.map((g) => g.key)" :bordered="false">
      <a-collapse-item
        v-for="group in permissionCatalog"
        :key="group.key"
        :header="t(group.labelI18nKey)"
      >
        <template #extra>
          <a-button type="text" size="mini" @click.stop="toggleGroup(group)">
            {{
              isGroupAllSelected(group) ? t('auth.roles.deselectAll') : t('auth.roles.selectAll')
            }}
          </a-button>
        </template>
        <a-checkbox-group :model-value="modelValue" @change="handleChange">
          <a-space wrap>
            <a-checkbox v-for="action in group.actions" :key="action" :value="action">
              {{ action }}
            </a-checkbox>
          </a-space>
        </a-checkbox-group>
      </a-collapse-item>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { permissionCatalog } from './permission-catalog'

const { t } = useI18n()

const modelValue = defineModel<string[]>({ default: () => [] })

function handleChange(val: (string | number | boolean)[]) {
  modelValue.value = val as string[]
}

function isGroupAllSelected(group: { actions: string[] }) {
  return group.actions.every((a) => modelValue.value.includes(a))
}

function toggleGroup(group: { actions: string[] }) {
  if (isGroupAllSelected(group)) {
    modelValue.value = modelValue.value.filter((a) => !group.actions.includes(a))
  } else {
    const added = group.actions.filter((a) => !modelValue.value.includes(a))
    modelValue.value = [...modelValue.value, ...added]
  }
}
</script>

<style scoped lang="less">
.permission-editor {
  .permission-header {
    margin-bottom: 12px;
  }

  :deep(.arco-collapse-item) {
    margin-bottom: 4px;
  }

  :deep(.arco-collapse-item-content) {
    padding: 8px 0 4px;
  }

  :deep(.arco-checkbox) {
    margin-bottom: 4px;
  }
}
</style>
