import { useI18n } from 'vue-i18n'
import { Message } from '@arco-design/web-vue'
import { copyToClipboard } from '@/utils/clipboard'

/**
 * copy() with success/failure toast feedback — the pattern duplicated across
 * the debug detail sub-components. Centralized so the toasts stay consistent.
 */
export function useCopyWithFeedback() {
  const { t } = useI18n()

  async function copy(text: string): Promise<void> {
    try {
      await copyToClipboard(text)
      Message.success(t('common.copied'))
    } catch {
      Message.error(t('common.copyFail'))
    }
  }

  return { copy }
}
