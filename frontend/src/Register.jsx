import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './api';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Backend'deki kayıt endpoint'ine verileri gönderiyoruz.
      // (Backend'de /auth/register veya /users/ endpoint'inin olduğunu varsayıyoruz)
      await api.post('/auth/register', {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      
      // Kayıt başarılıysa Login ekranına yönlendir
      navigate('/login', { state: { message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' } });
    } catch (err) {
      setError('Kayıt işlemi başarısız oldu. Bu e-posta adresi zaten kullanımda olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold tracking-tight text-blue-700 mb-2">
            Insight<span className="text-slate-800">Flow</span>
          </div>
          <p className="text-slate-500 text-sm">Yeni bir yönetici hesabı oluşturun</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-100 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input 
              type="text" 
              name="fullName"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Örn: Ahmet Yılmaz"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Adresi</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="yonetici@sirket.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
            <input 
              type="password" 
              name="password"
              required
              minLength="6"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center mt-2"
          >
            {loading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Zaten bir hesabınız var mı?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
            Giriş Yapın
          </Link>
        </div>
        
      </div>
    </div>
  );
}

export default Register;