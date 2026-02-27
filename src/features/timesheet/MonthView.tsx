import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import type { MonthDoc } from '../../types'
import { dateKey } from '../../types'
import { totalMinutes, otMinutes, minutesToHours } from './calc'
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
  const padStartArr = Array.from({ length: padStart }, (_, i) => null)
  const padEndArr = Array.from({ length: Math.max(0, padEnd) }, () => null)
  const gridDays = [...padStartArr, ...days.map((d) => d), ...padEndArr]

  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  let monthTotal = 0
  let monthOt = 0
  days.forEach((d) => {
    const key = dateKey(d)
    const shifts = doc.days[key] ?? []
    monthTotal += totalMinutes(shifts)
    monthOt += otMinutes(shifts)
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Tổng tháng: <strong className="text-slate-700 dark:text-slate-200">{formatHours(monthTotal)}</strong>
          {monthOt > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              OT: {formatHours(monthOt)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-1"
          >
            {w}
          </div>
        ))}
        {gridDays.map((d, i) => {
          if (d == null) {
            return <div key={`pad-${i}`} className="aspect-square" />
          }
          const key = dateKey(d)
          const shifts = doc.days[key] ?? []
          const totalM = totalMinutes(shifts)
          const otM = otMinutes(shifts)
          const isToday =
            d.getDate() === new Date().getDate() &&
            d.getMonth() === new Date().getMonth() &&
            d.getFullYear() === new Date().getFullYear()

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                'aspect-square min-h-[52px] sm:min-h-[64px] flex flex-col items-center justify-center rounded-cardSm border text-left p-1 transition shadow-card hover:shadow-cardHover',
                isSameMonth(d, start)
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 text-slate-400',
                isToday && 'ring-2 ring-slate-400 dark:ring-slate-500'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  isSameMonth(d, start) ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                )}
              >
                {format(d, 'd')}
              </span>
              {shifts.length > 0 && (
                <>
                  <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {formatHours(totalM)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {shifts.length} ca
                  </span>
                  {otM > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 px-1 rounded mt-0.5">
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
