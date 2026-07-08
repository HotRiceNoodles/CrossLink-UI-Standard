import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: 'mcp',
  name: 'mcp',
  redirect: { name: 'mcpServers' },
  component: () => import('@/layout/blank-layout.vue'),
  meta: { menuKey: 'mcp', icon: 'icon-link', order: 4, isMenuGroup: true },
  children: [
    {
      path: 'servers',
      name: 'mcpServers',
      component: () => import('@/views/mcp/index.vue'),
      meta: {
        menuKey: 'mcpServers',
        icon: 'icon-link',
        requiredPermission: 'mcp:list',
      },
    },
    {
      path: ':id',
      name: 'mcpDetail',
      component: () => import('@/views/mcp/detail.vue'),
      meta: {
        requiredPermission: 'mcp:view',
        hideInMenu: true,
      },
    },
  ],
}

export default route
