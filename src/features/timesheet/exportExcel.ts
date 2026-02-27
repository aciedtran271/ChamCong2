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

const TITLE_PREFIX = 'AN HY'
const DAY_NAMES_VI = ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'] // 0=CN, 1=Hai, ...

function allDatesInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const out: Date[] = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d))
  }
  return out
}

/** childNames: tên các cột do người dùng nhập (lấy từ getExportColumnNames() nếu không truyền) */
export async function exportMonthToExcel(doc: MonthDoc, childNames: string[]): Promise<Blob> {
  const names = childNames.length > 0 ? childNames : ['Bi', 'Phú Quý', 'Khôi', 'Bo']
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ChamCong App'

  const year = doc.year
  const month = doc.month
  const monthName = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'][month]
  const dates = allDatesInMonth(year, month)
  const numDays = dates.length

  // --- Sheet 1: Bảng chấm công theo mẫu AN HY ---
  const ws = wb.addWorksheet('Chấm công', { views: [{ state: 'frozen', ySplit: 2 }] })

  const colTuần = 1
  const colNgày = 2
  const colThứ = 3
  const colFirstChild = 4
  const colGhiChú = 4 + names.length

  // Row 1: Tiêu đề
  const title = `${TITLE_PREFIX} - BẢNG CHẤM CÔNG THÁNG ${monthName} NĂM ${year}`
  ws.mergeCells(1, 1, 1, colGhiChú)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }

  // Row 2: Header (tên cột do người dùng nhập)
  const headerRow = ws.getRow(2)
  headerRow.values = ['Tuần', 'Ngày', 'Thứ', ...names, 'Ghi chú']
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }

  const dataStartRow = 3
  const totalHoursPerDay: number[] = []
  const sumsPerChild = names.map(() => 0)
  const countPerChild = names.map(() => 0)

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]
    const key = dateKey(d)
    const shifts = doc.days[key] ?? []
    const notes = shifts.map((s) => s.note).filter(Boolean).join('; ') || ''

    const hoursPerColumn = names.map(() => 0)
    for (const s of shifts) {
      const col = Math.min(
        Math.max(0, s.columnIndex ?? 0),
        names.length - 1
      )
      const h = minutesToHours(shiftDurationMinutes(s))
      hoursPerColumn[col] += h
      sumsPerChild[col] += h
      countPerChild[col] += 1
    }
    totalHoursPerDay.push(hoursPerColumn.reduce((a, b) => a + b, 0))

    const row = ws.getRow(dataStartRow + i)
    const weekNum = Math.floor(i / 7) + 1
    row.values = [`Tuần ${weekNum}`, d.getDate(), DAY_NAMES_VI[getDay(d)], ...hoursPerColumn, notes]
    row.getCell(colNgày).numFmt = '0'
    for (let c = 0; c < names.length; c++) {
      row.getCell(colFirstChild + c).numFmt = '0.00'
    }

    if (shifts.length > 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E9' },
        }
      })
    }
  }

  for (let w = 0; w < Math.ceil(numDays / 7); w++) {
    const startR = dataStartRow + w * 7
    const endR = Math.min(dataStartRow + (w + 1) * 7, dataStartRow + numDays) - 1
    if (startR <= endR) {
      ws.mergeCells(startR, colTuần, endR, colTuần)
      const cell = ws.getCell(startR, colTuần)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3E5FC' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
  }

  const sumRow1 = dataStartRow + numDays
  ws.getCell(sumRow1, colTuần).value = 'TỔNG GIỜ HỌC MỖI TRẺ:'
  ws.getCell(sumRow1, colTuần).font = { bold: true }
  for (let c = 0; c < names.length; c++) {
    const cell = ws.getCell(sumRow1, colFirstChild + c)
    cell.value = sumsPerChild[c]
    cell.numFmt = '0.00'
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC8E6C9' },
    }
  }

  const sumRow1b = sumRow1 + 1
  ws.getCell(sumRow1b, colTuần).value = 'SỐ CA MỖI TRẺ:'
  ws.getCell(sumRow1b, colTuần).font = { bold: true }
  for (let c = 0; c < names.length; c++) {
    const cell = ws.getCell(sumRow1b, colFirstChild + c)
    cell.value = countPerChild[c]
    cell.numFmt = '0'
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE1F5FE' },
    }
  }

  const totalMonth = totalHoursPerDay.reduce((a, b) => a + b, 0)
  const sumRow2 = sumRow1b + 1
  ws.getCell(sumRow2, colTuần).value = 'TỔNG GIỜ LÀM TRONG THÁNG ='
  ws.getCell(sumRow2, colTuần).font = { bold: true }
  ws.mergeCells(sumRow2, colNgày, sumRow2, colFirstChild + names.length - 1)
  const totalCell = ws.getCell(sumRow2, colNgày)
  totalCell.value = totalMonth
  totalCell.numFmt = '0.00'
  totalCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE0B2' },
  }
  totalCell.alignment = { horizontal: 'center' }

  ws.getColumn(colTuần).width = 10
  ws.getColumn(colNgày).width = 8
  ws.getColumn(colThứ).width = 8
  for (let c = 0; c < names.length; c++) ws.getColumn(colFirstChild + c).width = 12
  ws.getColumn(colGhiChú).width = 28

  // --- Sheet 2: Chi tiết ca (giữ nguyên) ---
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
