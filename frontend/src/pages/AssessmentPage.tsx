import React, { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { assessmentApi, type AssessmentTest, type TestQuestion, type TestResultResponse } from '../api/assessment.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CheckCircle2, ArrowLeft, ClipboardList, History, RefreshCw, ChevronLeft, ChevronRight, HeartHandshake, Eye } from 'lucide-react';
import { message, Button, Radio, Modal } from 'antd';

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
    return () => { cancelled = true; };
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

  const handleSubmit = async () => {
    if (!selectedTest) return;

    const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));

    if (formattedAnswers.length < questions.length) {
      message.warning('Vui lòng trả lời đầy đủ tất cả các câu hỏi trước khi nộp bài.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await assessmentApi.submitTest(selectedTest.id, { answers: formattedAnswers });
      setResult(res);
    } catch (err: unknown) {
      let msg = 'Có lỗi xảy ra khi nộp bài.';
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
    return <LoadingSpinner message="Đang tải danh sách đánh giá..." />;
  }

  // ---- Helper dùng chung cho cả result screen và history ----
  const getSeverityInfo = (level: string) => {
    switch (level) {
      case 'MINIMAL': return { label: 'Bình thường / Ổn định', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
      case 'MILD': return { label: 'Mức độ nhẹ', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
      case 'MODERATE': return { label: 'Mức độ vừa phải', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
      case 'MODERATELY_SEVERE': return { label: 'Khá nghiêm trọng', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' };
      case 'SEVERE': return { label: 'Nghiêm trọng', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
      default: return { label: level, color: 'var(--accent)', bg: 'var(--accent-bg)' };
    }
  };

  const getRecommendationText = (level: string, customRec?: string): string => {
    if (customRec && customRec.trim().length > 0) return customRec;
    switch (level) {
      case 'MINIMAL':
        return 'Tình trạng tâm lý của bạn hiện ở mức bình thường và ổn định (triệu chứng ở mức tối thiểu). Hãy tiếp tục duy trì lối sống điều độ, ngủ đủ giấc và vận động thể thao để giữ tinh thần luôn thoải mái.';
      case 'MILD':
        return 'Bạn đang có dấu hiệu căng thẳng hoặc lo âu nhẹ. Hãy dành thời gian nghỉ ngơi, thực hành các bài tập nhịp thở 4-7-8, nghe âm thanh thư giãn hoặc viết nhật ký để giải tỏa áp lực.';
      case 'MODERATE':
        return 'Bạn đang có biểu hiện lo âu / căng thẳng ở mức độ vừa. Khuyến nghị bạn thực hành thư giãn đều đặn hàng ngày và cân nhắc kết nối trực tuyến với Tình nguyện viên của PSYTHALIA để được lắng nghe và hỗ trợ.';
      case 'MODERATELY_SEVERE':
        return 'Mức độ căng thẳng / trầm cảm của bạn khá cao và có thể ảnh hưởng đến học tập, sinh hoạt. Hãy liên hệ ngay với Tình nguyện viên tâm lý hoặc tìm kiếm tư vấn từ chuyên gia tâm lý.';
      case 'SEVERE':
        return 'Mức độ nghiêm trọng. Bạn cần tìm kiếm sự hỗ trợ chuyên môn từ bác sĩ hoặc chuyên gia tâm lý sớm nhất có thể. Trong trường hợp khẩn cấp, vui lòng liên hệ ngay hotline 24/7.';
      default:
        return 'Hãy tiếp tục theo dõi cảm xúc thường xuyên và kết nối với chúng tôi khi bạn cần hỗ trợ.';
    }
  };

  // Render Result Screen
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

    return (
      <div style={{ maxWidth: '640px', margin: '20px auto', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', textAlign: 'center' }}>
        <CheckCircle2 size={52} color="#10b981" style={{ marginBottom: '16px' }} />
        <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-h)' }}>Kết quả Đánh giá</h2>

        <div style={{ padding: '24px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>
            Tổng số điểm: <strong style={{ fontSize: '32px', color: 'var(--accent)', marginLeft: '6px' }}>{finalScore}</strong>
          </div>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: severityInfo.bg, color: severityInfo.color, fontWeight: 700, fontSize: '15px' }}>
            {severityInfo.label} ({finalLevel})
          </div>
        </div>

        <div style={{ textAlign: 'left', padding: '18px 20px', borderRadius: '12px', background: 'var(--accent-bg)', color: 'var(--text-h)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px', border: '1px solid var(--accent-border)' }}>
          <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--accent)', fontSize: '15px' }}>💡 Khuyến nghị dành cho bạn:</strong>
          {finalRecommendation}
        </div>
        {finalLevel === 'SEVERE' && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <a href="tel:115" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: '#fff', fontWeight: 600, textDecoration: 'none' }}>📞 Gọi Hotline 115 ngay</a>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text)' }}>
              Các cơ sở hỗ trợ: <a href="https://maps.google.com/?q=Bệnh+viện+1" target="_blank" rel="noopener noreferrer">Bệnh viện 1</a>, <a href="https://maps.google.com/?q=Bệnh+viện+2" target="_blank" rel="noopener noreferrer">Bệnh viện 2</a>
            </div>
          </div>
        )}

        {/* Lời nhắn gửi nâng đỡ tinh thần & Cam kết nguyên tắc */}
        <div style={{
          textAlign: 'left',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: 'var(--text-h)',
          fontSize: '14px',
          lineHeight: 1.6,
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#10b981', fontWeight: 700, fontSize: '15px' }}>
            <HeartHandshake size={18} />
            <span>Thông điệp từ PSYTHALIA:</span>
          </div>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
            Bạn không cần phải trải qua mọi chuyện một mình. Việc bạn đã chủ động tham gia khảo sát và đối diện với cảm xúc thật của bản thân đã là một bước đi <strong>rất dũng cảm</strong>. Hi vọng bạn hãy để cho chúng tôi đồng hành cùng với bạn trong thời điểm mà bạn cần nhất.
          </p>
          <div style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.85, borderTop: '1px dashed rgba(16, 185, 129, 0.3)', paddingTop: '6px' }}>
            PSYTHALIA cam kết nguyên tắc: <em>Tôn trọng – Bảo mật – Không phán xét – Đồng hành</em>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/resources"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🌿 Bài tập thư giãn
          </Link>

          {(finalLevel === 'MODERATE' || finalLevel === 'MODERATELY_SEVERE' || finalLevel === 'SEVERE') && (
            <Link
              to="/chat"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              💬 Trò chuyện với TNV
            </Link>
          )}

          <Button
            size="large"
            onClick={() => { setSelectedTest(null); setResult(null); }}
            style={{ borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
          >
            Hoàn thành
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render Questions Form (khi đang làm bài)
  // ==========================================
  if (selectedTest) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Button
          type="link"
          icon={<ArrowLeft size={18} />}
          onClick={() => setSelectedTest(null)}
          style={{ padding: 0, fontWeight: 600, marginBottom: '16px', color: 'var(--accent)' }}
        >
          Quay lại danh sách
        </Button>

        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>{selectedTest.name || selectedTest.title}</h2>
        <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '24px' }}>{selectedTest.description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--code-bg)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-h)', fontSize: '16px' }}>
                Câu {idx + 1}: {q.content}
              </h4>
              <Radio.Group
                value={answers[q.id]}
                onChange={(e) => handleOptionSelect(q.id, e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}
              >
                {(q.options || []).map((opt) => {
                  const isChecked = answers[q.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionSelect(q.id, opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: isChecked ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isChecked ? 'var(--accent-bg)' : 'var(--bg)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: 'var(--text-h)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Radio value={opt.id} style={{ marginRight: '8px' }} />
                      <span style={{ userSelect: 'none' }}>{opt.content || opt.text}</span>
                    </div>
                  );
                })}
              </Radio.Group>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '28px', textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={submitting}
            style={{
              padding: '0 36px',
              height: '46px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
            }}
          >
            {submitting ? 'Đang chấm điểm...' : 'Nộp bài đánh giá'}
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Tab header style helper
  // ==========================================
  const tabStyle = (tab: ActiveTab): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.15s',
    background: activeTab === tab ? 'var(--accent)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text)',
  });

  // ==========================================
  // Tab: Danh sách bài kiểm tra
  // ==========================================
  const renderTestsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ color: 'var(--text)', fontSize: '15px', margin: 0 }}>
        Chọn bài trắc nghiệm chuẩn y khoa để tự kiểm tra tình trạng cảm xúc hiện tại.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {tests.map((t) => (
          <div key={t.id} style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>
                {t.code}
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>{t.name || t.title}</h3>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: 1.5 }}>{t.description}</p>
            </div>
            <Button
              type="primary"
              size="middle"
              onClick={() => handleStartTest(t)}
              style={{ borderRadius: '8px', fontWeight: 600, alignSelf: 'flex-start' }}
            >
              Làm bài trắc nghiệm
            </Button>
          </div>
        ))}
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
        <p style={{ color: 'var(--text)', fontSize: '14px', margin: 0 }}>
          Tổng cộng <strong style={{ color: 'var(--text-h)' }}>{historyTotal}</strong> lần kiểm tra đã thực hiện.
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
        <LoadingSpinner message="Đang tải lịch sử..." />
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <p style={{ margin: 0, fontSize: '15px' }}>Bạn chưa thực hiện bài kiểm tra nào.</p>
          <Button
            type="primary"
            size="large"
            onClick={() => setActiveTab('tests')}
            style={{ marginTop: '16px', borderRadius: '8px', fontWeight: 600 }}
          >
            Bắt đầu kiểm tra ngay
          </Button>
        </div>
      ) : (
        <>
          {/* History list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {history.map((item, idx) => {
              const info = getSeverityInfo(item.severityLevel);
              const ordinal = (historyPage - 1) * HISTORY_LIMIT + idx + 1;
              const recText = getRecommendationText(item.severityLevel, item.recommendation);
              const testTitle = item.test?.name || (item.testId.includes('phq') || (item.test?.code || '').includes('PHQ') ? 'PHQ-9 (Đánh giá Trầm cảm)' : 'GAD-7 (Đánh giá Lo âu)');

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '18px 20px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--code-bg)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top line: STT, Title, Badge, Score, Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--accent)' }}>
                        {ordinal}
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-h)' }}>
                        {testTitle}
                      </span>
                      <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '12px', background: info.bg, color: info.color, fontWeight: 700, fontSize: '12px' }}>
                        {info.label}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
                        Điểm: <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>{item.totalScore}</strong>
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: '12px', color: 'var(--text)', opacity: 0.85, whiteSpace: 'nowrap' }}>
                      {(() => {
                        const rawDate = item.takenAt || item.createdAt;
                        if (!rawDate) return null;
                        const validDate = new Date(rawDate);
                        return `${validDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${validDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                      })()}
                    </div>
                  </div>

                  {/* Recommendation quote box */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--text)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💡 Khuyến nghị y khoa (DSM-5):</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-h)' }}>
                      {recText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', paddingTop: '4px' }}>
                    <Button
                      size="small"
                      icon={<Eye size={14} />}
                      onClick={() => setSelectedHistoryItem(item)}
                      style={{ borderRadius: '6px', fontWeight: 600 }}
                    >
                      Xem chi tiết & Phân tích
                    </Button>
                    {(item.severityLevel === 'MODERATE' || item.severityLevel === 'MODERATELY_SEVERE' || item.severityLevel === 'SEVERE') && (
                      <Link
                        to="/chat"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: '#10b981',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        💬 Hỗ trợ trực tiếp
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: historyPage <= 1 ? 'not-allowed' : 'pointer', opacity: historyPage <= 1 ? 0.4 : 1, fontSize: '13px' }}
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                Trang <strong style={{ color: 'var(--text-h)' }}>{historyPage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                disabled={historyPage >= totalPages}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: historyPage >= totalPages ? 'not-allowed' : 'pointer', opacity: historyPage >= totalPages ? 0.4 : 1, fontSize: '13px' }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page title */}
      <div>
        <h2 style={{ margin: '0 0 4px 0', color: 'var(--text-h)' }}>Đánh giá Tâm lý</h2>
        <p style={{ color: 'var(--text)', margin: 0, fontSize: '14px' }}>
          Bài trắc nghiệm PHQ-9 và GAD-7 được chuẩn hóa theo y khoa để đánh giá tình trạng sức khỏe tâm thần.
        </p>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'var(--code-bg)', borderRadius: '10px', border: '1px solid var(--border)', width: 'fit-content' }}>
        <button style={tabStyle('tests')} onClick={() => setActiveTab('tests')}>
          <ClipboardList size={16} />
          Bài kiểm tra
        </button>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          <History size={16} />
          Lịch sử kiểm tra
          {historyTotal > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              background: activeTab === 'history' ? 'rgba(255,255,255,0.3)' : 'var(--accent-bg)',
              color: activeTab === 'history' ? '#fff' : 'var(--accent)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '0 6px',
            }}>
              {historyTotal}
            </span>
          )}
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
        title={<span style={{ color: 'var(--text-h)' }}>Chi tiết kết quả đánh giá lâm sàng</span>}
      >
        {selectedHistoryItem && (() => {
          const mInfo = getSeverityInfo(selectedHistoryItem.severityLevel);
          const mRec = getRecommendationText(selectedHistoryItem.severityLevel, selectedHistoryItem.recommendation);
          const testName = selectedHistoryItem.test?.name || (selectedHistoryItem.testId.includes('phq') || (selectedHistoryItem.test?.code || '').includes('PHQ') ? 'PHQ-9 (Đánh giá Trầm cảm)' : 'GAD-7 (Đánh giá Lo âu)');
          const isPhq = (selectedHistoryItem.test?.code || '').includes('PHQ') || (selectedHistoryItem.test?.name || '').includes('PHQ');

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <CheckCircle2 size={44} color="#10b981" style={{ marginBottom: '8px' }} />
                <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-h)', fontSize: '18px' }}>{testName}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                  Ngày thực hiện: {new Date(selectedHistoryItem.takenAt || selectedHistoryItem.createdAt || '').toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Score box */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>
                  Tổng số điểm: <strong style={{ fontSize: '28px', color: 'var(--accent)', marginLeft: '6px' }}>{selectedHistoryItem.totalScore}</strong>
                </div>
                <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '16px', background: mInfo.bg, color: mInfo.color, fontWeight: 700, fontSize: '13px' }}>
                  {mInfo.label} ({selectedHistoryItem.severityLevel})
                </div>
              </div>

              {/* Phân loại DSM-5 */}
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '13px', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-h)', display: 'block', marginBottom: '4px' }}>
                  📋 Thang đo chuẩn hóa DSM-5:
                </strong>
                <p style={{ margin: 0, color: 'var(--text)' }}>
                  {isPhq ? (
                    <>Bài kiểm tra <strong>PHQ-9</strong> (Patient Health Questionnaire-9) lượng giá 9 triệu chứng trầm cảm theo Cẩm nang Chẩn đoán DSM-5: 0–4 (Tối thiểu), 5–9 (Nhẹ), 10–14 (Vừa), 15–19 (Khá nặng), 20–27 (Nặng).</>
                  ) : (
                    <>Bài kiểm tra <strong>GAD-7</strong> (Generalized Anxiety Disorder-7) lượng giá 7 triệu chứng lo âu lan tỏa theo chuẩn DSM-5: 0–4 (Tối thiểu), 5–9 (Nhẹ), 10–14 (Vừa), 15–21 (Nặng).</>
                  )}
                </p>
              </div>

              {/* Khuyến nghị chi tiết */}
              <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: '14px', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '6px' }}>
                  💡 Khuyến nghị y khoa dành cho bạn:
                </strong>
                <p style={{ margin: 0, color: 'var(--text-h)' }}>
                  {mRec}
                </p>
              </div>

              {/* Thông điệp từ PSYTHALIA */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--text)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
                  <HeartHandshake size={16} />
                  <span>Đồng hành từ PSYTHALIA:</span>
                </div>
                <p style={{ margin: 0 }}>
                  Chúng tôi luôn ở đây để lắng nghe bạn. PSYTHALIA cam kết nguyên tắc: <em>Tôn trọng – Bảo mật – Không phán xét – Đồng hành</em>.
                </p>
              </div>

              {/* Modal footer buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '8px' }}>
                <Link
                  to="/resources"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: '#fff',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🌿 Bài tập thư giãn
                </Link>

                {(selectedHistoryItem.severityLevel === 'MODERATE' || selectedHistoryItem.severityLevel === 'MODERATELY_SEVERE' || selectedHistoryItem.severityLevel === 'SEVERE') && (
                  <Link
                    to="/chat"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#fff',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    💬 Trò chuyện với TNV
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
