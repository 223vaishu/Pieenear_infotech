"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("student"); // 'student' or 'admin'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load and apply display theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Pre-fill fields on tab change to make testing extremely easy for the user
  useEffect(() => {
    setError("");
    if (activeTab === "admin") {
      setEmail("admin@pieenear.com");
      setPassword("admin123");
    } else {
      setEmail("student@pieenear.com");
      setPassword("student123");
    }
  }, [activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Safety fallback check if Supabase client failed to initialize
    if (!supabase || !supabase.auth) {
      console.warn("Supabase client is not active. Using local fallback.");
      runLocalFallback("Supabase client is not initialized. Using local fallback.");
      return;
    }

    supabase.auth.signInWithPassword({ email: email.trim(), password })
      .then(({ data, error: sbError }) => {
        if (sbError) {
          console.warn("Supabase auth failed, using local fallback:", sbError.message);
          runLocalFallback(sbError.message);
          return;
        }

        const user = data.user;
        const metadata = user.user_metadata || {};
        const role = metadata.role === "admin" || email.trim() === "admin@pieenear.com" ? "admin" : "student";

        if (activeTab !== role) {
          setError(`This email is registered as a ${role}. Please switch tabs.`);
          supabase.auth.signOut();
          setLoading(false);
          return;
        }

        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", user.email);

        if (role === "admin") {
          localStorage.setItem("userName", metadata.name || "Portal Administrator");
          router.push("/admin");
        } else {
          const studentProfile = {
            id: user.id,
            name: metadata.name || "Alex Mercer",
            email: user.email,
            course: metadata.course || "Web Development",
            joinedDate: metadata.joinedDate || "June 2026",
            status: metadata.status || "Active"
          };
          localStorage.setItem("currentStudent", JSON.stringify(studentProfile));
          router.push("/student");
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Helper for local fallback authentication
    function runLocalFallback(errorMessage = "") {
      if (activeTab === "admin") {
        if (email.trim() === "admin@pieenear.com" && password === "admin123") {
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("userEmail", "admin@pieenear.com");
          localStorage.setItem("userName", "Portal Administrator");
          router.push("/admin");
          return;
        }
      } else {
        let matchedStudent = null;
        if (email.trim() === "student@pieenear.com" && password === "student123") {
          matchedStudent = {
            name: "Alex Mercer",
            email: "student@pieenear.com",
            course: "Web Development",
            joinedDate: "June 2026",
            status: "Active"
          };
        } else {
          const storedStudents = JSON.parse(localStorage.getItem("pieenear_students") || "[]");
          const found = storedStudents.find(
            (s) => s.email.toLowerCase() === email.trim().toLowerCase() && s.password === password
          );
          if (found) matchedStudent = found;
        }

        if (matchedStudent) {
          localStorage.setItem("userRole", "student");
          localStorage.setItem("currentStudent", JSON.stringify(matchedStudent));
          router.push("/student");
          return;
        }
      }
      setError(errorMessage || "Invalid credentials. Switch tabs or check configurations.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Glow Rings */}
      <div style={styles.glowBg}></div>

      {/* Main Card */}
      <div className="glass-panel animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={styles.brand}>
              <span style={styles.logoIcon}>P</span>
              <span style={styles.brandName}>Pieenear</span>
            </div>
          </Link>
          <p style={styles.subtitle}>Unified Workspace Access</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <button
            style={{
              ...styles.tabBtn,
              borderBottomColor: activeTab === "student" ? "var(--accent-primary)" : "transparent",
              color: activeTab === "student" ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            onClick={() => setActiveTab("student")}
            disabled={loading}
          >
            🧑‍🎓 Student Portal
          </button>
          <button
            style={{
              ...styles.tabBtn,
              borderBottomColor: activeTab === "admin" ? "var(--accent-secondary)" : "transparent",
              color: activeTab === "admin" ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            onClick={() => setActiveTab("admin")}
            disabled={loading}
          >
            🛠️ Administrator
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={styles.errorAlert}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "25px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Password</label>
              <a href="#" style={styles.forgotLink}>Forgot password?</a>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              ...styles.submitBtn,
              background: activeTab === "admin" 
                ? "linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)" 
                : "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)",
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.spinner}></span>
            ) : (
              `Access ${activeTab === "admin" ? "Admin" : "Student"} Workspace`
            )}
          </button>
        </form>

        {/* Credentials Suggestion Info Box */}
        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>💡 Demo Credentials Info</h4>
          {activeTab === "admin" ? (
            <p style={styles.infoText}>
              <strong>Login:</strong> <code style={styles.code}>admin@pieenear.com</code> <br />
              <strong>Password:</strong> <code style={styles.code}>admin123</code>
            </p>
          ) : (
            <p style={styles.infoText}>
              <strong>Login:</strong> <code style={styles.code}>student@pieenear.com</code> <br />
              <strong>Password:</strong> <code style={styles.code}>student123</code> <br />
              <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>
                * Or log in with credentials you generate from the Admin Portal!
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--bg-primary)",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },
  glowBg: {
    position: "absolute",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)",
    zIndex: 0,
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "40px",
    borderRadius: "var(--border-radius-xl)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
    zIndex: 1,
    position: "relative",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "30px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  logoIcon: {
    width: "30px",
    height: "30px",
    background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "#fff",
    fontSize: "1rem",
  },
  brandName: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "var(--text-secondary)",
  },
  tabsContainer: {
    display: "flex",
    borderBottom: "1px solid var(--border-color)",
    marginBottom: "25px",
  },
  tabBtn: {
    flex: 1,
    padding: "12px 0",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
    outline: "none",
  },
  errorAlert: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    border: "1px solid var(--accent-rose)",
    color: "var(--accent-rose)",
    padding: "12px",
    borderRadius: "var(--border-radius-sm)",
    fontSize: "0.85rem",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  form: {
    width: "100%",
  },
  forgotLink: {
    fontSize: "0.8rem",
    color: "var(--accent-primary)",
    textDecoration: "none",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#fff",
    border: "none",
    borderRadius: "var(--border-radius-md)",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTopColor: "#fff",
    animation: "spin 1s ease-in-out infinite",
  },
  infoBox: {
    marginTop: "25px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--border-radius-md)",
    padding: "15px",
  },
  infoTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "6px",
  },
  infoText: {
    fontSize: "0.85rem",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
  },
  code: {
    fontFamily: "var(--font-mono)",
    background: "var(--bg-secondary)",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "var(--text-primary)",
  }
};
