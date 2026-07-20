import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında mevcut veri setlerini getir
  const fetchDatasets = async () => {
    try {
      const response = await api.get('/datasets/');
      setDatasets(response.data);
    } catch (error) {
      console.error("Veri setleri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. İlk Yükleme (Component Mount)
  useEffect(() => {
    fetchDatasets();
  }, []);

  // 2. OTOMATİK YENİLEME (POLLING) MEKANİZMASI
  useEffect(() => {
    // Listede durumu 'processing' olan bir dosya var mı kontrol et
    const isProcessing = datasets.some(ds => ds.status === 'processing');
    
    let intervalId;
    if (isProcessing) {
      // Eğer işlenen veri varsa her 3 saniyede bir listeyi güncelle
      intervalId = setInterval(() => {
        fetchDatasets();
      }, 3000); 
    }

    // Temizlik: İşlem bittiğinde veya sayfadan çıkıldığında sayacı durdur
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [datasets]);

  // Dosya seçildiğinde state'e kaydet
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // CSV Yükleme İşlemi
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Lütfen bir CSV dosyası seçin.' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/datasets/upload', formData);
      setMessage({ type: 'success', text: 'Dosya başarıyla yüklendi ve işleniyor.' });
      setFile(null);
      // Listeyi anında güncelle (Yeni yüklenen dosya "İşleniyor" olarak tabloya eklenecek ve polling başlayacak)
      fetchDatasets();
    } catch (error) {
      setMessage({ type: 'error', text: 'Dosya yüklenirken bir hata oluştu.' });
    } finally {
      setUploading(false);
      // Dosya inputunu temizle
      document.getElementById('file-upload').value = '';
    }
  };

  // SİLME FONKSİYONU
  const handleDelete = async (datasetId) => {
    if (!window.confirm("Bu veri setini ve içindeki tüm verileri silmek istediğinize emin misiniz? Dashboard güncellenecektir.")) {
      return;
    }

    try {
      await api.delete(`/datasets/${datasetId}`);
      // Silme başarılı olunca listeyi güncelle
      setDatasets(datasets.filter(ds => ds.id !== datasetId));
      setMessage({ type: 'success', text: 'Veri seti başarıyla silindi.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Veri seti silinirken hata oluştu. Yetkiniz olmayabilir.' });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sol Menü (Sidebar) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="text-xl font-extrabold tracking-tight text-blue-700">
            Insight<span className="text-slate-800">Flow</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md font-medium transition-colors">
            Dashboard
          </Link>
          <Link to="/datasets" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-md font-medium transition-colors">
            Veri Setleri
          </Link>
        </nav>
      </aside>

      {/* Ana İçerik Alanı */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-slate-800">Veri Yönetimi</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Yönetici Paneli</span>
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              E
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Dosya Yükleme Alanı */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 mb-4">Yeni Veri Seti Yükle</h2>
              
              {message.text && (
                <div className={`mb-4 p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpload} className="flex items-start gap-4">
                <div className="flex-1">
                  <label 
                    htmlFor="file-upload" 
                    className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-500 hover:bg-blue-50 focus:outline-none"
                  >
                    <span className="flex items-center space-x-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="font-medium text-slate-600">
                        {file ? file.name : "CSV dosyasını seçin veya sürükleyin"}
                      </span>
                    </span>
                    <input type="file" name="file_upload" id="file-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
                  </label>
                </div>
                <button 
                  type="submit" 
                  disabled={uploading || !file}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed h-32"
                >
                  {uploading ? 'Yükleniyor...' : 'Yükle ve İşle'}
                </button>
              </form>
            </div>

            {/* Yüklenen Veri Setleri Tablosu */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-base font-semibold text-slate-800">Geçmiş Yüklemeler</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-6 py-3">Dosya Adı</th>
                      <th scope="col" className="px-6 py-3">Durum</th>
                      <th scope="col" className="px-6 py-3">Satır Sayısı</th>
                      <th scope="col" className="px-6 py-3">Yüklenme Tarihi</th>
                      <th scope="col" className="px-6 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center">Yükleniyor...</td>
                      </tr>
                    ) : datasets.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-slate-500">Henüz veri seti yüklenmedi.</td>
                      </tr>
                    ) : (
                      datasets.map((ds) => (
                        <tr key={ds.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{ds.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ds.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              ds.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {ds.status === 'completed' ? 'Tamamlandı' : ds.status === 'processing' ? 'İşleniyor' : 'Hatalı'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{ds.row_count}</td>
                          <td className="px-6 py-4">{new Date(ds.created_at).toLocaleString('tr-TR')}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDelete(ds.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                              title="Sil"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default Datasets;