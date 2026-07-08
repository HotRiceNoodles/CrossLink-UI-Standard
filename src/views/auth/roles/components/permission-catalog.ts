export interface PermissionGroup {
  key: string
  labelI18nKey: string
  actions: string[]
}

export const permissionCatalog: PermissionGroup[] = [
  {
    key: 'system',
    labelI18nKey: 'auth.permissions.system',
    actions: [
      'system:password',
      'system:view',
      'system:update',
      'license:view',
      'license:manage',
      'playground:use',
      'insight:manage',
    ],
  },
  {
    key: 'provider',
    labelI18nKey: 'auth.permissions.provider',
    actions: [
      'provider:list',
      'provider:create',
      'provider:update',
      'provider:delete',
      'provider:test',
    ],
  },
  {
    key: 'model',
    labelI18nKey: 'auth.permissions.model',
    actions: ['model:list', 'model:create', 'model:update', 'model:delete'],
  },
  {
    key: 'key',
    labelI18nKey: 'auth.permissions.key',
    actions: [
      'key:list',
      'key:create',
      'key:update',
      'key:delete',
      'key:regenerate',
      'key:rotate',
      'key:hashes',
    ],
  },
  {
    key: 'user',
    labelI18nKey: 'auth.permissions.user',
    actions: ['user:list', 'user:create', 'user:update', 'user:delete'],
  },
  {
    key: 'team',
    labelI18nKey: 'auth.permissions.team',
    actions: ['team:list', 'team:create', 'team:update', 'team:delete', 'team:manage_members'],
  },
  {
    key: 'org',
    labelI18nKey: 'auth.permissions.org',
    actions: [
      'org:list',
      'org:create',
      'org:update',
      'org:delete',
      'org:manage_members',
      'org:view_billing',
      'org:manage_billing',
    ],
  },
  {
    key: 'ops',
    labelI18nKey: 'auth.permissions.ops',
    actions: [
      'usage:list',
      'usage:stats',
      'usage:export',
      'debug:list',
      'debug:clear',
      'audit:list',
      'audit:export',
      'budget:manage',
      'routing:stats',
    ],
  },
  {
    key: 'security',
    labelI18nKey: 'auth.permissions.security',
    actions: [
      'guardrail:list',
      'guardrail:create',
      'guardrail:update',
      'guardrail:delete',
      'guardrail:test',
      'guardrail_alert:list',
      'guardrail_alert:create',
      'guardrail_alert:update',
      'guardrail_alert:delete',
      'guardrail_alert:logs',
      'secret:test',
      'secret:manage',
      'agent_shield:view',
      'agent_shield:manage',
      'fingerprint:list',
      'fingerprint:view',
      'fingerprint:manage',
    ],
  },
  {
    key: 'role',
    labelI18nKey: 'auth.permissions.role',
    actions: ['role:list', 'role:create', 'role:update', 'role:delete'],
  },
  {
    key: 'mcp',
    labelI18nKey: 'auth.permissions.mcp',
    actions: [
      'mcp:list',
      'mcp:view',
      'mcp:create',
      'mcp:update',
      'mcp:delete',
      'mcp:permission',
      'mcp:logs',
      'mcp:stats',
    ],
  },
  {
    key: 'errorRule',
    labelI18nKey: 'auth.permissions.errorRule',
    actions: ['error_rule:list', 'error_rule:create', 'error_rule:update', 'error_rule:delete'],
  },
]
