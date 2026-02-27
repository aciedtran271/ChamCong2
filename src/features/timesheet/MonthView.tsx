import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import type { MonthDoc } from '../../types'
import { dateKey } from '../../types'
import { totalMinutes, otMinutes } from './calc'
import { formatHours } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface MonthViewProps {
  doc: MonthDoc
  onSelectDay: (date: Date) => void
}

export function MonthView({ doc, onSelectDay }: MonthViewProps) {
  const year = doc.year
  const month = doc.month
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(start)
  const days = eachDayOfInterval({ start, end })

  // Lấp đầu tuần (để thứ 2 là cột đầu nếu cần; hoặc CN đầu: 0=CN)
  const firstDow = getDay(start) // 0 = CN
  const padStart = firstDow
  const padEnd = 42 - days.length - padStart // 6 rows
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
    <div className="flex flex-col gap-5">
      {/* Tổng kết tháng */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-600/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Tổng kết tháng
          </h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Số ngày có làm</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
              {workingDaysCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">ngày</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng số ca</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
              {totalShiftsCount}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">ca</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng giờ</span>
            <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
              {formatHours(monthTotal)}
            </span>
          </div>
          {monthOt > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-amber-600 dark:text-amber-400">OT</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatHours(monthOt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lịch tháng - gap rõ ràng cho mobile iPhone */}
      <div className="grid grid-cols-7 gap-2 min-[480px]:gap-3">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2"
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

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                'w-full min-w-0 aspect-square flex flex-col items-center justify-center rounded-xl border text-center p-1.5 transition-all duration-200 active:scale-[0.98]',
                isSameMonth(d, start)
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 shadow-sm hover:shadow'
                  : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 text-slate-400',
                hasShifts && 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-900/20',
                isToday && 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 ring-offset-slate-100 dark:ring-offset-slate-900'
              )}
            >
              <span
                className={cn(
                  'text-sm font-semibold leading-tight',
                  isSameMonth(d, start) ? 'text-slate-800 dark:text-white' : 'text-slate-400'
                )}
              >
                {format(d, 'd')}
              </span>
              {hasShifts && (
                <>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-tight block">
                    {formatHours(totalM)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {shifts.length} ca
                  </span>
                  {otM > 0 && (
                    <span className="text-[9px] bg-amber-200/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 px-1.5 py-0.5 rounded-full mt-0.5 font-medium">
                      OT
                    </span>
                  )}
                </>
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
