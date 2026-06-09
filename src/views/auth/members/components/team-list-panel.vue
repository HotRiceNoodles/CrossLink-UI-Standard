<template>
  <div class="team-list-panel">
    <!-- Search -->
    <div class="panel-search">
      <a-input
        v-model="searchKeyword"
        :placeholder="t('auth.members.searchTeam')"
        allow-clear
        size="small"
      >
        <template #prefix><icon-search /></template>
      </a-input>
    </div>

    <!-- Team list -->
    <div class="team-list">
      <!-- All members entry -->
      <div
        class="team-item"
        :class="{ active: selectedTeamId === null }"
        @click="emit('select', null)"
      >
        <div class="team-item-content">
          <icon-user-group class="team-item-icon" />
          <span class="team-item-name">{{ t('auth.members.allMembers') }}</span>
        </div>
      </div>

      <a-divider style="margin: 4px 0" />

      <!-- Team items -->
      <div
        v-for="team in filteredTeams"
        :key="team.id"
        class="team-item"
        :class="{ active: selectedTeamId === team.id }"
        @click="emit('select', team.id)"
      >
        <div class="team-item-content">
          <span class="team-item-name">{{ team.display_name }}</span>
          <span class="team-item-count">{{ team.member_count }}</span>
        </div>
      </div>

      <a-empty v-if="filteredTeams.length === 0 && !loading" style="margin-top: 24px" />
    </div>

    <!-- Create team button -->
    <div class="panel-footer">
      <a-button long type="primary" @click="emit('create')">
        <template #icon><icon-plus /></template>
        {{ t('auth.members.createTeam') }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Team } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  teams: Team[]
  selectedTeamId: number | null
  loading: boolean
}>()

const emit = defineEmits<{
  select: [id: number | null]
  create: []
}>()

const searchKeyword = ref('')

const filteredTeams = computed(() => {
  if (!searchKeyword.value) return props.teams
  const kw = searchKeyword.value.toLowerCase()
  return props.teams.filter(
    (t) => t.name.toLowerCase().includes(kw) || t.display_name.toLowerCase().includes(kw),
  )
})
</script>

<style scoped lang="less">
.team-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
}

.panel-search {
  margin-bottom: 8px;
}

.team-list {
  flex: 1;
  overflow-y: auto;
}

.team-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 2px;

  &:hover {
    background-color: var(--color-fill-2);
  }

  &.active {
    background-color: rgb(var(--arcoblue-1));

    .team-item-name {
      color: rgb(var(--arcoblue-6));
      font-weight: 600;
    }

    .team-item-count {
      color: rgb(var(--arcoblue-6));
    }
  }
}

.team-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.team-item-icon {
  font-size: 16px;
  flex-shrink: 0;
  color: var(--color-text-2);
}

.team-item-name {
  font-size: 13px;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-item-count {
  font-size: 12px;
  color: var(--color-text-3);
  flex-shrink: 0;
  background: var(--color-fill-2);
  padding: 0 6px;
  border-radius: 10px;
  line-height: 18px;
}

.panel-footer {
  padding-top: 12px;
  border-top: 1px solid var(--color-fill-2);
  margin-top: 8px;
}
</style>
