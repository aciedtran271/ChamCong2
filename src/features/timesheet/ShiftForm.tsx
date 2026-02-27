import { useState } from 'react'
import type { Shift, ShiftType } from '../../types'
import { getExportColumnNames } from './storage'
import { SHIFT_TYPE_LABELS, isLongShift } from './calc'
import { cn } from '../../lib/utils'

const SHIFT_TYPES: ShiftType[] = ['Work', 'OT', 'Leave', 'Other']

interface ShiftFormProps {
  initial?: Partial<Shift> | null
  dateLabel: string
  onSave: (shift: Shift) => void
  onCancel: () => void
}

function toTimeInput(value: string): string {
  if (!value) return ''
  const [h, m] = value.split(':')
  return `${(h ?? '00').padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`
}

export function ShiftForm({ initial, dateLabel, onSave, onCancel }: ShiftFormProps) {
  const [start, setStart] = useState(toTimeInput(initial?.start ?? '08:00'))
  const [end, setEnd] = useState(toTimeInput(initial?.end ?? '17:00'))
  const [breakMinutes, setBreakMinutes] = useState(initial?.breakMinutes ?? 60)
  const [type, setType] = useState<ShiftType>(initial?.type ?? 'Work')
  const [note, setNote] = useState(initial?.note ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const columnNames = getExportColumnNames()
  const [columnIndex, setColumnIndex] = useState(
    initial?.columnIndex !== undefined && initial.columnIndex >= 0 && initial.columnIndex < columnNames.length
      ? initial.columnIndex
      : 0
  )

  const draft: Shift = {
    id: initial?.id ?? crypto.randomUUID(),
    start: start || '08:00',
    end: end || '17:00',
    breakMinutes: breakMinutes >= 0 ? breakMinutes : 0,
    type,
    note: note.trim(),
    location: location.trim() || undefined,
    columnIndex: columnIndex >= 0 && columnIndex < columnNames.length ? columnIndex : 0,
  }

  const longWarning = isLongShift(draft)
  const valid = start && end && breakMinutes >= 0

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 bg-white dark:bg-slate-900 rounded-t-2xl shadow-lg">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{dateLabel}</div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">Bắt đầu</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">Kết thúc</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-600 dark:text-slate-300">Nghỉ (phút)</span>
        <input
          type="number"
          min={0}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
          className="min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
        />
      </label>

      <div>
        <span className="text-sm text-slate-600 dark:text-slate-300 block mb-2">Thuộc cột (trẻ)</span>
        <select
          value={columnIndex}
          onChange={(e) => setColumnIndex(Number(e.target.value))}
          className="w-full min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
        >
          {columnNames.map((name, idx) => (
            <option key={idx} value={idx}>
              {name || `Cột ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="text-sm text-slate-600 dark:text-slate-300 block mb-2">Loại ca</span>
        <div className="flex flex-wrap gap-2">
          {SHIFT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'min-h-touch px-4 rounded-full text-sm font-medium transition',
                type === t
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              )}
            >
              {SHIFT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-600 dark:text-slate-300">Ghi chú</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tùy chọn"
          className="min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-600 dark:text-slate-300">Dự án / Địa điểm</span>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Tùy chọn"
          className="min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
        />
      </label>

      {longWarning && (
        <p className="text-amber-600 dark:text-amber-400 text-sm">Ca hơn 16 giờ – kiểm tra lại giờ.</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-touch rounded-cardSm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={() => valid && onSave(draft)}
          disabled={!valid}
          className="flex-1 min-h-touch rounded-cardSm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium disabled:opacity-50"
        >
          Lưu
        </button>
      </div>
    </div>
  )
}
