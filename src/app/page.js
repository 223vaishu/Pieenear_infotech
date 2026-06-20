"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const quotes = [
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Technology is just a tool. In terms of getting the kids working together and motivating them, the teacher is the most important.", author: "Bill Gates" }
];

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [fade, setFade] = useState(true);

  // Apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 300); // sync with CSS fade out transition
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Background Decorative Globs */}
      <div style={styles.glowBg1}></div>
      <div style={styles.glowBg2}></div>

      {/* Canva/MongoDB styled Header Nav */}
      <header style={styles.header}>
        <div style={styles.navBrand}>
          <span style={styles.logoIcon}>P</span>
          <span style={styles.logoText}>Pieenear<span style={styles.logoSubText}>Infotech</span></span>
        </div>
        <nav style={styles.navMenu}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#about" style={styles.navLink}>About</a>
          <a href="#portals" style={styles.navLink}>Portals</a>
        </nav>
        <div style={styles.navActions}>
          <Link href="/login" className="btn btn-secondary" style={styles.loginBtn}>
            Log In
          </Link>
          <Link href="/login" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Landing Showcase */}
      <main style={styles.main}>
        {/* Hero Section */}
        <section style={styles.heroSection}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>Next-Gen Portal v1.0</span>
            <h1 style={styles.heroTitle}>
              Connect, Manage, and <br />
              <span className="gradient-text">Master Your Studies</span>
            </h1>
            <p style={styles.heroSubtitle}>
              A comprehensive administrative workspace and student portal designed to streamline credentials, course materials, and progress tracking in a secure ecosystem.
            </p>
            <div style={styles.heroBtns}>
              <Link href="/login" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "1.05rem" }}>
                Enter Portal Workspace
              </Link>
              <a href="#features" className="btn btn-secondary" style={{ padding: "14px 28px", fontSize: "1.05rem" }}>
                Explore Modules
              </a>
            </div>
          </div>

          {/* Interactive Quotes Carousel (Glassmorphic) */}
          <div style={styles.carouselContainer}>
            <div className="glass-panel glass-panel-hover" style={styles.quoteCard}>
              <div style={styles.quoteIcon}>“</div>
              <p style={{
                ...styles.quoteText,
                opacity: fade ? 1 : 0,
                transform: fade ? "translateY(0)" : "translateY(5px)",
                transition: "opacity 0.3s ease, transform 0.3s ease"
              }}>
                {quotes[currentQuote].text}
              </p>
              <div style={{
                ...styles.quoteAuthor,
                opacity: fade ? 1 : 0,
                transition: "opacity 0.3s ease"
              }}>
                — {quotes[currentQuote].author}
              </div>
              <div style={styles.carouselIndicators}>
                {quotes.map((_, index) => (
                  <span
                    key={index}
                    style={{
                      ...styles.indicatorDot,
                      backgroundColor: index === currentQuote ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.2)"
                    }}
                    onClick={() => {
                      setFade(false);
                      setTimeout(() => {
                        setCurrentQuote(index);
                        setFade(true);
                      }, 200);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid Section */}
        <section id="features" style={styles.featuresSection}>
          <h2 style={styles.sectionTitle}>Built for Administrators & Students</h2>
          <p style={styles.sectionSubtitle}>
            Engineered with a Canva-like visual layout and MongoDB-grade scalability patterns.
          </p>
          <div style={styles.grid}>
            {/* Feature 1 */}
            <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
              <div style={{ ...styles.cardIconBox, background: "rgba(99, 102, 241, 0.15)", color: "var(--accent-primary)" }}>
                🔐
              </div>
              <h3 style={styles.cardTitle}>One-Click Credentials</h3>
              <p style={styles.cardText}>
                Administrators generate instant, secure access keys for student portals, eliminating complex sign-up hurdles.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
              <div style={{ ...styles.cardIconBox, background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-secondary)" }}>
                🎓
              </div>
              <h3 style={styles.cardTitle}>Learning Desk</h3>
              <p style={styles.cardText}>
                Students gain a streamlined learning environment complete with dynamic course progress tracking and study materials.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="glass-panel glass-panel-hover" style={styles.featureCard}>
              <div style={{ ...styles.cardIconBox, background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)" }}>
                ⚡
              </div>
              <h3 style={styles.cardTitle}>Real-time Support</h3>
              <p style={styles.cardText}>
                Submit academic and technical doubts directly to the administrator dashboard from the student portal interface.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p>© 2026 Pieenear Infotech. All rights reserved.</p>
          <div style={styles.footerLinks}>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  glowBg1: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)",
    top: "-100px",
    right: "-100px",
    zIndex: -1,
  },
  glowBg2: {
    position: "absolute",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(0,0,0,0) 70%)",
    bottom: "-200px",
    left: "-100px",
    zIndex: -1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 6%",
    background: "var(--bg-card)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--border-color)",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "#fff",
    fontSize: "1.2rem",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  logoText: {
    fontSize: "1.3rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  logoSubText: {
    color: "var(--accent-primary)",
    fontWeight: 400,
    fontSize: "0.95rem",
    marginLeft: "4px",
  },
  navMenu: {
    display: "flex",
    gap: "35px",
    alignItems: "center",
  },
  navLink: {
    fontSize: "0.95rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    textDecoration: "none",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  loginBtn: {
    marginRight: "5px",
    padding: "10px 18px",
  },
  main: {
    flexGrow: 1,
    padding: "0 6%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  heroSection: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "60px",
    alignItems: "center",
    padding: "100px 0 80px 0",
    minHeight: "calc(80vh - 80px)",
  },
  heroContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  badge: {
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    color: "var(--accent-primary)",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "24px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  heroTitle: {
    fontSize: "3.5rem",
    lineHeight: "1.15",
    fontWeight: 800,
    color: "var(--text-primary)",
    marginBottom: "20px",
    letterSpacing: "-0.03em",
  },
  heroSubtitle: {
    fontSize: "1.15rem",
    lineHeight: "1.6",
    color: "var(--text-secondary)",
    marginBottom: "35px",
    maxWidth: "540px",
  },
  heroBtns: {
    display: "flex",
    gap: "15px",
  },
  carouselContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  quoteCard: {
    width: "100%",
    maxWidth: "460px",
    padding: "45px 35px 35px 35px",
    position: "relative",
    borderRadius: "var(--border-radius-lg)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    minHeight: "280px",
    justifyContent: "space-between",
  },
  quoteIcon: {
    position: "absolute",
    top: "10px",
    left: "25px",
    fontSize: "5rem",
    color: "rgba(99, 102, 241, 0.15)",
    fontFamily: "Georgia, serif",
    lineHeight: 1,
  },
  quoteText: {
    fontSize: "1.2rem",
    fontWeight: 500,
    lineHeight: "1.6",
    color: "var(--text-primary)",
    fontStyle: "italic",
    marginBottom: "20px",
    zIndex: 1,
  },
  quoteAuthor: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "var(--accent-cyan)",
    marginBottom: "25px",
  },
  carouselIndicators: {
    display: "flex",
    gap: "8px",
    marginTop: "auto",
  },
  indicatorDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  featuresSection: {
    padding: "80px 0 100px 0",
    borderTop: "1px solid var(--border-color)",
  },
  sectionTitle: {
    fontSize: "2.2rem",
    fontWeight: 800,
    textAlign: "center",
    marginBottom: "12px",
    letterSpacing: "-0.02em",
  },
  sectionSubtitle: {
    fontSize: "1.05rem",
    color: "var(--text-secondary)",
    textAlign: "center",
    marginBottom: "50px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },
  featureCard: {
    padding: "35px",
    borderRadius: "var(--border-radius-md)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  cardIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "1.5rem",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "12px",
    color: "var(--text-primary)",
  },
  cardText: {
    fontSize: "0.95rem",
    color: "var(--text-secondary)",
    lineHeight: "1.6",
  },
  footer: {
    borderTop: "1px solid var(--border-color)",
    padding: "30px 6%",
    background: "var(--bg-secondary)",
  },
  footerInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
    color: "var(--text-muted)",
  },
  footerLinks: {
    display: "flex",
    gap: "20px",
  }
};
