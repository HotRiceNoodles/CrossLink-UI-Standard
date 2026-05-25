// src/logger/types.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogSource = 'vue' | 'axios' | 'router' | 'app'

export interface LogEntry {
  id: number
  level: LogLevel
  timestamp: number
  message: string
  source?: LogSource
  data?: unknown
  context?: {
    url: string
    route?: string
  }
}

export interface LogConsole {
  list: () => LogEntry[]
  errors: () => LogEntry[]
  clear: () => void
  export: () => void
}
