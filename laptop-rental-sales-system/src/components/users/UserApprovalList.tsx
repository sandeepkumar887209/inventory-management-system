import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, UserCheck, RefreshCw, Filter } from 'lucide-react';
import { getUsersApi, approveUserApi, rejectUserApi } from '../../services/auth';

/* ── Design tokens matching the ERP theme ── */
const T = {
  bg:      '#f8f7f5',
  surface: '#ffffff',
  border:  '#e8e6e1',
  text:    '#1a1a1a',
  muted:   '#6b6b6b',
  primary: '#1a6ef5',
  green:   { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  red:     { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  orange:  { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' },
  blue:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  radius:  '10px',
  radiusSm:'6px',
  shadow:  '0 1px 4px rgba(0,0,0,0.06)',
};

interface PendingUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role_title: string;
  department: string;
  company: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface UserApprovalListProps {
  onRefresh?: () => void;
}

export function UserApprovalList({ onRefresh }: UserApprovalListProps) {
  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'rejected'>('pending');
  const [users, setUsers]             = useState<PendingUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsersApi();
      const nonApproved = data.filter((u: any) => u.approval_status !== 'approved');
      setUsers(nonApproved);
    } catch (err) {
      console.error('Failed to load pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: PendingUser) => {
    try {
      setActionLoading(user.id);
      await approveUserApi(user.id, {
        role_title:  user.role_title,
        department:  user.department,
      });
      showToast(`${user.full_name || user.username} approved successfully`);
      await loadUsers();
      onRefresh?.();
    } catch (err) {
      showToast('Failed to approve user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (user: PendingUser) => {
    if (!confirm(`Reject ${user.full_name || user.username}'s request?`)) return;
    try {
      setActionLoading(user.id);
      await rejectUserApi(user.id);
      showToast(`${user.full_name || user.username} rejected`);
      await loadUsers();
      onRefresh?.();
    } catch (err) {
      showToast('Failed to reject user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (user.full_name || '').toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || user.approval_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount  = users.filter(u => u.approval_status === 'pending').length;
  const rejectedCount = users.filter(u => u.approval_status === 'rejected').length;

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const StatusPill = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending:  { bg: T.orange.bg,  color: T.orange.text, label: 'Pending'  },
      approved: { bg: T.green.bg,   color: T.green.text,  label: 'Approved' },
      rejected: { bg: T.red.bg,     color: T.red.text,    label: 'Rejected' },
    };
    const s = map[status] ?? { bg: '#f3f4f6', color: '#6b7280', label: status };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '99px',
        background: s.bg, color: s.color,
        fontSize: '12px', fontWeight: 600,
      }}>
        {status === 'pending'  && <Clock size={11} />}
        {status === 'approved' && <CheckCircle size={11} />}
        {status === 'rejected' && <XCircle size={11} />}
        {s.label}
      </span>
    );
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>
        <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: '14px' }}>Loading approval requests…</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          padding: '12px 20px', borderRadius: T.radius,
          background: toast.type === 'success' ? T.green.bg : T.red.bg,
          border: `1px solid ${toast.type === 'success' ? T.green.border : T.red.border}`,
          color: toast.type === 'success' ? T.green.text : T.red.text,
          fontSize: '13px', fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>

        {/* Pending card */}
        <div
          onClick={() => setStatusFilter('pending')}
          style={{
            background: statusFilter === 'pending' ? T.orange.bg : T.surface,
            border: `1px solid ${statusFilter === 'pending' ? T.orange.border : T.border}`,
            borderRadius: T.radius, padding: '16px',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: T.shadow,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={18} color={T.orange.text} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: T.text, lineHeight: 1 }}>{pendingCount}</div>
              <div style={{ fontSize: '12px', color: T.muted, marginTop: '3px' }}>Pending Approval</div>
            </div>
          </div>
        </div>

        {/* Rejected card */}
        <div
          onClick={() => setStatusFilter('rejected')}
          style={{
            background: statusFilter === 'rejected' ? T.red.bg : T.surface,
            border: `1px solid ${statusFilter === 'rejected' ? T.red.border : T.border}`,
            borderRadius: T.radius, padding: '16px',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: T.shadow,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={18} color={T.red.text} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: T.text, lineHeight: 1 }}>{rejectedCount}</div>
              <div style={{ fontSize: '12px', color: T.muted, marginTop: '3px' }}>Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius, padding: '12px 16px',
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
        marginBottom: '16px', boxShadow: T.shadow,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
          <input
            type="text"
            placeholder="Search by name, email or username…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
              fontSize: '13px', color: T.text, outline: 'none',
              background: T.bg, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative', flex: '0 0 160px' }}>
          <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              width: '100%', padding: '8px 12px 8px 30px',
              border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
              fontSize: '13px', color: T.text, background: T.bg,
              outline: 'none', cursor: 'pointer', appearance: 'none',
            }}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={loadUsers}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: T.radiusSm,
            border: `1px solid ${T.border}`, background: T.surface,
            cursor: 'pointer', fontSize: '13px', color: T.muted,
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow,
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {['User Details', 'Company / Dept', 'Requested Role', 'Request Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600, color: T.muted,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '56px', textAlign: 'center', color: '#c0bbb5' }}>
                    <UserCheck size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                    <div style={{ fontSize: '14px' }}>No approval requests found</div>
                    {pendingCount === 0 && rejectedCount === 0 && (
                      <div style={{ fontSize: '12px', marginTop: '6px', color: T.muted }}>
                        All users are approved ✓
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isLoading = actionLoading === user.id;
                  return (
                    <tr
                      key={user.id}
                      style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = T.bg}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      {/* User Details */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: T.blue.bg, border: `1px solid ${T.blue.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700, color: T.blue.text, flexShrink: 0,
                          }}>
                            {(user.full_name || user.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: T.text }}>{user.full_name || user.username}</div>
                            <div style={{ fontSize: '12px', color: T.muted, marginTop: '1px' }}>{user.email}</div>
                            <div style={{ fontSize: '11px', color: '#c0bbb5', marginTop: '1px', fontFamily: 'monospace' }}>@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Company / Dept */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 500, color: T.text }}>{user.company || '—'}</div>
                        {user.department && (
                          <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>{user.department}</div>
                        )}
                      </td>

                      {/* Requested Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                          background: T.blue.bg, color: T.blue.text,
                          fontSize: '12px', fontWeight: 600, border: `1px solid ${T.blue.border}`,
                        }}>
                          {user.role_title || 'Staff'}
                        </span>
                      </td>

                      {/* Request Date */}
                      <td style={{ padding: '14px 16px', color: T.muted, fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDate(user.created_at)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <StatusPill status={user.approval_status} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {/* Approve button: always show for pending, also show for rejected */}
                          {(user.approval_status === 'pending' || user.approval_status === 'rejected') && (
                            <button
                              onClick={() => handleApprove(user)}
                              disabled={isLoading}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '6px 14px', borderRadius: T.radiusSm,
                                background: isLoading ? '#bbf7d0' : '#16a34a',
                                color: '#fff', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '12px', fontWeight: 600, transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#15803d'; }}
                              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#16a34a'; }}
                            >
                              <CheckCircle size={13} />
                              {isLoading ? 'Approving…' : 'Approve'}
                            </button>
                          )}

                          {/* Reject button: only for pending */}
                          {user.approval_status === 'pending' && (
                            <button
                              onClick={() => handleReject(user)}
                              disabled={isLoading}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '6px 14px', borderRadius: T.radiusSm,
                                background: 'transparent',
                                color: T.red.text,
                                border: `1px solid ${T.red.border}`,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.background = T.red.bg; } }}
                              onMouseLeave={e => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; } }}
                            >
                              <XCircle size={13} />
                              Reject
                            </button>
                          )}

                          {/* No actions for already-rejected (just approve is shown above) */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {filteredUsers.length > 0 && (
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${T.border}`,
            fontSize: '12px', color: T.muted, background: T.bg,
          }}>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> request{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
