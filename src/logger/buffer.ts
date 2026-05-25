// src/logger/buffer.ts
export class RingBuffer<T> {
  private buffer: (T | undefined)[]
  private head = 0
  private count = 0
  private maxSize: number

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize
    this.buffer = new Array(maxSize).fill(undefined)
  }

  push(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.maxSize
    if (this.count < this.maxSize) {
      this.count++
    }
  }

  getAll(): T[] {
    if (this.count === 0) return []
    const result: T[] = []
    const start = this.count < this.maxSize ? 0 : this.head
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.maxSize
      const item = this.buffer[idx]
      if (item !== undefined) result.push(item)
    }
    return result
  }

  clear(): void {
    this.buffer = new Array(this.maxSize).fill(undefined)
    this.head = 0
    this.count = 0
  }

  get length(): number {
    return this.count
  }
}
