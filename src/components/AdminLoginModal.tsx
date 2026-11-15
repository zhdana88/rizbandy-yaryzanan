import React, {useState} from 'react';
import {Mail, X} from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  isBusy: boolean;
  message: string;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  isBusy,
  message,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(email.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-login-title" className="text-xl font-black text-slate-900">Admin sign in</h2>
            <p className="mt-1 text-sm text-slate-600">We’ll email you a one-time secure sign-in link.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label htmlFor="admin-email" className="mb-1.5 block text-sm font-bold text-slate-700">Email address</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="you@example.com"
        />

        {message && <p className="mt-3 text-sm text-slate-700" role="status">{message}</p>}

        <button
          type="submit"
          disabled={isBusy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {isBusy ? 'Sending…' : 'Send magic link'}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Only the account pre-authorized by the site owner has edit access. Never share your sign-in link.
        </p>
      </form>
    </div>
  );
};
