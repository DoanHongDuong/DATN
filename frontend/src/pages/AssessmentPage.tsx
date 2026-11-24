import React, { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import {
  assessmentApi,
  type AssessmentTest,
  type TestQuestion,
  type TestResultResponse,
} from '../api/assessment.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  CheckCircle2,
  ArrowLeft,
  ClipboardList,
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Eye,
  Clock,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Wind,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { message, Button, Radio, Modal } from 'antd';
import './assessment.css';

type ActiveTab = 'tests' | 'history';

export const AssessmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tests');

  // --- Tab: Danh sách bài kiểm tra ---
  const [tests, setTests] = useState<AssessmentTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<AssessmentTest | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestResultResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // --- Tab: Lịch sử kiểm tra ---
  const [history, setHistory] = useState<TestResultResponse[]>([]);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TestResultResponse | null>(null);
  const HISTORY_LIMIT = 8;

  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      try {
        const data = await assessmentApi.listTests();
        if (isMounted) {
          setTests(data);
        }
      } catch (err) {
        console.error('Failed to load tests:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTests();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchHistory = useCallback(async (page: number) => {
    setLoadingHistory(true);
    try {
      const res = await assessmentApi.getHistory(page, HISTORY_LIMIT);
      const list = res.data || [];
      const total = res.meta?.total ?? res.total ?? list.length;
      setHistory(list);
      setHistoryTotal(total);
    } catch (err) {
      console.error('Failed to load assessment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load lịch sử khi chuyển sang tab history hoặc đổi trang
  useEffect(() => {
    if (activeTab !== 'history') return;
    let cancelled = false;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const res = await assessmentApi.getHistory(historyPage, HISTORY_LIMIT);
        if (!cancelled) {
          const list = res.data || [];
          const total = res.meta?.total ?? res.total ?? list.length;
          setHistory(list);
          setHistoryTotal(total);
        }
      } catch (err) {
        console.error('Failed to load assessment history:', err);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, historyPage]);

  const handleStartTest = async (test: AssessmentTest) => {
    setSelectedTest(test);
    setResult(null);
    setAnswers({});
    setLoading(true);
    try {
      const data = await assessmentApi.getQuestions(test.id);
      const list = Array.isArray(data) ? data : (data as { questions?: TestQuestion[] })?.questions || [];
      setQuestions(list);
    } catch (err) {
      console.error('Failed to load test questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleBackFromQuiz = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount > 0) {
      Modal.confirm({
        title: 'Bạn có chắc muốn thoát?',
        content: 'Tiến trình làm bài hiện tại chưa được lưu. Nếu thoát bây giờ, các câu trả lời sẽ bị hủy.',
        okText: 'Rời khỏi',
        cancelText: 'Tiếp tục làm bài',
        okButtonProps: { danger: true },
        centered: true,
        onOk: () => {
          setSelectedTest(null);
          setAnswers({});
        },
      });
    } else {
      setSelectedTest(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTest) return;

    const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));

    if (formattedAnswers.length < questions.length) {
      const remaining = questions.length - formattedAnswers.length;
      message.warning(`Bạn còn ${remaining} câu hỏi chưa hoàn thành. Vui lòng trả lời đầy đủ trước khi nộp bài.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await assessmentApi.submitTest(selectedTest.id, { answers: formattedAnswers });
      setResult(res);
    } catch (err: unknown) {
      let msg = 'Có lỗi xảy ra khi nộp bài đánh giá.';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải danh sách bài đánh giá..." />;
  }

  // ---- Helper dùng chung cho cả result screen và history ----
  const getSeverityInfo = (level: string) => {
    switch (level) {
      case 'MINIMAL':
        return { label: 'Bình thường / Ổn định', color: 'var(--color-success)', bg: 'var(--tint-sage)' };
      case 'MILD':
        return { label: 'Mức độ nhẹ', color: 'var(--color-info)', bg: 'var(--tint-blue)' };
      case 'MODERATE':
        return { label: 'Mức độ vừa phải', color: 'var(--color-warning)', bg: 'var(--tint-terracotta)' };
      case 'MODERATELY_SEVERE':
        return { label: 'Khá nghiêm trọng', color: 'var(--color-warning)', bg: 'var(--tint-terracotta)' };
      case 'SEVERE':
        return { label: 'Cần chú ý hỗ trợ', color: 'var(--color-crisis)', bg: 'var(--tint-crimson)' };
      default:
        return { label: level, color: 'var(--color-primary)', bg: 'var(--tint-lavender)' };
    }
  };

  const getRecommendationText = (level: string, customRec?: string): string => {
    if (customRec && customRec.trim().length > 0) return customRec;
    switch (level) {
      case 'MINIMAL':
        return 'Tình trạng cảm xúc của bạn hiện ở mức ổn định và triệu chứng ở mức tối thiểu. Hãy tiếp tục duy trì thói quen sinh hoạt điều độ, ngủ đủ giấc và vận động thể chất để nuôi dưỡng tinh thần tích cực.';
      case 'MILD':
        return 'Bạn đang có dấu hiệu căng thẳng hoặc lo âu nhẹ. Hãy dành thời gian nghỉ ngơi, thực hành các bài tập thở 4-7-8, lắng nghe âm thanh thư giãn hoặc viết nhật ký để giải tỏa áp lực học tập.';
      case 'MODERATE':
        return 'Bạn đang có biểu hiện lo âu / căng thẳng ở mức độ vừa. Khuyến nghị bạn thực hành thư giãn đều đặn hàng ngày và cân nhắc kết nối trực tuyến với Tình nguyện viên của PSYTHALIA để được lắng nghe và hỗ trợ.';
      case 'MODERATELY_SEVERE':
        return 'Mức độ căng thẳng / trầm cảm của bạn khá cao và có thể gây ảnh hưởng đến việc học tập, sinh hoạt thường nhật. Hãy trò chuyện với Tình nguyện viên tâm lý hoặc tìm kiếm tư vấn từ chuyên gia chuyên môn.';
      case 'SEVERE':
        return 'Mức độ căng thẳng / trầm cảm nghiêm trọng. Bạn rất cần tìm kiếm sự hỗ trợ chuyên môn y tế từ bác sĩ hoặc chuyên gia tâm lý sớm nhất có thể. Trong trường hợp khẩn cấp, vui lòng liên hệ ngay hotline 24/7.';
      default:
        return 'Hãy tiếp tục theo dõi cảm xúc thường xuyên và kết nối với chúng tôi khi bạn cần sự đồng hành.';
    }
  };

  // ==========================================
  // Render Result Screen
  // ==========================================
  if (result) {
    const rawResult = result as unknown as {
      totalScore?: number;
      severityLevel?: string;
      recommendation?: string;
      result?: { totalScore?: number; severityLevel?: string };
    };

    const finalScore = result.totalScore ?? rawResult.result?.totalScore ?? 0;
    const finalLevel = result.severityLevel ?? rawResult.result?.severityLevel ?? 'MINIMAL';
    const severityInfo = getSeverityInfo(finalLevel);
    const finalRecommendation = getRecommendationText(finalLevel, result.recommendation);
    const isHighRisk = finalLevel === 'MODERATELY_SEVERE' || finalLevel === 'SEVERE';

    return (
      <div className="assessment-container">
        <article className="assessment-result-card">
          <div className="assessment-result-icon">
            <CheckCircle2 size={32} />
          </div>

          <h2 className="assessment-result-title">Kết quả Đánh giá Cảm xúc</h2>

          {/* Score & Severity Box */}
          <div className="assessment-result-score-box">
            <span className="assessment-result-score-label">Tổng điểm đánh giá</span>
            <span className="assessment-result-score-num">{finalScore}</span>
            <div
              className="assessment-result-severity-pill"
              style={{ background: severityInfo.bg, color: severityInfo.color }}
            >
              {severityInfo.label} ({finalLevel})
            </div>
          </div>

          {/* Medical Recommendation */}
          <div className="assessment-recommendation-card">
            <div className="assessment-recommendation-card__title">
              <Sparkles size={16} />
              <span>Gợi ý đồng hành dành cho bạn:</span>
            </div>
            <p className="assessment-recommendation-card__text">
              {finalRecommendation}
            </p>
          </div>

          {/* Supportive Crisis Section if Severe */}
          {isHighRisk && (
            <div className="assessment-result-crisis">
              <div className="assessment-result-crisis__title">
                <AlertCircle size={18} />
                <span>Đường dây nóng hỗ trợ khẩn cấp 24/7</span>
              </div>
              <div className="assessment-result-crisis__links">
                <a href="tel:19006299" className="assessment-result-crisis__hotline-link">
                  <PhoneCall size={16} /> 1900 6299 – Hỗ trợ Khủng hoảng Tâm lý (24/7)
                </a>
                <a href="tel:111" className="assessment-result-crisis__hotline-link" style={{ background: '#7A241C' }}>
                  <PhoneCall size={16} /> 111 – Tổng đài Quốc gia Bảo vệ Trẻ em & Sinh viên
                </a>
                <a href="tel:115" className="assessment-result-crisis__hotline-link" style={{ background: '#591B15' }}>
                  <PhoneCall size={16} /> 115 – Cấp cứu Y tế Khẩn cấp
                </a>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5, opacity: 0.9 }}>
                Nếu bạn đang cảm thấy mất an toàn hoặc có suy nghĩ tự gây tổn thương, xin đừng chịu đựng một mình.
                Hãy kết nối ngay với các nhân viên y tế hoặc gọi cho người thân đáng tin cậy.
              </div>
            </div>
          )}

          {/* Empathy Message from PSYTHALIA */}
          <div className="assessment-empathy-card">
            <div className="assessment-empathy-card__header">
              <HeartHandshake size={18} />
              <span>Thông điệp từ PSYTHALIA:</span>
            </div>
            <p className="assessment-empathy-card__desc">
              Bạn không cần phải trải qua mọi chuyện một mình. Việc bạn chủ động thực hiện bài đánh giá và đối diện với
              cảm xúc thật của bản thân đã là một bước đi <strong>rất dũng cảm</strong>. Chúng mình luôn ở đây để đồng hành cùng bạn.
            </p>
            <div className="assessment-empathy-card__commitment">
              PSYTHALIA cam kết nguyên tắc: <em>Tôn trọng – Bảo mật – Không phán xét – Đồng hành</em>.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="assessment-result-actions">
            <Link to="/resources" className="assessment-btn-secondary">
              <Wind size={15} /> Bài tập thư giãn
            </Link>

            {(finalLevel === 'MODERATE' || isHighRisk) && (
              <Link to="/chat" className="assessment-btn-primary">
                <MessageSquare size={15} /> Trò chuyện với TNV
              </Link>
            )}

            <Button
              size="large"
              onClick={() => {
                setSelectedTest(null);
                setResult(null);
                setActiveTab('history');
              }}
              style={{
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                height: '42px',
              }}
            >
              Xem lại trong Lịch sử
            </Button>
          </div>
        </article>
      </div>
    );
  }

  // ==========================================
  // Render Questions Form (khi đang làm bài)
  // ==========================================
  if (selectedTest) {
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return (
      <div className="assessment-container">
        <div className="assessment-quiz-container">
          {/* Header */}
          <div className="assessment-quiz-header">
            <button onClick={handleBackFromQuiz} className="assessment-quiz-back-btn">
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>
            <h1 className="assessment-quiz-title">
              {selectedTest.name || selectedTest.title}
            </h1>
            <p className="assessment-quiz-desc">{selectedTest.description}</p>
          </div>

          {/* Progress Bar */}
          <div className="assessment-progress-box">
            <div className="assessment-progress-info">
              <span className="assessment-progress-label">
                Đã hoàn thành {answeredCount} / {totalQuestions} câu hỏi
              </span>
              <span className="assessment-progress-pct">{progressPct}%</span>
            </div>
            <div className="assessment-progress-bar-bg">
              <div
                className="assessment-progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Questions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              return (
                <div key={q.id} className="assessment-question-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: isAnswered ? 'var(--tint-sage)' : 'var(--tint-lavender)',
                        color: isAnswered ? 'var(--color-success)' : 'var(--color-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <h3 className="assessment-question-title">{q.content}</h3>
                  </div>

                  <Radio.Group
                    value={answers[q.id]}
                    onChange={(e) => handleOptionSelect(q.id, e.target.value)}
                    className="assessment-options-list"
                  >
                    {(q.options || []).map((opt) => {
                      const isChecked = answers[q.id] === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleOptionSelect(q.id, opt.id)}
                          className={`assessment-option-row ${
                            isChecked ? 'assessment-option-row--checked' : ''
                          }`}
                        >
                          <Radio value={opt.id} />
                          <span>{opt.content || opt.text}</span>
                        </div>
                      );
                    })}
                  </Radio.Group>
                </div>
              );
            })}
          </div>

          {/* Submit Actions */}
          <div className="assessment-quiz-actions">
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={submitting}
              className="assessment-submit-btn"
            >
              {submitting ? 'Đang chấm điểm...' : 'Hoàn thành & Xem kết quả'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Tab: Danh sách bài kiểm tra (Intro / List)
  // ==========================================
  const renderTestsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="assessment-tests-grid">
        {tests.map((t) => {
          const isPhq = (t.code || '').includes('PHQ');
          return (
            <article key={t.id} className="assessment-test-card">
              <div>
                <div className="assessment-test-card__badge-row">
                  <span className="assessment-test-card__code-badge">{t.code}</span>
                  <span className="assessment-test-card__time-badge">
                    <Clock size={13} /> ~3-5 phút
                  </span>
                </div>

                <h3 className="assessment-test-card__title">{t.name || t.title}</h3>

                <p className="assessment-test-card__desc">{t.description}</p>

                <div className="assessment-test-card__metadata">
                  <div>
                    <strong>Tiêu chuẩn:</strong> {isPhq ? 'Thang đo 9 dấu hiệu trầm cảm DSM-5' : 'Thang đo 7 biểu hiện lo âu lan tỏa DSM-5'}
                  </div>
                  <div>
                    <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    <strong>Bảo mật:</strong> Kết quả cá nhân hoàn toàn riêng tư
                  </div>
                  <div>
                    <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    <em>Công cụ sàng lọc định kỳ, không thay thế chẩn đoán y khoa chuyên sâu.</em>
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                onClick={() => handleStartTest(t)}
                className="assessment-test-card__btn"
              >
                Bắt đầu làm bài
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );

  // ==========================================
  // Tab: Lịch sử kiểm tra (PB-18)
  // ==========================================
  const totalPages = Math.ceil(historyTotal / HISTORY_LIMIT);

  const renderHistoryTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          Tổng cộng <strong style={{ color: 'var(--text-primary)' }}>{historyTotal}</strong> lần đánh giá đã thực hiện.
        </p>
        <Button
          onClick={() => fetchHistory(historyPage)}
          loading={loadingHistory}
          icon={<RefreshCw size={14} />}
          size="small"
          style={{ borderRadius: '8px' }}
        >
          Làm mới
        </Button>
      </div>

      {loadingHistory ? (
        <LoadingSpinner message="Đang tải lịch sử đánh giá..." />
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
          <ClipboardList size={40} style={{ color: 'var(--color-primary)', opacity: 0.6, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
            Bạn chưa thực hiện bài kiểm tra nào.
          </p>
          <p style={{ margin: '6px 0 16px 0', fontSize: '13.5px' }}>
            Hãy chọn một bài trắc nghiệm để theo dõi và hiểu rõ hơn về tình trạng cảm xúc hiện tại.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={() => setActiveTab('tests')}
            style={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Bắt đầu đánh giá ngay
          </Button>
        </div>
      ) : (
        <>
          {/* History list */}
          <div className="assessment-history-list">
            {history.map((item, idx) => {
              const info = getSeverityInfo(item.severityLevel);
              const ordinal = (historyPage - 1) * HISTORY_LIMIT + idx + 1;
              const recText = getRecommendationText(item.severityLevel, item.recommendation);
              const testTitle =
                item.test?.name ||
                (item.testId.includes('phq') || (item.test?.code || '').includes('PHQ')
                  ? 'PHQ-9 (Đánh giá Trầm cảm)'
                  : 'GAD-7 (Đánh giá Lo âu)');

              return (
                <div key={item.id} className="assessment-history-item">
                  {/* Top line: STT, Title, Badge, Score, Date */}
                  <div className="assessment-history-item__header">
                    <div className="assessment-history-item__meta">
                      <div className="assessment-history-item__idx">{ordinal}</div>
                      <span className="assessment-history-item__title">{testTitle}</span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 12px',
                          borderRadius: '12px',
                          background: info.bg,
                          color: info.color,
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        {info.label}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Điểm: <strong style={{ color: 'var(--color-primary)', fontSize: '15px' }}>{item.totalScore}</strong>
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const rawDate = item.takenAt || item.createdAt;
                        if (!rawDate) return null;
                        const validDate = new Date(rawDate);
                        return `${validDate.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })} ${validDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                      })()}
                    </div>
                  </div>

                  {/* Recommendation quote box */}
                  <div className="assessment-history-item__quote">
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Khuyến nghị y khoa:</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>{recText}</p>
                  </div>

                  {/* Actions */}
                  <div className="assessment-history-item__actions">
                    <Button
                      size="small"
                      icon={<Eye size={14} />}
                      onClick={() => setSelectedHistoryItem(item)}
                      style={{ borderRadius: '6px', fontWeight: 600 }}
                    >
                      Xem chi tiết & Phân tích
                    </Button>
                    {(item.severityLevel === 'MODERATE' ||
                      item.severityLevel === 'MODERATELY_SEVERE' ||
                      item.severityLevel === 'SEVERE') && (
                      <Link
                        to="/chat"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: 'var(--color-primary)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <MessageSquare size={13} /> Hỗ trợ 1-1
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                marginTop: '12px',
              }}
            >
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: historyPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: historyPage <= 1 ? 0.4 : 1,
                  fontSize: '13px',
                }}
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Trang <strong style={{ color: 'var(--text-primary)' }}>{historyPage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                disabled={historyPage >= totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: historyPage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: historyPage >= totalPages ? 0.4 : 1,
                  fontSize: '13px',
                }}
              >
                Sau <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ==========================================
  // Main layout với Tab header
  // ==========================================
  return (
    <div className="assessment-container">
      {/* Page Header */}
      <div className="assessment-header">
        <h1 className="assessment-header__title">Đánh giá Tâm lý</h1>
        <p className="assessment-header__subtitle">
          Công cụ sàng lọc tiêu chuẩn y khoa quốc tế (PHQ-9 & GAD-7) giúp bạn lắng nghe và nhận diện trạng thái cảm xúc.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="assessment-tabs">
        <button
          className={`assessment-tab-btn ${activeTab === 'tests' ? 'assessment-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          <ClipboardList size={16} />
          Bài trắc nghiệm
        </button>
        <button
          className={`assessment-tab-btn ${activeTab === 'history' ? 'assessment-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          Lịch sử đánh giá
          {historyTotal > 0 && <span className="assessment-tab-badge">{historyTotal}</span>}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'tests' ? renderTestsTab() : renderHistoryTab()}

      {/* Modal chi tiết kết quả đánh giá */}
      <Modal
        open={Boolean(selectedHistoryItem)}
        onCancel={() => setSelectedHistoryItem(null)}
        footer={null}
        width={600}
        centered
        title={<span style={{ color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>Chi tiết kết quả đánh giá lâm sàng</span>}
      >
        {selectedHistoryItem &&
          (() => {
            const mInfo = getSeverityInfo(selectedHistoryItem.severityLevel);
            const mRec = getRecommendationText(
              selectedHistoryItem.severityLevel,
              selectedHistoryItem.recommendation
            );
            const testName =
              selectedHistoryItem.test?.name ||
              (selectedHistoryItem.testId.includes('phq') ||
              (selectedHistoryItem.test?.code || '').includes('PHQ')
                ? 'PHQ-9 (Đánh giá Trầm cảm)'
                : 'GAD-7 (Đánh giá Lo âu)');
            const isPhq =
              (selectedHistoryItem.test?.code || '').includes('PHQ') ||
              (selectedHistoryItem.test?.name || '').includes('PHQ');

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--color-success)', marginBottom: '8px' }} />
                  <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '18px', fontFamily: 'var(--heading)' }}>
                    {testName}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Ngày thực hiện:{' '}
                    {new Date(
                      selectedHistoryItem.takenAt || selectedHistoryItem.createdAt || ''
                    ).toLocaleString('vi-VN')}
                  </p>
                </div>

                {/* Score box */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Tổng số điểm:{' '}
                    <strong style={{ fontSize: '28px', color: 'var(--color-primary)', marginLeft: '6px' }}>
                      {selectedHistoryItem.totalScore}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: '16px',
                      background: mInfo.bg,
                      color: mInfo.color,
                      fontWeight: 700,
                      fontSize: '13px',
                    }}
                  >
                    {mInfo.label} ({selectedHistoryItem.severityLevel})
                  </div>
                </div>

                {/* Phân loại DSM-5 */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    📋 Thang đo chuẩn hóa DSM-5:
                  </strong>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {isPhq ? (
                      <>
                        Bài kiểm tra <strong>PHQ-9</strong> (Patient Health Questionnaire-9) lượng giá 9 triệu chứng trầm cảm theo Cẩm nang Chẩn đoán DSM-5: 0–4 (Tối thiểu), 5–9 (Nhẹ), 10–14 (Vừa), 15–19 (Khá nặng), 20–27 (Nặng).
                      </>
                    ) : (
                      <>
                        Bài kiểm tra <strong>GAD-7</strong> (Generalized Anxiety Disorder-7) lượng giá 7 triệu chứng lo âu lan tỏa theo chuẩn DSM-5: 0–4 (Tối thiểu), 5–9 (Nhẹ), 10–14 (Vừa), 15–21 (Nặng).
                      </>
                    )}
                  </p>
                </div>

                {/* Khuyến nghị chi tiết */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'var(--tint-lavender)',
                    border: '1px solid rgba(103, 80, 164, 0.16)',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                    💡 Khuyến nghị dành cho bạn:
                  </strong>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{mRec}</p>
                </div>

                {/* Thông điệp từ PSYTHALIA */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'var(--tint-sage)',
                    border: '1px solid rgba(58, 117, 88, 0.2)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-secondary)',
                      fontWeight: 700,
                      marginBottom: '4px',
                    }}
                  >
                    <HeartHandshake size={16} />
                    <span>Đồng hành từ PSYTHALIA:</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                    Chúng mình luôn ở đây để lắng nghe bạn. PSYTHALIA cam kết nguyên tắc: <em>Tôn trọng – Bảo mật – Không phán xét – Đồng hành</em>.
                  </p>
                </div>

                {/* Modal footer buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    marginTop: '8px',
                  }}
                >
                  <Link
                    to="/resources"
                    className="assessment-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Wind size={14} /> Bài tập thư giãn
                  </Link>

                  {(selectedHistoryItem.severityLevel === 'MODERATE' ||
                    selectedHistoryItem.severityLevel === 'MODERATELY_SEVERE' ||
                    selectedHistoryItem.severityLevel === 'SEVERE') && (
                    <Link
                      to="/chat"
                      className="assessment-btn-primary"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      <MessageSquare size={14} /> Trò chuyện với TNV
                    </Link>
                  )}

                  <Button
                    onClick={() => setSelectedHistoryItem(null)}
                    style={{ borderRadius: '8px', fontWeight: 600 }}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
};
