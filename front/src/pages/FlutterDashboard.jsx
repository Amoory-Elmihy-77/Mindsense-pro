import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, BarChart2 } from "lucide-react";
import api from "../lib/axios";

const FlutterDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/emotion/flutter-dashboard");
        setData(res.data.data);
      } catch (err) {
        setError("Failed to load flutter dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading Flutter Dashboard Data...
      </div>
    );
  if (error)
    return (
      <div style={{ color: "red", textAlign: "center", marginTop: "2rem" }}>
        {error}
      </div>
    );

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: "#131521", // Dark blue background similar to the image
        minHeight: "100vh",
        color: "#fff",
        padding: "2rem 1.5rem",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* App Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: "2rem",
        }}
      >
        <button
          className="btn btn-ghost"
          style={{ position: "absolute", left: 0, padding: 0 }}
        >
          <ChevronLeft size={24} color="#fff" />
        </button>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>
          Dashboard
        </h1>
      </div>

      {/* Legend & Filter */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
              color: "#94a3b8",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#6ee7b7",
              }}
            ></div>{" "}
            Face
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
              color: "#94a3b8",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#0f766e",
              }}
            ></div>{" "}
            Image
          </div>
        </div>
        <select
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: "8px",
            padding: "0.3rem 0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <option>This week</option>
        </select>
      </div>

      {/* Chart */}
      <div style={{ height: "300px", width: "100%", minWidth: 0, minHeight: 300, marginBottom: "2rem" }}>
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
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
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

      {/* Weekly Mood Overview Card */}
      <div
        style={{
          backgroundColor: "#1e293b",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(15, 118, 110, 0.2)",
              padding: "0.5rem",
              borderRadius: "8px",
            }}
          >
            <BarChart2 size={24} color="#2dd4bf" />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
            {data.overviewTitle}
          </h3>
        </div>
        <p
          style={{
            margin: 0,
            color: "#e2e8f0",
            lineHeight: "1.5",
            fontSize: "0.95rem",
          }}
        >
          {data.overviewText}
        </p>
      </div>
    </div>
  );
};

export default FlutterDashboard;
