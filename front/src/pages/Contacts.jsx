import React, { useState } from "react";
import api from "../lib/axios";
import { Users, UserPlus, HeartPulse } from "lucide-react";

const Contacts = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/v1/users/add-contact", {
        contactName: name,
        contactEmail: email,
      });
      setStatus("Success: Trusted contact request sent!");
      setName("");
      setEmail("");
    } catch (err) {
      setStatus(
        "Error: " + (err.response?.data?.message || "Failed to send request"),
      );
    }
  };

  const handleNotifyContact = async () => {
    try {
      await api.post("/v1/users/notify-contact");
      setStatus("Success: Trusted contacts have been notified!");
    } catch (err) {
      setStatus(
        "Error: " +
          (err.response?.data?.message || "Failed to notify contacts"),
      );
    }
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: "flex" }}>
      <div>
        <h1 className="text-2xl" style={{ fontWeight: "700" }}>
          Trusted Contacts
        </h1>
        <p className="text-muted mt-2">
          Manage people you trust to be automatically notified in times of
          emotional need.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <UserPlus color="var(--accent-primary)" /> Add New Contact
        </h2>
        {status && (
          <p
            style={{
              color: status.includes("Success")
                ? "var(--success)"
                : "var(--error)",
              marginBottom: "1rem",
            }}
          >
            {status}
          </p>
        )}

        <form
          onSubmit={handleAddContact}
          className="flex gap-4"
          style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}
        >
          <div className="input-group" style={{ flex: 1, minWidth: "200px" }}>
            <Users className="input-icon" size={20} />
            <input
              type="text"
              className="input-field with-icon"
              placeholder="Contact's Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: "200px" }}>
            <HeartPulse className="input-icon" size={20} />
            <input
              type="email"
              className="input-field with-icon"
              placeholder="Contact's Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contacts;
