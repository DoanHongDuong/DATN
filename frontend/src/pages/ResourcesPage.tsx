import React, { useEffect, useState, useRef } from 'react';
import { Card, Tag, Button, Modal, Tabs, Space, Typography } from 'antd';
import {
  Wind,
  Headphones,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Eye,
  Hand,
  Ear,
  Smile,
  Coffee,
} from 'lucide-react';
import { resourceApi, type RelaxationResource } from '../api/resource.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const { Title, Paragraph, Text } = Typography;

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<RelaxationResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Breathing Modal State
  const [breathingModalOpen, setBreathingModalOpen] = useState<boolean>(false);
  const [selectedBreathing, setSelectedBreathing] = useState<RelaxationResource | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-after'>('inhale');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(4);
  const [isBreathingRunning, setIsBreathingRunning] = useState<boolean>(false);
  const breathingTimerRef = useRef<number | null>(null);

  // Audio Modal State
  const [audioModalOpen, setAudioModalOpen] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<RelaxationResource | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSynthPlaying, setIsSynthPlaying] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthSourceRef = useRef<AudioNode | null>(null);

  // Article / Guide Modal State
  const [guideModalOpen, setGuideModalOpen] = useState<boolean>(false);
  const [selectedGuide, setSelectedGuide] = useState<RelaxationResource | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await resourceApi.getAll(activeTab);
        if (isMounted) {
          setResources(data);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Breathing logic: 4-7-8 vs Box Breathing (4-4-4-4) vs Diaphragmatic (4-2-6)
  useEffect(() => {
    if (!isBreathingRunning) {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
      return;
    }

    const isBox = selectedBreathing?.url === 'box-breathing';
    const isDiaphragm = selectedBreathing?.url === 'diaphragmatic';

    // Durations for each technique
    // 4-7-8: Inhale 4s -> Hold 7s -> Exhale 8s
    // Box: Inhale 4s -> Hold 4s -> Exhale 4s -> Hold 4s
    // Diaphragm: Inhale 4s -> Hold 2s -> Exhale 6s
    const getPhaseDuration = (phase: string) => {
      if (isBox) return 4;
      if (isDiaphragm) {
        if (phase === 'inhale') return 4;
        if (phase === 'hold') return 2;
        return 6;
      }
      // default 4-7-8
      if (phase === 'inhale') return 4;
      if (phase === 'hold') return 7;
      return 8;
    };

    breathingTimerRef.current = setInterval(() => {
      setBreathingSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Switch to next phase
        setBreathingPhase((currentPhase) => {
          if (isBox) {
            if (currentPhase === 'inhale') return 'hold';
            if (currentPhase === 'hold') return 'exhale';
            if (currentPhase === 'exhale') return 'hold-after';
            return 'inhale';
          }
          if (currentPhase === 'inhale') return 'hold';
          if (currentPhase === 'hold') return 'exhale';
          return 'inhale';
        });

        // Set new seconds for the new phase
        const getNextPhase = () => {
          if (isBox) {
            if (breathingPhase === 'inhale') return 'hold';
            if (breathingPhase === 'hold') return 'exhale';
            if (breathingPhase === 'exhale') return 'hold-after';
            return 'inhale';
          }
          if (breathingPhase === 'inhale') return 'hold';
          if (breathingPhase === 'hold') return 'exhale';
          return 'inhale';
        };

        const nextPhase = getNextPhase();
        return getPhaseDuration(nextPhase);
      });
    }, 1000);

    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, [isBreathingRunning, breathingPhase, selectedBreathing]);

  const handleOpenBreathing = (res: RelaxationResource) => {
    setSelectedBreathing(res);
    setBreathingPhase('inhale');
    setBreathingSecondsLeft(4);
    setIsBreathingRunning(true);
    setBreathingModalOpen(true);
  };

  const handleCloseBreathing = () => {
    setIsBreathingRunning(false);
    if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    setBreathingModalOpen(false);
  };

  const startAmbientSynth = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      synthSourceRef.current = whiteNoise;
      setIsSynthPlaying(true);
    } catch (e) {
      console.error('AudioContext error:', e);
    }
  };

  const stopAmbientSynth = () => {
    if (synthSourceRef.current) {
      try {
        (synthSourceRef.current as AudioScheduledSourceNode).stop();
      } catch (err) {
        console.debug('Synth stop error:', err);
      }
      synthSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch((err) => {
        console.debug('AudioContext close error:', err);
      });
      audioContextRef.current = null;
    }
    setIsSynthPlaying(false);
  };

  const handleOpenAudio = (res: RelaxationResource) => {
    setSelectedAudio(res);
    setAudioError(false);
    setIsPlayingAudio(true);
    setAudioModalOpen(true);
  };

  const handleCloseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopAmbientSynth();
    setIsPlayingAudio(false);
    setAudioModalOpen(false);
  };

  const handleOpenGuide = (res: RelaxationResource) => {
    setSelectedGuide(res);
    setGuideModalOpen(true);
  };

  const getPhaseText = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Hít vào nhẹ nhàng bằng mũi';
      case 'hold':
        return 'Giữ hơi thở thư thái';
      case 'exhale':
        return 'Thở ra chậm rãi bằng miệng';
      case 'hold-after':
        return 'Tạm dừng thả lỏng';
      default:
        return 'Thở đều';
    }
  };

  const getPhaseScale = () => {
    if (breathingPhase === 'inhale') return 1.35;
    if (breathingPhase === 'hold') return 1.35;
    return 1;
  };

  const getPhaseColor = () => {
    if (breathingPhase === 'inhale') return '#3b82f6';
    if (breathingPhase === 'hold') return '#eab308';
    if (breathingPhase === 'exhale') return '#10b981';
    return '#8b5cf6';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(170, 59, 255, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
          borderRadius: '16px',
          padding: '32px 28px',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <Title level={2} style={{ margin: 0, color: 'var(--text-h)' }}>
              Không gian Thư giãn & Phục hồi
            </Title>
          </div>
          <Paragraph style={{ margin: 0, color: 'var(--text)', fontSize: '15px', maxWidth: '650px' }}>
            Dành ít phút mỗi ngày để cân bằng lại cảm xúc với các bài tập thở khoa học, âm thanh tĩnh tâm và kỹ thuật cắt cơn căng thẳng.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<Wind size={16} />}
          onClick={() => {
            const defaultBreathing = resources.find((r) => r.type === 'BREATHING') || {
              id: 'temp',
              title: 'Kỹ thuật thở sâu 4-7-8',
              type: 'BREATHING',
              url: '4-7-8',
              durationSeconds: 300,
              category: 'breathing',
              createdAt: '',
            };
            handleOpenBreathing(defaultBreathing);
          }}
          style={{ height: '42px', borderRadius: '8px', padding: '0 20px', fontWeight: 600 }}
        >
          Luyện thở ngay 🫁
        </Button>
      </div>

      {/* Tabs Filter */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: 'Tất cả tài nguyên' },
          { key: 'breathing', label: '🫁 Luyện tập nhịp thở' },
          { key: 'calm_audio', label: '🎧 Âm thanh thiên nhiên' },
          { key: 'mindfulness', label: '🌿 Kỹ thuật giải tỏa lo âu' },
        ]}
      />

      {loading ? (
        <LoadingSpinner message="Đang tải thư viện thư giãn..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {resources.map((item) => {
            const isBreathing = item.type === 'BREATHING';
            const isAudio = item.type === 'AUDIO';
            const isGuide = item.type === 'ARTICLE';

            return (
              <Card
                key={item.id}
                hoverable
                style={{
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
                bodyStyle={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: isBreathing
                          ? 'rgba(59, 130, 246, 0.15)'
                          : isAudio
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(168, 85, 247, 0.15)',
                        color: isBreathing ? '#3b82f6' : isAudio ? '#10b981' : '#a855f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isBreathing && <Wind size={22} />}
                      {isAudio && <Headphones size={22} />}
                      {isGuide && <Sparkles size={22} />}
                    </div>

                    <Tag color={isBreathing ? 'blue' : isAudio ? 'green' : 'purple'}>
                      {isBreathing ? 'Luyện thở' : isAudio ? 'Âm thanh' : 'Kỹ thuật'}
                    </Tag>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: 'var(--text-h)', fontWeight: 600 }}>
                    {item.title}
                  </h3>

                  <div style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '16px' }}>
                    {item.durationSeconds ? `Thời lượng: ${Math.round(item.durationSeconds / 60)} phút` : 'Thực hành tự do'}
                  </div>
                </div>

                <div>
                  {isBreathing && (
                    <Button
                      type="primary"
                      block
                      icon={<Wind size={15} />}
                      onClick={() => handleOpenBreathing(item)}
                      style={{ borderRadius: '8px', background: '#3b82f6', borderColor: '#3b82f6' }}
                    >
                      Bắt đầu bài tập thở
                    </Button>
                  )}

                  {isAudio && (
                    <Button
                      type="default"
                      block
                      icon={<Play size={15} />}
                      onClick={() => handleOpenAudio(item)}
                      style={{ borderRadius: '8px', color: '#10b981', borderColor: '#10b981' }}
                    >
                      Phát âm thanh thư giãn
                    </Button>
                  )}

                  {isGuide && (
                    <Button
                      type="default"
                      block
                      icon={<Sparkles size={15} />}
                      onClick={() => handleOpenGuide(item)}
                      style={{ borderRadius: '8px' }}
                    >
                      Xem hướng dẫn từng bước
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: INTERACTIVE BREATHING BUBBLE */}
      <Modal
        open={breathingModalOpen}
        onCancel={handleCloseBreathing}
        footer={null}
        width={480}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 24px' }}>
          <Tag color="blue" style={{ marginBottom: '8px' }}>
            {selectedBreathing?.title || 'Bài tập nhịp thở'}
          </Tag>
          <Title level={4} style={{ margin: '0 0 4px', color: 'var(--text-h)' }}>
            {getPhaseText()}
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            Thả lỏng hai vai, ngồi thẳng lưng và hít thở nhịp nhàng theo vòng tròn
          </Text>

          {/* Animated Circle */}
          <div
            style={{
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '28px 0',
            }}
          >
            <div
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getPhaseColor()} 0%, rgba(255,255,255,0.05) 70%)`,
                boxShadow: `0 0 35px ${getPhaseColor()}55`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${getPhaseScale()})`,
                transition: 'transform 3s cubic-bezier(0.4, 0, 0.2, 1), background 1s ease',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: '38px', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                {breathingSecondsLeft}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {breathingPhase === 'inhale' ? 'HÍT VÀO' : breathingPhase === 'exhale' ? 'THỞ RA' : 'GIỮ HƠI'}
              </span>
            </div>
          </div>

          <Space orientation="horizontal" size="middle">
            <Button
              type="primary"
              size="large"
              icon={isBreathingRunning ? <Pause size={16} /> : <Play size={16} />}
              onClick={() => setIsBreathingRunning(!isBreathingRunning)}
              style={{ minWidth: '130px', borderRadius: '8px' }}
            >
              {isBreathingRunning ? 'Tạm dừng' : 'Tiếp tục'}
            </Button>
            <Button
              size="large"
              icon={<RotateCcw size={16} />}
              onClick={() => {
                setBreathingPhase('inhale');
                setBreathingSecondsLeft(4);
              }}
              style={{ borderRadius: '8px' }}
            >
              Đặt lại
            </Button>
          </Space>
        </div>
      </Modal>

      {/* MODAL 2: AUDIO PLAYER */}
      <Modal
        open={audioModalOpen}
        onCancel={handleCloseAudio}
        footer={null}
        width={460}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 24px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Volume2 size={32} />
          </div>

          <Title level={4} style={{ margin: '0 0 6px', color: 'var(--text-h)' }}>
            {selectedAudio?.title}
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '13px', marginBottom: '20px' }}>
            Đeo tai nghe và nhắm mắt lại để tận hưởng không gian thiên nhiên tĩnh lặng
          </Paragraph>

          {selectedAudio && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <audio
                ref={audioRef}
                src={selectedAudio.url}
                autoPlay={isPlayingAudio}
                controls
                loop
                onError={() => {
                  setAudioError(true);
                  if (audioRef.current) audioRef.current.pause();
                }}
                style={{ width: '100%', borderRadius: '8px' }}
              />

              {audioError && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px' }}>
                  ⚠️ File âm thanh từ nguồn ngoài chưa sẵn sàng hoặc bị chặn CORS. Bạn có thể bật âm thanh thư giãn trực tiếp bên dưới:
                </div>
              )}

              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-h)', marginBottom: '6px' }}>
                  🌧️ Âm thanh tĩnh tâm trực tiếp (Web Audio)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '12px' }}>
                  Tạo dải sóng âm tự nhiên dịu êm ngay trên trình duyệt, không phụ thuộc đường truyền mạng
                </div>
                <Button
                  type={isSynthPlaying ? 'primary' : 'default'}
                  icon={isSynthPlaying ? <Pause size={15} /> : <Play size={15} />}
                  onClick={() => {
                    if (isSynthPlaying) {
                      stopAmbientSynth();
                    } else {
                      if (audioRef.current) audioRef.current.pause();
                      startAmbientSynth();
                    }
                  }}
                  style={{ borderRadius: '8px' }}
                >
                  {isSynthPlaying ? 'Dừng tiếng mưa' : 'Bật tiếng mưa êm đềm'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 3: GUIDES (GROUNDING 5-4-3-2-1 / PMR) */}
      <Modal
        open={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setGuideModalOpen(false)}>
            Tôi đã cảm thấy ổn hơn
          </Button>,
        ]}
        width={560}
        centered
      >
        <div style={{ padding: '8px 4px' }}>
          <Title level={4} style={{ marginBottom: '8px', color: 'var(--text-h)' }}>
            {selectedGuide?.title}
          </Title>
          <Paragraph style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '20px' }}>
            {selectedGuide?.url === 'grounding-54321'
              ? 'Kỹ thuật tiếp đất (5-4-3-2-1 Grounding) giúp bạn định thần và cắt đứt luồng suy nghĩ hoảng loạn bằng cách kết nối lại với 5 giác quan thực tại:'
              : 'Kỹ thuật thư giãn cơ tiến triển (PMR) giúp giải tỏa sự căng cơ tích tụ khi cơ thể phản ứng với stress:'}
          </Paragraph>

          {selectedGuide?.url === 'grounding-54321' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#3b82f6', color: '#fff', borderRadius: '8px', padding: '6px' }}><Eye size={18} /></div>
                <div>
                  <strong style={{ color: 'var(--text-h)' }}>5 vật bạn có thể nhìn thấy:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Quan sát xung quanh: chiếc bút, chậu cây, đồng hồ, vệt nắng, cuốn sách...</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#10b981', color: '#fff', borderRadius: '8px', padding: '6px' }}><Hand size={18} /></div>
                <div>
                  <strong style={{ color: 'var(--text-h)' }}>4 thứ bạn có thể chạm vào:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Cảm nhận bề mặt bàn, cảm giác mặt vải áo, lòng bàn chân chạm sàn nhà...</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#eab308', color: '#fff', borderRadius: '8px', padding: '6px' }}><Ear size={18} /></div>
                <div>
                  <strong style={{ color: 'var(--text-h)' }}>3 âm thanh bạn có thể nghe thấy:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Tiếng quạt gió ro ro, tiếng xe cộ ngoài phố, tiếng hơi thở của bạn...</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#ec4899', color: '#fff', borderRadius: '8px', padding: '6px' }}><Coffee size={18} /></div>
                <div>
                  <strong style={{ color: 'var(--text-h)' }}>2 mùi bạn có thể ngửi thấy:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Hương thơm của tách trà, mùi thơm của áo mới, hoặc không khí trong phòng...</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: '#8b5cf6', color: '#fff', borderRadius: '8px', padding: '6px' }}><Smile size={18} /></div>
                <div>
                  <strong style={{ color: 'var(--text-h)' }}>1 vị bạn có thể nếm được:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text)' }}>Nhấp một ngụm nước ấm mát lành và cảm nhận dòng nước chảy qua cổ họng.</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <strong>Bước 1: Cơ bàn chân & Bắp chân</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>Gập các ngón chân lại thật chặt trong 5 giây, sau đó thở ra và thả lỏng hoàn toàn trong 10 giây.</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <strong>Bước 2: Cơ bụng & Ngực</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>Hít sâu gồng cơ bụng trong 5 giây, sau đó thở phào nhẹ nhõm và cảm nhận sự êm dịu lan tỏa.</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <strong>Bước 3: Cơ vai & Cổ</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>Nhún hai vai lên sát tai, giữ căng trong 5 giây rồi buông thõng vai xuống.</p>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <strong>Bước 4: Cơ mặt & Hàm</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text)' }}>Cắn chặt răng nhẹ và nhíu mày trong 5 giây, sau đó thả lỏng toàn bộ cơ mặt và mỉm cười nhẹ.</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
