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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px 60px' }}>
      {/* Back button */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text)',
          fontSize: '14px',
          textDecoration: 'none',
          marginBottom: '20px',
          transition: 'color 0.2s',
        }}
      >
        <ArrowLeft size={16} /> Quay lại trang chủ
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #aa3bff 0%, #6b21a8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', color: 'var(--text-h)', fontWeight: 700 }}>
              Chính sách Quyền riêng tư & Bảo mật Dữ liệu
            </h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text)', fontSize: '14px' }}>
              Minh bạch tuyệt đối về cách PSYTHALIA bảo vệ dữ liệu sức khỏe tâm thần của sinh viên
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Cam kết minh bạch */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(170, 59, 255, 0.08)',
            border: '1px solid rgba(170, 59, 255, 0.2)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <FileText size={22} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)', fontWeight: 600 }}>
                Nguyên tắc bảo vệ dữ liệu nhạy cảm
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text)', lineHeight: '1.6' }}>
                Dữ liệu sức khỏe tâm thần và tâm sự cá nhân là thông tin đặc biệt nhạy cảm. Hệ thống PSYTHALIA được thiết kế tuân theo các cam kết bảo mật kỹ thuật cụ thể đã được kiểm chứng trực tiếp trong mã nguồn hệ thống.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Bảo mật khi lưu trữ */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            background: 'var(--card-bg, #1e1e2d)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Lock size={20} style={{ color: '#10b981' }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', fontWeight: 600 }}>
              1. Cơ chế Bảo mật khi Lưu trữ (Data at Rest)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text)', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Mã hóa nội dung nhật ký cảm xúc (AES-256-CBC):</strong> Nội dung nhật ký người dùng được mã hóa đối xứng bằng thuật toán chuẩn AES-256-CBC trước khi ghi xuống cơ sở dữ liệu. Khóa bí mật được quản trị riêng biệt qua biến môi trường của hệ thống, ngăn chặn nguy cơ lộ lọt dữ liệu ngay cả khi cơ sở dữ liệu bị truy cập trái phép.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Băm mật khẩu một chiều (bcrypt):</strong> Mật khẩu tài khoản được băm với thuật toán bcrypt (Salt rounds = 10). Hệ thống không lưu trữ mật khẩu gốc dưới bất kỳ hình thức nào.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Mã hóa Token khôi phục tài khoản (SHA-256):</strong> Mã token reset mật khẩu và xác thực email được băm bằng SHA-256 và gắn hạn sử dụng chặt chẽ trong cơ sở dữ liệu.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Bảo mật khi truyền tải */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            background: 'var(--card-bg, #1e1e2d)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Server size={20} style={{ color: '#3b82f6' }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', fontWeight: 600 }}>
              2. Cơ chế Bảo mật khi Truyền tải (Data in Transit)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text)', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Xác thực JWT Bearer Token:</strong> Mọi yêu cầu truy vấn tài nguyên cá nhân và kết nối phòng chat Socket.IO đều được bảo vệ bởi JSON Web Token (JWT) có chữ ký số an toàn.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Giao thức mã hóa mạng (TLS/SSL):</strong> Trong môi trường triển khai thực tế, toàn bộ luồng truyền tải HTTP và WebSocket đều được mã hóa bằng TLS 1.3 (HTTPS / WSS).
              </div>
            </div>
          </div>
        </div>

        {/* 3. Phân quyền và kiểm soát truy cập */}
        <div
          style={{
            padding: '24px',
            borderRadius: '14px',
            background: 'var(--card-bg, #1e1e2d)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <KeyRound size={20} style={{ color: '#f59e0b' }} />
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)', fontWeight: 600 }}>
              3. Phân quyền Truy cập (Role-Based Access Control)
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text)', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Eye size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Quyền sở hữu nhật ký cá nhân:</strong> Chỉ duy nhất tài khoản tạo ra nhật ký mới có quyền truy cập, đọc, chỉnh sửa hoặc xóa bài viết. Quản trị viên hay Tình nguyện viên không có quyền truy cập hay đọc nhật ký của bạn.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Eye size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Quyền hạn trong phiên tư vấn 1-1:</strong> Chỉ Tình nguyện viên đã được Quản trị viên xác thực và chính thức tiếp nhận phiên chat mới có thể xem và trao đổi tin nhắn trong phiên đó.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Eye size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong style={{ color: 'var(--text-h)' }}>Nhật ký kiểm toán (Audit Logs):</strong> Mọi hành động nhạy cảm của Quản trị viên (duyệt TNV, khóa tài khoản, chỉnh sửa tài nguyên) đều được lưu vết chi tiết trong bảng kiểm toán hệ thống.
              </div>
            </div>
          </div>
        </div>

        {/* 4. Thông tin ghi nhận rõ ràng (Minh bạch phạm vi) */}
        <div
          style={{
            padding: '20px 24px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
            <h2 style={{ margin: 0, fontSize: '16px', color: '#ef4444', fontWeight: 600 }}>
              4. Ghi nhận rõ ràng về Giới hạn kỹ thuật hiện tại
            </h2>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              Nhằm đảm bảo tính trung thực kỹ thuật và không đưa ra các tuyên bố bảo mật thiếu căn cứ:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <strong>Tin nhắn chat trực tiếp:</strong> Dữ liệu tin nhắn trong phiên chat thời gian thực hiện được lưu trữ dạng văn bản có cấu trúc trong cơ sở dữ liệu để phục vụ việc duy trì lịch sử phiên trao đổi cho Sinh viên và TNV, <em>chưa áp dụng mã hóa đầu cuối (End-to-End Encryption - E2EE)</em>.
              </li>
              <li>
                <strong>Trí tuệ nhân tạo (AI):</strong> Phân tích cảm xúc bằng AI (Google Gemini) chỉ đóng vai trò nhận diện gợi ý và hỗ trợ phát hiện nguy cơ khủng hoảng, không thay thế cho chẩn đoán y khoa chuyên nghiệp và không tự động thay đổi trạng thái tài khoản người dùng.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

