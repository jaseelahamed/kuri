import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  Banknote,
  Calendar,
  User,
  ShieldCheck,
  Receipt,
  MessageCircle,
  FileText,
  Hash,
  Phone,
  Mail,
} from 'lucide-react';
import { translations } from '../translations';

export default function PaymentDetailsModal({
  payment,
  groupName,
  isAdmin = false,
  lang = 'en',
  onClose,
  onTriggerAction,
}) {
  const t = translations[lang] || translations.en;

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

  const handleShareWhatsApp = () => {
    const statusText =
      payment.status === 'APPROVED'
        ? '✅ അംഗീകരിച്ചു (APPROVED)'
        : payment.status === 'PENDING'
        ? '⏳ പരിഗണനയിലാണ് (PENDING)'
        : '❌ നിരസിച്ചു (REJECTED)';

    const text =
      `🧾 *പെയ്മെന്റ് രസീത് & നിലവിവരം* 📋\n\n` +
      `👤 *മെമ്പർ:* ${payment.memberId?.name || '-'}\n` +
      `🔢 *കുറി നമ്പർ:* #${payment.memberId?.kuriNumber || '-'}\n` +
      `🏢 *ഗ്രൂപ്പ്:* ${groupName || '-'}\n` +
      `📅 *മാസം:* #${payment.month}\n` +
      `💰 *തുക:* ₹${payment.amount?.toLocaleString('en-IN')}\n` +
      `💳 *രീതി:* ${payment.paymentMethod} ${payment.transactionRef ? `(Ref: ${payment.transactionRef})` : ''}\n` +
      `📌 *സ്റ്റാറ്റസ്:* ${statusText}\n` +
      `⏱️ *റിക്വസ്റ്റ് തീയതി:* ${formatDate(payment.paidAt)}\n` +
      (payment.approvedAt ? `🗓️ *നടപടി തീയതി:* ${formatDate(payment.approvedAt)}\n` : '') +
      (payment.approvedBy?.name ? `👑 *അഡ്മിൻ:* ${payment.approvedBy.name}\n` : '') +
      (payment.remarks ? `📝 *കുറിപ്പ്:* ${payment.remarks}\n` : '') +
      `\n📲 *കുറി പോർട്ടൽ:* ${window.location.origin}`;

    const cleanPhone = (payment.memberId?.phone || '').replace(/[^0-9]/g, '');
    const url =
      cleanPhone.length >= 10
        ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 text-slate-800 dark:text-white shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.paymentDetailsTitle || 'Payment Receipt & Audit'}
              </h2>
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

        {/* Status Hero Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {payment.status === 'APPROVED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.statusApproved}</span>
              </span>
            )}
            {payment.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-500/30">
                <Clock className="w-3.5 h-3.5" />
                <span>{t.statusPending}</span>
              </span>
            )}
            {payment.status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-500/30">
                <XCircle className="w-3.5 h-3.5" />
                <span>{t.statusRejected}</span>
              </span>
            )}

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {t.monthNum} #{payment.month}
            </span>
          </div>

          <div className="text-3xl font-black text-slate-900 dark:text-white">
            ₹{payment.amount?.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                payment.paymentMethod === 'UPI'
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
              }`}
            >
              {payment.paymentMethod === 'UPI' ? <QrCode className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
              <span>{payment.paymentMethod}</span>
            </span>
            {payment.transactionRef && (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={payment.transactionRef}>
                Ref: {payment.transactionRef}
              </span>
            )}
          </div>
        </div>

        {/* Member Details */}
        <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span>{t.colMemberAndNo}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">{t.memberNameLabel?.replace('*', '')}:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {payment.memberId?.name || '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{t.colKuriNo}:</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                #{payment.memberId?.kuriNumber || '---'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{t.colPhone}:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {payment.memberId?.phone || '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">{t.colEmail}:</span>
              <span className="text-slate-700 dark:text-slate-300 truncate block">
                {payment.memberId?.email || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit & Timeline Box */}
        <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'ml' ? 'സമയരേഖയും പരിശോധനാ വിവരങ്ങളും' : 'Audit Timeline & Verification'}</span>
          </div>

          <div className="space-y-2.5">
            {/* Step 1: Request Submitted */}
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {t.timelineRequested || 'Request Submitted'}
                </span>
                <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatDate(payment.paidAt)}
                </span>
              </div>
            </div>

            {/* Step 2: Admin Decision */}
            {payment.approvedAt ? (
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    payment.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {t.timelineDecision || 'Admin Decision'}:{' '}
                    <strong
                      className={
                        payment.status === 'APPROVED'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {payment.status === 'APPROVED' ? t.statusApproved : t.statusRejected}
                    </strong>
                  </span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(payment.approvedAt)}
                  </span>
                  {payment.approvedBy?.name && (
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                      {t.timelineVerifiedBy || 'Handled by Admin:'}{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {payment.approvedBy.name}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 opacity-75">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                    {lang === 'ml' ? 'അഡ്മിൻ പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു' : 'Awaiting Admin Verification'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {lang === 'ml' ? 'അഡ്മിൻ പരിശോധിച്ച് അപ്രൂവ് ചെയ്യുമ്പോൾ ഇവിടെ കാണിക്കും' : 'Will update once reviewed'}
                  </span>
                </div>
              </div>
            )}

            {/* Remarks / Notes */}
            {payment.remarks && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  {t.timelineNotes || 'Notes / Remarks:'}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium mt-0.5 block">
                  {payment.remarks}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Share Receipt */}
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99]"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t.paymentReceiptShare || 'Share Receipt on WhatsApp'}</span>
        </button>

        {/* Admin Pending Action Controls */}
        {isAdmin && payment.status === 'PENDING' && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onTriggerAction) onTriggerAction(payment, 'approve');
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.actionApprove}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onTriggerAction) onTriggerAction(payment, 'reject');
              }}
              className="flex-1 py-2.5 rounded-xl bg-rose-100 dark:bg-rose-600/25 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-600/35 border border-rose-300 dark:border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{t.actionReject}</span>
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
