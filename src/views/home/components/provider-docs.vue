<template>
  <section class="provider-docs">
    <div class="section-head">
      <h2 class="section-title">{{ t('home.docs.title') }}</h2>
      <p class="section-subtitle">{{ t('home.docs.subtitle') }}</p>
    </div>

    <div class="provider-grid">
      <div v-for="p in providers" :key="p.name" class="provider-card">
        <div class="provider-logo-wrap">
          <img :src="p.logo" :alt="p.name" class="provider-logo" />
        </div>
        <div class="provider-desc">{{ t(p.descKey) }}</div>
        <div class="provider-links">
          <a-button type="primary" size="small" :href="p.apiKeyUrl" target="_blank" rel="noopener">
            {{ t('home.docs.apiKey') }}
          </a-button>
          <a-button size="small" :href="p.docsUrl" target="_blank" rel="noopener">
            {{ t('home.docs.docs') }}
          </a-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import openaiLogo from '@/assets/images/providers/openai.png'
import anthropicLogo from '@/assets/images/providers/anthropic.png'
import geminiLogo from '@/assets/images/providers/gemini.png'
import qwenLogo from '@/assets/images/providers/qwen.png'
import deepseekLogo from '@/assets/images/providers/deepseek.png'
import glmLogo from '@/assets/images/providers/glm.png'
import minimaxLogo from '@/assets/images/providers/minimax.png'
import ernieLogo from '@/assets/images/providers/ernie.png'

const { t } = useI18n()

interface ProviderDoc {
  name: string
  logo: string
  descKey: string
  apiKeyUrl: string
  docsUrl: string
}

// Curated, hand-maintained entry points to each provider's API-key console
// and model documentation. Adapters in the app are dynamic, but these official
// links are stable enough to ship on the landing page.
// NOTE: console URLs change over time — verify periodically.
const providers: ProviderDoc[] = [
  {
    name: 'OpenAI',
    logo: openaiLogo,
    descKey: 'home.docs.desc.openai',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    name: 'Anthropic',
    logo: anthropicLogo,
    descKey: 'home.docs.desc.anthropic',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com',
  },
  {
    name: 'Gemini',
    logo: geminiLogo,
    descKey: 'home.docs.desc.gemini',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
  },
  {
    name: 'Qwen',
    logo: qwenLogo,
    descKey: 'home.docs.desc.qwen',
    apiKeyUrl: 'https://bailian.console.aliyun.com',
    docsUrl: 'https://help.aliyun.com/zh/model-studio',
  },
  {
    name: 'DeepSeek',
    logo: deepseekLogo,
    descKey: 'home.docs.desc.deepseek',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com',
  },
  {
    name: 'Zhipu GLM',
    logo: glmLogo,
    descKey: 'home.docs.desc.glm',
    apiKeyUrl: 'https://open.bigmodel.cn/console/apikey',
    docsUrl: 'https://open.bigmodel.cn/dev/api',
  },
  {
    name: 'MiniMax',
    logo: minimaxLogo,
    descKey: 'home.docs.desc.minimax',
    apiKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    docsUrl: 'https://platform.minimaxi.com/document/',
  },
  {
    name: 'ERNIE',
    logo: ernieLogo,
    descKey: 'home.docs.desc.ernie',
    apiKeyUrl: 'https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application',
    docsUrl: 'https://cloud.baidu.com/doc/qianfan/index.html',
  },
]
</script>

<style scoped lang="less">
.provider-docs {
  position: relative;
  z-index: 2;
  padding: 56px 40px;
  background: var(--color-bg-1);
}

.section-head {
  max-width: 760px;
  margin: 0 auto 32px;
  text-align: center;
}

.section-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-1);
}

.section-subtitle {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-3);
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
}

.provider-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-fill-2);
  border-radius: 4px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.provider-desc {
  min-height: 36px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: var(--color-text-3);
}

.provider-logo-wrap {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-logo {
  max-height: 36px;
  max-width: 100%;
  object-fit: contain;
}

.provider-links {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .provider-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .provider-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
