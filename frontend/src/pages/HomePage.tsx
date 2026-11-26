import React from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  ShieldCheck,
  MessageCircleHeart,
  Sparkles,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getEmergencyHotline } from '../utils/hotline';
import './home.css';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const emergencyHotline = getEmergencyHotline();

  return (
    <div className="home-container">
      {/* ─── Hero Section ─── */}
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero__badge">
          <Sparkles size={14} />
          <span>Không gian an toàn cho sức khỏe tâm thần sinh viên</span>
        </div>

        <h1 id="hero-title" className="home-hero__title">
          Đồng hành & Lắng nghe <br /> Mọi cảm xúc của bạn
        </h1>

        <p className="home-hero__subtitle">
          Hệ thống hỗ trợ tâm lý sinh viên ứng dụng công cụ sàng lọc tiêu chuẩn y khoa (PHQ-9, GAD-7),
          nhật ký cá nhân mã hóa an toàn với gợi ý từ AI, cùng phòng tư vấn trực tiếp 1-1 với tình nguyện viên.
        </p>

        <div className="home-cta-group">
          {isAuthenticated ? (
            <Link to="/dashboard" className="home-btn home-btn--primary">
              Đi đến Bảng điều khiển <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="home-btn home-btn--primary">
                Bắt đầu ngay <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="home-btn home-btn--secondary">
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ─── Core Pillar Features ─── */}
      <section className="home-features" aria-label="Tính năng chính">
        <div className="home-features__grid">
          {/* Card 1: Sàng lọc tâm lý */}
          <article className="home-card">
            <div className="home-card__icon-wrapper home-card__icon-wrapper--lavender">
              <ClipboardCheck size={26} />
            </div>
            <h2 className="home-card__title">Đánh giá Tâm lý Tiêu chuẩn</h2>
            <p className="home-card__desc">
              Thực hiện các bộ câu hỏi sàng lọc trầm cảm (PHQ-9) và lo âu (GAD-7) theo chuẩn mực y khoa
              nhằm nhận diện rõ ràng trạng thái cảm xúc cá nhân.
            </p>
            <span className="home-card__tag home-card__tag--lavender">Tiêu chuẩn y khoa</span>
          </article>

          {/* Card 2: Nhật ký mã hóa */}
          <article className="home-card">
            <div className="home-card__icon-wrapper home-card__icon-wrapper--sage">
              <ShieldCheck size={26} />
            </div>
            <h2 className="home-card__title">Nhật ký An toàn & AI Gợi ý</h2>
            <p className="home-card__desc">
              Không gian cá nhân riêng tư tuyệt đối với cơ chế mã hóa dữ liệu. Trợ lý AI đồng hành nhẹ nhàng
              phân tích cảm xúc và gợi ý các bài tập điều hòa tâm trạng.
            </p>
            <span className="home-card__tag home-card__tag--sage">Bảo mật cao</span>
          </article>

          {/* Card 3: Tư vấn 1-1 */}
          <article className="home-card">
            <div className="home-card__icon-wrapper home-card__icon-wrapper--blue">
              <MessageCircleHeart size={26} />
            </div>
            <h2 className="home-card__title">Phòng Hỗ trợ Trực tiếp 1-1</h2>
            <p className="home-card__desc">
              Kết nối thời gian thực với đội ngũ Tình nguyện viên tâm lý được đào tạo bài bản, luôn sẵn sàng
              lắng nghe, thấu cảm và sẻ chia trong không gian bảo mật.
            </p>
            <span className="home-card__tag home-card__tag--blue">Đồng hành 1-1</span>
          </article>
        </div>
      </section>

      {/* ─── 3-Step Journey ─── */}
      <section className="home-journey" aria-labelledby="journey-title">
        <div className="home-journey__header">
          <h2 id="journey-title" className="home-journey__title">
            Quy trình hỗ trợ nhẹ nhàng, từng bước một
          </h2>
          <p className="home-journey__subtitle">
            Bạn có toàn quyền chủ động lựa chọn cách tiếp cận phù hợp nhất với nhu cầu hiện tại.
          </p>
        </div>

        <div className="home-journey__grid">
          <div className="home-step">
            <span className="home-step__num">01</span>
            <h3 className="home-step__title">Tự đánh giá cảm xúc</h3>
            <p className="home-step__desc">
              Dành 3-5 phút hoàn thành bài sàng lọc nhanh để lắng nghe và định danh trạng thái tâm lý của mình.
            </p>
          </div>

          <div className="home-step">
            <span className="home-step__num">02</span>
            <h3 className="home-step__title">Viết nhật ký & Điều hòa</h3>
            <p className="home-step__desc">
              Ghi lại những suy nghĩ thường nhật trong nhật ký bảo mật, nhận phản hồi ấm áp và thực hành các bài tập thư giãn.
            </p>
          </div>

          <div className="home-step">
            <span className="home-step__num">03</span>
            <h3 className="home-step__title">Chia sẻ cùng Tình nguyện viên</h3>
            <p className="home-step__desc">
              Khi bạn cảm thấy cần một người cùng trò chuyện, hãy yêu cầu phiên hỗ trợ trực tuyến để được sẻ chia kịp thời.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Emergency & Crisis Support Notice ─── */}
      <aside className="home-crisis" role="complementary" aria-label="Đường dây nóng khẩn cấp">
        <div className="home-crisis__icon" aria-hidden="true">
          <PhoneCall size={22} />
        </div>
        <div className="home-crisis__content">
          <h3 className="home-crisis__title">Bạn đang trải qua thời khắc khó khăn và cần trợ giúp ngay?</h3>
          <p className="home-crisis__desc">
            Nếu bạn hoặc ai đó đang trong tình trạng khủng hoảng tâm lý nghiêm trọng hoặc có ý định tự gây hại,
            xin hãy liên hệ ngay với các dịch vụ cấp cứu hoặc đường dây nóng hỗ trợ tâm lý 24/7 để nhận hỗ trợ y tế chuyên nghiệp:
          </p>
          <div className="home-crisis__hotlines">
            <span className="home-crisis__hotline-item">📞 Tổng đài Quốc gia Bảo vệ Trẻ em & Sinh viên: <strong>111</strong></span>
            <span className="home-crisis__hotline-item">📞 Đường dây nóng Ngày Mai (Hỗ trợ Tâm lý): <strong>{emergencyHotline}</strong></span>
            <span className="home-crisis__hotline-item">📞 Cấp cứu Y tế: <strong>115</strong></span>
          </div>
        </div>
      </aside>
    </div>
  );
};
