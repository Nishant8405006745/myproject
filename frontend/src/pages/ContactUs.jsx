import { useState } from 'react';
import {
  Mail, Phone, MapPin, Globe, MessageCircle,
  Building2, Info, Send, ExternalLink, Copy, CheckCheck,
  AtSign, Share2, Briefcase, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Company Info ─────────────────────────────────────────────── */
const COMPANY = {
  name:    'HYGLOW Accounting Suite',
  tagline: 'Smart Accounting. Simplified.',
  about:   'HYGLOW is a modern, all-in-one accounting and business management platform built for growing teams. We help businesses manage invoices, expenses, payroll, and more — all in one beautiful, intuitive interface.',
  email:   'support@hyglow.in',
  phone:   '+91 98765 43210',
  address: '4th Floor, Skyline Tower, MG Road, Bengaluru – 560001, India',
  website: 'https://hyglow.in',
  founded: '2024',
  employees: '10–50',
  industry: 'FinTech / SaaS',
};

const SOCIALS = [
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    color: '#25D366',
    bg: 'rgba(37,211,102,0.1)',
    url: 'https://wa.me/919876543210',
    label: 'Chat on WhatsApp',
  },
  {
    name: 'LinkedIn',
    icon: Briefcase,
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.1)',
    url: 'https://linkedin.com/company/hyglow',
    label: 'Follow on LinkedIn',
  },
  {
    name: 'Email',
    icon: Mail,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    url: `mailto:${COMPANY.email}`,
    label: 'Send us an Email',
  },
  {
    name: 'Facebook',
    icon: Share2,
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.1)',
    url: 'https://facebook.com/hyglow',
    label: 'Like on Facebook',
  },
  {
    name: 'Instagram',
    icon: Camera,
    color: '#E1306C',
    bg: 'rgba(225,48,108,0.1)',
    url: 'https://instagram.com/hyglow',
    label: 'Follow on Instagram',
  },
  {
    name: 'Twitter / X',
    icon: AtSign,
    color: '#1DA1F2',
    bg: 'rgba(29,161,242,0.1)',
    url: 'https://twitter.com/hyglow',
    label: 'Follow on Twitter',
  },
  {
    name: 'Website',
    icon: Globe,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    url: COMPANY.website,
    label: 'Visit Website',
  },
];

/* ── Contact Form ─────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate send
    setSent(true);
    setLoading(false);
    toast.success('Message sent! We\'ll get back to you soon 🎉');
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCheck size={32} color="#10b981" />
      </div>
      <h3 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: '1.1rem' }}>Message Sent!</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
      <button className="btn btn-ghost" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
        Send Another
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Your Name *</label>
          <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Subject</label>
        <input className="form-input" placeholder="How can we help you?" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
      </div>
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="form-label">Message *</label>
        <textarea className="form-input" rows={5} style={{ resize: 'vertical' }} placeholder="Tell us more about your query…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
        <Send size={15} /> {loading ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}

/* ── Copy to clipboard helper ─────────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
      onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
      onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────────── */
export default function ContactUs() {
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">Get in touch with the HYGLOW team</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Company Profile Card */}
          <div className="card" style={{ padding: 28 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'var(--theme-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px var(--accent-glow)',
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-1px' }}>HG</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{COMPANY.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>{COMPANY.tagline}</div>
              </div>
            </div>

            {/* About */}
            <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 20, borderLeft: '3px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem' }}>
                <Info size={13} /> About HYGLOW
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {COMPANY.about}
              </p>
            </div>

            {/* Company Details */}
            {[
              { icon: Building2, label: 'Industry', value: COMPANY.industry },
              { icon: Globe,     label: 'Founded',  value: COMPANY.founded  },
              { icon: null,      label: 'Team Size', value: COMPANY.employees },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {Icon && <Icon size={13} />} {label}
                </span>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Contact Details */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={15} color="var(--accent)" /> Contact Information
            </h3>
            {[
              { icon: Mail,    label: 'Email',   value: COMPANY.email   },
              { icon: Phone,   label: 'Phone',   value: COMPANY.phone   },
              { icon: MapPin,  label: 'Address', value: COMPANY.address },
              { icon: Globe,   label: 'Website', value: COMPANY.website, link: COMPANY.website },
            ].map(({ icon: Icon, label, value, link }) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(var(--accent-rgb,99,102,241),0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', fontSize: '0.85rem', wordBreak: 'break-all', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {value} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', wordBreak: 'break-word' }}>{value}</span>
                      <CopyBtn text={value} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: '0.95rem', fontWeight: 700 }}>
              🌐 Connect With Us
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SOCIALS.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: s.bg, borderRadius: 12, border: `1px solid ${s.color}22`,
                    transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer',
                  }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}33`; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.icon size={16} color="white" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: s.color }}>{s.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Map embed */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <iframe
              title="HYGLOW Office Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.0113870327!2d77.5936!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnMzcuMCJF!5e0!3m2!1sen!2sin!4v1"
              width="100%" height="220" style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                <MapPin size={14} color="var(--accent)" /> {COMPANY.address}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Send us a Message</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>We typically respond within 24 hours on business days.</p>
            </div>
            <ContactForm />
          </div>

          {/* FAQ Snippets */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>💬 Quick Answers</h3>
            {[
              { q: 'How do I reset my password?', a: 'Go to Profile → Change Password. You\'ll need your current password.' },
              { q: 'How do I get access to a module?', a: 'Contact your manager or admin to request module permissions.' },
              { q: 'Where can I see my payslips?', a: 'Navigate to Payroll from the sidebar menu.' },
              { q: 'How do I update my profile?', a: 'Go to Profile → Edit Profile. Changes need manager approval.' },
            ].map(({ q, a }) => (
              <details key={q} style={{ marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {q} <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>+</span>
                </summary>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 8, lineHeight: 1.5, paddingLeft: 4 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
