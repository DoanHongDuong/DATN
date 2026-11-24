import React, { useState } from 'react';
import { Card, Tag, Button, Tabs, Space, Row, Col } from 'antd';
import {
  PhoneCall,
  Hospital,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldAlert,
  HeartHandshake,
  ExternalLink,
} from 'lucide-react';
import { getEmergencyHotline } from '../../utils/hotline';

export const HelpDirectory: React.FC = () => {
  const [region, setRegion] = useState<string>('north');
  const emergencyHotline = getEmergencyHotline();

  const helplines = [
    {
      id: 'psythalia',
      name: 'Đường dây nóng Khẩn cấp PSYTHALIA',
      phone: emergencyHotline,
      type: 'Khẩn cấp 24/7',
      color: 'red',
      hours: 'Phục vụ 24/7 — Miễn phí tư vấn',
      desc: 'Tiếp nhận cuộc gọi sơ cứu tâm lý khẩn cấp, can thiệp khi gặp khủng hoảng cảm xúc và hướng dẫn nguồn lực hỗ trợ tức thì.',
    },
    {
      id: '111',
      name: 'Tổng đài Quốc gia Bảo vệ Trẻ em & Thanh thiếu niên',
      phone: '111',
      type: 'Miễn cước 24/7',
      color: 'green',
      hours: 'Phục vụ 24/7 — Hoàn toàn miễn cước viễn thông',
      desc: 'Tư vấn tâm lý, hỗ trợ phòng chống bạo lực, can thiệp các vấn đề bế tắc học đường, gia đình cho trẻ em và người trẻ tuổi.',
    },
    {
      id: 'ngaymai',
      name: 'Đường dây nóng Ngày Mai (Hỗ trợ người trầm cảm)',
      phone: '096 306 1414',
      type: 'Trầm cảm & Khủng hoảng',
      color: 'orange',
      hours: '13:00 – 20:30 từ Thứ Hai đến Chủ Nhật',
      desc: 'Dự án cộng đồng phi lợi nhuận lắng nghe, đồng hành và thấu hiểu những người đang đối mặt với trầm cảm, khủng hoảng cảm xúc.',
    },
    {
      id: '115',
      name: 'Tổng đài Cấp cứu Y tế Toàn quốc',
      phone: '115',
      type: 'Cấp cứu khẩn cấp',
      color: 'volcano',
      hours: 'Trực cấp cứu 24/7 trên toàn quốc',
      desc: 'Cần liên hệ ngay khi xảy ra tình huống tự làm hại bản thân, ngộ độc hoặc bất kỳ nguy cơ đe dọa tính mạng thể chất nào.',
    },
    {
      id: 'csaga',
      name: 'Đường dây nóng Phòng chống Bạo lực (CSAGA)',
      phone: '1900 969 680',
      type: 'Hỗ trợ xã hội',
      color: 'purple',
      hours: 'Tư vấn hỗ trợ tâm lý & pháp lý ban đầu',
      desc: 'Hỗ trợ khẩn cấp cho phụ nữ, thanh thiếu niên bị bạo lực gia đình, bạo lực giới hoặc sang chấn tinh thần nghiêm trọng.',
    },
  ];

  const hospitals: Record<string, Array<{
    name: string;
    subName?: string;
    address: string;
    phone: string;
    highlight: string;
    mapsUrl: string;
  }>> = {
    north: [
      {
        name: 'Viện Sức khỏe Tâm thần — Bệnh viện Bạch Mai',
        subName: 'Tuyến Trung ương đầu ngành',
        address: 'Tòa nhà T4, T5, T6, Bệnh viện Bạch Mai, 78 Giải Phóng, Đống Đa, Hà Nội',
        phone: '(024) 3869 3731',
        highlight: 'Cơ sở chuyên khoa hàng đầu cả nước về khám, điều trị nội trú/ngoại trú các rối loạn lo âu, trầm cảm, rối loạn giấc ngủ và can thiệp khủng hoảng tâm lý.',
        mapsUrl: 'https://maps.google.com/?q=Viện+Sức+Khỏe+Tâm+Thần+Bạch+Mai+78+Giải+Phóng+Hà+Nội',
      },
      {
        name: 'Bệnh viện Tâm thần Ban ngày Mai Hương',
        subName: 'Chuyên sâu phục hồi tâm lý xã hội',
        address: 'Số 4 phố Hồng Mai, Phường Bạch Mai, Hai Bà Trưng, Hà Nội',
        phone: '(024) 3627 5762',
        highlight: 'Mô hình khám chữa bệnh ban ngày, chuyên sâu tâm lý lâm sàng, trị liệu tâm lý cá nhân và hỗ trợ người gặp căng thẳng, stress, trầm cảm nhẹ đến vừa.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Tâm+thần+Ban+ngày+Mai+Hương+Hà+Nội',
      },
      {
        name: 'Bệnh viện Tâm thần Trung ương 1',
        subName: 'Bệnh viện chuyên khoa hạng đặc biệt',
        address: 'Xã Hòa Bình, Huyện Thường Tín, TP. Hà Nội',
        phone: '(024) 3385 3227',
        highlight: 'Trung tâm chuyên khoa cấp cao nhất về chẩn đoán, điều trị và phục hồi chức năng các bệnh lý tâm thần và rối loạn hành vi phức tạp.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Tâm+thần+Trung+ương+1+Thường+Tín+Hà+Nội',
      },
    ],
    south: [
      {
        name: 'Bệnh viện Tâm thần TP. Hồ Chí Minh',
        subName: 'Bệnh viện chuyên khoa Hạng 1 phía Nam',
        address: '766 Võ Văn Kiệt, Phường 1, Quận 5, TP. Hồ Chí Minh',
        phone: '(028) 3923 4675',
        highlight: 'Đơn vị chuyên khoa tâm thần lớn nhất miền Nam, tiếp nhận cấp cứu tâm thần 24/24, khám điều trị trầm cảm, lo âu, rối loạn cảm xúc cho trẻ em và người lớn.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Tâm+thần+TP.HCM+766+Võ+Văn+Kiệt',
      },
      {
        name: 'Khoa Tâm thể — Bệnh viện Đại học Y Dược TP.HCM',
        subName: 'Đơn vị trị liệu tâm lý lâm sàng chuyên sâu',
        address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
        phone: '(028) 3855 4269',
        highlight: 'Tập hợp các giảng viên, bác sĩ đầu ngành chuyên khám và trị liệu các rối loạn cơ thể do nguyên nhân tâm lý, mất ngủ mạn tính, rối loạn hoảng sợ và trầm cảm.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Đại+học+Y+Dược+TP.HCM+215+Hồng+Bàng',
      },
      {
        name: 'Bệnh viện Tâm thần Trung ương 2',
        subName: 'Trung tâm chuyên khoa vùng Đông Nam Bộ',
        address: 'Đường Nguyễn Ái Quốc, Khu phố 7, Phường Tân Phong, TP. Biên Hòa, Đồng Nai',
        phone: '(0251) 3822 932',
        highlight: 'Bệnh viện tuyến Trung ương phụ trách chỉ đạo chuyên môn sức khỏe tâm thần cho các tỉnh thành phía Nam, tiếp nhận điều trị chuyên sâu đa dạng lứa tuổi.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Tâm+thần+Trung+ương+2+Biên+Hòa',
      },
    ],
    central: [
      {
        name: 'Bệnh viện Tâm thần Đà Nẵng',
        subName: 'Trung tâm chuyên khoa Miền Trung',
        address: '193 Nguyễn Lương Bằng, Phường Hòa Khánh Bắc, Liên Chiểu, TP. Đà Nẵng',
        phone: '(0236) 3842 326',
        highlight: 'Cơ sở khám chữa bệnh sức khỏe tinh thần hàng đầu khu vực miền Trung, tiếp nhận khám tư vấn tâm lý, rối loạn lo âu, stress học đường và công việc.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Tâm+thần+Đà+Nẵng+193+Nguyễn+Lương+Bằng',
      },
      {
        name: 'Bệnh viện Tâm thần Huế',
        subName: 'Cơ sở chuyên khoa Thừa Thiên Huế',
        address: '39 Phạm Thị Liên, Phường Kim Long, TP. Huế, Thừa Thiên Huế',
        phone: '(0234) 3523 718',
        highlight: 'Đơn vị điều trị tâm thần và can thiệp tâm lý lâm sàng kết hợp đa liệu pháp, tư vấn tâm lý cá nhân và phục hồi chức năng tinh thần cộng đồng.',
        mapsUrl: 'https://maps.google.com/?q=Bệnh+viện+Tâm+thần+Huế+39+Phạm+Thị+Liên',
      },
    ],
  };

  const redFlags = [
    {
      title: 'Ý nghĩ tự hại hoặc bế tắc muốn giải thoát',
      desc: 'Xuất hiện suy nghĩ thường xuyên về cái chết, lập kế hoạch hoặc có hành vi chuẩn bị tự làm hại bản thân.',
    },
    {
      title: 'Rối loạn giấc ngủ & kiệt quệ thể chất trên 2 tuần',
      desc: 'Mất ngủ kéo dài, thức dậy quá sớm trong trạng thái hoảng sợ hoặc ngủ li bì, sụt cân trầm trọng không rõ nguyên nhân y khoa.',
    },
    {
      title: 'Mất hứng thú hoàn toàn & tuyệt vọng sâu sắc',
      desc: 'Cảm giác trống rỗng, khóc lóc không kiểm soát, mất hoàn toàn niềm vui trong mọi hoạt động từng yêu thích và cảm thấy vô giá trị.',
    },
    {
      title: 'Ảo giác, hoang tưởng hoặc cơn hoảng loạn (Panic Attack)',
      desc: 'Nghe thấy âm thanh lạ trong đầu, cảm giác có người theo dõi hại mình, hoặc các cơn tim đập dồn dập, khó thở, sợ hãi tột cùng không rõ lý do.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Crisis Warning Banner ─── */}
      <div
        style={{
          borderRadius: '16px',
          border: '1px solid rgba(166, 50, 40, 0.3)',
          background: 'var(--tint-crimson)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(166, 50, 40, 0.15)',
            color: 'var(--color-crisis)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          <ShieldAlert size={24} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-crisis)', marginBottom: '6px' }}>
            Thông báo Khẩn cấp & Chỉ dẫn Sơ cứu Tâm lý 24/7
          </div>
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            Nếu bạn hoặc người thân đang trong trạng thái khủng hoảng tâm lý nghiêm trọng, có ý nghĩ tự hại hoặc gặp nguy hiểm tính mạng, xin vui lòng gọi ngay đến đường dây nóng khẩn cấp:{' '}
            <a
              href={`tel:${emergencyHotline.replace(/\s+/g, '')}`}
              style={{ fontWeight: 800, color: 'var(--color-crisis)', textDecoration: 'underline' }}
            >
              {emergencyHotline}
            </a>{' '}
            hoặc đến phòng cấp cứu y tế gần nhất. Bạn không đơn độc, luôn có người sẵn sàng đồng hành cùng bạn!
          </div>
        </div>
      </div>

      {/* ─── Section 1: Helplines ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--tint-crimson)',
              color: 'var(--color-crisis)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PhoneCall size={18} />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
            Đường dây nóng Cứu trợ & Tư vấn Tâm lý Toàn quốc
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.5 }}>
          Các tổng đài chuyên trách lắng nghe, sơ cứu tâm lý và can thiệp khủng hoảng miễn phí hoạt động trên toàn quốc.
        </p>

        <Row gutter={[18, 18]}>
          {helplines.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.id}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <Tag color={item.color} style={{ fontWeight: 600, padding: '3px 10px', borderRadius: '8px' }}>
                      {item.type}
                    </Tag>
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--heading)', lineHeight: 1.35 }}>
                    {item.name}
                  </h3>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: item.id === 'psythalia' ? 'var(--color-crisis)' : 'var(--color-primary)',
                      marginBottom: '10px',
                      letterSpacing: '0.5px',
                      fontFamily: 'var(--heading)',
                    }}
                  >
                    {item.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    <Clock size={14} />
                    <span>{item.hours}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.55 }}>
                    {item.desc}
                  </p>
                </div>

                <Button
                  type="primary"
                  block
                  icon={<PhoneCall size={15} />}
                  href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                  style={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    height: '42px',
                    background: item.id === 'psythalia' ? 'var(--color-crisis)' : 'var(--color-primary)',
                    borderColor: item.id === 'psythalia' ? 'var(--color-crisis)' : 'var(--color-primary)',
                  }}
                >
                  Gọi điện thoại ngay
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ─── Section 2: Specialized Hospitals ─── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
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
            }}
          >
            <Hospital size={18} />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
            Cơ sở Y tế & Bệnh viện Chuyên khoa Sức khỏe Tâm thần
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
          Danh sách các bệnh viện và viện chuyên khoa uy tín tuyến Trung ương và khu vực, có đầy đủ khoa khám tâm thần, tâm lý lâm sàng và tiếp nhận cấp cứu 24/7.
        </p>

        {/* Region Tabs */}
        <Tabs
          activeKey={region}
          onChange={setRegion}
          style={{ marginBottom: '16px' }}
          items={[
            { key: 'north', label: 'Khu vực Miền Bắc (Hà Nội)' },
            { key: 'south', label: 'Khu vực Miền Nam (TP. Hồ Chí Minh)' },
            { key: 'central', label: 'Khu vực Miền Trung (Đà Nẵng & Huế)' },
          ]}
        />

        <Row gutter={[18, 18]}>
          {(hospitals[region] || []).map((hosp, idx) => (
            <Col xs={24} md={12} lg={8} key={idx}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color="blue" style={{ fontSize: '11px', borderRadius: '6px', fontWeight: 600 }}>
                      {hosp.subName}
                    </Tag>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--heading)', lineHeight: 1.35 }}>
                    {hosp.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-crisis)' }} />
                    <span>{hosp.address}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    <PhoneCall size={15} style={{ flexShrink: 0, color: 'var(--color-success)' }} />
                    <span style={{ fontWeight: 700 }}>{hosp.phone}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '16px' }}>
                    {hosp.highlight}
                  </p>
                </div>

                <Space style={{ width: '100%' }}>
                  <Button
                    type="default"
                    icon={<ExternalLink size={14} />}
                    href={hosp.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ borderRadius: '8px', fontSize: '13px' }}
                  >
                    Bản đồ chỉ đường
                  </Button>
                  <Button
                    type="primary"
                    icon={<PhoneCall size={14} />}
                    href={`tel:${hosp.phone.replace(/[^0-9]/g, '')}`}
                    style={{ borderRadius: '8px', fontSize: '13px' }}
                  >
                    Gọi tiếp nhận
                  </Button>
                </Space>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* ─── Section 3: Red Flags / When to seek professional care ─── */}
      <Card
        style={{
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
        }}
        bodyStyle={{ padding: '26px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <AlertTriangle size={22} style={{ color: 'var(--color-warning)' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>
            Cẩm nang Nhận diện: Khi nào bạn cần tìm kiếm sự hỗ trợ chuyên môn y khoa?
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
          Sơ cứu tâm lý (PFA) và các bài tập tự điều hòa cảm xúc có ý nghĩa hỗ trợ xoa dịu ban đầu. Tuy nhiên, nếu bạn nhận thấy một trong các dấu hiệu báo động đỏ dưới đây, việc thăm khám bác sĩ chuyên khoa hoặc chuyên gia tâm lý lâm sàng là bước đi cần thiết và dũng cảm:
        </p>

        <Row gutter={[16, 16]}>
          {redFlags.map((flag, idx) => (
            <Col xs={24} md={12} key={idx}>
              <div
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--tint-terracotta)',
                      color: 'var(--color-warning)',
                      fontWeight: 700,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {flag.title}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '32px', lineHeight: 1.55 }}>
                  {flag.desc}
                </p>
              </div>
            </Col>
          ))}
        </Row>

        <div
          style={{
            marginTop: '22px',
            padding: '16px 20px',
            background: 'var(--tint-sage)',
            border: '1px solid rgba(58, 117, 88, 0.25)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <HeartHandshake size={24} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
            <strong>Thông điệp từ PSYTHALIA:</strong> Sức khỏe tinh thần cũng giống như sức khỏe thể chất — khi bị ốm, tìm kiếm bác sĩ là việc hoàn toàn tự nhiên và đúng đắn. Hãy cho bản thân cơ hội được giúp đỡ chuyên nghiệp để phục hồi trọn vẹn nhất.
          </div>
        </div>
      </Card>
    </div>
  );
};
