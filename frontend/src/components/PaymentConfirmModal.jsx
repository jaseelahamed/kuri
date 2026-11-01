import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, QrCode, Banknote, Calendar, User, Clock, Loader2 } from 'lucide-react';
import { translations } from '../translations';

export default function PaymentConfirmModal({
  payment,
  action = 'approve',
  groupName,
  lang = 'en',
  onClose,
  onConfirm,
}) {
  const t = translations[lang] || translations.en;
  const isApprove = action === 'approve';

  const [remarks, setRemarks] = useState(
    isApprove ? '' : (lang === 'ml' ? 'പണം അക്കൗണ്ടിൽ എത്തിയിട്ടില്ല' : 'Payment not received in account')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!payment) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString(lang === 'ml' ? 'en-IN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!isApprove && !remarks.trim()) {
      setError(lang === 'ml' ? 'ദയവായി നിരസിക്കാനുള്ള കാരണം നൽകുക' : 'Please provide a rejection reason');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onConfirm(payment._id, action, remarks.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg glass-modal rounded-3xl p-6 text-slate-800 dark:text-white shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isApprove
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
              }`}
            >
              {isApprove ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isApprove ? t.confirmApproveTitle : t.confirmRejectTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {groupName} • {t.colMonth} #{payment.month}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notice description */}
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
          {isApprove ? t.confirmApproveDesc : t.confirmRejectDesc}
        </p>

        {/* Payment Summary Box */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                #{payment.memberId?.kuriNumber || '---'}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {payment.memberId?.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {payment.memberId?.phone || payment.memberId?.email}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ₹{payment.amount?.toLocaleString('en-IN')}
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  payment.paymentMethod === 'UPI'
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                }`}
              >
                {payment.paymentMethod === 'UPI' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                <span>{payment.paymentMethod}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">{t.colRequestedAt}:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-indigo-400" />
                {formatDate(payment.paidAt)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{t.colRefNotes}:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 block truncate mt-0.5" title={payment.transactionRef || payment.remarks}>
                {payment.transactionRef || payment.remarks || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks Form */}
        <form onSubmit={handleAction} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isApprove ? t.remarksOptionalLabel : t.remarksRequiredLabel}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isApprove ? t.remarksPlaceholderApprove : t.remarksPlaceholderReject}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                isApprove
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isApprove ? t.btnConfirmApprove : t.btnConfirmReject}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
