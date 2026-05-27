import dayjs from 'dayjs'

export function formatTime(value: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!value) return '-'
  return dayjs(value).format(format)
}
