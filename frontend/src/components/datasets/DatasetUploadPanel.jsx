import {
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(2)} MB`;
}

function DatasetUploadPanel({
  file,
  uploading,
  message,
  onFileSelect,
  onUpload,
}) {
  const handleInputChange = (event) => {
    onFileSelect(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    onFileSelect(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)]">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <UploadCloud size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Yeni Veri Seti Yükle
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              CSV verinizi güvenli doğrulama hattına gönderin.
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100 sm:flex">
          <ShieldCheck size={14} />
          Doğrulama aktif
        </div>
      </header>

      <div className="p-5 sm:p-6">
        {message.text && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              message.type === "error"
                ? "border-red-100 bg-red-50 text-red-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message.type === "error" ? (
              <XCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            )}

            {message.text}
          </div>
        )}

        <form
          onSubmit={onUpload}
          className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]"
        >
          <label
            htmlFor="file-upload"
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={handleDrop}
            className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 text-center transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            {file ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <FileSpreadsheet size={27} />
                </div>

                <p className="mt-4 max-w-full truncate font-semibold text-slate-900">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(file.size)}
                  {" · "}
                  CSV veri seti
                </p>

                <span className="mt-3 text-xs font-semibold text-blue-600">
                  Değiştirmek için tıklayın
                </span>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition group-hover:scale-105">
                  <UploadCloud size={27} />
                </div>

                <p className="mt-4 font-semibold text-slate-900">
                  CSV dosyanızı buraya bırakın
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  veya bilgisayarınızdan seçmek için tıklayın
                </p>

                <span className="mt-3 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm ring-1 ring-slate-200">
                  Maksimum 10 MB
                </span>
              </>
            )}

            <input
              type="file"
              name="file_upload"
              id="file-upload"
              className="hidden"
              accept=".csv,text/csv"
              onChange={handleInputChange}
            />
          </label>

          <button
            type="submit"
            disabled={uploading || !file}
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none lg:min-h-[180px] lg:w-48"
          >
            {uploading ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <UploadCloud size={19} />
                Yükle ve İşle
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default DatasetUploadPanel;
