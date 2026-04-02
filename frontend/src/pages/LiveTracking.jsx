import { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle, Clock, MapPin, AlertCircle, RefreshCcw, Zap } from 'lucide-react';

/* ─── Stage definitions ─────────────────────────────────────────── */
const PO_STAGES = [
  { key:'placed',     label:'Order Placed',   icon:'📋', color:'#6366f1' },
  { key:'confirmed',  label:'Confirmed',      icon:'✅', color:'#0ea5e9' },
  { key:'packed',     label:'Packed',         icon:'📦', color:'#f59e0b' },
  { key:'dispatched', label:'Dispatched',     icon:'🚛', color:'#f97316' },
  { key:'in_transit', label:'In Transit',     icon:'🛣️', color:'#a855f7' },
  { key:'arrived',    label:'Arrived Hub',    icon:'🏭', color:'#14b8a6' },
  { key:'delivered',  label:'Delivered',      icon:'🎉', color:'#10b981' },
];

const SO_STAGES = [
  { key:'confirmed',  label:'Order Confirmed', icon:'✅', color:'#6366f1' },
  { key:'processing', label:'Processing',      icon:'⚙️', color:'#0ea5e9' },
  { key:'packed',     label:'Packed',          icon:'📦', color:'#f59e0b' },
  { key:'shipped',    label:'Shipped',         icon:'🚚', color:'#f97316' },
  { key:'in_transit', label:'In Transit',      icon:'🛣️', color:'#a855f7' },
  { key:'out_delivery',label:'Out for Delivery',icon:'🛵', color:'#14b8a6' },
  { key:'delivered',  label:'Delivered',       icon:'🎉', color:'#10b981' },
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'TBD';
const fmt = v => '₹' + Number(v||0).toLocaleString('en-IN');

/* ─── Demo shipments ────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2,8).toUpperCase();
const DEMO_SHIPMENTS = [
  {
    id:'PO-'+uid(), type:'PO', party:'TechWorld Pvt Ltd', item:'HYGLOW A60 9W LED Bulb × 500 units',
    amount:42500, ordered:'2026-03-25', eta:'2026-04-06', stage:4,
    awb:'IND'+uid(), carrier:'BlueDart',
    updates:[
      { time:'2026-03-25 10:30', msg:'Order placed with TechWorld Pvt Ltd', stage:0 },
      { time:'2026-03-25 14:00', msg:'Supplier confirmed the order', stage:1 },
      { time:'2026-03-27 09:15', msg:'Items packed at supplier warehouse', stage:2 },
      { time:'2026-03-28 07:00', msg:'Shipment dispatched from Mumbai', stage:3 },
      { time:'2026-03-30 18:45', msg:'In transit — reached Pune hub', stage:4 },
    ],
    location:'Pune Transit Hub',
  },
  {
    id:'SO-'+uid(), type:'SO', party:'Ravi Enterprises, Delhi', item:'HYGLOW GU10 Spotlight × 200 + Panel 18W × 50',
    amount:61000, ordered:'2026-03-28', eta:'2026-04-04', stage:5,
    awb:'OUT'+uid(), carrier:'Delhivery',
    updates:[
      { time:'2026-03-28 11:00', msg:'Sales order confirmed', stage:0 },
      { time:'2026-03-29 08:30', msg:'Order processing started', stage:1 },
      { time:'2026-03-30 16:00', msg:'Packed and ready for pickup', stage:2 },
      { time:'2026-03-31 09:00', msg:'Handed to Delhivery courier', stage:3 },
      { time:'2026-04-01 14:30', msg:'In transit — Jaipur sorting centre', stage:4 },
      { time:'2026-04-03 08:00', msg:'Out for delivery in Delhi', stage:5 },
    ],
    location:'Delhi — Out for Delivery',
  },
  {
    id:'PO-'+uid(), type:'PO', party:'Voltage Components', item:'HYGLOW T8 Tube 4ft × 300 units',
    amount:84000, ordered:'2026-04-01', eta:'2026-04-12', stage:2,
    awb:'IND'+uid(), carrier:'Ekart',
    updates:[
      { time:'2026-04-01 09:00', msg:'Purchase order created', stage:0 },
      { time:'2026-04-01 17:00', msg:'Supplier confirmed and acknowledged', stage:1 },
      { time:'2026-04-03 10:00', msg:'Items being packed at warehouse', stage:2 },
    ],
    location:'Supplier Warehouse — Bengaluru',
  },
  {
    id:'SO-'+uid(), type:'SO', party:'Global Lighting Co.', item:'HYGLOW 50W Street Light × 20 units',
    amount:56000, ordered:'2026-03-30', eta:'2026-04-07', stage:6,
    awb:'OUT'+uid(), carrier:'SuperShuttle',
    updates:[
      { time:'2026-03-30 11:00', msg:'Order confirmed', stage:0 },
      { time:'2026-03-31 08:00', msg:'Processing started', stage:1 },
      { time:'2026-04-01 15:00', msg:'Packed', stage:2 },
      { time:'2026-04-02 07:00', msg:'Shipped via SuperShuttle', stage:3 },
      { time:'2026-04-03 09:00', msg:'In transit', stage:4 },
      { time:'2026-04-05 08:30', msg:'Out for delivery', stage:5 },
      { time:'2026-04-05 16:00', msg:'Delivered successfully ✅', stage:6 },
    ],
    location:'Delivered',
  },
];

/* ─── Stage Progress Bar ────────────────────────────────────────── */
function StageBar({ stages, current }) {
  return (
    <div style={{ overflowX:'auto', paddingBottom:8 }}>
      <div style={{ display:'flex', alignItems:'flex-start', minWidth: stages.length * 90 }}>
        {stages.map((s, i) => {
          const done   = i < current;
          const active = i === current;
          const future = i > current;
          return (
            <div key={s.key} style={{ display:'flex', alignItems:'center', flex: i < stages.length-1 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:68 }}>
                {/* Circle */}
                <div style={{
                  width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.05rem',
                  background: done ? `${s.color}22` : active ? s.color : 'var(--bg-secondary)',
                  border:`3px solid ${done ? s.color : active ? s.color : 'var(--border)'}`,
                  boxShadow: active ? `0 0 16px ${s.color}66` : 'none',
                  transition:'all 0.4s',
                  position:'relative',
                }}>
                  {done ? <CheckCircle size={18} color={s.color}/> : s.icon}
                  {active && <span style={{ position:'absolute', inset:-6, borderRadius:'50%', border:`2px solid ${s.color}44`, animation:'ping 1.5s infinite' }}/>}
                </div>
                {/* Label */}
                <div style={{ marginTop:6, fontSize:'0.62rem', textAlign:'center', lineHeight:1.2, fontWeight: active ? 800 : done ? 600 : 400,
                  color: active ? s.color : done ? 'var(--text-primary)' : 'var(--text-muted)', maxWidth:66 }}>
                  {s.label}
                </div>
              </div>
              {/* Connector */}
              {i < stages.length-1 && (
                <div style={{ flex:1, height:3, margin:'0 2px', marginBottom:22,
                  background: i < current ? `linear-gradient(90deg,${stages[i].color},${stages[i+1].color})` : 'var(--border)',
                  borderRadius:2, transition:'background 0.4s',
                }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function LiveTracking() {
  const [shipments, setShipments] = useState(DEMO_SHIPMENTS);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [tick, setTick] = useState(0);

  // Pulse the "LIVE" tick every 10s
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t+1), 10000);
    return () => clearInterval(iv);
  }, []);

  const list = shipments.filter(s => typeFilter === 'All' || s.type === typeFilter);
  const active = shipments.filter(s => s.stage < (s.type==='PO' ? PO_STAGES.length - 1 : SO_STAGES.length - 1));
  const delivered = shipments.filter(s => s.stage === (s.type==='PO' ? PO_STAGES.length - 1 : SO_STAGES.length - 1));

  const selShipment = shipments.find(s => s.id === selected);
  const selStages = selShipment?.type === 'PO' ? PO_STAGES : SO_STAGES;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Live Tracking</h1>
          <p className="page-subtitle">
            Real-time shipment tracking for all orders &nbsp;
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'2px 10px', borderRadius:10, fontSize:'0.7rem', fontWeight:700 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'ping 1.5s infinite' }}/>
              LIVE — refreshed {tick} times
            </span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="card-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Total Shipments', value:shipments.length, icon:'📦', color:'#6366f1' },
          { label:'Active / In Transit', value:active.length, icon:'🚛', color:'#f97316' },
          { label:'Delivered', value:delivered.length, icon:'✅', color:'#10b981' },
          { label:'Purchase Orders', value:shipments.filter(s=>s.type==='PO').length, icon:'🛒', color:'#0ea5e9' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--card-accent':s.color }}>
            <div className="stat-icon" style={{ background:s.color+'22', fontSize:'1.3rem' }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize:'1.3rem' }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap:20 }}>
        {/* Shipment List */}
        <div>
          {/* Filter Tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {['All','PO','SO'].map(t => (
              <button key={t} onClick={()=>setTypeFilter(t)} style={{ padding:'7px 20px', borderRadius:10, border:'2px solid', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s',
                background: typeFilter===t ? 'var(--accent)' : 'var(--bg-card)',
                color: typeFilter===t ? '#fff' : 'var(--text-muted)',
                borderColor: typeFilter===t ? 'var(--accent)' : 'var(--border)',
              }}>{t === 'All' ? '📋 All' : t === 'PO' ? '🛒 PO' : '📤 SO'}</button>
            ))}
          </div>

          {/* Cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {list.map(s => {
              const stages = s.type==='PO' ? PO_STAGES : SO_STAGES;
              const curStage = stages[s.stage];
              const pct = Math.round((s.stage / (stages.length-1)) * 100);
              const isDone = s.stage === stages.length-1;
              const isActive = s.id === selected;
              return (
                <div key={s.id} onClick={()=>setSelected(isActive ? null : s.id)}
                  style={{ background:'var(--bg-card)', border:`2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, borderRadius:14, padding:'16px', cursor:'pointer', transition:'all 0.18s',
                    boxShadow: isActive ? '0 0 0 3px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.06)' }}
                  onMouseOver={e=>{ if(!isActive) e.currentTarget.style.borderColor='var(--border-glow)'; }}
                  onMouseOut={e=>{ if(!isActive) e.currentTarget.style.borderColor='var(--border)'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <span style={{ fontFamily:'monospace', fontWeight:800, color:'var(--accent)', fontSize:'0.8rem' }}>{s.id}</span>
                      <span style={{ marginLeft:8, background: s.type==='PO'?'rgba(99,102,241,0.15)':'rgba(16,185,129,0.15)', color:s.type==='PO'?'#a78bfa':'#34d399', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:8 }}>{s.type}</span>
                    </div>
                    <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>ETA: {fmtDate(s.eta)}</span>
                  </div>
                  <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.82rem', marginBottom:3 }}>{s.party}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:10 }}>{s.item}</div>

                  {/* Progress */}
                  <div style={{ height:5, background:'var(--border)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ width:`${pct}%`, height:'100%', background: isDone ? '#10b981' : 'var(--accent)', borderRadius:4, transition:'width 0.5s' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:700, color: isDone ? '#10b981' : 'var(--text-muted)' }}>
                      {curStage?.icon} {curStage?.label}
                    </span>
                    <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{pct}% complete</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selShipment && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Header */}
            <div className="card" style={{ padding:'20px 24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{selShipment.type === 'PO' ? 'Purchase Order' : 'Sales Order'}</div>
                  <h2 style={{ color:'var(--text-primary)', fontWeight:900, fontSize:'1.2rem' }}>{selShipment.id}</h2>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:2 }}>{selShipment.party}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:900, fontSize:'1.1rem', color:'var(--accent)' }}>{fmt(selShipment.amount)}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>via {selShipment.carrier}</div>
                  <div style={{ fontSize:'0.68rem', fontFamily:'monospace', color:'var(--text-muted)' }}>AWB: {selShipment.awb}</div>
                </div>
              </div>

              {/* Stage Tracker */}
              <StageBar stages={selStages} current={selShipment.stage}/>

              {/* Location Chip */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, background:'var(--bg-secondary)', borderRadius:10, padding:'8px 14px', width:'fit-content' }}>
                <MapPin size={13} color="var(--accent)"/>
                <span style={{ fontSize:'0.78rem', color:'var(--text-primary)', fontWeight:600 }}>{selShipment.location}</span>
              </div>
            </div>

            {/* Timeline Updates */}
            <div className="card" style={{ padding:'20px 24px' }}>
              <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
                <Clock size={14} color="var(--accent)"/> Tracking Timeline
              </div>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:0, bottom:0, width:2, background:'var(--border)' }}/>
                {[...selShipment.updates].reverse().map((u, i) => {
                  const stage = selStages[u.stage];
                  const isLatest = i === 0;
                  return (
                    <div key={i} style={{ display:'flex', gap:12, marginBottom:16, position:'relative' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background: isLatest ? 'var(--accent)' : 'var(--bg-secondary)', border:`2px solid ${isLatest ? 'var(--accent)' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', flexShrink:0, zIndex:1 }}>
                        {stage?.icon || '●'}
                      </div>
                      <div style={{ flex:1, background: isLatest ? 'rgba(99,102,241,0.06)' : 'transparent', borderRadius:10, padding: isLatest ? '8px 12px' : '0', border: isLatest ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ fontWeight: isLatest ? 700 : 500, color:'var(--text-primary)', fontSize:'0.82rem' }}>{u.msg}</div>
                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:2 }}>{u.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div className="card" style={{ padding:'16px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { label:'Items', value:selShipment.item },
                  { label:'Order Amount', value:fmt(selShipment.amount) },
                  { label:'Order Date', value:fmtDate(selShipment.ordered) },
                  { label:'Expected Delivery', value:fmtDate(selShipment.eta) },
                  { label:'Courier', value:selShipment.carrier },
                  { label:'AWB No.', value:selShipment.awb },
                ].map(({label,value})=>(
                  <div key={label} style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 14px' }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                    <div style={{ color:'var(--text-primary)', fontWeight:600, fontSize:'0.82rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping {
          0%   { opacity:1; transform:scale(1); }
          75%  { opacity:0; transform:scale(1.6); }
          100% { opacity:0; transform:scale(1.6); }
        }
      `}</style>
    </div>
  );
}
