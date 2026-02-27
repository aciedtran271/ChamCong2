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
const CHILD_NAMES = ['Bi', 'Phú Quý', 'Khôi', 'Bo']
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

export async function exportMonthToExcel(doc: MonthDoc): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ChamCong App'

  const year = doc.year
  const month = doc.month
  const monthName = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'][month]
  const dates = allDatesInMonth(year, month)
  const numDays = dates.length

  // --- Sheet 1: Bảng chấm công theo mẫu AN HY ---
  const ws = wb.addWorksheet('Chấm công', { views: [{ state: 'frozen', ySplit: 2 }] })

  // Cột: A=Tuần, B=Ngày, C=Thứ, D=Bi, E=Phú Quý, F=Khôi, G=Bo, H=Ghi chú
  const colTuần = 1
  const colNgày = 2
  const colThứ = 3
  const colFirstChild = 4
  const colGhiChú = 4 + CHILD_NAMES.length // 8

  // Row 1: Tiêu đề
  const title = `${TITLE_PREFIX} - BẢNG CHẤM CÔNG THÁNG ${monthName} NĂM ${year}`
  ws.mergeCells(1, 1, 1, colGhiChú)
  const titleCell = ws.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }

  // Row 2: Header
  const headerRow = ws.getRow(2)
  headerRow.values = ['Tuần', 'Ngày', 'Thứ', ...CHILD_NAMES, 'Ghi chú']
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  }

  // Data rows: mỗi ngày một dòng
  const dataStartRow = 3
  const totalHoursPerDay: number[] = []
  const childColumns = [0, 1, 2, 3] // Bi, Phú Quý, Khôi, Bo - tổng giờ mỗi cột (chỉ cột 0 dùng từ app)
  const sumsPerChild = [0, 0, 0, 0]

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]
    const key = dateKey(d)
    const shifts = doc.days[key] ?? []
    const totalM = totalMinutes(shifts)
    const hours = minutesToHours(totalM)
    totalHoursPerDay.push(hours)
    const notes = shifts.map((s) => s.note).filter(Boolean).join('; ') || ''

    // Cột Bi = tổng giờ ngày đó (dữ liệu app); Phú Quý, Khôi, Bo = 0
    sumsPerChild[0] += hours

    const row = ws.getRow(dataStartRow + i)
    const weekNum = Math.floor(i / 7) + 1
    row.values = [
      `Tuần ${weekNum}`,
      d.getDate(),
      DAY_NAMES_VI[getDay(d)],
      hours,
      0,
      0,
      0,
      notes,
    ]
    row.getCell(colNgày).numFmt = '0'
    row.getCell(colFirstChild).numFmt = '0.00'
    row.getCell(colFirstChild + 1).numFmt = '0.00'
    row.getCell(colFirstChild + 2).numFmt = '0.00'
    row.getCell(colFirstChild + 3).numFmt = '0.00'

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

  // Gộp ô cột Tuần theo từng tuần (7 ngày = 1 tuần)
  for (let w = 0; w < Math.ceil(numDays / 7); w++) {
    const startR = dataStartRow + w * 7
    const endR = Math.min(dataStartRow + (w + 1) * 7, dataStartRow + numDays) - 1
    if (startR <= endR) {
      ws.mergeCells(startR, colTuần, endR, colTuần)
      const cell = ws.getCell(startR, colTuần)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB3E5FC' }, // xanh dương nhạt
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    }
  }

  // Dòng tổng: TỔNG GIỜ HỌC MỖI TRẺ
  const sumRow1 = dataStartRow + numDays
  ws.getCell(sumRow1, colTuần).value = 'TỔNG GIỜ HỌC MỖI TRẺ:'
  ws.getCell(sumRow1, colTuần).font = { bold: true }
  for (let c = 0; c < CHILD_NAMES.length; c++) {
    const cell = ws.getCell(sumRow1, colFirstChild + c)
    cell.value = sumsPerChild[c]
    cell.numFmt = '0.00'
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC8E6C9' }, // xanh lá nhạt
    }
  }

  // Dòng tổng: TỔNG GIỜ LÀM TRONG THÁNG
  const totalMonth = totalHoursPerDay.reduce((a, b) => a + b, 0)
  const sumRow2 = sumRow1 + 1
  ws.getCell(sumRow2, colTuần).value = 'TỔNG GIỜ LÀM TRONG THÁNG ='
  ws.getCell(sumRow2, colTuần).font = { bold: true }
  ws.mergeCells(sumRow2, colNgày, sumRow2, colFirstChild + CHILD_NAMES.length - 1)
  const totalCell = ws.getCell(sumRow2, colNgày)
  totalCell.value = totalMonth
  totalCell.numFmt = '0.00'
  totalCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE0B2' }, // cam nhạt
  }
  totalCell.alignment = { horizontal: 'center' }

  // Cột rộng
  ws.getColumn(colTuần).width = 10
  ws.getColumn(colNgày).width = 8
  ws.getColumn(colThứ).width = 8
  for (let c = 0; c < CHILD_NAMES.length; c++) ws.getColumn(colFirstChild + c).width = 12
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
