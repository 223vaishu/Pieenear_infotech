"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("desk"); // 'desk', 'exams', 'certificates', 'doubt', 'profile'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  // Study Desk / Course Curriculum state
  const [quizProgress, setQuizProgress] = useState({}); // { 1: true/false, ... }
  const [expandedWeek, setExpandedWeek] = useState(null); // number (1-4) or null
  const [selectedQuizOption, setSelectedQuizOption] = useState({}); // { weekNum: optionString }
  const [quizFeedback, setQuizFeedback] = useState({}); // { weekNum: { isCorrect, text } }

  // Theme settings state
  const [theme, setTheme] = useState("light");

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    showToast(`Display mode updated to ${newTheme === "light" ? "Light" : "Dark"}!`, "success");
  };

  // Initial load
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "student") {
      router.push("/login");
      return;
    }

    // Load Student Info
    const current = localStorage.getItem("currentStudent");
    let email = "student@pieenear.com";
    if (current) {
      const parsed = JSON.parse(current);
      setStudentInfo(parsed);
      email = parsed.email;
    } else {
      const defaultStudent = {
        name: "Alex Mercer",
        email: "student@pieenear.com",
        course: "Web Development",
        joinedDate: "June 2026",
        status: "Active"
      };
      localStorage.setItem("currentStudent", JSON.stringify(defaultStudent));
      setStudentInfo(defaultStudent);
      email = defaultStudent.email;
    }

    // Load Quiz Progress
    const savedQuizProgress = localStorage.getItem(`pieenear_quiz_progress_${email.toLowerCase()}`);
    if (savedQuizProgress) {
      setQuizProgress(JSON.parse(savedQuizProgress));
    } else {
      const initialProgress = { 1: false, 2: false, 3: false, 4: false };
      localStorage.setItem(`pieenear_quiz_progress_${email.toLowerCase()}`, JSON.stringify(initialProgress));
      setQuizProgress(initialProgress);
    }

    // Load & Seed Exams
    const storedExams = localStorage.getItem("pieenear_exams");
    let needsSeeding = !storedExams;
    if (storedExams) {
      try {
        const parsed = JSON.parse(storedExams);
        if (parsed.length === 0 || !parsed[0].course) {
          needsSeeding = true;
        }
      } catch (e) {
        needsSeeding = true;
      }
    }

    if (!needsSeeding) {
      setExams(JSON.parse(storedExams));
    } else {
      const initialExams = [
        {
          id: "ex-web",
          title: "Web Development Final Evaluation",
          course: "Web Development",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "Which HTML5 semantic element is most suitable for site navigation links?", optionA: "section", optionB: "article", optionC: "nav", optionD: "aside", correctOption: "C", marks: 5 },
            { text: "Which CSS property specifies a grid container layout?", optionA: "display: grid", optionB: "display: flex", optionC: "display: inline", optionD: "display: block", correctOption: "A", marks: 5 }
          ]
        },
        {
          id: "ex-app",
          title: "App Development Final Evaluation",
          course: "App Development",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "Which architecture is optimized for single-codebase cross-platform mobile apps?", optionA: "Kotlin Native", optionB: "Swift Native", optionC: "Cross-Platform Framework", optionD: "Java VM", correctOption: "C", marks: 5 },
            { text: "What is the default Flexbox layout direction in React Native?", optionA: "row", optionB: "column", optionC: "row-reverse", optionD: "column-reverse", correctOption: "B", marks: 5 }
          ]
        },
        {
          id: "ex-uiux",
          title: "UI/UX Design Certification Challenge",
          course: "UI ux",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "What is the first fundamental phase of the Design Thinking framework?", optionA: "Ideate", optionB: "Define", optionC: "Empathize", optionD: "Prototype", correctOption: "C", marks: 5 },
            { text: "Which Figma layout feature automatically handles dynamic padding and row flow?", optionA: "Smart Animate", optionB: "Auto-Layout", optionC: "Group grids", optionD: "Component states", correctOption: "B", marks: 5 }
          ]
        },
        {
          id: "ex-aiml",
          title: "AI/ML Basics Certification Exam",
          course: "AI/ML basic",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "Which Python package is specialized for high-performance array and matrix mathematics?", optionA: "Matplotlib", optionB: "NumPy", optionC: "Pandas", optionD: "PyTorch", correctOption: "C", marks: 5 },
            { text: "What clustering algorithm iteratively clusters data around distance centroids?", optionA: "K-Means", optionB: "Linear Regression", optionC: "Decision Tree", optionD: "SVM", correctOption: "A", marks: 5 }
          ]
        },
        {
          id: "ex-sysdesign",
          title: "System Design Basic Final Exam",
          course: "System desgin basic",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "What is horizontal scaling in server architecture?", optionA: "Adding memory to a server", optionB: "Adding CPU capacity to a server", optionC: "Adding more server nodes to the pool", optionD: "Increasing DB cache sizes", correctOption: "C", marks: 5 },
            { text: "According to CAP theorem, which property is traded off in a network partition failure?", optionA: "Caching", optionB: "Performance", optionC: "Consistency or Availability", optionD: "Consistency or Availability", correctOption: "C", marks: 5 }
          ]
        },
        {
          id: "ex-pm",
          title: "Product Management Evaluation Challenge",
          course: "product mangement",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "Which PM canvas maps vision, cost structure, and channels on a single page?", optionA: "RICE metric", optionB: "PRD canvas", optionC: "Lean Canvas", optionD: "MoSCoW list", correctOption: "C", marks: 5 },
            { text: "In feature prioritization, what does the R in RICE metric represent?", optionA: "Revenue", optionB: "Reach", optionC: "Retention", optionD: "Role", correctOption: "B", marks: 5 }
          ]
        },
        {
          id: "ex-flutter",
          title: "Flutter Development Basic Evaluation",
          course: "Flutter development basic",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "Which Flutter widget is used to align items vertically?", optionA: "Row", optionB: "Column", optionC: "Scaffold", optionD: "Center", correctOption: "B", marks: 5 },
            { text: "Which class acts as the notifyListeners sender inside Flutter Provider layouts?", optionA: "BuildContext", optionB: "Navigator", optionC: "ChangeNotifier", optionD: "Consumer", correctOption: "C", marks: 5 }
          ]
        },
        {
          id: "ex-java",
          title: "Java Basics Certification Exam",
          course: "Java basic",
          duration: 10,
          passingGrade: 70,
          questions: [
            { text: "What system executes Java bytecode dynamically?", optionA: "JDK Compiler", optionB: "JVM (Java Virtual Machine)", optionC: "System Kernel", optionD: "JRE Library", correctOption: "B", marks: 5 },
            { text: "Which OOP access modifier restricts visibility solely inside the declaring class?", optionA: "private", optionB: "public", optionC: "protected", optionD: "default", correctOption: "A", marks: 5 }
          ]
        }
      ];
      localStorage.setItem("pieenear_exams", JSON.stringify(initialExams));
      setExams(initialExams);
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

    // Update Supabase Auth password
    supabase.auth.updateUser({ password: newPassword })
      .then(({ data, error }) => {
        if (error) throw error;
        showToast("Password updated in Supabase Auth successfully!", "success");
        
        // Update local storage session metadata to sync password key
        if (studentInfo) {
          const updated = { ...studentInfo, password: newPassword };
          setStudentInfo(updated);
          localStorage.setItem("currentStudent", JSON.stringify(updated));
        }
      })
      .catch((err) => {
        showToast(err.message, "danger");
        // Fallback
        const stored = JSON.parse(localStorage.getItem("pieenear_students") || "[]");
        const updatedStored = stored.map((s) => {
          if (s.email.toLowerCase() === studentInfo.email.toLowerCase()) {
            return { ...s, password: newPassword };
          }
          return s;
        });
        localStorage.setItem("pieenear_students", JSON.stringify(updatedStored));
      })
      .finally(() => {
        setNewPassword("");
        setConfirmPassword("");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentStudent");
    router.push("/login");
  };

  const handleQuizSubmit = (weekNum, selectedOption, correctAnswer, explanation) => {
    const isCorrect = selectedOption === correctAnswer;
    
    setQuizFeedback((prev) => ({
      ...prev,
      [weekNum]: {
        isCorrect,
        text: isCorrect 
          ? `Correct! ${explanation}` 
          : `Incorrect. Try again! Hint: ${explanation.split(".")[0]}.`
      }
    }));

    if (isCorrect) {
      const updatedProgress = {
        ...quizProgress,
        [weekNum]: true
      };
      setQuizProgress(updatedProgress);
      localStorage.setItem(
        `pieenear_quiz_progress_${studentInfo.email.toLowerCase()}`,
        JSON.stringify(updatedProgress)
      );
      showToast(`Week ${weekNum} checkpoint completed successfully!`, "success");
    } else {
      showToast(`Incorrect answer for Week ${weekNum} quiz. Try again!`, "danger");
    }
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

  // Filter assigned exams (those that match the student's course and haven't been completed)
  const studentCourse = studentInfo.course || "";
  const myAvailableExams = exams.filter(ex => 
    (ex.course || "").trim().toLowerCase() === studentCourse.trim().toLowerCase() &&
    !results.some(r => r.examId === ex.id && r.studentEmail.toLowerCase() === studentInfo.email.toLowerCase())
  );

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

      {/* Mobile Header */}
      {!activeExam && (
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
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Pieenear</span>
          </div>
          <div style={{ width: "22px" }}></div>
        </div>
      )}

      {/* Sidebar Scrim Overlay */}
      {!activeExam && (
        <div className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`} onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar navigation */}
      {!activeExam && (
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} style={styles.sidebar}>
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
              onClick={() => { setActiveTab("desk"); setSidebarOpen(false); }}
            >
              💻 My Study Desk
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "exams" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "exams" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => { setActiveTab("exams"); setSidebarOpen(false); }}
            >
              📝 Exams Workspace
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "certificates" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "certificates" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => { setActiveTab("certificates"); setSidebarOpen(false); }}
            >
              🏆 Certificates Vault
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "doubt" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "doubt" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => { setActiveTab("doubt"); setSidebarOpen(false); }}
            >
              🙋 Doubt Support
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: activeTab === "profile" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: activeTab === "profile" ? "var(--accent-primary)" : "var(--text-secondary)"
              }}
              onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}
            >
              ⚙️ Settings & Profile
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
      <main className={`main-content ${activeExam ? 'exam-mode' : ''}`} style={styles.main}>
        
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

                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: "20px", color: "var(--text-primary)", lineHeight: 1.5 }}>
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
                    style={{ borderColor: markedQuestions.has(currentQIdx) ? "#f59e0b" : "var(--border-color)", color: markedQuestions.has(currentQIdx) ? "#f59e0b" : "var(--text-primary)" }}
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
                  {activeTab === "profile" && "Settings & Profile"}
                </h1>
                <p style={styles.subtitleText}>Track curriculum progress, complete evaluations, and claim credentials.</p>
              </div>
            </header>

            {/* TAB CONTROLS */}

            {/* STUDY DESK */}
            {activeTab === "desk" && (() => {
              const currentCourse = courseData[studentInfo.course] || courseData["Web Development"];
              const completedCount = Object.values(quizProgress).filter(Boolean).length;
              const quizPercentage = Math.round((completedCount / 4) * 100);

              return (
                <div className="animate-fade-in" style={styles.section}>
                  {/* Welcome Card */}
                  <div className="glass-panel" style={styles.welcomeBanner}>
                    <div>
                      <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>
                        Welcome back, <span className="gradient-text">{studentInfo.name}</span>!
                      </h2>
                      <p style={{ color: "var(--text-secondary)", maxWidth: "550px", fontSize: "0.95rem", lineHeight: "1.5" }}>
                        Track your 1-month certification curriculum, complete weekly quizzes, and review your assigned study notes.
                      </p>
                    </div>
                    <div style={styles.progressGaugeCard}>
                      <div style={styles.gaugeContainer}>
                        <svg width="80" height="80" viewBox="0 0 36 36" style={styles.svgWheel}>
                          <path style={styles.wheelTrack} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path
                            style={{
                              ...styles.wheelFill,
                              strokeDasharray: `${quizPercentage}, 100`,
                              stroke: "var(--accent-primary)"
                            }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div style={styles.gaugeText}>
                          {quizPercentage}%
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                          {myResults.some(r => r.status === "Pass") ? "Graduated" : "In Progress"}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Syllabus progress</p>
                      </div>
                    </div>
                  </div>

                  <div className="desk-grid">
                    {/* 4-Week Interactive Roadmap */}
                    <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <h3 style={{ ...styles.cardTitle, borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "5px" }}>
                        🗓️ 4-Week Interactive Roadmap
                      </h3>
                      <div>
                        {currentCourse.weeks.map((wk) => {
                          const isCompleted = quizProgress[wk.week];
                          const isExpanded = expandedWeek === wk.week;
                          const feedback = quizFeedback[wk.week];
                          const selectedOption = selectedQuizOption[wk.week];

                          return (
                            <div key={wk.week} style={styles.accordionItem}>
                              <div 
                                style={{
                                  ...styles.accordionHeader,
                                  ...(isExpanded ? styles.accordionHeaderExpanded : {})
                                }}
                                onClick={() => setExpandedWeek(isExpanded ? null : wk.week)}
                              >
                                <span style={styles.accordionTitle}>
                                  {isCompleted ? "✅" : "📖"} {wk.title}
                                </span>
                                <span style={isCompleted ? styles.weekCompletedBadge : styles.weekPendingBadge}>
                                  {isCompleted ? "Completed" : "In Progress"}
                                </span>
                              </div>
                              {isExpanded && (
                                <div style={styles.accordionContent}>
                                  <div>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "8px" }}>🔑 Key Concepts</h4>
                                    <ul style={{ paddingLeft: "20px", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
                                      {wk.topics.map((t, idx) => (
                                        <li key={idx} style={{ marginBottom: "4px" }}>{t}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "8px" }}>📚 Study Notes</h4>
                                    <div style={styles.readingContainer}>
                                      {wk.readings}
                                    </div>
                                  </div>

                                  {/* Weekly Concept Review Quiz */}
                                  <div style={styles.quizSection}>
                                    <h4 style={styles.quizQuestion}>📝 Week {wk.week} Review Checkpoint</h4>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                                      {wk.quiz.question}
                                    </p>
                                    <div style={styles.quizOptionsGrid}>
                                      {wk.quiz.options.map((opt) => {
                                        const isSelected = selectedOption === opt;
                                        let optionStyle = { ...styles.quizOptionBtn };
                                        
                                        if (isSelected) {
                                          optionStyle = { ...optionStyle, ...styles.quizOptionBtnSelected };
                                        }
                                        if (isCompleted && opt === wk.quiz.answer) {
                                          optionStyle = { ...optionStyle, ...styles.quizOptionBtnCorrect };
                                        } else if (isCompleted && isSelected && opt !== wk.quiz.answer) {
                                          optionStyle = { ...optionStyle, ...styles.quizOptionBtnIncorrect };
                                        } else if (feedback && isSelected) {
                                          if (feedback.isCorrect) {
                                            optionStyle = { ...optionStyle, ...styles.quizOptionBtnCorrect };
                                          } else {
                                            optionStyle = { ...optionStyle, ...styles.quizOptionBtnIncorrect };
                                          }
                                        }

                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            disabled={isCompleted}
                                            style={optionStyle}
                                            onClick={() => setSelectedQuizOption({
                                              ...selectedQuizOption,
                                              [wk.week]: opt
                                            })}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {!isCompleted && selectedOption && (
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ width: "100%", padding: "10px", fontSize: "0.9rem" }}
                                        onClick={() => handleQuizSubmit(wk.week, selectedOption, wk.quiz.answer, wk.quiz.explanation)}
                                      >
                                        Submit Answer Check
                                      </button>
                                    )}

                                    {isCompleted && (
                                      <div style={{ ...styles.quizFeedbackAlert, ...styles.quizFeedbackCorrect }}>
                                        ✨ <strong>Completed:</strong> You successfully passed this week's checkpoint.
                                        <p style={{ marginTop: "4px", fontSize: "0.85rem", opacity: 0.9 }}>
                                          {wk.quiz.explanation}
                                        </p>
                                      </div>
                                    )}

                                    {!isCompleted && feedback && !feedback.isCorrect && (
                                      <div style={{ ...styles.quizFeedbackAlert, ...styles.quizFeedbackIncorrect }}>
                                        ⚠️ {feedback.text}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Sidebar Info Cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {/* Program Details Card */}
                      <div className="glass-panel" style={styles.announcementCard}>
                        <h3 style={{ ...styles.cardTitle, borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "15px" }}>📋 Program Details</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700 }}>ASSIGNED COURSE</span>
                          <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>{studentInfo.course}</h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4", marginTop: "4px" }}>
                            {currentCourse.tagline}
                          </p>
                          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                              <span style={{ color: "var(--text-muted)" }}>Syllabus Completed</span>
                              <strong style={{ color: "var(--accent-emerald)" }}>{completedCount} of 4 Weeks</strong>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                              <div 
                                style={{ 
                                  width: `${(completedCount / 4) * 100}%`, 
                                  height: "100%", 
                                  background: "linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)",
                                  transition: "width 0.3s ease"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fast Summary */}
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

                      {/* Announcements */}
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
                    </div>
                  </div>
                </div>
              );
            })()}

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
                          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{ex.title}</h4>
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
                            <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{t.reply}</p>
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
                  <div style={{ ...styles.profileDetailGroup, borderBottom: "none", paddingBottom: 0 }}>
                    <span style={styles.profileDetailLabel}>Display Theme Mode</span>
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                      <button
                        onClick={() => handleThemeChange("light")}
                        className={`btn ${theme === "light" ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                      >
                        ☀️ Light Mode (Default)
                      </button>
                      <button
                        onClick={() => handleThemeChange("dark")}
                        className={`btn ${theme === "dark" ? "btn-primary" : "btn-secondary"}`}
                        style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                      >
                        🌙 Dark Mode
                      </button>
                    </div>
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
    color: "var(--accent-primary)",
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
    background: "var(--bg-card)",
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
    stroke: "var(--border-color)",
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
    color: "var(--text-primary)",
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
    color: "var(--accent-primary)",
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
    color: "var(--text-primary)",
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
    color: "var(--text-primary)",
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
  },
  accordionItem: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--border-radius-md)",
    marginBottom: "16px",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  accordionHeader: {
    padding: "18px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,0.01)",
    borderBottom: "1px solid transparent",
    transition: "background 0.2s ease",
  },
  accordionHeaderExpanded: {
    background: "rgba(99, 102, 241, 0.05)",
    borderBottom: "1px solid var(--border-color)",
  },
  accordionTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  weekCompletedBadge: {
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: "20px",
    background: "rgba(16, 185, 129, 0.15)",
    color: "var(--accent-emerald)",
    fontWeight: 600,
  },
  weekPendingBadge: {
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.05)",
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  accordionContent: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  readingContainer: {
    background: "rgba(255, 255, 255, 0.01)",
    border: "1px dashed var(--border-color)",
    borderRadius: "var(--border-radius-md)",
    padding: "16px",
    fontSize: "0.92rem",
    lineHeight: "1.6",
    color: "var(--text-secondary)",
  },
  quizSection: {
    background: "rgba(99, 102, 241, 0.03)",
    border: "1px solid rgba(99, 102, 241, 0.1)",
    borderRadius: "var(--border-radius-md)",
    padding: "20px",
  },
  quizQuestion: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "16px",
  },
  quizOptionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  quizOptionBtn: {
    padding: "12px 16px",
    borderRadius: "var(--border-radius-md)",
    border: "1px solid var(--border-color)",
    background: "rgba(255,255,255,0.02)",
    color: "var(--text-secondary)",
    fontSize: "0.88rem",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  quizOptionBtnSelected: {
    borderColor: "var(--accent-primary)",
    background: "rgba(99, 102, 241, 0.1)",
    color: "var(--text-primary)",
  },
  quizOptionBtnCorrect: {
    borderColor: "rgba(16, 185, 129, 0.4)",
    background: "rgba(16, 185, 129, 0.1)",
    color: "var(--accent-emerald)",
  },
  quizOptionBtnIncorrect: {
    borderColor: "rgba(244, 63, 94, 0.4)",
    background: "rgba(244, 63, 94, 0.1)",
    color: "var(--accent-rose)",
  },
  quizFeedbackAlert: {
    padding: "14px 16px",
    borderRadius: "var(--border-radius-md)",
    fontSize: "0.9rem",
    lineHeight: "1.5",
    marginTop: "12px",
  },
  quizFeedbackCorrect: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "var(--accent-emerald)",
  },
  quizFeedbackIncorrect: {
    background: "rgba(244, 63, 94, 0.1)",
    border: "1px solid rgba(244, 63, 94, 0.2)",
    color: "var(--accent-rose)",
  }
};

const courseData = {
  "Web Development": {
    tagline: "Master modern full-stack web engineering, from layout design to interactive client-side routing and performance optimization.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Semantic HTML5, CSS Flexbox & CSS Grid",
        topics: [
          "HTML5 semantic structure elements (header, footer, nav, article, section)",
          "Flexbox 1D layout alignments, justification, and dynamic wraps",
          "Grid 2D layouts using templates, areas, autofill, and grid gaps"
        ],
        readings: "Web page structures rely on semantic HTML5 tags for accessibility and SEO. For layout flow, use Flexbox when aligning items along a single axis (row or column). Use CSS Grid when creating complex multi-dimensional page structures. Avoid legacy floats and tables for general layout design.",
        quiz: {
          question: "Which HTML5 semantic element is most suitable for containing site navigation links?",
          options: ["<section>", "<article>", "<nav>", "<aside>"],
          answer: "<nav>",
          explanation: "The <nav> element is designed specifically for primary navigation links, enhancing accessibility and SEO indexing."
        }
      },
      {
        week: 2,
        title: "Week 2: Advanced JavaScript (ES6+), DOM Controls & Events",
        topics: [
          "Block scoped variables (let, const) and arrow functions",
          "Array methods (.map(), .filter(), .reduce())",
          "Asynchronous flow using Promises, async/await, and Fetch API"
        ],
        readings: "Modern JavaScript uses ES6 features like block scoping, arrow functions, and array helper functions. Use filter() to build arrays matching conditions, and map() to transform values. Wrap network requests in async/await blocks to gracefully handle success and failures.",
        quiz: {
          question: "Which array method creates a new array with all elements that pass the test implemented by the provided function?",
          options: [".map()", ".filter()", ".reduce()", ".forEach()"],
          answer: ".filter()",
          explanation: "The .filter() method executes a test callback on each element and returns a new array containing only the elements that returned true."
        }
      },
      {
        week: 3,
        title: "Week 3: React.js Component Architecture & Hooks",
        topics: [
          "JSX elements, props validation, and state reactivity",
          "Component lifecycle mapping using useState and useEffect hooks",
          "Lifting state up and handling user input forms"
        ],
        readings: "React builds user interfaces by combining reusable component pieces. State represents internal component memory, managed via useState. Use useEffect to synchronize your components with external systems, like APIs, tracking state changes via the dependency array.",
        quiz: {
          question: "Which hook is used to perform side effects, such as API fetching or page subscriptions, in React functional components?",
          options: ["useState", "useContext", "useEffect", "useRef"],
          answer: "useEffect",
          explanation: "The useEffect hook lets you run side-effects after rendering, like data fetching, manual DOM updates, or setting up intervals."
        }
      },
      {
        week: 4,
        title: "Week 4: Production Deployment & Performance Tuning",
        topics: [
          "Next.js build compilation and static site generation",
          "Enabling CORS headers and securing API endpoints",
          "Image optimizations and component lazy loading"
        ],
        readings: "Before shipping web apps, compile source code into optimal bundles. Use Next.js optimizations like next/image and code-splitting (lazy loading) to speed up initial loads. Secure your backend routes by properly restricting Cross-Origin Resource Sharing (CORS) access headers.",
        quiz: {
          question: "Which HTTP header is typically used to enable Cross-Origin Resource Sharing (CORS)?",
          options: ["Access-Control-Allow-Origin", "Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security"],
          answer: "Access-Control-Allow-Origin",
          explanation: "The Access-Control-Allow-Origin header is returned by servers to allow browsers to access resources from authorized origin domains."
        }
      }
    ]
  },
  "App Development": {
    tagline: "Build native and cross-platform mobile applications for iOS and Android with modern user experience principles.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Mobile Ecosystems & Native Architectures",
        topics: [
          "Android Runtime (ART) vs iOS Cocoa Touch system layers",
          "Native development (Kotlin/Swift) vs Cross-Platform hybrid approaches",
          "Mobile design considerations: battery life, background threads, and offline sync"
        ],
        readings: "Mobile operating systems prioritize energy efficiency and resource constraints. Swift and Kotlin provide high-performance native binaries for iOS and Android. Cross-platform frameworks translate single codebases into native layouts. Always delegate long-running tasks off the main UI thread.",
        quiz: {
          question: "Which operating system uses Cocoa Touch framework as its core user interface framework?",
          options: ["Android", "iOS", "Windows Phone", "Tizen"],
          answer: "iOS",
          explanation: "Cocoa Touch is the application development framework for building user interfaces on Apple's iOS device line."
        }
      },
      {
        week: 2,
        title: "Week 2: React Native Core Widgets & Flexbox Layouts",
        topics: [
          "Core elements: View, Text, Image, and TextInput",
          "Custom stylesheet styling constraints and layout engines",
          "Dynamic scrolling lists using ScrollView vs FlatList components"
        ],
        readings: "React Native translates React components into native mobile views. Unlike web browsers, mobile styling uses a subset of Flexbox where the default layout direction is column. For long lists, always prefer FlatList as it recycles view cells to prevent high memory usage.",
        quiz: {
          question: "What component is used in React Native to scroll a generic list of items efficiently without loading the entire list into memory?",
          options: ["ScrollView", "FlatList", "ListView", "SectionList"],
          answer: "FlatList",
          explanation: "FlatList renders items lazily, creating UI rows only as they become visible on screen to conserve device RAM."
        }
      },
      {
        week: 3,
        title: "Week 3: State Management & Mobile App Navigation",
        topics: [
          "React Navigation architecture (Stack, Tabs, and Drawer navigators)",
          "Passing parameters across routing screens and navigation trees",
          "Global state patterns inside mobile sandboxes"
        ],
        readings: "Navigation in mobile apps resembles stack-based transitions. Use StackNavigator to push screens onto a history list, TabNavigator for persistent bottom bar tabs, and DrawerNavigator for slide-out menus. Keep navigation payloads clean of large data structures.",
        quiz: {
          question: "Which navigator in React Navigation is typically used for a drawer slide-out menu?",
          options: ["StackNavigator", "TabNavigator", "DrawerNavigator", "SwitchNavigator"],
          answer: "DrawerNavigator",
          explanation: "DrawerNavigator generates a menu drawer that slides in from the side of the screen when swiped or triggered."
        }
      },
      {
        week: 4,
        title: "Week 4: Deployment, Code Signing & App Store Publishing",
        topics: [
          "Configuring Info.plist (iOS) and AndroidManifest.xml details",
          "Certificates, provisioning profiles, and code signing steps",
          "Over-the-Air (OTA) updates and app store bundle releases"
        ],
        readings: "Publishing mobile apps requires strict code verification. Configure AndroidManifest.xml for permissions and Info.plist for iOS capabilities. Register certificates and signing credentials with Google and Apple before building APK/IPA bundles.",
        quiz: {
          question: "Which configuration file in iOS apps contains metadata like bundle identifiers and required device permissions?",
          options: ["AndroidManifest.xml", "App.js", "Info.plist", "build.gradle"],
          answer: "Info.plist",
          explanation: "Info.plist (Information Property List) is a structured key-value XML file containing foundational configurations for iOS apps."
        }
      }
    ]
  },
  "UI ux": {
    tagline: "Understand user-centric design methodologies, wireframing tools, typography systems, and prototyping methods.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Fundamentals of Design Thinking (Empathize & Define)",
        topics: [
          "The 5 steps of Design Thinking (Empathize, Define, Ideate, Prototype, Test)",
          "Building user personas, journey mapping, and empathy tables",
          "Formulating clear, user-focused problem statements"
        ],
        readings: "User Experience (UX) design is grounded in empathy. The Design Thinking process starts with understanding user pain points directly through observation and interviews. In the Define phase, designers compile research findings into structured target personas and actionable problem statements.",
        quiz: {
          question: "What is the primary goal of the Empathize phase in the Design Thinking framework?",
          options: ["Create rapid physical models", "Observe and understand user feelings and needs", "Define the core problem statement", "Test final designs with users"],
          answer: "Observe and understand user feelings and needs",
          explanation: "Empathize focuses on researching user needs, observing habits, and understanding motivations without assuming pre-conceived biases."
        }
      },
      {
        week: 2,
        title: "Week 2: Wireframing Layouts & Figma Tool Basics",
        topics: [
          "Low-fidelity sketches vs high-fidelity digital mockups",
          "Figma basics: frames, shapes, boolean operations, and groups",
          "Designing layouts dynamically using Figma Auto-Layout"
        ],
        readings: "Figma is the industry-standard collaborative vector design tool. Begin layouts with low-fidelity sketches before adding color or styles. In Figma, use Auto Layout to make elements responsive. Auto Layout dynamically shifts alignments when component sizes or text contents change.",
        quiz: {
          question: "Which Figma layout feature automatically handles dynamic padding and row flow when text labels resize?",
          options: ["Smart Animate", "Auto Layout", "Component Sets", "Interactive Components"],
          answer: "Auto Layout",
          explanation: "Auto Layout is a property you can add to frames that lets you create designs that grow or shrink dynamically."
        }
      },
      {
        week: 3,
        title: "Week 3: Color Theory, Visual Hierarchy & Typography Systems",
        topics: [
          "Color palettes (Monochromatic, Analogous, Complementary) and meanings",
          "Visual contrast guidelines, alignment grids, and spacing systems",
          "Selecting and pairing font families for web and mobile platforms"
        ],
        readings: "Visual design guides a user's attention through a interface. Establish clear visual hierarchies using size contrast, weights, and color accents. Ensure color combinations meet accessibility contrast scores (WCAG) so text remains readable to all user demographics.",
        quiz: {
          question: "Which type of color palette uses colors that are adjacent to each other on the standard color wheel?",
          options: ["Monochromatic", "Analogous", "Complementary", "Triadic"],
          answer: "Analogous",
          explanation: "Analogous color schemes use colors that sit next to each other on the color wheel, creating natural, harmonious layouts."
        }
      },
      {
        week: 4,
        title: "Week 4: Interactive Prototyping & Usability Evaluation",
        topics: [
          "Setting up interactive connections and animated state triggers",
          "Running usability testing, session logs, and observing user blockages",
          "Evaluating interfaces against Nielsen's 10 Usability Heuristics"
        ],
        readings: "Validate design assumptions before writing production code. Create interactive prototypes in Figma by linking button hotspots to target screens. Test prototype designs with actual users. Run heuristic evaluations to check for clear user feedback, undo controls, and consistency.",
        quiz: {
          question: "What is the primary purpose of conducting a design heuristic evaluation?",
          options: ["Write CSS styling tokens", "Evaluate UI against established usability principles", "Conduct user surveys", "Run A/B code deployments"],
          answer: "Evaluate UI against established usability principles",
          explanation: "Heuristic evaluation checks an interface design against a list of recognized usability guidelines, like system visibility and error prevention."
        }
      }
    ]
  },
  "AI/ML basic": {
    tagline: "Explore data processing libraries, core supervised algorithms, unsupervised clustering, and neural network foundations.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Mathematical Foundations & Python Libraries",
        topics: [
          "Linear algebra, probability vectors, and matrix dimensions",
          "NumPy arrays, slicing, broadcasting, and matrix operations",
          "Pandas DataFrames: data cleaning, indexing, and aggregations"
        ],
        readings: "Artificial Intelligence relies on linear algebra, statistics, and programming. Python serves as the primary language due to its specialized library ecosystems. Use NumPy for high-performance matrix math, and Pandas to read, clean, and manipulate tabular data files.",
        quiz: {
          question: "Which library is primary used for data analysis and structures like DataFrames in Python?",
          options: ["NumPy", "Pandas", "Matplotlib", "Scikit-Learn"],
          answer: "Pandas",
          explanation: "Pandas provides high-level data structures and manipulation functions designed to make data cleaning and analysis quick and easy."
        }
      },
      {
        week: 2,
        title: "Week 2: Supervised Learning (Regression & Trees)",
        topics: [
          "Linear regression formulas, cost functions, and Gradient Descent",
          "Classification models: Logistic Regression and Decision Trees",
          "Splitting datasets into training, validation, and test sections"
        ],
        readings: "Supervised learning models learn mappings from labeled inputs. Linear regression fits a line to continuous data by minimizing error margins. Decision Trees split data points sequentially based on descriptive features. Evaluate models by keeping test data separate.",
        quiz: {
          question: "In linear regression, what metric measures the proportion of variance in the dependent variable predictable from the independent variable?",
          options: ["Mean Absolute Error", "R-squared", "Silhouette Score", "Gini Impurity"],
          answer: "R-squared",
          explanation: "R-squared (coefficient of determination) measures how well the regression model fits the variance in the target dataset."
        }
      },
      {
        week: 3,
        title: "Week 3: Unsupervised Learning (Clustering & Dimensionality)",
        topics: [
          "K-Means Clustering: centroids, distances, and selecting K",
          "Dimensionality reduction with Principal Component Analysis (PCA)",
          "Anomaly detection models and feature engineering methods"
        ],
        readings: "Unsupervised learning works on unlabeled datasets to find hidden patterns. K-Means groups data points around calculated centers. Principal Component Analysis (PCA) reduces the number of dimensions in large datasets while retaining maximum variance.",
        quiz: {
          question: "What is the primary purpose of Principal Component Analysis (PCA) in machine learning?",
          options: ["Supervised Classification", "Dimensionality Reduction", "Clustering Outliers", "Hyperparameter Tuning"],
          answer: "Dimensionality Reduction",
          explanation: "PCA simplifies highly dimensional datasets into fewer main components, reducing computation costs while keeping essential patterns."
        }
      },
      {
        week: 4,
        title: "Week 4: Artificial Neural Networks & Deep Learning",
        topics: [
          "Perceptron architectures, weights, biases, and active layers",
          "Activation functions: Sigmoid, Hyperbolic Tangent (Tanh), and ReLU",
          "Backpropagation, loss optimizers, and neural training iterations"
        ],
        readings: "Deep learning models are built from stacked layer channels. A single node calculates weighted inputs, adds a bias, and passes the result through an activation function. Use Sigmoid for outputs representing probabilities, and ReLU for hidden layers to speed up gradient calculations.",
        quiz: {
          question: "Which activation function outputs values in the range [0, 1] and is commonly used for binary classification?",
          options: ["ReLU", "Sigmoid", "Tanh", "Softmax"],
          answer: "Sigmoid",
          explanation: "The Sigmoid activation function maps any real-valued number into a value between 0 and 1, making it perfect for outputting probabilities."
        }
      }
    ]
  },
  "System desgin basic": {
    tagline: "Learn scaling models, load balancing, caching systems, database schemas, and message queues in backend engineering.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Scaling Principles & Server Architectures",
        topics: [
          "Vertical scaling (scaling up) vs Horizontal scaling (scaling out)",
          "Designing stateful vs stateless application microservices",
          "System characteristics: availability, throughput, and latencies"
        ],
        readings: "System design coordinates multiple compute instances. Vertical scaling adds CPU/RAM to one machine, reaching hardware limits. Horizontal scaling adds more machines, calling for stateless architectures where any node can process incoming requests.",
        quiz: {
          question: "What is horizontal scaling (scaling out)?",
          options: ["Adding CPU and RAM resources to a single node", "Adding more server nodes to run in parallel", "Refactoring monolithic code into smaller functions", "Setting up a content delivery network"],
          answer: "Adding more server nodes to run in parallel",
          explanation: "Horizontal scaling scales out capacity by connecting multiple servers to a network pool, providing elastic availability."
        }
      },
      {
        week: 2,
        title: "Week 2: Load Balancing, Caches & CDN Deliveries",
        topics: [
          "Load balancers: Nginx, round-robin routes, and sticky sessions",
          "Caching strategies (write-through, cache-aside) using Redis",
          "Content Delivery Networks (CDNs) for static edge distribution"
        ],
        readings: "Speed up response cycles using caches. Load balancers distribute requests across servers to prevent bottlenecks. Use Redis as a cache-aside database layer for hot records. Distribute static assets globally at edge nodes using CDNs.",
        quiz: {
          question: "Which load balancing algorithm selects servers based on sequential distribution order?",
          options: ["Least Connections", "IP Hash", "Round Robin", "Weighted Least Connections"],
          answer: "Round Robin",
          explanation: "Round Robin distributes incoming traffic in circular order, sending the next request to the next server in line."
        }
      },
      {
        week: 3,
        title: "Week 3: Databases, Sharding, Replication & CAP Theorem",
        topics: [
          "SQL vs NoSQL: schemas, indexes, joins, and scaling models",
          "Database scaling: read replicas, primary-replica writes, and sharding",
          "The CAP Theorem: Consistency, Availability, and Partition Tolerance"
        ],
        readings: "Databases organize application state. SQL databases guarantee transactional safety (ACID). NoSQL databases scale horizontally by relaxing constraints. The CAP Theorem proves that a partitioned network must trade off Consistency or Availability.",
        quiz: {
          question: "According to the CAP Theorem, in the presence of a network partition (P), what trade-off must a system make?",
          options: ["Speed vs Reliability", "Consistency vs Availability", "Security vs Latency", "Sharding vs Replication"],
          answer: "Consistency vs Availability",
          explanation: "The CAP Theorem states that in the event of a network partition, a distributed system must choose between Consistency or Availability."
        }
      },
      {
        week: 4,
        title: "Week 4: Message Queues & Fault Tolerance Patterns",
        topics: [
          "Asynchronous messaging: RabbitMQ, Apache Kafka, and pub-sub layers",
          "System resilience: circuit breakers, retry backoffs, and rate limiting",
          "Monitoring systems, heartbeat nodes, and disaster recovery processes"
        ],
        readings: "Decouple microservices using async message queues like RabbitMQ or Kafka. This lets slow tasks run in the background. Protect system health using rate limiters and circuit breakers, which temporarily cut off failing dependencies to prevent cascade crashes.",
        quiz: {
          question: "Which component acts as a buffer to decouple service communication in event-driven systems?",
          options: ["API Gateway", "Message Broker (e.g. RabbitMQ)", "Distributed Cache", "Reverse Proxy"],
          answer: "Message Broker (e.g. RabbitMQ)",
          explanation: "Message brokers act as middle layers that accept, store, and deliver messages asynchronously between distinct services."
        }
      }
    ]
  },
  "product mangement": {
    tagline: "Discover product development lifecycles, Agile and Scrum methods, RICE frameworks, and analytics metrics.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Product Lifecycle & Vision Definition",
        topics: [
          "Product Lifecycle stages: Introduction, Growth, Maturity, Decline",
          "Defining target segments, user problem spaces, and core value propositions",
          "Structuring Minimum Viable Product (MVP) feature scopes"
        ],
        readings: "Product managers coordinate cross-functional teams to build solutions. The product lifecycle tracks a product from introduction to decline. Focus initially on an MVP: the simplest set of features needed to validate a concept with users.",
        quiz: {
          question: "What stage of the Product Lifecycle is focused on scaling customer acquisition and refining the product?",
          options: ["Introduction", "Growth", "Maturity", "Decline"],
          answer: "Growth",
          explanation: "The Growth phase is characterized by rapid user acquisition, feature expansion, and scaling marketing and engineering operations."
        }
      },
      {
        week: 2,
        title: "Week 2: Agile Methodologies & Scrum Frameworks",
        topics: [
          "Agile manifesto principles vs traditional waterfall development",
          "Scrum roles: Product Owner, Scrum Master, and Developers",
          "Sprint cycles: planning meetings, daily standups, and reviews"
        ],
        readings: "Agile prioritizes iterative development. Scrum organizes work into short Sprints (usually 2 weeks). The Product Owner manages backlog prioritization, the Scrum Master resolves process obstacles, and Developers write the software.",
        quiz: {
          question: "In Scrum, who is responsible for managing the Product Backlog prioritization?",
          options: ["Scrum Master", "Product Owner", "Lead Developer", "Project Manager"],
          answer: "Product Owner",
          explanation: "The Product Owner is solely responsible for prioritizing backlog items to align with user needs and business goals."
        }
      },
      {
        week: 3,
        title: "Week 3: Prioritization Frameworks & Product Strategy",
        topics: [
          "RICE prioritization (Reach, Impact, Confidence, Effort)",
          "MoSCoW categorization (Must have, Should have, Could have, Won't have)",
          "Mapping business ideas using the Lean Product Canvas"
        ],
        readings: "PMs must decide what features to build first under constraint. Use the RICE framework: (Reach * Impact * Confidence) / Effort to score ideas. Apply MoSCoW limits to determine absolute requirements for product releases.",
        quiz: {
          question: "What does the 'E' stand for in the RICE prioritization framework?",
          options: ["Execution", "Efficiency", "Effort", "Engagement"],
          answer: "Effort",
          explanation: "Effort estimates the total person-weeks or hours required from the team to complete a feature."
        }
      },
      {
        week: 4,
        title: "Week 4: Product Analytics & Analytics Metrics",
        topics: [
          "Selecting North Star metrics and Key Performance Indicators (KPIs)",
          "AARRR framework: Acquisition, Activation, Retention, Referral, Revenue",
          "A/B testing flows, user tracking, and product feedback loops"
        ],
        readings: "Measure product success using metrics. The AARRR pirate metrics map user actions from first sign-up to payment. Identify a North Star Metric: the key measure of customer value. Validate new ideas with A/B experiments.",
        quiz: {
          question: "Which North Star Metric is most critical for evaluating daily retention in messaging platforms?",
          options: ["Monthly Active Users", "Daily Active Users / Monthly Active Users Ratio", "Net Promoter Score", "Customer Acquisition Cost"],
          answer: "Daily Active Users / Monthly Active Users Ratio",
          explanation: "The DAU/MAU ratio measures user engagement stickiness, indicating how frequently users return to the platform."
        }
      }
    ]
  },
  "Flutter development basic": {
    tagline: "Explore Dart programming, Widget trees, row/column layouts, and State Management in Flutter.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Dart Basics & Flutter Setup",
        topics: [
          "Dart variables, control flows, objects, and types",
          "Flutter setup, material design libraries, and pubspec.yaml assets",
          "Entry functions: void main() and runApp() blocks"
        ],
        readings: "Flutter uses Apple's and Google's graphics engines to build multi-platform apps from one Dart codebase. Dart variables can be final (evaluated once at runtime) or const (evaluated at compile-time). Every app begins executing inside main().",
        quiz: {
          question: "Which Dart keyword is used to declare a variable whose value must be evaluated at compile-time?",
          options: ["final", "const", "var", "dynamic"],
          answer: "const",
          explanation: "The const keyword indicates a compile-time constant, which is optimized by the compiler to reside in read-only memory."
        }
      },
      {
        week: 2,
        title: "Week 2: Component Trees: Stateless vs Stateful Widgets",
        topics: [
          "The Widget Tree, Element Tree, and RenderObject Tree",
          "Stateless widgets for static view structures",
          "Stateful widgets: lifecycle stages and trigger updates using setState()"
        ],
        readings: "In Flutter, everything is a widget. Stateless widgets do not store internal state. Stateful widgets store state in a separate State object, triggering UI updates with the setState() method.",
        quiz: {
          question: "Which method is triggered when a Stateful Widget needs to redraw its layout with updated values?",
          options: ["build()", "initState()", "setState()", "dispose()"],
          answer: "setState()",
          explanation: "Calling setState() flags the framework that the internal state changed, scheduling a rebuild of the widget tree."
        }
      },
      {
        week: 3,
        title: "Week 3: Flutter Layouts & Multi-child Containers",
        topics: [
          "Standard layout widgets: Row, Column, Container, and Padding",
          "Flexible alignments: Expanded, Flexible, and Spacer elements",
          "Layering widgets using Stack and Positioned coordinates"
        ],
        readings: "Coordinate multi-child UI layouts in Flutter. Use Row to arrange children horizontally, Column to arrange them vertically, and Stack to overlap elements on top of each other. Use Expanded to fill remaining screen space.",
        quiz: {
          question: "Which widget allows children to overlap on top of each other in a coordinate layer?",
          options: ["Column", "Row", "Stack", "ListView"],
          answer: "Stack",
          explanation: "The Stack widget paints its children relative to its container box, allowing them to overlap."
        }
      },
      {
        week: 4,
        title: "Week 4: State Management & ChangeNotifier Patterns",
        topics: [
          "Global state options: Provider, Riverpod, and InheritedWidgets",
          "ChangeNotifier: declaring triggers and calling notifyListeners()",
          "Consuming data models using Consumer and context.watch() contexts"
        ],
        readings: "Flutter state management syncs changes across routes. Using the Provider package, declare a ChangeNotifier model containing variables and triggers. Call notifyListeners() within state modifications to redraw consuming widgets.",
        quiz: {
          question: "What Flutter component is used to manage notifications and alert listeners to rebuild widgets?",
          options: ["BuildContext", "Navigator", "ChangeNotifier", "InheritedWidget"],
          answer: "ChangeNotifier",
          explanation: "ChangeNotifier is a class in the Flutter SDK that sends notifications when properties are modified, triggering listener rebuilds."
        }
      }
    ]
  },
  "Java basic": {
    tagline: "Understand Java syntax, OOP inheritance/polymorphism, Collections frameworks, and Multithreading JVM internals.",
    weeks: [
      {
        week: 1,
        title: "Week 1: Java Basics, Compilation & JVM",
        topics: [
          "Java compilation flow: bytecode files (.class) and JVM execution",
          "Variables, primitive data types (int, double, char), and operators",
          "Control structures: conditionals (if-else, switch) and loop sequences"
        ],
        readings: "Java is a platform-independent, object-oriented programming language. The JDK compiler compiles source files into class files containing bytecode. The Java Virtual Machine (JVM) interprets or compiles this bytecode on target operating systems.",
        quiz: {
          question: "Which Java primitive type is used to represent single character values?",
          options: ["String", "char", "Character", "byte"],
          answer: "char",
          explanation: "The char primitive type stores a single 16-bit Unicode character (like 'a' or 'B')."
        }
      },
      {
        week: 2,
        title: "Week 2: Object-Oriented Java Programming (OOP)",
        topics: [
          "Declaring classes, objects, instance constructors, and parameters",
          "OOP principles: Encapsulation, Inheritance, and Polymorphism",
          "Method Overloading vs Method Overriding concepts"
        ],
        readings: "Java is built on OOP principles. Encapsulation hides object internals behind private fields. Inheritance lets a subclass inherit fields from a superclass. Polymorphism allows interfaces to represent multiple concrete types. Overriding redefines a superclass method in a subclass.",
        quiz: {
          question: "Which OOP concept allows a subclass to provide a specific implementation of a method already defined in its superclass?",
          options: ["Overloading", "Overriding", "Encapsulation", "Polymorphism"],
          answer: "Overriding",
          explanation: "Method Overriding allows a subclass to redefine a method inherited from a superclass to provide specialized behavior."
        }
      },
      {
        week: 3,
        title: "Week 3: Java Collections Framework & Exceptions",
        topics: [
          "Handling errors: try-catch-finally blocks and throw classes",
          "List containers: ArrayList, LinkedList, and vector sequences",
          "Set maps and unique associations: HashSet, TreeSet, and HashMap"
        ],
        readings: "Java Collections store groups of objects. Use List (ArrayList) for ordered sequences that can contain duplicates. Use Set (HashSet) for collections of unique items. Wrap risky code blocks (like operations on null pointers) in try-catch-finally statements.",
        quiz: {
          question: "Which Java collection class stores unique elements and does not guarantee insertion order?",
          options: ["ArrayList", "HashMap", "HashSet", "LinkedList"],
          answer: "HashSet",
          explanation: "HashSet stores unique elements backed by a hash table, offering fast lookup times but no insertion order guarantees."
        }
      },
      {
        week: 4,
        title: "Week 4: Threads, Concurrency & JVM Memory Model",
        topics: [
          "Creating execution threads: extending Thread vs implementing Runnable",
          "Synchronization keywords and thread safety controls",
          "JVM memory partitions: Stack frames vs Heap object allocations"
        ],
        readings: "Java programs run multithreaded tasks in parallel. Coordinate shared memory access between threads using the synchronized keyword, which locks access to a resource. Partitions split memory into local Stacks (for thread variables) and a shared Heap (for objects).",
        quiz: {
          question: "Which keyword in Java ensures that a method or block can be accessed by only one thread at a time?",
          options: ["synchronized", "volatile", "static", "final"],
          answer: "synchronized",
          explanation: "The synchronized keyword prevents thread interference and memory consistency errors by locking access to methods or objects."
        }
      }
    ]
  }
};
