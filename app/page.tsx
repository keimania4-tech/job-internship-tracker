"use client";

import React, { useEffect, useRef, useState } from "react";

type JobStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

type Job = {
  id: string;
  company: string;
  role: string;
  location: string;
  status: JobStatus;
  notes: string;
  dateApplied: string;
};

type JobFormData = {
  company: string;
  role: string;
  location: string;
  status: JobStatus;
  notes: string;
  dateApplied: string;
};

type TimeStats = {
  isFuture: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * LOGIC: calculateTimeStats
 * Handles both the "Countdown" (Future) and "Stopwatch" (Past) logic.
 */
const calculateTimeStats = (dateApplied: string): TimeStats => {
  const start = new Date(dateApplied);
  const now = new Date();
  const difference = +now - +start;
  const isFuture = difference < 0;
  const absDiff = Math.abs(difference);

  return {
    isFuture,
    days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((absDiff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((absDiff / 1000 / 60) % 60),
    seconds: Math.floor((absDiff / 1000) % 60),
  };
};

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem("myJobApplications");
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? (parsed as Job[]) : [];
    } catch {
      return [];
    }
  });

  const getNowString = (): string => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<JobFormData>({
    company: "",
    role: "",
    location: "",
    status: "Applied",
    notes: "",
    dateApplied: getNowString(),
  });

  const [, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("myJobApplications", JSON.stringify(jobs));
  }, [jobs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const selectedDate = new Date(formData.dateApplied);

    const newJob: Job = {
      ...formData,
      id: crypto.randomUUID(),
      dateApplied: selectedDate.toISOString(),
    };

    setJobs((prev) => [newJob, ...prev]);
    setFormData((prev) => ({
      ...prev,
      company: "",
      role: "",
      notes: "",
      dateApplied: getNowString(),
    }));
  };

  const updateStatus = (id: string, newStatus: JobStatus): void => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: newStatus } : job
      )
    );
  };

  const deleteJob = (id: string): void => {
    if (window.confirm("Remove this entry?")) {
      setJobs((prev) => prev.filter((job) => job.id !== id));
    }
  };

  const exportData = (): void => {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job_tracker_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== "string") {
          throw new Error("Invalid file contents.");
        }

        const parsed: unknown = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          setJobs(parsed as Job[]);
          alert("Import successful!");
        } else {
          alert("Invalid file.");
        }
      } catch {
        alert("Invalid file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "750px",
        margin: "0 auto",
        fontFamily: "sans-serif",
        color: "#333",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>Precision Job Tracker</h1>
        <p>Tracking time since {new Date().getFullYear()}</p>
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <input
            name="company"
            placeholder="Company"
            style={styles.input}
            value={formData.company}
            onChange={handleChange}
            required
          />
          <input
            name="role"
            placeholder="Role"
            style={styles.input}
            value={formData.role}
            onChange={handleChange}
            required
          />
        </div>

        <div style={styles.row}>
          <input
            name="location"
            placeholder="Location"
            style={styles.input}
            value={formData.location}
            onChange={handleChange}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <label style={{ fontSize: "0.7em", color: "#777" }}>
              Date & Time:
            </label>
            <input
              type="datetime-local"
              name="dateApplied"
              style={styles.input}
              value={formData.dateApplied}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" style={styles.submitBtn}>
          Log Application
        </button>
      </form>

      <div>
        {jobs.map((job) => {
          const t = calculateTimeStats(job.dateApplied);
          return (
            <div key={job.id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{job.role}</h3>
                  <p style={{ margin: "4px 0", color: "#666" }}>
                    {job.company}
                  </p>
                </div>

                <select
                  value={job.status}
                  onChange={(e) =>
                    updateStatus(job.id, e.target.value as JobStatus)
                  }
                >
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div
                style={{
                  ...styles.timer,
                  backgroundColor: t.isFuture ? "#f0fff4" : "#f4f4f9",
                  border: t.isFuture
                    ? "1px solid #c6f6d5"
                    : "1px solid #ddd",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75em",
                    color: "#888",
                    fontWeight: "bold",
                  }}
                >
                  {t.isFuture
                    ? "COUNTDOWN TO START:"
                    : "ACTIVE TIME SINCE APPLIED:"}
                </span>
                <div
                  style={{
                    fontSize: "1.3em",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                >
                  {t.isFuture
                    ? `${t.days} Days Remaining`
                    : `${t.days}d ${t.hours}h ${t.minutes}m ${t.seconds}s`}
                </div>
              </div>

              <button
                onClick={() => deleteJob(job.id)}
                style={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      <footer style={styles.footer}>
        <button onClick={exportData} style={styles.backupBtn}>
          Export Backup
        </button>
        <input
          type="file"
          accept=".json"
          onChange={importData}
          ref={fileInputRef}
        />
      </footer>
    </div>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    border: "1px solid #eee",
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    flex: 1,
  },
  submitBtn: {
    padding: "12px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  card: {
    border: "1px solid #eee",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
    background: "#fff",
  },
  timer: {
    marginTop: "12px",
    padding: "10px",
    borderRadius: "8px",
    textAlign: "center" as const,
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#ff4d4d",
    cursor: "pointer",
    fontSize: "0.8em",
    marginTop: "10px",
    padding: 0,
    textDecoration: "underline",
  },
  footer: {
    marginTop: "40px",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
    display: "flex",
    gap: "20px",
  },
  backupBtn: {
    padding: "8px",
    cursor: "pointer",
  },
};

export default App;
