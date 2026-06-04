import { get, post, put, del } from './interceptor'
import type {
  Role,
  RoleCreateRequest,
  RoleUpdateRequest,
  AuthUser,
  UserCreateRequest,
  UserUpdateRequest,
  Team,
  TeamCreateRequest,
  TeamMember,
  Organization,
  OrganizationCreateRequest,
  OrgMember,
  OrgBudget,
} from '@/types/auth-module'

export const roleApi = {
  list: () => get<Role[]>('/roles'),
  detail: (id: number) => get<Role>(`/roles/${id}`),
  create: (data: RoleCreateRequest) => post('/roles', data),
  update: (id: number, data: RoleUpdateRequest) => put(`/roles/${id}`, data),
  delete: (id: number) => del(`/roles/${id}`),
}

export const authUserApi = {
  list: () => get<AuthUser[]>('/users'),
  create: (data: UserCreateRequest) => post('/users', data),
  update: (id: number, data: UserUpdateRequest) => put(`/users/${id}`, data),
  changePassword: (id: number, data: { old_password?: string; new_password: string }) =>
    put(`/users/${id}/password`, data),
  delete: (id: number) => del(`/users/${id}`),
}

export const teamApi = {
  list: () => get<Team[]>('/teams'),
  create: (data: TeamCreateRequest) => post('/teams', data),
  update: (id: number, data: Partial<TeamCreateRequest>) => put(`/teams/${id}`, data),
  delete: (id: number) => del(`/teams/${id}`),
  members: (id: number) => get<TeamMember[]>(`/teams/${id}/members`),
  addMember: (id: number, data: { user_id: number; role: string }) =>
    post(`/teams/${id}/members`, data),
  removeMember: (id: number, uid: number) => del(`/teams/${id}/members/${uid}`),
}

export const orgApi = {
  list: () => get<Organization[]>('/organizations'),
  detail: (id: number) => get<Organization>(`/organizations/${id}`),
  create: (data: OrganizationCreateRequest) => post('/organizations', data),
  update: (id: number, data: Partial<OrganizationCreateRequest>) =>
    put(`/organizations/${id}`, data),
  delete: (id: number) => del(`/organizations/${id}`),
  members: (id: number) => get<OrgMember[]>(`/organizations/${id}/members`),
  addMember: (id: number, data: { user_id: number; role: string }) =>
    post(`/organizations/${id}/members`, data),
  updateMember: (id: number, uid: number, data: { role: string }) =>
    put(`/organizations/${id}/members/${uid}`, data),
  removeMember: (id: number, uid: number) => del(`/organizations/${id}/members/${uid}`),
  budget: (id: number) => get<OrgBudget>(`/organizations/${id}/budget`),
  calibrateBudget: (id: number) => post(`/organizations/${id}/budget/calibrate`),
}
