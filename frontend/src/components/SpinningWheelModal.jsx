import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { X, Trophy, Sparkles, AlertCircle, Mail, RotateCw } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const controls = useAnimation();
  const wheelRef = useRef(null);
  const token = localStorage.getItem('kuri_token');

  // Fetch eligible members (only hasWon === false)
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEligible();
  }, [groupId, token]);

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

  const startSpin = async () => {
    if (spinning || eligibleMembers.length === 0) return;
    setError('');
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

      // 2. Compute exact rotation angle
      const sliceAngle = 360 / eligibleMembers.length;
      const sliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
      const targetDeg = (270 - sliceCenter + 360) % 360;
      const fullRotations = 6 * 360;
      const finalRotation = fullRotations + targetDeg;

      // 3. Animate the Wheel using Framer Motion
      await controls.start({
        rotate: finalRotation,
        transition: {
          duration: 6,
          ease: [0.12, 0.8, 0.2, 1.0],
        },
      });

      // 4. Spin complete: announce winner & celebrate
      setWinner(backendWinner);
      setEmailSent(data.emailSent);
      fireConfetti();
      if (onDrawComplete) onDrawComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSpinning(false);
    }
  };

  const numSlices = eligibleMembers.length;
  const sliceAngle = numSlices > 0 ? 360 / numSlices : 0;
  const radius = 170;

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
            {/* Spinning Wheel Container */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-3">
              {/* Top Pointer Arrow */}
              <div className="absolute -top-3 z-30 flex flex-col items-center drop-shadow-[0_4px_10px_rgba(244,63,94,0.7)]">
                <div
                  className="w-5 h-7 bg-gradient-to-b from-rose-500 to-rose-600 shadow-lg border border-white/40"
                  style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}
                />
              </div>

              {/* Animated SVG Wheel */}
              <motion.div
                ref={wheelRef}
                animate={controls}
                className="w-full h-full relative rounded-full shadow-[0_0_40px_rgba(99,102,241,0.25)] border-4 border-slate-300 dark:border-slate-700/80"
              >
                <svg viewBox="0 0 400 400" className="w-full h-full transform">
                  {eligibleMembers.map((member, index) => {
                    const startAngle = index * sliceAngle;
                    const endAngle = (index + 1) * sliceAngle;

                    const x1 = 200 + radius * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 200 + radius * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 200 + radius * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 200 + radius * Math.sin((Math.PI * endAngle) / 180);

                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const pathData = `M 200 200 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    // Text position
                    const textAngle = startAngle + sliceAngle / 2;
                    const textRadius = radius * 0.65;
                    const tx = 200 + textRadius * Math.cos((Math.PI * textAngle) / 180);
                    const ty = 200 + textRadius * Math.sin((Math.PI * textAngle) / 180);

                    return (
                      <g key={member.kuriNumber}>
                        <path
                          d={pathData}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#1e293b"
                          strokeWidth="2"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize={numSlices > 12 ? '13' : '16'}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                        >
                          #{member.kuriNumber}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Center Hub */}
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-900 border-4 border-amber-400 flex items-center justify-center shadow-xl">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </motion.div>
            </div>

            {/* Info Badge */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {t.eligibleCountLabel}:{' '}
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{eligibleMembers.length}</strong>
            </p>

            {/* Winner Celebration Box */}
            {winner && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 dark:from-emerald-950/60 via-emerald-100/50 dark:via-emerald-900/40 to-teal-50 dark:to-teal-950/60 border border-emerald-300 dark:border-emerald-500/50 text-center"
              >
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {t.winnerAnnounceBadge}
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  #{winner.kuriNumber} - {winner.name}
                </div>
                <div className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                  {t.prizeLabel} <strong className="font-bold">₹{totalAmount?.toLocaleString('en-IN')}</strong>
                </div>

                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-500/30">
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {emailSent
                      ? `${t.winnerEmailSent} (${winner.email})`
                      : `#${winner.kuriNumber} ${winner.name}`}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Spin Action Button */}
            {!winner && (
              <button
                onClick={startSpin}
                disabled={spinning}
                className="mt-5 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-bold text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {spinning ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    <span>{t.spinningState}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>{t.spinButton}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
