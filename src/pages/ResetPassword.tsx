import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle2 } from "lucide-react";

export function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRequestReset() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://arsp-portal.vercel.app/reset-password",
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  async function handleUpdatePassword() {
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  }

  const isResetMode = window.location.hash.includes("type=recovery");

  return (
    <div className="min-h-screen bg-[#0a2540] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <img src="/arsp_logo_enhanced_final.png" alt="ARSP" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
          <h2 className="text-xl font-bold text-[#0a2540]">
            {isResetMode ? "Nouveau mot de passe" : "Reinitialiser le mot de passe"}
          </h2>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-[#0a2540] mb-2">
              {isResetMode ? "Mot de passe mis a jour!" : "Email envoye!"}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isResetMode ? "Vous allez etre redirige vers la page de connexion." : "Verifiez votre boite mail et cliquez sur le lien de reinitialisation."}
            </p>
            {!isResetMode && (
              <button onClick={() => navigate("/")} className="text-[#007FFF] hover:underline text-sm">
                Retour a la connexion
              </button>
            )}
          </div>
        ) : isResetMode ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nouveau mot de passe</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                placeholder="Min 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmer le mot de passe</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleUpdatePassword}
              disabled={loading || !password || !confirmPassword}
              className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] disabled:opacity-50"
            >
              {loading ? "Mise a jour..." : "Mettre a jour le mot de passe"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Votre adresse email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                placeholder="email@entreprise.cd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleRequestReset}
              disabled={loading || !email}
              className="w-full py-2.5 bg-[#007FFF] text-white rounded-lg font-semibold hover:bg-[#0066CC] disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer le lien de reinitialisation"}
            </button>
            <button onClick={() => navigate("/")} className="w-full text-center text-sm text-gray-500 hover:underline">
              Retour a la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
