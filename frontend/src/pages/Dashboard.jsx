import { useState, useEffect } from 'react';
import api from '../api/axios';
import { TrendingUp, TrendingDown, DollarSign, FileText, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/accounting/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><p>Unable to load dashboard data.</p></div>;

  const { stats, monthly_revenue, expense_by_category } = data;

  const STAT_CARDS = [
    { label: 'Total Revenue',     value: fmt(stats.total_revenue),     icon: TrendingUp,   color: '#10b981', bg: 'rgba(16,185,129,0.1)', change: '+12.5%', dir: 'up' },
    { label: 'Total Expenses',    value: fmt(stats.total_expenses),    icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   change: '+4.2%',  dir: 'down' },
    { label: 'Net Profit',        value: fmt(stats.net_profit),        icon: DollarSign,   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', change: '+18.3%', dir: 'up' },
    { label: 'Total Invoices',    value: stats.total_invoices,         icon: FileText,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', change: `${stats.paid_invoices} paid`, dir: 'up' },
    { label: 'Pending Invoices',  value: stats.pending_invoices,       icon: Clock,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', change: 'Awaiting', dir: 'down' },
    { label: 'Overdue Invoices',  value: stats.overdue_invoices,       icon: AlertCircle,  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  change: 'Action needed', dir: 'down' },
    { label: 'Payroll Disbursed', value: fmt(stats.payroll_disbursed), icon: Users,        color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  change: 'This period', dir: 'up' },
    { label: 'Paid Invoices',     value: stats.paid_invoices,          icon: CheckCircle,  color: '#10b981', bg: 'rgba(16,185,129,0.1)', change: 'Completed', dir: 'up' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ fontSize: '0.875rem', color: p.color, fontWeight: 600 }}>
              {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">Complete overview of your accounting metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="card-grid">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className="stat-card" style={{ '--card-accent': card.color }}>
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className={`stat-change ${card.dir}`}>
              {card.dir === 'up' ? '↑' : '↓'} {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Monthly Revenue Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, fill: '#60a5fa' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-title">Expenses by Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={expense_by_category} dataKey="amount" nameKey="category"
                cx="50%" cy="50%" outerRadius={90} innerRadius={55}
                paddingAngle={3}>
                {expense_by_category.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue vs Expenses Bar */}
      <div className="chart-container">
        <div className="chart-title">Revenue vs Expenses Overview</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: 'Revenue', value: stats.total_revenue },
            { name: 'Expenses', value: stats.total_expenses },
            { name: 'Payroll', value: stats.payroll_disbursed },
            { name: 'Net Profit', value: stats.net_profit },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6,6,0,0]}>
              {['#3b82f6','#ef4444','#f59e0b','#10b981'].map((c, i) => <Cell key={i} fill={c} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
