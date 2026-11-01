import React, { useState } from 'react';
import { X, PlusCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { translations } from '../translations';
import { API_BASE_URL } from '../config';

export default function CreateGroupModal({ lang = 'en', onClose, onGroupCreated }) {
  const t = translations[lang] || translations.en;
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [dueDayOfMonth, setDueDayOfMonth] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('kuri_token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/kuri`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          totalAmount: Number(totalAmount),
          monthlyInstallment: Number(monthlyInstallment),
          totalMonths: Number(totalMonths),
          dueDayOfMonth: Number(dueDayOfMonth),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create Kuri group');

      if (onGroupCreated) onGroupCreated(data);
      onClose();
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
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-600/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.createGroupTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.createGroupSubtitle}</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {t.groupNameLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.groupNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t.totalAmountLabel}
              </label>
              <input
                type="number"
                required
                placeholder="100000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t.installmentLabel}
              </label>
              <input
                type="number"
                required
                placeholder="5000"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t.totalMonthsLabel}
              </label>
              <input
                type="number"
                required
                placeholder="20"
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t.dueDayLabel}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 text-xs text-purple-700 dark:text-purple-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span>{t.adminPerkNotice}</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition disabled:opacity-50"
            >
              {loading ? t.creatingGroup : t.submitCreateGroup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
