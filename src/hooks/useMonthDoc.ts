import { useState, useEffect, useCallback } from 'react'
import type { MonthDoc, Shift } from '../types'
import { dateKey } from '../types'
import { getMonth, setMonth } from '../features/timesheet/storage'

export function useMonthDoc(year: number, month: number) {
  const [doc, setDoc] = useState<MonthDoc | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getMonth(year, month)
    if (data) {
      setDoc(data)
    } else {
      setDoc({ year, month, days: {} })
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (next: MonthDoc) => {
      setDoc(next)
      await setMonth(next)
    },
    []
  )

  const setShiftsForDate = useCallback(
    (date: Date, shifts: Shift[]) => {
      if (!doc) return
      const key = dateKey(date)
      const next = { ...doc, days: { ...doc.days, [key]: shifts } }
      save(next)
    },
    [doc, save]
  )

  const addShift = useCallback(
    (date: Date, shift: Shift) => {
      if (!doc) return
      const key = dateKey(date)
      const current = doc.days[key] ?? []
      setShiftsForDate(date, [...current, shift])
    },
    [doc, setShiftsForDate]
  )

  const updateShift = useCallback(
    (date: Date, shift: Shift) => {
      if (!doc) return
      const key = dateKey(date)
      const current = doc.days[key] ?? []
      const next = current.map((s) => (s.id === shift.id ? shift : s))
      setShiftsForDate(date, next)
    },
    [doc, setShiftsForDate]
  )

  const removeShift = useCallback(
    (date: Date, shiftId: string) => {
      if (!doc) return
      const key = dateKey(date)
      const current = doc.days[key] ?? []
      const next = current.filter((s) => s.id !== shiftId)
      if (next.length === 0) {
        const { [key]: _, ...rest } = doc.days
        save({ ...doc, days: rest })
      } else {
        setShiftsForDate(date, next)
      }
    },
    [doc, setShiftsForDate, save]
  )

  const getShifts = useCallback(
    (date: Date): Shift[] => {
      if (!doc) return []
      return doc.days[dateKey(date)] ?? []
    },
    [doc]
  )

  return {
    doc: doc ?? { year, month, days: {} },
    loading,
    reload: load,
    addShift,
    updateShift,
    removeShift,
    setShiftsForDate,
    getShifts,
  }
}
