// 与后端 model.PromptTemplate 对齐（字段名 snake_case 与服务端一致）。
// 来源：backend internal/model/prompt_template.go + service/template_render.go

export interface TemplateVariableDef {
  name: string
  type: '' | 'string' | 'number' | 'bool'
  required: boolean
  default?: unknown
  trusted: boolean
  // 后端 service.VariableDef 结构体没有 desc 字段；渲染器从不读取它。
  // 因 variables_schema 在 Create/Update 走 raw-JSON 透传（json.RawMessage），
  // 前端写入的 desc 会被原样存回，属"非官方扩展字段"。
  desc?: string
}

export interface TemplateFewShotMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface PromptTemplate {
  id: number
  name: string
  // 后端 json:",omitempty"：空串时响应里该 key 缺失（非 null）。读路径需兜底。
  description: string
  system_prompt: string
  // ⚠️ 三态：undefined（key 缺失）/ null / 数组。读路径必须 ?? [] 归一化。
  variables_schema?: TemplateVariableDef[] | null
  few_shot?: TemplateFewShotMessage[] | null
  tool_defs?: unknown // MVP 不展示
  target_format: 'auto' | 'anthropic' | 'openai'
  status: number // 1=启用 0=停用（int16，非布尔）
  org_id?: number | null
  created_at: string
  updated_at: string
}

export interface PromptTemplateCreateRequest {
  name: string
  description?: string
  system_prompt?: string
  variables_schema?: TemplateVariableDef[] | null
  few_shot?: TemplateFewShotMessage[] | null
  tool_defs?: unknown
  target_format?: 'auto' | 'anthropic' | 'openai'
}

// Update 全指针可选（后端）+ status。前端用 Partial 表达。
export type PromptTemplateUpdateRequest = Partial<PromptTemplateCreateRequest> & {
  status?: number
}

// POST /templates/:id/preview 的返回结构（service.RenderedContext）。
// 注意：不是 { messages: [...] }，而是 system_prompt + few_shot。
export interface RenderedContext {
  system_prompt: string
  few_shot: TemplateFewShotMessage[]
}
