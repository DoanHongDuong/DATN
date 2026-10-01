# DATN — Nền tảng hỗ trợ sức khỏe tinh thần và sơ cứu tâm lý cộng đồng

Đồ án tốt nghiệp — hệ thống web hỗ trợ sàng lọc tâm lý (PHQ-9/GAD-7), nhật ký cảm xúc
tích hợp AI, và kết nối hỗ trợ trực tuyến với tình nguyện viên qua chat thời gian thực.

## Tech stack

- **Frontend:** React + TypeScript + Ant Design + React Query + React Router (Vercel)
- **Backend:** NestJS + TypeScript, Clean Architecture (Render)
- **Database:** PostgreSQL + Prisma ORM 6.x
- **Real-time:** Socket.IO
- **AI:** OpenAI API (gpt-4o-mini)
- **Storage:** Cloudflare R2

## Cài đặt local

### Yêu cầu
- Node.js 24.15.0 (xem `.nvmrc`)
- Docker Desktop

### Các bước

```bash
# 1. Cài dependencies
npm install

# 2. Chạy Postgres local
docker compose up -d

# 3. Cấu hình biến môi trường
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# → sửa lại giá trị thật trong 2 file .env vừa tạo

# 4. Migrate + seed database
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..

# 5. Chạy dev
npm run start:dev --workspace=backend
npm run dev --workspace=frontend
```

Backend: http://localhost:3000
Frontend: http://localhost:5173

## Tài liệu

Toàn bộ tài liệu thiết kế (SRS, Use Case Specification, ERD, Product Backlog) nằm trong
thư mục `docs/`.

## Quy tắc phát triển

Xem `AGENTS.md` — quy tắc kiến trúc, bảo mật, và phạm vi bắt buộc tuân theo khi code.