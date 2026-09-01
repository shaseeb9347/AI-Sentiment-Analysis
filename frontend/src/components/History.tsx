import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

type Analysis = {
  id: number;
  text: string;
  sentiment: string;
  confidence: number;
  created_at: string;
};

function History() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/analyses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load analysis history.");
        }

        const data = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((analysis) => {
      const matchesSearch = analysis.text
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" || analysis.sentiment === filter;

      return matchesSearch && matchesFilter;
    });
  }, [analyses, search, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight">
          Analysis History
        </h2>

        <p className="mt-2 text-slate-600">
          Review every sentiment analysis you've performed.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search analyzed text..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm outline-none focus:border-indigo-500 lg:w-48"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Loading your analysis history...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-50 p-6 text-sm text-rose-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {filteredAnalyses.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {analyses.length}
              </span>{" "}
              analyses
            </p>
          </div>

          {filteredAnalyses.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Text
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Sentiment
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Confidence
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredAnalyses.map((analysis) => (
                      <tr
                        key={analysis.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="max-w-md px-6 py-5">
                          <p
                            className="truncate text-sm text-slate-800"
                            title={analysis.text}
                          >
                            {analysis.text}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              analysis.sentiment === "POSITIVE"
                                ? "bg-emerald-50 text-emerald-600"
                                : analysis.sentiment === "NEUTRAL"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {analysis.sentiment}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-slate-700">
                            {analysis.confidence.toFixed(2)}%
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {new Date(
                            analysis.created_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search size={24} />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No analyses found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or sentiment filter.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;
