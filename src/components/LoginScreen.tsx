import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Trophy, KeyRound, LogIn, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithCode } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error: err } = loginWithCode(code);
    if (err) setError(err);
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] items-center justify-center mb-4 shadow-lg shadow-[#10B981]/20">
            <Trophy className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold">Rufisque Navétane <span className="text-[#10B981]">Pro</span></h1>
          <p className="text-gray-500 text-sm mt-1">Espace Admin — Code secret requis</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Code Secret Administrateur</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                className="input pl-10"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="Entrez le code secret"
                autoFocus
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Accéder à l'administration
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Accès réservé aux administrateurs du championnat
        </p>
      </div>
    </div>
  );
}
