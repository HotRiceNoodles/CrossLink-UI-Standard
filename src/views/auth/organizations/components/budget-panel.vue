<template>
  <div class="budget-panel">
    <a-spin :loading="loading" style="width: 100%">
      <template v-if="budget">
        <a-descriptions :column="2" bordered size="medium">
          <a-descriptions-item :label="t('auth.organizations.budgetLimit')">
            ¥{{ budget.budget_limit }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('auth.organizations.budgetPeriod')">
            {{ periodLabel(budget.budget_period) }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('auth.organizations.budgetSpent')">
            ¥{{ budget.spent.toFixed(2) }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('auth.organizations.budgetRemaining')">
            ¥{{ budget.remaining.toFixed(2) }}
          </a-descriptions-item>
        </a-descriptions>

        <div style="margin-top: 20px">
          <div style="margin-bottom: 8px; font-weight: 500">
            {{ t('auth.organizations.budgetUsage') }}
          </div>
          <a-progress
            :percent="budget.usage_pct / 100"
            :color="budgetColor"
            :text="`${budget.usage_pct.toFixed(1)}%`"
          />
        </div>

        <div style="margin-top: 20px; text-align: end">
          <a-popconfirm
            :content="t('auth.organizations.calibrateConfirm')"
            type="warning"
            @ok="handleCalibrate"
          >
            <a-button :loading="calibrateLoading">
              {{ t('auth.organizations.calibrateBudget') }}
            </a-button>
          </a-popconfirm>
        </div>
      </template>

      <a-empty v-else-if="!loading" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { orgApi } from '@/api/rbac'
import type { OrgBudget } from '@/types'
import { useLoading } from '@/hooks/loading'

const { t } = useI18n()

const props = defineProps<{
  orgId: number
}>()

const { loading, setLoading } = useLoading()
const { loading: calibrateLoading, setLoading: setCalibrateLoading } = useLoading()
const budget = ref<OrgBudget | null>(null)

const budgetColor = computed(() => {
  if (!budget.value) return 'arcoblue'
  const pct = budget.value.usage_pct
  if (pct >= 90) return 'red'
  if (pct >= 70) return 'orangered'
  return 'arcoblue'
})

async function fetchBudget() {
  if (!props.orgId) return
  setLoading(true)
  try {
    const res = await orgApi.budget(props.orgId)
    budget.value = res.data
  } catch {
    Message.error(t('auth.organizations.fetchBudgetFail'))
  } finally {
    setLoading(false)
  }
}

async function handleCalibrate() {
  if (!props.orgId) return
  setCalibrateLoading(true)
  try {
    await orgApi.calibrateBudget(props.orgId)
    Message.success(t('auth.organizations.calibrateSuccess'))
    await fetchBudget()
  } catch {
    Message.error(t('auth.organizations.calibrateFail'))
  } finally {
    setCalibrateLoading(false)
  }
}

function periodLabel(period: string) {
  const map: Record<string, string> = {
    daily: t('key.periodDay'),
    weekly: t('key.periodWeek'),
    monthly: t('key.periodMonth'),
  }
  return map[period] || period
}

watch(
  () => props.orgId,
  (val) => {
    if (val) fetchBudget()
  },
  { immediate: true },
)
</script>

<style scoped lang="less">
.budget-panel {
  padding: 4px 0;
}
</style>
