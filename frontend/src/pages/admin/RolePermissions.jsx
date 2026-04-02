import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ALL_MODULES = ['invoices','expenses','payroll','ledger','reports','journal'];
const MODULE_ICONS = { invoices:'📄', expenses:'💳', payroll:'💰', ledger:'📚', reports:'📊', journal:'📖' };

export default function RolePermissions() {
  const [users, setUsers]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [permissions, setPerms] = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/api/users/').then(r => {
      // Show only managers in permission panel (admin manages manager perms)
      setUsers(r.data.filter(u => u.role !== 'admin'));
    }).finally(() => setLoading(false));
  }, []);

  const selectUser = async (user) => {
    setSelected(user);
    try {
      const res = await api.get(`/api/permissions/${user.id}`);
      const map = {};
      res.data.permissions.forEach(p => { map[p.module] = { ...p }; });
      setPerms(map);
    } catch { toast.error('Failed to load permissions'); }
  };

  const togglePerm = (module, key) => {
    setPerms(prev => ({
      ...prev,
      [module]: { ...prev[module], [key]: !prev[module]?.[key] }
    }));
  };

  const grantAll = () => {
    const all = {};
    ALL_MODULES.forEach(m => { all[m] = { module:m, can_view:true, can_create:true, can_edit:true, can_delete:true }; });
    setPerms(all);
  };

  const revokeAll = () => {
    const none = {};
    ALL_MODULES.forEach(m => { none[m] = { module:m, can_view:false, can_create:false, can_edit:false, can_delete:false }; });
    setPerms(none);
  };

  const savePerms = async () => {
    setSaving(true);
    try {
      const list = ALL_MODULES.map(mod => ({
        module: mod,
        can_view:   !!permissions[mod]?.can_view,
        can_create: !!permissions[mod]?.can_create,
        can_edit:   !!permissions[mod]?.can_edit,
        can_delete: !!permissions[mod]?.can_delete,
      }));
      await api.put(`/api/permissions/${selected.id}`, { permissions: list });
      toast.success('Permissions updated!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const managers = users.filter(u => u.role === 'manager');
  const employees = users.filter(u => u.role === 'employee');

  const RoleSection = ({ title, userList }) => (
    <>
      <div style={{ padding:'10px 20px 6px', fontWeight:600, fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border)' }}>
        {title}
      </div>
      {userList.map(u => (
        <div key={u.id} onClick={() => selectUser(u)} style={{
          display:'flex', alignItems:'center', gap:12, padding:'12px 20px', cursor:'pointer',
          background: selected?.id===u.id ? 'rgba(59,130,246,0.1)' : 'transparent',
          borderLeft: selected?.id===u.id ? '3px solid var(--accent)' : '3px solid transparent',
          borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'all 0.15s',
        }}>
          <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.72rem',flexShrink:0}}>
            {u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:500,color:'var(--text-primary)',fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
            <span className={`badge ${u.role}`} style={{fontSize:'0.62rem'}}>{u.role}</span>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Permissions</h1>
          <p className="page-subtitle">Configure module access for managers and employees</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' }}>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:'0.9rem' }}>Select User</div>
          {loading ? <div className="loading-center" style={{minHeight:80}}><div className="spinner"/></div> : (
            <>
              <RoleSection title="Managers" userList={managers} />
              <RoleSection title="Employees" userList={employees} />
            </>
          )}
        </div>

        <div className="card">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon">🔐</div>
              <p>Select a user from the left panel to configure their permissions</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1rem' }}>{selected.name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{selected.email} • {selected.department}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={revokeAll}>Revoke All</button>
                  <button className="btn btn-success btn-sm" onClick={grantAll}>Grant All</button>
                  <button className="btn btn-primary btn-sm" onClick={savePerms} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save'}
                  </button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'180px repeat(4,1fr)', gap:0 }}>
                <div style={{ padding:'8px 0', fontWeight:600, fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid var(--border)' }}>Module</div>
                {['View','Create','Edit','Delete'].map(h => (
                  <div key={h} style={{ padding:'8px 0', fontWeight:600, fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', textAlign:'center', letterSpacing:'0.05em', borderBottom:'1px solid var(--border)' }}>{h}</div>
                ))}
              </div>

              {ALL_MODULES.map(mod => (
                <div key={mod} className="permission-row" style={{ display:'grid', gridTemplateColumns:'180px repeat(4,1fr)', alignItems:'center' }}>
                  <div style={{ fontWeight:500, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8 }}>
                    <span>{MODULE_ICONS[mod]}</span>
                    <span style={{ textTransform:'capitalize' }}>{mod}</span>
                  </div>
                  {['can_view','can_create','can_edit','can_delete'].map(key => (
                    <div key={key} style={{ textAlign:'center' }}>
                      <input type="checkbox"
                        checked={!!permissions[mod]?.[key]}
                        onChange={() => togglePerm(mod, key)}
                        style={{ accentColor:'var(--accent)', width:16, height:16, cursor:'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
