/**
 * Module phát âm thanh thông báo nhẹ nhàng sử dụng Web Audio API chuẩn trình duyệt.
 * Không phụ thuộc file âm thanh ngoài, không tốn băng thông, an toàn và êm dịu cho nền tảng sức khỏe tâm thần.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
};

/**
 * Phát âm thanh chuông êm dịu (2 nốt C5 -> G5) khi có thông báo thông thường / chấp nhận phiên
 */
export const playNotificationSound = (type: 'chime' | 'urgent' = 'chime') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'urgent') {
      // Âm thanh nhắc nhở cho ca khẩn cấp (3 nốt A5 -> C6 -> E6 nhẹ nhàng nhưng rõ ràng)
      const freqs = [880, 1046.5, 1318.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.36);
      });
    } else {
      // Âm thanh chuông thư thái (2 nốt E5 (659Hz) -> B5 (987Hz))
      const freqs = [659.25, 987.77];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.15 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.46);
      });
    }
  } catch {
    // Không làm gián đoạn ứng dụng nếu trình duyệt hạn chế autoplay
  }
};

