# AGENTS.md — Quy tắc bắt buộc cho dự án DATN

## Kiến trúc (Clean Architecture — KHÔNG được vi phạm)
- Thư mục `domain/` và `application/` của mỗi module TUYỆT ĐỐI KHÔNG được import Prisma,
  Passport, hay bất kỳ thư viện infrastructure nào. Chỉ được làm việc qua interface.
- Prisma Client CHỈ được dùng trong `infrastructure/persistence/*.repository.ts`.
- Controller (`presentation/`) KHÔNG chứa business logic — chỉ gọi Use Case rồi trả response.
- Mỗi module theo đúng cấu trúc: domain/ → application/ → infrastructure/ → presentation/

## Không hardcode (bắt buộc — dữ liệu sức khỏe tâm thần rất nhạy cảm)
- KHÔNG BAO GIỜ hardcode API key, connection string, JWT secret trực tiếp trong code.
  Luôn đọc qua `ConfigService` (NestJS `@nestjs/config`), giá trị lấy từ `.env`.
- KHÔNG hardcode URL môi trường (localhost, domain production) — dùng biến môi trường.
- KHÔNG hardcode ngưỡng phân loại PHQ-9/GAD-7, priority mapping — định nghĩa thành
  constant tập trung 1 chỗ (ví dụ `assessment.constants.ts`), không rải rác trong code.
- Mọi giá trị enum (Role, SessionStatus, PriorityLevel, SeverityLevel, AccountStatus)
  PHẢI dùng enum đã định nghĩa trong Prisma schema, không dùng chuỗi string tự do.

## Bảo mật (theo đúng NFR đã cam kết trong SRS)
- Nội dung `journal_entries.content` và trường liên quan tới bài đánh giá tâm lý PHẢI
  được mã hoá trước khi lưu DB — không lưu plain text.
- KHÔNG log ra console/log file bất kỳ nội dung nhạy cảm nào (nhật ký, mật khẩu, token).
- Mọi endpoint có dữ liệu người dùng khác PHẢI có Guard kiểm tra role (RBAC), không dựa
  vào việc ẩn UI ở Frontend để "bảo mật".
- AI (OpenAI/Google NLP) chỉ được dùng để GỢI Ý — không tự động thực hiện hành động
  thay người dùng (không tự tạo phiên chat khẩn cấp, không tự khoá tài khoản...).

## Coding convention
- TypeScript strict mode, không dùng `any` trừ khi thực sự bắt buộc.
- Mọi input từ client PHẢI validate bằng DTO + class-validator, không tin dữ liệu thô.
- Đặt tên theo chuẩn: camelCase cho biến/hàm, PascalCase cho class, snake_case chỉ dùng
  trong tên cột DB (đã map qua `@map` trong Prisma).
- Mỗi Use Case chỉ làm đúng 1 việc, đặt tên rõ nghĩa (VD: `RegisterUserUseCase`, không
  đặt chung chung kiểu `UserService.doStuff()`).

## Trước khi coi 1 task là "xong"
- Code phải chạy được `npm run lint` không lỗi.
- Nếu thêm/sửa bảng, PHẢI tạo migration bằng `prisma migrate dev`, không sửa tay SQL.
- Không tự ý cài thêm package ngoài kế hoạch (Redis, BullMQ, thư viện AI khác...) —
  hỏi lại trước nếu thấy cần, vì dự án đã chốt phạm vi tối giản cho 15 tuần.
## Ánh xạ business rule cụ thể (không được tự suy diễn khác đi)

- `chat_sessions.volunteer_id` LUÔN là FK tới `users.id` (KHÔNG phải `volunteer_profiles.id`).
  Khi cần thông tin chuyên môn của TNV, join thêm qua `volunteer_profiles.user_id`.
- `chat_sessions.priority_level` phải được set tự động dựa trên `test_results.severity_level`
  gần nhất của user (MINIMAL/MILD → LOW, MODERATE → MEDIUM, MODERATELY_SEVERE → HIGH,
  SEVERE → CRITICAL). User gửi yêu cầu mà chưa từng làm test → mặc định MEDIUM.
- Reset password dùng 2 cột `users.reset_token_hash` + `users.reset_token_expires_at`.
  KHÔNG tạo bảng `password_reset_tokens` riêng.
- Hotline khẩn cấp (PB-21) lấy từ biến môi trường (`.env`), KHÔNG tạo bảng
  `emergency_contacts` hay bất kỳ bảng cấu hình nào cho việc này.
- TNV chỉ được `is_online = true` hoặc nhận phiên khi `volunteer_profiles.is_verified = true`
  — kiểm tra bắt buộc ở Guard/Use Case, DB không tự chặn được việc này.

## Kỷ luật phạm vi (Scope discipline — đã thống nhất, không tự ý mở rộng)

- KHÔNG tự thêm Redis, BullMQ, hay tách AI thành microservice riêng — đã cân nhắc và
  loại bỏ vì over-engineering so với timeline 15 tuần.
- KHÔNG tự thêm bảng/tính năng ngoài 38 PB item đã chốt trong backlog, trừ khi được yêu cầu.
- Ưu tiên PB đánh dấu "Could" (VD: PB-11 biểu đồ xu hướng, PB-25 typing indicator, PB-35
  thống kê) là hạng mục ĐẦU TIÊN bị cắt nếu tiến độ trễ — không cắt các PB "Must".
  - PrismaClient KHÔNG được `new` trực tiếp trong Repository. Luôn dùng `PrismaService`
  (kế thừa PrismaClient, quản lý lifecycle qua OnModuleInit/OnModuleDestroy) inject qua
  constructor.- Import Prisma Client LUÔN dùng `from '@prisma/client'` — generator xuất ra vị trí mặc
  định node_modules, KHÔNG dùng alias hay đường dẫn tương đối tới generated/prisma.