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

const EXPORT_NAMES_KEY = 'chamcong:exportColumnNames'
const DEFAULT_EXPORT_NAMES = ['Bi', 'Phú Quý', 'Khôi', 'Bo']

/** Tên các cột "tên trẻ" trong Excel do người dùng nhập */
export function getExportColumnNames(): string[] {
  try {
    const raw = localStorage.getItem(EXPORT_NAMES_KEY)
    if (!raw) return [...DEFAULT_EXPORT_NAMES]
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr) || arr.some((x) => typeof x !== 'string')) return [...DEFAULT_EXPORT_NAMES]
    return arr.length > 0 ? arr : [...DEFAULT_EXPORT_NAMES]
  } catch {
    return [...DEFAULT_EXPORT_NAMES]
  }
}

export function setExportColumnNames(names: string[]): void {
  const safe = names.length > 0 ? names.map((s) => String(s).trim() || ' ') : [...DEFAULT_EXPORT_NAMES]
  localStorage.setItem(EXPORT_NAMES_KEY, JSON.stringify(safe))
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
