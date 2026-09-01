import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  Activity,
  BarChart3,
  Brain,
  Gauge,
  History as HistoryIcon,
  MessageSquareText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import TextAnalyzer from "./components/TextAnalyzer";
import SentimentResult from "./components/SentimentResult";
import History from "./components/History";


type AnalysisResult = {
  sentiment: string;
  confidence: number;
  id?: number;
};


type Analysis = {
  id: number;
  text: string;
  sentiment: string;
  confidence: number;
  created_at: string;
};


type DashboardData = {
  total_analyses: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  average_confidence: number;
  recent_analyses: Analysis[];
  sentiment_over_time: {
    date: string;
    sentiment: string;
    count: number;
  }[];
};


const emptyDashboard: DashboardData = {
  total_analyses: 0,
  positive_count: 0,
  negative_count: 0,
  neutral_count: 0,
  average_confidence: 0,
  recent_analyses: [],
  sentiment_over_time: [],
};


function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [activePage, setActivePage] = useState("Dashboard");

  const [dashboard, setDashboard] =
    useState<DashboardData>(emptyDashboard);

  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  const [loadingDashboard, setLoadingDashboard] = useState(false);


  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setActivePage("Dashboard");
    setAnalysisResult(null);
    setAnalyses([]);
  };


  const loadData = async () => {
    if (!token) return;

    try {
      setLoadingDashboard(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [dashboardResponse, analysesResponse] =
        await Promise.all([
          fetch("http://127.0.0.1:8000/api/dashboard", {
            headers,
          }),

          fetch("http://127.0.0.1:8000/api/analyses", {
            headers,
          }),
        ]);


      if (
        dashboardResponse.status === 401 ||
        analysesResponse.status === 401
      ) {
        logout();
        return;
      }


      if (dashboardResponse.ok) {
        setDashboard(await dashboardResponse.json());
      }

      if (analysesResponse.ok) {
        setAnalyses(await analysesResponse.json());
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [token]);


  const handleLogin = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setActivePage("Dashboard");
  };


  const handleAnalysis = async (result: AnalysisResult) => {
    setAnalysisResult(result);
    await loadData();
  };


  /*
   * Build a daily timeline.
   * Each date tracks Positive, Neutral and Negative separately.
   */
  const timeline = useMemo(() => {
    const grouped = new Map<
      string,
      {
        date: string;
        label: string;
        positive: number;
        negative: number;
        neutral: number;
        total: number;
        confidenceTotal: number;
      }
    >();


    analyses.forEach((item) => {
      const date = new Date(item.created_at);

      if (Number.isNaN(date.getTime())) return;

      const key = date.toISOString().slice(0, 10);

      const current =
        grouped.get(key) ?? {
          date: key,
          label: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0,
          confidenceTotal: 0,
        };


      const sentiment = item.sentiment.toUpperCase();

      if (sentiment === "POSITIVE") {
        current.positive += 1;
      } else if (sentiment === "NEGATIVE") {
        current.negative += 1;
      } else if (sentiment === "NEUTRAL") {
        current.neutral += 1;
      }


      current.total += 1;

      current.confidenceTotal +=
        Number(item.confidence) || 0;

      grouped.set(key, current);
    });


    let cumulative = 0;

    return Array.from(grouped.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => {
        cumulative += item.total;

        return {
          ...item,
          avgConfidence: item.total
            ? item.confidenceTotal / item.total
            : 0,
          cumulativeTotal: cumulative,
        };
      });
  }, [analyses]);


  /*
   * Main sentiment statistics.
   */
  const stats = useMemo(() => {
    const positive = analyses.filter(
      (a) => a.sentiment.toUpperCase() === "POSITIVE"
    ).length;

    const negative = analyses.filter(
      (a) => a.sentiment.toUpperCase() === "NEGATIVE"
    ).length;

    const neutral = analyses.filter(
      (a) => a.sentiment.toUpperCase() === "NEUTRAL"
    ).length;


    const confidence = analyses.length
      ? analyses.reduce(
          (sum, a) => sum + Number(a.confidence || 0),
          0
        ) / analyses.length
      : 0;


    return {
      total: analyses.length,
      positive,
      negative,
      neutral,
      confidence,
    };
  }, [analyses]);


  const positiveRate = stats.total
    ? (stats.positive / stats.total) * 100
    : 0;

  const negativeRate = stats.total
    ? (stats.negative / stats.total) * 100
    : 0;

  const neutralRate = stats.total
    ? (stats.neutral / stats.total) * 100
    : 0;


  const distributionData = [
    {
      name: "Positive",
      value: stats.positive,
    },
    {
      name: "Neutral",
      value: stats.neutral,
    },
    {
      name: "Negative",
      value: stats.negative,
    },
  ].filter((item) => item.value > 0);


  if (!token) {
    return <Login onLogin={handleLogin} />;
  }


  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={logout}
      />


      <main className="min-h-screen lg:ml-64">

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl lg:px-8">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-400">
                SENTIMENT ANALYTICS
              </div>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                {activePage}
              </h1>

            </div>


            <div className="hidden items-center gap-3 sm:flex">

              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">

                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

                <span className="text-xs text-emerald-700">
                  AI Engine Online
                </span>

              </div>


              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">

                <User
                  size={17}
                  className="text-slate-600"
                />

              </div>

            </div>

          </div>

        </header>


        <div className="p-5 lg:p-8">

          {activePage === "Dashboard" && (
            <DashboardPage
              dashboard={dashboard}
              stats={stats}
              timeline={timeline}
              distributionData={distributionData}
              positiveRate={positiveRate}
              negativeRate={negativeRate}
              neutralRate={neutralRate}
              loading={loadingDashboard}
              onNavigate={setActivePage}
            />
          )}


          {activePage === "Analyze Text" && (
            <div className="mx-auto max-w-5xl space-y-7">

              <PageIntro
                icon={Brain}
                eyebrow="AI ANALYSIS"
                title="Analyze Text"
                description="Enter a review, message, feedback, or statement and let the AI determine its sentiment."
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">

                <TextAnalyzer onResult={handleAnalysis} />

              </div>


              {analysisResult && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8">

                  <SentimentResult result={analysisResult} />

                </div>
              )}

            </div>
          )}


          {activePage === "History" && (
            <div className="mx-auto max-w-[1400px]">

              <PageIntro
                icon={HistoryIcon}
                eyebrow="YOUR DATA"
                title="Analysis History"
                description="Search and review all of your previous sentiment analyses."
              />

              <div className="mt-8">
                <History />
              </div>

            </div>
          )}


          {activePage === "Analytics" && (
            <AnalyticsPage
              stats={stats}
              timeline={timeline}
              distributionData={distributionData}
            />
          )}


          {activePage === "Profile" && (
            <ProfilePage stats={stats} />
          )}

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function DashboardPage({
  dashboard,
  stats,
  timeline,
  distributionData,
  positiveRate,
  negativeRate,
  neutralRate,
  loading,
  onNavigate,
}: {
  dashboard: DashboardData;

  stats: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    confidence: number;
  };

  timeline: any[];

  distributionData: {
    name: string;
    value: number;
  }[];

  positiveRate: number;
  negativeRate: number;
  neutralRate: number;

  loading: boolean;

  onNavigate: (page: string) => void;
}) {

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">


      {/* HERO */}

      <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-6 py-11 text-center shadow-2xl shadow-slate-200/70 lg:px-10">

        <div className="absolute left-1/2 top-0 h-48 w-[32rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="absolute bottom-0 left-1/4 h-24 w-64 rounded-full bg-cyan-50 blur-3xl" />


        <div className="relative">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">

            <Sparkles size={13} />

            AI-powered sentiment intelligence

          </div>


          <h2 className="bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-600 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-[0_8px_20px_rgba(99,102,241,0.18)] sm:text-6xl lg:text-7xl">

            SentimentAI

          </h2>


          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">

            Understand what your users are saying through intelligent sentiment analysis and visual analytics.

          </p>

        </div>

      </section>


      {/* KPI CARDS */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <MetricCard
          title="Total Analyses"
          value={stats.total.toLocaleString()}
          subtitle="All analyzed content"
          icon={Activity}
          gradient="from-violet-600 to-indigo-500"
          sparkColor="#8b5cf6"
          data={timeline.map((x) => ({
            value: x.cumulativeTotal,
          }))}
        />


        <MetricCard
          title="Positive"
          value={stats.positive.toLocaleString()}
          subtitle={`${positiveRate.toFixed(1)}% of analyses`}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-500"
          sparkColor="#10b981"
          data={timeline.map((x) => ({
            value: x.positive,
          }))}
        />


        <MetricCard
          title="Negative"
          value={stats.negative.toLocaleString()}
          subtitle={`${negativeRate.toFixed(1)}% of analyses`}
          icon={TrendingDown}
          gradient="from-rose-500 to-red-500"
          sparkColor="#f43f5e"
          data={timeline.map((x) => ({
            value: x.negative,
          }))}
        />


        <MetricCard
          title="Neutral"
          value={stats.neutral.toLocaleString()}
          subtitle={`${neutralRate.toFixed(1)}% of analyses`}
          icon={MessageSquareText}
          gradient="from-amber-400 to-yellow-500"
          sparkColor="#f59e0b"
          data={timeline.map((x) => ({
            value: x.neutral,
          }))}
        />


        <MetricCard
          title="AI Confidence"
          value={`${stats.confidence.toFixed(1)}%`}
          subtitle="Average model confidence"
          icon={Gauge}
          gradient="from-fuchsia-500 to-violet-500"
          sparkColor="#6366f1"
          data={timeline.map((x) => ({
            value: x.avgConfidence,
          }))}
        />

      </section>


      {/* DISTRIBUTION + TREND */}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.65fr]">


        <ChartCard
          title="Sentiment Distribution"
          subtitle="A clear breakdown of your analyzed content"
        >

          {distributionData.length === 0 ? (
            <EmptyChart text="Analyze text to build your sentiment distribution." />
          ) : (

            <div className="flex min-h-[330px] flex-col items-center justify-center gap-8 lg:flex-row">

              <div className="relative h-[275px] w-[275px] shrink-0">

                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-100 via-white to-indigo-100 blur-xl" />


                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={78}
                      outerRadius={116}
                      paddingAngle={7}
                      cornerRadius={10}
                      stroke="#ffffff"
                      strokeWidth={4}
                    >

                      {distributionData.map((entry) => (

                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Positive"
                              ? "#10b981"
                              : entry.name === "Neutral"
                                ? "#f59e0b"
                                : "#f43f5e"
                          }
                        />

                      ))}

                    </Pie>


                    <Tooltip contentStyle={tooltipStyle} />

                  </PieChart>

                </ResponsiveContainer>


                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                  <span className="text-4xl font-black tracking-tight text-slate-950">
                    {stats.total.toLocaleString()}
                  </span>

                  <span className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Total analyses
                  </span>

                </div>

              </div>


              <div className="w-full max-w-xs space-y-5">

                {distributionData.map((item) => {

                  const percentage = stats.total
                    ? (item.value / stats.total) * 100
                    : 0;

                  const positive =
                    item.name === "Positive";

                  const neutral =
                    item.name === "Neutral";


                  return (

                    <div
                      key={item.name}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <span
                            className={`h-3 w-3 rounded-full ${
                              positive
                                ? "bg-emerald-500"
                                : neutral
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                            }`}
                          />

                          <span className="text-sm font-bold text-slate-800">
                            {item.name}
                          </span>

                        </div>


                        <span className="text-sm font-extrabold text-slate-950">
                          {percentage.toFixed(1)}%
                        </span>

                      </div>


                      <div className="mt-3 flex items-end justify-between">

                        <span className="text-2xl font-black text-slate-950">
                          {item.value.toLocaleString()}
                        </span>

                        <span className="text-xs font-semibold text-slate-400">
                          analyses
                        </span>

                      </div>


                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">

                        <div
                          className={`h-full rounded-full ${
                            positive
                              ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                              : neutral
                                ? "bg-gradient-to-r from-amber-300 to-yellow-500"
                                : "bg-gradient-to-r from-rose-400 to-orange-500"
                          }`}
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                  );
                })}


                <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">

                  <span className="text-xs font-bold text-indigo-700">
                    Overall sentiment
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-indigo-600 shadow-sm">

                    {positiveRate >= negativeRate &&
                    positiveRate >= neutralRate
                      ? "Positive"
                      : negativeRate >= neutralRate
                        ? "Negative"
                        : "Neutral"}

                  </span>

                </div>

              </div>

            </div>

          )}

        </ChartCard>


        <ChartCard
          title="Sentiment Trend Over Time"
          subtitle="Daily movement of positive, neutral, and negative sentiment"
        >

          {timeline.length === 0 ? (
            <EmptyChart text="Analyze more text to generate a timeline." />
          ) : (

            <div className="h-[340px]">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart
                  data={timeline}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -18,
                    bottom: 4,
                  }}
                >

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />


                  <Line
                    type="monotone"
                    dataKey="positive"
                    name="Positive"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />


                  <Line
                    type="monotone"
                    dataKey="negative"
                    name="Negative"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />


                  <Line
                    type="monotone"
                    dataKey="neutral"
                    name="Neutral"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </ChartCard>

      </section>


      {/* CONFIDENCE + VOLUME */}

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">


        <ChartCard
          title="AI Confidence Over Time"
          subtitle="Average model confidence by day"
        >

          {timeline.length === 0 ? (
            <EmptyChart text="Confidence history will appear here." />
          ) : (

            <div className="h-[320px]">

              <ResponsiveContainer width="100%" height="100%">

                <AreaChart
                  data={timeline}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -18,
                    bottom: 4,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="confidenceFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="#a78bfa"
                        stopOpacity={0.5}
                      />

                      <stop
                        offset="100%"
                        stopColor="#6366f1"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>


                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />


                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />


                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [
                      `${Number(v).toFixed(1)}%`,
                      "Confidence",
                    ]}
                  />


                  <Area
                    type="monotone"
                    dataKey="avgConfidence"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#confidenceFill)"
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

          )}

        </ChartCard>


        <ChartCard
          title="Analyses Over Time"
          subtitle="Daily analysis volume"
        >

          {timeline.length === 0 ? (
            <EmptyChart text="Analysis volume will appear here." />
          ) : (

            <div className="h-[320px]">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart
                  data={timeline}
                  margin={{
                    top: 10,
                    right: 5,
                    left: -18,
                    bottom: 4,
                  }}
                >

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Bar
                    dataKey="total"
                    name="Analyses"
                    fill="#7c3aed"
                    radius={[8, 8, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          )}

        </ChartCard>

      </section>


      {/* RECENT ANALYSES */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">

          <div>

            <h3 className="font-semibold text-slate-950">
              Recent Analyses
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Latest sentiment predictions from the AI engine
            </p>

          </div>


          <button
            type="button"
            onClick={() => onNavigate("History")}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-700"
          >
            View all →
          </button>

        </div>


        {loading ? (

          <div className="px-5 py-12 text-center text-sm text-slate-500">
            Loading analyses...
          </div>

        ) : dashboard.recent_analyses.length === 0 ? (

          <div className="px-5 py-12 text-center">

            <MessageSquareText
              className="mx-auto mb-3 text-slate-600"
              size={30}
            />

            <p className="text-sm text-slate-500">
              No analyses yet
            </p>

            <button
              type="button"
              onClick={() => onNavigate("Analyze Text")}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Analyze your first text
            </button>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {dashboard.recent_analyses
              .slice(0, 5)
              .map((item) => (

                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                >

                  <div className="min-w-0">

                    <p className="truncate text-sm text-slate-700">
                      {item.text}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(item.created_at).toLocaleString()}
                    </p>

                  </div>


                  <SentimentBadge
                    sentiment={item.sentiment}
                    confidence={item.confidence}
                  />

                </div>

              ))}

          </div>

        )}

      </section>

    </div>
  );
}


/* =========================================================
   ANALYTICS PAGE
========================================================= */

function AnalyticsPage({
  stats,
  timeline,
  distributionData,
}: {
  stats: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    confidence: number;
  };

  timeline: any[];

  distributionData: {
    name: string;
    value: number;
  }[];
}) {

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">

      <PageIntro
        icon={BarChart3}
        eyebrow="INSIGHTS"
        title="Analytics"
        description="Explore sentiment patterns, model confidence, and analysis volume over time."
      />


      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

        <InsightCard
          icon={TrendingUp}
          title="Positive Rate"
          value={`${
            stats.total
              ? ((stats.positive / stats.total) * 100).toFixed(1)
              : 0
          }%`}
          description="Share of analyzed content classified as positive."
        />


        <InsightCard
          icon={TrendingDown}
          title="Negative Rate"
          value={`${
            stats.total
              ? ((stats.negative / stats.total) * 100).toFixed(1)
              : 0
          }%`}
          description="Share of analyzed content classified as negative."
        />


        <InsightCard
          icon={MessageSquareText}
          title="Neutral Rate"
          value={`${
            stats.total
              ? ((stats.neutral / stats.total) * 100).toFixed(1)
              : 0
          }%`}
          description="Share of analyzed content classified as neutral."
        />


        <InsightCard
          icon={Gauge}
          title="Average Confidence"
          value={`${stats.confidence.toFixed(1)}%`}
          description="Average confidence across all saved analyses."
        />

      </div>


      <div className="grid gap-6 xl:grid-cols-2">


        <ChartCard
          title="Sentiment Movement"
          subtitle="Positive, neutral, and negative sentiment by day"
        >

          {timeline.length === 0 ? (
            <EmptyChart text="More analysis data is needed." />
          ) : (

            <div className="h-[380px]">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={timeline}>

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />


                  <Line
                    type="monotone"
                    dataKey="positive"
                    name="Positive"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />


                  <Line
                    type="monotone"
                    dataKey="negative"
                    name="Negative"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />


                  <Line
                    type="monotone"
                    dataKey="neutral"
                    name="Neutral"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </ChartCard>


        <ChartCard
          title="Analysis Volume"
          subtitle="Daily number of texts processed"
        >

          {timeline.length === 0 ? (
            <EmptyChart text="More analysis data is needed." />
          ) : (

            <div className="h-[380px]">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={timeline}>

                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#64748b",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={tooltipStyle} />

                  <Bar
                    dataKey="total"
                    name="Analyses"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          )}

        </ChartCard>

      </div>


      <ChartCard
        title="Sentiment Composition"
        subtitle="Current share of positive, neutral, and negative analyses"
      >

        {distributionData.length === 0 ? (
          <EmptyChart text="No sentiment data yet." />
        ) : (

          <div className="grid items-center gap-8 lg:grid-cols-2">

            <div className="h-[330px]">

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={115}
                    paddingAngle={5}
                    stroke="none"
                  >

                    {distributionData.map((entry) => (

                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === "Positive"
                            ? "#10b981"
                            : entry.name === "Neutral"
                              ? "#f59e0b"
                              : "#f43f5e"
                        }
                      />

                    ))}

                  </Pie>


                  <Tooltip contentStyle={tooltipStyle} />

                </PieChart>

              </ResponsiveContainer>

            </div>


            <div className="space-y-6">

              {distributionData.map((item) => {

                const percentage = stats.total
                  ? (item.value / stats.total) * 100
                  : 0;


                return (

                  <div key={item.name}>

                    <div className="mb-2 flex justify-between text-sm">

                      <span className="text-slate-700">
                        {item.name}
                      </span>

                      <span className="font-bold text-slate-950">
                        {percentage.toFixed(1)}%
                      </span>

                    </div>


                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className={`h-full rounded-full ${
                          item.name === "Positive"
                            ? "bg-emerald-500"
                            : item.name === "Neutral"
                              ? "bg-amber-400"
                              : "bg-rose-500"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                );
              })}

            </div>

          </div>

        )}

      </ChartCard>

    </div>
  );
}


/* =========================================================
   PROFILE
========================================================= */

function ProfilePage({
  stats,
}: {
  stats: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    confidence: number;
  };
}) {

  return (
    <div className="mx-auto max-w-4xl space-y-7">

      <PageIntro
        icon={User}
        eyebrow="ACCOUNT"
        title="Profile"
        description="View your SentimentAI account and usage overview."
      />


      <div className="rounded-2xl border border-slate-200 bg-white p-8">

        <div className="flex flex-col items-center text-center">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-xl shadow-indigo-500/20">
            AI
          </div>


          <h3 className="mt-5 text-xl font-semibold text-slate-950">
            SentimentAI User
          </h3>


          <p className="mt-1 text-sm text-slate-500">
            AI Sentiment Platform
          </p>


          <div className="mt-8 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <ProfileStat
              label="Total Analyses"
              value={String(stats.total)}
            />

            <ProfileStat
              label="Positive"
              value={String(stats.positive)}
            />

            <ProfileStat
              label="Neutral"
              value={String(stats.neutral)}
            />

            <ProfileStat
              label="Avg. Confidence"
              value={`${stats.confidence.toFixed(1)}%`}
            />

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   KPI METRIC CARD
========================================================= */

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  sparkColor,
  data,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  gradient: string;
  sparkColor: string;
  data: {
    value: number;
  }[];
}) {


  /*
   * Smooth the sparkline so Positive / Negative / Neutral
   * don't look like random ECG waves.
   *
   * We average each point with its neighbours.
   */
  const smoothData = useMemo(() => {

    if (data.length <= 2) {
      return data;
    }


    return data.map((item, index) => {

      const previous =
        data[index - 1]?.value ?? item.value;

      const next =
        data[index + 1]?.value ?? item.value;


      return {
        value:
          (previous + item.value + next) / 3,
      };

    });

  }, [data]);


  const gradientId =
    `metric-gradient-${title
      .toLowerCase()
      .replace(/\s+/g, "-")}`;


  return (

    <div
      className={`
        group relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${gradient}
        p-[1px]
        shadow-lg shadow-slate-200/70
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-xl
      `}
    >

      <div className="relative h-full min-h-[180px] overflow-hidden rounded-[15px] bg-white px-5 py-5">

        {/* subtle background glow */}

        <div
          className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl"
          style={{
            backgroundColor: sparkColor,
            opacity: 0.06,
          }}
        />


        {/* subtle sparkline */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58px] opacity-35">

          {smoothData.length > 1 && (

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <AreaChart
                data={smoothData}
                margin={{
                  top: 10,
                  right: 0,
                  left: 0,
                  bottom: 0,
                }}
              >

                <defs>

                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor={sparkColor}
                      stopOpacity={0.25}
                    />

                    <stop
                      offset="100%"
                      stopColor={sparkColor}
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>


                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={false}
                />

              </AreaChart>

            </ResponsiveContainer>

          )}

        </div>


        {/* card content */}

        <div className="relative z-10">

          <div className="mb-5 flex items-center justify-between">

            <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">
              {title}
            </span>


            <div
              className="rounded-xl border p-2.5 shadow-sm"
              style={{
                borderColor: `${sparkColor}25`,
                backgroundColor: `${sparkColor}0d`,
              }}
            >

              <Icon
                size={18}
                className="text-slate-700"
              />

            </div>

          </div>


          <div className="text-[2.35rem] font-black leading-none tracking-tight text-slate-950">
            {value}
          </div>


          <div className="mt-3 text-[13px] font-medium text-slate-500">
            {subtitle}
          </div>

        </div>

      </div>

    </div>

  );
}


/* =========================================================
   CHART CARD
========================================================= */

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {

  return (

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">

      <div className="border-b border-slate-100 px-5 py-5">

        <h3 className="font-bold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>

      </div>


      <div className="p-5">
        {children}
      </div>

    </div>

  );
}


/* =========================================================
   PAGE INTRO
========================================================= */

function PageIntro({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  eyebrow: string;
  title: string;
  description: string;
}) {

  return (

    <div>

      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">

        <Icon size={18} />

        {eyebrow}

      </div>


      <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
        {title}
      </h2>


      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>

    </div>

  );
}


/* =========================================================
   SENTIMENT BADGE
========================================================= */

function SentimentBadge({
  sentiment,
  confidence,
}: {
  sentiment: string;
  confidence: number;
}) {

  const normalized = sentiment.toUpperCase();


  const classes =
    normalized === "POSITIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "NEUTRAL"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";


  return (

    <div
      className={`shrink-0 rounded-xl border px-3 py-2 text-right ${classes}`}
    >

      <div className="text-[11px] font-bold">
        {normalized}
      </div>

      <div className="mt-0.5 text-[10px] opacity-70">
        {Number(confidence).toFixed(1)}%
      </div>

    </div>

  );
}


/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  title: string;
  value: string;
  description: string;
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">

      <div className="mb-5 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-500">

        <Icon size={19} />

      </div>


      <p className="text-sm font-medium text-slate-600">
        {title}
      </p>


      <p className="mt-2 text-3xl font-black text-slate-950">
        {value}
      </p>


      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>

  );
}


/* =========================================================
   PROFILE STAT
========================================================= */

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>


      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
        {value}
      </p>

    </div>

  );
}


/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart({
  text,
}: {
  text: string;
}) {

  return (

    <div className="flex h-[300px] items-center justify-center text-center">

      <div>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

          <BarChart3
            size={20}
            className="text-slate-500"
          />

        </div>


        <p className="text-sm text-slate-500">
          {text}
        </p>

      </div>

    </div>

  );
}


/* =========================================================
   TOOLTIP
========================================================= */

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  color: "#0f172a",
};


export default App;