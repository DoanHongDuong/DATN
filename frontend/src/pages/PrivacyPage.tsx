import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  Server,
  FileText,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '16px 20px 60px' }}>
      {/* Back button */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
          marginBottom: '24px',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={16} /> Quay lại trang chủ
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--tint-lavender)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={26} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontWeight: 700, lineHeight: 1.3 }}>
              Chính sách Quyền riêng tư & Bảo mật Dữ liệu
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: 1.5 }}>
              Minh bạch tuyệt đối về cách PSYTHALIA bảo vệ dữ liệu sức khỏe tinh thần của sinh viên
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Cam kết minh bạch */}
        <div
          style={{
            padding: '22px 24px',
            borderRadius: '16px',
            background: 'var(--tint-lavender)',
            border: '1px solid rgba(103, 80, 164, 0.2)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.7)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontWeight: 600 }}>
                Nguyên tắc bảo vệ dữ liệu nhạy cảm
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
                Dữ liệu sức khỏe tâm thần và tâm sự cá nhân là thông tin đặc biệt nhạy cảm. Hệ thống PSYTHALIA được thiết kế tuân theo các cam kết bảo mật kỹ thuật cụ thể đã được kiểm chứng trực tiếp trong mã nguồn hệ thống.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Bảo mật khi lưu trữ */}
        <div
          style={{
            padding: '28px 24px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--tint-sage)',
                color: 'var(--color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={19} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontWeight: 600 }}>
              1. Cơ chế Bảo mật khi Lưu trữ (Data at Rest)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={17} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Mã hóa nội dung nhật ký cảm xúc (AES-256-CBC):</strong> Nội dung nhật ký người dùng được mã hóa đối xứng bằng thuật toán chuẩn AES-256-CBC trước khi ghi xuống cơ sở dữ liệu. Khóa bí mật được quản trị riêng biệt qua biến môi trường của hệ thống, ngăn chặn nguy cơ lộ lọt dữ liệu ngay cả khi cơ sở dữ liệu bị truy cập trái phép.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={17} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Băm mật khẩu một chiều (bcrypt):</strong> Mật khẩu tài khoản được băm với thuật toán bcrypt (Salt rounds = 10). Hệ thống không lưu trữ mật khẩu gốc dưới bất kỳ hình thức nào.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={17} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Mã hóa Token khôi phục tài khoản (SHA-256):</strong> Mã token reset mật khẩu và xác thực email được băm bằng SHA-256 và gắn hạn sử dụng chặt chẽ trong cơ sở dữ liệu.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bảo mật khi truyền tải */}
        <div
          style={{
            padding: '28px 24px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--tint-blue)',
                color: 'var(--color-info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Server size={19} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontWeight: 600 }}>
              2. Cơ chế Bảo mật khi Truyền tải (Data in Transit)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={17} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Xác thực JWT Bearer Token:</strong> Mọi yêu cầu truy vấn tài nguyên cá nhân và kết nối phòng chat Socket.IO đều được bảo vệ bởi JSON Web Token (JWT) có chữ ký số an toàn.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={17} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Giao thức mã hóa mạng (TLS/SSL):</strong> Trong môi trường triển khai thực tế, toàn bộ luồng truyền tải HTTP và WebSocket đều được mã hóa bằng TLS 1.3 (HTTPS / WSS).
              </div>
            </div>
          </div>
        </div>

        {/* 3. Phân quyền và kiểm soát truy cập */}
        <div
          style={{
            padding: '28px 24px',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--tint-terracotta)',
                color: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <KeyRound size={19} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontWeight: 600 }}>
              3. Phân quyền Truy cập (Role-Based Access Control)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Eye size={17} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Quyền sở hữu nhật ký cá nhân:</strong> Chỉ duy nhất tài khoản tạo ra nhật ký mới có quyền truy cập, đọc, chỉnh sửa hoặc xóa bài viết. Quản trị viên hay Tình nguyện viên không có quyền truy cập hay đọc nhật ký của bạn.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Eye size={17} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Quyền hạn trong phiên tư vấn 1-1:</strong> Chỉ Tình nguyện viên đã được Quản trị viên xác thực và chính thức tiếp nhận phiên chat mới có thể xem và trao đổi tin nhắn trong phiên đó.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Eye size={17} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Nhật ký kiểm toán (Audit Logs):</strong> Mọi hành động nhạy cảm của Quản trị viên (duyệt TNV, khóa tài khoản, chỉnh sửa tài nguyên) đều được lưu vết chi tiết trong bảng kiểm toán hệ thống.
              </div>
            </div>
          </div>
        </div>

        {/* 4. Thông tin ghi nhận rõ ràng (Minh bạch phạm vi) */}
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: 'var(--tint-crimson)',
            border: '1px solid rgba(226, 118, 104, 0.25)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.7)',
                color: 'var(--color-crisis)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '17px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontWeight: 600 }}>
              4. Ghi nhận rõ ràng về Giới hạn kỹ thuật hiện tại
            </h2>
          </div>
          <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              Nhằm đảm bảo tính trung thực kỹ thuật và không đưa ra các tuyên bố bảo mật thiếu căn cứ:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Tin nhắn chat trực tiếp:</strong> Dữ liệu tin nhắn trong phiên chat thời gian thực hiện được lưu trữ dạng văn bản có cấu trúc trong cơ sở dữ liệu để phục vụ việc duy trì lịch sử phiên trao đổi cho Sinh viên và TNV, <em>chưa áp dụng mã hóa đầu cuối (End-to-End Encryption - E2EE)</em>.
              </li>
              <li>
                <strong style={{ color: 'var(--text-primary)' }}>Trí tuệ nhân tạo (AI):</strong> Phân tích cảm xúc bằng AI (Google Gemini) chỉ đóng vai trò nhận diện gợi ý và hỗ trợ phát hiện nguy cơ khủng hoảng, không thay thế cho chẩn đoán y khoa chuyên nghiệp và không tự động thay đổi trạng thái tài khoản người dùng.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};