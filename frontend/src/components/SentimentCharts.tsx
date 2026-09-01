import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type SentimentPoint = {
  date: string;
  sentiment: string;
  count: number;
};

type SentimentChartsProps = {
  data: SentimentPoint[];
  positiveCount: number;
  negativeCount: number;
};

function SentimentCharts({
  data,
  positiveCount,
  negativeCount,
}: SentimentChartsProps) {
  const dates = [...new Set(data.map((item) => item.date))];

  const trendData = dates.map((date) => {
    const positive =
      data.find(
        (item) =>
          item.date === date &&
          item.sentiment === "POSITIVE"
      )?.count ?? 0;

    const negative =
      data.find(
        (item) =>
          item.date === date &&
          item.sentiment === "NEGATIVE"
      )?.count ?? 0;

    return {
      date,
      positive,
      negative,
    };
  });

  const distributionData = [
    {
      name: "Positive",
      value: positiveCount,
    },
    {
      name: "Negative",
      value: negativeCount,
    },
  ].filter((item) => item.value > 0);

  const hasTrendData = trendData.length > 0;
  const hasDistributionData = distributionData.length > 0;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6 xl:col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">
            Sentiment Trend
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Analysis activity over time
          </p>
        </div>

        <div className="h-[300px]">
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                />

                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  stroke="#64748B"
                  tick={{ fill: "#94A3B8", fontSize: 12 }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="positive"
                  name="Positive"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="negative"
                  name="Negative"
                  stroke="#F43F5E"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No trend data available yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#101827] p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">
            Sentiment Distribution
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Overall sentiment breakdown
          </p>
        </div>

        <div className="h-[300px]">
          {hasDistributionData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F43F5E" />
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B1220",
                    border: "1px solid #1E293B",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No sentiment data available yet.
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Positive</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-400">Negative</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SentimentCharts;
