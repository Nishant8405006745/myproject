import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Plus, Search, X, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, importFromExcel } from '../utils/excel';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const CATS = ['travel','utilities','marketing','office','salaries','other'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', category:'utilities', amount:'', date:'', vendor:'', status:'pending', notes:'' });
  const importRef = useRef();

  const load = () => api.get('/api/accounting/expenses').then(r => setExpenses(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/accounting/expenses', { ...form, amount: +form.amount });
      toast.success('Expense recorded!');
      setShowModal(false);
      setForm({ title:'', category:'utilities', amount:'', date:'', vendor:'', status:'pending', notes:'' });
      load();
    } catch (err) { toast.error('Failed to record expense'); }
  };

  const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));
  const total    = expenses.reduce((s,e) => s + e.amount, 0);
  const approved = expenses.filter(e => e.status==='approved').reduce((s,e) => s + e.amount, 0);

  const handleExport = () => {
    const data = filtered.map(exp => ({
      'Title':       exp.title,
      'Category':    exp.category,
      'Amount (INR)':exp.amount,
      'Date':        exp.date,
      'Vendor':      exp.vendor,
      'Status':      exp.status,
      'Notes':       exp.notes || '',
    }));
    exportToExcel(data, 'Expenses', 'HYGLOW_Expenses');
    toast.success('Expenses exported to Excel!');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importFromExcel(file, async (rows) => {
      let created = 0;
      for (const row of rows) {
        try {
          await api.post('/api/accounting/expenses', {
            title:    row['Title'] || '',
            category: row['Category'] || 'other',
            amount:   +row['Amount (INR)'] || 0,
            date:     row['Date'] || '',
            vendor:   row['Vendor'] || '',
            status:   row['Status'] || 'pending',
            notes:    row['Notes'] || '',
          });
          created++;
        } catch (_) {}
      }
      toast.success(`Imported ${created} expenses!`);
      load();
      e.target.value = '';
    }, (err) => toast.error(err));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track and manage business expenditures</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-ghost" onClick={handleExport}><Download size={15}/> Export Excel</button>
          <button className="btn btn-ghost" onClick={() => importRef.current?.click()}><Upload size={15}/> Import Excel</button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={handleImport}/>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> Add Expense</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Expenses', value:fmt(total),    color:'#ef4444' },
          { label:'Approved',       value:fmt(approved), color:'#10b981' },
          { label:'Pending',        value:expenses.filter(e=>e.status==='pending').length, color:'#f59e0b' },
          { label:'Categories',     value:CATS.length,   color:'#8b5cf6' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{'--card-accent':s.color}}>
            <div className="stat-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">All Expenses ({filtered.length})</span>
          <div className="search-wrapper"><Search/><input className="search-input" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <table>
            <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Vendor</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.length===0 ? <tr><td colSpan={6}><div className="empty-state"><p>No expenses found</p></div></td></tr>
              : filtered.map(exp=>(
                <tr key={exp.id}>
                  <td><span style={{fontWeight:500, color:'var(--text-primary)'}}>{exp.title}</span></td>
                  <td><span className="badge" style={{background:'rgba(139,92,246,0.1)',color:'#a78bfa',border:'1px solid rgba(139,92,246,0.2)'}}>{exp.category}</span></td>
                  <td style={{fontWeight:600,color:'#ef4444'}}>{fmt(exp.amount)}</td>
                  <td>{exp.date}</td>
                  <td>{exp.vendor}</td>
                  <td><span className={`badge ${exp.status}`}>{exp.status}</span></td>
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
              <span className="modal-title">Add Expense</span>
              <button className="modal-close" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Title *</label><input className="form-input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Amount (₹) *</label><input className="form-input" type="number" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Date *</label><input className="form-input" type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Vendor</label><input className="form-input" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    <option value="pending">Pending</option><option value="approved">Approved</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
