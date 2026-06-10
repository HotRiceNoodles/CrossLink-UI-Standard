import { ref, computed, onMounted } from 'vue'
import { authUserApi, teamApi } from '@/api/rbac'
import type { Team, AuthUser, TeamMember } from '@/types/auth-module'

/**
 * 统一的表格行类型 — 两种视图的数据都映射为此类型
 */
export interface UserRow {
  id: number
  username: string
  display_name: string
  global_role: { id: number; name: string; display_name: string } | null
  status: number
  team_role: string | null
  team_name: string | null
  created_at: string
}

/**
 * 管理成员页面左右面板联动状态
 */
export function useTeamUsers() {
  // ─── 团队列表 ───
  const teams = ref<Team[]>([])
  const loadingTeams = ref(false)

  // ─── 当前选中：null = 全部成员（默认），number = 团队 ID ───
  const selectedTeamId = ref<number | null>(null)
  const selectedTeam = computed(
    () => teams.value.find((t) => t.id === selectedTeamId.value) ?? null,
  )

  // ─── 视图模式（驱动 user-table 列配置切换）───
  const viewMode = computed<'all' | 'team'>(() => (selectedTeamId.value === null ? 'all' : 'team'))

  // ─── 用户行数据 ───
  const userRows = ref<UserRow[]>([])
  const loadingUsers = ref(false)

  // ─── 刷新团队列表 ───
  async function refreshTeams() {
    loadingTeams.value = true
    try {
      const res = await teamApi.list()
      teams.value = res.data
    } catch {
      // let caller handle error display
    } finally {
      loadingTeams.value = false
    }
  }

  // ─── 刷新用户列表（根据 viewMode 分支）───
  async function refreshUsers() {
    loadingUsers.value = true
    try {
      if (selectedTeamId.value === null) {
        // 全部成员 → GET /users
        const res = await authUserApi.list()
        userRows.value = mapAuthUsers(res.data)
      } else {
        // 团队成员 → GET /teams/:id/members
        const res = await teamApi.members(selectedTeamId.value)
        const team = selectedTeam.value
        userRows.value = mapTeamMembers(res.data, team?.display_name ?? null)
      }
    } catch {
      // let caller handle error display
    } finally {
      loadingUsers.value = false
    }
  }

  // ─── 数据映射 ───
  function mapAuthUsers(users: AuthUser[]): UserRow[] {
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      global_role: u.role ?? null,
      status: u.status,
      team_role: u.team_role,
      team_name: u.team_name,
      created_at: u.created_at,
    }))
  }

  function mapTeamMembers(members: TeamMember[], teamDisplayName: string | null): UserRow[] {
    return members
      .filter((m) => m.user && m.user.id)
      .map((m) => ({
        id: m.user.id,
        username: m.user.username,
        display_name: m.user.display_name,
        global_role: m.user.role ?? null,
        status: m.user.status,
        team_role: m.role,
        team_name: teamDisplayName,
        created_at: m.user.created_at,
      }))
  }

  // ─── 操作 ───
  function selectTeam(id: number | null) {
    selectedTeamId.value = id
    refreshUsers()
  }

  async function refreshAll() {
    await Promise.all([refreshTeams(), refreshUsers()])
  }

  // ─── 初始化 ───
  onMounted(() => refreshAll())

  return {
    // State
    teams,
    selectedTeamId,
    selectedTeam,
    viewMode,
    userRows,
    loadingTeams,
    loadingUsers,
    // Methods
    selectTeam,
    refreshTeams,
    refreshUsers,
    refreshAll,
  }
}
