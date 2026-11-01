import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Sparkles,
  AlertCircle,
  RotateCw,
  MessageCircle,
  Share2,
  CheckCircle2,
  Lock,
  Download,
  Video
} from 'lucide-react';
import { translations } from '../translations';
import { API_BASE_URL } from '../config';

const COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6',
  '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export default function SpinningWheelModal({
  groupId,
  currentMonth,
  groupName,
  totalAmount,
  lang = 'en',
  onClose,
  onDrawComplete,
}) {
  const t = translations[lang] || translations.en;
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [allPaidAndApproved, setAllPaidAndApproved] = useState(false);
  const [unpaidMembers, setUnpaidMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');

  // Video recording states
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [videoNotice, setVideoNotice] = useState('');

  const canvasRef = useRef(null);
  const currentAngleRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const token = localStorage.getItem('kuri_token');

  // Fetch eligible members (only hasWon === false) & payment approval status
  useEffect(() => {
    const fetchEligible = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/draw/eligible/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load eligible members');
        setEligibleMembers(data.eligibleMembers || []);
        setTotalMembers(data.totalMembers || 0);
        setApprovedCount(data.approvedCount || 0);
        setUnpaidCount(data.unpaidCount || 0);
        setAllPaidAndApproved(!!data.allPaidAndApproved);
        setUnpaidMembers(data.unpaidMembers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEligible();
  }, [groupId, token]);

  // Draw wheel on HTML5 canvas with Hi-DPI clarity
  const drawWheel = (angleDeg, winnerKuriNumber = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 35; // outer radius: 215px

    ctx.clearRect(0, 0, width, height);

    const count = eligibleMembers.length;
    if (count === 0) return;
    const sliceAngle = 360 / count;

    // Draw slices
    for (let i = 0; i < count; i++) {
      const member = eligibleMembers[i];
      const startDeg = angleDeg + i * sliceAngle;
      const endDeg = angleDeg + (i + 1) * sliceAngle;

      const startRad = (startDeg * Math.PI) / 180;
      const endRad = (endDeg * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startRad, endRad);
      ctx.closePath();

      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw 3-digit Kuri Number on slice
      const midRad = startRad + (sliceAngle * Math.PI) / 360;
      const textRadius = radius * 0.65;
      const tx = cx + Math.cos(midRad) * textRadius;
      const ty = cy + Math.sin(midRad) * textRadius;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midRad + Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = count > 12 ? 'bold 15px sans-serif' : 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText('#' + member.kuriNumber, 0, 0);
      ctx.restore();
    }

    // Outer border ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Center Hub
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Hub Sparkle Icon
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨', cx, cy + 2);

    // Top Pointer Arrow (pointing straight down into top of wheel at cx, cy - radius)
    const pointerY = cy - radius;
    ctx.beginPath();
    ctx.moveTo(cx, pointerY + 24);
    ctx.lineTo(cx - 16, pointerY - 14);
    ctx.lineTo(cx + 16, pointerY - 14);
    ctx.closePath();
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Optional Celebration Banner in recorded video frames
    if (winnerKuriNumber) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      const bx = 45;
      const by = height - 105;
      const bw = width - 90;
      const bh = 85;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 18);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.fillRect(bx, by, bw, bh);
      }

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 WINNING KURI NUMBER', cx, by + 26);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      ctx.fillText('#' + winnerKuriNumber, cx, by + 65);
      ctx.restore();
    }
  };

  // Render initial wheel when eligible members load
  useEffect(() => {
    if (eligibleMembers.length > 0) {
      drawWheel(currentAngleRef.current);
    }
  }, [eligibleMembers]);

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);
  };

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  const startSpin = async () => {
    if (spinning || eligibleMembers.length === 0 || !allPaidAndApproved) return;
    setError('');
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setVideoNotice('');
    setSpinning(true);

    try {
      // 1. Call backend to select winner, record draw, and trigger auto-email
      const res = await fetch(`${API_BASE_URL}/api/draw/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          month: currentMonth,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to conduct draw');
      }

      const backendWinner = data.winner;
      const winnerIndex = eligibleMembers.findIndex((m) => m.kuriNumber === backendWinner.kuriNumber);

      if (winnerIndex === -1) {
        throw new Error('Winner could not be located on the wheel');
      }

      // 2. Setup video recording via MediaRecorder on canvas.captureStream
      recordedChunksRef.current = [];
      const mimeType = getSupportedMimeType();
      if (canvasRef.current && canvasRef.current.captureStream && typeof MediaRecorder !== 'undefined') {
        try {
          const stream = canvasRef.current.captureStream(30); // 30 FPS video
          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.onstop = () => {
            const finalMime = mimeType || 'video/webm';
            const blob = new Blob(recordedChunksRef.current, { type: finalMime });
            setRecordedVideoBlob(blob);
            setRecordedVideoUrl(URL.createObjectURL(blob));
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        } catch (err) {
          console.warn('MediaRecorder recording could not start:', err);
        }
      }

      // 3. Compute rotation angles
      const sliceAngle = 360 / eligibleMembers.length;
      const sliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
      // Top pointer is at 270 degrees
      const targetDeg = (270 - sliceCenter + 360) % 360;
      const fullRotations = 6 * 360; // 6 complete spins
      const startAngle = currentAngleRef.current % 360;
      const totalAngleToRotate = fullRotations + targetDeg - startAngle + (targetDeg < startAngle ? 360 : 0);

      // 4. Smooth physics spin loop with quintic deceleration ease
      const duration = 6000; // 6 seconds
      const startTime = performance.now();
      const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOutQuint(progress);
        const currentDeg = startAngle + totalAngleToRotate * eased;
        currentAngleRef.current = currentDeg;

        if (progress < 1) {
          drawWheel(currentDeg);
          requestAnimationFrame(animate);
        } else {
          // Final landing on the winner slice
          drawWheel(currentDeg);
          setWinner(backendWinner);
          setEmailSent(data.emailSent);
          setEmailError(data.emailError || '');
          fireConfetti();
          if (onDrawComplete) onDrawComplete(data);

          // Hold animation for 2 seconds to capture celebration banner in the video
          let celebrationFrame = 0;
          const celebrationFrames = 60; // ~2 seconds at 30fps
          const celebrationLoop = () => {
            celebrationFrame++;
            drawWheel(currentDeg, backendWinner.kuriNumber);
            if (celebrationFrame < celebrationFrames) {
              requestAnimationFrame(celebrationLoop);
            } else {
              // Stop video recording
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
              setSpinning(false);
            }
          };
          requestAnimationFrame(celebrationLoop);
        }
      };
      requestAnimationFrame(animate);
    } catch (err) {
      setError(err.message);
      setSpinning(false);
    }
  };

  // WhatsApp share text (strictly hides name, only revealing winning 3-digit number!)
  const getWinnerShareText = () => {
    if (!winner) return '';
    const loginUrl = window.location.origin;
    return lang === 'ml'
      ? `🎉 *വിജയി പ്രഖ്യാപനം - കുറി നറുക്കെടുപ്പ്* 🏆\n\n` +
        `*"${groupName}"* കുറി ഗ്രൂപ്പിന്റെ *മാസം #${currentMonth}* ലെ നറുക്കെടുപ്പ് പൂർത്തിയായി!\n\n` +
        `🔢 *വിജയിച്ച കുറി നമ്പർ: #${winner.kuriNumber}*\n` +
        `💰 *സമ്മാനത്തുക: ₹${totalAmount ? totalAmount.toLocaleString('en-IN') : ''}*\n` +
        `📅 *മാസം: #${currentMonth}*\n\n` +
        `🔒 _മെമ്പർമാരുടെ സ്വകാര്യതയ്ക്കായി വിജയിയുടെ കുറി നമ്പർ മാത്രമാണ് നൽകിയിട്ടുള്ളത്. ഈ കുറി നമ്പറുള്ള അംഗം സമ്മാനത്തുക കൈപ്പറ്റുന്നതിനായി അഡ്മിനുമായി ഉടൻ ബന്ധപ്പെടുക._\n\n` +
        `📲 *കുറി പോർട്ടൽ:* ${loginUrl}`
      : `🎉 *LUCKY DRAW WINNER ANNOUNCEMENT* 🏆\n\n` +
        `The Lucky Draw for *"${groupName}"* (*Month #${currentMonth}*) has been completed!\n\n` +
        `🔢 *Winning Kuri Number: #${winner.kuriNumber}*\n` +
        `💰 *Prize Amount: ₹${totalAmount ? totalAmount.toLocaleString('en-IN') : ''}*\n` +
        `📅 *Month: #${currentMonth}*\n\n` +
        `🔒 _For member privacy, only the 3-digit Kuri number is revealed. The member holding this number is requested to contact the admin to claim the prize._\n\n` +
        `📲 *Portal:* ${loginUrl}`;
  };

  // Download video file
  const handleDownloadVideo = () => {
    if (!recordedVideoUrl || !winner) return;
    const a = document.createElement('a');
    a.href = recordedVideoUrl;
    const ext = recordedVideoBlob && recordedVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    a.download = `kuri-${(groupName || 'draw').replace(/\s+/g, '_')}-month-${currentMonth}-winner-${winner.kuriNumber}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Share video via WhatsApp
  const handleShareVideoWhatsApp = async () => {
    if (!recordedVideoUrl || !winner) return;
    const text = getWinnerShareText();

    // If browser supports Web Share API with files (Android, iOS mobile devices)
    if (
      navigator.canShare &&
      recordedVideoBlob &&
      navigator.canShare({
        files: [
          new File([recordedVideoBlob], 'kuri-lucky-draw.webm', {
            type: recordedVideoBlob.type,
          }),
        ],
      })
    ) {
      try {
        const ext = recordedVideoBlob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File(
          [recordedVideoBlob],
          `kuri-draw-month-${currentMonth}-winner-${winner.kuriNumber}.${ext}`,
          { type: recordedVideoBlob.type }
        );
        await navigator.share({
          files: [file],
          title: `${groupName} Lucky Draw Month #${currentMonth}`,
          text: text,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }

    // Fallback for browsers without direct file sharing:
    // Download video and open WhatsApp with announcement message
    handleDownloadVideo();
    setVideoNotice(t.videoDownloadedNotice);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp share text to winner directly or to group
  const handleShareToWinnerWhatsApp = () => {
    if (!winner) return;
    const text = getWinnerShareText();
    const cleanPhone = (winner.phone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareToGroupWhatsApp = () => {
    if (!winner) return;
    const text = getWinnerShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Remind unpaid member via WhatsApp
  const handleRemindUnpaidMemberWhatsApp = (member) => {
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const reminderText = lang === 'ml'
      ? `📢 *കുറി അടവ് ഓർമ്മപ്പെടുത്തൽ* 🔔\n\n` +
        `പ്രിയപ്പെട്ട *${member.name}* (കുറി #${member.kuriNumber}),\n` +
        `*"${groupName}"* കുറിയുടെ *മാസം #${currentMonth}* ലെ അടവ് ഇതുവരെ ലഭിച്ചിട്ടില്ല / അപ്രൂവ് ചെയ്തിട്ടില്ല.\n` +
        `എല്ലാ മെമ്പർമാരും അടച്ച ശേഷം മാത്രമേ ഈ മാസത്തെ നറുക്കെടുപ്പ് (Lucky Draw) നടത്താൻ കഴിയുകയുള്ളൂ.\n\n` +
        `ദയവായി തുക എത്രയും വേഗം അടയ്ക്കുക.\n` +
        `📲 ${window.location.origin}`
      : `📢 *Kuri Payment Reminder* 🔔\n\n` +
        `Dear *${member.name}* (Kuri #${member.kuriNumber}),\n` +
        `Your monthly installment for *"${groupName}"* (*Month #${currentMonth}*) is pending approval / unpaid.\n` +
        `The Lucky Draw for this month can only be conducted after all members complete their payment.\n\n` +
        `Please complete your payment at the earliest.\n` +
        `📲 ${window.location.origin}`;

    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(reminderText)}`
      : `https://wa.me/?text=${encodeURIComponent(reminderText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 text-slate-800 dark:text-white shadow-2xl border border-slate-200 dark:border-indigo-500/30 overflow-y-auto max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t.wheelTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {groupName} • {t.monthNum} #{currentMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={spinning}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Verification Banner */}
        {!loading && (
          <div className="my-3">
            {allPaidAndApproved ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {t.allPaymentsApprovedBadge}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                      {approvedCount} / {totalMembers}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                    {t.allPaymentsApprovedDesc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        {t.pendingPaymentsBadge}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200">
                        {approvedCount} / {totalMembers}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                      {t.pendingPaymentsDesc}
                    </p>
                  </div>
                </div>

                {/* List of Unpaid / Pending Members */}
                {unpaidMembers.length > 0 && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-500/20 space-y-1.5">
                    <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <span>{t.unpaidCountLabel} ({unpaidMembers.length})</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {unpaidMembers.map((m) => (
                        <div
                          key={m._id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-amber-200/80 dark:border-amber-500/20 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
                              #{m.kuriNumber}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {m.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemindUnpaidMemberWhatsApp(m)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm transition"
                            title={t.remindWhatsAppBtn}
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{t.remindWhatsAppBtn}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.loadingEligible}</p>
          </div>
        ) : eligibleMembers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t.noEligibleTitle}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {t.noEligibleDesc}
            </p>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center">
            {/* Spinning Wheel Canvas Container */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-3">
              {spinning && (
                <div className="absolute top-1 right-1 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-lg animate-pulse tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>REC</span>
                </div>
              )}

              {/* High-Resolution HTML5 Canvas Wheel (Recorded via MediaRecorder) */}
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="w-full h-full rounded-full shadow-[0_0_40px_rgba(99,102,241,0.25)] border-4 border-slate-300 dark:border-slate-700/80 bg-slate-900 cursor-pointer"
              />
            </div>

            {/* Info Badge */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t.eligibleCountLabel}:{' '}
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{eligibleMembers.length}</strong>
            </p>

            {/* Winner Celebration Box - STRICTLY HIDES NAME, ONLY SHOWS 3-DIGIT KURI NUMBER! */}
            {winner && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 dark:from-emerald-950/60 via-emerald-100/50 dark:via-emerald-900/40 to-teal-50 dark:to-teal-950/60 border border-emerald-300 dark:border-emerald-500/50 text-center"
              >
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{t.winnerAnnounceBadge}</span>
                </div>

                {/* Only Winning 3-digit number is revealed! */}
                <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mt-2 tracking-wider">
                  #{winner.kuriNumber}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  {lang === 'ml' ? 'വിജയിച്ച കുറി നമ്പർ' : 'Winning Kuri Number'}
                </div>

                <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mt-2">
                  {t.prizeLabel} <strong className="font-extrabold text-base">₹{totalAmount?.toLocaleString('en-IN')}</strong>
                </div>

                {/* Privacy Notice */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1.5">
                  {t.winningNumberOnlyNotice}
                </p>

                {/* Private Email Delivery Status */}
                {emailSent ? (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.winnerEmailSent}</span>
                  </div>
                ) : (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-left">
                    <div className="font-bold flex items-center gap-1.5 mb-0.5 text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>{t.winnerEmailFailedTitle}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80">
                      {emailError || t.winnerEmailFailedDesc}
                    </p>
                  </div>
                )}

                {/* Recorded Draw Video Box */}
                {recordedVideoUrl && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-white">
                          {t.recordedVideoTitle}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        REC • {currentMonth}
                      </span>
                    </div>

                    {/* HTML5 Video Player */}
                    <video
                      src={recordedVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full max-h-48 rounded-xl bg-black border border-slate-800 shadow-inner"
                    />

                    {videoNotice && (
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        ✅ {videoNotice}
                      </p>
                    )}

                    {/* Download & WhatsApp Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadVideo}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm"
                      >
                        <Download className="w-4 h-4 text-indigo-400" />
                        <span>{t.downloadVideoBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareVideoWhatsApp}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-[0.98]"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t.shareVideoWhatsAppBtn}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Text WhatsApp Sharing Buttons */}
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleShareToWinnerWhatsApp}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{t.shareWinnerWhatsApp}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareToGroupWhatsApp}
                    className="py-2 px-3 rounded-xl bg-teal-700/80 hover:bg-teal-600 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 border border-teal-500/30"
                    title={t.shareWinnerWhatsAppGroup}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.shareWinnerWhatsAppGroup}</span>
                  </button>
                </div>

                {/* Done Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  {t.doneBtn || 'Done'}
                </button>
              </motion.div>
            )}

            {/* Spin Action Button */}
            {!winner && (
              <div className="w-full mt-5 space-y-2">
                <button
                  onClick={startSpin}
                  disabled={spinning || !allPaidAndApproved}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2 ${
                    allPaidAndApproved
                      ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700/60 cursor-not-allowed opacity-80'
                  }`}
                >
                  {spinning ? (
                    <>
                      <RotateCw className="w-5 h-5 animate-spin" />
                      <span>{t.spinningState}</span>
                    </>
                  ) : !allPaidAndApproved ? (
                    <>
                      <Lock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <span className="text-sm">{t.spinDisabledReason}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>{t.spinButton}</span>
                    </>
                  )}
                </button>
                {!allPaidAndApproved && (
                  <p className="text-center text-[11px] text-amber-700 dark:text-amber-400">
                    {lang === 'ml'
                      ? '⚠️ എല്ലാ മെമ്പർമാരും അടവ് അടച്ച് അപ്രൂവ് ചെയ്ത ശേഷം മാത്രമേ നറുക്കെടുപ്പ് ബട്ടൺ പ്രവർത്തനക്ഷമമാകൂ.'
                      : '⚠️ Lucky Draw spin will be enabled once all member payments are approved.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
