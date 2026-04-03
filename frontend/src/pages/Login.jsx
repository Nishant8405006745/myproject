import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_CREDS = [
  { role: 'Admin',    email: 'admin@acme.com',         password: 'Admin@123' },
  { role: 'Manager',  email: 'sarah.manager@acme.com', password: 'Manager@123' },
  { role: 'Manager',  email: 'john.manager@acme.com',  password: 'Manager@123' },
  { role: 'Employee', email: 'alice@acme.com',          password: 'Employee@123' },
  { role: 'Employee', email: 'bob@acme.com',            password: 'Employee@123' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      const d = err.response?.data?.detail;
      const net = err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      setError(
        d ||
          (net ? 'Cannot reach the server. Wait for Render to wake up (~1 min) and try again.' : null) ||
          err.message ||
          'Invalid credentials. Please try again.',
      );
    } finally { setLoading(false); }
  };

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">A</div>
          <div className="login-logo-text">
            <h1>HYGLOW</h1>
            <p>Accounting Management Suite</p>
          </div>
        </div>

        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in to access your dashboard</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="login-input-wrapper">
            <Mail className="login-input-icon" />
            <input
              type="email"
              className="login-input"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-input-wrapper">
            <Lock className="login-input-icon" />
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-creds">
          <h4>Quick Login (Demo)</h4>
          {DEMO_CREDS.map((c, i) => (
            <div key={i} className="demo-cred-item" onClick={() => fillDemo(c)}>
              <span className={`badge ${c.role.toLowerCase()} demo-cred-role`}>{c.role}</span>
              <span className="demo-cred-email">{c.email}</span>
            </div>
          ))}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Click any row to auto-fill credentials
          </p>
        </div>

        {typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: '0.75rem',
              lineHeight: 1.45,
              color: 'var(--text-muted)',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Hosted on Render?</strong> Use{' '}
            <strong>admin@acme.com</strong> / <strong>Admin@123</strong> after the database is seeded.
            Your service can set <code style={{ fontSize: '0.7rem' }}>AUTO_SEED_ADMIN=1</code> (see{' '}
            <code style={{ fontSize: '0.7rem' }}>render.yaml</code>) or run <code style={{ fontSize: '0.7rem' }}>python seed.py</code> in the Render Shell.
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link to="/signup" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
    </div>
  );
}
