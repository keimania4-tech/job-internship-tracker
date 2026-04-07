"use client";

import React, { useState, useEffect, useRef } from 'react';

/**
 * LOGIC: calculateTimeLeft
 * Compares the stored application date plus 7 days against the current local time.
 */
const calculateTimeLeft = (dateApplied: string) => {
  const targetDate = new Date(dateApplied);
  targetDate.setDate(targetDate.getDate() + 7); 
  const difference = +targetDate - +new Date();
  
  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. STATE: Load jobs from LocalStorage with validation
  const [jobs, setJobs] = useState<any[]>([]);

  // Initialize data only on client-side
  useEffect(() => {
    try {
      const saved = localStorage.getItem('myJobApplications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setJobs(parsed);
      }
    } catch (error) {
      console.error("Storage corrupted:", error);
    }
  }, []);

  // 2. STATE: Form tracking
  const [formData, setFormData] = useState({
    company: '', role: '', location: '', status: 'Applied', notes: '',
    dateApplied: new Date().toISOString().split('T')[0]
  });

  // 3. STATE: The Timer Heartbeat
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. EFFECT: Auto-save to LocalStorage
  useEffect(() => {
    if (jobs.length > 0) {
        localStorage.setItem('myJobApplications', JSON.stringify(jobs));
    }
  }, [jobs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = formData.dateApplied.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); 

    if (selectedDate > new Date()) {
      alert("Check your date! You can't apply in the future.");
      return;
    }

    const newJob = {
      ...formData,
      id: crypto.randomUUID(),
      dateApplied: selectedDate.toISOString()
    };
    
    setJobs([newJob, ...jobs]);
    setFormData({ ...formData, company: '', role: '', notes: '' });
  };

  const updateStatus = (id: string, newStatus: string) => {
    setJobs(jobs.map(job => job.id === id ? { ...job, status: newStatus } : job));
  };

  const deleteJob = (id: string) => {
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

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed)) {
          setJobs(parsed);
          localStorage.setItem('myJobApplications', JSON.stringify(parsed));
          alert("Data Imported!");
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
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333' }}>
      <h1 style={{ textAlign: 'center' }}>💼 Job Tracker</h1>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <input name="company" placeholder="Company" style={styles.input} value={formData.company} onChange={handleChange} required />
          <input name="role" placeholder="Role" style={styles.input} value={formData.role} onChange={handleChange} required />
        </div>
        <div style={styles.row}>
          <input name="location" placeholder="Location" style={styles.input} value={formData.location} onChange={handleChange} />
          <input type="date" name="dateApplied" style={styles.input} value={formData.dateApplied} onChange={handleChange} required />
        </div>
        <textarea name="notes" placeholder="Additional Notes" style={{ ...styles.input, height: '60px' }} value={formData.notes} onChange={handleChange} />
        <button type="submit" style={styles.submitBtn}>Log Application</button>
      </form>

      <div>
        {jobs.map(job => {
          const timeLeft = calculateTimeLeft(job.dateApplied);
          return (
            <div key={job.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{job.role}</h3>
                  <p style={{ margin: '4px 0', color: '#555' }}>{job.company} • {job.location}</p>
                </div>
                <select value={job.status} onChange={(e) => updateStatus(job.id, e.target.value)} style={{ padding: '5px' }}>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div style={{ ...styles.timer, backgroundColor: timeLeft ? '#f0f7ff' : '#fff5f5' }}>
                <strong>Countdown:</strong> {timeLeft ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s` : "Follow up!"}
              </div>
              <button onClick={() => deleteJob(job.id)} style={styles.deleteLink}>Delete</button>
            </div>
          );
        })}
      </div>

      <footer style={styles.footer}>
        <button onClick={exportData} style={styles.backupBtn}>Export JSON</button>
        <input type="file" accept=".json" onChange={importData} ref={fileInputRef} />
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  form: { display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' },
  row: { display: 'flex', gap: '10px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 },
  submitBtn: { padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  card: { border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'white' },
  timer: { marginTop: '10px', padding: '8px', borderRadius: '4px' },
  deleteLink: { color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8em', marginTop: '10px' },
  footer: { marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' },
  backupBtn: { padding: '8px', cursor: 'pointer' }
};
