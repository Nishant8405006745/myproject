import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CheckCircle, XCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [noteMap, setNoteMap]   = useState({});

  const load = () => {
    api.get('/api/profile/requests').then(r => setRequests(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (id, approve) => {
    try {
      await api.put(`/api/profile/requests/${id}/review`, {
        approve,
        note: noteMap[id] || '',
      });
      toast.success(approve ? 'Request approved!' : 'Request rejected!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to review request');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Change Requests</h1>
          <p className="page-subtitle">Review and approve team member profile update requests</p>
        </div>
        <div className="stat-card" style={{ '--card-accent': '#f59e0b', padding: '10px 18px', minWidth: 'unset' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{requests.length}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>Pending</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner"/></div>
      ) : requests.length === 0 ? (
        <div className="empty-state" style={{ padding: 60 }}>
          <CheckCircle size={48} color="var(--text-muted)"/>
          <h3 style={{ color: 'var(--text-muted)', marginTop: 16 }}>All clear!</h3>
          <p>No pending profile change requests at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(req => (
            <div key={req.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                {/* User info */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {req.user_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.user_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.user_email}</div>
                    <span className={`badge ${req.user_role}`} style={{ marginTop: 4 }}>{req.user_role}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Requested: {req.created_at?.slice(0, 10)}
                </div>
              </div>

              {/* Changes comparison */}
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: 14 }}>
                  <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', marginBottom: 10 }}>Current Values</div>
                  {Object.keys(req.requested_changes).map(k => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g,' ')}</span>
                      <span style={{ color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.current_values[k] ? String(req.current_values[k]).slice(0,40) : <em style={{ opacity:0.5 }}>empty</em>}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: 14 }}>
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem', marginBottom: 10 }}>Requested New Values</div>
                  {Object.entries(req.requested_changes).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g,' ')}</span>
                      <span style={{ color: '#10b981', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {k === 'profile_photo' ? '📷 New Photo' : String(v).slice(0,40)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note + Actions */}
              <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 200 }}
                  placeholder="Optional note to requester..."
                  value={noteMap[req.id] || ''}
                  onChange={e => setNoteMap({ ...noteMap, [req.id]: e.target.value })}
                />
                <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} onClick={() => handleReview(req.id, true)}>
                  <CheckCircle size={14}/> Approve
                </button>
                <button className="btn btn-danger" onClick={() => handleReview(req.id, false)}>
                  <XCircle size={14}/> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
