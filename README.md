# Chấm Công – App chấm công cá nhân

App chấm công tĩnh (static), mobile-first: chọn tháng → xem lịch → thêm/sửa ca → tự tính tổng giờ & OT → xuất Excel. Dữ liệu lưu cục bộ (IndexedDB), có PWA và deploy GitHub Pages.

## Tính năng

- **Lịch tháng**: Chọn tháng/năm, xem lưới ngày với tổng giờ, số ca, badge OT.
- **Nhiều ca/ngày**: Mỗi ngày có nhiều ca (Start–End, nghỉ, loại: Làm việc/OT/Nghỉ/Khác, ghi chú).
- **Tự tính**: Tổng giờ/ngày, tổng giờ/tháng, tổng OT, số ca.
- **Xuất Excel (.xlsx)**: 2 sheet (Tổng hợp tháng + Chi tiết ca), tên file `ChamCong_YYYY-MM.xlsx`.
- **Lưu cục bộ**: LocalForage (IndexedDB), key `month:YYYY-MM`.
- **Backup**: Xuất/Import JSON toàn bộ tháng.
- **UX mobile**: Bottom sheet ngày, form ca, nút “Ca mẫu”, “Copy hôm trước”, nhân bản ca, hoàn tác sau xóa (toast).
- **PWA**: Offline-first, “Add to Home Screen”.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- date-fns, ExcelJS, LocalForage
- vite-plugin-pwa

## Cấu trúc repo

```
/src
  /components      # Toast, ...
  /features/timesheet
    MonthView.tsx  # Lưới lịch tháng
    DayDrawer.tsx # Bottom sheet danh sách ca 1 ngày
    ShiftForm.tsx # Form thêm/sửa ca
    calc.ts       # Tính giờ, OT, validation
    storage.ts    # LocalForage get/set month
    exportExcel.ts# Xuất .xlsx 2 sheet
  /hooks          # useMonthDoc
  /lib            # utils
  App.tsx
```

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## Build & Deploy GitHub Pages

1. Repo public (hoặc bật Pages cho private nếu gói cho phép).
2. Trong **Settings → Pages**: Source = **GitHub Actions**.
3. Đổi `base` trong `vite.config.ts` nếu repo khác tên (mặc định `/ChamCong2/`).
4. Push branch `main` → workflow **Deploy GitHub Pages** build và deploy `dist` lên Pages.

Demo: `https://<user>.github.io/ChamCong2/`

## Data model (gợi ý – ổn định)

- **MonthDoc**: `{ year, month, days: { "YYYY-MM-DD": Shift[] } }`
- **Shift**: `id`, `start` (HH:mm), `end` (HH:mm, có thể qua ngày), `breakMinutes`, `type` (Work|OT|Leave|Other), `note`, `location?`

Lưu theo key `month:YYYY-MM` để load nhanh theo tháng.

## Business logic

- **Tính giờ 1 ca**: `duration = end - start` (nếu end < start thì +24h), trừ `breakMinutes`, không âm.
- **OT**: theo `type === "OT"`.
- **Cảnh báo**: ca > 16h.

## License

MIT.
