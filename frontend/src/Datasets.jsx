import { useCallback, useEffect, useState } from "react";

import api from "./api";
import AppShell from "./components/layout/AppShell";

function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchDatasets = useCallback(async () => {
    try {
      const response = await api.get("/datasets/");

      setDatasets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Veri setleri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchDatasets();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchDatasets]);

  useEffect(() => {
    const isProcessing = datasets.some(
      (dataset) => dataset.status === "processing",
    );

    if (!isProcessing) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      fetchDatasets();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [datasets, fetchDatasets]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setMessage({
        type: "error",
        text: "Lütfen bir CSV dosyası seçin.",
      });

      return;
    }

    setUploading(true);
    setMessage({
      type: "",
      text: "",
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/datasets/upload", formData);

      setMessage({
        type: "success",
        text: "Dosya başarıyla yüklendi ve işleniyor.",
      });

      setFile(null);
      fetchDatasets();
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Dosya yüklenirken bir hata oluştu.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setUploading(false);

      const fileInput = document.getElementById("file-upload");

      if (fileInput) {
        fileInput.value = "";
      }
    }
  };

  const handleDelete = async (datasetId) => {
    const confirmed = window.confirm(
      "Bu veri setini ve içindeki tüm verileri silmek istediğinize emin misiniz? Dashboard güncellenecektir.",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/datasets/${datasetId}`);

      setDatasets((currentDatasets) =>
        currentDatasets.filter((dataset) => dataset.id !== datasetId),
      );

      setMessage({
        type: "success",
        text: "Veri seti başarıyla silindi.",
      });
    } catch (error) {
      console.error("Veri seti silinemedi:", error);

      setMessage({
        type: "error",
        text: "Veri seti silinirken hata oluştu. Yetkiniz olmayabilir.",
      });
    }
  };

  return (
    <AppShell
      title="Veri Yönetimi"
      description="Veri setlerinizi yükleyin, doğrulayın ve işleme durumlarını takip edin."
    >
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Dosya yükleme alanı */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Yeni Veri Seti Yükle
          </h2>

          {message.text && (
            <div
              className={`mb-4 rounded border p-3 text-center text-sm ${
                message.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpload} className="flex items-start gap-4">
            <div className="flex-1">
              <label
                htmlFor="file-upload"
                className="flex h-32 w-full cursor-pointer appearance-none justify-center rounded-md border-2 border-dashed border-slate-300 bg-white px-4 transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none"
              >
                <span className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>

                  <span className="font-medium text-slate-600">
                    {file ? file.name : "CSV dosyasını seçin veya sürükleyin"}
                  </span>
                </span>

                <input
                  type="file"
                  name="file_upload"
                  id="file-upload"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="h-32 rounded-md bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {uploading ? "Yükleniyor..." : "Yükle ve İşle"}
            </button>
          </form>
        </div>

        {/* Yüklenen veri setleri tablosu */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-800">
              Geçmiş Yüklemeler
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Dosya Adı
                  </th>

                  <th scope="col" className="px-6 py-3">
                    Durum
                  </th>

                  <th scope="col" className="px-6 py-3">
                    İşlem Raporu
                  </th>

                  <th scope="col" className="px-6 py-3">
                    Yüklenme Tarihi
                  </th>

                  <th scope="col" className="px-6 py-3 text-right">
                    İşlem
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : datasets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-slate-500"
                    >
                      Henüz veri seti yüklenmedi.
                    </td>
                  </tr>
                ) : (
                  datasets.map((dataset) => (
                    <tr
                      key={dataset.id}
                      className="border-b border-slate-100 bg-white hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {dataset.name}
                        </div>

                        {dataset.error_message && (
                          <div className="mt-2 max-w-md rounded-md border border-red-200 bg-red-50 p-2 text-xs leading-relaxed text-red-700">
                            {dataset.error_message}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            dataset.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : dataset.status === "processing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {dataset.status === "completed"
                            ? "Tamamlandı"
                            : dataset.status === "processing"
                              ? "İşleniyor"
                              : "Hatalı"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {dataset.status === "processing" ? (
                          <span className="text-xs text-blue-600">
                            Doğrulanıyor...
                          </span>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-14 text-slate-500">
                                Toplam
                              </span>

                              <span className="font-medium text-slate-800">
                                {dataset.total_rows}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-14 text-slate-500">
                                Geçerli
                              </span>

                              <span className="font-medium text-green-700">
                                {dataset.valid_rows}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-14 text-slate-500">
                                Hatalı
                              </span>

                              <span
                                className={
                                  dataset.invalid_rows > 0
                                    ? "font-medium text-red-700"
                                    : "font-medium text-slate-700"
                                }
                              >
                                {dataset.invalid_rows}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {new Date(dataset.created_at).toLocaleString("tr-TR")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(dataset.id)}
                          className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          title="Sil"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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
    </AppShell>
  );
}

export default Datasets;
