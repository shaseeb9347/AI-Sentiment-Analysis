import { Brain, CheckCircle2, Clock3, ShieldCheck, Sparkles, Minus, TrendingDown, TrendingUp } from "lucide-react";

type SentimentResultProps = {
  result: { sentiment: string; confidence: number };
};

export default function SentimentResult({ result }: SentimentResultProps) {
  const sentiment = result.sentiment.toUpperCase();
  const positive = sentiment === "POSITIVE";
  const neutral = sentiment === "NEUTRAL";
  const confidence = Math.max(0, Math.min(100, Number(result.confidence)));
  const sentimentLabel = neutral ? "Neutral Sentiment" : positive ? "Positive Sentiment" : "Negative Sentiment";
  const tone = positive
    ? { border: "border-emerald-100", bg: "bg-emerald-50/50", icon: "bg-emerald-100 text-emerald-600", text: "text-emerald-600", gradient: "bg-gradient-to-r from-emerald-400 to-teal-500", header: "border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50" }
    : neutral
      ? { border: "border-amber-100", bg: "bg-amber-50/60", icon: "bg-amber-100 text-amber-600", text: "text-amber-600", gradient: "bg-gradient-to-r from-amber-300 to-yellow-500", header: "border-amber-100 bg-gradient-to-r from-amber-50 via-white to-yellow-50" }
      : { border: "border-rose-100", bg: "bg-rose-50/50", icon: "bg-rose-100 text-rose-600", text: "text-rose-600", gradient: "bg-gradient-to-r from-rose-400 to-orange-500", header: "border-rose-100 bg-gradient-to-r from-rose-50 via-white to-orange-50" };
  const SentimentIcon = neutral ? Minus : positive ? TrendingUp : TrendingDown;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
      <div className={`border-b px-6 py-5 lg:px-8 ${tone.header}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone.text.replace("text-", "bg-")} text-white shadow-lg`}>
              <Brain size={21} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"><Sparkles size={13} /> Live AI prediction</div>
              <h3 className="mt-1 text-xl font-extrabold text-slate-950">Analysis complete</h3>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-600 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Saved to history
          </div>
        </div>
      </div>

      <div className="grid gap-7 p-6 lg:grid-cols-[1fr_0.9fr] lg:p-8">
        <div className={`rounded-2xl border p-6 ${tone.border} ${tone.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone.icon}`}><SentimentIcon size={28} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Detected sentiment</p>
              <p className={`mt-1 text-3xl font-black ${tone.text}`}>{sentimentLabel}</p>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Model confidence</span>
              <span className="text-2xl font-black text-slate-950">{confidence.toFixed(2)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
              <div className={`h-full rounded-full transition-all duration-1000 ${tone.gradient}`} style={{ width: `${confidence}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">This is the model's probability for the predicted class, not a guarantee that the prediction is correct.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><ShieldCheck size={21} /></div>
            <div><h4 className="font-extrabold text-slate-950">AI verification</h4><p className="text-xs text-slate-500">Prediction metadata</p></div>
          </div>
          <div className="mt-6 space-y-4">
            <Meta icon={CheckCircle2} label="Prediction status" value="Completed" />
            <Meta icon={Brain} label="AI engine" value="RoBERTa · 3-class" />
            <Meta icon={Clock3} label="Processing" value="Real-time" />
            <Meta icon={ShieldCheck} label="Confidence" value={confidence >= 90 ? "Very High" : confidence >= 75 ? "High" : "Moderate"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-0 last:pb-0"><div className="flex items-center gap-2 text-sm text-slate-600"><Icon size={15} className="text-indigo-500" />{label}</div><span className="text-sm font-bold text-slate-900">{value}</span></div>;
}
