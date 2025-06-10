# ระบบสั่งของภายในองค์กร

ระบบสั่งของภายในองค์กรผ่านเว็บแอพพลิเคชัน ใช้ Google Sheets เป็นฐานข้อมูล

## คุณสมบัติ
- ระบบล็อกอิน
- จัดการสินค้า (เพิ่ม/แก้ไข/ลบ)
- ตะกร้าสั่งซื้อ
- ส่วนผู้ดูแลระบบ
- รายงานสรุปการสั่งซื้อ

## การติดตั้ง
1. สร้าง Google Sheets และคัดลอก Spreadsheet ID
2. สร้าง Google Apps Script project และ deploy เป็น web app
3. คัดลอก URL ของ web app ไปใส่ในไฟล์ index.html (SCRIPT_URL)
4. เปิดไฟล์ index.html ในเว็บบราวเซอร์

## Google Sheets Structure
- Users: ข้อมูลผู้ใช้
- Products: ข้อมูลสินค้า
- Categories: หมวดหมู่สินค้า
- Units: หน่วยนับ
- Orders: รายการสั่งซื้อ
- OrderDates: วันที่เปิดรับออเดอร์

## การพัฒนา
- Frontend: HTML, JavaScript
- Backend: Google Apps Script
- Database: Google Sheets

## Note
โปรดแก้ไข SCRIPT_URL และ SPREADSHEET_ID ในไฟล์ index.html ให้ตรงกับการติดตั้งของคุณ
