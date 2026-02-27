import ExcelJS from 'exceljs'
import { format, getDay } from 'date-fns'
import type { MonthDoc } from '../../types'
import { dateKey } from '../../types'
import {
  shiftDurationMinutes,
  minutesToHours,
  totalMinutes,
  otMinutes,
  SHIFT_TYPE_LABELS,
} from './calc'

function allDatesInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const out: Date[] = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d))
  }
  return out
}

export async function exportMonthToExcel(doc: MonthDoc): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ChamCong App'

  // Sheet 1: Tổng hợp tháng
  const wsSummary = wb.addWorksheet('Tổng hợp', { views: [{ state: 'frozen', ySplit: 1 }] })
  wsSummary.columns = [
    { header: 'Ngày', key: 'date', width: 12 },
    { header: 'Thứ', key: 'dayOfWeek', width: 10 },
    { header: 'Tổng giờ', key: 'totalHours', width: 12 },
    { header: 'OT (giờ)', key: 'otHours', width: 10 },
    { header: 'Số ca', key: 'shiftCount', width: 8 },
    { header: 'Ghi chú', key: 'notes', width: 30 },
  ]
  const headerRow = wsSummary.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const dates = allDatesInMonth(doc.year, doc.month)
  const summaryHasShifts: boolean[] = []
  for (const d of dates) {
    const key = dateKey(d)
    const shifts = doc.days[key] ?? []
    summaryHasShifts.push(shifts.length > 0)
    const totalM = totalMinutes(shifts)
    const otM = otMinutes(shifts)
    const notes = shifts.map((s) => s.note).filter(Boolean).join('; ') || ''
    wsSummary.addRow({
      date: format(d, 'dd/MM/yyyy'),
      dayOfWeek: dayNames[getDay(d)],
      totalHours: minutesToHours(totalM),
      otHours: minutesToHours(otM),
      shiftCount: shifts.length,
      notes,
    })
  }
  // Highlight các ngày có ca làm (sheet Tổng hợp)
  const highlightFill = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FFE8F5E9' }, // xanh lá nhạt
  }
  for (let i = 0; i < summaryHasShifts.length; i++) {
    if (summaryHasShifts[i]) {
      const row = wsSummary.getRow(i + 2)
      row.eachCell((cell) => { cell.fill = highlightFill })
    }
  }

  // Sheet 2: Chi tiết ca
  const wsDetail = wb.addWorksheet('Chi tiết', { views: [{ state: 'frozen', ySplit: 1 }] })
  wsDetail.columns = [
    { header: 'Ngày', key: 'date', width: 12 },
    { header: 'Bắt đầu', key: 'start', width: 10 },
    { header: 'Kết thúc', key: 'end', width: 10 },
    { header: 'Nghỉ (phút)', key: 'break', width: 12 },
    { header: 'Giờ', key: 'hours', width: 10 },
    { header: 'Loại', key: 'type', width: 12 },
    { header: 'Ghi chú', key: 'note', width: 28 },
  ]
  const detailHeader = wsDetail.getRow(1)
  detailHeader.font = { bold: true }
  detailHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }

  let detailRowIndex = 2
  for (const d of dates) {
    const key = dateKey(d)
    const shifts = doc.days[key] ?? []
    for (const s of shifts) {
      const hours = minutesToHours(shiftDurationMinutes(s))
      wsDetail.addRow({
        date: format(d, 'dd/MM/yyyy'),
        start: s.start,
        end: s.end,
        break: s.breakMinutes ?? 0,
        hours,
        type: SHIFT_TYPE_LABELS[s.type],
        note: s.note || '',
      })
      // Highlight dòng chi tiết (ngày có ca)
      const row = wsDetail.getRow(detailRowIndex)
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E9' },
        }
      })
      detailRowIndex += 1
    }
  }

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function excelFileName(year: number, month: number): string {
  return `ChamCong_${year}-${String(month).padStart(2, '0')}.xlsx`
}
