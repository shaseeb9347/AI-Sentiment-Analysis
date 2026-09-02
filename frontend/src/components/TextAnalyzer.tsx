import { useState } from "react";
import { Brain, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

type TextAnalyzerProps = {
  onResult: (result: {
    sentiment: string;
    confidence: number;
  }) => void;
};

export default function TextAnalyzer({ onResult }: TextAnalyzerProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setError("Please enter some text to analyze.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");

    const controller = new AbortController();

    // Prevent the UI from loading forever if the backend gets stuck.
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      const response = await fetch(
        "http://localhost:8000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: trimmedText,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") || "";

      let data: any;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const responseText = await response.text();
        throw new Error(
          responseText || "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to analyze the text."
        );
      }

      if (!data?.sentiment) {
        throw new Error("The AI model did not return a sentiment.");
      }

      const confidence = Number(data.confidence);

      if (!Number.isFinite(confidence)) {
        throw new Error("The AI model returned an invalid confidence score.");
      }

      onResult({
        sentiment: String(data.sentiment).toUpperCase(),
        confidence,
      });

      // Keep the text so the user can see what was analyzed.
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "The analysis took too long. Please make sure the backend is running and try again."
        );
      } else if (err instanceof TypeError) {
        setError(
          "Unable to connect to the AI server. Make sure FastAPI is running on port 8000."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while analyzing the text."
        );
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-6 py-6 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Brain size={23} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              <Sparkles size={14} />
              AI text intelligence
            </div>

            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              Analyze your text
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Get an instant sentiment prediction powered by your AI model.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <label className="mb-3 block text-sm font-bold text-slate-800">
          Text to analyze
        </label>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);

              if (error) {
                setError("");
              }
            }}
            placeholder="Example: I absolutely love this product. The quality is amazing and delivery was fast!"
            rows={9}
            disabled={loading}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-[15px] leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70"
          />

          <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-400 shadow-sm">
            {text.length} characters
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
            {error}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <CheckCircle2
              size={15}
              className="text-emerald-500"
            />
            Result is saved automatically to your history
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <Sparkles size={18} />
            )}

            {loading
              ? "Analyzing in real time..."
              : "Analyze Sentiment"}
          </button>
        </div>
      </div>
    </div>
  );
}