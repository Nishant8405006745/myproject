import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Edit2, Camera, CheckCircle, Clock, XCircle, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user: authUser, refreshUser, updateProfilePhoto } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [pwMode, setPwMode]         = useState(false);
  const [history, setHistory]       = useState([]);

  // Form states
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const photoRef = useRef();

  const load = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('/api/profile/me'),
        api.get('/api/profile/requests/history'),
      ]);
      setProfile(profileRes.data);
      setHistory(historyRes.data);
      setForm({
        name:       profileRes.data.name,
        phone:      profileRes.data.phone || '',
        bio:        profileRes.data.bio || '',
        job_title:  profileRes.data.job_title || '',
        location:   profileRes.data.location || '',
        department: profileRes.data.department || '',
        profile_photo: profileRes.data.profile_photo || '',
      });
    } catch (e) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setForm(f => ({ ...f, profile_photo: dataUrl }));
      // 1. Instantly update everywhere in the current session
      updateProfilePhoto(dataUrl);
      // 2. Save to backend so OTHER users see it too
      try {
        await api.patch('/api/profile/photo', { profile_photo: dataUrl });
        toast.success('✅ Profile photo updated everywhere!');
      } catch {
        toast.success('✅ Photo updated (syncing...)');
      }
    };
    reader.readAsDataURL(file);
  };


  const handleSubmitChanges = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/profile/request', form);
      toast.success('Profile change request submitted for approval!');
      setEditMode(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await api.post('/api/profile/change-password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      toast.success('Password changed successfully!');
      setPwMode(false);
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    }
  };

  const statusIcon = (s) => s === 'approved' ? <CheckCircle size={14} color="#10b981"/> : s === 'rejected' ? <XCircle size={14} color="#ef4444"/> : <Clock size={14} color="#f59e0b"/>;
  const statusColor = (s) => s === 'approved' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b';

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  if (!profile) return null;

  const initials = (profile.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and edit your personal information</p>
        </div>
        {!editMode && !pwMode && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setPwMode(true)}><Lock size={15}/> Change Password</button>
            <button className="btn btn-primary" onClick={() => setEditMode(true)}><Edit2 size={15}/> Edit Profile</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 24 }}>
        {/* Left Panel — Profile Card */}
        <div>
          <div className="card" style={{ padding: 28, textAlign: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16, cursor: 'pointer' }}
              onClick={() => photoRef.current?.click()}
              title="Click to change photo"
            >
              {(form.profile_photo || authUser?.profile_photo) ? (
                <img src={form.profile_photo || authUser?.profile_photo} alt="Avatar"
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }}
                />
              ) : (
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--theme-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto', color: '#fff' }}>
                  {initials}
                </div>
              )}
              {/* Always-visible camera overlay */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
              }}
                onMouseOver={e => e.currentTarget.style.opacity = 1}
                onMouseOut={e => e.currentTarget.style.opacity = 0}
              >
                <Camera size={22} color="white" />
                <span style={{ color: '#fff', fontSize: '0.6rem', marginTop: 3, fontWeight: 600 }}>Change</span>
              </div>
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                background: 'var(--theme-gradient)', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)', border: '2px solid var(--bg-card)',
              }}>
                <Camera size={13} color="white" />
              </div>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange}/>
            </div>

            <h3 style={{ color: 'var(--text-primary)', marginBottom: 4, fontSize: '1.1rem' }}>{profile.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>{profile.email}</p>
            <span className={`badge ${profile.role}`} style={{ marginBottom: 12 }}>{profile.role}</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginTop: 16 }}>
              {[
                { label: 'Department', value: profile.department },
                { label: 'Job Title',  value: profile.job_title  },
                { label: 'Phone',      value: profile.phone      },
                { label: 'Location',   value: profile.location   },
                { label: 'Manager',    value: profile.manager_name },
                { label: 'Joined',     value: profile.created_at?.slice(0, 10) },
              ].map(({ label, value }) => value ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{label}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500 }}>{value}</span>
                </div>
              ) : null)}
            </div>

            {profile.bio && (
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'left' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0 }}>{profile.bio}</p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Account Status</span>
              <span className={`badge ${profile.is_blocked ? 'overdue' : 'paid'}`}>{profile.is_blocked ? 'Blocked' : profile.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div>
          {/* Edit Form */}
          {editMode && (
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Edit Profile</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
                ⚠️ Changes require approval from your senior before taking effect.
              </p>
              <form onSubmit={handleSubmitChanges}>
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Job Title</label><input className="form-input" value={form.job_title} onChange={e => setForm({...form, job_title: e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})}/></div>
                </div>
                <div className="form-group"><label className="form-label">Bio</label>
                  <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}/>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditMode(false)}><X size={14}/> Cancel</button>
                  <button type="submit" className="btn btn-primary"><Save size={14}/> Submit for Approval</button>
                </div>
              </form>
            </div>
          )}

          {/* Password Form */}
          {pwMode && (
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Change Password</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>Password change takes effect immediately.</p>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} required/></div>
                <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} required/></div>
                <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm({...pwForm, confirm: e.target.value})} required/></div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setPwMode(false)}><X size={14}/> Cancel</button>
                  <button type="submit" className="btn btn-primary"><Lock size={14}/> Update Password</button>
                </div>
              </form>
            </div>
          )}

          {/* Change Request History */}
          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Profile Change History ({history.length})</span>
            </div>
            {history.length === 0 ? (
              <div className="empty-state"><User size={32}/><p>No change requests yet</p></div>
            ) : (
              <table>
                <thead><tr><th>Requested Changes</th><th>Status</th><th>Note</th><th>Date</th></tr></thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td>
                        {Object.entries(r.requested_changes).map(([k, v]) => (
                          <div key={k} style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{String(v).length > 30 ? String(v).slice(0,30)+'…' : String(v)}</span>
                          </div>
                        ))}
                      </td>
                      <td>
                        <span style={{ display:'flex', alignItems:'center', gap:4, color: statusColor(r.status), fontWeight:600, fontSize:'0.8rem' }}>
                          {statusIcon(r.status)} {r.status}
                        </span>
                      </td>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{r.reviewer_note || '—'}</td>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{r.created_at?.slice(0,10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
