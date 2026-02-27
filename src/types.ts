/** Loại ca: Làm việc / OT / Nghỉ / Khác */
export type ShiftType = 'Work' | 'OT' | 'Leave' | 'Other'

export interface Shift {
  id: string
  start: string // HH:mm
  end: string   // HH:mm (có thể qua ngày)
  breakMinutes: number
  type: ShiftType
  note: string
  location?: string
  /** Chỉ số cột (trẻ) khi xuất Excel, 0-based. Mặc định 0. */
  columnIndex?: number
}

export interface MonthDoc {
  year: number
  month: number
  days: Record<string, Shift[]> // "YYYY-MM-DD" -> Shift[]
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
