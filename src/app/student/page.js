"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const OLD_COURSE_MAP = {
  "Web Development": "Web Development (Frontend & Full Stack)",
  "App Development": "Android App Development",
  "UI ux": "UI/UX",
  "AI/ML basic": "Machine Learning",
  "System desgin basic": "Data Structure & Algorithm with System Design",
  "product mangement": "Entrepreneurship",
  "Flutter development basic": "Android App Development",
  "Java basic": "Java"
};

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

  // 5-Screen Study Desk navigation states
  const [deskView, setDeskView] = useState("launchpad"); // 'launchpad', 'directory', 'curriculum', 'sidebar', 'reader'
  const [selectedDomainName, setSelectedDomainName] = useState("");
  const [activeModuleIndex, setActiveModuleIndex] = useState(0); // 0-3 (Module 1-4)
  const [activeTopicIndex, setActiveTopicIndex] = useState(0); // 0-1 (Topic 1.1-1.2 or similar)
  const [readingMode, setReadingMode] = useState("lesson"); // 'lesson' or 'notes'
  const [curriculumTab, setCurriculumTab] = useState("path"); // 'path', 'sessions', 'assessments', 'about'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [unlockedDomains, setUnlockedDomains] = useState({}); // { [domainName]: true }

  // Effect to sync student course to selected domain
  useEffect(() => {
    if (studentInfo && studentInfo.course) {
      const mappedCourse = OLD_COURSE_MAP[studentInfo.course] || studentInfo.course;
      setSelectedDomainName(mappedCourse);
    }
  }, [studentInfo]);

  // Theme settings state
  const [theme, setTheme] = useState("light");

  // Appeal / Suspension State
  const [appealMessage, setAppealMessage] = useState("");
  const [appealSubmitted, setAppealSubmitted] = useState(false);

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

    // Sync latest student info and status with Supabase or localStorage fallback
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          const currentEmail = localStorage.getItem("userEmail") || email;
          const updatedInfo = data.find(s => s.email.toLowerCase() === currentEmail.toLowerCase());
          if (updatedInfo) {
            setStudentInfo(updatedInfo);
            localStorage.setItem("currentStudent", JSON.stringify(updatedInfo));
          }
        }
      })
      .catch((err) => {
        console.error("API student sync error:", err);
        const storedStudents = JSON.parse(localStorage.getItem("pieenear_students") || "[]");
        const currentEmail = localStorage.getItem("userEmail") || email;
        const localUpdate = storedStudents.find(s => s.email.toLowerCase() === currentEmail.toLowerCase());
        if (localUpdate) {
          setStudentInfo(localUpdate);
          localStorage.setItem("currentStudent", JSON.stringify(localUpdate));
        }
      });
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

  const handleSendAppeal = (e) => {
    e.preventDefault();
    if (!appealMessage.trim()) return;

    const newAppeal = {
      id: "appeal-" + Date.now(),
      studentName: studentInfo.name,
      studentEmail: studentInfo.email,
      message: appealMessage.trim(),
      timestamp: new Date().toLocaleString(),
      status: "Pending"
    };

    // Save to list
    const storedAppeals = JSON.parse(localStorage.getItem("pieenear_suspension_reports") || "[]");
    localStorage.setItem("pieenear_suspension_reports", JSON.stringify([newAppeal, ...storedAppeals]));

    // Also push to tickets for visibility
    const storedTickets = JSON.parse(localStorage.getItem("pieenear_tickets") || "[]");
    const appealTicket = {
      id: "tkt-" + Date.now(),
      subject: `Suspension Appeal: ${studentInfo.name}`,
      category: "Administrative",
      description: appealMessage.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      status: "Pending",
      reply: null
    };
    localStorage.setItem("pieenear_tickets", JSON.stringify([appealTicket, ...storedTickets]));

    setAppealSubmitted(true);
    setAppealMessage("");
    showToast("Appeal report submitted successfully to the administrator!", "success");
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

  // Check if student account status is Suspended
  if (studentInfo.status === "Suspended") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
        padding: "20px",
      }}>
        {/* Glow Background */}
        <div style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
        }}></div>

        <div className="glass-panel animate-fade-in" style={{
          width: "100%",
          maxWidth: "480px",
          padding: "40px",
          borderRadius: "var(--border-radius-xl)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          zIndex: 1,
          textAlign: "center",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem"
          }}>
            🛡️
          </div>

          <div>
            <span style={{
              fontSize: "0.75rem",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--accent-rose)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Access Suspended
            </span>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "12px", color: "var(--text-primary)" }}>
              Account Suspended
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "12px", lineHeight: "1.6" }}>
              Your account is suspended and contact the admin for that thing.
            </p>
          </div>

          {/* Admin Contact Information */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "16px 20px", borderRadius: "var(--border-radius-md)", width: "100%", textAlign: "left" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Admin Contact Email</p>
            <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--accent-primary)" }}>admin@pieenear.com</p>
          </div>

          {/* Report Appeal Form */}
          <div style={{ width: "100%", textAlign: "left" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Submit Appeal & Report Issue
            </h4>
            
            {appealSubmitted ? (
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "16px", borderRadius: "var(--border-radius-md)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "1.2rem" }}>✅ Appeal Registered</span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Your appeal has been successfully sent to the administrator review queue. We will check your account settings shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendAppeal} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <textarea
                  className="form-input"
                  style={{
                    width: "100%",
                    minHeight: "90px",
                    resize: "none",
                    fontSize: "0.9rem",
                    padding: "10px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--border-radius-md)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Explain why your account should be reactivated or report the issue here..."
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "10px", fontSize: "0.9rem" }}
                >
                  Send Support Report
                </button>
              </form>
            )}
          </div>

          <div style={{ width: "100%", height: "1px", background: "var(--border-color)", margin: "8px 0" }}></div>

          <button
            onClick={() => {
              localStorage.removeItem("userRole");
              localStorage.removeItem("currentStudent");
              localStorage.removeItem("userEmail");
              router.push("/login");
            }}
            className="btn btn-danger"
            style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
          >
            Logout Session
          </button>
        </div>
      </div>
    );
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
            {activeTab === "desk" && (() => {
              const currentCourse = generateCurriculumForDomain(selectedDomainName || studentInfo.course || "Web Development");
              
              // Calculate dynamic progress values
              const completedCount = Object.values(quizProgress).filter(Boolean).length;
              const quizPercentage = Math.round((completedCount / 8) * 100); // 8 subtopics total (4 modules * 2 topics)

              const enrolledCourse = OLD_COURSE_MAP[studentInfo.course] || studentInfo.course;
              const isLocked = ["curriculum", "sidebar", "reader"].includes(deskView) && selectedDomainName && enrolledCourse !== selectedDomainName && !unlockedDomains[selectedDomainName];

              if (isLocked) {
                return (
                  <div className="animate-fade-in" style={styles.section}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setDeskView("directory")}
                        style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                      >
                        ← Browse Domains
                      </button>
                    </div>
                    
                    <div className="glass-panel" style={{ padding: "50px 40px", maxWidth: "600px", margin: "40px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", borderRadius: "var(--border-radius-lg)", border: "1px solid rgba(244, 63, 94, 0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
                      <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(244, 63, 94, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                        🔒
                      </div>
                      <div>
                        <span style={styles.weekPendingBadge}>Premium upgrade required</span>
                        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "12px", color: "var(--text-primary)" }}>Syllabus Locked</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "8px", lineHeight: "1.5" }}>
                          You are currently enrolled in <strong>{studentInfo.course}</strong>. 
                          Once a topic is assigned, you can only access that syllabus. 
                          Please **pay ₹2,000 for accessing this syllabus** ({selectedDomainName}).
                        </p>
                      </div>
                      
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "20px 30px", borderRadius: "var(--border-radius-md)", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "line-through" }}>Original value: ₹5,999</p>
                          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Upgrade Fee: ₹2,000</p>
                        </div>
                        <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)", padding: "4px 10px", borderRadius: "20px", fontWeight: 600 }}>One-time payment</span>
                      </div>

                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                          onClick={() => {
                            setUnlockedDomains({ ...unlockedDomains, [selectedDomainName]: true });
                            showToast(`Syllabus for "${selectedDomainName}" successfully unlocked!`, "success");
                          }}
                        >
                          Pay ₹2,000 & Unlock Syllabus
                        </button>
                        
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                          onClick={() => setDeskView("directory")}
                        >
                          Return to Directory
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="animate-fade-in" style={styles.section}>
                  
                  {/* VIEW 1: LAUNCHPAD */}
                  {deskView === "launchpad" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                      {/* Welcome Card */}
                      <div className="glass-panel" style={styles.welcomeBanner}>
                        <div>
                          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>
                            Welcome back, <span className="gradient-text">{studentInfo.name}</span>!
                          </h2>
                          <p style={{ color: "var(--text-secondary)", maxWidth: "550px", fontSize: "0.95rem", lineHeight: "1.5" }}>
                            Track your upgraded certification curriculum, browse the complete industry domains library, and manage your credentials.
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
                              {completedCount === 8 ? "Graduated" : "In Progress"}
                            </p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Syllabus progress</p>
                          </div>
                        </div>
                      </div>

                      {/* Main Launchpad Materials Box */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>📂 My Active Learning Libraries</h3>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                          
                          {/* Livebooks Square Card (as shown in img 1) */}
                          <div 
                            className="glass-panel glass-panel-hover" 
                            style={{ 
                              width: "220px", 
                              height: "220px", 
                              display: "flex", 
                              flexDirection: "column", 
                              alignItems: "center", 
                              justifyContent: "space-between", 
                              padding: "20px 15px",
                              cursor: "pointer",
                              textAlign: "center",
                              borderRadius: "var(--border-radius-lg)"
                            }}
                            onClick={() => setDeskView("directory")}
                          >
                            <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {/* Precise image-1 vector drawing copy */}
                              <svg viewBox="0 0 100 80" style={{ width: "90px", height: "70px" }}>
                                <rect x="10" y="10" width="80" height="60" rx="6" fill="none" stroke="var(--text-primary)" strokeWidth="3" />
                                <rect x="10" y="10" width="80" height="15" rx="6" fill="var(--border-color)" />
                                <circle cx="16" cy="17" r="2.5" fill="var(--text-muted)" />
                                <circle cx="23" cy="17" r="2.5" fill="var(--text-muted)" />
                                <circle cx="30" cy="17" r="2.5" fill="var(--text-muted)" />
                                <rect x="25" y="32" width="50" height="30" rx="3" fill="none" stroke="var(--text-primary)" strokeWidth="2.5" />
                                <polygon points="46,40 58,47 46,54" fill="none" stroke="var(--accent-rose)" strokeWidth="2.5" strokeLinejoin="round" />
                                <line x1="16" y1="67" x2="35" y2="67" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="16" y1="72" x2="45" y2="72" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            </div>
                            <div style={{ width: "100%", height: "1px", background: "var(--border-color)", margin: "10px 0" }}></div>
                            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>Livebooks</span>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW 2: DOMAIN DIRECTORY */}
                  {deskView === "directory" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      
                      {/* Navigation Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setDeskView("launchpad")}
                          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                        >
                          ← Back to Launchpad
                        </button>
                        <div style={{ textAlign: "right" }}>
                          <span style={styles.weekCompletedBadge}>New Phase upgraded</span>
                        </div>
                      </div>

                      {/* Header Title */}
                      <div style={{ marginBottom: "10px" }}>
                        <h2 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Browse Curriculum Domains</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginTop: "4px" }}>
                          *We’re stepping into a bigger, better, and more advanced phase*. Explore all updated syllabus documents.
                        </p>
                      </div>

                      {/* Search and Filters Bar */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                          <div style={{ flex: 1, position: "relative" }}>
                            <input 
                              type="text" 
                              placeholder="Search syllabus domains... (Ctrl K)" 
                              className="form-input"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              style={{ paddingLeft: "45px" }}
                            />
                            <span style={{ position: "absolute", left: "16px", top: "14px", color: "var(--text-muted)", fontSize: "1.1rem" }}>🔍</span>
                          </div>
                        </div>

                        {/* Category filter list */}
                        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", width: "100%" }}>
                          <button 
                            className={`btn ${selectedCategoryFilter === "All" ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => setSelectedCategoryFilter("All")}
                            style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                          >
                            All Categories
                          </button>
                          {Object.keys(CATEGORIZED_DOMAINS).map((cat) => (
                            <button
                              key={cat}
                              className={`btn ${selectedCategoryFilter === cat ? "btn-primary" : "btn-secondary"}`}
                              onClick={() => setSelectedCategoryFilter(cat)}
                              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                            >
                              {cat.replace(" Domains", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Domains Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                        {(() => {
                          const domainsToRender = [];
                          Object.entries(CATEGORIZED_DOMAINS).forEach(([catName, list]) => {
                            if (selectedCategoryFilter !== "All" && selectedCategoryFilter !== catName) return;
                            list.forEach((domain) => {
                              if (searchQuery && !domain.toLowerCase().includes(searchQuery.toLowerCase())) return;
                              domainsToRender.push({ name: domain, category: catName });
                            });
                          });

                          if (domainsToRender.length === 0) {
                            return (
                              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                                No syllabus domains match your current search parameters.
                              </div>
                            );
                          }

                          return domainsToRender.map((domain, idx) => {
                            // Find icon based on category
                            let icon = "💻";
                            if (domain.category.includes("ECE")) icon = "⚡";
                            else if (domain.category.includes("Mechanical")) icon = "⚙️";
                            else if (domain.category.includes("Civil")) icon = "🏗️";
                            else if (domain.category.includes("Aeronautical")) icon = "🛸";
                            else if (domain.category.includes("Management")) icon = "📈";
                            else if (domain.category.includes("Bio")) icon = "🧬";
                            else if (domain.category.includes("Food")) icon = "🍎";
                            else if (domain.category.includes("Nursing")) icon = "🩺";
                            else if (domain.category.includes("Other")) icon = "🏆";

                            const isSelected = selectedDomainName === domain.name;

                            return (
                              <div 
                                key={idx} 
                                className="glass-panel glass-panel-hover" 
                                style={{ 
                                  padding: "24px", 
                                  cursor: "pointer", 
                                  border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                                  display: "flex", 
                                  flexDirection: "column", 
                                  justifyContent: "space-between",
                                  minHeight: "180px"
                                }}
                                onClick={() => {
                                  setSelectedDomainName(domain.name);
                                  setDeskView("curriculum");
                                }}
                              >
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "1.8rem" }}>{icon}</span>
                                    <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: "10px", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                      {domain.category.replace(" Domains", "")}
                                    </span>
                                  </div>
                                  <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", lineHeight: "1.4" }}>
                                    {domain.name}
                                  </h4>
                                </div>
                                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                  <span>💎 3 | 📂 0 | 📚 33</span>
                                  <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>100% Core</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* VIEW 3: TIMELINE CURRICULUM OVERVIEW */}
                  {deskView === "curriculum" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      
                      {/* Breadcrumbs Navigation */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setDeskView("directory")}
                          style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                        >
                          ← Browse Domains
                        </button>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                          Syllabus / {selectedDomainName}
                        </span>
                      </div>

                      {/* Course Title Header (as shown in img 3) */}
                      <div className="glass-panel" style={{ padding: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                        <div style={{ flex: 1, minWidth: "280px" }}>
                          <span style={{ fontSize: "0.8rem", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary)", padding: "4px 10px", borderRadius: "12px", fontWeight: 600 }}>Domain Curriculum</span>
                          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "8px", color: "var(--text-primary)" }}>{selectedDomainName}</h2>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "6px", lineHeight: "1.4" }}>
                            {currentCourse.tagline}
                          </p>
                        </div>
                        
                        {/* Dynamic Progress indicator (from img 3) */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                          <div style={{ display: "flex", gap: "15px", fontSize: "0.85rem" }}>
                            <span style={{ color: "var(--text-muted)" }}>{quizPercentage}% Completed</span>
                            <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>65% Mastery</span>
                          </div>
                          
                          {/* Segmented green progress bar */}
                          <div style={{ display: "flex", gap: "2px" }}>
                            {Array.from({ length: 20 }).map((_, idx) => {
                              const activeSegments = Math.round((quizPercentage / 100) * 20);
                              const isActive = idx < activeSegments;
                              return (
                                <div 
                                  key={idx} 
                                  style={{
                                    width: "8px", 
                                    height: "12px", 
                                    background: isActive ? "linear-gradient(to bottom, #10b981, #059669)" : "rgba(255,255,255,0.06)",
                                    borderRadius: "1px"
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Course Tabs (Learning Path, Sessions, Assessments, About) */}
                      <div style={{ borderBottom: "1px solid var(--border-color)", display: "flex", gap: "24px", marginTop: "10px" }}>
                        {[
                          { id: "path", label: "Learning Path" },
                          { id: "sessions", label: "Sessions" },
                          { id: "assessments", label: "Assessments" },
                          { id: "about", label: "About" }
                        ].map((t) => (
                          <button
                            key={t.id}
                            style={{
                              padding: "12px 6px",
                              border: "none",
                              background: "none",
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: curriculumTab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
                              borderBottom: curriculumTab === t.id ? "3px solid var(--accent-primary)" : "3px solid transparent",
                              cursor: "pointer",
                              outline: "none",
                              transition: "all 0.2s ease"
                            }}
                            onClick={() => setCurriculumTab(t.id)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab contents */}
                      {curriculumTab === "path" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "30px", marginTop: "10px" }}>
                          
                          {/* Timeline layout (as in img 3) */}
                          {currentCourse.modules.map((mod, modIdx) => (
                            <div key={modIdx} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                              
                              {/* Module Tag Header */}
                              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "12px 20px", borderRadius: "var(--border-radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Module {modIdx + 1}</span>
                                  <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{mod.title}</h4>
                                </div>
                                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>2 Lessons</span>
                              </div>

                              {/* timeline nodes */}
                              <div style={{ display: "flex", flexDirection: "column", position: "relative", paddingLeft: "40px" }}>
                                {/* Vertical connection line */}
                                <div style={{ position: "absolute", left: "19px", top: "10px", bottom: "10px", width: "2px", borderLeft: "2px dashed var(--border-color)" }}></div>
                                
                                {mod.topics.map((top, topIdx) => {
                                  const topicKey = `${modIdx + 1}.${topIdx + 1}`;
                                  const isTopicCompleted = quizProgress[topicKey];

                                  return (
                                    <div 
                                      key={topIdx} 
                                      className="glass-panel glass-panel-hover"
                                      style={{ 
                                        padding: "20px 24px", 
                                        marginBottom: "16px", 
                                        position: "relative",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                      }}
                                    >
                                      {/* Left side node dot indicator */}
                                      <div 
                                        style={{
                                          position: "absolute",
                                          left: "-31px",
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          width: "24px",
                                          height: "24px",
                                          borderRadius: "4px",
                                          background: isTopicCompleted ? "var(--accent-emerald)" : "var(--border-color)",
                                          border: "1.5px solid var(--bg-primary)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: "0.7rem",
                                          fontWeight: 800,
                                          color: "#fff",
                                          zIndex: 2
                                        }}
                                      >
                                        {topicKey}
                                      </div>

                                      <div style={{ flex: 1, paddingRight: "20px" }}>
                                        <h5 style={{ fontSize: "1rem", fontWeight: 700, color: isTopicCompleted ? "var(--text-primary)" : "var(--text-secondary)", marginBottom: "4px" }}>
                                          {top.title}
                                        </h5>
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                                          {top.description}
                                        </p>
                                      </div>

                                      {/* Blue Arrow Link to topic (from img 3) */}
                                      <button 
                                        className="btn btn-secondary"
                                        onClick={() => {
                                          setActiveModuleIndex(modIdx);
                                          setActiveTopicIndex(topIdx);
                                          setDeskView("sidebar");
                                        }}
                                        style={{ 
                                          width: "36px", 
                                          height: "36px", 
                                          padding: 0, 
                                          borderRadius: "50%", 
                                          background: "rgba(99, 102, 241, 0.08)",
                                          color: "var(--accent-primary)",
                                          borderColor: "transparent",
                                          fontSize: "1.2rem"
                                        }}
                                      >
                                        →
                                      </button>

                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          ))}

                        </div>
                      )}

                      {curriculumTab === "sessions" && (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                          <span style={{ fontSize: "3rem" }}>📅</span>
                          <h4 style={{ fontWeight: 700, color: "var(--text-primary)", marginTop: "15px", marginBottom: "8px" }}>Live Webinars Scheduled</h4>
                          <p style={{ fontSize: "0.9rem" }}>No session bookings today. Check back on Monday for upcoming industry webinars.</p>
                        </div>
                      )}

                      {curriculumTab === "assessments" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
                          <div className="glass-panel" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <span style={styles.weekCompletedBadge}>Standard Evaluation</span>
                              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "6px" }}>Domain Comprehensive MCQ Challenge</h4>
                              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>Limit: 10 Mins | Passing Rate: 70%</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setActiveTab("exams")}>Go to Exams</button>
                          </div>
                        </div>
                      )}

                      {curriculumTab === "about" && (
                        <div className="glass-panel" style={{ padding: "30px", marginTop: "10px", lineHeight: "1.6" }}>
                          <h4 style={{ fontWeight: 700, marginBottom: "12px" }}>Curriculum Architecture Overview</h4>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "15px" }}>
                            This upgraded domain certification is engineered in alignment with current industry trends and upcoming corporate technology stack standards.
                          </p>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                            Over the course of 4 core modules, students will develop practical skills, review revision guides, pass concept checkpoint quizzes, and demonstrate capability using standard evaluative projects.
                          </p>
                        </div>
                      )}

                    </div>
                  )}

                  {/* VIEW 4: SIDEBAR TOPIC EXPLORER */}
                  {deskView === "sidebar" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {/* Explorer header bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setDeskView("curriculum")}
                          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                        >
                          ← Back to path
                        </button>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                          {selectedDomainName} / Module {activeModuleIndex + 1}
                        </span>
                      </div>

                      {/* Main Dual Explorer layout (from img 4) */}
                      <div style={{ display: "flex", gap: "24px", minHeight: "500px", flexWrap: "wrap" }}>
                        
                        {/* LEFT SIDEBAR: Topic navigation list */}
                        <div className="glass-panel" style={{ width: "280px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                            📖 learning path
                          </h4>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
                            {currentCourse.modules.map((mod, modIdx) => (
                              <div key={modIdx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700 }}>
                                  Module {modIdx + 1}
                                </span>
                                
                                {mod.topics.map((top, topIdx) => {
                                  const topicKey = `${modIdx + 1}.${topIdx + 1}`;
                                  const isSelected = activeModuleIndex === modIdx && activeTopicIndex === topIdx;
                                  const isTopicCompleted = quizProgress[topicKey];

                                  return (
                                    <div
                                      key={topIdx}
                                      onClick={() => {
                                        setActiveModuleIndex(modIdx);
                                        setActiveTopicIndex(topIdx);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        padding: "10px 12px",
                                        borderRadius: "var(--border-radius-sm)",
                                        background: isSelected ? "rgba(99, 102, 241, 0.08)" : "transparent",
                                        cursor: "pointer",
                                        border: isSelected ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent"
                                      }}
                                    >
                                      {/* Completion circle */}
                                      <div style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        background: isTopicCompleted ? "var(--accent-emerald)" : isSelected ? "rgba(255,255,255,0.02)" : "transparent",
                                        border: isTopicCompleted ? "none" : "1.5px solid var(--border-color)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.7rem",
                                        fontWeight: 800,
                                        color: isTopicCompleted ? "#fff" : "var(--text-muted)"
                                      }}>
                                        {topicKey}
                                      </div>
                                      <span style={{ 
                                        fontSize: "0.85rem", 
                                        fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        flex: 1
                                      }}>
                                        {top.title}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* RIGHT MAIN PANEL: Study Cards (as shown in img 4) */}
                        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "24px" }}>
                          
                          {/* Breadcrumb title */}
                          <div>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              &lt; {currentCourse.modules[activeModuleIndex].title}
                            </span>
                            <h3 style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "4px" }}>
                              {currentCourse.modules[activeModuleIndex].topics[activeTopicIndex].title}
                            </h3>
                          </div>

                          {/* Interactive material cards */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
                            
                            {/* Card 1: Lesson (cream/light-orange box) */}
                            <div 
                              className="glass-panel" 
                              onClick={() => {
                                setReadingMode("lesson");
                                setDeskView("reader");
                              }}
                              style={{ 
                                padding: "40px 30px", 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "center", 
                                justifyContent: "center",
                                textAlign: "center",
                                cursor: "pointer",
                                border: "1px solid rgba(249, 115, 22, 0.15)",
                                background: theme === "light" ? "rgba(255, 237, 213, 0.5)" : "rgba(249, 115, 22, 0.05)",
                                borderRadius: "var(--border-radius-lg)",
                                transition: "all 0.3s ease"
                              }}
                            >
                              {/* Vector laptop drawing */}
                              <svg viewBox="0 0 120 90" style={{ width: "120px", height: "90px", marginBottom: "20px" }}>
                                <rect x="20" y="15" width="80" height="50" rx="5" fill="none" stroke="var(--accent-rose)" strokeWidth="3" />
                                <rect x="25" y="20" width="70" height="32" fill="rgba(239, 68, 68, 0.05)" />
                                <line x1="32" y1="29" x2="52" y2="29" stroke="var(--accent-rose)" strokeWidth="3" strokeLinecap="round" />
                                <line x1="32" y1="37" x2="88" y2="37" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="32" y1="45" x2="72" y2="45" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="12" y1="65" x2="108" y2="65" stroke="var(--text-primary)" strokeWidth="4" strokeLinecap="round" />
                                <rect x="52" y="65" width="16" height="4" fill="var(--text-primary)" />
                              </svg>
                              
                              <h4 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-rose)", marginTop: "10px" }}>Lesson</h4>
                            </div>

                            {/* Card 2: Revision Notes (light-blue/purple box) */}
                            <div 
                              className="glass-panel" 
                              onClick={() => {
                                setReadingMode("notes");
                                setDeskView("reader");
                              }}
                              style={{ 
                                padding: "40px 30px", 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "center", 
                                justifyContent: "center",
                                textAlign: "center",
                                cursor: "pointer",
                                border: "1px solid rgba(99, 102, 241, 0.15)",
                                background: theme === "light" ? "rgba(238, 242, 255, 0.5)" : "rgba(99, 102, 241, 0.05)",
                                borderRadius: "var(--border-radius-lg)",
                                transition: "all 0.3s ease"
                              }}
                            >
                              {/* Vector document folder drawing */}
                              <svg viewBox="0 0 120 90" style={{ width: "120px", height: "90px", marginBottom: "20px" }}>
                                <rect x="35" y="15" width="50" height="60" rx="5" fill="none" stroke="var(--accent-primary)" strokeWidth="3" />
                                <line x1="45" y1="30" x2="75" y2="30" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="45" y1="40" x2="70" y2="40" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="45" y1="50" x2="75" y2="50" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="45" y1="60" x2="65" y2="60" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" />
                                <path d="M56,7 C59,2 65,2 68,7 L68,20 C65,25 59,25 56,20 Z" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" />
                              </svg>
                              
                              <h4 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-primary)", marginTop: "10px" }}>Revision Notes</h4>
                            </div>

                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW 5: INTERACTIVE STUDY CONTENT READER */}
                  {deskView === "reader" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
                      
                      {/* Top reading progress line (from img 5) */}
                      <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.06)", position: "absolute", top: "-20px", left: 0, right: 0 }}>
                        <div style={{ width: "75%", height: "100%", background: "var(--accent-primary)" }}></div>
                      </div>

                      {/* Header controller bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>
                          Reading Study Material
                        </span>
                        
                        {/* Circular Close Button (from img 5) */}
                        <button 
                          onClick={() => setDeskView("sidebar")}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.06)",
                            border: "1.5px solid var(--border-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            outline: "none",
                            fontWeight: "bold",
                            transition: "all 0.2s ease"
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Content Reader Pane */}
                      <div className="glass-panel animate-fade-in" style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
                        
                        {/* Badge box (from img 5) */}
                        <div style={{ 
                          width: "36px", 
                          height: "36px", 
                          background: "var(--accent-emerald)", 
                          borderRadius: "4px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          color: "#fff", 
                          fontWeight: 800,
                          fontSize: "0.95rem"
                        }}>
                          {activeModuleIndex + 1}.{activeTopicIndex + 1}
                        </div>

                        {/* Title text */}
                        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "20px", marginBottom: "30px", textAlign: "center" }}>
                          {currentCourse.modules[activeModuleIndex].topics[activeTopicIndex].title}
                        </h2>

                        {/* Centered graphics/quote banner (from img 5) */}
                        <div 
                          className="glass-panel" 
                          style={{ 
                            width: "100%", 
                            maxWidth: "450px", 
                            background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)", 
                            padding: "40px", 
                            borderRadius: "var(--border-radius-lg)",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            border: "1px solid rgba(99, 102, 241, 0.2)",
                            marginBottom: "35px"
                          }}
                        >
                          <span style={{ fontSize: "3rem", color: "var(--accent-rose)", display: "block", marginBottom: "15px", height: "30px", fontFamily: "Georgia, serif" }}>“</span>
                          <p style={{ fontStyle: "italic", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: "1.5", marginBottom: "15px" }}>
                            {currentCourse.modules[activeModuleIndex].topics[activeTopicIndex].quote || "One sound idea is all that one needs to achieve success."}
                          </p>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                            Credits: {currentCourse.modules[activeModuleIndex].topics[activeTopicIndex].quoteCredits || "Pinterest"}
                          </span>
                        </div>

                        {/* Paragraph reading contents */}
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px", color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: "1.7", textAlign: "left" }}>
                          {readingMode === "lesson" ? (
                            <>
                              <p>{currentCourse.modules[activeModuleIndex].topics[activeTopicIndex].lesson}</p>
                              <p>Understanding these aspects allows you to make scalable architectural designs, keeping overall platform parameters clean. Practice applying these parameters in isolated tests before deploying full files in production.</p>
                            </>
                          ) : (
                            <>
                              <h4 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Key Cheat Sheet Checkpoints:</h4>
                              <p style={{ whiteSpace: "pre-line" }}>{currentCourse.modules[activeModuleIndex].topics[activeTopicIndex].notes}</p>
                            </>
                          )}
                        </div>

                        {/* Action buttons at bottom */}
                        <div style={{ display: "flex", gap: "16px", marginTop: "40px", width: "100%" }}>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => setDeskView("sidebar")}
                            style={{ flex: 1 }}
                          >
                            Close Reader
                          </button>
                          
                          <button 
                            className="btn btn-primary"
                            onClick={() => {
                              const topicKey = `${activeModuleIndex + 1}.${activeTopicIndex + 1}`;
                              const updatedProgress = { ...quizProgress, [topicKey]: true };
                              
                              // Save progress to local state & localStorage
                              setQuizProgress(updatedProgress);
                              const email = studentInfo.email;
                              localStorage.setItem(`pieenear_quiz_progress_${email.toLowerCase()}`, JSON.stringify(updatedProgress));
                              
                              showToast(`Checked off topic ${topicKey} as completed!`, "success");
                              setDeskView("sidebar");
                            }}
                            style={{ flex: 1 }}
                          >
                            Mark as Completed ✔
                          </button>
                        </div>

                      </div>

                    </div>
                  )}

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

const CATEGORIZED_DOMAINS = {
  "CSE / IT Domains": [
    "Web Development (Frontend & Full Stack)",
    "Python Full Stack",
    "Machine Learning",
    "Android App Development",
    "Data Science",
    "Artificial Intelligence",
    "UI/UX",
    "Cyber Security",
    "Graphic Design",
    "AR/VR",
    "DevOps",
    "Selenium Testing with Java",
    "AWS",
    "Java",
    "Python",
    "Data Structure & Algorithm with System Design",
    "Generative AI",
    "Data Engineering",
    "Metaverse"
  ],
  "ECE Domains": [
    "Embedded Systems",
    "Hybrid Electric Vehicle",
    "VLSI",
    "IoT",
    "Robotics",
    "Power Systems"
  ],
  "Mechanical Engineering Domains": [
    "AutoCAD",
    "CATIA",
    "Car Design",
    "Industrial Robotics & Automation"
  ],
  "Civil Engineering Domains": [
    "AutoCAD",
    "Construction Planning & Structural Analysis"
  ],
  "Aeronautical": [
    "Drone Technology"
  ],
  "Management & Commerce Domains": [
    "Finance",
    "Digital Marketing",
    "HR Management",
    "Business Analytics",
    "Stock Marketing",
    "SAP FICO",
    "Supply Chain Management",
    "Salesforce",
    "Web 3.0",
    "Investment Banking",
    "ACCA F4 (Business & Corporate Law)",
    "ServiceNow",
    "Advanced Excel",
    "Entrepreneurship"
  ],
  "Bio Domains": [
    "Bioinformatics",
    "Biostatistics",
    "Microbiology",
    "Molecular Biology",
    "Medical Coding",
    "Nano Science & Technology",
    "Genetic Engineering",
    "Pharmacovigilance"
  ],
  "Food Technology": [
    "Food Science & Technology",
    "Sensory Science",
    "Nutrition & Health Management"
  ],
  "Nursing": [
    "Pediatrics"
  ],
  "Other Domains": [
    "Petroleum Engineering",
    "Career Placement & Interview Mastery"
  ]
};

const generateCurriculumForDomain = (domainName) => {
  const lowercaseDomain = domainName.toLowerCase();
  
  if (lowercaseDomain.includes("web development") || lowercaseDomain.includes("full-stack")) {
    return {
      tagline: "Master modern full-stack web engineering, from layout design to interactive client-side routing and performance optimization.",
      modules: [
        {
          title: "Module 1: Semantic HTML5, CSS Flexbox & CSS Grid",
          topics: [
            {
              id: "1.1",
              title: "Orientation: Web Development Learning Launchpad",
              description: "Explore HTML5 semantic structure elements (header, footer, nav, article, section) and structural design guidelines.",
              quote: "One sound idea is all that one needs to achieve success.",
              quoteCredits: "Napoleon Hill",
              lesson: "Web page structures rely on semantic HTML5 tags for accessibility and search engine optimization. For layout flow, use CSS Flexbox when aligning items along a single axis (row or column) to build dynamic responsive flows. Use CSS Grid when creating complex multi-dimensional page structures to manage rows and columns simultaneously. Avoid legacy floats or HTML table structures for general layouts.",
              notes: "Key concepts to remember:\n- Always use <header>, <nav>, <main>, <article>, <section>, and <footer> tags.\n- Flexbox align-items aligns along the cross-axis, while justify-content aligns along the main-axis.\n- CSS Grid templates define fractional units (fr) for fluid column scaling."
            },
            {
              id: "1.2",
              title: "Responsive Web Frameworks & Media Rules",
              description: "Learn how media queries and layout viewports construct fluid, multi-device interfaces.",
              quote: "Design is not just what it looks like and feels like. Design is how it works.",
              quoteCredits: "Steve Jobs",
              lesson: "Fluid responsiveness is achieved via viewport directives and CSS media queries. By setting max-width and min-width boundaries, layouts scale gracefully from standard desktop displays down to mobile screens. Fluid typography scaling and grid column restructuring are critical for visual harmony across multi-device user bases.",
              notes: "- viewport meta key is required: width=device-width, initial-scale=1.0\n- Utilize CSS custom properties (variables) to maintain theme parameters.\n- Define breakpoints dynamically in root style configurations."
            }
          ]
        },
        {
          title: "Module 2: Advanced JavaScript (ES6+) & DOM Engine",
          topics: [
            {
              id: "2.1",
              title: "Asynchronous Web Flow & APIs",
              description: "Master block-scoped variables, arrow logic, and asynchronous flows (async/await, Promises).",
              quote: "First, solve the problem. Then, write the code.",
              quoteCredits: "John Johnson",
              lesson: "Modern ECMAScript (ES6+) provides powerful language paradigms. Block-scoped bindings (let/const) prevent leakage, while arrow functions resolve lexical context bindings. Asynchronous processes utilize native Promise wrappers, resolved cleanly using async/await syntax over network API streams.",
              notes: "- let is block-scoped, const is read-only reference block.\n- Array methods .map(), .filter(), .reduce() are non-mutating helpers.\n- Always wrap fetch processes in standard try-catch blocks for reliability."
            },
            {
              id: "2.2",
              title: "DOM Node Interaction & Events",
              description: "Learn Event Bubbling, capturing, and high-performance DOM manipulation patterns.",
              quote: "Simplicity is the soul of efficiency.",
              quoteCredits: "Austin Freeman",
              lesson: "Interacting with the DOM requires binding callback functions to visual elements. Event propagation handles user inputs via bubbling upwards to root layouts. Use high-performance DocumentFragments to inject multiple nodes at once, keeping browser repaints and reflow calculations minimal.",
              notes: "- event.preventDefault() stops native form submissions.\n- event.stopPropagation() halts bubble propagation cascades.\n- Delegate events to parent nodes to optimize event listener counts."
            }
          ]
        },
        {
          title: "Module 3: React.js Component Architecture & Hooks",
          topics: [
            {
              id: "3.1",
              title: "React Components & State Reactivity",
              description: "Build reusable, isolated component segments using state management hooks.",
              quote: "React makes it painless to create interactive UIs.",
              quoteCredits: "Meta Open Source",
              lesson: "React splits layouts into functional, reusable component fragments. Components accept read-only attributes (props) and maintain local reactive state variables. Whenever a state change is scheduled, React re-evaluates the Virtual DOM tree, compiling only the minimal set of updates required.",
              notes: "- State variables are registered using useState().\n- Lifting state up shares variables between child nodes via common parents.\n- Keep components pure: props and state inputs should produce deterministic UI."
            },
            {
              id: "3.2",
              title: "Effect Synchronization & Custom Hooks",
              description: "Sync functional components with external network APIs via useEffect.",
              quote: "The details are not the details. They make the design.",
              quoteCredits: "Charles Eames",
              lesson: "Side effects like fetching, listening to global windows, or tracking subscriptions run inside useEffect. The hook accepts a dependencies array to control execution. Avoid empty dependency arrays when values inside the callback require syncing on change.",
              notes: "- useEffect runs asynchronously after component rendering updates.\n- Return cleanup functions to release memory and clear active event hooks.\n- Extract shared state logic into reusable custom hooks (usePrefix)."
            }
          ]
        },
        {
          title: "Module 4: Performance, Security & Production Deployment",
          topics: [
            {
              id: "4.1",
              title: "Next.js Architecture & Optimization",
              description: "Learn Static Site Generation (SSG) and Server-Side Rendering (SSR) in Next.js.",
              quote: "Speed is a feature. Make your apps fast.",
              quoteCredits: "Google Performance",
              lesson: "Production-ready systems compile code into optimized bundles. Using Next.js, pages can be pre-rendered dynamically at build time (SSG) or request time (SSR). Optimize image loading using specialized tags, and implement route-based code splitting to maximize initial load performance scorecards.",
              notes: "- next/image provides automated size optimization and lazy loading.\n- Dynamic imports split components into separate bundle files.\n- Security headers must restrict script loading vectors (CSP)."
            },
            {
              id: "4.2",
              title: "CORS Security & API Deployments",
              description: "Secure cross-origin routes and deploy applications to edge networks.",
              quote: "Security is not a product, but a process.",
              quoteCredits: "Bruce Schneier",
              lesson: "Deploying applications requires configuring build environments and securing gateways. Cross-Origin Resource Sharing (CORS) headers define authorized web origins allowed to fetch backend endpoints. Ensure proper authorization tokens are attached to request headers before processing CRUD database updates.",
              notes: "- Access-Control-Allow-Origin defines API resource scope restrictions.\n- Deploy static frontend segments using automated continuous pipelines (CI/CD).\n- Configure secure environment parameters for API keys."
            }
          ]
        }
      ]
    };
  }

  if (lowercaseDomain.includes("ui/ux") || lowercaseDomain.includes("ui ux")) {
    return {
      tagline: "Explore modern design systems, user empathy mapping, responsive wireframing, and interactive UI prototyping.",
      modules: [
        {
          title: "Module 1: Design Thinking (Empathize & Define)",
          topics: [
            {
              id: "1.1",
              title: "User Research & Persona Development",
              description: "Learn the stages of design thinking and compile empathy charts to map target demographics.",
              quote: "Design is intelligence made visible.",
              quoteCredits: "Alina Wheeler",
              lesson: "Design thinking begins with user research. Conduct empathy cycles by listening to user interactions and logging daily frustration thresholds. Translate notes into user personas—fictional models representing distinct audience subsets—to align design decisions with authentic user scenarios.",
              notes: "- The 5 phases: Empathize, Define, Ideate, Prototype, Test.\n- Journey maps represent a user's flow through tasks step-by-step.\n- Problem statements focus on target user needs without pre-assuming solutions."
            },
            {
              id: "1.2",
              title: "Information Architecture & Card Sorting",
              description: "Organize layout taxonomies and design clear user paths through structure sorting.",
              quote: "Good design is obvious. Great design is transparent.",
              quoteCredits: "Joe Sparano",
              lesson: "Information Architecture (IA) establishes page hierarchies, category splits, and structural navigation paths. Card sorting studies group content sections logically to ensure layout terminology matches standard mental models, minimizing navigational friction.",
              notes: "- Sitemap diagrams map primary and secondary page hierarchies.\n- Open card sorting allows users to create their own category names.\n- Closed card sorting matches items into predefined lists."
            }
          ]
        },
        {
          title: "Module 2: Wireframing & Responsive Figma Design",
          topics: [
            {
              id: "2.1",
              title: "Low-Fidelity Sketching & Auto Layout",
              description: "Build flexible, responsive layouts in Figma using Auto-Layout frames.",
              quote: "Simple is harder than complex.",
              quoteCredits: "Steve Jobs",
              lesson: "Figma is the industry-standard layout interface tool. Begin drafts with low-fidelity layouts to focus on content flow rather than color cosmetics. Use Figma Auto Layout properties to create fluid elements that expand or shift automatically as dimensions scale.",
              notes: "- Low-fidelity frames use placeholder boxes (crossed X) for images.\n- Auto Layout controls paddings, item alignments, and wrap directions.\n- Nested frames allow responsive scaling within complex cards."
            },
            {
              id: "2.2",
              title: "Color Theory & Contrast Accessibility",
              description: "Verify contrast guidelines to build highly readable color systems.",
              quote: "Color is a power which directly influences the soul.",
              quoteCredits: "Wassily Kandinsky",
              lesson: "Establish visual hierarchy using size, contrast, and color weights. Ensure all text and element contrast levels meet Web Content Accessibility Guidelines (WCAG) AAA scores, guaranteeing layouts remain readable for users with visual impairments.",
              notes: "- Monochromatic schemes utilize gradients of a single color.\n- AAA guidelines require a 4.5:1 ratio for normal body text.\n- Use dark mode themes to reduce eye strain and conserve mobile battery."
            }
          ]
        },
        {
          title: "Module 3: High-Fidelity Prototyping & Interactions",
          topics: [
            {
              id: "3.1",
              title: "Smart Animate & Transition Triggers",
              description: "Create interactive user test paths using advanced Figma animation rules.",
              quote: "If you do it right, it will last forever.",
              quoteCredits: "Massimo Vignelli",
              lesson: "Prototyping brings layout files to life. In Figma, connect trigger nodes to target pages. Utilize Smart Animate transitions to interpolates position shifts, transitions, and state swaps automatically, mimicking actual code animations.",
              notes: "- Triggers include: On Click, On Hover, On Drag, After Delay.\n- Component Sets group distinct button state variants (Hover, Active).\n- Maintain matching element names across frames to enable Smart Animate overrides."
            },
            {
              id: "3.2",
              title: "Design Systems & Pattern Tokens",
              description: "Build atomic design libraries with reusable component patterns and design tokens.",
              quote: "Styles come and go. Good design is a language.",
              quoteCredits: "Massimo Vignelli",
              lesson: "Design systems keep interfaces consistent as platforms expand. Establish design tokens (variables) for typography sizing, padding values, color palettes, and shadow parameters. Build components starting with basic elements (atoms) up to complex widgets.",
              notes: "- Design tokens decouple styles from absolute code values.\n- Atomic Design levels: Atoms, Molecules, Organisms, Templates, Pages.\n- Changing main components instantly propagates style updates globally."
            }
          ]
        },
        {
          title: "Module 4: Usability Testing & Analytics Verification",
          topics: [
            {
              id: "4.1",
              title: "Heuristic Assessments & User Walkthroughs",
              description: "Audit interface layouts against Nielsen's 10 Usability Principles.",
              quote: "Supposing is good, but finding out is better.",
              quoteCredits: "Mark Twain",
              lesson: "Usability testing gathers user feedback before finalizing code. Evaluate layouts against Nielsen's 10 Usability Heuristics, checking that users have control to undo actions, see visible system status, and recover from errors.",
              notes: "- User testing identifies behavioral blocks through direct observation.\n- Standard heuristics require clear back out paths (Emergency Exits).\n- Maintain layout consistency to match common user expectation models."
            },
            {
              id: "4.2",
              title: "A/B Testing & Design Success Metrics",
              description: "Run cohort studies and evaluate layout modifications using statistical metrics.",
              quote: "Without data, you're just another person with an opinion.",
              quoteCredits: "W. Edwards Deming",
              lesson: "A/B testing evaluates layout changes by distributing variants to different user groups. Measure design effectiveness using activation rates, retention metrics, task completion speed, and satisfaction surveys (NPS) to prove value.",
              notes: "- A/B tests modify only one design variable at a time (e.g. CTA location).\n- Conversion rate calculations prove if new designs drive target actions.\n- UX metrics validate layout investments using business indicators."
            }
          ]
        }
      ]
    };
  }

  // Fallback dynamic generator
  const defaultTagline = `Advance your knowledge in ${domainName} with structured modules, interactive lessons, and revision checklists.`;
  return {
    tagline: defaultTagline,
    modules: [
      {
        title: `Module 1: Foundations of ${domainName}`,
        topics: [
          {
            id: "1.1",
            title: `Orientation: ${domainName} Learning Launchpad`,
            description: `Explore the core principles, terminology, and historical baseline of ${domainName}.`,
            quote: "An investment in knowledge pays the best interest.",
            quoteCredits: "Benjamin Franklin",
            lesson: `Stepping into ${domainName} requires establishing a strong foundation of core theories, workflows, and tools. Understanding the landscape allows you to frame problems clearly, identify standard industry methodologies, and utilize key principles to resolve real-world scenarios. Focus on mastering key structural concepts before moving into complex implementations.`,
            notes: `Key concepts to remember:\n- Core definitions and parameters of ${domainName}.\n- Basic workflows and operational guidelines.\n- Key performance indicators and terminology.`
          },
          {
            id: "1.2",
            title: `Ecosystem Overview & Basic Tooling`,
            description: `Learn the essential software, libraries, and frameworks used by practitioners of ${domainName}.`,
            quote: "Technology is best when it brings people together.",
            quoteCredits: "Matt Mullenweg",
            lesson: `Every modern domain relies on an ecosystem of specialized tools, software, and methods. In this section, we examine the primary systems and frameworks used in ${domainName}. Familiarizing yourself with these standards allows for cleaner collaboration and alignment with industry best practices, ensuring your work matches current standards.`,
            notes: `- Primary toolkit configurations.\n- Standard interface guidelines and system parameters.\n- Documentation resources for active references.`
          }
        ]
      },
      {
        title: `Module 2: Intermediate Frameworks & Design`,
        topics: [
          {
            id: "2.1",
            title: `Implementing ${domainName} Strategies`,
            description: `Coordinate parameters, construct models, and map out operations.`,
            quote: "Details matter. They make the design.",
            quoteCredits: "Charles Eames",
            lesson: `Applying concepts requires shifting from theoretical definitions to structural models. We analyze how parameters interact, how database or mechanical systems coordinate, and how variables are managed to maintain project goals. Regular checks ensure that processes scale gracefully and avoid common failure points.`,
            notes: `- Step-by-step implementation blueprints.\n- Common bottlenecks and design challenges.\n- Data input styling and configuration metrics.`
          },
          {
            id: "2.2",
            title: `Case Study: Industry Standards and Workflow`,
            description: `Analyze actual operational scenarios and breakdown workflow steps.`,
            quote: "Learn from yesterday, live for today, hope for tomorrow.",
            quoteCredits: "Albert Einstein",
            lesson: `Reviewing actual projects helps translate general concepts into practical lessons. We break down historical case studies in ${domainName}, detailing the initial constraints, the execution steps taken, and how final outcomes were calculated. Learning from these examples highlights standard issues to avoid and patterns to follow.`,
            notes: `- Real-world project post-mortem steps.\n- Best practices for system setup.\n- Verification and evaluation guidelines.`
          }
        ]
      },
      {
        title: `Module 3: Advanced Architectures & Systems`,
        topics: [
          {
            id: "3.1",
            title: "Optimization & Advanced Toolsets",
            description: `Maximize efficiency, reduce latency, and tune parameters in ${domainName}.`,
            quote: "Simplicity is the ultimate sophistication.",
            quoteCredits: "Leonardo da Vinci",
            lesson: `Once a system is functional, the focus shifts to optimization. We explore methods to refine performance, clean up calculations, and speed up loops. Applying these strategies helps reduce resource usage, decrease response times, and improve overall output quality.`,
            notes: `- Performance optimization checklist.\n- Advanced software extensions and integrations.\n- Monitoring parameters and logging strategies.`
          },
          {
            id: "3.2",
            title: "Security, Scaling, and Professional Ethics",
            description: `Protect application boundaries and ensure ethical compliance guidelines are met.`,
            quote: "The only limit to our realization of tomorrow will be our doubts of today.",
            quoteCredits: "Franklin D. Roosevelt",
            lesson: `Operating at scale requires establishing secure boundaries and adhering to professional standards. We examine security parameters, data protection protocols, and ethical compliance guidelines within ${domainName}. Maintaining these metrics prevents vulnerabilities and aligns your practice with recognized standards.`,
            notes: `- Basic security configurations.\n- Compliance requirements and review steps.\n- Scaling best practices and fallback designs.`
          }
        ]
      },
      {
        title: `Module 4: Project Capstone & Careers`,
        topics: [
          {
            id: "4.1",
            title: "Hands-on Capstone Walkthrough",
            description: `Build a comprehensive project applying all modules learned throughout the syllabus.`,
            quote: "The secret of getting ahead is getting started.",
            quoteCredits: "Mark Twain",
            lesson: `The capstone project compiles all modules into a practical project. In this lesson, we walk through setting up the initial blueprints, coordinating the different components, and resolving edge case issues. Completing this project demonstrates your proficiency and provides a key asset for your professional portfolio.`,
            notes: `- Complete blueprint layout.\n- Integration check steps.\n- Testing and verification patterns.`
          },
          {
            id: "4.2",
            title: "Review & Career Placement",
            description: `Refine your resume and prepare for technical interviews in ${domainName}.`,
            quote: "Opportunities don't happen. You create them.",
            quoteCredits: "Chris Grosser",
            lesson: `In this final topic, we discuss career placement paths, portfolio presentation guidelines, and typical technical questions asked in interviews. We focus on how to explain design choices, demonstrate problem-solving skills, and highlight your familiarity with industry standards.`,
            notes: `- Portfolio checklist.\n- Key questions and answers for technical interviews.\n- Industry resources and job board portals.`
          }
        ]
      }
    ]
  };
};

const courseData = new Proxy({}, {
  get: (target, name) => {
    return generateCurriculumForDomain(name);
  }
});
