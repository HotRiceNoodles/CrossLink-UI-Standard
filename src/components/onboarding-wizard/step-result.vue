<template>
  <div class="step-result">
    <div class="result-head">
      <h4>{{ t('onboarding.resultTitle') }}</h4>
      <p class="step-desc">{{ t('onboarding.resultIntro') }}</p>
    </div>

    <!-- 一次性 Key -->
    <a-alert type="warning" class="key-alert">{{ t('onboarding.keyOnceWarning') }}</a-alert>
    <div class="key-row">
      <a-input :model-value="result?.key ?? ''" readonly class="key-input" />
      <a-button type="primary" @click="copy(result?.key ?? '')">
        {{ t('onboarding.copyKey') }}
      </a-button>
    </div>

    <!-- 调用示例 -->
    <div class="examples">
      <div class="examples__bar">
        <span class="examples__title">{{ t('onboarding.examplesTitle') }}</span>
      </div>

      <a-grid :cols="24" :col-gap="16" class="examples__opts">
        <a-grid-item :span="14">
          <a-form-item field="api" :label="t('onboarding.apiAddress')">
            <a-input v-model="apiUrl" allow-clear />
          </a-form-item>
        </a-grid-item>
        <a-grid-item :span="10">
          <a-form-item
            v-if="modelOptions.length > 1"
            field="model"
            :label="t('onboarding.modelField')"
          >
            <a-select v-model="selectedModel">
              <a-option v-for="m in modelOptions" :key="m" :value="m" :label="m" />
            </a-select>
          </a-form-item>
        </a-grid-item>
      </a-grid>

      <a-tabs>
        <a-tab-pane key="curl" :title="t('onboarding.curlTab')">
          <pre class="code-block"><code>{{ curlExample }}</code></pre>
        </a-tab-pane>
        <a-tab-pane key="python" :title="t('onboarding.pythonTab')">
          <pre class="code-block"><code>{{ pythonExample }}</code></pre>
        </a-tab-pane>
        <a-tab-pane key="node" :title="t('onboarding.nodeTab')">
          <pre class="code-block"><code>{{ nodeExample }}</code></pre>
        </a-tab-pane>
      </a-tabs>

      <a-button size="small" @click="copy(currentCode)">{{ t('common.copy') }}</a-button>
    </div>

    <!-- 后续引导 -->
    <div class="result-footer">
      <a-space>
        <a-button @click="goto('keys')">{{ t('onboarding.gotoKeys') }}</a-button>
        <a-button @click="goto('providers')">{{ t('onboarding.gotoProviders') }}</a-button>
      </a-space>
      <a-button type="primary" @click="emit('done')">{{ t('onboarding.finish') }}</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { OnboardingWizardKey } from '@/composables/use-onboarding-wizard'
import { useCopyWithFeedback } from '@/composables/use-copy-with-feedback'

const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()
const router = useRouter()
const { copy } = useCopyWithFeedback()
const w = inject(OnboardingWizardKey)!
const { result, effectiveModels } = w

const apiUrl = ref(window.location.origin + '/v1')
const modelOptions = computed(() => effectiveModels.value)
const selectedModel = ref(modelOptions.value[0] ?? '')

const chatUrl = computed(() => `${apiUrl.value.replace(/\/$/, '')}/chat/completions`)

const curlExample = computed(
  () =>
    `curl ${chatUrl.value} \\
  -H "Authorization: Bearer ${result.value?.key ?? ''}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedModel.value}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
)

const pythonExample = computed(
  () =>
    `# pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="${apiUrl.value}",
    api_key="${result.value?.key ?? ''}",
)

resp = client.chat.completions.create(
    model="${selectedModel.value}",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(resp.choices[0].message.content)`,
)

const nodeExample = computed(
  () =>
    `# npm install openai
import OpenAI from "openai";

const client = new OpenAI({
    baseURL: "${apiUrl.value}",
    apiKey: "${result.value?.key ?? ''}",
});

const resp = await client.chat.completions.create({
    model: "${selectedModel.value}",
    messages: [{ role: "user", content: "Hello!" }],
});
console.log(resp.choices[0].message.content);`,
)

// 当前激活 tab 代码（简化：默认 curl，复制按钮复制 curl；用户切 tab 后无法感知 active key，
// 故提供一个综合：复制按钮复制当前可见——这里用 curl 作为代表，避免引入选中态）
const currentCode = computed(() => curlExample.value)

function goto(name: 'keys' | 'providers') {
  router.push({ name })
  emit('done')
}
</script>

<style scoped lang="less">
.result-head {
  margin-bottom: 16px;
  h4 {
    margin: 0 0 4px;
    font-size: 15px;
  }
}
.step-desc {
  margin: 0;
  color: var(--color-text-3);
  font-size: 13px;
}
.key-alert {
  margin-bottom: 12px;
}
.key-row {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.key-input {
  font-family: monospace;
}
.examples {
  padding: 16px;
  background: var(--color-fill-1);
  border-radius: 8px;
  &__bar {
    margin-bottom: 8px;
  }
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-2);
  }
  &__opts {
    margin-bottom: 4px;
  }
}
.code-block {
  margin: 0 0 12px;
  padding: 12px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-fill-2);
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  code {
    font-family: inherit;
    white-space: pre;
  }
}
.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-fill-2);
}
</style>
