import type { Shift, ShiftType } from '../../types'

const MINUTES_PER_DAY = 24 * 60

/** Parse "HH:mm" -> phút trong ngày (0..1439) */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Tính duration (phút) cho 1 ca. end < start => qua ngày (+24h). Trả về >= 0. */
export function shiftDurationMinutes(shift: Shift): number {
  let startM = timeToMinutes(shift.start)
  let endM = timeToMinutes(shift.end)
  if (endM < startM) endM += MINUTES_PER_DAY
  const duration = endM - startM - (shift.breakMinutes ?? 0)
  return Math.max(0, duration)
}

/** Phút -> giờ (số thập phân, 2 chữ số) */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

/** Tổng giờ (phút) của nhiều ca */
export function totalMinutes(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => sum + shiftDurationMinutes(s), 0)
}

/** Tổng OT (phút): các ca type === 'OT' */
export function otMinutes(shifts: Shift[]): number {
  return shifts
    .filter((s) => s.type === 'OT')
    .reduce((sum, s) => sum + shiftDurationMinutes(s), 0)
}

/** Cảnh báo nếu ca > 16h (960 phút) */
export const WARN_SHIFT_HOURS = 16
export function isLongShift(shift: Shift): boolean {
  return shiftDurationMinutes(shift) > WARN_SHIFT_HOURS * 60
}

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  Work: 'Làm việc',
  OT: 'OT',
  Leave: 'Nghỉ',
  Other: 'Khác',
}
