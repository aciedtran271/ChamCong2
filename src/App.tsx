import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { MonthView, getPrevMonth, getNextMonth } from './features/timesheet/MonthView'
import { DayDrawer } from './features/timesheet/DayDrawer'
import { ShiftForm } from './features/timesheet/ShiftForm'
import { useMonthDoc } from './hooks/useMonthDoc'
import { exportMonthToExcel, excelFileName } from './features/timesheet/exportExcel'
import { exportAllMonthsJson, importMonthsJson, removeMonth, getExportColumnNames } from './features/timesheet/storage'
import type { Shift } from './types'
import { Toast } from './components/Toast'
import { ExportNamesEditor } from './components/ExportNamesEditor'

function App() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [formShift, setFormShift] = useState<Shift | null | 'new'>(null)
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showExportNamesEditor, setShowExportNamesEditor] = useState(false)

  const {
    doc,
    loading,
    addShift,
    updateShift,
    removeShift,
    getShifts,
    setShiftsForDate,
    reload,
  } = useMonthDoc(year, month)

  const shiftsForSelected = selectedDate ? getShifts(selectedDate) : []

  const handleSelectDay = useCallback((date: Date) => {
    setSelectedDate(date)
    setFormShift(null)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedDate(null)
    setFormShift(null)
  }, [])

  const handleSaveShift = useCallback(
    (shift: Shift) => {
      if (!selectedDate) return
      if (formShift && formShift !== 'new' && formShift.id === shift.id) {
        updateShift(selectedDate, shift)
      } else {
        addShift(selectedDate, shift)
      }
      setFormShift(null)
    },
    [selectedDate, formShift, updateShift, addShift]
  )

  const handleDeleteShift = useCallback(
    (shift: Shift) => {
      if (!selectedDate) return
      const prev = [...getShifts(selectedDate)]
      removeShift(selectedDate, shift.id)
      setToast({
        message: 'Đã xóa ca.',
        undo: () => setShiftsForDate(selectedDate, prev),
      })
      setFormShift(null)
    },
    [selectedDate, removeShift, getShifts, setShiftsForDate]
  )

  const handleDuplicateShift = useCallback(
    (shift: Shift) => {
      if (!selectedDate) return
      const copy: Shift = {
        ...shift,
        id: crypto.randomUUID(),
        note: shift.note ? `${shift.note} (bản sao)` : 'Bản sao',
      }
      addShift(selectedDate, copy)
      setToast({ message: 'Đã nhân bản ca.' })
    },
    [selectedDate, addShift]
  )

  const handleAddTemplateShifts = useCallback(() => {
    if (!selectedDate) return
    addShift(selectedDate, {
      id: crypto.randomUUID(),
      start: '08:00',
      end: '12:00',
      breakMinutes: 0,
      type: 'Work',
      note: '',
    })
    addShift(selectedDate, {
      id: crypto.randomUUID(),
      start: '13:00',
      end: '17:00',
      breakMinutes: 0,
      type: 'Work',
      note: '',
    })
    setToast({ message: 'Đã thêm 2 ca mẫu (8h-12h, 13h-17h).' })
  }, [selectedDate, addShift])

  const handleDuplicateYesterday = useCallback(() => {
    if (!selectedDate) return
    const yesterday = new Date(selectedDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const prevShifts = getShifts(yesterday)
    if (prevShifts.length === 0) {
      setToast({ message: 'Hôm trước không có ca nào.' })
      return
    }
    prevShifts.forEach((s) => {
      addShift(selectedDate, {
        ...s,
        id: crypto.randomUUID(),
        note: s.note ? `${s.note} (copy)` : '',
      })
    })
    setToast({ message: `Đã nhân bản ${prevShifts.length} ca từ hôm trước.` })
  }, [selectedDate, getShifts, addShift])

  const handleExportExcel = useCallback(async () => {
    try {
      const childNames = getExportColumnNames()
      const blob = await exportMonthToExcel(doc, childNames)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = excelFileName(doc.year, doc.month)
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: 'Đã xuất Excel.' })
    } catch (e) {
      setToast({ message: 'Lỗi xuất Excel.' })
    }
  }, [doc])

  const handleExportJson = useCallback(async () => {
    try {
      const json = await exportAllMonthsJson()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ChamCong_backup_${format(new Date(), 'yyyy-MM-dd')}.json`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: 'Đã xuất backup JSON.' })
    } catch (e) {
      setToast({ message: 'Lỗi xuất backup.' })
    }
  }, [])

  const handleImportJson = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const text = await file.text()
        const { count } = await importMonthsJson(text)
        setToast({ message: `Đã import ${count} tháng.` })
        reload()
      } catch (err) {
        setToast({ message: 'Lỗi đọc file JSON.' })
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }, [reload])

  const handleDeleteMonthData = useCallback(async () => {
    if (!confirm(`Xóa toàn bộ dữ liệu tháng ${month}/${year}?`)) return
    await removeMonth(year, month)
    reload()
    setToast({ message: 'Đã xóa dữ liệu tháng.' })
    handleCloseDrawer()
  }, [year, month, reload, handleCloseDrawer])

  const goPrev = useCallback(() => {
    const prev = getPrevMonth(year, month)
    setYear(prev.year)
    setMonth(prev.month)
  }, [year, month])

  const goNext = useCallback(() => {
    const next = getNextMonth(year, month)
    setYear(next.year)
    setMonth(next.month)
  }, [year, month])

  const monthTitle = `${year} - Tháng ${month}`

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 safe-area-inset-top">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tháng trước"
            >
              ‹
            </button>
            <h1 className="text-lg font-semibold min-w-[120px] text-center">{monthTitle}</h1>
            <button
              type="button"
              onClick={goNext}
              className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Tháng sau"
            >
              ›
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportExcel}
              className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Xuất Excel"
            >
              📥
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="min-h-touch min-w-[44px] rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Menu"
            >
              ⋮
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="absolute right-4 top-full mt-1 py-2 bg-white dark:bg-slate-800 rounded-card shadow-card border border-slate-200 dark:border-slate-700 min-w-[180px] z-10">
            <button
              type="button"
              onClick={() => { setShowExportNamesEditor(true); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 min-h-touch text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Tên cột bảng chấm công
            </button>
            <button
              type="button"
              onClick={() => { handleExportJson(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 min-h-touch text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Xuất backup JSON
            </button>
            <button
              type="button"
              onClick={() => { handleImportJson(); setMenuOpen(false); }}
              disabled={importing}
              className="w-full text-left px-4 py-2 min-h-touch text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Import backup JSON
            </button>
            <button
              type="button"
              onClick={() => { handleDeleteMonthData(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2 min-h-touch text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Xóa dữ liệu tháng này
            </button>
          </div>
          </>
        )}
      </header>

      <main className="p-4 pb-24 max-w-2xl mx-auto">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-cardSm" />
              ))}
            </div>
          </div>
        ) : (
          <MonthView doc={doc} onSelectDay={handleSelectDay} />
        )}
      </main>

      {selectedDate && (
        <>
          {formShift !== null ? (
            <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
              <div className="max-h-[90vh] overflow-y-auto">
                <ShiftForm
                  initial={formShift === 'new' ? undefined : formShift}
                  dateLabel={format(selectedDate, 'dd/MM/yyyy')}
                  onSave={handleSaveShift}
                  onCancel={() => setFormShift(null)}
                />
              </div>
            </div>
          ) : (
            <DayDrawer
              date={selectedDate}
              shifts={shiftsForSelected}
              onClose={handleCloseDrawer}
              onAddShift={() => setFormShift('new')}
              onEditShift={(s) => setFormShift(s)}
              onDeleteShift={handleDeleteShift}
              onDuplicateShift={handleDuplicateShift}
              onAddTemplateShifts={handleAddTemplateShifts}
              onDuplicateYesterday={handleDuplicateYesterday}
            />
          )}
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          action={toast.undo ? { label: 'Hoàn tác', onClick: toast.undo } : undefined}
          onClose={() => setToast(null)}
        />
      )}

      {showExportNamesEditor && (
        <ExportNamesEditor
          onClose={() => setShowExportNamesEditor(false)}
          onSaved={() => setToast({ message: 'Đã lưu tên cột.' })}
        />
      )}
    </div>
  )
}

export default App
