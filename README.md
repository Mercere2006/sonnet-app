# Sonnet & co.

## Google Sheets และรูปหน้าปก

ระบบเพิ่มหนังสือใช้ Google Apps Script เก็บไฟล์รูปไว้ในโฟลเดอร์
`Sonnet Book Covers` บน Google Drive แล้วบันทึก direct URL ลงคอลัมน์
`ลิงก์รูปภาพ` ของชีต `Sheet Name`

### ติดตั้ง Google Apps Script

1. เปิด Google Sheet `BookStock`
2. ไปที่ **Extensions → Apps Script**
3. แทนที่โค้ดเดิมด้วยไฟล์ [`apps-script/Code.gs`](./apps-script/Code.gs)
4. กด **Deploy → Manage deployments → Edit**
5. เลือก **New version**, ตั้ง **Execute as: Me** และ
   **Who has access: Anyone**
6. กด Deploy และอนุญาตสิทธิ์ Google Sheets/Google Drive
7. ถ้า URL ของ Web app เปลี่ยน ให้อัปเดต `API_URL` ใน `src/App.jsx`

ต้อง Deploy เป็นเวอร์ชันใหม่ทุกครั้งที่แก้ `Code.gs`; การกด Save อย่างเดียวไม่อัปเดต
Web app ที่ใช้งานอยู่

## Development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
