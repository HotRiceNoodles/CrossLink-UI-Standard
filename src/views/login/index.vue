<template>
  <div class="login-page">
    <div class="login-banner">
      <DataPlaneCanvas
        class="banner-canvas"
        edge-color="rgba(255, 255, 255, 0.12)"
        light-color="rgba(37, 205, 237, 0.85)"
        node-color="rgba(255, 255, 255, 0.8)"
        glow-color="rgba(76, 127, 232, 0.35)"
      />
      <div class="banner-content">
        <div class="banner-logo">
          <img src="@/assets/images/logo.svg" alt="CrossLink" class="logo-img" />
          <span class="logo-text">CrossLink</span>
        </div>
        <h1 class="banner-title">
          {{ t('login.bannerTitle1') }}
          <br />
          {{ t('login.bannerTitle2') }}
        </h1>
        <p class="banner-desc">{{ t('login.bannerDesc') }}</p>
      </div>
    </div>
    <div class="login-form-wrapper">
      <div class="login-form-container">
        <LoginForm v-if="!forceChangeMode" @force-change="onForceChange" />
        <ForceChangePassword v-else @cancel="onCancelForceChange" />
      </div>
      <div class="login-footer">
        <span>&copy; 2025-2026 CrossLink</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LoginForm from './components/login-form.vue'
import ForceChangePassword from './components/force-change-password.vue'
import DataPlaneCanvas from '@/views/home/components/data-plane-canvas.vue'

const { t } = useI18n()
const route = useRoute()

const forceChangeMode = ref(false)

function onForceChange() {
  forceChangeMode.value = true
}

function onCancelForceChange() {
  forceChangeMode.value = false
}

// Handle redirect from 403 interceptor: user already has token but needs to change password
onMounted(() => {
  if (route.query.force_change === 'true') {
    forceChangeMode.value = true
  }
})
</script>

<style scoped lang="less">
.login-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.login-banner {
  flex: 0 0 60%;
  // 深蓝底：品牌色 9 档过渡到近黑深蓝，尾部一丝 logo 紫
  background: linear-gradient(155deg, rgb(var(--cl-primary-9)) 0%, #0b1a4a 55%, #1c1550 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.banner-canvas {
  opacity: 0.9;
}

.banner-content {
  position: relative;
  z-index: 1;
  padding: 60px;
  color: #fff;
  max-width: 560px;
}

.banner-logo {
  display: flex;
  align-items: center;
  margin-bottom: 48px;
}

.logo-img {
  width: 44px;
  height: 44px;
}

.logo-text {
  margin-inline-start: 12px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.92;
}

.banner-title {
  font-size: 34px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0;
  letter-spacing: 0.01em;
}

.banner-desc {
  font-size: 15px;
  line-height: 1.8;
  opacity: 0.72;
  margin-top: 20px;
  max-width: 40em;
}

.login-form-wrapper {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-1);
  position: relative;
}

.login-form-container {
  width: 400px;
  padding: 0 32px;
}

.login-footer {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: var(--color-text-4);
}
</style>
