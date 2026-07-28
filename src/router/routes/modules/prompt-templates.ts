import type { RouteRecordRaw } from 'vue-router'

// 提示词模板（Context Engineering）。community tier 可用。
// menuKey 必须与 menu.<key> 逐字符相同（sidebar.vue 用 t(`menu.${menuKey}`)）。
// icon 必须是 main.ts icons[] 数组里已注册的 Arco 图标名。
const route: RouteRecordRaw = {
  path: 'prompt-templates',
  name: 'promptTemplates',
  component: () => import('@/views/prompt-templates/index.vue'),
  meta: {
    menuKey: 'promptTemplates',
    icon: 'icon-mind-mapping',
    order: 10,
    requiredPermission: 'template:list',
    // 不设 requiredTier —— community 即可用
  },
}

export default route
