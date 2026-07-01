import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'
import { loadPersistedSettings, persistSettings } from '../../plugins/persist'

export const useAppStore = defineStore('app', () => {
  const persisted = loadPersistedSettings()
  const navbar = ref(true)
  const menu = ref(true)
  const menuCollapse = ref((persisted.menuCollapse as boolean) ?? false)
  const menuWidth = ref(240)
  const footer = ref(false)
  const device = ref<'desktop' | 'mobile'>('desktop')

  watch([menuCollapse], () => {
    persistSettings({ menuCollapse: menuCollapse.value })
  })

  function toggleMenuCollapse() {
    menuCollapse.value = !menuCollapse.value
  }

  function updateSettings(
    settings: Partial<{
      navbar: boolean
      menu: boolean
      menuCollapse: boolean
      menuWidth: number
      footer: boolean
      device: 'desktop' | 'mobile'
    }>,
  ) {
    // Explicit ref map so TypeScript can verify every key maps to a real ref.
    const refs: Record<string, Ref<unknown>> = {
      navbar,
      menu,
      menuCollapse,
      menuWidth,
      footer,
      device,
    }
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && key in refs) {
        refs[key].value = value
      }
    })
  }

  return {
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
