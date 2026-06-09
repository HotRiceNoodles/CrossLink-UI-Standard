// 角色
export interface Role {
  id: number
  name: string
  display_name: string
  is_system: boolean
  permissions: string[]
  user_count: number
  created_at: string
}
export interface RoleCreateRequest {
  name: string
  display_name: string
  permissions: string[]
}
export interface RoleUpdateRequest {
  display_name?: string
  permissions?: string[]
}

// 用户
export interface AuthUser {
  id: number
  username: string
  display_name: string
  role_id: number
  role: { id: number; name: string; display_name: string }
  status: number
  email?: string
  last_login_at?: string
  created_at: string
  team_id: number | null
  team_name: string | null
  team_role: string | null
}
export interface UserCreateRequest {
  username: string
  password: string
  display_name: string
  role_id: number
}
export interface UserUpdateRequest {
  display_name?: string
  role_id?: number
  status?: number
}
export interface UserCreateWithTeamRequest extends UserCreateRequest {
  team_id?: number | null
  team_role?: string
}

// 团队
export interface Team {
  id: number
  name: string
  display_name: string
  description: string
  budget_limit: number | null
  budget_period: string
  rpm_limit: number
  tpm_limit: number
  status: number
  created_at: string
  member_count: number
}
export interface TeamCreateRequest {
  name: string
  display_name: string
  description?: string
  budget_limit?: number | null
  budget_period?: string
  rpm_limit?: number
  tpm_limit?: number
}
export interface TeamMember {
  id: number
  team_id: number
  user_id: number
  role: string
  joined_at: string
  user: {
    id: number
    username: string
    display_name: string
    role_id: number
    role: {
      id: number
      name: string
      display_name: string
    }
    status: number
    email?: string
    last_login_at?: string
    created_at: string
  }
}

// 组织
export interface Organization {
  id: number
  name: string
  display_name: string
  description: string
  budget_limit: number | null
  budget_period: string
  rpm_limit: number
  tpm_limit: number
  status: number
  member_count?: number
  team_count?: number
  key_count?: number
  created_at: string
}
export interface OrganizationCreateRequest {
  name: string
  display_name: string
  description?: string
  budget_limit?: number | null
  budget_period?: string
  rpm_limit?: number
  tpm_limit?: number
  admin_email?: string
}
export interface AdminCredentials {
  username: string
  password: string
  email: string
  email_sent: boolean
}
export interface OrgMember {
  id: number
  user_id: number
  username: string
  display_name: string
  role: string
  joined_at: string
}
export interface OrgBudget {
  budget_limit: number
  budget_period: string
  spent: number
  remaining: number
  usage_pct: number
}
