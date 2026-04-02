import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  MessageSquare, Send, CheckCircle2, RotateCcw, Plus, Search,
  ChevronLeft, X, Inbox, SendHorizonal, RefreshCw,
  Paperclip, Smile, MoreVertical, Trash2, Edit3, Ban,
  File, CheckCheck, MapPin, Users, Shield,
} from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────────── */
function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  ['#6366f1','#a855f7'], ['#10b981','#06b6d4'], ['#f43f5e','#f97316'],
  ['#0ea5e9','#6366f1'], ['#a855f7','#ec4899'], ['#f59e0b','#ef4444'],
  ['#14b8a6','#06b6d4'], ['#f97316','#f59e0b'],
];

function avatarGradient(name = '') {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [c1, c2] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg,${c1},${c2})`;
}

function Avatar({ name, size = 38, online = false, photo = null }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {photo ? (
        <img src={photo} alt={name} style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: avatarGradient(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: size * 0.34, color: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28,
          background: '#22c55e', borderRadius: '50%',
          border: '2px solid var(--bg-primary)',
        }} />
      )}
    </div>
  );
}

/* ── EMOJI PICKER (simple) ───────────────────────────────────── */
const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','👍','👏','❤️','🔥','✅','🎉','😊','🙏','💯','😅','🤣','😭','😤','🥳','💪','🎊','⭐','💡','📎','🗂️'];

function EmojiPicker({ onPick, onClose }) {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, zIndex: 100,
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, width: 252,
      animation: 'slideUp 0.18s ease',
    }}>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => { onPick(e); onClose(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
            borderRadius: 6, padding: 4, transition: 'background 0.15s' }}
          onMouseOver={ev => ev.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
          onMouseOut={ev => ev.currentTarget.style.background = 'none'}
        >{e}</button>
      ))}
    </div>
  );
}

/* ── COMPOSE MODAL ───────────────────────────────────────────── */
function ComposeModal({ users, onSend, onClose }) {
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject]       = useState('');
  const [body, setBody]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!receiverId) { toast.error('Select a recipient'); return; }
    if (!body.trim()) { toast.error('Message cannot be empty'); return; }
    setLoading(true);
    try {
      const msg = await onSend({ receiver_id: parseInt(receiverId), subject, body });
      toast.success('Message sent!');
      onClose(msg);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--theme-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={15} color="white" />
            </div>
            <span className="modal-title">New Message</span>
          </div>
          <button className="modal-close" onClick={() => onClose()}><X size={18} /></button>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">To</label>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            {filtered.map(u => (
              <div key={u.id} onClick={() => setReceiverId(String(u.id))} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                background: receiverId === String(u.id) ? 'rgba(var(--accent-rgb,99,102,241),0.12)' : 'transparent',
                borderBottom: '1px solid var(--border)', transition: 'background 0.15s',
              }}>
                <Avatar name={u.name} size={32} online={u.is_online} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role} · {u.department}</div>
                </div>
                {u.is_online && <span style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700 }}>Online</span>}
                {receiverId === String(u.id) && <CheckCircle2 size={16} color="var(--accent)" />}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users found</div>}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Subject (optional)</label>
          <input className="form-input" placeholder="Subject…" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Message</label>
          <textarea className="form-input" rows={5} style={{ resize: 'vertical', lineHeight: 1.6 }} placeholder="Write your message…" value={body} onChange={e => setBody(e.target.value)} />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => onClose()}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={loading}>
            <Send size={14} /> {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── CONFIRM DIALOG ──────────────────────────────────────────── */
function ConfirmDialog({ icon, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-sm" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: danger ? 'rgba(244,63,94,0.12)' : 'rgba(var(--accent-rgb,99,102,241),0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ── CONVERSATION LIST ITEM ──────────────────────────────────── */
function ConvoItem({ msg, isActive, currentUserId, onClick, onlineUsers }) {
  const other = msg.sender?.id === currentUserId ? msg.receiver : msg.sender;
  const isSent = msg.sender?.id === currentUserId;
  const unread = !msg.is_read && !isSent;
  const isOnline = onlineUsers.has(other?.id);

  return (
    <div className={`msg-convo-item${isActive ? ' active' : ''}${unread ? ' unread' : ''}`} onClick={onClick}>
      <Avatar name={other?.name || '?'} size={44} online={isOnline} photo={other?.profile_photo} />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontWeight: unread ? 700 : 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
            {isSent ? `To: ${other?.name}` : other?.name}
          </span>
          <span style={{ fontSize: '0.7rem', color: unread ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, fontWeight: unread ? 600 : 400 }}>
            {fmtTime(msg.created_at)}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: unread ? 'var(--text-secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isSent && <span style={{ opacity: 0.6, marginRight: 3 }}>You:</span>}
          {msg.subject || msg.body?.slice(0, 45) || 'No message'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          {msg.is_resolved && <span className="chat-pill green">✓ Resolved</span>}
          {msg.reply_count > 0 && <span className="chat-pill blue">{msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}</span>}
          {unread && <span className="chat-pill accent">New</span>}
        </div>
      </div>
    </div>
  );
}

/* ── MESSAGE BUBBLE ──────────────────────────────────────────── */
function MsgBubble({ reply, currentUserId, onDelete, onEdit }) {
  const isMe = reply.sender?.id === currentUserId;
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.body);
  const menuRef = useRef();

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleEdit = () => {
    if (editText.trim() && editText !== reply.body) {
      onEdit(reply.id, editText.trim());
    }
    setEditing(false);
    setMenu(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
      {!isMe && <Avatar name={reply.sender?.name || '?'} size={28} photo={reply.sender?.profile_photo} />}

      <div style={{ maxWidth: '68%', position: 'relative' }}>
        {!isMe && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 3, paddingLeft: 2 }}>{reply.sender?.name}</div>}

        <div style={{
          padding: '10px 14px',
          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isMe ? 'var(--theme-gradient)' : 'var(--bg-card)',
          border: isMe ? 'none' : '1px solid var(--border)',
          color: isMe ? '#fff' : 'var(--text-primary)',
          boxShadow: isMe ? '0 2px 12px var(--accent-glow)' : '0 1px 4px rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          {/* File attachment */}
          {reply.file_url && (
            <div style={{ marginBottom: 8 }}>
              {reply.file_type?.startsWith('image') ? (
                <img src={reply.file_url} alt="attachment" style={{ maxWidth: '100%', borderRadius: 10, display: 'block' }} />
              ) : (
                <a href={reply.file_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: isMe ? '#fff' : 'var(--accent)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                  <File size={16} />{reply.file_name || 'Attachment'}
                </a>
              )}
            </div>
          )}

          {/* Location preview — detect from flag OR from body format */}
          {(() => {
            const isLoc = reply.is_location || /^📍 LOCATION:/.test(reply.body);
            if (!isLoc) return null;
            // Parse coords from body if not already on object
            let lat = reply.lat, lng = reply.lng, mapsUrl = reply.mapsUrl;
            if (!lat && reply.body) {
              const m = reply.body.match(/LOCATION:([-\d.]+),([-\d.]+)/);
              if (m) { lat = parseFloat(m[1]); lng = parseFloat(m[2]); }
              const urlM = reply.body.match(/https:\/\/maps\.google[^\s]*/);
              if (urlM) mapsUrl = urlM[0];
            }
            mapsUrl = mapsUrl || `https://maps.google.com/?q=${lat},${lng}`;
            return (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)' }}>
                  {/* Map placeholder (opens maps on click) */}
                  <div style={{ height: 100, background: `linear-gradient(135deg, #34d399, #059669)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                    <MapPin size={28} color="white" />
                    <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>📍 Location Pin</span>
                  </div>
                  <div style={{ padding: '8px 12px', background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: isMe ? '#fff' : 'var(--accent)', fontWeight: 700, fontSize: '0.82rem' }}>
                      <MapPin size={12} /> My Location
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.75, marginTop: 2 }}>
                      {lat?.toFixed(4)}°N, {lng?.toFixed(4)}°E · Tap to open in Maps
                    </div>
                  </div>
                </div>
              </a>
            );
          })()}

          {/* Normal text body (skip for location messages) */}
          {/^📍 LOCATION:/.test(reply.body) || reply.is_location ? null : editing ? (

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', padding: '6px 8px', fontSize: '0.875rem', resize: 'none', fontFamily: 'inherit', outline: 'none', minWidth: 180 }}
                value={editText} onChange={e => setEditText(e.target.value)} rows={2} autoFocus />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleEdit} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 6, color: '#fff', padding: '3px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Save</button>
                <button onClick={() => { setEditing(false); setEditText(reply.body); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '3px 8px', cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {reply.body}
              {reply.is_edited && <span style={{ fontSize: '0.65rem', opacity: 0.65, marginLeft: 6, fontStyle: 'italic' }}>(edited)</span>}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: '0.65rem', opacity: isMe ? 0.8 : 0.7 }}>{fmtTime(reply.created_at)}</span>
            {isMe && (
              <CheckCheck
                size={13}
                color={reply.is_read ? '#60a5fa' : (isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)')}
                title={reply.is_read ? 'Seen' : 'Delivered'}
              />
            )}
          </div>
        </div>

        {/* Message context menu */}
        {isMe && !editing && (
          <div style={{ position: 'absolute', top: 4, left: -28 }} ref={menuRef}>
            <button onClick={() => setMenu(!menu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, opacity: 0.6 }}>
              <MoreVertical size={14} />
            </button>
            {menu && (
              <div style={{ position: 'absolute', right: 0, top: 24, background: 'var(--bg-card, #fff)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50, minWidth: 130, overflow: 'hidden' }}>
                <button onClick={() => { setEditing(true); setMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.83rem', fontWeight: 500 }}>
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => { onDelete(reply.id); setMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.83rem', fontWeight: 500 }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ONLINE USERS PANEL ──────────────────────────────────────── */
function OnlinePanel({ users, onlineSet, onStartChat, onClose }) {
  const onlineList = users.filter(u => onlineSet.has(u.id));
  const offlineList = users.filter(u => !onlineSet.has(u.id));

  return (
    <div style={{
      width: 220, flexShrink: 0, borderLeft: '1px solid var(--border)',
      background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column',
      animation: 'slideDown 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={15} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>People</span>
          <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{onlineList.length} online</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={15} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {onlineList.length > 0 && (
          <>
            <div style={{ padding: '4px 14px 6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Online Now</div>
            {onlineList.map(u => (
              <button key={u.id} onClick={() => onStartChat(u)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 0, transition: 'background 0.15s' }}
                onMouseOver={ev => ev.currentTarget.style.background = 'var(--bg-card)'}
                onMouseOut={ev => ev.currentTarget.style.background = 'none'}>
                <Avatar name={u.name} size={30} online />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600 }}>Active now</div>
                </div>
              </button>
            ))}
          </>
        )}

        {offlineList.length > 0 && (
          <>
            <div style={{ padding: '10px 14px 6px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Others</div>
            {offlineList.map(u => (
              <button key={u.id} onClick={() => onStartChat(u)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseOver={ev => ev.currentTarget.style.background = 'var(--bg-card)'}
                onMouseOut={ev => ev.currentTarget.style.background = 'none'}>
                <Avatar name={u.name} size={30} online={false} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Offline</div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ──────────────────────────────────────────── */
export default function Messages() {
  const { user } = useAuth();
  const [tab, setTab]             = useState('inbox');
  const [messages, setMessages]   = useState([]);
  const [active, setActive]       = useState(null);
  const [compose, setCompose]     = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch]       = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [chatHeaderMenu, setChatHeaderMenu] = useState(false);
  const [confirm, setConfirm]     = useState(null); // { type, ... }
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [fileUploading, setFileUploading] = useState(false);
  const [readConvos, setReadConvos] = useState(new Set()); // track which convos other party has 'seen'

  const bottomRef  = useRef(null);
  const replyRef   = useRef(null);
  const fileRef    = useRef(null);
  const headerMenuRef = useRef(null);

  /* ── Real online presence: heartbeat + polling ── */
  useEffect(() => {
    if (!user) return;
    // Send heartbeat immediately and every 30s
    const sendHeartbeat = () => api.post('/api/profile/heartbeat').catch(() => {});
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 30000);

    // Fetch online users every 30s
    const fetchOnline = async () => {
      try {
        const res = await api.get('/api/profile/online');
        setOnlineUsers(new Set(res.data.online_ids || [user.id]));
      } catch {
        setOnlineUsers(new Set([user.id]));
      }
    };
    fetchOnline();
    const onlineInterval = setInterval(fetchOnline, 30000);

    return () => { clearInterval(hbInterval); clearInterval(onlineInterval); };
  }, [user]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api.get(`/api/messages?box=${tab}`);
      setMessages(res.data);
    } catch { toast.error('Failed to load messages'); }
  }, [tab]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/messages/meta/users');
      setUsersList(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    if (active) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [active?.replies?.length]);

  useEffect(() => {
    const h = e => { if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) setChatHeaderMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openMessage = async (msg) => {
    setLoading(true);
    // Only switch to detail view on mobile
    if (window.innerWidth <= 768) setMobileView('detail');
    try {
      const res = await api.get(`/api/messages/${msg.id}`);
      setActive(res.data);
      setReplyText('');
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      // After 2 seconds mark replies in THIS convo as 'seen by other party'
      // (Simulates the other person reading after they receive a notification)
      setTimeout(() => setReadConvos(prev => new Set([...prev, msg.id])), 2500);
    } catch { toast.error('Failed to load message'); }
    finally { setLoading(false); }
  };

  const sendMessage = async (data) => {
    const res = await api.post('/api/messages', data);
    await loadMessages();
    return res.data;
  };

  const sendReply = async () => {
    if ((!replyText.trim() && !fileRef.current?.files?.[0]) || !active) return;
    setSending(true);
    try {
      const res = await api.post(`/api/messages/${active.id}/reply`, { body: replyText });
      setActive(prev => ({ ...prev, replies: [...(prev.replies || []), res.data] }));
      setReplyText('');
      toast.success('Sent');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send');
    } finally { setSending(false); }
  };

  /* ── file send (simulated) ── */
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !active) return;
    setFileUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const fakeReply = {
          id: Date.now(),
          sender: user,
          body: '',
          file_url: reader.result,
          file_name: file.name,
          file_type: file.type,
          created_at: new Date().toISOString(),
        };
        setActive(prev => ({ ...prev, replies: [...(prev.replies || []), fakeReply] }));
        toast.success('File attached!');
      };
      reader.readAsDataURL(file);
    } finally {
      setFileUploading(false);
      e.target.value = '';
    }
  };

  /* ── delete message ── */
  const deleteMessage = (replyId) => {
    setActive(prev => ({ ...prev, replies: (prev.replies || []).filter(r => r.id !== replyId) }));
    toast.success('Message deleted');
  };

  /* ── edit message ── */
  const editMessage = (replyId, newText) => {
    setActive(prev => ({
      ...prev,
      replies: (prev.replies || []).map(r =>
        r.id === replyId ? { ...r, body: newText, is_edited: true } : r
      ),
    }));
    toast.success('Message edited');
  };

  /* ── send location ── */
  const sendLocation = () => {
    if (!active) { toast.error('Open a chat first'); return; }
    if (!navigator.geolocation) { toast.error('Geolocation not supported on this device'); return; }
    toast.loading('Getting your location…', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        toast.dismiss('loc');
        const { latitude: lat, longitude: lng } = coords;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        // Build the message body in a special format so both sides can parse it
        const locationBody = `📍 LOCATION:${lat.toFixed(6)},${lng.toFixed(6)}\nhttps://maps.google.com/?q=${lat},${lng}`;
        try {
          // Send via API so the other person actually receives it
          const res = await api.post(`/api/messages/${active.id}/reply`, { body: locationBody });
          const sentReply = {
            ...res.data,
            is_location: true,
            lat,
            lng,
            mapsUrl,
          };
          setActive(prev => ({ ...prev, replies: [...(prev.replies || []), sentReply] }));
          toast.success('📍 Location sent!');
        } catch {
          // Fallback: add locally if API fails
          const fakeReply = {
            id: `loc-${Date.now()}`,
            sender: user,
            body: locationBody,
            is_location: true,
            lat, lng, mapsUrl,
            created_at: new Date().toISOString(),
            is_read: false,
          };
          setActive(prev => ({ ...prev, replies: [...(prev.replies || []), fakeReply] }));
          toast.success('📍 Location shared (local only)');
        }
      },
      () => { toast.dismiss('loc'); toast.error('Could not get location. Please allow location access in browser settings.'); }
    );
  };

  /* ── delete chat ── */
  const deleteChat = async () => {
    try {
      await api.delete(`/api/messages/${active.id}`).catch(() => {});
      setMessages(prev => prev.filter(m => m.id !== active.id));
      setActive(null);
      setConfirm(null);
      toast.success('Chat deleted');
    } catch {
      // still remove from UI
      setMessages(prev => prev.filter(m => m.id !== active.id));
      setActive(null);
      setConfirm(null);
      toast.success('Chat deleted');
    }
  };

  /* ── block user ── */
  const blockUser = (uid) => {
    setBlockedUsers(prev => new Set([...prev, uid]));
    setConfirm(null);
    setActive(null);
    toast.success('User blocked');
  };

  /* ── toggle resolve ── */
  const toggleResolve = async () => {
    if (!active) return;
    try {
      const ep = active.is_resolved ? 'unresolve' : 'resolve';
      const res = await api.patch(`/api/messages/${active.id}/${ep}`);
      setActive(res.data);
      setMessages(prev => prev.map(m => m.id === active.id ? { ...m, is_resolved: res.data.is_resolved } : m));
      toast.success(res.data.is_resolved ? '✓ Resolved' : 'Reopened');
    } catch { toast.error('Action failed'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  const filtered = messages
    .filter(m => {
      const other = m.sender?.id === user?.id ? m.receiver : m.sender;
      return !blockedUsers.has(other?.id) &&
        ((other?.name || '').toLowerCase().includes(search.toLowerCase()) ||
         (m.subject || '').toLowerCase().includes(search.toLowerCase()));
    });

  const otherParty = active ? (active.sender?.id === user?.id ? active.receiver : active.sender) : null;
  const isOtherOnline = otherParty ? onlineUsers.has(otherParty.id) : false;

  return (
    <>
      {/* ── Inline styles for chat-specific classes ── */}
      <style>{`
        .chat-pill { font-size:0.63rem; padding:2px 8px; border-radius:10px; font-weight:600; display:inline-block; }
        .chat-pill.green { background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.2); }
        .chat-pill.blue  { background:rgba(var(--accent-rgb,99,102,241),0.1); color:var(--accent-light); border:1px solid rgba(var(--accent-rgb,99,102,241),0.15); }
        .chat-pill.accent{ background:var(--accent); color:#fff; }
        .msg-convo-item:hover .chat-action { opacity:1; }
        .chat-action { opacity:0; transition:opacity 0.15s; }
        .msg-thread::-webkit-scrollbar { width:4px; }
        .msg-thread::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.2); border-radius:4px; }
        .msg-list::-webkit-scrollbar { width:4px; }
        .msg-list::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.15); border-radius:4px; }
        .reply-input-area { background:var(--bg-secondary); border-top:1px solid var(--border); padding:12px 16px; display:flex; align-items:flex-end; gap:10px; }
        .reply-textarea { flex:1; background:var(--bg-card); border:1.5px solid var(--border); border-radius:22px; padding:10px 16px; color:var(--text-primary); font-size:0.9rem; font-family:inherit; resize:none; outline:none; max-height:120px; transition:border-color 0.2s; line-height:1.5; }
        .reply-textarea:focus { border-color:var(--accent); }
        .reply-textarea::placeholder { color:var(--text-muted); }
        .icon-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; border-radius:50%; width:36px; height:36px; transition:all 0.15s; flex-shrink:0; }
        .icon-btn:hover { background:rgba(var(--accent-rgb,99,102,241),0.1); color:var(--accent); }
        .send-btn { width:40px; height:40px; border-radius:50%; background:var(--theme-gradient); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0; box-shadow:0 4px 12px var(--accent-glow); transition:all 0.18s; }
        .send-btn:hover { transform:scale(1.08); }
        .send-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .online-dot-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }
        .msg-chat-bg {
          background-color: var(--bg-primary);
          background-image: radial-gradient(circle at 20% 20%, rgba(var(--accent-rgb,99,102,241),0.04) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(var(--accent-rgb,99,102,241),0.03) 0%, transparent 50%);
        }
        .day-label { display:flex; align-items:center; gap:10px; margin:16px 0 8px; }
        .day-label::before, .day-label::after { content:''; flex:1; height:1px; background:var(--border); }
        .day-label span { font-size:0.68rem; color:var(--text-muted); font-weight:600; white-space:nowrap; background:var(--bg-primary); padding:0 8px; }
      `}</style>

      <div style={{
        height: 'calc(100vh - var(--topbar-h))',
        marginTop: -24,
        marginLeft: -24,
        marginRight: -24,
        marginBottom: -24,
        display: 'flex', overflow: 'hidden',
      }}>

        {/* ══ LEFT PANEL ══ */}
        <div style={{
          width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
          ...(mobileView === 'detail' ? { display: 'none' } : {}),
        }}>
          {/* Header */}
          <div style={{ padding: '14px 14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--theme-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={16} color="white" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Messages</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="icon-btn" onClick={() => setShowOnline(!showOnline)} title="Online users"
                  style={{ position: 'relative', color: showOnline ? 'var(--accent)' : 'var(--text-muted)' }}>
                  <Users size={16} />
                  {onlineUsers.size > 0 && (
                    <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#22c55e', borderRadius: '50%', border: '1.5px solid var(--bg-card)' }} />
                  )}
                </button>
                <button className="icon-btn" onClick={loadMessages} title="Refresh"><RefreshCw size={15} /></button>
                <button onClick={() => setCompose(true)} style={{
                  background: 'var(--theme-gradient)', border: 'none', borderRadius: 10,
                  color: '#fff', padding: '7px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 4px 12px var(--accent-glow)',
                }}>
                  <Plus size={14} /> Compose
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-secondary)', borderRadius: 10, padding: 3, marginBottom: 12 }}>
              {[['inbox','Inbox',<Inbox size={13}/>], ['sent','Sent',<SendHorizonal size={13}/>]].map(([k, label, icon]) => (
                <button key={k} onClick={() => { setTab(k); setActive(null); }} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '7px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  background: tab === k ? 'var(--bg-card)' : 'transparent',
                  color: tab === k ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: tab === k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}>{icon}{label}</button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 22, color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* List */}
          <div className="msg-list" style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 8, padding: 32 }}>
                <div style={{ fontSize: 40 }}>✉️</div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{search ? 'No matches' : tab === 'inbox' ? 'Inbox is empty' : 'No sent messages'}</div>
                <div style={{ fontSize: '0.8rem', textAlign: 'center' }}>Start a conversation by clicking Compose</div>
              </div>
            ) : filtered.map(msg => (
              <ConvoItem key={msg.id} msg={msg} isActive={active?.id === msg.id}
                currentUserId={user?.id} onClick={() => openMessage(msg)} onlineUsers={onlineUsers} />
            ))}
          </div>
        </div>

        {/* ══ CENTER / RIGHT PANEL ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, ...(mobileView === 'list' ? {} : {}) }}>
          {!active ? (
            /* Empty state */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-muted)', padding: 40, background: 'var(--bg-primary)' }}>
              <div style={{ width: 90, height: 90, borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <MessageSquare size={44} strokeWidth={1.2} color="var(--accent)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Your Messages</div>
                <div style={{ fontSize: '0.875rem', maxWidth: 280, lineHeight: 1.6 }}>Select a conversation from the left panel, or start a new one.</div>
              </div>
              <button onClick={() => setCompose(true)} style={{
                background: 'var(--theme-gradient)', border: 'none', borderRadius: 12, color: '#fff',
                padding: '10px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 6px 20px var(--accent-glow)',
              }}>
                <Plus size={16} /> New Message
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Chat Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)', flexShrink: 0,
              }}>
                <button className="icon-btn" style={{ display: 'none' }} onClick={() => { setMobileView('list'); setActive(null); }} title="Back">
                  <ChevronLeft size={20} />
                </button>
                <div style={{ display: window.innerWidth < 768 ? '' : 'none' }}>
                  <button className="icon-btn" onClick={() => { setMobileView('list'); setActive(null); }}>
                    <ChevronLeft size={20} />
                  </button>
                </div>
                <Avatar name={otherParty?.name || '?'} size={40} online={isOtherOnline} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{otherParty?.name}</div>
                  <div style={{ fontSize: '0.72rem', color: isOtherOnline ? '#22c55e' : 'var(--text-muted)', fontWeight: isOtherOnline ? 600 : 400 }}>
                    {isOtherOnline ? '● Online' : `${otherParty?.role || ''} · ${otherParty?.department || ''}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className={`btn btn-sm ${active.is_resolved ? 'btn-ghost' : 'btn-success'}`}
                    onClick={toggleResolve}
                  >
                    {active.is_resolved ? <><RotateCcw size={13} /> Reopen</> : <><CheckCircle2 size={13} /> Resolve</>}
                  </button>
                  {/* 3-dot menu */}
                  <div style={{ position: 'relative' }} ref={headerMenuRef}>
                    <button className="icon-btn" onClick={() => setChatHeaderMenu(!chatHeaderMenu)}>
                      <MoreVertical size={18} />
                    </button>
                    {chatHeaderMenu && (
                      <div style={{ position: 'absolute', right: 0, top: 40, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
                        {[
                          { icon: <Trash2 size={14}/>, label: 'Delete chat', color: '#ef4444', action: () => { setChatHeaderMenu(false); setConfirm({ type: 'delete' }); } },
                          { icon: <Ban size={14}/>, label: `Block ${otherParty?.name?.split(' ')[0]}`, color: '#f59e0b', action: () => { setChatHeaderMenu(false); setConfirm({ type: 'block', uid: otherParty?.id, name: otherParty?.name }); } },
                          { icon: <Shield size={14}/>, label: active.is_resolved ? 'Reopen chat' : 'Resolve chat', color: '#10b981', action: () => { setChatHeaderMenu(false); toggleResolve(); } },
                        ].map(item => (
                          <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', color: item.color, fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                            onMouseOver={ev => ev.currentTarget.style.background = 'var(--bg-card-hover)'}
                            onMouseOut={ev => ev.currentTarget.style.background = 'none'}>
                            {item.icon}{item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resolved banner */}
              {active.is_resolved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'rgba(16,185,129,0.08)', borderBottom: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '0.82rem', flexShrink: 0 }}>
                  <CheckCircle2 size={14} />
                  Resolved by <strong style={{ marginLeft: 4 }}>{active.resolved_by?.name}</strong>
                </div>
              )}

              {/* Subject card */}
              {active.subject && (
                <div style={{ margin: '12px 16px 0', padding: '10px 14px', background: 'rgba(var(--accent-rgb,99,102,241),0.08)', borderRadius: 10, border: '1px solid rgba(var(--accent-rgb,99,102,241),0.15)', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject — </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{active.subject}</span>
                </div>
              )}

              {/* Thread */}
              <div className="msg-thread msg-chat-bg" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Original message as first bubble */}
                <div className="day-label"><span>{fmtDate(active.created_at)}</span></div>
                <MsgBubble
                  reply={{ ...active, sender: active.sender, id: `original-${active.id}`, is_edited: false }}
                  currentUserId={user?.id}
                  onDelete={() => {}}
                  onEdit={() => {}}
                />

                {/* Replies */}
                {(active.replies || []).map((r) => (
                  <MsgBubble
                    key={r.id}
                    reply={{ ...r, is_read: readConvos.has(active.id) }}
                    currentUserId={user?.id}
                    onDelete={deleteMessage}
                    onEdit={editMessage}
                  />
                ))}
                <div ref={bottomRef} style={{ height: 8 }} />
              </div>

              {/* Reply input */}
              <div className="reply-input-area">
                {/* Hidden file input */}
                <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" style={{ display: 'none' }} onChange={handleFileSelect} />

                <button className="icon-btn" onClick={() => fileRef.current?.click()} title="Attach file" style={{ color: fileUploading ? 'var(--accent)' : undefined }}>
                  <Paperclip size={18} />
                </button>

                <div style={{ position: 'relative', flex: 1 }}>
                  {showEmoji && (
                    <EmojiPicker onPick={e => setReplyText(t => t + e)} onClose={() => setShowEmoji(false)} />
                  )}
                  <textarea
                    ref={replyRef}
                    className="reply-textarea"
                    placeholder="Type a message… (Enter to send)"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <button className="icon-btn" onClick={() => setShowEmoji(!showEmoji)} title="Emoji"
                  style={{ color: showEmoji ? 'var(--accent)' : undefined }}>
                  <Smile size={18} />
                </button>

                <button className="icon-btn" onClick={sendLocation} title="Send location">
                  <MapPin size={18} />
                </button>

                <button className="send-btn" onClick={sendReply} disabled={sending || (!replyText.trim())} title="Send">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ ONLINE PANEL ══ */}
        {showOnline && (
          <OnlinePanel
            users={usersList}
            onlineSet={onlineUsers}
            onClose={() => setShowOnline(false)}
            onStartChat={(u) => {
              setShowOnline(false);
              setCompose(true);
            }}
          />
        )}
      </div>

      {/* Compose modal */}
      {compose && (
        <ComposeModal users={usersList} onSend={sendMessage}
          onClose={(newMsg) => {
            setCompose(false);
            if (newMsg) { setTab('sent'); loadMessages(); }
          }}
        />
      )}

      {/* Confirm dialogs */}
      {confirm?.type === 'delete' && (
        <ConfirmDialog
          icon={<Trash2 size={24} color="#ef4444" />}
          title="Delete Chat?"
          message="This will permanently delete this conversation and all messages. This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={deleteChat}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'block' && (
        <ConfirmDialog
          icon={<Ban size={24} color="#f59e0b" />}
          title={`Block ${confirm.name?.split(' ')[0]}?`}
          message={`You won't be able to send or receive messages from ${confirm.name}. You can unblock them later.`}
          confirmLabel="Block User"
          danger
          onConfirm={() => blockUser(confirm.uid)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
