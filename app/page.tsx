"use client";

import React, { useState, useEffect, useRef } from 'react';

/**
 * LOGIC: calculateTimeStats
 * Handles both the "Countdown" (Future) and "Stopwatch" (Past) logic.
 */
const calculateTimeStats = (dateApplied: string) => {
  const start = new Date(dateApplied);
  const now = new Date();
  const difference = +now - +start;
  const isFuture = difference < 0;
  const absDiff = Math.abs(difference);

  const stats = {
    isFuture,
    days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((absDiff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((absDiff / 1000 / 60) % 60),
    seconds: Math.floor((absDiff / 1000) % 60),
  };

  return stats;
};

function App() {
  const fileInputRef = useRef(null);

  const [jobs, setJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('myJobApplications');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  });

  // Defaulting to "Now" in the correct format for datetime-local input
  const getNowString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    company: '', role: '', location: '', status: 'Applied', notes: '',
    dateApplied: getNowString()
  });

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('myJobApplications', JSON.stringify(jobs));
  }, [jobs]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // With datetime-local, we can parse directly as local time
    const selectedDate = new Date(formData.dateApplied);

    const newJob = {
      ...formData,
      id: crypto.randomUUID(),
      dateApplied: selectedDate.toISOString()
    };
    
    setJobs([newJob, ...jobs]);
    setFormData({ ...formData, company: '', role: '', notes: '', dateApplied: getNowString() });
  };

  const updateStatus = (id, newStatus) => {
    setJobs(jobs.map(job => job.id === id ? { ...job, status: newStatus } : job));
  };

  const deleteJob = (id) => {
    if (window.confirm("Remove this entry?")) {
      setJobs(jobs.filter(job => job.id !== id));
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job_tracker_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed)) {
          setJobs(parsed);
          alert("Import successful!");
        }
      } catch (err) {
        alert("Invalid file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '750px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>💼 Precision Job Tracker</h1>
        <p>Tracking time since {new Date().getFullYear()}</p>
      </header>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <input name="company" placeholder="Company" style={styles.input} value={formData.company} onChange={handleChange} required />
          <input name="role" placeholder="Role" style={styles.input} value={formData.role} onChange={handleChange} required />
        </div>
        <div style={styles.row}>
          <input name="location" placeholder="Location" style={styles.input} value={formData.location} onChange={handleChange} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.7em', color: '#777' }}>Date & Time:</label>
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
        <button type="submit" style={styles.submitBtn}>Log Application</button>
      </form>

      <div>
        {jobs.map(job => {
          const t = calculateTimeStats(job.dateApplied);
          return (
            <div key={job.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{job.role}</h3>
                  <p style={{ margin: '4px 0', color: '#666' }}>{job.company}</p>
                </div>
                <select value={job.status} onChange={(e) => updateStatus(job.id, e.target.value)}>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div style={{ 
                ...styles.timer, 
                backgroundColor: t.isFuture ? '#f0fff4' : '#f4f4f9',
                border: t.isFuture ? '1px solid #c6f6d5' : '1px solid #ddd'
              }}>
                <span style={{ fontSize: '0.75em', color: '#888', fontWeight: 'bold' }}>
                  {t.isFuture ? "COUNTDOWN TO START:" : "ACTIVE TIME SINCE APPLIED:"}
                </span>
                <div style={{ fontSize: '1.3em', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {/* Logic: If future, only show days. If past, show the full stopwatch. */}
                  {t.isFuture 
                    ? `${t.days} Days Remaining` 
                    : `${t.days}d ${t.hours}h ${t.minutes}m ${t.seconds}s`
                  }
                </div>
              </div>
              <button onClick={() => deleteJob(job.id)} style={styles.deleteBtn}>Delete</button>
            </div>
          );
        })}
      </div>

      <footer style={styles.footer}>
        <button onClick={exportData} style={styles.backupBtn}>Export Backup</button>
        <input type="file" accept=".json" onChange={importData} ref={fileInputRef} />
      </footer>
    </div>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' },
  row: { display: 'flex', gap: '10px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 },
  submitBtn: { padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  card: { border: '1px solid #eee', padding: '15px', borderRadius: '10px', marginBottom: '15px', background: '#fff' },
  timer: { marginTop: '12px', padding: '10px', borderRadius: '8px', textAlign: 'center' },
  deleteBtn: { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.8em', marginTop: '10px', padding: 0, textDecoration: 'underline' },
  footer: { marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', gap: '20px' },
  backupBtn: { padding: '8px', cursor: 'pointer' }
};

export default App;
            
