<template>
  <div class="login-page">
    <div class="login-banner">
      <div class="banner-content">
        <div class="banner-logo">
          <img src="@/assets/images/CrossLinkLogo.png" alt="CrossLink" class="logo-img" />
          <span class="logo-text">CrossLink</span>
        </div>
        <h1 class="banner-title">{{ t('login.bannerTitle1') }}</h1>
        <h1 class="banner-title">{{ t('login.bannerTitle2') }}</h1>
        <p class="banner-desc">{{ t('login.bannerDesc') }}</p>
        <div class="banner-decoration">
          <div class="deco-circle deco-circle-1" />
          <div class="deco-circle deco-circle-2" />
          <div class="deco-circle deco-circle-3" />
          <div class="deco-line deco-line-1" />
          <div class="deco-line deco-line-2" />
        </div>
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
  background: linear-gradient(135deg, #0e42d2, #165dff, #4080ff);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.banner-content {
  position: relative;
  z-index: 1;
  padding: 60px;
  color: #fff;
}

.banner-logo {
  display: flex;
  align-items: center;
  margin-bottom: 48px;
}

.logo-img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  padding: 4px;
  box-sizing: content-box;
}

.logo-text {
  margin-inline-start: 12px;
  font-size: 18px;
  font-weight: 600;
}

.banner-title {
  font-size: 36px;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}

.banner-desc {
  font-size: 16px;
  opacity: 0.8;
  margin-top: 16px;
}

.banner-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.deco-circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.deco-circle-2 {
  width: 200px;
  height: 200px;
  bottom: 80px;
  left: 80px;
}

.deco-circle-3 {
  width: 100px;
  height: 100px;
  top: 40%;
  right: 20%;
  background: rgba(255, 255, 255, 0.05);
}

.deco-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
}

.deco-line-1 {
  width: 300px;
  top: 30%;
  left: 10%;
  transform: rotate(-15deg);
}

.deco-line-2 {
  width: 200px;
  bottom: 25%;
  right: 15%;
  transform: rotate(25deg);
}

.login-form-wrapper {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
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
