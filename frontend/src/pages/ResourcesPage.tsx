import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, Tabs, Space, Tag } from 'antd';
import {
  Wind,
  Headphones,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Video,
  Eye,
  Hand,
  Ear,
  Smile,
  Coffee,
  CheckCircle,
} from 'lucide-react';
import { resourceApi, type RelaxationResource } from '../api/resource.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { HelpDirectory } from '../components/resources/HelpDirectory';
import './resources.css';

export const ResourcesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const openParam = searchParams.get('open');
  const tabParam = searchParams.get('tab');

  const [resources, setResources] = useState<RelaxationResource[]>([]);
  const [activeTab, setActiveTab] = useState<string>(
    tabParam || (openParam === 'directory' ? 'directory' : 'all'),
  );
  const [loading, setLoading] = useState<boolean>(
    (tabParam || openParam) !== 'directory',
  );

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

  // Video Modal State
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<RelaxationResource | null>(null);

  const handleOpenVideo = (res: RelaxationResource) => {
    setSelectedVideo(res);
    setVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setVideoModalOpen(false);
    setSelectedVideo(null);
  };

  useEffect(() => {
    if (activeTab === 'directory') return;

    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
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
    void load();
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

    breathingTimerRef.current = window.setInterval(() => {
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

  // Tự động mở tài nguyên khi điều hướng từ trang Nhật ký hoặc có tham số ?open=...
  useEffect(() => {
    if (!openParam || resources.length === 0) return;

    const target = resources.find(
      (r) =>
        r.id === openParam ||
        r.url === openParam ||
        r.url.toLowerCase() === openParam.toLowerCase() ||
        r.title.toLowerCase().includes(openParam.toLowerCase()),
    );

    if (target) {
      const timer = setTimeout(() => {
        const typeLower = (target.type || '').toLowerCase();
        if (typeLower === 'breathing' || typeLower === 'exercise') {
          handleOpenBreathing(target);
        } else if (typeLower === 'audio' || typeLower === 'music') {
          handleOpenAudio(target);
        } else if (typeLower === 'video') {
          handleOpenVideo(target);
        } else {
          handleOpenGuide(target);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [openParam, resources]);

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
    switch (breathingPhase) {
      case 'inhale':
        return '#426B8A'; // Muted Blue
      case 'hold':
        return '#6750A4'; // Muted Violet
      case 'exhale':
        return '#3F7667'; // Grounded Sage
      case 'hold-after':
        return '#6750A4';
      default:
        return '#3F7667';
    }
  };

  return (
    <div className="resources-container">
      {/* ─── Header Banner ─── */}
      <div className="resources-header-banner">
        <div className="resources-header-banner__left">
          <div className="resources-header-banner__title-row">
            <div className="resources-header-banner__icon">
              <Sparkles size={22} />
            </div>
            <h1 className="resources-header-banner__title">
              Không gian Thư giãn & Tự điều hòa
            </h1>
          </div>
          <p className="resources-header-banner__desc">
            Dành ít phút mỗi ngày để cân bằng lại cảm xúc với các bài tập thở khoa học, âm thanh tĩnh tâm và kỹ thuật tiếp đất cắt cơn lo âu.
          </p>
        </div>

        <Button
          type="primary"
          icon={<Wind size={16} />}
          onClick={() => {
            const defaultBreathing = resources.find((r) => {
              const t = (r.type || '').toLowerCase();
              return t === 'breathing' || t === 'exercise';
            }) || {
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
          className="resources-header-banner__btn"
        >
          Luyện thở ngay
        </Button>
      </div>

      {/* ─── Tabs Filter ─── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: 'Tất cả tài nguyên' },
          { key: 'breathing', label: 'Luyện tập nhịp thở' },
          { key: 'music', label: 'Nhạc & Âm thanh thư giãn' },
          { key: 'meditation', label: 'Thiền định' },
          { key: 'mindfulness', label: 'Kỹ thuật giải tỏa lo âu' },
          { key: 'directory', label: 'Cơ sở Y tế & Đường dây nóng' },
        ]}
      />

      {activeTab === 'directory' ? (
        <HelpDirectory />
      ) : loading ? (
        <LoadingSpinner message="Đang tải thư viện thư giãn..." />
      ) : (
        <div className="resources-grid">
          {resources.map((item) => {
            const typeLower = (item.type || '').toLowerCase();
            const isBreathing = typeLower === 'breathing' || typeLower === 'exercise';
            const isAudio = typeLower === 'audio' || typeLower === 'music';
            const isVideo = typeLower === 'video';
            const isGuide = typeLower === 'article' || typeLower === 'mindfulness' || typeLower === 'guide';

            return (
              <div key={item.id} className="resources-card">
                <div>
                  <div className="resources-card__header">
                    <div
                      className={`resources-card__type-icon ${
                        isBreathing
                          ? 'resources-card__type-icon--breathing'
                          : isAudio
                          ? 'resources-card__type-icon--audio'
                          : isVideo
                          ? 'resources-card__type-icon--video'
                          : 'resources-card__type-icon--guide'
                      }`}
                    >
                      {isBreathing && <Wind size={22} />}
                      {isAudio && <Headphones size={22} />}
                      {isVideo && <Video size={22} />}
                      {isGuide && <Sparkles size={22} />}
                    </div>

                    <span
                      className={`resources-card__tag ${
                        isBreathing
                          ? 'resources-card__tag--breathing'
                          : isAudio
                          ? 'resources-card__tag--audio'
                          : isVideo
                          ? 'resources-card__tag--video'
                          : 'resources-card__tag--guide'
                      }`}
                    >
                      {isBreathing ? 'Luyện thở' : isAudio ? 'Âm thanh' : isVideo ? 'Video' : 'Kỹ thuật'}
                    </span>
                  </div>

                  <h3 className="resources-card__title">
                    {item.title}
                  </h3>

                  <div className="resources-card__duration">
                    {item.durationSeconds ? `Thời lượng: ${Math.round(item.durationSeconds / 60)} phút` : 'Thực hành tự do'}
                  </div>
                </div>

                <div>
                  {isBreathing && (
                    <Button
                      type="primary"
                      icon={<Wind size={15} />}
                      onClick={() => handleOpenBreathing(item)}
                      className="resources-card__action-btn"
                      style={{ background: 'var(--color-info)', borderColor: 'var(--color-info)' }}
                    >
                      Bắt đầu bài tập thở
                    </Button>
                  )}

                  {isAudio && (
                    <Button
                      type="default"
                      icon={<Play size={15} />}
                      onClick={() => handleOpenAudio(item)}
                      className="resources-card__action-btn"
                      style={{ color: 'var(--color-secondary)', borderColor: 'var(--border-strong)' }}
                    >
                      Phát âm thanh thư giãn
                    </Button>
                  )}

                  {isVideo && (
                    <Button
                      type="default"
                      icon={<Play size={15} />}
                      onClick={() => handleOpenVideo(item)}
                      className="resources-card__action-btn"
                      style={{ color: 'var(--color-primary)', borderColor: 'var(--border-strong)' }}
                    >
                      Xem video hướng dẫn
                    </Button>
                  )}

                  {isGuide && (
                    <Button
                      type="default"
                      icon={<Sparkles size={15} />}
                      onClick={() => handleOpenGuide(item)}
                      className="resources-card__action-btn"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-strong)' }}
                    >
                      Xem hướng dẫn từng bước
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL 1: INTERACTIVE BREATHING BUBBLE ─── */}
      <Modal
        open={breathingModalOpen}
        onCancel={handleCloseBreathing}
        footer={null}
        width={480}
        centered
        destroyOnClose
      >
        <div className="resources-breathing-container">
          <Tag color="purple" style={{ marginBottom: '8px', borderRadius: '12px', fontWeight: 600 }}>
            {selectedBreathing?.title || 'Bài tập nhịp thở'}
          </Tag>
          <h2 className="resources-breathing-phase-title">
            {getPhaseText()}
          </h2>
          <p className="resources-breathing-phase-desc">
            Thả lỏng hai vai, ngồi thẳng lưng và hít thở nhịp nhàng theo chuyển động tròn
          </p>

          {/* Animated Circle */}
          <div className="resources-breathing-bubble-wrapper">
            <div
              className="resources-breathing-bubble"
              style={{
                background: `radial-gradient(circle, ${getPhaseColor()} 0%, rgba(255,255,255,0.08) 80%)`,
                boxShadow: `0 0 40px ${getPhaseColor()}55`,
                transform: `scale(${getPhaseScale()})`,
              }}
            >
              <span className="resources-breathing-countdown">
                {breathingSecondsLeft}
              </span>
              <span className="resources-breathing-phase-label">
                {breathingPhase === 'inhale' ? 'HÍT VÀO' : breathingPhase === 'exhale' ? 'THỞ RA' : 'GIỮ HƠI'}
              </span>
            </div>
          </div>

          <Space size="middle">
            <Button
              type="primary"
              size="large"
              icon={isBreathingRunning ? <Pause size={16} /> : <Play size={16} />}
              onClick={() => setIsBreathingRunning(!isBreathingRunning)}
              style={{ minWidth: '130px', borderRadius: '8px', fontWeight: 600 }}
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

      {/* ─── MODAL 2: AUDIO PLAYER ─── */}
      <Modal
        open={audioModalOpen}
        onCancel={handleCloseAudio}
        footer={null}
        width={460}
        centered
        destroyOnClose
      >
        <div className="resources-audio-container">
          <div className="resources-audio-icon-box">
            <Volume2 size={32} />
          </div>

          <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontSize: '18px', fontWeight: 700 }}>
            {selectedAudio?.title}
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            Đeo tai nghe và nhắm mắt lại để tận hưởng không gian âm thanh tĩnh lặng
          </p>

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
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--tint-crimson)', color: 'var(--color-crisis)', fontSize: '13px', lineHeight: 1.5 }}>
                  File âm thanh từ nguồn ngoài chưa sẵn sàng. Bạn có thể bật âm thanh tĩnh tâm trực tiếp tạo bởi trình duyệt bên dưới:
                </div>
              )}

              <div className="resources-audio-synth-box">
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Âm thanh tĩnh tâm trực tiếp (Web Audio)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Tạo dải sóng âm tiếng mưa tự nhiên dịu êm ngay trên trình duyệt, không phụ thuộc đường truyền mạng
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
                  style={{ borderRadius: '8px', fontWeight: 600, marginTop: '4px' }}
                >
                  {isSynthPlaying ? 'Dừng tiếng mưa' : 'Bật tiếng mưa êm đềm'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ─── MODAL 3: GUIDES (GROUNDING 5-4-3-2-1 / PMR) ─── */}
      <Modal
        open={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setGuideModalOpen(false)} style={{ borderRadius: '8px', fontWeight: 600 }}>
            Tôi đã cảm thấy ổn hơn
          </Button>,
        ]}
        width={560}
        centered
      >
        <div style={{ padding: '8px 4px' }}>
          <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontSize: '20px', fontWeight: 700 }}>
            {selectedGuide?.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            {selectedGuide?.url === 'grounding-54321'
              ? 'Kỹ thuật tiếp đất (5-4-3-2-1 Grounding) giúp bạn định thần và cắt đứt luồng suy nghĩ hoảng loạn bằng cách kết nối lại với 5 giác quan thực tại:'
              : 'Kỹ thuật thư giãn cơ tiến triển (PMR) giúp giải tỏa sự căng cơ tích tụ khi cơ thể phản ứng với căng thẳng:'}
          </p>

          {selectedGuide?.url === 'grounding-54321' ? (
            <div className="resources-guide-list">
              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-info)' }}><Eye size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">5 vật bạn có thể nhìn thấy:</div>
                  <div className="resources-guide-step__desc">Quan sát xung quanh: chiếc bút, chậu cây, vệt nắng, đồng hồ, cuốn sách...</div>
                </div>
              </div>

              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-secondary)' }}><Hand size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">4 thứ bạn có thể chạm vào:</div>
                  <div className="resources-guide-step__desc">Cảm nhận mặt bàn trơn nhẵn, chất vải mềm trên tay áo, lòng bàn chân chạm đất...</div>
                </div>
              </div>

              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-warning)' }}><Ear size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">3 âm thanh bạn có thể nghe thấy:</div>
                  <div className="resources-guide-step__desc">Tiếng quạt gió ro ro, tiếng xe cộ ngoài phố xa xa, hoặc tiếng hơi thở của bạn...</div>
                </div>
              </div>

              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-primary)' }}><Coffee size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">2 mùi bạn có thể ngửi thấy:</div>
                  <div className="resources-guide-step__desc">Hương thơm của tách trà, mùi trang sách mới, hoặc làn gió mát trong phòng...</div>
                </div>
              </div>

              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-success)' }}><Smile size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">1 vị bạn có thể nếm được:</div>
                  <div className="resources-guide-step__desc">Nhấp một ngụm nước ấm mát lành và cảm nhận dòng nước chảy chậm qua cổ họng.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="resources-guide-list">
              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-secondary)' }}><CheckCircle size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">Bước 1: Cơ bàn chân & Bắp chân</div>
                  <p className="resources-guide-step__desc">Gập các ngón chân lại thật chặt trong 5 giây, sau đó thở ra từ từ và thả lỏng hoàn toàn trong 10 giây.</p>
                </div>
              </div>
              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-secondary)' }}><CheckCircle size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">Bước 2: Cơ bụng & Ngực</div>
                  <p className="resources-guide-step__desc">Hít sâu gồng cơ bụng trong 5 giây, sau đó thở phào nhẹ nhõm và cảm nhận sự êm dịu lan tỏa khắp cơ thể.</p>
                </div>
              </div>
              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-secondary)' }}><CheckCircle size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">Bước 3: Cơ vai & Cổ</div>
                  <p className="resources-guide-step__desc">Nhún hai vai lên sát tai, giữ căng trong 5 giây rồi buông thõng hai vai xuống tự nhiên.</p>
                </div>
              </div>
              <div className="resources-guide-step">
                <div className="resources-guide-step__icon" style={{ background: 'var(--color-secondary)' }}><CheckCircle size={18} /></div>
                <div>
                  <div className="resources-guide-step__title">Bước 4: Cơ mặt & Hàm</div>
                  <p className="resources-guide-step__desc">Cắn nhẹ hai hàm răng và nhíu mày trong 5 giây, sau đó thả lỏng toàn bộ cơ mặt và mỉm cười thư thái.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ─── MODAL 4: VIDEO PLAYER ─── */}
      <Modal
        open={videoModalOpen}
        onCancel={handleCloseVideo}
        footer={null}
        width={720}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 20px' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontFamily: 'var(--heading)', fontSize: '18px', fontWeight: 700 }}>
            {selectedVideo?.title}
          </h3>
          {selectedVideo && (
            <video
              src={selectedVideo.url}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '450px', borderRadius: '12px', background: '#000000' }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
