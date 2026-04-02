import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel } from '../utils/excel';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/accounting/payroll').then(r => setRecords(r.data)).finally(() => setLoading(false));
  }, []);

  const totalGross = records.reduce((s,r) => s + r.gross_salary, 0);
  const totalDed   = records.reduce((s,r) => s + r.deductions, 0);
  const totalNet   = records.reduce((s,r) => s + r.net_salary, 0);

  const handleExport = () => {
    const data = records.map(r => ({
      'Employee Name':    r.employee_name,
      'Department':       r.department,
      'Gross Salary (INR)': r.gross_salary,
      'Deductions (INR)': r.deductions,
      'Net Salary (INR)': r.net_salary,
      'Pay Period':       r.pay_period,
      'Payment Date':     r.payment_date,
      'Status':           r.status,
    }));
    exportToExcel(data, 'Payroll', 'HYGLOW_Payroll');
    toast.success('Payroll exported to Excel!');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">Employee salary and payroll records</p>
        </div>
        <button className="btn btn-ghost" onClick={handleExport}>
          <Download size={15}/> Export Excel
        </button>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        {[
          { label:'Total Employees', value:records.length,  color:'#3b82f6' },
          { label:'Gross Salary',    value:fmt(totalGross), color:'#8b5cf6' },
          { label:'Deductions',      value:fmt(totalDed),   color:'#ef4444' },
          { label:'Net Disbursed',   value:fmt(totalNet),   color:'#10b981' },
        ].map((s,i) => (
          <div key={i} className="stat-card" style={{'--card-accent':s.color}}>
            <div className="stat-value" style={{fontSize:'1.4rem'}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Payroll Records ({records.length})</span>
        </div>
        {loading ? <div className="loading-center"><div className="spinner"/></div> : (
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Gross Salary</th><th>Deductions</th><th>Net Salary</th><th>Pay Period</th><th>Payment Date</th><th>Status</th></tr></thead>
            <tbody>
              {records.length===0
                ? <tr><td colSpan={8}><div className="empty-state"><p>No payroll records found</p></div></td></tr>
                : records.map(r => (
                  <tr key={r.id}>
                    <td style={{fontWeight:500, color:'var(--text-primary)'}}>{r.employee_name}</td>
                    <td>{r.department}</td>
                    <td>{fmt(r.gross_salary)}</td>
                    <td style={{color:'#ef4444'}}>{fmt(r.deductions)}</td>
                    <td style={{fontWeight:600, color:'var(--text-primary)'}}>{fmt(r.net_salary)}</td>
                    <td>{r.pay_period}</td>
                    <td>{r.payment_date}</td>
                    <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
