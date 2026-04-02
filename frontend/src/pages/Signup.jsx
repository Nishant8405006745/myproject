import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', department: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/signup', {
        name:       form.name,
        email:      form.email,
        password:   form.password,
        department: form.department || 'General',
        phone:      form.phone,
      });
      toast.success('Account created! Waiting for admin activation.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) });

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
            <UserPlus size={22} />
          </div>
          <div className="login-logo-text">
            <h1>HYGLOW</h1>
            <p>Create your account</p>
          </div>
        </div>

        <div className="login-header">
          <h2>Sign Up</h2>
          <p>Fill in the details below to register</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required placeholder="Jane Doe" {...f('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" required placeholder="jane@company.com" {...f('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" placeholder="e.g. Finance" {...f('department')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+91 9876543210" {...f('phone')} />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password *</label>
              <input className="form-input" type={showPw ? 'text' : 'password'} required placeholder="Min 6 characters" {...f('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:34, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type={showPw ? 'text' : 'password'} required placeholder="Repeat password" {...f('confirm')} />
            </div>
          </div>

          <div className="signup-notice" style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:'0.82rem', color:'var(--text-muted)', lineHeight:1.5 }}>
            ℹ️ After signing up, an admin must activate your account before you can log in.
          </div>

          <button className="btn btn-primary" style={{ width:'100%', padding:'12px', fontSize:'1rem', marginBottom:16 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.85rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent-light)', textDecoration:'none', fontWeight:600 }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
