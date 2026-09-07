<template>
  <div class="pat-page">
    <a-card class="general-card">
      <template #title>
        <div class="card-title">
          <span>{{ t('pat.title') }}</span>
          <span class="card-desc">{{ t('pat.description') }}</span>
        </div>
      </template>

      <!-- Toolbar -->
      <a-row justify="space-between" align="center" style="margin-bottom: 16px">
        <a-col>
          <span style="color: var(--color-text-3); font-size: 13px">
            {{ t('pat.totalTokens', { n: filteredList.length }) }}
          </span>
        </a-col>
        <a-col>
          <a-space>
            <a-button type="primary" @click="handleCreate">
              <template #icon><icon-plus /></template>
              {{ t('pat.createToken') }}
            </a-button>
            <a-tooltip :content="t('common.refresh')">
              <a-button @click="fetchData">
                <template #icon><icon-refresh /></template>
              </a-button>
            </a-tooltip>
          </a-space>
        </a-col>
      </a-row>

      <!-- Table -->
      <a-table
        :data="filteredList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
        :bordered="false"
      >
        <template #columns>
          <a-table-column :title="t('pat.tableName')" data-index="name" :width="160">
            <template #cell="{ record }">
              <span style="font-weight: 600">{{ record.name }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('pat.tableScopes')" :width="240">
            <template #cell="{ record }">
              <template v-if="record.scopes?.length">
                <a-tag
                  v-for="s in record.scopes.slice(0, 3)"
                  :key="s"
                  size="small"
                  class="scope-tag"
                >
                  {{ s }}
                </a-tag>
                <a-popover v-if="record.scopes.length > 3" position="top">
                  <a-tag size="small" class="scope-tag">
                    {{ t('pat.moreScopes', { n: record.scopes.length - 3 }) }}
                  </a-tag>
                  <template #content>
                    <div class="scope-popover">
                      <a-tag v-for="s in record.scopes" :key="s" size="small">{{ s }}</a-tag>
                    </div>
                  </template>
                </a-popover>
              </template>
              <span v-else style="color: var(--color-text-4)">--</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('pat.tableStatus')" :width="90" align="center">
            <template #cell="{ record }">
              <a-tag v-if="record.status === 0" color="red">{{ t('pat.statusRevoked') }}</a-tag>
              <a-tag v-else-if="isExpired(record)" color="gray">{{ t('pat.statusExpired') }}</a-tag>
              <a-tag v-else color="green">{{ t('pat.statusActive') }}</a-tag>
            </template>
          </a-table-column>

          <a-table-column :title="t('pat.tableExpiresAt')" :width="140">
            <template #cell="{ record }">
              <a-tag v-if="record.status !== 0 && isExpired(record)" color="red" size="small">
                {{ t('pat.statusExpired') }}
              </a-tag>
              <template v-else-if="record.status !== 0">
                <a-tag v-if="daysLeft(record) <= 7" color="orange" size="small">
                  {{ t('pat.expiresSoon', { n: daysLeft(record) }) }}
                </a-tag>
                <span v-else>{{ dayjs(record.expires_at).format('YYYY-MM-DD') }}</span>
              </template>
              <span v-else style="color: var(--color-text-4)">--</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('pat.tableLastUsed')" :width="160">
            <template #cell="{ record }">
              <a-tooltip v-if="record.last_used_at" :content="formatTime(record.last_used_at)">
                <span>{{ dayjs(record.last_used_at).format('YYYY-MM-DD HH:mm') }}</span>
              </a-tooltip>
              <span v-else style="color: var(--color-text-4)">{{ t('pat.neverUsed') }}</span>
            </template>
          </a-table-column>

          <a-table-column :title="t('pat.tableCreatedAt')" :width="160">
            <template #cell="{ record }">
              {{ formatTime(record.created_at) }}
            </template>
          </a-table-column>

          <a-table-column :title="t('pat.tableActions')" :width="90" align="center">
            <template #cell="{ record }">
              <a-popconfirm
                v-if="record.status !== 0"
                type="warning"
                :content="t('pat.revokeConfirm', { name: record.name })"
                @ok="handleDelete(record)"
              >
                <a-button type="text" status="danger" size="small">
                  {{ t('pat.revoke') }}
                </a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- Create drawer -->
    <a-drawer
      v-model:visible="drawerVisible"
      :title="t('pat.createToken')"
      :width="520"
      unmount-on-close
      :ok-loading="submitLoading"
      @cancel="handleDrawerClose"
      @ok="handleDrawerSubmit"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item field="name" :label="t('pat.nameLabel')" validate-trigger="blur">
          <a-input
            v-model="formData.name"
            :placeholder="t('pat.namePlaceholder')"
            :max-length="128"
          />
        </a-form-item>

        <a-form-item field="scopes" :label="t('pat.scopesLabel')">
          <div class="scope-groups">
            <div v-for="[domain, actions] in scopeGroups" :key="domain" class="scope-group">
              <div class="scope-group-title">{{ domain }}</div>
              <a-checkbox-group v-model="formData.scopes" direction="vertical">
                <a-checkbox v-for="a in actions" :key="a" :value="a">
                  <span class="scope-action">{{ a }}</span>
                </a-checkbox>
              </a-checkbox-group>
            </div>
          </div>
          <template #extra>
            <span class="form-extra">{{ t('pat.scopesDesc') }}</span>
          </template>
        </a-form-item>

        <a-form-item :label="t('pat.tableExpiresAt')">
          <a-alert>{{ t('pat.expiryNote') }}</a-alert>
        </a-form-item>
      </a-form>
    </a-drawer>

    <!-- One-time token modal -->
    <a-modal
      v-model:visible="tokenModalVisible"
      :title="t('pat.tokenCreated')"
      :width="520"
      :mask-closable="false"
      :closable="false"
      :footer="false"
    >
      <a-alert type="warning" style="margin-bottom: 16px">{{ t('pat.tokenWarning') }}</a-alert>
      <a-input :model-value="createdToken" readonly class="token-input" />
      <div style="margin-top: 16px; text-align: end">
        <a-space>
          <a-button v-if="copyFailed" @click="closeTokenModal">
            {{ t('pat.confirmedCopied') }}
          </a-button>
          <a-button type="primary" @click="copyAndClose">{{ t('pat.copyAndClose') }}</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import { patApi } from '@/api/pat'
import { useCrud } from '@/composables/use-crud'
import { useUserStore } from '@/store/modules/user'
import { formatTime } from '@/utils/format'
import { copyToClipboard } from '@/utils/clipboard'
import type { PatToken } from '@/types'

const { t } = useI18n()
const userStore = useUserStore()

// One-time token reveal modal (unique to this view)
const tokenModalVisible = ref(false)
const createdToken = ref('')
const copyFailed = ref(false)

const {
  loading,
  filteredList,
  drawerVisible,
  submitLoading,
  formRef,
  formData,
  fetchData,
  handleCreate,
  handleDrawerClose,
  handleDrawerSubmit,
  handleDelete,
  hideDrawer,
} = useCrud<PatToken & Record<string, unknown>>({
  fetchApi: patApi.list,
  createApi: patApi.create as (data: Partial<PatToken>) => Promise<{
    data: Record<string, unknown>
  }>,
  deleteApi: patApi.revoke,
  idField: 'id',
  fetchErrorMsg: t('pat.fetchFail'),
  deleteErrorMsg: t('pat.revokeFail'),
  deleteSuccessMsg: t('pat.revokeSuccess'),
  defaultForm: () => ({ name: '', scopes: [] }),
  onCreated: async (responseData) => {
    hideDrawer()
    createdToken.value = (responseData as { token: string }).token
    copyFailed.value = false
    tokenModalVisible.value = true
  },
  errorCodeMap: {
    invalid_scope: 'pat.errorScopeExceeded',
    invalid_request: 'pat.nameRequired',
  },
})

const formRules = {
  name: [{ required: true, message: t('pat.nameRequired') }],
  scopes: [
    {
      validator: (value: string[], cb: (error?: string) => void) => {
        cb(value?.length ? undefined : t('pat.scopesRequired'))
      },
    },
  ],
}

// PAT scopes 必须是调用者有效权限的子集（后端校验），前端直接以权限全集作数据源
const scopeGroups = computed(() => {
  const groups: Record<string, string[]> = {}
  for (const p of userStore.permissions) {
    const [domain] = p.split(':')
    ;(groups[domain] ??= []).push(p)
  }
  for (const actions of Object.values(groups)) actions.sort()
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

function isExpired(record: PatToken) {
  return dayjs(record.expires_at).isBefore(dayjs())
}

function daysLeft(record: PatToken) {
  return dayjs(record.expires_at).diff(dayjs(), 'day')
}

async function copyAndClose() {
  try {
    await copyToClipboard(createdToken.value)
    Message.success(t('pat.tokenCopied'))
    closeTokenModal()
  } catch {
    copyFailed.value = true
    Message.error(t('pat.copyFailManual'))
  }
}

function closeTokenModal() {
  tokenModalVisible.value = false
  createdToken.value = ''
  copyFailed.value = false
}
</script>

<style scoped lang="less">
.card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-desc {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-3);
}

.scope-tag {
  font-family: monospace;
  margin-right: 4px;
}

.scope-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 320px;
}

.scope-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.scope-group-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
  margin-bottom: 4px;
}

.scope-action {
  font-family: monospace;
  font-size: 12px;
}

.form-extra {
  font-size: 12px;
  color: var(--color-text-4);
}

.token-input {
  font-family: monospace;
}
</style>
