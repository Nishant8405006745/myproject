import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel } from '../utils/excel';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const ACCOUNTS = ['Cash','Accounts Receivable','Accounts Payable','Revenue','Salaries Expense','Rent Expense','Utilities Expense','Equipment','Capital','Retained Earnings','Bank'];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date:'', description:'', debit_account:'Cash', credit_account:'Revenue', amount:'', reference:'', status:'draft' });

  const load = () => api.get('/api/accounting/journal').then(r => setEntries(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/accounting/journal', { ...form, amount: +form.amount });
      toast.success('Journal entry created!');
      setShowModal(false);
      setForm({ date:'', description:'', debit_account:'Cash', credit_account:'Revenue', amount:'', reference:'', status:'draft' });
      load();
    } catch (err) { toast.error('Failed to create entry'); }
  };

  const handleExport = () => {
    const data = entries.map(e => ({
      'Entry #':        e.entry_number,
      'Date':           e.date,
      'Description':    e.description,
      'Debit Account':  e.debit_account,
      'Credit Account': e.credit_account,
      'Amount (INR)':   e.amount,
      'Reference':      e.reference,
      'Status':         e.status,
    }));
    exportToExcel(data, 'Journal', 'HYGLOW_Journal');
    toast.success('Journal exported to Excel!');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal Entries</h1>
          <p className="page-subtitle">Double-entry bookkeeping records</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost" onClick={handleExport}><Download size={15}/> Export Excel</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> New Entry</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Entries', value:entries.length, color:'#3b82f6' },
          { label:'Posted',        value:entries.filter(e=>e.status==='posted').length, color:'#10b981' },
          { label:'Drafts',        value:entries.filter(e=>e.status==='draft').length,  color:'#f59e0b' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{'--card-accent':s.color}}>
            <div className="stat-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header"><span className="table-title">Journal Entries ({entries.length})</span></div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <table>
            <thead><tr><th>Entry #</th><th>Date</th><th>Description</th><th>Debit Account</th><th>Credit Account</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {entries.length===0
                ? <tr><td colSpan={7}><div className="empty-state"><p>No journal entries found</p></div></td></tr>
                : entries.map(e => (
                  <tr key={e.id}>
                    <td><span style={{color:'var(--accent-light)',fontWeight:600,fontFamily:'monospace'}}>{e.entry_number}</span></td>
                    <td>{e.date}</td>
                    <td style={{maxWidth:220}}><span style={{color:'var(--text-primary)',fontWeight:500}}>{e.description}</span></td>
                    <td><span style={{color:'#10b981'}}>{e.debit_account}</span></td>
                    <td><span style={{color:'#ef4444'}}>{e.credit_account}</span></td>
                    <td style={{fontWeight:700}}>{fmt(e.amount)}</td>
                    <td><span className={`badge ${e.status}`}>{e.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Journal Entry</span>
              <button className="modal-close" onClick={()=>setShowModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Date *</label><input className="form-input" type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Amount (₹) *</label><input className="form-input" type="number" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Debit Account *</label>
                  <select className="form-select" value={form.debit_account} onChange={e=>setForm({...form,debit_account:e.target.value})}>
                    {ACCOUNTS.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Credit Account *</label>
                  <select className="form-select" value={form.credit_account} onChange={e=>setForm({...form,credit_account:e.target.value})}>
                    {ACCOUNTS.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Description *</label><input className="form-input" required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Reference</label><input className="form-input" value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    <option value="draft">Draft</option><option value="posted">Posted</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
