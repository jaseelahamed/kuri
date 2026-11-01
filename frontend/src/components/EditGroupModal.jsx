import React, { useState } from 'react';
import { X, Edit3, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { translations } from '../translations';
import { API_BASE_URL } from '../config';

export default function EditGroupModal({ group, lang = 'en', onClose, onGroupUpdated }) {
  const t = translations[lang] || translations.en;
  const [name, setName] = useState(group.name || '');
  const [totalAmount, setTotalAmount] = useState(group.totalAmount || '');
  const [monthlyInstallment, setMonthlyInstallment] = useState(group.monthlyInstallment || '');
  const [totalMonths, setTotalMonths] = useState(group.totalMonths || '');
  const [dueDayOfMonth, setDueDayOfMonth] = useState(group.dueDayOfMonth || 10);
  const [status, setStatus] = useState(group.status || 'ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('kuri_token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/kuri/${group._id}`, {
        method: 'PUT',
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
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update Kuri details');

      if (onGroupUpdated) onGroupUpdated(data.group);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass-modal rounded-3xl p-6 text-slate-800 dark:text-white shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.editGroupTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{group.name}</p>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
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
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {t.installmentLabel}
              </label>
              <input
                type="number"
                required
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
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
                value={totalMonths}
                onChange={(e) => setTotalMonths(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {t.statusLabel}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
            >
              <option value="ACTIVE">{t.statusActive}</option>
              <option value="COMPLETED">{t.statusCompleted}</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? t.savingChanges : t.saveChanges}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
