import { format } from 'date-fns'
import type { Shift } from '../../types'
import { getExportColumnNames } from './storage'
import { shiftDurationMinutes, otMinutes, totalMinutes, SHIFT_TYPE_LABELS } from './calc'
import { formatHours } from '../../lib/utils'
import { cn } from '../../lib/utils'

export interface DayDrawerProps {
  date: Date
  shifts: Shift[]
  onClose: () => void
  onAddShift: () => void
  onEditShift: (shift: Shift) => void
  onDeleteShift: (shift: Shift) => void
  onDuplicateShift: (shift: Shift) => void
  onAddTemplateShifts?: () => void
  onDuplicateYesterday?: () => void
  formatHoursFn?: (minutes: number) => string
}

export function DayDrawer({
  date,
  shifts,
  onClose,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onDuplicateShift,
  onAddTemplateShifts,
  onDuplicateYesterday,
  formatHoursFn = formatHours,
}: DayDrawerProps) {
  const totalM = totalMinutes(shifts)
  const otM = otMinutes(shifts)
  const columnNames = getExportColumnNames()
  const dateStr = format(date, 'dd/MM/yyyy')
  const dayName = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()]

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black/40" onClick={onClose}>
      <div
        className="mt-auto bg-white dark:bg-[#1c2130] rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.2)] max-h-[78vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {dateStr} – {dayName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tổng: {formatHoursFn(totalM)} {otM > 0 && ` · OT: ${formatHoursFn(otM)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {shifts.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-6">Chưa có ca nào. Thêm ca bên dưới.</p>
          ) : (
            shifts.map((s) => {
              const dur = shiftDurationMinutes(s)
              const isOt = s.type === 'OT'
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-card bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {s.start} – {s.end}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isOt ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                        )}
                      >
                        {SHIFT_TYPE_LABELS[s.type]}
                      </span>
                      {columnNames.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                          {columnNames[Math.min(Math.max(0, s.columnIndex ?? 0), columnNames.length - 1)]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatHoursFn(dur)} {s.breakMinutes > 0 && `(nghỉ ${s.breakMinutes}p)`}
                    </p>
                    {s.note && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 truncate">{s.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateShift(s)}
                      className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                      title="Nhân bản"
                    >
                      📋
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditShift(s)}
                      className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                      title="Sửa"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteShift(s)}
                      className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex gap-2">
            {onAddTemplateShifts && (
              <button
                type="button"
                onClick={onAddTemplateShifts}
                className="flex-1 min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Ca mẫu
              </button>
            )}
            {onDuplicateYesterday && (
              <button
                type="button"
                onClick={onDuplicateYesterday}
                className="flex-1 min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Copy hôm trước
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onAddShift}
            className="w-full min-h-touch rounded-card bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Thêm ca
          </button>
        </div>
      </div>
    </div>
  )
}
