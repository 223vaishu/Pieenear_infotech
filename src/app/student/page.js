"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("desk"); // 'desk', 'exams', 'certificates', 'doubt', 'profile'
  
  // Data lists
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // Active Exam State
  const [activeExam, setActiveExam] = useState(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState({}); // { qIdx: selectedOption }
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [lastResultSummary, setLastResultSummary] = useState(null);

  // Doubt tickets
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Academic");
  const [tickets, setTickets] = useState([]);

  // Security Update
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toast notifications
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Initial load
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "student") {
      router.push("/login");
      return;
    }

    // Load Student Info
    const current = localStorage.getItem("currentStudent");
    if (current) {
      setStudentInfo(JSON.parse(current));
    } else {
      const defaultStudent = {
        name: "Alex Mercer",
        email: "student@pieenear.com",
        course: "Full-Stack Web Development",
        joinedDate: "June 2026",
        status: "Active"
      };
      localStorage.setItem("currentStudent", JSON.stringify(defaultStudent));
      setStudentInfo(defaultStudent);
    }

    // Load Exams
    const storedExams = localStorage.getItem("pieenear_exams");
    if (storedExams) {
      setExams(JSON.parse(storedExams));
    }

    // Load Results
    const storedResults = localStorage.getItem("pieenear_results");
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    }

    // Load Certificates
    const storedCerts = localStorage.getItem("pieenear_certificates");
    if (storedCerts) {
      setCertificates(JSON.parse(storedCerts));
    }

    // Load tickets
    const savedTickets = localStorage.getItem("pieenear_tickets");
    if (savedTickets) {
      setTickets(JSON.parse(savedTickets));
    } else {
      const defaultTicket = [
        {
          id: "tkt-1",
          subject: "CSS Grid vs Flexbox alignment doubt",
          category: "Academic",
          date: "June 14, 2026",
          status: "Resolved",
          reply: "Hi Alex! Flexbox is 1-dimensional (row/column), whereas Grid is 2-dimensional (both row and column). Use Flexbox for alignments and Grid for overall page layouts."
        }
      ];
      localStorage.setItem("pieenear_tickets", JSON.stringify(defaultTicket));
      setTickets(defaultTicket);
    }
  }, [router]);

  // Handle active exam timer
  useEffect(() => {
    if (!activeExam) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam]);

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Exam Player execution
  const handleStartExam = (exam) => {
    // Check if already taken
    const attempted = results.some(r => r.studentEmail.toLowerCase() === studentInfo.email.toLowerCase() && r.examId === exam.id);
    if (attempted) {
      showToast("You have already submitted this exam. Multiple attempts are locked.", "danger");
      return;
    }

    setActiveExam(exam);
    setCurrentQIdx(0);
    setExamAnswers({});
    setMarkedQuestions(new Set());
    setTimeLeft(exam.duration * 60);
    showToast(`Exam "${exam.title}" has started!`, "success");
  };

  const handleOptionSelect = (option) => {
    setExamAnswers({
      ...examAnswers,
      [currentQIdx]: option
    });
  };

  const toggleMarkForReview = () => {
    const updated = new Set(markedQuestions);
    if (updated.has(currentQIdx)) {
      updated.delete(currentQIdx);
    } else {
      updated.add(currentQIdx);
    }
    setMarkedQuestions(updated);
  };

  const calculateScore = () => {
    let score = 0;
    let totalMarks = 0;

    activeExam.questions.forEach((q, idx) => {
      totalMarks += q.marks;
      if (examAnswers[idx] === q.correctOption) {
        score += q.marks;
      }
    });

    const percentage = Math.round((score / totalMarks) * 100);
    const passStatus = percentage >= activeExam.passingGrade ? "Pass" : "Fail";

    return { score, totalMarks, percentage, passStatus };
  };

  const submitExamResults = () => {
    const { score, totalMarks, percentage, passStatus } = calculateScore();

    const newResult = {
      id: "res-" + Date.now(),
      studentEmail: studentInfo.email,
      studentName: studentInfo.name,
      examId: activeExam.id,
      examTitle: activeExam.title,
      score,
      totalMarks,
      percentage,
      status: passStatus,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      published: true // auto published for demo simplicity
    };

    // Save Results
    const updatedResults = [newResult, ...results];
    setResults(updatedResults);
    localStorage.setItem("pieenear_results", JSON.stringify(updatedResults));

    // Show completion report
    setLastResultSummary(newResult);
    setShowCompletionModal(true);
    setActiveExam(null);
  };

  const handleAutoSubmit = () => {
    showToast("Time expired! Automatically submitting your answers...", "danger");
    submitExamResults();
  };

  const handleManualSubmit = () => {
    if (confirm("Are you sure you want to finish and submit the exam?")) {
      submitExamResults();
    }
  };

  // Doubt tickets dispatcher
  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDescription) {
      showToast("Please fill out all ticket fields", "danger");
      return;
    }

    const newTicket = {
      id: "tkt-" + Date.now(),
      subject: ticketSubject.trim(),
      category: ticketCategory,
      description: ticketDescription.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      status: "Pending",
      reply: null
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    localStorage.setItem("pieenear_tickets", JSON.stringify(updated));

    setTicketSubject("");
    setTicketDescription("");
    showToast("Doubt logged. Instructor notified!", "success");
  };

  // Change password credentials
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "danger");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match!", "danger");
      return;
    }

    // Update students globally
    const stored = JSON.parse(localStorage.getItem("pieenear_students") || "[]");
    const updatedStored = stored.map((s) => {
      if (s.email.toLowerCase() === studentInfo.email.toLowerCase()) {
        return { ...s, password: newPassword };
      }
      return s;
    });
    localStorage.setItem("pieenear_students", JSON.stringify(updatedStored));
    showToast("Security keys updated!", "success");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentStudent");
    router.push("/login");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!studentInfo) {
    return <div style={styles.loadingContainer}>Accessing Study Workspace...</div>;
  }

  // Filter dynamic lists for this specific student
  const myResults = results.filter(r => r.studentEmail.toLowerCase() === studentInfo.email.toLowerCase() && r.published);
  const myCertificates = certificates.filter(c => c.studentEmail.toLowerCase() === studentInfo.email.toLowerCase());

  // Filter assigned exams (those that haven't been completed)
  const myAvailableExams = exams.filter(ex => !results.some(r => r.examId === ex.id && r.studentEmail.toLowerCase() === studentInfo.email.toLowerCase()));

  return (
    <div className="dashboard-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          ...styles.toast,
          backgroundColor: toastType === "success" 
            ? "rgba(16, 185, 129, 0.95)" 
            : "rgba(239, 68, 68, 0.95)",
        }}>
          {toastType === "success" ? "✅" : "⚠️"} {toastMessage}
        </div>
      )}

      {/* Sidebar navigation */}
      {!activeExam && (
        <aside className="sidebar" style={styles.sidebar}>
          <div style={styles.brandContainer}>
            <span style={styles.logoIcon}>P</span>
            <div>
              <h2 style={styles.brandTitle}>Pieenear</h2>
              <span style={styles.brandBadge}>Student Desk</span>
            </div>
          </div>

          <nav style={styles.sidebarNav}>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "desk" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "desk" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => setActiveTab("desk")}
            >
              💻 My Study Desk
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "exams" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "exams" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => setActiveTab("exams")}
            >
              📝 Exams Workspace
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "certificates" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "certificates" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => setActiveTab("certificates")}
            >
              🏆 Certificates Vault
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "doubt" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "doubt" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => setActiveTab("doubt")}
            >
              🙋 Doubt Support
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "profile" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "profile" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => setActiveTab("profile")}
            >
              ⚙️ Security Profile
            </button>
          </nav>

          <div style={styles.sidebarFooter}>
            <div style={styles.studentProfile}>
              <div style={styles.studentAvatar}>{studentInfo.name.charAt(0)}</div>
              <div>
                <p style={styles.studentName}>{studentInfo.name}</p>
                <p style={styles.studentEmail}>{studentInfo.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-danger" style={{ width: "100%", marginTop: "15px" }}>
              Logout Desk
            </button>
          </div>
        </aside>
      )}

      {/* Main Panel Content */}
      <main className="main-content" style={{ ...styles.main, padding: activeExam ? "40px 10%" : "40px" }}>
        
        {/* Active Exam distractor free view */}
        {activeExam ? (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header style={{ ...styles.contentHeader, borderBottom: "1px solid var(--border-color)", paddingBottom: "15px", marginBottom: "20px" }}>
              <div>
                <span style={styles.programBadge}>🛡️ Secure Exam Mode Active</span>
                <h1 style={{ ...styles.welcomeText, marginTop: "8px" }}>{activeExam.title}</h1>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Timer Countdown</p>
                <h2 style={{ fontSize: "1.8rem", color: timeLeft < 60 ? "var(--accent-rose)" : "var(--accent-cyan)", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                  ⏱️ {formatTime(timeLeft)}
                </h2>
              </div>
            </header>

            <div className="exam-layout">
              {/* Question Screen */}
              <div className="glass-panel exam-question-card" style={styles.questionCard}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                  <span>QUESTION {currentQIdx + 1} OF {activeExam.questions.length}</span>
                  <span>MARKS: {activeExam.questions[currentQIdx].marks}</span>
                </div>

                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: "20px", color: "#fff", lineHeight: 1.5 }}>
                  {activeExam.questions[currentQIdx].text}
                </h2>

                <div className="exam-options-list">
                  {[
                    { key: "A", label: activeExam.questions[currentQIdx].optionA },
                    { key: "B", label: activeExam.questions[currentQIdx].optionB },
                    { key: "C", label: activeExam.questions[currentQIdx].optionC },
                    { key: "D", label: activeExam.questions[currentQIdx].optionD },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className={`exam-option-item ${examAnswers[currentQIdx] === opt.key ? "selected" : ""}`}
                      onClick={() => handleOptionSelect(opt.key)}
                    >
                      <div className="option-radio"></div>
                      <span><strong>{opt.key}.</strong> {opt.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: "30px" }}>
                  <button
                    type="button"
                    onClick={() => setCurrentQIdx(prev => Math.max(0, prev - 1))}
                    className="btn btn-secondary"
                    disabled={currentQIdx === 0}
                  >
                    ← Previous Question
                  </button>

                  <button
                    type="button"
                    onClick={toggleMarkForReview}
                    className="btn btn-secondary"
                    style={{ borderColor: markedQuestions.has(currentQIdx) ? "#f59e0b" : "var(--border-color)", color: markedQuestions.has(currentQIdx) ? "#f59e0b" : "#fff" }}
                  >
                    🔖 {markedQuestions.has(currentQIdx) ? "Marked for Review" : "Mark for Review"}
                  </button>

                  {currentQIdx < activeExam.questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQIdx(prev => prev + 1)}
                      className="btn btn-primary"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleManualSubmit}
                      className="btn btn-primary"
                      style={{ background: "linear-gradient(135deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%)" }}
                    >
                      Submit Exam
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar Question Palette */}
              <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Question Palette</h3>
                
                <div className="palette-grid">
                  {activeExam.questions.map((_, idx) => {
                    let stateClass = "unvisited";
                    if (examAnswers[idx] !== undefined) stateClass = "answered";
                    if (markedQuestions.has(idx)) stateClass = "marked";
                    if (currentQIdx === idx) stateClass = "current";

                    return (
                      <button
                        key={idx}
                        className={`palette-btn ${stateClass}`}
                        onClick={() => setCurrentQIdx(idx)}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: "30px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "8px", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ ...styles.legendBox, background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-color)" }}></span> Not Answered</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ ...styles.legendBox, background: "rgba(16, 185, 129, 0.2)", border: "1px solid var(--accent-emerald)" }}></span> Answered</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ ...styles.legendBox, background: "rgba(245, 158, 11, 0.2)", border: "1px solid #f59e0b" }}></span> Marked for Review</div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSubmit}
                  className="btn btn-danger"
                  style={{ marginTop: "auto", width: "100%" }}
                >
                  Terminate & Submit
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard dashboard views */
          <>
            {/* Completion Modal Report */}
            {showCompletionModal && lastResultSummary && (
              <div style={styles.modalOverlay}>
                <div className="glass-panel" style={styles.modalCard}>
                  <span style={{ fontSize: "3rem" }}>
                    {lastResultSummary.status === "Pass" ? "🏆" : "⚠️"}
                  </span>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "15px" }}>
                    {lastResultSummary.status === "Pass" ? "Exam Passed!" : "Exam Completed"}
                  </h2>
                  <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "0.95rem" }}>
                    You scored <strong>{lastResultSummary.score}</strong> out of <strong>{lastResultSummary.totalMarks}</strong> marks (<strong>{lastResultSummary.percentage}%</strong>).
                  </p>
                  
                  {lastResultSummary.status === "Pass" ? (
                    <p style={{ color: "var(--accent-emerald)", fontSize: "0.85rem", marginTop: "4px" }}>
                      * Your certificate has been generated and issued to the Vault!
                    </p>
                  ) : (
                    <p style={{ color: "var(--accent-rose)", fontSize: "0.85rem", marginTop: "4px" }}>
                      You did not satisfy the minimum passing percentage of this exam.
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "25px", width: "100%" }}>
                    <button
                      onClick={() => {
                        setShowCompletionModal(false);
                        setActiveTab("exams");
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      Close Report
                    </button>
                    {lastResultSummary.status === "Pass" && (
                      <button
                        onClick={() => {
                          setShowCompletionModal(false);
                          setActiveTab("certificates");
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                      >
                        Claim Certificate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <header style={styles.contentHeader}>
              <div>
                <h1 style={styles.welcomeText}>
                  {activeTab === "desk" && "Study Desk"}
                  {activeTab === "exams" && "Exams Workspace"}
                  {activeTab === "certificates" && "Certificates Vault"}
                  {activeTab === "doubt" && "Doubt Desk"}
                  {activeTab === "profile" && "Security Console"}
                </h1>
                <p style={styles.subtitleText}>Track curriculum progress, complete evaluations, and claim credentials.</p>
              </div>
            </header>

            {/* TAB CONTROLS */}

            {/* STUDY DESK */}
            {activeTab === "desk" && (
              <div className="animate-fade-in" style={styles.section}>
                {/* Welcome Card */}
                <div className="glass-panel" style={styles.welcomeBanner}>
                  <div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>
                      Welcome back, <span className="gradient-text">{studentInfo.name}</span>!
                    </h2>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "550px", fontSize: "0.95rem", lineHeight: "1.5" }}>
                      Access your assigned tests, submit doubt questions, and claim graduation certificates when completing evaluations.
                    </p>
                  </div>
                  <div style={styles.progressGaugeCard}>
                    <div style={styles.gaugeContainer}>
                      <svg width="80" height="80" viewBox="0 0 36 36" style={styles.svgWheel}>
                        <path style={styles.wheelTrack} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                          style={{
                            ...styles.wheelFill,
                            strokeDasharray: `${myResults.filter(r => r.status === "Pass").length > 0 ? "100" : "40"}, 100`,
                            stroke: "var(--accent-primary)"
                          }}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div style={styles.gaugeText}>
                        {myResults.filter(r => r.status === "Pass").length > 0 ? "100%" : "40%"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>Academic Grade</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Syllabus status</p>
                    </div>
                  </div>
                </div>

                <div style={styles.deskGrid}>
                  {/* Notices board */}
                  <div className="glass-panel" style={styles.announcementCard}>
                    <h3 style={{ ...styles.cardTitle, borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "15px" }}>📢 Announcements</h3>
                    <div style={styles.announcementItem}>
                      <span style={styles.announcementBadge}>Platform Upgrade</span>
                      <p style={styles.announcementText}>
                        <strong>Secure Exam Runner active:</strong> The static evaluation workspace is fully functional. Please do not close windows during tests.
                      </p>
                      <span style={styles.announcementDate}>Active</span>
                    </div>
                    <div style={{ ...styles.announcementItem, borderBottom: "none" }}>
                      <span style={{ ...styles.announcementBadge, background: "rgba(168,85,247,0.15)", color: "var(--accent-secondary)" }}>Certificates</span>
                      <p style={styles.announcementText}>
                        Pass evaluations with score grade above 70% to instantly claim achievement diplomas in the Certificate vault.
                      </p>
                      <span style={styles.announcementDate}>Active</span>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="glass-panel" style={styles.scheduleCard}>
                    <h3 style={{ ...styles.cardTitle, borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "15px" }}>📊 Fast Summary</h3>
                    <div style={styles.statLogItem}>
                      <span>Assigned Available Tests</span>
                      <strong>{myAvailableExams.length}</strong>
                    </div>
                    <div style={styles.statLogItem}>
                      <span>Evaluations Completed</span>
                      <strong>{myResults.length}</strong>
                    </div>
                    <div style={styles.statLogItem}>
                      <span>Earned Certificates</span>
                      <strong>{myCertificates.length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EXAMS WORKSPACE */}
            {activeTab === "exams" && (
              <div className="animate-fade-in" style={styles.section}>
                {/* Available Exams */}
                <div className="glass-panel" style={styles.directoryCard}>
                  <h3 style={{ ...styles.formTitle, marginBottom: "20px" }}>Assigned Evaluations ({myAvailableExams.length})</h3>
                  
                  {myAvailableExams.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No exams currently assigned. Good job completing your syllabus!</p>
                  ) : (
                    <div style={styles.grid}>
                      {myAvailableExams.map((ex) => (
                        <div key={ex.id} className="glass-panel glass-panel-hover" style={styles.examSelectionCard}>
                          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{ex.title}</h4>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "6px" }}>
                            ⏱️ Duration: <strong>{ex.duration} Mins</strong>
                          </p>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "2px" }}>
                            📋 Questions: <strong>{ex.questions.length} MCQ</strong>
                          </p>
                          <button
                            onClick={() => handleStartExam(ex)}
                            className="btn btn-primary"
                            style={{ width: "100%", marginTop: "20px" }}
                          >
                            🚀 Start Exam
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attempt History */}
                <div className="glass-panel" style={styles.directoryCard}>
                  <h3 style={{ ...styles.formTitle, marginBottom: "20px" }}>Completed Attempt History</h3>

                  <div style={styles.tableResponsive}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Evaluation Exam</th>
                          <th style={styles.th}>Date Attempted</th>
                          <th style={styles.th}>Score Achieved</th>
                          <th style={styles.th}>Percentage</th>
                          <th style={styles.th}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myResults.map((r) => (
                          <tr key={r.id} className="table-row">
                            <td style={{ ...styles.td, fontWeight: "600" }}>{r.examTitle}</td>
                            <td style={styles.td}>{r.date}</td>
                            <td style={styles.td}>{r.score} / {r.totalMarks}</td>
                            <td style={styles.td}><strong style={{ color: "var(--accent-primary)" }}>{r.percentage}%</strong></td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.statusBadge,
                                backgroundColor: r.status === "Pass" ? "rgba(16, 185, 129, 0.1)" : "rgba(244,63,94,0.1)",
                                color: r.status === "Pass" ? "var(--accent-emerald)" : "var(--accent-rose)",
                                border: r.status === "Pass" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(244,63,94,0.3)"
                              }}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CERTIFICATES VAULT */}
            {activeTab === "certificates" && (
              <div className="animate-fade-in" style={styles.section}>
                <div className="glass-panel" style={styles.directoryCard}>
                  <h3 style={{ ...styles.formTitle, marginBottom: "20px" }}>Your Diplomas Vault ({myCertificates.length})</h3>

                  {myCertificates.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Complete assigned examinations and satisfy passing criteria to view certificates here.</p>
                  ) : (
                    <div style={styles.grid}>
                      {myCertificates.map((cert) => (
                        <div key={cert.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "2rem", marginBottom: "10px" }}>🎓</span>
                          <h4 style={{ fontSize: "1.1rem", fontWeight: "700" }}>{cert.examTitle}</h4>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "4px" }}>
                            Score: <strong>{cert.percentage}%</strong> | Issued: {cert.issueDate}
                          </p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Credential: {cert.hash}
                          </p>

                          <button
                            onClick={() => {
                              // Print trigger
                              window.print();
                            }}
                            className="btn btn-secondary"
                            style={{ width: "100%", marginTop: "20px" }}
                          >
                            ⬇️ Print Diploma
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DOUBT SUPPORT */}
            {activeTab === "doubt" && (
              <div style={styles.doubtContainer}>
                {/* Log Doubt Form */}
                <div className="glass-panel" style={styles.doubtFormCard}>
                  <h2 style={{ ...styles.formTitle, marginBottom: "15px" }}>Log Doubt Query</h2>
                  <form onSubmit={handleCreateTicket} style={styles.form}>
                    <div className="form-group">
                      <label className="form-label">Subject Headline</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Next.js router.push layout sync doubt"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                        <option value="Academic">Academic Query</option>
                        <option value="Technical Platform Error">Technical Support</option>
                        <option value="Credentials">Account Credentials</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Detailed Description</label>
                      <textarea
                        className="form-input"
                        rows="4"
                        placeholder="Detail your question..."
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        style={{ resize: "none" }}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Submit Query Ticket</button>
                  </form>
                </div>

                {/* History list */}
                <div className="glass-panel" style={styles.doubtHistoryCard}>
                  <h2 style={{ ...styles.formTitle, marginBottom: "15px" }}>Active Tickets ({tickets.length})</h2>
                  <div style={styles.ticketList}>
                    {tickets.map((t) => (
                      <div key={t.id} style={styles.ticketItem}>
                        <div style={styles.ticketItemHeader}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: t.status === "Resolved" ? "rgba(16, 185, 129, 0.1)" : "rgba(251, 191, 36, 0.1)",
                            color: t.status === "Resolved" ? "var(--accent-emerald)" : "#fbbf24",
                            border: t.status === "Resolved" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(251, 191, 36, 0.3)"
                          }}>
                            {t.status}
                          </span>
                          <span style={styles.ticketDateText}>{t.date}</span>
                        </div>
                        <h4 style={styles.ticketSubjectText}>{t.subject}</h4>
                        <p style={styles.ticketCategoryTag}>{t.category}</p>
                        {t.reply && (
                          <div style={styles.ticketReplyBox}>
                            <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--accent-primary)", marginBottom: "4px" }}>📨 Instructor Response:</p>
                            <p style={{ fontSize: "0.85rem", color: "#fff" }}>{t.reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY PROFILE */}
            {activeTab === "profile" && (
              <div style={styles.profileGrid}>
                <div className="glass-panel" style={styles.profileCard}>
                  <h2 style={{ ...styles.formTitle, marginBottom: "20px" }}>Portal Access Details</h2>
                  <div style={styles.profileDetailGroup}>
                    <span style={styles.profileDetailLabel}>Student Profile Name</span>
                    <p style={styles.profileDetailVal}>{studentInfo.name}</p>
                  </div>
                  <div style={styles.profileDetailGroup}>
                    <span style={styles.profileDetailLabel}>Registered Email</span>
                    <p style={styles.profileDetailVal}>{studentInfo.email}</p>
                  </div>
                  <div style={styles.profileDetailGroup}>
                    <span style={styles.profileDetailLabel}>Batch Curriculum</span>
                    <p style={styles.profileDetailVal}>{studentInfo.course}</p>
                  </div>
                </div>

                <div className="glass-panel" style={styles.profileCard}>
                  <h2 style={{ ...styles.formTitle, marginBottom: "20px" }}>Change Password Key</h2>
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-input" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>Update Credentials</button>
                  </form>
                </div>
              </div>
            )}
          </>
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
    background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)",
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
    color: "var(--accent-primary)",
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
  studentProfile: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  studentAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-primary)",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
  studentName: {
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  studentEmail: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
  programBadge: {
    fontSize: "0.85rem",
    fontWeight: 600,
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    color: "#a5b4fc",
    padding: "6px 14px",
    borderRadius: "20px",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-secondary)",
    fontSize: "1.2rem",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  welcomeBanner: {
    padding: "35px",
    borderRadius: "var(--border-radius-lg)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.5) 100%)",
  },
  progressGaugeCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "rgba(255,255,255,0.03)",
    padding: "15px 24px",
    borderRadius: "var(--border-radius-md)",
    border: "1px solid var(--border-color)",
  },
  gaugeContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  svgWheel: {
    transform: "rotate(-90deg)",
  },
  wheelTrack: {
    fill: "none",
    stroke: "rgba(255,255,255,0.05)",
    strokeWidth: 3.2,
  },
  wheelFill: {
    fill: "none",
    strokeWidth: 3.2,
    strokeLinecap: "round",
    transition: "stroke-dasharray 0.3s ease",
  },
  gaugeText: {
    position: "absolute",
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff",
  },
  deskGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr",
    gap: "24px",
  },
  announcementCard: {
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
  },
  announcementItem: {
    padding: "16px 0",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  announcementBadge: {
    display: "inline-block",
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "4px",
    background: "rgba(6, 182, 212, 0.15)",
    color: "var(--accent-cyan)",
    fontWeight: 600,
    marginBottom: "8px",
  },
  announcementText: {
    fontSize: "0.9rem",
    lineHeight: "1.5",
    color: "var(--text-primary)",
    marginBottom: "4px",
  },
  announcementDate: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  scheduleCard: {
    padding: "24px",
    borderRadius: "var(--border-radius-md)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statLogItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    fontSize: "0.9rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  examSelectionCard: {
    padding: "28px",
    borderRadius: "var(--border-radius-lg)",
    display: "flex",
    flexDirection: "column",
  },
  directoryCard: {
    padding: "35px",
    borderRadius: "var(--border-radius-lg)",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
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
  doubtContainer: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "24px",
  },
  doubtFormCard: {
    padding: "30px",
    borderRadius: "var(--border-radius-lg)",
  },
  form: {
    width: "100%",
  },
  doubtHistoryCard: {
    padding: "30px",
    borderRadius: "var(--border-radius-lg)",
    maxHeight: "600px",
    display: "flex",
    flexDirection: "column",
  },
  ticketList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  ticketItem: {
    padding: "16px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--border-radius-md)",
  },
  ticketItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  ticketDateText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
  },
  ticketSubjectText: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff",
    marginBottom: "4px",
  },
  ticketCategoryTag: {
    fontSize: "0.8rem",
    color: "var(--text-secondary)",
    marginBottom: "12px",
  },
  ticketReplyBox: {
    background: "rgba(99, 102, 241, 0.05)",
    borderLeft: "2px solid var(--accent-primary)",
    padding: "10px 14px",
    borderRadius: "0 6px 6px 0",
    marginTop: "8px",
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  profileCard: {
    padding: "30px",
    borderRadius: "var(--border-radius-lg)",
  },
  profileDetailGroup: {
    padding: "16px 0",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  profileDetailLabel: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    display: "block",
    marginBottom: "4px",
  },
  profileDetailVal: {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#fff",
  },
  legendBox: {
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  modalCard: {
    width: "100%",
    maxHeight: "90vh",
    maxWidth: "420px",
    padding: "40px",
    borderRadius: "var(--border-radius-lg)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    animation: "fadeIn 0.25s ease-out",
  }
};
