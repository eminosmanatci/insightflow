function AiInsightPanel({ insight, loading }) {
  return (
    <div className="relative flex h-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />

      <h3 className="mb-4 font-semibold text-slate-800">✨ AI İçgörüleri</h3>

      <div className="custom-scrollbar flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-100 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
        {loading ? (
          <div className="flex animate-pulse flex-col gap-3">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
          </div>
        ) : (
          insight
        )}
      </div>
    </div>
  );
}

export default AiInsightPanel;
