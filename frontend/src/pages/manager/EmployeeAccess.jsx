import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Ban } from 'lucide-react';

const ALL_MODULES = ['invoices','expenses','payroll','ledger','reports','journal'];

export default function EmployeeAccess() {
  const [team, setTeam]             = useState([]);
  const [selected, setSelected]     = useState(null);
  const [permissions, setPerms]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    api.get('/api/users/my-team').then(r => setTeam(r.data)).finally(() => setLoading(false));
  }, []);

  const selectEmployee = async (emp) => {
    setSelected(emp);
    try {
      const res = await api.get(`/api/permissions/${emp.id}`);
      const map = {};
      res.data.permissions.forEach(p => { map[p.module] = p; });
      setPerms(map);
    } catch { toast.error('Failed to load permissions'); }
  };

  const togglePerm = (module, key) => {
    setPerms(prev => ({
      ...prev,
      [module]: { ...prev[module], [key]: !prev[module]?.[key] }
    }));
  };

  const toggleBlock = async () => {
    try {
      const res = await api.put(`/api/users/${selected.id}/block`);
      toast.success(res.data.message);
      setSelected(p => ({ ...p, is_blocked: !p.is_blocked }));
      setTeam(team.map(u => u.id === selected.id ? { ...u, is_blocked: !u.is_blocked } : u));
    } catch { toast.error('Failed to update block status'); }
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
      toast.success('Permissions saved!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Access Control</h1>
          <p className="page-subtitle">Manage module permissions for your team</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, alignItems:'start' }}>
        {/* Team List */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:'0.9rem' }}>
            My Team ({team.length})
          </div>
          {loading ? <div className="loading-center" style={{minHeight:100}}><div className="spinner"/></div> : (
            team.length === 0
              ? <div className="empty-state"><p>No employees in your team</p></div>
              : team.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'14px 20px', cursor:'pointer',
                    background: selected?.id===emp.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    borderLeft: selected?.id===emp.id ? '3px solid var(--accent)' : '3px solid transparent',
                    transition:'all 0.15s ease',
                    borderBottom:'1px solid var(--border)',
                  }}
                >
                  <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.78rem',flexShrink:0}}>
                    {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{fontWeight:500,color:'var(--text-primary)',fontSize:'0.875rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      {emp.name}
                      {emp.is_blocked && <Ban size={12} color="#ef4444"/>}
                    </div>
                    <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{emp.department}</div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Permission Panel */}
        <div className="card">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon">👆</div>
              <p>Select an employee to manage their module access</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1rem', display:'flex', alignItems:'center', gap:8 }}>
                    {selected.name}
                    {selected.is_blocked && <span className="badge overdue">Blocked</span>}
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{selected.email}</div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className={`btn ${selected.is_blocked ? 'btn-primary' : 'btn-ghost'}`} onClick={toggleBlock} style={{ color: selected.is_blocked ? '' : '#ef4444' }}>
                    <Ban size={15}/> {selected.is_blocked ? 'Unblock' : 'Block User'}
                  </button>
                  <button className="btn btn-primary" onClick={savePerms} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>

              <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:'0.8rem', color:'#fbbf24' }}>
                ⚠️ You can only grant modules that you yourself have access to.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr 1fr', gap:0, alignItems:'center' }}>
                <div style={{ padding:'8px 0', fontWeight:600, fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing: '0.05em' }}>Module</div>
                {['View','Create','Edit','Delete'].map(h=>(
                  <div key={h} style={{ padding:'8px 16px', fontWeight:600, fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', textAlign:'center', letterSpacing:'0.05em' }}>{h}</div>
                ))}
              </div>

              {ALL_MODULES.map(mod => (
                <div key={mod} className="permission-row" style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr 1fr', alignItems:'center' }}>
                  <div className="perm-module" style={{ paddingRight:16, textTransform:'capitalize' }}>
                    {mod === 'journal' ? '📖 Journal' : mod === 'invoices' ? '📄 Invoices' : mod === 'expenses' ? '💳 Expenses' : mod === 'payroll' ? '💰 Payroll' : mod === 'ledger' ? '📚 Ledger' : '📊 Reports'}
                  </div>
                  {['can_view','can_create','can_edit','can_delete'].map(key => (
                    <div key={key} style={{ textAlign:'center', padding:'0 16px' }}>
                      <input type="checkbox" checked={!!permissions[mod]?.[key]}
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
