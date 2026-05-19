import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  async function handleRegister(e) {
    e.preventDefault();

    setMessage('');
    setMessageType('');

    if (!name || !email || !password || !confirm) {
      setMessage('Please fill in all fields.');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setMessageType('error');
      return;
    }

    if (password !== confirm) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      setMessage('Account created successfully. Redirecting to login...');
      setMessageType('success');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setMessage('This email is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('Please enter a valid email address.');
      } else {
        setMessage('Something went wrong. Please try again.');
      }

      setMessageType('error');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-circle">🌱</div>
          <h2>Create Account</h2>
          <p>Join the ECD Parenting community today</p>
        </div>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              type="text"
              id="reg-name"
              placeholder="e.g. Fatima Rahman"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              type="email"
              id="reg-email"
              placeholder="e.g. fatima@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              type="password"
              id="reg-password"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              type="password"
              id="reg-confirm"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary form-btn">
            Create Account →
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>

        <p className="auth-footer-text back-home-link">
          <Link to="/">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;