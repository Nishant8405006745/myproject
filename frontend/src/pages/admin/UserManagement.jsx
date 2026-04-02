import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Edit2, X, Search, Download, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/excel';

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState({ name:'', email:'', password:'', role:'employee', department:'General', manager_id:'' });

  const load = () => api.get('/api/users/').then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const managers = users.filter(u => u.role === 'manager');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/users/', { ...form, manager_id: form.manager_id ? +form.manager_id : null });
      toast.success('User created!');
      setShowModal(false);
      setForm({ name:'', email:'', password:'', role:'employee', department:'General', manager_id:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create user'); }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/api/users/${user.id}`, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed to update user'); }
  };

  const toggleBlock = async (user) => {
    try {
      const res = await api.put(`/api/users/${user.id}/block`);
      toast.success(res.data.message);
      load();
    } catch { toast.error('Failed to update block status'); }
  };


  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to delete user'); }
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const handleExport = () => {
    const data = filtered.map(u => ({
      'Name':       u.name,
      'Email':      u.email,
      'Role':       u.role,
      'Department': u.department,
      'Active':     u.is_active ? 'Yes' : 'No',
    }));
    exportToExcel(data, 'Users', 'HYGLOW_Users');
    toast.success('Users exported to Excel!');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create and manage all system users</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={handleExport}><Download size={15}/> Export Excel</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> Add User</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Users', value:users.length, color:'#3b82f6' },
          { label:'Admins',      value:users.filter(u=>u.role==='admin').length, color:'#8b5cf6' },
          { label:'Managers',    value:users.filter(u=>u.role==='manager').length, color:'#06b6d4' },
          { label:'Employees',   value:users.filter(u=>u.role==='employee').length, color:'#10b981' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{'--card-accent':s.color}}>
            <div className="stat-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">All Users ({filtered.length})</span>
          <div className="search-wrapper">
            <Search size={16}/>
            <input className="search-input" placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.75rem',flexShrink:0}}>
                        {user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span style={{fontWeight:500,color:'var(--text-primary)'}}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{user.email}</td>
                  <td><span className={`badge ${user.role}`}>{user.role}</span></td>
                  <td>{user.department}</td>
                  <td>
                    {user.is_blocked ? (
                      <span className="badge overdue">Blocked</span>
                    ) : (
                      <span className="badge paid">Active</span>
                    )}
                  </td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={user.is_active} onChange={() => toggleActive(user)}/>
                      <span className="toggle-slider"/>
                    </label>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteUser(user.id)} title="Delete user" style={{ marginRight: 6 }}>
                      <Trash2 size={14}/>
                    </button>
                    <button className={`btn btn-icon btn-sm ${user.is_blocked ? 'btn-primary' : 'btn-danger'}`} onClick={() => toggleBlock(user)} title={user.is_blocked ? "Unblock user" : "Block user"}>
                      <Ban size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add New User</span>
              <button className="modal-close" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Role *</label>
                  <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></div>
                {form.role==='employee' && (
                  <div className="form-group"><label className="form-label">Manager</label>
                    <select className="form-select" value={form.manager_id} onChange={e=>setForm({...form,manager_id:e.target.value})}>
                      <option value="">Select manager</option>
                      {managers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
