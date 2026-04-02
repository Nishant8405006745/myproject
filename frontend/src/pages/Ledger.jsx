import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel } from '../utils/excel';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Ledger() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/api/accounting/ledger').then(r => setEntries(r.data)).finally(() => setLoading(false));
  }, []);

  const totalDebit  = entries.reduce((s,e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s,e) => s + e.credit, 0);
  const filtered    = entries.filter(e => e.account_name.toLowerCase().includes(search.toLowerCase()) || (e.account_type||'').includes(search.toLowerCase()));

  const handleExport = () => {
    const data = filtered.map(e => ({
      'Date':           e.date,
      'Account Name':   e.account_name,
      'Account Type':   e.account_type,
      'Debit (INR)':    e.debit,
      'Credit (INR)':   e.credit,
      'Balance (INR)':  e.balance,
      'Reference':      e.reference,
    }));
    exportToExcel(data, 'Ledger', 'HYGLOW_Ledger');
    toast.success('Ledger exported to Excel!');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">General Ledger</h1>
          <p className="page-subtitle">Complete record of all financial transactions</p>
        </div>
        <button className="btn btn-ghost" onClick={handleExport}>
          <Download size={15}/> Export Excel
        </button>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Entries', value:entries.length, color:'#3b82f6' },
          { label:'Total Debit',   value:fmt(totalDebit),  color:'#10b981' },
          { label:'Total Credit',  value:fmt(totalCredit), color:'#ef4444' },
          { label:'Net Balance',   value:fmt(totalDebit - totalCredit), color:'#f59e0b' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{'--card-accent':s.color}}>
            <div className="stat-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Ledger Entries ({filtered.length})</span>
          <div className="search-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="search-input" placeholder="Search accounts..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <table>
            <thead><tr><th>Date</th><th>Account Name</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Reference</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td style={{fontWeight:500, color:'var(--text-primary)'}}>{e.account_name}</td>
                  <td>
                    <span className="badge" style={{
                      background: e.account_type==='asset'?'rgba(16,185,129,0.1)':e.account_type==='income'?'rgba(59,130,246,0.1)':'rgba(239,68,68,0.1)',
                      color: e.account_type==='asset'?'#10b981':e.account_type==='income'?'#60a5fa':'#f87171',
                      border:'none'
                    }}>{e.account_type}</span>
                  </td>
                  <td style={{color:'#10b981', fontWeight:600}}>{e.debit > 0 ? fmt(e.debit) : '-'}</td>
                  <td style={{color:'#ef4444', fontWeight:600}}>{e.credit > 0 ? fmt(e.credit) : '-'}</td>
                  <td style={{fontWeight:700}}>{fmt(e.balance)}</td>
                  <td style={{fontFamily:'monospace', fontSize:'0.8rem', color:'var(--text-muted)'}}>{e.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
