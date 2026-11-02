import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translations } from '../translations';
import { API_BASE_URL } from '../config';

export default function PaymentModal({
  groupId,
  groupName,
  monthlyInstallment,
  currentMonth,
  lang = 'en',
  onClose,
  onPaymentSubmitted,
}) {
  const t = translations[lang] || translations.en;
  const [month, setMonth] = useState(currentMonth || 1);
  const [amount, setAmount] = useState(monthlyInstallment || 0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem('kuri_token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/payment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          month: Number(month),
          amount: Number(amount),
          paymentMethod,
          transactionRef: '',
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit payment');

      setSuccess(true);
      if (onPaymentSubmitted) onPaymentSubmitted(data.payment);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-modal rounded-3xl p-6 text-slate-800 dark:text-white shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-600/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.paymentModalTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.paymentSubmittedSuccess}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
              {t.paymentPendingNotice}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.paymentMonthLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.paymentAmountLabel}
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {t.paymentMethodLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                    paymentMethod === 'UPI'
                      ? 'bg-teal-50 dark:bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t.methodUPI}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                    paymentMethod === 'Cash'
                      ? 'bg-teal-50 dark:bg-teal-500/20 border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>{t.methodCash}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t.optionalNoteLabel}
              </label>
              <input
                type="text"
                placeholder={t.optionalNotePlaceholder}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition disabled:opacity-50"
              >
                {loading ? t.submittingPayment : t.submitPayment}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
