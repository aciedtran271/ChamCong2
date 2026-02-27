import { useState, useEffect } from 'react'
import { getExportColumnNames, setExportColumnNames } from '../features/timesheet/storage'

interface ExportNamesEditorProps {
  onClose: () => void
  onSaved?: () => void
}

export function ExportNamesEditor({ onClose, onSaved }: ExportNamesEditorProps) {
  const [names, setNames] = useState<string[]>(() => getExportColumnNames())

  useEffect(() => {
    setNames(getExportColumnNames())
  }, [])

  const add = () => setNames((prev) => [...prev, ''])
  const remove = (index: number) => setNames((prev) => prev.filter((_, i) => i !== index))
  const change = (index: number, value: string) => {
    setNames((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const save = () => {
    const trimmed = names.map((s) => s.trim()).filter(Boolean)
    setExportColumnNames(trimmed.length > 0 ? trimmed : ['Bi', 'Phú Quý', 'Khôi', 'Bo'])
    onSaved?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Tên cột bảng chấm công (Excel)
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Các cột này sẽ hiển thị trong file Excel. Cột đầu tiên dùng cho tổng giờ của bạn; các cột còn lại để bạn nhập tên (trẻ/người) tùy ý.
        </p>
        <div className="space-y-2 mb-4">
          {names.map((name, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => change(i, e.target.value)}
                placeholder={`Cột ${i + 1}`}
                className="flex-1 min-h-touch rounded-cardSm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-base"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={names.length <= 1}
                className="min-h-touch min-w-[44px] rounded-cardSm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="w-full min-h-touch rounded-cardSm border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 mb-4"
        >
          + Thêm cột
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-touch rounded-cardSm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 min-h-touch rounded-cardSm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
