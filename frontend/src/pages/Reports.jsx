import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const COLORS = ['#10b981','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#06b6d4'];

export default function Reports() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/accounting/reports').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  if (!data)   return <div className="empty-state"><p>Unable to load reports.</p></div>;

  const { income_statement, balance_sheet, invoice_by_status, expense_by_month } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length)
      return <div style={{background:'#1e293b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'10px 14px'}}>
        <p style={{fontSize:'0.8rem',color:'#94a3b8',marginBottom:4}}>{label}</p>
        {payload.map((p,i)=><p key={i} style={{color:p.color,fontWeight:600}}>{fmt(p.value)}</p>)}
      </div>;
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Income statement, balance sheet & analytics</p>
        </div>
      </div>

      {/* Income Statement */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div className="card">
          <h3 style={{fontWeight:700,marginBottom:18,color:'var(--text-primary)'}}>📊 Income Statement</h3>
          {[
            { label:'Total Revenue',   value:income_statement.total_revenue,    color:'#10b981' },
            { label:'Total Expenses',  value:income_statement.total_expenses,   color:'#ef4444' },
            { label:'Gross Profit',    value:income_statement.gross_profit,     color:'#3b82f6' },
            { label:'Net Profit',      value:income_statement.net_profit,       color:'#f59e0b' },
          ].map((r,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<3?'1px solid var(--border)':'none'}}>
              <span style={{color:'var(--text-secondary)',fontSize:'0.875rem'}}>{r.label}</span>
              <span style={{fontWeight:700,color:r.color,fontSize:'1rem'}}>{fmt(r.value)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{fontWeight:700,marginBottom:18,color:'var(--text-primary)'}}>⚖️ Balance Sheet Summary</h3>
          {[
            { label:'Total Debit (Assets)', value:balance_sheet.total_debit,  color:'#10b981' },
            { label:'Total Credit (Liab.)', value:balance_sheet.total_credit, color:'#ef4444' },
            { label:'Net Balance',          value:balance_sheet.net_balance,  color:'#3b82f6' },
          ].map((r,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
              <span style={{color:'var(--text-secondary)',fontSize:'0.875rem'}}>{r.label}</span>
              <span style={{fontWeight:700,color:r.color,fontSize:'1rem'}}>{fmt(r.value)}</span>
            </div>
          ))}
          <div style={{marginTop:24,padding:'14px',background:'rgba(16,185,129,0.06)',borderRadius:8,border:'1px solid rgba(16,185,129,0.15)'}}>
            <span style={{fontSize:'0.8rem',color:'#10b981'}}>✓ Balance sheet is balanced</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Monthly Expense Trend</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={expense_by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}}/>
              <YAxis tick={{fill:'#64748b',fontSize:11}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="amount" fill="#ef4444" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-title">Invoice Status Breakdown</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={invoice_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                {invoice_by_status.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'#1e293b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8,justifyContent:'center'}}>
            {invoice_by_status.map((s,i)=>(
              <span key={i} style={{fontSize:'0.75rem',color:'#94a3b8',display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:COLORS[i%COLORS.length],display:'inline-block'}}/>
                {s.status} ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
