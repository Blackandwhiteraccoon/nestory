import React, { useState } from "react";
import { supabase } from "../src/lib/supabase";

interface AuthViewProps {
  onAuthSuccess: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onAuthSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">
          🦝 Nestory
          <p className="text-gray-400 mb-8">Ton inventaire intelligent</p>
        </h2>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <label className="block mb-4">
          <span className="text-slate-200 text-sm">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-700 border-transparent focus:border-blue-500 focus:bg-slate-600 focus:ring-0 text-white"
          />
        </label>
        <label className="block mb-6">
          <span className="text-slate-200 text-sm">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-700 border-transparent focus:border-blue-500 focus:bg-slate-600 focus:ring-0 text-white"
          />
        </label>
        <button
          disabled={loading}
          onClick={handleSignIn}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Se connecter"}
        </button>
        <p className="mt-4 text-xs text-slate-400 text-center">
          Pas encore de compte ? Inscrivez-vous via Supabase directement.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
