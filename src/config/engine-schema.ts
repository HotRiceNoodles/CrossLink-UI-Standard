import type { GuardrailEngineType, EngineConfigSchema } from '@/types'

// ==================== keyword_filter ====================
const keywordFilterSchema: EngineConfigSchema = {
  engineType: 'keyword_filter',
  hasComplexFields: false,
  fields: [
    {
      key: 'blocklist',
      type: 'string_array',
      labelKey: 'safety.config.keyword.blocklist',
      placeholderKey: 'safety.config.keyword.blocklistPh',
      defaultValue: [],
    },
    {
      key: 'allowlist',
      type: 'string_array',
      labelKey: 'safety.config.keyword.allowlist',
      placeholderKey: 'safety.config.keyword.allowlistPh',
      defaultValue: [],
    },
    {
      key: 'use_regex',
      type: 'boolean',
      labelKey: 'safety.config.keyword.useRegex',
      defaultValue: false,
    },
    {
      key: 'case_sensitive',
      type: 'boolean',
      labelKey: 'safety.config.keyword.caseSensitive',
      defaultValue: false,
    },
  ],
}

// ==================== content_length ====================
const contentLengthSchema: EngineConfigSchema = {
  engineType: 'content_length',
  hasComplexFields: false,
  fields: [
    {
      key: 'max_input_chars',
      type: 'number',
      labelKey: 'safety.config.length.maxInputChars',
      defaultValue: 100000,
      min: 1,
    },
    {
      key: 'max_output_chars',
      type: 'number',
      labelKey: 'safety.config.length.maxOutputChars',
      defaultValue: 50000,
      min: 1,
    },
  ],
}

// ==================== pii_detection ====================
const piiDetectionSchema: EngineConfigSchema = {
  engineType: 'pii_detection',
  hasComplexFields: false,
  fields: [
    {
      key: 'types',
      type: 'multiselect',
      labelKey: 'safety.config.pii.types',
      defaultValue: ['email', 'phone', 'cn_id', 'credit_card', 'ip_address'],
      options: [
        { label: 'safety.config.pii.typeEmail', value: 'email' },
        { label: 'safety.config.pii.typePhone', value: 'phone' },
        { label: 'safety.config.pii.typeCnId', value: 'cn_id' },
        { label: 'safety.config.pii.typeCreditCard', value: 'credit_card' },
        { label: 'safety.config.pii.typeIpAddress', value: 'ip_address' },
      ],
    },
    {
      key: 'action',
      type: 'select',
      labelKey: 'safety.config.pii.action',
      defaultValue: 'block',
      options: [
        { label: 'safety.action.block', value: 'block' },
        { label: 'safety.action.log', value: 'log' },
        { label: 'safety.action.mask', value: 'mask' },
      ],
    },
  ],
}

// ==================== openai_moderation ====================
const openaiModerationSchema: EngineConfigSchema = {
  engineType: 'openai_moderation',
  hasComplexFields: false,
  fields: [
    {
      key: 'api_key',
      type: 'string',
      labelKey: 'safety.config.moderation.apiKey',
      placeholderKey: 'safety.config.moderation.apiKeyPh',
      required: true,
      sensitive: true,
      defaultValue: '',
    },
    {
      key: 'base_url',
      type: 'string',
      labelKey: 'safety.config.moderation.baseUrl',
      placeholderKey: 'safety.config.moderation.baseUrlPh',
      defaultValue: 'https://api.openai.com',
    },
    {
      key: 'categories',
      type: 'multiselect',
      labelKey: 'safety.config.moderation.categories',
      defaultValue: ['hate', 'violence', 'sexual', 'harassment'],
      options: [
        { label: 'safety.config.moderation.catHate', value: 'hate' },
        { label: 'safety.config.moderation.catViolence', value: 'violence' },
        { label: 'safety.config.moderation.catSexual', value: 'sexual' },
        { label: 'safety.config.moderation.catHarassment', value: 'harassment' },
      ],
    },
    {
      key: 'threshold',
      type: 'number',
      labelKey: 'safety.config.moderation.threshold',
      tooltipKey: 'safety.config.moderation.thresholdTip',
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      precision: 2,
    },
    {
      key: 'block_on_error',
      type: 'boolean',
      labelKey: 'safety.config.moderation.blockOnError',
      defaultValue: false,
    },
    {
      key: 'timeout_ms',
      type: 'number',
      labelKey: 'safety.config.moderation.timeoutMs',
      defaultValue: 5000,
      min: 100,
      max: 30000,
      step: 100,
    },
  ],
}

// ==================== prompt_injection ====================
const promptInjectionSchema: EngineConfigSchema = {
  engineType: 'prompt_injection',
  hasComplexFields: false,
  fields: [
    {
      key: 'sensitivity',
      type: 'select',
      labelKey: 'safety.config.injection.sensitivity',
      defaultValue: 'medium',
      options: [
        { label: 'safety.config.injection.sensLow', value: 'low' },
        { label: 'safety.config.injection.sensMedium', value: 'medium' },
        { label: 'safety.config.injection.sensHigh', value: 'high' },
      ],
    },
    {
      key: 'indirect_injection_enabled',
      type: 'boolean',
      labelKey: 'safety.config.injection.indirectInjection',
      tooltipKey: 'safety.config.injection.indirectInjectionTip',
      defaultValue: false,
    },
    {
      key: 'agent_hijack_enabled',
      type: 'boolean',
      labelKey: 'safety.config.injection.agentHijack',
      defaultValue: false,
    },
    {
      key: 'config_probe_enabled',
      type: 'boolean',
      labelKey: 'safety.config.injection.configProbe',
      defaultValue: false,
    },
    {
      key: 'decode_bypass_enabled',
      type: 'boolean',
      labelKey: 'safety.config.injection.decodeBypass',
      defaultValue: false,
    },
    {
      key: 'threshold',
      type: 'number',
      labelKey: 'safety.config.injection.threshold',
      placeholderKey: 'safety.config.injection.thresholdPh',
      tooltipKey: 'safety.config.injection.thresholdTip',
      min: 0,
      step: 0.1,
      precision: 1,
    },
  ],
}

// ==================== credential_detection ====================
const credentialDetectionSchema: EngineConfigSchema = {
  engineType: 'credential_detection',
  hasComplexFields: true,
  fields: [
    {
      key: 'categories',
      type: 'multiselect',
      labelKey: 'safety.config.credential.categories',
      defaultValue: [
        'api_key',
        'cloud_credential',
        'private_key',
        'database_string',
        'jwt',
        'env_file',
      ],
      options: [
        { label: 'safety.config.credential.catApiKey', value: 'api_key' },
        { label: 'safety.config.credential.catCloud', value: 'cloud_credential' },
        { label: 'safety.config.credential.catPrivateKey', value: 'private_key' },
        { label: 'safety.config.credential.catDatabase', value: 'database_string' },
        { label: 'safety.config.credential.catJwt', value: 'jwt' },
        { label: 'safety.config.credential.catEnvFile', value: 'env_file' },
        { label: 'safety.config.credential.catCustom', value: 'custom' },
      ],
    },
    {
      key: 'custom_patterns',
      type: 'object_array',
      labelKey: 'safety.config.credential.customPatterns',
      tooltipKey: 'safety.config.credential.customPatternsTip',
      defaultValue: [],
    },
    {
      key: 'mask_char',
      type: 'string',
      labelKey: 'safety.config.credential.maskChar',
      defaultValue: '*',
    },
    {
      key: 'mask_keep_prefix',
      type: 'number',
      labelKey: 'safety.config.credential.maskKeepPrefix',
      defaultValue: 4,
      min: 0,
    },
    {
      key: 'mask_keep_suffix',
      type: 'number',
      labelKey: 'safety.config.credential.maskKeepSuffix',
      defaultValue: 4,
      min: 0,
    },
    {
      key: 'max_matches_per_check',
      type: 'number',
      labelKey: 'safety.config.credential.maxMatches',
      defaultValue: 50,
      min: 1,
    },
  ],
}

// ==================== webhook ====================
const webhookSchema: EngineConfigSchema = {
  engineType: 'webhook',
  hasComplexFields: true,
  fields: [
    {
      key: 'url',
      type: 'string',
      labelKey: 'safety.config.webhook.url',
      placeholderKey: 'safety.config.webhook.urlPh',
      required: true,
      defaultValue: '',
    },
    {
      key: 'headers',
      type: 'key_value_map',
      labelKey: 'safety.config.webhook.headers',
      tooltipKey: 'safety.config.webhook.headersTip',
      defaultValue: {},
    },
    {
      key: 'timeout_ms',
      type: 'number',
      labelKey: 'safety.config.webhook.timeoutMs',
      defaultValue: 5000,
      min: 100,
      max: 30000,
      step: 100,
    },
    {
      key: 'block_on_error',
      type: 'boolean',
      labelKey: 'safety.config.webhook.blockOnError',
      defaultValue: false,
    },
  ],
}

// ==================== agent_fingerprint ====================
const agentFingerprintSchema: EngineConfigSchema = {
  engineType: 'agent_fingerprint',
  hasComplexFields: true,
  fields: [
    {
      key: 'mode',
      type: 'select',
      labelKey: 'safety.config.fingerprint.mode',
      defaultValue: 'tag',
      options: [
        { label: 'safety.config.fingerprint.modeTag', value: 'tag' },
        { label: 'safety.config.fingerprint.modeBlock', value: 'block' },
      ],
    },
    {
      key: 'block_agent_types',
      type: 'string_array',
      labelKey: 'safety.config.fingerprint.blockAgentTypes',
      placeholderKey: 'safety.config.fingerprint.blockAgentTypesPh',
      defaultValue: [],
    },
    {
      key: 'custom_patterns',
      type: 'object_array',
      labelKey: 'safety.config.fingerprint.customPatterns',
      tooltipKey: 'safety.config.fingerprint.customPatternsTip',
      defaultValue: [],
    },
    {
      key: 'detect_automated_behavior',
      type: 'boolean',
      labelKey: 'safety.config.fingerprint.detectAutomated',
      defaultValue: false,
    },
    {
      key: 'automation_threshold_rpm',
      type: 'number',
      labelKey: 'safety.config.fingerprint.automationThresholdRpm',
      defaultValue: 30,
      min: 1,
    },
    {
      key: 'automation_threshold_window_seconds',
      type: 'number',
      labelKey: 'safety.config.fingerprint.automationWindow',
      defaultValue: 60,
      min: 1,
    },
  ],
}

// ==================== behavior_analysis ====================
const behaviorAnalysisSchema: EngineConfigSchema = {
  engineType: 'behavior_analysis',
  hasComplexFields: true,
  fields: [
    {
      key: 'rules',
      type: 'object_array',
      labelKey: 'safety.config.behavior.rules',
      tooltipKey: 'safety.config.behavior.rulesTip',
      defaultValue: [],
    },
  ],
}

// ==================== Schema Map ====================

const schemas: EngineConfigSchema[] = [
  keywordFilterSchema,
  contentLengthSchema,
  piiDetectionSchema,
  openaiModerationSchema,
  promptInjectionSchema,
  credentialDetectionSchema,
  webhookSchema,
  agentFingerprintSchema,
  behaviorAnalysisSchema,
]

export const engineSchemaMap = new Map<GuardrailEngineType, EngineConfigSchema>(
  schemas.map((s) => [s.engineType, s]),
)

/**
 * 根据引擎类型生成默认配置对象
 */
export function getDefaultsForEngine(type: GuardrailEngineType): Record<string, any> {
  const schema = engineSchemaMap.get(type)
  if (!schema) return {}
  const defaults: Record<string, any> = {}
  for (const field of schema.fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.key] = JSON.parse(JSON.stringify(field.defaultValue))
    }
  }
  return defaults
}
