// PAT (Personal Access Token)
export interface PatToken {
  id: number
  name: string
  scopes: string[]
  status: number // 1=有效 0=已吊销（repo.Revoke 同时置 0）
  expires_at: string
  last_used_at: string | null
  created_at: string
}

export interface PatCreateResponse {
  token: string // 明文，仅创建响应返回一次
  pat: PatToken
}
