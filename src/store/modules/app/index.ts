import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark'>('light')
  const navbar = ref(true)
  const menu = ref(true)
  const menuCollapse = ref(false)
  const menuWidth = ref(240)
  const footer = ref(false)
  const device = ref<'desktop' | 'mobile'>('desktop')

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
    Object.assign({ theme, navbar, menu, menuCollapse, menuWidth, footer, device }, settings)
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
