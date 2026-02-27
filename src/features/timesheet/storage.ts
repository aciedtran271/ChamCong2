import localforage from 'localforage'
import type { MonthDoc } from '../../types'
import { monthKey } from '../../types'

const PREFIX = 'month:'

export async function getMonth(year: number, month: number): Promise<MonthDoc | null> {
  const key = PREFIX + monthKey(year, month)
  const data = await localforage.getItem<MonthDoc>(key)
  return data ?? null
}

export async function setMonth(doc: MonthDoc): Promise<void> {
  const key = PREFIX + monthKey(doc.year, doc.month)
  await localforage.setItem(key, doc)
}

export async function removeMonth(year: number, month: number): Promise<void> {
  const key = PREFIX + monthKey(year, month)
  await localforage.removeItem(key)
}

/** Export tất cả keys month:* thành JSON (backup) */
export async function exportAllMonthsJson(): Promise<string> {
  const keys = await localforage.keys()
  const monthKeys = keys.filter((k) => k.startsWith(PREFIX))
  const out: Record<string, MonthDoc> = {}
  for (const k of monthKeys) {
    const v = await localforage.getItem<MonthDoc>(k)
    if (v) out[k] = v
  }
  return JSON.stringify(out, null, 2)
}

/** Import JSON backup (merge vào store) */
export async function importMonthsJson(json: string): Promise<{ count: number }> {
  const data = JSON.parse(json) as Record<string, MonthDoc>
  let count = 0
  for (const [key, doc] of Object.entries(data)) {
    if (key.startsWith(PREFIX) && doc?.year != null && doc?.month != null && doc?.days != null) {
      await localforage.setItem(key, doc)
      count++
    }
  }
  return { count }
}
