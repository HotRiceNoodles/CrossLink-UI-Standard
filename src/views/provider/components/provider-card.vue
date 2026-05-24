<template>
  <a-card class="provider-card">
    <div class="card-header">
      <div class="card-header-left">
        <span class="expand-toggle" @click="toggleExpand">
          <icon-up v-if="expanded" />
          <icon-down v-else />
        </span>
        <span class="provider-badge" :style="{ background: providerColor }"></span>
        <span class="provider-name">{{ provider.display_name }}</span>
        <a-tag size="small">{{ adapter?.display_name || provider.adapter_type }}</a-tag>
        <a-tag :color="provider.status === 1 ? 'green' : 'red'" size="small">
          {{ provider.status === 1 ? '启用' : '禁用' }}
        </a-tag>
        <icon-check-circle-fill v-if="probeStatus === 'success'" class="probe-icon probe-ok" />
        <icon-close-circle-fill v-else-if="probeStatus === 'fail'" class="probe-icon probe-fail" />
        <span class="model-count">接入 {{ models.length }} 个模型</span>
      </div>
      <div class="card-header-right">
        <a-button type="text" size="small" @click="emit('add-model', provider)">
          <template #icon><icon-plus /></template>
          添加模型
        </a-button>
        <a-button
          type="text"
          size="small"
          :loading="testingId === provider.id"
          @click="emit('test', provider)"
        >
          探测连通性
        </a-button>
        <a-button type="text" size="small" @click="emit('edit-provider', provider)">
          编辑
        </a-button>
        <a-dropdown trigger="hover">
          <a-button type="text" size="small">
            <template #icon><icon-more /></template>
          </a-button>
          <template #content>
            <a-doption @click="emit('delete-provider', provider)">
              <span style="color: rgb(var(--danger-6))">删除供应商</span>
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </div>

    <div class="card-meta" v-if="provider.base_url">
      <span class="meta-label">API 地址</span>
      <span class="meta-value">{{ provider.base_url }}</span>
    </div>

    <div v-show="expanded">
    <a-table
      v-if="models.length > 0"
      :data="models"
      :pagination="false"
      row-key="id"
      size="small"
      :bordered="false"
    >
      <template #columns>
        <a-table-column title="模型名称" :width="160">
          <template #cell="{ record }">
            <span style="font-weight: 600">{{ record.model_name }}</span>
          </template>
        </a-table-column>

        <a-table-column title="调用名" :width="140">
          <template #cell="{ record }">
            <span class="mono-text">{{ record.provider_model }}</span>
          </template>
        </a-table-column>

        <a-table-column title="状态" :width="70" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.status === 1 ? 'green' : 'red'" size="small">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="权重" :width="70" align="center" data-index="weight" />
        <a-table-column title="优先级" :width="70" align="center" data-index="priority" />

        <a-table-column title="输入价格" :width="110" align="right">
          <template #cell="{ record }">
            {{ formatPrice(record.input_price, record.currency) }}
          </template>
        </a-table-column>

        <a-table-column title="输出价格" :width="110" align="right">
          <template #cell="{ record }">
            {{ formatPrice(record.output_price, record.currency) }}
          </template>
        </a-table-column>

        <a-table-column title="路由策略" :width="100" align="center">
          <template #cell="{ record }">
            <a-tag :color="getStrategyColor(record.routing_strategy)" size="small">
              {{ getStrategyLabel(record.routing_strategy) }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="操作" :width="100">
          <template #cell="{ record }">
            <a-space :size="8">
              <a-link @click="emit('edit-model', record, provider)">编辑</a-link>
              <a-link status="danger" @click="emit('delete-model', record)">删除</a-link>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <a-empty v-else description="暂无模型" :style="{ padding: '16px 0' }" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Provider, ProviderModel, Adapter } from '@/types'

interface Props {
  provider: Provider
  models: ProviderModel[]
  adapter?: Adapter
  testingId: number | null
  probeStatus?: 'success' | 'fail' | 'testing'
}

interface Emits {
  (e: 'test', provider: Provider): void
  (e: 'edit-provider', provider: Provider): void
  (e: 'delete-provider', provider: Provider): void
  (e: 'add-model', provider: Provider): void
  (e: 'edit-model', model: ProviderModel, provider: Provider): void
  (e: 'delete-model', model: ProviderModel): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const expanded = ref(true)

function toggleExpand() {
  expanded.value = !expanded.value
}

const providerColor = computed(() => {
  const colors = [
    '#165DFF', '#00B42A', '#FF7D00', '#722ED1',
    '#0FC6C2', '#F77234', '#3491FA', '#9FDB1D',
  ]
  let hash = 0
  for (const ch of props.provider.display_name) {
    hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  }
  return colors[Math.abs(hash) % colors.length]
})

const strategyMap: Record<string, { label: string; color: string }> = {
  weighted_random: { label: '加权随机', color: '#165DFF' },
  round_robin: { label: '轮询', color: '#00B42A' },
  least_latency: { label: '最低延迟', color: '#0FC6C2' },
  least_cost: { label: '最低成本', color: '#FF7D00' },
  canary: { label: '金丝雀', color: '#722ED1' },
  least_busy: { label: '最空闲', color: '#F77234' },
}

function getStrategyLabel(key: string): string {
  return strategyMap[key]?.label ?? key
}

function getStrategyColor(key: string): string {
  return strategyMap[key]?.color ?? '#86909C'
}

function formatPrice(price: number | null | undefined, currency?: string): string {
  if (price === null || price === undefined) return '-'
  const prefix = currency === 'CNY' ? '¥' : '$'
  return `${prefix}${price.toFixed(6)}`
}
</script>

<style scoped lang="less">
.provider-card {
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .expand-toggle {
    cursor: pointer;
    color: var(--color-text-3);
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border-radius: 2px;
    transition: color 0.2s, background-color 0.2s;

    &:hover {
      color: var(--color-text-1);
      background-color: var(--color-fill-2);
    }
  }

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .provider-badge {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .provider-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .probe-icon {
    font-size: 16px;
  }

  .probe-ok {
    color: #00B42A;
  }

  .probe-fail {
    color: #F53F3F;
  }

  .model-count {
    font-size: 13px;
    color: var(--color-text-3);
  }

  .card-header-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .card-meta {
    font-size: 13px;
    color: var(--color-text-3);
    margin-bottom: 12px;

    .meta-label {
      margin-right: 8px;
    }

    .meta-value {
      font-family: monospace;
    }
  }

  .mono-text {
    font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
    color: var(--color-text-3);
    font-size: 13px;
  }
}
</style>
