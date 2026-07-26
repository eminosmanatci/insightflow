import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "./api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData);

      localStorage.setItem("token", response.data.access_token);
      navigate("/");
    } catch {
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 text-3xl font-extrabold tracking-tight text-blue-700">
            Insight
            <span className="text-slate-800">Flow</span>
          </div>

          <p className="text-sm text-slate-500">
            Enterprise Analytics Platform&apos;a Hoş Geldiniz
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email Adresi
            </label>

            <input
              type="email"
              required
              className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="yonetici@sirket.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Şifre
            </label>

            <input
              type="password"
              required
              className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-slate-900 py-2.5 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Giriş Yapılıyor..." : "Sisteme Giriş Yap"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Hesabınız yok mu?{" "}
          <Link
            to="/register"
            className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
          >
            Hesap Oluşturun
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
