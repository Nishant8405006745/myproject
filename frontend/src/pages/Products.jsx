import { useState } from 'react';
import { Lightbulb, Plus, Search, Edit3, Trash2, Star, Save, X, Zap, Package } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Stock Status Helpers ──────────────────────────────────────── */
const getStockStatus = (item) => {
  if (item.stock === 0)                         return { label:'Out of Stock', color:'#ef4444', bg:'rgba(239,68,68,0.12)',   emoji:'🔴' };
  if (item.stock <= item.minStock)              return { label:'Low Stock',    color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  emoji:'🟡' };
  if (item.stock >= item.maxStock * 0.9)        return { label:'Overstocked',  color:'#a855f7', bg:'rgba(168,85,247,0.12)', emoji:'🔵' };
  return                                               { label:'Good Stock',   color:'#10b981', bg:'rgba(16,185,129,0.12)', emoji:'🟢' };
};

const STOCK_FILTERS = ['All', '🟢 Good Stock', '🟡 Low Stock', '🔴 Out of Stock', '🔵 Overstocked'];

const filterMatch = (item, filter) => {
  const s = getStockStatus(item).label;
  if (filter === 'All')              return true;
  if (filter.includes('Good'))       return s === 'Good Stock';
  if (filter.includes('Low'))        return s === 'Low Stock';
  if (filter.includes('Out'))        return s === 'Out of Stock';
  if (filter.includes('Over'))       return s === 'Overstocked';
  return true;
};

/* ─── Card Gradients ────────────────────────────────────────────── */
const GRAD = [
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#6366f1,#a855f7)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f97316,#f59e0b)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#14b8a6,#10b981)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
];

/* ─── Product Images (per category) ────────────────────────────── */
const PROD_IMAGES = {
  'LED Bulb':         '/img_led_bulb.png',
  'Tube Light':       '/img_tube_light.png',
  'Panel Light':      '/img_panel_light.png',
  'Spotlight':        '/img_spotlight.png',
  'Street Light':     '/img_street_light.png',
  'Downlight':        '/img_spotlight.png',
  'Strip Light':      '/img_tube_light.png',
  'Flood Light':      '/img_street_light.png',
};

/* ─── Initial Products — all LED/Light types ────────────────────── */
const DEMO = [
  { id:1,  name:'HYGLOW A60 9W LED Bulb',        sku:'HG-BLB-001',  type:'LED Bulb',    price:85,    mrp:120,   stock:320, minStock:50,  maxStock:1000, watt:'9W',  base:'E27', lumens:850,  rating:4.8, desc:'Warm white 3000K, 15000hrs life', gi:0 },
  { id:2,  name:'HYGLOW B22 7W LED Bulb',         sku:'HG-BLB-002',  type:'LED Bulb',    price:75,    mrp:110,   stock:12,  minStock:50,  maxStock:800,  watt:'7W',  base:'B22', lumens:700,  rating:4.6, desc:'Cool white 6500K, bayonet base',  gi:0 },
  { id:3,  name:'HYGLOW T8 20W LED Tube 4ft',     sku:'HG-TUB-003',  type:'Tube Light',  price:280,   mrp:390,   stock:0,   minStock:20,  maxStock:500,  watt:'20W', base:'G13', lumens:2200, rating:4.5, desc:'Neutral white, direct replacement', gi:1 },
  { id:4,  name:'HYGLOW T5 14W LED Tube 3ft',     sku:'HG-TUB-004',  type:'Tube Light',  price:220,   mrp:310,   stock:180, minStock:30,  maxStock:400,  watt:'14W', base:'G5',  lumens:1400, rating:4.4, desc:'Energy saving, flicker-free',     gi:1 },
  { id:5,  name:'HYGLOW 12W LED Panel 6"',        sku:'HG-PNL-005',  type:'Panel Light', price:450,   mrp:620,   stock:950, minStock:20,  maxStock:200,  watt:'12W', base:'—',   lumens:1100, rating:4.7, desc:'Slim recessed square, cool white', gi:2 },
  { id:6,  name:'HYGLOW 18W LED Round Panel',     sku:'HG-PNL-006',  type:'Panel Light', price:680,   mrp:950,   stock:8,   minStock:15,  maxStock:300,  watt:'18W', base:'—',   lumens:1800, rating:4.9, desc:'Ultra-slim suspended panel light', gi:2 },
  { id:7,  name:'HYGLOW GU10 5W LED Spotlight',   sku:'HG-SPT-007',  type:'Spotlight',   price:130,   mrp:180,   stock:240, minStock:40,  maxStock:600,  watt:'5W',  base:'GU10',lumens:420,  rating:4.3, desc:'35° beam angle, dimmable',       gi:3 },
  { id:8,  name:'HYGLOW MR16 6W LED Spotlight',   sku:'HG-SPT-008',  type:'Spotlight',   price:115,   mrp:160,   stock:5,   minStock:40,  maxStock:500,  watt:'6W',  base:'MR16',lumens:500,  rating:4.5, desc:'12V, low voltage track lighting', gi:3 },
  { id:9,  name:'HYGLOW 50W LED Street Light',    sku:'HG-STL-009',  type:'Street Light',price:2800,  mrp:3800,  stock:60,  minStock:10,  maxStock:150,  watt:'50W', base:'—',   lumens:5500, rating:4.8, desc:'IP65 waterproof, 6000K daylight', gi:4 },
  { id:10, name:'HYGLOW 100W LED Flood Light',    sku:'HG-FLD-010',  type:'Flood Light', price:4200,  mrp:5600,  stock:0,   minStock:5,   maxStock:100,  watt:'100W',base:'—',   lumens:11000,rating:4.7, desc:'Outdoor security, motion sensor',  gi:4 },
  { id:11, name:'HYGLOW 10W COB Downlight',       sku:'HG-DWN-011',  type:'Downlight',   price:320,   mrp:450,   stock:415, minStock:30,  maxStock:400,  watt:'10W', base:'—',   lumens:950,  rating:4.6, desc:'Surface mount, warm white 3000K', gi:5 },
  { id:12, name:'HYGLOW RGB 5050 LED Strip 5m',   sku:'HG-STP-012',  type:'Strip Light',  price:599,  mrp:850,   stock:3,   minStock:20,  maxStock:300,  watt:'30W', base:'12V DC',lumens:1500,rating:4.4, desc:'Color changing, IR remote control',gi:6 },
];

const blank = { name:'', sku:'', type:'LED Bulb', price:'', mrp:'', stock:'', minStock:'', maxStock:'', watt:'', base:'', lumens:'', rating:'4.5', desc:'' };
const TYPES = ['LED Bulb','Tube Light','Panel Light','Spotlight','Street Light','Flood Light','Downlight','Strip Light'];
const fmt = v => '₹' + Number(v||0).toLocaleString('en-IN');

export default function Products() {
  const [products, setProducts] = useState(DEMO);
  const [stockFilter, setStockFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);

  const filtered = products.filter(p =>
    filterMatch(p, stockFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Counts for filter badges
  const counts = {
    'All': products.length,
    '🟢 Good Stock':    products.filter(p => getStockStatus(p).label === 'Good Stock').length,
    '🟡 Low Stock':     products.filter(p => getStockStatus(p).label === 'Low Stock').length,
    '🔴 Out of Stock':  products.filter(p => getStockStatus(p).label === 'Out of Stock').length,
    '🔵 Overstocked':   products.filter(p => getStockStatus(p).label === 'Overstocked').length,
  };

  const openAdd  = () => { setForm({...blank}); setModal('add'); };
  const openEdit = (p) => { setForm({ ...p, price:String(p.price), mrp:String(p.mrp), stock:String(p.stock), minStock:String(p.minStock), maxStock:String(p.maxStock), lumens:String(p.lumens), rating:String(p.rating) }); setModal('edit'); };

  const handleSave = () => {
    if (!form.name || !form.sku || !form.price) { toast.error('Name, SKU & Price required'); return; }
    const entry = { ...form, price:+form.price, mrp:+form.mrp, stock:+form.stock, minStock:+form.minStock, maxStock:+form.maxStock, lumens:+form.lumens, rating:+form.rating, gi: TYPES.indexOf(form.type) % GRAD.length };
    if (modal === 'add') {
      setProducts(p => [...p, { ...entry, id: Date.now() }]);
      toast.success('✅ Product added!');
    } else {
      setProducts(p => p.map(x => x.id === form.id ? entry : x));
      toast.success('✅ Product updated!');
    }
    setModal(null);
  };

  const handleDelete = (id) => { setProducts(p => p.filter(x => x.id !== id)); toast.success('Product deleted'); };
  const inp = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const totalValue = products.reduce((s,p) => s + p.price * p.stock, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💡 Products Catalogue</h1>
          <p className="page-subtitle">HYGLOW LED Lighting — Complete SKU Management</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/> Add SKU</button>
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom:22 }}>
        {[
          { label:'Total SKUs',     value: products.length, icon:'💡', color:'#6366f1' },
          { label:'Out of Stock',   value: counts['🔴 Out of Stock'],   icon:'🔴', color:'#ef4444' },
          { label:'Low Stock',      value: counts['🟡 Low Stock'],      icon:'⚠️', color:'#f59e0b' },
          { label:'Stock Value',    value: '₹'+totalValue.toLocaleString('en-IN'), icon:'💰', color:'#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-accent': s.color }}>
            <div className="stat-icon" style={{ background:s.color+'22', fontSize:'1.35rem' }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize:'1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stock Status Filters + Search */}
      <div className="card" style={{ padding:'14px 18px', marginBottom:22 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 200px' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input style={{ width:'100%', paddingLeft:32, background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 8px 8px 32px', color:'var(--text-primary)', fontSize:'0.85rem', outline:'none' }}
              placeholder="Search name or SKU…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {STOCK_FILTERS.map(f => {
              const active = stockFilter === f;
              return (
                <button key={f} onClick={() => setStockFilter(f)} style={{
                  padding:'6px 14px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontWeight:700, fontSize:'0.76rem', transition:'all 0.15s',
                  background: active ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                }}>
                  {f} {counts[f] !== undefined ? <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:10, padding:'0 5px', marginLeft:4, fontSize:'0.7rem' }}>{counts[f]}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px,1fr))', gap:20 }}>
        {filtered.map(p => {
          const ss = getStockStatus(p);
          const grad = GRAD[p.gi % GRAD.length];
          const img  = PROD_IMAGES[p.type] || '/img_led_bulb.png';
          const disc = Math.round((1 - p.price/p.mrp)*100);
          return (
            <div key={p.id} style={{ borderRadius:16, overflow:'hidden', background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', transition:'transform 0.18s,box-shadow 0.18s' }}
              onMouseOver={e=>{ e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.15)'; }}
              onMouseOut={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'; }}>

              {/* Image Section */}
              <div style={{ position:'relative', background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', padding:'18px', textAlign:'center', height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={img} alt={p.name} style={{ maxHeight:130, maxWidth:'100%', objectFit:'contain', filter:'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' }}
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
                <div style={{ display:'none', width:80, height:80, borderRadius:'50%', background:grad, alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>💡</div>
                {/* Status badge */}
                <div style={{ position:'absolute', top:10, left:10, background:ss.bg, color:ss.color, fontSize:'0.65rem', fontWeight:800, padding:'3px 9px', borderRadius:10, border:`1px solid ${ss.color}44`}}>
                  {ss.emoji} {ss.label}
                </div>
                {/* Discount badge */}
                {disc > 0 && <div style={{ position:'absolute', top:10, right:10, background:'#ef4444', color:'#fff', fontSize:'0.65rem', fontWeight:800, padding:'3px 8px', borderRadius:10 }}>{disc}% OFF</div>}
              </div>

              {/* Color accent bar */}
              <div style={{ height:3, background:grad }}/>

              {/* Content */}
              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)', lineHeight:1.3 }}>{p.name}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontFamily:'monospace', marginTop:2 }}>{p.sku}</div>
                  </div>
                  <span style={{ background:'var(--bg-secondary)', color:'var(--text-muted)', fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', borderRadius:8, whiteSpace:'nowrap', marginLeft:8 }}>{p.type}</span>
                </div>

                <p style={{ color:'var(--text-muted)', fontSize:'0.75rem', lineHeight:1.4, marginBottom:10 }}>{p.desc}</p>

                {/* Specs row */}
                <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                  {[`⚡ ${p.watt}`, `🔆 ${p.lumens}lm`, `🔌 ${p.base}`].map((tag,i) => (
                    <span key={i} style={{ background:'var(--bg-secondary)', color:'var(--text-muted)', fontSize:'0.65rem', fontWeight:600, padding:'2px 8px', borderRadius:8 }}>{tag}</span>
                  ))}
                </div>

                {/* Price */}
                <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
                  <span style={{ fontWeight:900, fontSize:'1.15rem', color:'var(--accent)' }}>{fmt(p.price)}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', textDecoration:'line-through' }}>MRP {fmt(p.mrp)}</span>
                </div>

                {/* Stock bar */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:'0.68rem', color:ss.color, fontWeight:700 }}>Stock: {p.stock.toLocaleString('en-IN')} units</span>
                    <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Min: {p.minStock}</span>
                  </div>
                  <div style={{ height:5, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${Math.min(100, (p.stock/p.maxStock)*100)}%`, height:'100%', background:ss.color, borderRadius:4, transition:'width 0.5s' }}/>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:3, color:'#f59e0b', fontSize:'0.72rem', fontWeight:700 }}>
                    <Star size={11} fill="#f59e0b"/> {p.rating}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(p)} style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'var(--accent)', fontSize:'0.72rem', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                      <Edit3 size={11}/> Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'#ef4444', fontSize:'0.72rem', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                      <Trash2 size={11}/> Del
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'var(--text-muted)' }}>
            <Lightbulb size={48} style={{ opacity:.3, marginBottom:12 }}/>
            <p style={{ fontWeight:600 }}>No products match this filter</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:28, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', backdropFilter:'blur(20px)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ color:'var(--text-primary)', fontWeight:800 }}>💡 {modal==='add'?'Add New SKU':'Edit SKU'}</h3>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e=>inp('name',e.target.value)} placeholder="e.g. HYGLOW A60 9W LED Bulb"/></div>
              <div className="form-group"><label className="form-label">SKU Code *</label><input className="form-input" value={form.sku} onChange={e=>inp('sku',e.target.value)} placeholder="e.g. HG-BLB-001"/></div>
              <div className="form-group"><label className="form-label">Product Type</label>
                <select className="form-input" value={form.type} onChange={e=>inp('type',e.target.value)}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Wattage</label><input className="form-input" value={form.watt} onChange={e=>inp('watt',e.target.value)} placeholder="e.g. 9W"/></div>
              <div className="form-group"><label className="form-label">Selling Price (₹) *</label><input className="form-input" type="number" value={form.price} onChange={e=>inp('price',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">MRP (₹)</label><input className="form-input" type="number" value={form.mrp} onChange={e=>inp('mrp',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Current Stock</label><input className="form-input" type="number" value={form.stock} onChange={e=>inp('stock',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Min Stock Alert</label><input className="form-input" type="number" value={form.minStock} onChange={e=>inp('minStock',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Max Stock</label><input className="form-input" type="number" value={form.maxStock} onChange={e=>inp('maxStock',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Lumens</label><input className="form-input" type="number" value={form.lumens} onChange={e=>inp('lumens',e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Base Type</label><input className="form-input" value={form.base} onChange={e=>inp('base',e.target.value)} placeholder="E27 / B22 / GU10…"/></div>
              <div className="form-group"><label className="form-label">Rating (0–5)</label><input className="form-input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e=>inp('rating',e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.desc} onChange={e=>inp('desc',e.target.value)}/></div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button className="btn btn-ghost" onClick={()=>setModal(null)}><X size={14}/> Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14}/> {modal==='add'?'Add SKU':'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
