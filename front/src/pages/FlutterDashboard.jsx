import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, ChevronLeft } from "lucide-react";
import api from "../lib/axios";
import "../styles/flutterDashboard.css";

const FlutterDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/emotion/flutter-dashboard");
        setData(res.data.data);
      } catch {
        setError("Failed to load flutter dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flutter-state">Loading Flutter dashboard data...</div>;
  }

  if (error) {
    return <div className="flutter-state flutter-state-error">{error}</div>;
  }

  return (
    <section className="flutter-dashboard-shell animate-fade-in">
      <div className="flutter-phone-frame">
        <header className="flutter-mobile-header">
          <button className="flutter-icon-button" aria-label="Back">
            <ChevronLeft size={24} />
          </button>
          <h1>Dashboard</h1>
        </header>

        <div className="flutter-filter-row">
          <div className="flutter-legend">
            <span>
              <i className="legend-dot legend-face" />
              Face
            </span>
            <span>
              <i className="legend-dot legend-voice" />
              Voice
            </span>
          </div>

          <select className="flutter-select" defaultValue="week">
            <option value="week">This week</option>
          </select>
        </div>

        <div className="flutter-chart-card">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data.chartData} barSize={16}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dx={-10}
                domain={[0, "dataMax + 2"]}
              />
              <Tooltip
                cursor={{ fill: "rgba(45, 212, 191, 0.08)" }}
                contentStyle={{
                  backgroundColor: "#1c2434",
                  border: "1px solid rgba(148, 163, 184, 0.16)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="faceScore"
                stackId="a"
                fill="#6ee7b7"
                radius={[0, 0, 8, 8]}
              />
              <Bar
                dataKey="voiceScore"
                stackId="a"
                fill="#0f766e"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <article className="flutter-overview-card">
          <div className="flutter-overview-heading">
            <span className="flutter-overview-icon">
              <BarChart2 size={24} />
            </span>
            <h2>{data.overviewTitle}</h2>
          </div>
          <p>{data.overviewText}</p>
        </article>
      </div>
    </section>
  );
};

export default FlutterDashboard;
