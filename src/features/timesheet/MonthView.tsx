import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import type { MonthDoc } from '../../types'
import { dateKey } from '../../types'
import { totalMinutes, otMinutes } from './calc'
import { formatHours } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface MonthViewProps {
  doc: MonthDoc
  selectedDate: Date | null
  onSelectDay: (date: Date) => void
}

function isSameDay(a: Date, b: Date | null): boolean {
  if (!b) return false
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export function MonthView({ doc, selectedDate, onSelectDay }: MonthViewProps) {
  const year = doc.year
  const month = doc.month
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(start)
  const days = eachDayOfInterval({ start, end })

  const firstDow = getDay(start)
  const padStart = firstDow
  const padEnd = 42 - days.length - padStart
  const padStartArr = Array.from({ length: padStart }, () => null)
  const padEndArr = Array.from({ length: Math.max(0, padEnd) }, () => null)
  const gridDays = [...padStartArr, ...days.map((d) => d), ...padEndArr]

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  let monthTotal = 0
  let monthOt = 0
  let workingDaysCount = 0
  let totalShiftsCount = 0
  days.forEach((d) => {
    const key = dateKey(d)
    const shifts = doc.days[key] ?? []
    if (shifts.length > 0) {
      workingDaysCount += 1
      totalShiftsCount += shifts.length
    }
    monthTotal += totalMinutes(shifts)
    monthOt += otMinutes(shifts)
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Card Tổng kết tháng - iOS soft card */}
      <div
        className={cn(
          'rounded-[18px] overflow-hidden',
          'bg-white/80 dark:bg-[rgba(255,255,255,0.04)]',
          'border border-white/20 dark:border-white/[0.06]',
          'shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
        )}
      >
        <div className="px-4 pt-4 pb-1">
          <h2 className="text-[13px] font-medium text-slate-500 dark:text-[rgba(255,255,255,0.65)]">
            Tổng kết tháng
          </h2>
        </div>
        <div className="p-4 pt-2 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-0">
            <span className="text-[13px] font-medium text-slate-500 dark:text-[rgba(255,255,255,0.65)] opacity-90">
              Ngày làm
            </span>
            <span className="text-[28px] sm:text-[32px] font-bold tracking-[-0.6px] text-slate-800 dark:text-[rgba(255,255,255,0.92)] tabular-nums mt-0.5">
              {workingDaysCount}
              <span className="text-[13px] font-medium text-slate-400 dark:text-[rgba(255,255,255,0.45)] ml-1">ngày</span>
            </span>
          </div>
          <div className="flex flex-col gap-0">
            <span className="text-[13px] font-medium text-slate-500 dark:text-[rgba(255,255,255,0.65)] opacity-90">
              Số ca
            </span>
            <span className="text-[28px] sm:text-[32px] font-bold tracking-[-0.6px] text-slate-800 dark:text-[rgba(255,255,255,0.92)] tabular-nums mt-0.5">
              {totalShiftsCount}
              <span className="text-[13px] font-medium text-slate-400 dark:text-[rgba(255,255,255,0.45)] ml-1">ca</span>
            </span>
          </div>
          <div className="col-span-2 flex items-end justify-between gap-2 flex-wrap">
            <div className="flex flex-col gap-0">
              <span className="text-[13px] font-medium text-slate-500 dark:text-[rgba(255,255,255,0.65)] opacity-90">
                Tổng giờ
              </span>
              <span className="text-[28px] sm:text-[34px] font-bold tracking-[-0.6px] text-slate-800 dark:text-[rgba(255,255,255,0.92)] tabular-nums mt-0.5">
                {formatHours(monthTotal)}
              </span>
            </div>
            {monthOt > 0 && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                OT {formatHours(monthOt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lịch tháng - gap 8px, ô 54-62px */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-center text-[12px] font-semibold text-slate-500 dark:text-[rgba(255,255,255,0.45)] py-1.5"
          >
            {w}
          </div>
        ))}
        {gridDays.map((d, i) => {
          if (d == null) {
            return <div key={`pad-${i}`} className="w-full aspect-square min-h-0" />
          }
          const key = dateKey(d)
          const shifts = doc.days[key] ?? []
          const totalM = totalMinutes(shifts)
          const otM = otMinutes(shifts)
          const isToday =
            d.getDate() === new Date().getDate() &&
            d.getMonth() === new Date().getMonth() &&
            d.getFullYear() === new Date().getFullYear()
          const hasShifts = shifts.length > 0
          const isSelected = isSameDay(d, selectedDate)

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                'w-full min-w-0 aspect-square flex flex-col items-center justify-center rounded-[14px] text-center p-1 transition-all duration-200 active:scale-[0.98]',
                'min-h-[54px] sm:min-h-[62px]',
                isSameMonth(d, start)
                  ? 'bg-white/70 dark:bg-[rgba(255,255,255,0.06)] border border-transparent hover:bg-white/90 dark:hover:bg-white/[0.09]'
                  : 'bg-transparent dark:bg-white/[0.02] text-slate-400 dark:text-[rgba(255,255,255,0.35)]',
                hasShifts && isSameMonth(d, start) && 'bg-emerald-50/80 dark:bg-emerald-500/10',
                isSelected && 'ring-2 ring-slate-400 dark:ring-white/50 ring-offset-2 ring-offset-[#f0f2f5] dark:ring-offset-[#151b2d] shadow-[0_0_12px_rgba(0,0,0,0.15)] dark:shadow-[0_0_12px_rgba(255,255,255,0.08)]',
                isToday && !isSelected && 'ring-2 ring-slate-300 dark:ring-white/40 ring-offset-2 ring-offset-[#f0f2f5] dark:ring-offset-[#151b2d]'
              )}
            >
              <span
                className={cn(
                  'text-[16px] sm:text-[18px] font-semibold leading-tight tabular-nums',
                  isSameMonth(d, start) ? 'text-slate-800 dark:text-[rgba(255,255,255,0.92)]' : 'text-slate-400 dark:text-[rgba(255,255,255,0.35)]'
                )}
              >
                {format(d, 'd')}
              </span>
              {hasShifts && (
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-[rgba(255,255,255,0.65)] mt-0.5 leading-tight block">
                  {shifts.length} ca • {formatHours(totalM)}
                </span>
              )}
              {hasShifts && otM > 0 && (
                <span className="text-[9px] bg-amber-200/80 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 px-1 rounded mt-0.5 font-medium">
                  OT
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  const d = subMonths(new Date(year, month - 1, 1), 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  const d = addMonths(new Date(year, month - 1, 1), 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}
