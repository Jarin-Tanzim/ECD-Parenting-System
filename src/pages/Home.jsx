import { Link } from 'react-router-dom';
function Home() {
  return (
    <>
      <nav className="navbar">
        <div className="container">
          <a href="#" className="navbar-brand">
            <span className="brand-icon">🌱</span>
            ECD Parenting
          </a>

          <div className="navbar-links">
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <span className="badge hero-badge">🌟 Early Childhood Development</span>

          <h1>
            Every Child Deserves
            <br />
            the Best Start in Life
          </h1>

          <p className="hero-sub">
            A warm, guided platform helping parents nurture their child's growth
            from birth through the precious early years.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">Get Started - It's Free</Link>
            <Link to="/login" className="btn btn-outline">I Have an Account</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-header">
            <p className="section-label">What We Offer</p>
            <h2 className="section-title">
              Everything You Need,
              <br />
              All in One Place
            </h2>
            <p className="section-desc">
              From milestone tracking to expert-backed tips, ECD Parenting System
              supports you at every step.
            </p>
          </div>

          <div className="cards-grid">
            <div className="feature-card">
              <div className="card-icon icon-green">📊</div>
              <h3>Development Checker</h3>
              <p>
                Enter your child's age in months and instantly see the expected developmental
                milestones for that stage, helping you understand what's typical.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon icon-amber">🎨</div>
              <h3>Activity Suggestions</h3>
              <p>
                Receive age-appropriate, fun activity ideas that stimulate your child's
                cognitive, physical, and emotional development right at home.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon icon-blush">📖</div>
              <h3>Parenting Tips</h3>
              <p>
                Browse practical guidance across nutrition, behaviour, learning, and
                Islamic parenting practices, all in one easy-to-navigate panel.
              </p>
            </div>

            <div className="feature-card">
              <div className="card-icon icon-purple">💬</div>
              <h3>Chatbot Support</h3>
              <p>
                Ask simple questions about your child's speech, eating habits, crying, and
                more, and get instant, helpful guidance from our built-in chatbot.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="cta-banner">
          <h2>Ready to Support Your Child's Journey?</h2>
          <p>
            Join parents using ECD Parenting System to raise
            confident, healthy, and happy children.
          </p>
          <Link to="/register" className="btn btn-primary">Create a Free Account</Link>
        </div>
      </div>

      <footer>
        <p>
          &copy; 2025 <span>ECD Parenting System</span>. Supporting families, one milestone at a time.
        </p>
      </footer>
    </>
  );
}

export default Home;