import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Plus, Search, X, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, importFromExcel } from '../utils/excel';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ client_name:'', client_email:'', amount:'', tax:'18', status:'pending', due_date:'', issue_date:'', description:'' });
  const importRef = useRef();

  const load = () => {
    api.get('/api/accounting/invoices' + (filter ? `?status=${filter}` : ''))
      .then(r => setInvoices(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/accounting/invoices', { ...form, amount: +form.amount, tax: +form.tax });
      toast.success('Invoice created!');
      setShowModal(false);
      setForm({ client_name:'', client_email:'', amount:'', tax:'18', status:'pending', due_date:'', issue_date:'', description:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create invoice'); }
  };

  const handleExport = () => {
    const data = filtered.map(inv => ({
      'Invoice #':    inv.invoice_number,
      'Client Name':  inv.client_name,
      'Client Email': inv.client_email,
      'Amount (INR)': inv.amount,
      'Tax (%)':      inv.tax,
      'Total (INR)':  inv.total,
      'Status':       inv.status,
      'Issue Date':   inv.issue_date,
      'Due Date':     inv.due_date,
      'Description':  inv.description,
    }));
    exportToExcel(data, 'Invoices', 'HYGLOW_Invoices');
    toast.success('Invoices exported to Excel!');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importFromExcel(
      file,
      async (rows) => {
        let created = 0;
        for (const row of rows) {
          try {
            await api.post('/api/accounting/invoices', {
              client_name:  row['Client Name'] || '',
              client_email: row['Client Email'] || '',
              amount:       +row['Amount (INR)'] || 0,
              tax:          +row['Tax (%)'] || 0,
              status:       row['Status'] || 'pending',
              issue_date:   row['Issue Date'] || '',
              due_date:     row['Due Date'] || '',
              description:  row['Description'] || '',
            });
            created++;
          } catch (_) {}
        }
        toast.success(`Imported ${created} invoices!`);
        load();
        e.target.value = '';
      },
      (err) => toast.error(err)
    );
  };

  const filtered = invoices.filter(i =>
    i.client_name.toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s,i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s,i) => s + i.total, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage and track all client invoices</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button className="btn btn-ghost" onClick={handleExport}>
            <Download size={15}/> Export Excel
          </button>
          <button className="btn btn-ghost" onClick={() => importRef.current?.click()}>
            <Upload size={15}/> Import Excel
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={handleImport}/>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16}/> New Invoice
          </button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Invoices', value: invoices.length,  color: '#3b82f6' },
          { label: 'Total Paid',     value: fmt(totalPaid),   color: '#10b981' },
          { label: 'Total Pending',  value: fmt(totalPending), color: '#f59e0b' },
          { label: 'Overdue',        value: invoices.filter(i=>i.status==='overdue').length, color: '#ef4444' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{ '--card-accent': s.color }}>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">All Invoices ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-wrapper">
              <Search/>
              <input className="search-input" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 140 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div> : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th><th>Client</th><th>Amount</th><th>Tax</th>
                <th>Total</th><th>Status</th><th>Due Date</th><th>Issue Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>No invoices found</p></div></td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id}>
                  <td><span style={{ color: 'var(--accent-light)', fontWeight: 600, fontFamily: 'monospace' }}>{inv.invoice_number}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inv.client_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.client_email}</div>
                  </td>
                  <td>{fmt(inv.amount)}</td>
                  <td>{inv.tax}%</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(inv.total)}</td>
                  <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                  <td>{inv.due_date}</td>
                  <td>{inv.issue_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Invoice</span>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Client Name *</label><input className="form-input" required value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Client Email</label><input className="form-input" type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Amount (₹) *</label><input className="form-input" type="number" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Tax (%)</label><input className="form-input" type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Issue Date</label><input className="form-input" type="date" value={form.issue_date} onChange={e => setForm({...form, issue_date: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
