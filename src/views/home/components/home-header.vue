<template>
  <header class="home-header">
    <div class="brand">
      <img src="@/assets/images/CrossLinkLogo.png" alt="CrossLink" class="logo" />
      <span class="wordmark">CrossLink</span>
    </div>
    <div class="actions">
      <LanguageSwitch :current-locale="currentLocale" @change="onLanguageChange" />
      <a-button type="primary" @click="onPrimary">
        {{ loggedIn ? t('home.cta.primary') : t('home.signIn') }}
      </a-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitch from '@/layout/components/language-switch.vue'
import { changeLanguage, getCurrentLocale } from '@/locale'
import { isLogin } from '@/utils/auth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const currentLocale = ref(getCurrentLocale())
const loggedIn = ref(isLogin())

function onLanguageChange(lang: string) {
  changeLanguage(lang)
  currentLocale.value = lang
}

function onPrimary() {
  if (loggedIn.value) {
    // Root path delegates to the guard/tier logic, which picks the right
    // dashboard (community dashboard vs. enterprise global dashboard).
    void router.push('/')
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  void router.push({ name: 'login', query: redirect ? { redirect } : undefined })
}
</script>

<style scoped lang="less">
.home-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.wordmark {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
