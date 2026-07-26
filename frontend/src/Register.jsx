import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "./api";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      navigate("/login", {
        state: {
          message: "Kayıt başarılı! Şimdi giriş yapabilirsiniz.",
        },
      });
    } catch {
      setError(
        "Kayıt işlemi başarısız oldu. Bu e-posta adresi zaten kullanımda olabilir.",
      );
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
            Yeni bir yönetici hesabı oluşturun
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-100 bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ad Soyad
            </label>

            <input
              type="text"
              name="fullName"
              required
              className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Ahmet Yılmaz"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email Adresi
            </label>

            <input
              type="email"
              name="email"
              required
              className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="yonetici@sirket.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Şifre
            </label>

            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full rounded-md border border-slate-300 px-4 py-2 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-md bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Zaten bir hesabınız var mı?{" "}
          <Link
            to="/login"
            className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
          >
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
