import { BrainCircuit, CircleAlert, Sparkles } from "lucide-react";

function renderInlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");

    if (!isBold) {
      return part;
    }

    return (
      <strong key={`${part}-${index}`} className="font-semibold text-slate-900">
        {part.slice(2, -2)}
      </strong>
    );
  });
}

function InsightContent({ insight }) {
  const lines = String(insight || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
        Bu dönem için AI içgörüsü bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {lines.map((line, index) => {
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        const bulletMatch = line.match(/^[•*-]\s+(.*)$/);
        const headingMatch = line.match(/^\*\*(.+)\*\*:?$/);

        if (numberedMatch) {
          return (
            <div
              key={`${line}-${index}`}
              className="flex gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600 ring-1 ring-indigo-100">
                {numberedMatch[1]}
              </span>

              <p className="text-sm leading-6 text-slate-600">
                {renderInlineMarkdown(numberedMatch[2])}
              </p>
            </div>
          );
        }

        if (bulletMatch) {
          return (
            <div
              key={`${line}-${index}`}
              className="flex items-start gap-3 px-1"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

              <p className="text-sm leading-6 text-slate-600">
                {renderInlineMarkdown(bulletMatch[1])}
              </p>
            </div>
          );
        }

        if (headingMatch) {
          return (
            <h4
              key={`${line}-${index}`}
              className="pt-1 text-sm font-bold text-slate-900"
            >
              {headingMatch[1]}
            </h4>
          );
        }

        return (
          <p
            key={`${line}-${index}`}
            className="text-sm leading-6 text-slate-600"
          >
            {renderInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-100 bg-white p-4"
        >
          <div className="flex animate-pulse gap-3">
            <div className="h-7 w-7 rounded-lg bg-indigo-100" />

            <div className="flex-1 space-y-2.5">
              <div className="h-3 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AiInsightPanel({ insight, loading }) {
  return (
    <section className="relative flex h-[420px] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 via-white to-white shadow-[0_12px_35px_rgba(79,70,229,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-400" />

      <header className="flex items-start justify-between gap-4 border-b border-indigo-100/70 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <BrainCircuit size={21} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-950">
                Executive Intelligence
              </h3>

              <Sparkles size={15} className="text-violet-500" />
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Veriye dayalı yönetici özeti
            </p>
          </div>
        </div>

        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600 shadow-sm ring-1 ring-indigo-100">
          AI Analizi
        </span>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? <LoadingState /> : <InsightContent insight={insight} />}
      </div>

      <footer className="flex items-center gap-2 border-t border-indigo-100/70 bg-white/80 px-5 py-3 text-[11px] text-slate-400">
        <CircleAlert size={13} />
        AI önerilerini iş kararlarından önce doğrulayın.
      </footer>
    </section>
  );
}

export default AiInsightPanel;
