import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { loadPersistedSettings, persistSettings } from '../../plugins/persist'

export const useAppStore = defineStore('app', () => {
  const persisted = loadPersistedSettings()
  const theme = ref<'light' | 'dark'>((persisted.theme as 'light' | 'dark') ?? 'light')
  const navbar = ref(true)
  const menu = ref(true)
  const menuCollapse = ref((persisted.menuCollapse as boolean) ?? false)
  const menuWidth = ref(240)
  const footer = ref(false)
  const device = ref<'desktop' | 'mobile'>('desktop')

  watch([theme, menuCollapse], () => {
    persistSettings({ theme: theme.value, menuCollapse: menuCollapse.value })
  })

  function toggleMenuCollapse() {
    menuCollapse.value = !menuCollapse.value
  }

  function updateSettings(settings: Partial<{
    theme: 'light' | 'dark'
    navbar: boolean
    menu: boolean
    menuCollapse: boolean
    menuWidth: number
    footer: boolean
    device: 'desktop' | 'mobile'
  }>) {
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && key in { theme, navbar, menu, menuCollapse, menuWidth, footer, device }) {
        (this as any)[key].value = value
      }
    })
  }

  return {
    theme,
    navbar,
    menu,
    menuCollapse,
    menuWidth,
    footer,
    device,
    toggleMenuCollapse,
    updateSettings,
  }
})
