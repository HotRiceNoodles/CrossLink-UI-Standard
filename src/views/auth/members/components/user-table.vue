<template>
  <div class="user-table-wrapper">
    <!-- Toolbar -->
    <a-row justify="space-between" align="center" style="margin-bottom: 16px">
      <a-col>
        <a-input
          v-model="searchKeyword"
          :placeholder="t('auth.members.searchUser')"
          allow-clear
          size="small"
          style="width: 200px"
        >
          <template #prefix><icon-search /></template>
        </a-input>
      </a-col>
      <a-col>
        <a-space>
          <a-button
            v-if="userStore.hasPermission('user:create')"
            type="primary"
            size="small"
            @click="emit('addUser')"
          >
            <template #icon><icon-plus /></template>
            {{ t('auth.members.addUser') }}
          </a-button>
          <a-tooltip :content="t('common.refresh')">
            <a-button size="small" @click="emit('refresh')">
              <template #icon><icon-refresh /></template>
            </a-button>
          </a-tooltip>
        </a-space>
      </a-col>
    </a-row>

    <!-- Table -->
    <a-table
      :data="filteredRows"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      size="small"
      :bordered="false"
      @page-change="(page: number) => (pagination.current = page)"
      @page-size-change="
        (pageSize: number) => {
          pagination.pageSize = pageSize
          pagination.current = 1
        }
      "
    >
      <template #columns>
        <a-table-column :title="t('auth.users.tableUsername')" data-index="username" :width="130">
          <template #cell="{ record }">
            <span style="font-weight: 600">{{ record.username }}</span>
          </template>
        </a-table-column>

        <a-table-column
          :title="t('auth.users.tableDisplayName')"
          data-index="display_name"
          :width="130"
        />

        <!-- Global role (all members view) -->
        <a-table-column
          v-if="viewMode === 'all'"
          :title="t('auth.users.tableRole')"
          :width="110"
          align="center"
        >
          <template #cell="{ record }">
            <a-tag v-if="record.global_role" color="arcoblue">
              {{ record.global_role.display_name }}
            </a-tag>
          </template>
        </a-table-column>

        <!-- Team role (team view) -->
        <a-table-column
          v-if="viewMode === 'team'"
          :title="t('auth.members.tableTeamRole')"
          :width="100"
          align="center"
        >
          <template #cell="{ record }">
            <a-tag :color="record.team_role === 'leader' ? 'blue' : 'arcoblue'">
              {{
                record.team_role === 'leader'
                  ? t('auth.teams.roleLeader')
                  : t('auth.teams.roleMember')
              }}
            </a-tag>
          </template>
        </a-table-column>

        <!-- Team name (all members view) -->
        <a-table-column
          v-if="viewMode === 'all'"
          :title="t('auth.members.tableTeam')"
          :width="120"
          align="center"
        >
          <template #cell="{ record }">
            <a-tag v-if="record.team_name" color="arcoblue">{{ record.team_name }}</a-tag>
            <a-tag v-else color="orangered">{{ t('auth.members.noTeam') }}</a-tag>
          </template>
        </a-table-column>

        <!-- Status -->
        <a-table-column
          :title="t('auth.users.tableStatus')"
          data-index="status"
          :width="80"
          align="center"
        >
          <template #cell="{ record }">
            <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
              {{ record.status === 1 ? t('common.enabled') : t('common.disabled') }}
            </a-tag>
          </template>
        </a-table-column>

        <!-- Actions -->
        <a-table-column :title="t('common.actions')" :width="240" fixed="right">
          <template #cell="{ record }">
            <a-space :size="4">
              <a-button
                v-if="userStore.hasPermission('user:update')"
                type="text"
                size="small"
                @click="emit('edit', record)"
              >
                {{ t('common.edit') }}
              </a-button>
              <a-button
                v-if="userStore.hasPermission('user:update')"
                type="text"
                size="small"
                @click="emit('resetPassword', record)"
              >
                {{ t('auth.users.resetPassword') }}
              </a-button>
              <!-- Team view: remove from team -->
              <a-button
                v-if="viewMode === 'team' && userStore.hasPermission('team:manage_members')"
                type="text"
                size="small"
                status="warning"
                @click="emit('removeFromTeam', record)"
              >
                {{ t('auth.members.removeFromTeam') }}
              </a-button>
              <!-- All members view: assign to team (unassigned users) -->
              <a-button
                v-if="
                  viewMode === 'all' &&
                  !record.team_name &&
                  userStore.hasPermission('team:manage_members')
                "
                type="text"
                size="small"
                @click="emit('assignToTeam', record)"
              >
                {{ t('auth.members.assignToTeam') }}
              </a-button>
              <!-- All members view: move to another team -->
              <a-button
                v-if="
                  viewMode === 'all' &&
                  record.team_name &&
                  userStore.hasPermission('team:manage_members')
                "
                type="text"
                size="small"
                @click="emit('moveToTeam', record)"
              >
                {{ t('auth.members.moveToTeam') }}
              </a-button>
              <a-button
                v-if="userStore.hasPermission('user:delete')"
                type="text"
                size="small"
                status="danger"
                @click="emit('delete', record)"
              >
                {{ t('common.delete') }}
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store'
import type { Team } from '@/types'
import type { UserRow } from '@/composables/use-team-users'

const { t } = useI18n()
const userStore = useUserStore()

const props = defineProps<{
  rows: UserRow[]
  loading: boolean
  viewMode: 'all' | 'team'
  selectedTeam: Team | null
  teams: Team[]
}>()

const emit = defineEmits<{
  edit: [record: UserRow]
  delete: [record: UserRow]
  resetPassword: [record: UserRow]
  removeFromTeam: [record: UserRow]
  moveToTeam: [record: UserRow]
  assignToTeam: [record: UserRow]
  addUser: []
  refresh: []
}>()

const searchKeyword = ref('')

const filteredRows = computed(() => {
  if (!searchKeyword.value) return props.rows
  const kw = searchKeyword.value.toLowerCase()
  return props.rows.filter(
    (r) => r.username.toLowerCase().includes(kw) || r.display_name.toLowerCase().includes(kw),
  )
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  showTotal: true,
  showPageSize: true,
})
</script>

<style scoped lang="less">
.user-table-wrapper {
  :deep(.arco-table) {
    font-size: 13px;
  }
}
</style>
