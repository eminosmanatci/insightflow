import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from './api';

function App() {
  const [kpis, setKpis] = useState({
  total_revenue: 0,
  transaction_count: 0,
  average_transaction_value: 0
});
  const [regionData, setRegionData] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // 1. KPI ve Grafik Verilerini Çekme
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [kpiRes, regionRes] = await Promise.all([
          api.get('/analytics/kpis'),
          api.get('/analytics/regions')
        ]);
        
        setKpis(kpiRes.data);
        setRegionData(regionRes.data);
        setError(null);
      } catch (err) {
        console.error("Veri çekme hatası:", err);
        setError("Veriler yüklenemedi. Oturum açtığınızdan emin olun.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 2. AI İçgörülerini Çekme (Grafiklerin yüklenmesini bekletmemek için ayrı bir useEffect)
  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        const res = await api.get('/ai/analyze');
        setAiInsight(res.data.ai_insight);
      } catch (err) {
        console.error("AI Hatası:", err);
        setAiInsight("Şu anda yapay zeka analiz motoruna ulaşılamıyor.");
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiInsights();
  }, []);

  // 3. Çıkış Yapma Fonksiyonu
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-sm py-2 px-3 rounded-md shadow-lg border border-slate-700">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-300">
            {`₺${payload[0].value.toLocaleString('tr-TR')}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="text-xl font-extrabold tracking-tight text-blue-700">
            Insight<span className="text-slate-800">Flow</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-md font-medium transition-colors">
            Dashboard
          </Link>
          <Link to="/datasets" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-medium transition-colors">
            Veri Setleri
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-slate-800">Genel Bakış</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 hidden md:block">Yönetici Paneli</span>
            <button 
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              title="Çıkış Yap"
            >
              Çıkış
            </button>
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer">
              E
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500">Toplam Gelir</h3>
              <p className="text-3xl font-bold text-slate-800 mt-3">
                {loading ? "..." : `₺${kpis.total_revenue.toLocaleString('tr-TR')}`}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500">Toplam İşlem</h3>
              <p className="text-3xl font-bold text-slate-800 mt-3">
                {loading ? "..." : kpis.transaction_count}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-medium text-slate-500">Ort. İşlem Tutarı</h3>
              <p className="text-3xl font-bold text-slate-800 mt-3">
                {loading ? "..." : `₺${kpis.average_transaction_value.toLocaleString('tr-TR')}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-[420px] flex flex-col">
              <h3 className="text-base font-semibold text-slate-800 mb-6">Bölgesel Satış Dağılımı</h3>
              <div className="flex-1 w-full h-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">Yükleniyor...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `₺${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="total_revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-[420px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                ✨ Llama-3.1 İçgörüleri
              </h3>
              
              {/* Llama'dan dönen metni markdown formatı bozulmadan gösteriyoruz (whitespace-pre-wrap) */}
              <div className="flex-1 text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-md border border-slate-100 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                {aiLoading ? (
                  <div className="flex flex-col gap-3 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                ) : (
                  aiInsight
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;