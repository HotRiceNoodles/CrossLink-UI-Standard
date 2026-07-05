<template>
  <div class="home-page">
    <HomeHeader />

    <section class="hero">
      <DataPlaneCanvas class="hero-bg" />
      <div class="hero-content">
        <div class="eyebrow">{{ t('home.eyebrow') }}</div>
        <h1 class="hero-title">{{ t('home.title') }}</h1>
        <p class="hero-subtitle">{{ t('home.subtitle') }}</p>
        <div class="hero-cta">
          <a-button type="primary" size="large" @click="goLogin">
            {{ t('home.cta.primary') }}
          </a-button>
          <a-button size="large" @click="openRepo">
            {{ t('home.cta.github') }}
          </a-button>
        </div>
      </div>
    </section>

    <section class="capability-band">
      <CapabilityCards />
    </section>

    <ProviderDocs />

    <HomeFooter />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HomeHeader from './components/home-header.vue'
import DataPlaneCanvas from './components/data-plane-canvas.vue'
import CapabilityCards from './components/capability-cards.vue'
import ProviderDocs from './components/provider-docs.vue'
import HomeFooter from './components/home-footer.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const WEB_REPO = 'https://github.com/HotRiceNoodles/CrossLink'

function goLogin() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
  void router.push({ name: 'login', query: redirect ? { redirect } : undefined })
}

function openRepo() {
  window.open(WEB_REPO, '_blank', 'noopener')
}
</script>

<style scoped lang="less">
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-1);
}

.hero {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 80px 40px;
}

.hero-bg {
  position: absolute;
  inset: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  text-align: center;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--arcoblue-6));
  font-weight: 600;
}

.hero-title {
  margin: 16px 0 0;
  font-size: 40px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--color-text-1);
}

.hero-subtitle {
  margin: 20px auto 0;
  max-width: 620px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text-2);
}

.hero-cta {
  margin-top: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.capability-band {
  position: relative;
  z-index: 2;
  padding: 56px 40px;
  background: var(--color-bg-1);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 30px;
  }

  .hero,
  .capability-band {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
