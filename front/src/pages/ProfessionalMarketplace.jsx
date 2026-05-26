import React, { useState, useEffect } from "react";
import axios from "../lib/axios";
import ProfessionalCard from "../components/ProfessionalCard";

const ProfessionalMarketplace = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        // use /v1 instead of /api/v1 since axios instance appends /api automatically
        const response = await axios.get("/v1/professionals");
        setProfessionals(response.data.data.professionals);
      } catch (error) {
        console.error("Error fetching professionals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div
      className="animate-fade-in p-8"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
      }}
    >
      <h1 className="text-3xl font-bold mb-2">
        Professional Support Marketplace
      </h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Connect with verified professionals for emotional support and guidance.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {professionals.map((pro) => (
          <ProfessionalCard key={pro._id} professional={pro} />
        ))}
      </div>
    </div>
  );
};

export default ProfessionalMarketplace;
