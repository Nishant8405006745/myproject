import { useState, useRef } from 'react';
import { ShoppingCart, TrendingUp, Plus, Upload, FileText, X, Save, Eye, Printer, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── helpers ── */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtMoney = v => '₹' + Number(v||0).toLocaleString('en-IN');
const uid = () => Math.random().toString(36).slice(2,8).toUpperCase();

const PO_STATUSES = ['Draft','Sent','Confirmed','In Transit','Delivered','Cancelled'];
const SO_STATUSES = ['Draft','Confirmed','Processing','Shipped','Delivered','Cancelled'];

const STATUS_STYLE = {
  Draft:      { bg:'rgba(100,116,139,0.15)', color:'#94a3b8' },
  Sent:       { bg:'rgba(245,158,11,0.15)',  color:'#fbbf24' },
  Confirmed:  { bg:'rgba(99,102,241,0.15)',  color:'#a78bfa' },
  Processing: { bg:'rgba(14,165,233,0.15)',  color:'#38bdf8' },
  'In Transit':{ bg:'rgba(249,115,22,0.15)', color:'#fb923c' },
  Shipped:    { bg:'rgba(249,115,22,0.15)',  color:'#fb923c' },
  Delivered:  { bg:'rgba(16,185,129,0.15)',  color:'#34d399' },
  Cancelled:  { bg:'rgba(244,63,94,0.15)',   color:'#fb7185' },
};

const DEMO_PO = [
  { id:'PO-'+uid(), type:'PO', supplier:'TechWorld Pvt Ltd', items:'MacBook Pro x2, Monitor x3', amount:460000, status:'Delivered', date:'2026-03-15', delivery:'2026-03-28', notes:'Urgent order' },
  { id:'PO-'+uid(), type:'PO', supplier:'Steel Corp India', items:'Steel Rods 500kg', amount:27500, status:'In Transit', date:'2026-03-28', delivery:'2026-04-05', notes:'' },
  { id:'PO-'+uid(), type:'PO', supplier:'Office Essentials', items:'A4 Paper x50 ream, Pens x200', amount:32000, status:'Confirmed', date:'2026-04-01', delivery:'2026-04-10', notes:'' },
];
const DEMO_SO = [
  { id:'SO-'+uid(), type:'SO', customer:'Ravi Enterprises', items:'Monitor x5, Keyboard x10', amount:185000, status:'Shipped', date:'2026-03-20', delivery:'2026-03-30', notes:'Priority client' },
  { id:'SO-'+uid(), type:'SO', customer:'ABC Traders', items:'Office Chair x8', amount:148000, status:'Processing', date:'2026-03-29', delivery:'2026-04-08', notes:'' },
  { id:'SO-'+uid(), type:'SO', customer:'Global Imports', items:'Basmati Rice 200kg', amount:14400, status:'Confirmed', date:'2026-04-02', delivery:'2026-04-12', notes:'COD' },
];

const blank = { type:'PO', supplier:'', customer:'', items:'', amount:'', date: new Date().toISOString().slice(0,10), delivery:'', notes:'', status:'Draft' };

/* ── Progress Tracker ── */
function StatusTracker({ order }) {
  const steps = order.type === 'PO' ? PO_STATUSES : SO_STATUSES;
  const current = steps.indexOf(order.status);
  return (
    <div style={{ padding:'16px 0 8px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        {steps.map((s, i) => {
          const done = i <= current;
          const active = i === current;
          return (
            <div key={s} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: done ? (active ? 'var(--accent)' : '#10b981') : 'var(--bg-secondary)',
                  border: `2px solid ${done ? (active ? 'var(--accent)' : '#10b981') : 'var(--border)'}`,
                  fontSize:'0.7rem', fontWeight:700, color: done ? '#fff' : 'var(--text-muted)',
                  transition:'all 0.3s',
                }}>
                  {done && !active ? <CheckCircle size={14}/> : i+1}
                </div>
                <div style={{ fontSize:'0.6rem', color: done ? 'var(--text-primary)' : 'var(--text-muted)', marginTop:4, textAlign:'center', maxWidth:52, lineHeight:1.2, fontWeight: active ? 700 : 400 }}>{s}</div>
              </div>
              {i < steps.length-1 && (
                <div style={{ flex:1, height:2, background: i < current ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'var(--border)', margin:'0 2px', marginBottom:18, transition:'background 0.3s' }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PurchaseOrders() {
  const [tab, setTab] = useState('PO');
  const [orders, setOrders] = useState([...DEMO_PO, ...DEMO_SO]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [detail, setDetail] = useState(null);
  const fileRef = useRef();

  const list = orders.filter(o => o.type === tab);
  const inp = (k,v) => setForm(f=>({...f,[k]:v}));

  const openAdd = (type) => { setForm({...blank, type, id: (type==='PO'?'PO-':'SO-')+uid()}); setModal('form'); };

  const handleSave = () => {
    if (!(form.type==='PO' ? form.supplier : form.customer) || !form.items || !form.amount) {
      toast.error('Please fill all required fields'); return;
    }
    setOrders(prev => {
      const exists = prev.find(o=>o.id===form.id);
      return exists ? prev.map(o=>o.id===form.id?{...form,amount:+form.amount}:o) : [...prev, {...form, amount:+form.amount}];
    });
    toast.success('✅ Order saved!');
    setModal(null);
  };

  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id===id ? {...o, status} : o));
    if (detail?.id===id) setDetail(d=>({...d, status}));
    toast.success(`Status updated to "${status}"`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv','xlsx','xls','pdf'].includes(ext)) { toast.error('Upload CSV, Excel or PDF'); return; }
    toast.loading('Parsing file…', { id:'upload' });
    setTimeout(() => {
      toast.dismiss('upload');
      const type = tab;
      const newOrder = {
        id:(type==='PO'?'PO-':'SO-')+uid(), type,
        supplier: type==='PO' ? 'Imported Supplier Co.' : '',
        customer: type==='SO' ? 'Imported Customer Ltd' : '',
        items:'Imported items from '+file.name,
        amount:Math.floor(Math.random()*500000+10000),
        status:'Draft', date:new Date().toISOString().slice(0,10),
        delivery:'', notes:`Imported from ${file.name}`,
      };
      setOrders(prev=>[...prev, newOrder]);
      toast.success(`✅ Order imported from ${file.name}`);
    }, 1200);
    e.target.value='';
  };

  const totals = {
    count: list.length,
    value: list.reduce((s,o)=>s+(+o.amount),0),
    delivered: list.filter(o=>o.status==='Delivered').length,
    pending: list.filter(o=>!['Delivered','Cancelled'].includes(o.status)).length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tab==='PO'?'Purchase Orders':'Sales Orders'}</h1>
          <p className="page-subtitle">Generate, track and manage all {tab==='PO'?'purchases':'sales'}</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf" style={{ display:'none' }} onChange={handleFileUpload}/>
          <button className="btn btn-ghost" onClick={()=>fileRef.current?.click()}><Upload size={14}/> Import File</button>
          <button className="btn btn-primary" onClick={()=>openAdd(tab)}><Plus size={14}/> New {tab}</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {['PO','SO'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 28px', borderRadius:12, border:'2px solid', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', transition:'all 0.15s',
            borderColor: tab===t ? 'var(--accent)' : 'var(--border)',
            background: tab===t ? 'var(--accent)' : 'var(--bg-card)',
            color: tab===t ? '#fff' : 'var(--text-muted)',
          }}>
            {t==='PO' ? '🛒 Purchase Orders' : '📤 Sales Orders'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom:24 }}>
        {[
          { label:`Total ${tab}s`, value:totals.count, icon:'📋', color:'#6366f1' },
          { label:'Total Value', value:fmtMoney(totals.value), icon:'💰', color:'#10b981' },
          { label:'Delivered', value:totals.delivered, icon:'✅', color:'#14b8a6' },
          { label:'In Progress', value:totals.pending, icon:'⏳', color:'#f59e0b' },
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{ '--card-accent':s.color }}>
            <div className="stat-icon" style={{ background:s.color+'22', fontSize:'1.3rem' }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize:'1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <div className="table-header">
          <span className="table-title">{tab} List ({list.length})</span>
        </div>
        {list.length === 0 ? (
          <div className="empty-state"><FileText size={36}/><p>No {tab}s yet. Create one above.</p></div>
        ) : (
          <table>
            <thead><tr>
              <th>{tab} ID</th>
              <th>{tab==='PO'?'Supplier':'Customer'}</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {list.map(o=>{
                const ss = STATUS_STYLE[o.status]||STATUS_STYLE.Draft;
                return (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--accent)', fontSize:'0.8rem' }}>{o.id}</span></td>
                    <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{o.type==='PO'?o.supplier:o.customer}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.8rem', maxWidth:180 }}>{o.items}</td>
                    <td style={{ fontWeight:700, color:'var(--accent)' }}>{fmtMoney(o.amount)}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{fmtDate(o.date)}</td>
                    <td><span style={{ background:ss.bg, color:ss.color, padding:'3px 10px', borderRadius:10, fontSize:'0.72rem', fontWeight:700 }}>{o.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>setDetail(o)} style={{ background:'var(--bg-secondary)', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'var(--accent)', fontSize:'0.75rem', fontWeight:600 }}>
                          <Eye size={12}/> Track
                        </button>
                        <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}
                          style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text-muted)', fontSize:'0.72rem', padding:'4px 6px', cursor:'pointer' }}>
                          {(o.type==='PO'?PO_STATUSES:SO_STATUSES).map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail / Tracking Modal */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:28, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', backdropFilter:'blur(20px)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{detail.type}</div>
                <h2 style={{ color:'var(--text-primary)', fontWeight:800, fontSize:'1.1rem' }}>{detail.id}</h2>
              </div>
              <button onClick={()=>setDetail(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
            </div>

            {/* Live Tracking */}
            <div className="card" style={{ marginBottom:20, padding:'16px 18px' }}>
              <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:4, fontSize:'0.85rem' }}>📦 Live Order Tracking</div>
              <StatusTracker order={detail}/>
            </div>

            {/* Details */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { label: detail.type==='PO' ? 'Supplier' : 'Customer', value: detail.type==='PO' ? detail.supplier : detail.customer },
                { label:'Amount', value: fmtMoney(detail.amount) },
                { label:'Order Date', value: fmtDate(detail.date) },
                { label:'Expected Delivery', value: fmtDate(detail.delivery)||'TBD' },
              ].map(({label,value})=>(
                <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                  <div style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'0.88rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Items</div>
              <div style={{ color:'var(--text-primary)', fontSize:'0.85rem' }}>{detail.items}</div>
            </div>
            {detail.notes && <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <div style={{ fontSize:'0.75rem', color:'#f59e0b', fontWeight:600 }}>📝 {detail.notes}</div>
            </div>}

            {/* Update Status */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {(detail.type==='PO'?PO_STATUSES:SO_STATUSES).map(s=>(
                <button key={s} onClick={()=>updateStatus(detail.id,s)}
                  style={{ padding:'7px 16px', borderRadius:10, border:'1px solid', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, transition:'all 0.15s',
                    background: detail.status===s ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: detail.status===s ? '#fff' : 'var(--text-muted)',
                    borderColor: detail.status===s ? 'var(--accent)' : 'var(--border)',
                  }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {modal==='form' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', backdropFilter:'blur(20px)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:'var(--text-primary)', fontWeight:700 }}>New {form.type} — {form.id}</h3>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <div className="form-grid">
              {form.type==='PO'
                ? <div className="form-group"><label className="form-label">Supplier *</label><input className="form-input" value={form.supplier} onChange={e=>inp('supplier',e.target.value)} placeholder="Supplier name"/></div>
                : <div className="form-group"><label className="form-label">Customer *</label><input className="form-input" value={form.customer} onChange={e=>inp('customer',e.target.value)} placeholder="Customer name"/></div>}
              <div className="form-group"><label className="form-label">Amount (₹) *</label><input className="form-input" type="number" value={form.amount} onChange={e=>inp('amount',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Order Date</label><input className="form-input" type="date" value={form.date} onChange={e=>inp('date',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Expected Delivery</label><input className="form-input" type="date" value={form.delivery} onChange={e=>inp('delivery',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Items / Description *</label><textarea className="form-input" rows={3} value={form.items} onChange={e=>inp('items',e.target.value)} placeholder="List items ordered…"/></div>
            <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e=>inp('notes',e.target.value)} placeholder="Any special instructions…"/></div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button className="btn btn-ghost" onClick={()=>setModal(null)}><X size={14}/> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14}/> Create {form.type}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
