"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'students', 'exams', 'results', 'certificates'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("Full-Stack Web Development");

  // Exam builder states
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDuration, setExamDuration] = useState("10"); // in minutes
  const [examPassingGrade, setExamPassingGrade] = useState("70");
  const [questions, setQuestions] = useState([
    { text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 5 }
  ]);

  // Certificate modal state
  const [previewCert, setPreviewCert] = useState(null);

  // Initial load & seeding localStorage
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      router.push("/login");
      return;
    }

    // 1. Load Students from Supabase Auth API
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStudents(data);
      })
      .catch((err) => {
        console.error("Failed to load students:", err?.message || err);
        const storedStudents = localStorage.getItem("pieenear_students");
        if (storedStudents) {
          setStudents(JSON.parse(storedStudents));
        } else {
          const initialStudents = [
            { id: "std-1", name: "Alex Mercer", email: "student@pieenear.com", password: "student123", course: "Full-Stack Web Development", joinedDate: "June 2026", status: "Active" },
            { id: "std-2", name: "Clara Oswald", email: "clara.o@pieenear.com", password: "claraPass9", course: "UI/UX Core Design", joinedDate: "June 2026", status: "Active" },
            { id: "std-3", name: "John Doe", email: "john.doe@pieenear.com", password: "johnPass78", course: "Data Science & ML", joinedDate: "May 2026", status: "Suspended" }
          ];
          localStorage.setItem("pieenear_students", JSON.stringify(initialStudents));
          setStudents(initialStudents);
        }
      });

    // 2. Seed & Load Exams
    const storedExams = localStorage.getItem("pieenear_exams");
    if (storedExams) {
      setExams(JSON.parse(storedExams));
    } else {
      const initialExams = [
        {
          id: "ex-1",
          title: "React & Next.js Essentials",
          duration: 10, // minutes
          passingGrade: 70, // percent
          questions: [
            {
              text: "Which command initializes a brand-new Next.js project with Turbopack by default?",
              optionA: "npm run dev",
              optionB: "npx create-next-app@latest",
              optionC: "npm install next",
              optionD: "next start --turbo",
              correctOption: "B",
              marks: 5
            },
            {
              text: "Which hook should you use to coordinate client side effects in React Components?",
              optionA: "useState",
              optionB: "useContext",
              optionC: "useEffect",
              optionD: "useReducer",
              correctOption: "C",
              marks: 5
            }
          ]
        },
        {
          id: "ex-2",
          title: "UI/UX Layout Concepts",
          duration: 15,
          passingGrade: 75,
          questions: [
            {
              text: "Which CSS display setting is optimized for designing two-dimensional web layouts (both rows and columns)?",
              optionA: "display: block",
              optionB: "display: flex",
              optionC: "display: grid",
              optionD: "display: inline",
              correctOption: "C",
              marks: 5
            }
          ]
        }
      ];
      localStorage.setItem("pieenear_exams", JSON.stringify(initialExams));
      setExams(initialExams);
    }

    // 3. Seed & Load Results
    const storedResults = localStorage.getItem("pieenear_results");
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      const initialResults = [
        {
          id: "res-1",
          studentEmail: "student@pieenear.com",
          studentName: "Alex Mercer",
          examId: "ex-1",
          examTitle: "React & Next.js Essentials",
          score: 10,
          totalMarks: 10,
          percentage: 100,
          status: "Pass",
          date: "June 15, 2026",
          published: true
        },
        {
          id: "res-2",
          studentEmail: "clara.o@pieenear.com",
          studentName: "Clara Oswald",
          examId: "ex-2",
          examTitle: "UI/UX Layout Concepts",
          score: 0,
          totalMarks: 5,
          percentage: 0,
          status: "Fail",
          date: "June 16, 2026",
          published: true
        }
      ];
      localStorage.setItem("pieenear_results", JSON.stringify(initialResults));
      setResults(initialResults);
    }

    // 4. Seed & Load Certificates
    const storedCerts = localStorage.getItem("pieenear_certificates");
    if (storedCerts) {
      setCertificates(JSON.parse(storedCerts));
    } else {
      const initialCerts = [
        {
          id: "cert-1",
          studentEmail: "student@pieenear.com",
          studentName: "Alex Mercer",
          examId: "ex-1",
          examTitle: "React & Next.js Essentials",
          issueDate: "June 15, 2026",
          percentage: 100,
          hash: "CERT-P-8291A"
        }
      ];
      localStorage.setItem("pieenear_certificates", JSON.stringify(initialCerts));
      setCertificates(initialCerts);
    }
  }, [router]);

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Student management functions
  const handleGeneratePassword = () => {
    const keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += keys.charAt(Math.floor(Math.random() * keys.length));
    }
    setStudentPassword(pwd);
    showToast("Password generated!", "info");
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!studentName || !studentEmail || !studentPassword) {
      showToast("All fields are required", "danger");
      return;
    }

    if (editingStudentId) {
      // Edit student in Supabase
      const payload = {
        id: editingStudentId,
        name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        password: studentPassword,
        course: selectedCourse
      };

      fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          showToast("Student profile updated in Supabase!", "success");
          return fetch("/api/students");
        })
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setStudents(data);
        })
        .catch((err) => {
          showToast(err.message, "danger");
          // Local fallback
          const updated = students.map((s) => {
            if (s.id === editingStudentId) {
              return { ...s, name: studentName.trim(), email: studentEmail.trim().toLowerCase(), password: studentPassword, course: selectedCourse };
            }
            return s;
          });
          localStorage.setItem("pieenear_students", JSON.stringify(updated));
          setStudents(updated);
        })
        .finally(() => {
          setEditingStudentId(null);
          setStudentName("");
          setStudentEmail("");
          setStudentPassword("");
          setShowAddForm(false);
        });
    } else {
      // Add student to Supabase
      const emailExists = students.some((s) => s.email.toLowerCase() === studentEmail.trim().toLowerCase());
      if (emailExists) {
        showToast("Student email already registered", "danger");
        return;
      }

      const payload = {
        name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        password: studentPassword,
        course: selectedCourse
      };

      fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          showToast("Student profile registered in Supabase!", "success");
          return fetch("/api/students");
        })
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setStudents(data);
        })
        .catch((err) => {
          showToast(err.message, "danger");
          // Local fallback
          const newStudent = {
            id: "std-" + Date.now(),
            name: studentName.trim(),
            email: studentEmail.trim().toLowerCase(),
            password: studentPassword,
            course: selectedCourse,
            joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            status: "Active"
          };
          const updated = [newStudent, ...students];
          localStorage.setItem("pieenear_students", JSON.stringify(updated));
          setStudents(updated);
        })
        .finally(() => {
          setStudentName("");
          setStudentEmail("");
          setStudentPassword("");
          setShowAddForm(false);
        });
    }
  };

  const handleEditClick = (student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentEmail(student.email);
    setStudentPassword(student.password);
    setSelectedCourse(student.course);
    setShowAddForm(true);
  };

  const handleResetPassword = (id, name) => {
    const nextPwd = "pass" + Math.floor(100 + Math.random() * 900);
    fetch("/api/students", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: nextPwd })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        showToast(`Reset ${name}'s password to: ${nextPwd}`, "info");
        return fetch("/api/students");
      })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStudents(data);
      })
      .catch((err) => {
        showToast(err.message, "danger");
        // Local fallback
        const updated = students.map((s) => {
          if (s.id === id) return { ...s, password: nextPwd };
          return s;
        });
        localStorage.setItem("pieenear_students", JSON.stringify(updated));
        setStudents(updated);
      });
  };

  const handleToggleStatus = (id) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const nextStatus = student.status === "Active" ? "Suspended" : "Active";
    
    fetch("/api/students", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        showToast(`${student.name} status is now ${nextStatus}`, "info");
        return fetch("/api/students");
      })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStudents(data);
      })
      .catch((err) => {
        showToast(err.message, "danger");
        // Local fallback
        const updated = students.map((s) => {
          if (s.id === id) return { ...s, status: nextStatus };
          return s;
        });
        localStorage.setItem("pieenear_students", JSON.stringify(updated));
        setStudents(updated);
      });
  };

  const handleDeleteStudent = (id, name) => {
    fetch(`/api/students?id=${id}`, {
      method: "DELETE"
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        showToast(`Deleted student account: ${name}`, "info");
        return fetch("/api/students");
      })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setStudents(data);
      })
      .catch((err) => {
        showToast(err.message, "danger");
        // Local fallback
        const updated = students.filter((s) => s.id !== id);
        localStorage.setItem("pieenear_students", JSON.stringify(updated));
        setStudents(updated);
      });
  };

  // Exam creator functions
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 5 }
    ]);
  };

  const handleQuestionChange = (index, field, val) => {
    const updated = questions.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: val };
      }
      return q;
    });
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveExam = (e) => {
    e.preventDefault();
    if (!examTitle || !examDuration || !examPassingGrade) {
      showToast("Fill in all exam setup fields", "danger");
      return;
    }

    const emptyQuestion = questions.some(q => !q.text || !q.optionA || !q.optionB || !q.optionC || !q.optionD);
    if (emptyQuestion) {
      showToast("Complete all questions and choice options", "danger");
      return;
    }

    const newExam = {
      id: "ex-" + Date.now(),
      title: examTitle.trim(),
      duration: parseInt(examDuration),
      passingGrade: parseInt(examPassingGrade),
      questions: questions.map(q => ({
        ...q,
        marks: parseInt(q.marks)
      }))
    };

    const updated = [newExam, ...exams];
    localStorage.setItem("pieenear_exams", JSON.stringify(updated));
    setExams(updated);

    // Reset
    setExamTitle("");
    setExamDuration("10");
    setExamPassingGrade("70");
    setQuestions([{ text: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", marks: 5 }]);
    setShowCreateExam(false);
    showToast(`Exam "${newExam.title}" is published!`, "success");
  };

  const handleDeleteExam = (id, title) => {
    const updated = exams.filter((ex) => ex.id !== id);
    localStorage.setItem("pieenear_exams", JSON.stringify(updated));
    setExams(updated);
    showToast(`Deleted exam: ${title}`, "info");
  };

  // Result publishing
  const handleTogglePublish = (resId) => {
    const updated = results.map((r) => {
      if (r.id === resId) {
        const nextState = !r.published;
        showToast(nextState ? "Result published to student dashboard!" : "Result hidden from student dashboard.", "info");
        return { ...r, published: nextState };
      }
      return r;
    });
    localStorage.setItem("pieenear_results", JSON.stringify(updated));
    setResults(updated);
  };

  // Certificate Issuing
  const handleIssueCertificate = (res) => {
    const exists = certificates.some(c => c.studentEmail.toLowerCase() === res.studentEmail.toLowerCase() && c.examId === res.examId);
    if (exists) {
      showToast("Certificate has already been issued for this attempt.", "danger");
      return;
    }

    const newCert = {
      id: "cert-" + Date.now(),
      studentEmail: res.studentEmail,
      studentName: res.studentName,
      examId: res.examId,
      examTitle: res.examTitle,
      issueDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      percentage: res.percentage,
      hash: "CERT-P-" + Math.floor(10000 + Math.random() * 90000) + "A"
    };

    const updated = [newCert, ...certificates];
    localStorage.setItem("pieenear_certificates", JSON.stringify(updated));
    setCertificates(updated);
    showToast(`Certificate issued to ${res.studentName}!`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    router.push("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* Toast */}
      {toastMessage && (
        <div style={{
          ...styles.toast,
          backgroundColor: toastType === "success" 
            ? "rgba(16, 185, 129, 0.95)" 
            : toastType === "info" 
            ? "rgba(59, 130, 246, 0.95)" 
            : "rgba(239, 68, 68, 0.95)",
        }}>
          {toastType === "success" ? "✅" : toastType === "info" ? "ℹ️" : "⚠️"} {toastMessage}
        </div>
      )}

      {/* Mobile Header */}
      <div className="mobile-header">
        <button
          className={`hamburger-btn ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Sidebar Menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <div className="mobile-header-brand">
          <span style={styles.logoIcon}>P</span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>Pieenear</span>
        </div>
        <div style={{ width: "22px" }}></div>
      </div>

      {/* Sidebar Scrim Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Sidebar Panel */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={styles.sidebar}>
        <div style={styles.brandContainer}>
          <span style={styles.logoIcon}>P</span>
          <div>
            <h2 style={styles.brandTitle}>Pieenear</h2>
            <span style={styles.brandBadge}>Admin Hub</span>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "overview" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeTab === "overview" ? "var(--accent-primary)" : "var(--text-secondary)"
            }}
            onClick={() => { setActiveTab("overview"); setShowCreateExam(false); setShowAddForm(false); setSidebarOpen(false); }}
          >
            📊 Console Overview
          </button>
          <button
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "students" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeTab === "students" ? "var(--accent-primary)" : "var(--text-secondary)"
            }}
            onClick={() => { setActiveTab("students"); setShowCreateExam(false); setSidebarOpen(false); }}
          >
            🧑‍🎓 Student Manager
          </button>
          <button
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "exams" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeTab === "exams" ? "var(--accent-primary)" : "var(--text-secondary)"
            }}
            onClick={() => { setActiveTab("exams"); setShowAddForm(false); setSidebarOpen(false); }}
          >
            📝 Exam Manager
          </button>
          <button
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "results" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeTab === "results" ? "var(--accent-primary)" : "var(--text-secondary)"
            }}
            onClick={() => { setActiveTab("results"); setShowCreateExam(false); setShowAddForm(false); setSidebarOpen(false); }}
          >
            📈 Results Desk
          </button>
          <button
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "certificates" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: activeTab === "certificates" ? "var(--accent-primary)" : "var(--text-secondary)"
            }}
            onClick={() => { setActiveTab("certificates"); setShowCreateExam(false); setShowAddForm(false); setSidebarOpen(false); }}
          >
            🏆 Certificate Vault
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.adminProfile}>
            <div style={styles.adminAvatar}>A</div>
            <div>
              <p style={styles.adminName}>Super Admin</p>
              <p style={styles.adminEmail}>admin@pieenear.com</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: "100%", marginTop: "15px" }}>
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Console Workspace */}
      <main className="main-content" style={styles.main}>
        <header style={styles.contentHeader}>
          <div>
            <h1 style={styles.welcomeText}>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "students" && "Student Profile Directory"}
              {activeTab === "exams" && "Exam Program Manager"}
              {activeTab === "results" && "Examination Results Log"}
              {activeTab === "certificates" && "Academic Certificates Vault"}
            </h1>
            <p style={styles.subtitleText}>Manage users, coordinate exam curriculums, calculate grades, and generate certificates.</p>
          </div>
          <span style={styles.liveServerBadge}>🟢 Live Mode</span>
        </header>

        {/* OVERVIEW PANEL */}
        {activeTab === "overview" && (
          <div className="animate-fade-in" style={styles.section}>
            <div className="stats-grid">
              <div className="glass-panel glass-panel-hover" style={styles.metricCard}>
                <p style={styles.metricLabel}>Total Students</p>
                <h2 style={styles.metricValue}>{students.length}</h2>
                <span style={{ color: "var(--accent-emerald)", fontSize: "0.8rem" }}>Profiles Active</span>
              </div>
              <div className="glass-panel glass-panel-hover" style={styles.metricCard}>
                <p style={styles.metricLabel}>Exams Configured</p>
                <h2 style={{ ...styles.metricValue, color: "var(--accent-secondary)" }}>{exams.length}</h2>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>MCQ Banks Live</span>
              </div>
              <div className="glass-panel glass-panel-hover" style={styles.metricCard}>
                <p style={styles.metricLabel}>Results Logs</p>
                <h2 style={{ ...styles.metricValue, color: "var(--accent-cyan)" }}>{results.length}</h2>
                <span style={{ color: "var(--accent-cyan)", fontSize: "0.8rem" }}>Attempts recorded</span>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="glass-panel" style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Student Registration & Test Cycles</h3>
                <div style={styles.svgContainer}>
                  <svg viewBox="0 0 500 200" style={styles.svgChart}>
                    <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="80" x2="480" y2="80" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" />
                    
                    <path
                      d="M 50 170 Q 120 120 200 90 T 350 40 T 470 20"
                      fill="none"
                      stroke="url(#line-grad)"
                      strokeWidth="4"
                    />
                    
                    <circle cx="50" cy="170" r="5" fill="var(--accent-primary)" />
                    <circle cx="200" cy="90" r="5" fill="var(--accent-secondary)" />
                    <circle cx="350" cy="40" r="5" fill="var(--accent-cyan)" />
                    <circle cx="470" cy="20" r="5" fill="var(--accent-emerald)" />

                    <defs>
                      <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent-primary)" />
                        <stop offset="50%" stopColor="var(--accent-secondary)" />
                        <stop offset="100%" stopColor="var(--accent-cyan)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div style={styles.chartLabels}>
                  <span>Jan</span><span>Mar</span><span>May</span><span>Jun</span>
                </div>
              </div>

              <div className="glass-panel" style={styles.infoSummaryCard}>
                <h3 style={styles.chartTitle}>Batch Enrollments</h3>
                <div style={styles.progressSection}>
                  <div style={styles.progRow}>
                    <span style={styles.progLabel}>Web Dev</span>
                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill, width: "70%", background: "var(--accent-primary)" }}></div>
                    </div>
                    <span style={styles.progVal}>70%</span>
                  </div>
                  <div style={styles.progRow}>
                    <span style={styles.progLabel}>UI/UX Core</span>
                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill, width: "30%", background: "var(--accent-secondary)" }}></div>
                    </div>
                    <span style={styles.progVal}>30%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT MANAGER TAB */}
        {activeTab === "students" && (
          <div className="animate-fade-in" style={styles.section}>
            {/* Student Registration Form */}
            {showAddForm && (
              <div className="glass-panel" style={styles.formSectionCard}>
                <h3 style={{ ...styles.formTitle, marginBottom: "20px" }}>
                  {editingStudentId ? "Edit Student Details" : "Register Student Credentials"}
                </h3>
                <form onSubmit={handleSaveStudent}>
                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Student's Name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="email@pieenear.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Enroll Course Program</label>
                      <select
                        className="form-select"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                      >
                        <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                        <option value="Data Science & ML">Data Science & ML</option>
                        <option value="UI/UX Core Design">UI/UX Core Design</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label className="form-label">Login Password</label>
                        <button type="button" onClick={handleGeneratePassword} style={styles.genBtn}>🪄 Generate key</button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Portal password key"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingStudentId(null);
                        setStudentName("");
                        setStudentEmail("");
                        setStudentPassword("");
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingStudentId ? "Update Profile" : "Register Access Key"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List */}
            <div className="glass-panel" style={styles.directoryCard}>
              <div style={styles.directoryHeader}>
                <h2 style={styles.formTitle}>Active Student Roster</h2>
                {!showAddForm && (
                  <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
                    + Add New Student
                  </button>
                )}
              </div>

              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Batch Course</th>
                      <th style={styles.th}>Password Key</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="table-row">
                        <td style={{ ...styles.td, fontWeight: "600" }}>{s.name}</td>
                        <td style={styles.td}>{s.email}</td>
                        <td style={styles.td}>
                          <span style={styles.courseTag}>{s.course}</span>
                        </td>
                        <td style={{ ...styles.td, fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{s.password}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: s.status === "Active" ? "rgba(16, 185, 129, 0.1)" : "rgba(244,63,94,0.1)",
                            color: s.status === "Active" ? "var(--accent-emerald)" : "var(--accent-rose)",
                            border: s.status === "Active" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(244,63,94,0.3)"
                          }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionButtonGroup}>
                            <button onClick={() => handleEditClick(s)} style={{ ...styles.actionBtn, color: "var(--accent-primary)", background: "rgba(99,102,241,0.1)" }}>✍️ Edit</button>
                            <button onClick={() => handleResetPassword(s.id, s.name)} style={{ ...styles.actionBtn, color: "var(--accent-cyan)", background: "rgba(6,182,212,0.1)" }}>🔑 Reset</button>
                            <button onClick={() => handleToggleStatus(s.id)} style={{ ...styles.actionBtn, color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)" }}>🛡️ Status</button>
                            <button onClick={() => handleDeleteStudent(s.id, s.name)} style={{ ...styles.actionBtn, color: "var(--accent-rose)", background: "rgba(244,63,94,0.1)" }}>🗑️ Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EXAM PROGRAM MANAGER TAB */}
        {activeTab === "exams" && (
          <div className="animate-fade-in" style={styles.section}>
            {showCreateExam ? (
              /* Create Exam Form */
              <div className="glass-panel" style={styles.formSectionCard}>
                <h3 style={{ ...styles.formTitle, marginBottom: "20px" }}>Create New MCQ Examination</h3>
                
                <form onSubmit={handleSaveExam}>
                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label className="form-label">Exam Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Next.js Routing Challenge"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Duration (Minutes)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={examDuration}
                        onChange={(e) => setExamDuration(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Passing Grade (%)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={examPassingGrade}
                        onChange={(e) => setExamPassingGrade(e.target.value)}
                        min="10"
                        max="100"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "20px", paddingTop: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: "700" }}>Multiple Choice Questions ({questions.length})</h4>
                      <button type="button" onClick={handleAddQuestion} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                        + Add Question Option
                      </button>
                    </div>

                    {questions.map((q, idx) => (
                      <div key={idx} style={styles.questionFormBlock}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                          <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>Question #{idx + 1}</span>
                          {questions.length > 1 && (
                            <button type="button" onClick={() => handleRemoveQuestion(idx)} style={{ color: "var(--accent-rose)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem" }}>
                              Delete Question
                            </button>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Question Text</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter question prompt"
                            value={q.text}
                            onChange={(e) => handleQuestionChange(idx, "text", e.target.value)}
                            required
                          />
                        </div>

                        <div style={styles.formRow}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Option A</label>
                            <input type="text" className="form-input" placeholder="Option A" value={q.optionA} onChange={(e) => handleQuestionChange(idx, "optionA", e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Option B</label>
                            <input type="text" className="form-input" placeholder="Option B" value={q.optionB} onChange={(e) => handleQuestionChange(idx, "optionB", e.target.value)} required />
                          </div>
                        </div>

                        <div style={styles.formRow}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Option C</label>
                            <input type="text" className="form-input" placeholder="Option C" value={q.optionC} onChange={(e) => handleQuestionChange(idx, "optionC", e.target.value)} required />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Option D</label>
                            <input type="text" className="form-input" placeholder="Option D" value={q.optionD} onChange={(e) => handleQuestionChange(idx, "optionD", e.target.value)} required />
                          </div>
                        </div>

                        <div style={styles.formRow}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Correct Option Answer</label>
                            <select
                              className="form-select"
                              value={q.correctOption}
                              onChange={(e) => handleQuestionChange(idx, "correctOption", e.target.value)}
                            >
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Allotted Marks</label>
                            <input
                              type="number"
                              className="form-input"
                              value={q.marks}
                              onChange={(e) => handleQuestionChange(idx, "marks", e.target.value)}
                              min="1"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                    <button type="button" onClick={() => setShowCreateExam(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save and Publish Exam</button>
                  </div>
                </form>
              </div>
            ) : (
              /* Exams Roster */
              <div className="glass-panel" style={styles.directoryCard}>
                <div style={styles.directoryHeader}>
                  <h2 style={styles.formTitle}>Configured Examinations</h2>
                  <button onClick={() => setShowCreateExam(true)} className="btn btn-primary">
                    + Create New Exam
                  </button>
                </div>

                <div style={styles.grid}>
                  {exams.map((ex) => (
                    <div key={ex.id} className="glass-panel" style={styles.examCard}>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "8px" }}>{ex.title}</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "15px" }}>
                        ⏱️ Limit: <strong>{ex.duration} mins</strong> | Passing Score: <strong>{ex.passingGrade}%</strong>
                      </p>
                      
                      <div style={styles.examCardFooter}>
                        <span style={styles.questionCountBadge}>
                          ❓ {ex.questions.length} MCQ Questions
                        </span>
                        <button
                          onClick={() => handleDeleteExam(ex.id, ex.title)}
                          className="btn btn-danger"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULTS DESK TAB */}
        {activeTab === "results" && (
          <div className="glass-panel animate-fade-in" style={styles.directoryCard}>
            <h2 style={{ ...styles.formTitle, marginBottom: "20px" }}>Examination Attempt Logs</h2>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student Name</th>
                    <th style={styles.th}>Email Address</th>
                    <th style={styles.th}>Exam Attempted</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Percentage</th>
                    <th style={styles.th}>Grade Status</th>
                    <th style={styles.th}>Display Tab</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res) => (
                    <tr key={res.id} className="table-row">
                      <td style={{ ...styles.td, fontWeight: "600" }}>{res.studentName}</td>
                      <td style={styles.td}>{res.studentEmail}</td>
                      <td style={styles.td}>{res.examTitle}</td>
                      <td style={styles.td}>{res.date}</td>
                      <td style={styles.td}>{res.score} / {res.totalMarks}</td>
                      <td style={styles.td}><strong style={{ color: "var(--accent-primary)" }}>{res.percentage}%</strong></td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: res.status === "Pass" ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)",
                          color: res.status === "Pass" ? "var(--accent-emerald)" : "var(--accent-rose)",
                          border: res.status === "Pass" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(244, 63, 94, 0.3)"
                        }}>
                          {res.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: res.published ? "var(--accent-emerald)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                          {res.published ? "🟢 Published" : "🔴 Hidden"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleTogglePublish(res.id)}
                            style={{
                              ...styles.actionBtn,
                              color: "#fff",
                              background: res.published ? "rgba(244, 63, 94, 0.1)" : "rgba(16, 185, 129, 0.1)",
                              borderColor: res.published ? "var(--accent-rose)" : "var(--accent-emerald)",
                              borderWidth: "1px",
                              borderStyle: "solid"
                            }}
                          >
                            {res.published ? "Hide Result" : "Publish"}
                          </button>
                          {res.status === "Pass" && (
                            <button
                              onClick={() => handleIssueCertificate(res)}
                              className="btn btn-primary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            >
                              🏆 Issue Cert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CERTIFICATE VAULT TAB */}
        {activeTab === "certificates" && (
          <div className="animate-fade-in" style={styles.section}>
            {previewCert ? (
              /* Certificate visual viewer */
              <div className="glass-panel" style={{ padding: "30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "20px" }}>
                  <h3 style={styles.formTitle}>Certificate Visual Preview</h3>
                  <button onClick={() => setPreviewCert(null)} className="btn btn-secondary">
                    Back to Vault
                  </button>
                </div>

                <div className="certificate-preview-container">
                  <div className="certificate-card">
                    <div className="certificate-seal">🏆</div>
                    <h1 className="certificate-title">PIEENEAR INFOTECH</h1>
                    <span className="certificate-subtitle">Official Achievement Diploma</span>
                    
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "10px 0" }}>This is proud academic record that certifies</p>
                    <h2 className="certificate-recipient-name">{previewCert.studentName}</h2>
                    
                    <p className="certificate-body">
                      has successfully satisfied the evaluation guidelines and passed the course program examination: 
                      <strong style={{ color: "#fff", display: "block", marginTop: "6px" }}>{previewCert.examTitle}</strong>
                    </p>
                    
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "30px" }}>
                      Earned with an evaluation grade score of <strong>{previewCert.percentage}%</strong> on {previewCert.issueDate}.
                    </p>

                    <div className="certificate-signatures">
                      <div className="signature-line">
                        <p style={{ fontStyle: "italic", color: "#fff", marginBottom: "4px" }}>Pieenear Registry</p>
                        Board Signature
                      </div>
                      <div className="signature-line">
                        <p style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", marginBottom: "4px" }}>{previewCert.hash}</p>
                        Registry Hash
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Certificates log list */
              <div className="glass-panel" style={styles.directoryCard}>
                <h2 style={{ ...styles.formTitle, marginBottom: "20px" }}>Issued Certificates Registry</h2>

                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Recipient</th>
                        <th style={styles.th}>Email Address</th>
                        <th style={styles.th}>Exam Subject</th>
                        <th style={styles.th}>Date Issued</th>
                        <th style={styles.th}>Score Percent</th>
                        <th style={styles.th}>Credential Hash</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert.id} className="table-row">
                          <td style={{ ...styles.td, fontWeight: "600" }}>{cert.studentName}</td>
                          <td style={styles.td}>{cert.studentEmail}</td>
                          <td style={styles.td}>{cert.examTitle}</td>
                          <td style={styles.td}>{cert.issueDate}</td>
                          <td style={styles.td}><strong style={{ color: "var(--accent-cyan)" }}>{cert.percentage}%</strong></td>
                          <td style={{ ...styles.td, fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{cert.hash}</td>
                          <td style={styles.td}>
                            <button
                              onClick={() => setPreviewCert(cert)}
                              className="btn btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                            >
                              👁️ Preview Card
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  sidebar: {
    padding: "30px 20px",
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "#fff",
    fontSize: "1.1rem",
  },
  brandTitle: {
    fontSize: "1.2rem",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  brandBadge: {
    fontSize: "0.75rem",
    color: "var(--accent-secondary)",
    fontWeight: 600,
  },
  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flexGrow: 1,
  },
  navBtn: {
    width: "100%",
    padding: "14px 18px",
    border: "none",
    borderRadius: "var(--border-radius-md)",
    fontSize: "0.95rem",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    outline: "none",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: "20px",
    borderTop: "1px solid var(--border-color)",
  },
  adminProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  adminAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-secondary)",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
  },
  adminName: {
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  adminEmail: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  main: {
    backgroundColor: "var(--bg-primary)",
  },
  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "24px",
  },
  welcomeText: {
    fontSize: "1.8rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  subtitleText: {
    color: "var(--text-secondary)",
    fontSize: "0.95rem",
    marginTop: "4px",
  },
  liveServerBadge: {
    fontSize: "0.85rem",
    fontWeight: 600,
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "var(--accent-emerald)",
    padding: "6px 14px",
    borderRadius: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  metricCard: {
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
  },
  metricLabel: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "2.2rem",
    fontWeight: 800,
    marginBottom: "4px",
  },
  analyticsSection: {
    display: "grid",
    gridTemplateColumns: "1.8fr 1fr",
    gap: "24px",
  },
  chartCard: {
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
    height: "300px",
    display: "flex",
    flexDirection: "column",
  },
  chartTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    marginBottom: "16px",
  },
  svgContainer: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
  },
  svgChart: {
    width: "100%",
    height: "100%",
  },
  chartLabels: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 20px",
    color: "var(--text-muted)",
    fontSize: "0.75rem",
    marginTop: "8px",
  },
  infoSummaryCard: {
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
    display: "flex",
    flexDirection: "column",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "10px",
  },
  progRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  progLabel: {
    width: "90px",
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  progressBarBg: {
    flexGrow: 1,
    height: "8px",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "4px",
  },
  progVal: {
    fontSize: "0.85rem",
    color: "var(--text-primary)",
    fontWeight: 600,
    width: "30px",
    textAlign: "right",
  },
  formSectionCard: {
    padding: "35px",
    borderRadius: "var(--border-radius-lg)",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
  },
  formTitle: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#fff",
  },
  formRow: {
    display: "flex",
    gap: "24px",
  },
  genBtn: {
    background: "none",
    border: "none",
    color: "var(--accent-secondary)",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
  },
  directoryCard: {
    padding: "35px",
    borderRadius: "var(--border-radius-lg)",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
  },
  directoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },
  tableResponsive: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "16px",
    borderBottom: "1px solid var(--border-color)",
    color: "var(--text-secondary)",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  td: {
    padding: "16px",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    verticalAlign: "middle",
  },
  courseTag: {
    fontSize: "0.8rem",
    padding: "4px 10px",
    background: "rgba(99, 102, 241, 0.08)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    color: "#a5b4fc",
    borderRadius: "4px",
    fontWeight: 500,
  },
  statusBadge: {
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: "10px",
    fontWeight: 600,
  },
  actionButtonGroup: {
    display: "flex",
    gap: "8px",
  },
  actionBtn: {
    padding: "6px 10px",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
  },
  toast: {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    color: "#fff",
    padding: "15px 25px",
    borderRadius: "var(--border-radius-md)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: 1000,
    fontSize: "0.95rem",
    fontWeight: 600,
    animation: "fadeIn 0.3s ease",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  examCard: {
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
  examCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "15px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  questionCountBadge: {
    fontSize: "0.8rem",
    color: "var(--accent-cyan)",
    fontWeight: 600,
  },
  questionFormBlock: {
    background: "rgba(255,255,255,0.01)",
    border: "1px solid var(--border-color)",
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
    marginBottom: "20px",
  }
};
