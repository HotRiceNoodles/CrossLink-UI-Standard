<template>
  <footer class="home-footer">
    <div class="left">
      <span class="wordmark">CrossLink</span>
      <span class="meta">v{{ version }}</span>
      <span class="meta">Apache-2.0</span>
    </div>
    <div class="right">
      <a :href="REPO_URL" target="_blank" rel="noopener">GitHub</a>
      <a :href="LICENSE_URL" target="_blank" rel="noopener">{{ t('home.footer.license') }}</a>
      <span class="meta">© 2026 CrossLink</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const version = __APP_VERSION__

const REPO_URL = 'https://github.com/HotRiceNoodles/CrossLink'
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`
</script>

<style scoped lang="less">
.home-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 40px;
  border-top: 1px solid var(--color-fill-2);
  font-size: 12px;
  color: var(--color-text-4);
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.wordmark {
  font-weight: 600;
  color: var(--color-text-2);
}

.meta {
  color: var(--color-text-4);
}

a {
  color: var(--color-text-3);
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: rgb(var(--arcoblue-6));
  }
}

@media (max-width: 768px) {
  .home-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
