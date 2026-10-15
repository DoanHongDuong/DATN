import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Sparkles, MessageCircleHeart } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 16px',
        borderRadius: '20px',
        background: 'var(--accent-bg)',
        color: 'var(--accent)',
        fontWeight: 600,
        fontSize: '14px',
        marginBottom: '20px'
      }}>
        <Sparkles size={16} />
        <span>Không gian an toàn cho sức khỏe tâm thần của bạn</span>
      </div>

      <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-h)', lineHeight: 1.35 }}>
        Đồng hành & Lắng nghe <br /> Mọi cảm xúc của bạn
      </h1>

      <p style={{ fontSize: '18px', maxWidth: '640px', margin: '0 auto 36px', color: 'var(--text)', lineHeight: 1.6 }}>
        Hệ thống hỗ trợ sức khỏe tâm thần sinh viên với công cụ đánh giá tâm lý chuẩn mực (PHQ-9, GAD-7),
        nhật ký mã hóa bảo mật hỗ trợ bởi AI, và kết nối trò chuyện trực tiếp cùng Tình nguyện viên.
      </p>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '60px' }}>
        <Link to="/register" style={{
          padding: '14px 32px',
          borderRadius: '10px',
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '16px'
        }}>
          Bắt đầu ngay
        </Link>
        <Link to="/login" style={{
          padding: '14px 32px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          color: 'var(--text-h)',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '16px'
        }}>
          Đăng nhập
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        textAlign: 'left'
      }}>
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)'
        }}>
          <HeartPulse size={32} color="var(--accent)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Đánh giá Tâm lý (PHQ-9 / GAD-7)</h3>
          <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.5 }}>
            Thực hiện bài trắc nghiệm sàng lọc trầm cảm và lo âu tiêu chuẩn y khoa để hiểu rõ tình trạng cảm xúc cá nhân.
          </p>
        </div>

        <div style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)'
        }}>
          <ShieldCheck size={32} color="var(--accent)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Nhật ký Mã hóa AI</h3>
          <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.5 }}>
            Viết nhật ký cá nhân an toàn tuyệt đối với công nghệ mã hóa đầu cuối và trợ lý AI phân tích cảm xúc nhẹ nhàng.
          </p>
        </div>

        <div style={{
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)'
        }}>
          <MessageCircleHeart size={32} color="var(--accent)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>Tư vấn Trực tiếp 1-1</h3>
          <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.5 }}>
            Kết nối trực tiếp cùng đội ngũ tình nguyện viên tâm lý qua kênh trò chuyện riêng tư theo thời gian thực.
          </p>
        </div>
      </div>
    </div>
  );
};
