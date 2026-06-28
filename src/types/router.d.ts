import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    menuKey?: string
    icon?: string
    order?: number
    isMenuGroup?: boolean
    requiredTier?: string | string[]
    requiresOrg?: boolean
    requiresPlatformAdmin?: boolean
    requiredPermission?: string
    hideInMenu?: boolean
  }
}
