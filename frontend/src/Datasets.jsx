import { useCallback, useEffect, useState } from "react";

import api from "./api";
import AppShell from "./components/layout/AppShell";
import DatasetHistory from "./components/datasets/DatasetHistory";
import DatasetUploadPanel from "./components/datasets/DatasetUploadPanel";

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

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
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
      <div className="mx-auto max-w-6xl space-y-6">
        <DatasetUploadPanel
          file={file}
          uploading={uploading}
          message={message}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
        />

        <DatasetHistory
          datasets={datasets}
          loading={loading}
          onDelete={handleDelete}
        />
      </div>
    </AppShell>
  );
}

export default Datasets;
