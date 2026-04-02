import { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, RefreshCcw, Plus, ArrowUpDown, BarChart3, Truck } from 'lucide-react';

const CATEGORIES = ['All','Electronics','Clothing','Food & Grocery','Furniture','Raw Material','Stationery'];
const LOCS = ['Warehouse A','Warehouse B','Store Front','Cold Storage'];

const INIT_ITEMS = [
  { id:1, name:'MacBook Pro 16"', sku:'MBP-001', category:'Electronics', stock:12, minStock:5, maxStock:50, unit:'pcs', location:'Warehouse A', lastUpdated:new Date().toISOString(), trend:'stable' },
  { id:2, name:'Office Chair Ergo', sku:'FUR-002', category:'Furniture', stock:34, minStock:10, maxStock:100, unit:'pcs', location:'Warehouse B', lastUpdated:new Date().toISOString(), trend:'up' },
  { id:3, name:'A4 Paper Ream', sku:'STN-003', category:'Stationery', stock:4, minStock:50, maxStock:500, unit:'ream', location:'Store Front', lastUpdated:new Date().toISOString(), trend:'down' },
  { id:4, name:'Casual T-Shirt(M)', sku:'CLO-004', category:'Clothing', stock:3, minStock:15, maxStock:200, unit:'pcs', location:'Warehouse A', lastUpdated:new Date().toISOString(), trend:'down' },
  { id:5, name:'Basmati Rice 25kg', sku:'FOD-005', category:'Food & Grocery', stock:80, minStock:20, maxStock:300, unit:'bag', location:'Cold Storage', lastUpdated:new Date().toISOString(), trend:'stable' },
  { id:6, name:'Steel Rod 10mm', sku:'RAW-006', category:'Raw Material', stock:4800, minStock:500, maxStock:10000, unit:'kg', location:'Warehouse B', lastUpdated:new Date().toISOString(), trend:'up' },
  { id:7, name:'Monitor 27" 4K', sku:'ELC-007', category:'Electronics', stock:8, minStock:3, maxStock:30, unit:'pcs', location:'Warehouse A', lastUpdated:new Date().toISOString(), trend:'stable' },
  { id:8, name:'Wireless Keyboard', sku:'ELC-008', category:'Electronics', stock:25, minStock:8, maxStock:60, unit:'pcs', location:'Store Front', lastUpdated:new Date().toISOString(), trend:'up' },
];

const LIVE_PO = [
  { id:'PO-ABC123', item:'MacBook Pro 16"', qty:10, supplier:'TechWorld', status:'In Transit', ordered:'2026-03-28', eta:'2026-04-05', stages:['Order Placed','Confirmed','Packed','In Transit','Arrived','Received'], current:3 },
  { id:'PO-DEF456', item:'Steel Rod 10mm', qty:2000, supplier:'Steel Corp', status:'Packed', ordered:'2026-04-01', eta:'2026-04-10', stages:['Order Placed','Confirmed','Packed','In Transit','Arrived','Received'], current:2 },
  { id:'PO-GHI789', item:'A4 Paper Ream x100', qty:100, supplier:'Office Essentials', status:'Confirmed', ordered:'2026-04-02', eta:'2026-04-12', stages:['Order Placed','Confirmed','Packed','In Transit','Arrived','Received'], current:1 },
];

const STOCK_COLOR = (item) => {
  const pct = item.stock / item.minStock;
  if (pct <= 1) return { bar:'#ef4444', text:'#ef4444', label:'Critical', bg:'rgba(244,63,94,0.12)' };
  if (pct <= 1.5) return { bar:'#f59e0b', text:'#f59e0b', label:'Low', bg:'rgba(245,158,11,0.12)' };
  return { bar:'#10b981', text:'#10b981', label:'OK', bg:'rgba(16,185,129,0.12)' };
};

function StockBar({ item }) {
  const c = STOCK_COLOR(item);
  const pct = Math.min(100, (item.stock / item.maxStock) * 100);
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:c.bar, borderRadius:4, transition:'width 0.6s ease' }}/>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [items, setItems] = useState(INIT_ITEMS);
  const [cat, setCat] = useState('All');
  const [livePos, setLivePos] = useState(LIVE_PO);
  const [tick, setTick] = useState(0);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('add');

  // Simulate real-time stock fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t+1);
      setItems(prev => prev.map(item => {
        // Small random change occasionally (20% chance)
        if (Math.random() > 0.8) {
          const delta = Math.floor(Math.random() * 3) - 1;  // -1, 0 or +1
          return { ...item, stock: Math.max(0, item.stock + delta), lastUpdated: new Date().toISOString(), trend: delta>0 ? 'up' : delta<0 ? 'down' : 'stable' };
        }
        return item;
      }));
    }, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const filtered = items.filter(i => cat==='All' || i.category===cat);
  const critical = items.filter(i => i.stock <= i.minStock);
  const totalValue = items.length;

  const handleAdjust = () => {
    if (!adjQty || isNaN(+adjQty)) return;
    setItems(prev => prev.map(i => {
      if (i.id !== adjustModal.id) return i;
      const change = adjType==='add' ? +adjQty : -adjQty;
      return { ...i, stock: Math.max(0, i.stock + change), lastUpdated: new Date().toISOString(), trend: change>0?'up':change<0?'down':'stable' };
    }));
    setAdjustModal(null);
    setAdjQty('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Inventory</h1>
          <p className="page-subtitle">
            Real-time stock levels — auto-refreshing every 5s &nbsp;
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'1px 8px', borderRadius:10, fontSize:'0.7rem', fontWeight:700 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', animation:'pulse 2s infinite', display:'inline-block' }}/>LIVE
            </span>
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Total SKUs', value:items.length, icon:'📦', color:'#6366f1' },
          { label:'Critical Stock', value:critical.length, icon:'🚨', color:'#ef4444' },
          { label:'Warehouses', value:4, icon:'🏭', color:'#0ea5e9' },
          { label:'Live PO Tracking', value:livePos.length, icon:'🚚', color:'#10b981' },
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{ '--card-accent':s.color }}>
            <div className="stat-icon" style={{ background:s.color+'22', fontSize:'1.3rem' }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize:'1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {critical.length > 0 && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <AlertTriangle size={18} color="#ef4444"/>
          <span style={{ color:'#ef4444', fontWeight:700, fontSize:'0.85rem' }}>
            {critical.length} item(s) below minimum stock: {critical.map(i=>i.name).join(', ')}
          </span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
        {/* Main inventory table */}
        <div>
          {/* Category filter */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{ padding:'5px 14px', borderRadius:20, border:'1px solid var(--border)', background:cat===c?'var(--accent)':'var(--bg-secondary)', color:cat===c?'#fff':'var(--text-muted)', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}>{c}</button>
            ))}
          </div>

          <div className="table-container">
            <div className="table-header">
              <span className="table-title">Stock Levels — Live ({filtered.length} items)</span>
              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Last tick: {new Date().toLocaleTimeString()}</span>
            </div>
            <table>
              <thead><tr>
                <th>Product</th><th>SKU</th><th>Location</th>
                <th>Stock</th><th>Level</th><th>Status</th><th>Trend</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(item => {
                  const c = STOCK_COLOR(item);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{item.name}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--text-muted)' }}>{item.sku}</td>
                      <td style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{item.location}</td>
                      <td>
                        <div style={{ fontWeight:700, color:c.text, fontSize:'0.95rem' }}>{item.stock.toLocaleString()}</div>
                        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Min: {item.minStock} {item.unit}</div>
                        <StockBar item={item}/>
                      </td>
                      <td><span style={{ background:c.bg, color:c.text, padding:'3px 10px', borderRadius:10, fontSize:'0.7rem', fontWeight:700 }}>{c.label}</span></td>
                      <td>
                        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Updated {new Date(item.lastUpdated).toLocaleTimeString()}</div>
                      </td>
                      <td>
                        {item.trend==='up' && <TrendingUp size={14} color="#10b981"/>}
                        {item.trend==='down' && <TrendingDown size={14} color="#ef4444"/>}
                        {item.trend==='stable' && <ArrowUpDown size={14} color="#64748b"/>}
                      </td>
                      <td>
                        <button onClick={()=>{ setAdjustModal(item); setAdjQty(''); setAdjType('add'); }}
                          style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:7, padding:'4px 10px', cursor:'pointer', color:'var(--accent)', fontSize:'0.72rem', fontWeight:600 }}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live PO Tracking */}
        <div>
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Truck size={16} color="var(--accent)"/>
              <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.92rem' }}>Live PO Tracking</span>
              <span style={{ marginLeft:'auto', background:'rgba(16,185,129,0.12)', color:'#10b981', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:8 }}>LIVE</span>
            </div>
            {livePos.map(po => (
              <div key={po.id} style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'14px 14px', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--accent)', fontSize:'0.75rem' }}>{po.id}</span>
                  <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>ETA: {po.eta}</span>
                </div>
                <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.82rem', marginBottom:2 }}>{po.item}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:10 }}>From: {po.supplier} · Qty: {po.qty.toLocaleString()}</div>
                {/* Progress steps */}
                <div style={{ display:'flex', gap:0 }}>
                  {po.stages.map((s, i) => {
                    const done = i <= po.current;
                    const active = i === po.current;
                    return (
                      <div key={s} style={{ display:'flex', alignItems:'center', flex: i < po.stages.length-1 ? 1 : 'none' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ width:18, height:18, borderRadius:'50%', background: done ? (active ? 'var(--accent)' : '#10b981') : 'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', color:'#fff', fontWeight:700, border:`2px solid ${done ? (active ? 'var(--accent)' : '#10b981') : 'var(--border)'}` }}>
                            {done && !active ? '✓' : i+1}
                          </div>
                          <div style={{ fontSize:'0.5rem', color: active ? 'var(--accent)' : (done ? '#10b981' : 'var(--text-muted)'), marginTop:3, textAlign:'center', maxWidth:36, lineHeight:1.1, fontWeight: active ? 700 : 400 }}>{s}</div>
                        </div>
                        {i < po.stages.length-1 && (
                          <div style={{ flex:1, height:2, background: i < po.current ? '#10b981' : 'var(--border)', margin:'0 1px', marginBottom:14 }}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:'100%', maxWidth:380, backdropFilter:'blur(20px)' }}>
            <h3 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:4 }}>Adjust Stock</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginBottom:16 }}>{adjustModal.name} — Current: {adjustModal.stock} {adjustModal.unit}</p>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {['add','remove'].map(t=>(
                <button key={t} onClick={()=>setAdjType(t)} style={{ flex:1, padding:'8px', borderRadius:10, border:'2px solid', cursor:'pointer', fontWeight:700, fontSize:'0.85rem',
                  background: adjType===t ? (t==='add'?'#10b981':'#ef4444') : 'var(--bg-secondary)',
                  color: adjType===t ? '#fff' : 'var(--text-muted)',
                  borderColor: adjType===t ? (t==='add'?'#10b981':'#ef4444') : 'var(--border)' }}>
                  {t==='add' ? '+ Add Stock' : '– Remove Stock'}
                </button>
              ))}
            </div>
            <input className="form-input" type="number" min="1" placeholder="Quantity" value={adjQty} onChange={e=>setAdjQty(e.target.value)} style={{ marginBottom:14 }}/>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={()=>setAdjustModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdjust}>Apply</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.online-dot-pulse { animation: pulse 2s infinite; } @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}
