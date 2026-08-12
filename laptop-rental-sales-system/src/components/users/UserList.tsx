import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Key, Mail, Phone, Shield, RefreshCw, Filter } from 'lucide-react';
import { UserApprovalList } from './UserApprovalList';
import { getUsersApi, deleteUserApi } from '../../services/auth';

/* ── Design tokens matching ERP theme ── */
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

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role_title: string;
  approval_status: string;
  is_active: boolean;
  department: string;
  company: string;
  date_joined: string;
  last_login: string | null;
}

interface UserListProps {
  onAddNew: () => void;
  onEdit: (user: any) => void;
  onManagePermissions: (user: any) => void;
}

export const UserList: React.FC<UserListProps> = ({ onAddNew, onEdit, onManagePermissions }) => {
  const [searchQuery, setSearchQuery]   = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab]       = useState<'users' | 'approvals'>('users');
  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshKey, setRefreshKey]     = useState(0);

  useEffect(() => { loadUsers(); }, [refreshKey]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsersApi();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => setRefreshKey(k => k + 1);

  const approvedUsers = users.filter(u => u.approval_status === 'approved');

  const filteredUsers = approvedUsers.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      user.full_name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q);
    const matchesRole   = roleFilter === 'all' || user.role_title === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'Active' && user.is_active) ||
      (statusFilter === 'Inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount  = users.filter(u => u.approval_status === 'pending').length;
  const totalUsers    = approvedUsers.length;
  const activeUsers   = approvedUsers.filter(u => u.is_active).length;
  const inactiveUsers = approvedUsers.filter(u => !u.is_active).length;

  const roles = Array.from(new Set(approvedUsers.map(u => u.role_title).filter(Boolean)));

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user: ${user.full_name || user.username}?`)) return;
    try {
      await deleteUserApi(user.id);
      refresh();
    } catch {
      alert('Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    if (role === 'Admin') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    if (role?.includes('Manager')) return { bg: T.blue.bg, color: T.blue.text, border: T.blue.border };
    return { bg: T.bg, color: T.muted, border: T.border };
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>User Management</h1>
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>
          <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: '14px' }}>Loading users…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: T.text, margin: 0 }}>User Management</h1>
          <p style={{ fontSize: '13px', color: T.muted, marginTop: '4px' }}>Manage system users and their access permissions</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={refresh}
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
          <button
            onClick={onAddNew}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: T.radiusSm,
              background: T.primary, color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Add New User
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Users',      value: totalUsers,    color: T.primary,       icon: <Shield size={16} color={T.primary} /> },
          { label: 'Active Users',     value: activeUsers,   color: T.green.text,    icon: <Shield size={16} color={T.green.text} /> },
          { label: 'Inactive Users',   value: inactiveUsers, color: T.muted,         icon: <Shield size={16} color={T.muted} /> },
          { label: 'Pending Approval', value: pendingCount,  color: T.orange.text,   icon: <Shield size={16} color={T.orange.text} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.radius, padding: '16px', boxShadow: T.shadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: T.muted }}>{label}</span>
              {icon}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Tab container ── */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow,
      }}>
        {/* Tab nav */}
        <div style={{ borderBottom: `1px solid ${T.border}`, display: 'flex', padding: '0 20px', background: T.bg }}>
          {([
            { id: 'users', label: 'Active Users', badge: null },
            { id: 'approvals', label: 'Pending Approvals', badge: pendingCount > 0 ? pendingCount : null },
          ] as const).map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '13px 16px', border: 'none', background: 'transparent',
                  borderBottom: active ? `2px solid ${T.primary}` : '2px solid transparent',
                  color: active ? T.primary : T.muted,
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
                  marginBottom: '-1px', transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {tab.badge && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px',
                    background: T.orange.bg, color: T.orange.text,
                    fontSize: '11px', fontWeight: 700,
                    border: `1px solid ${T.orange.border}`,
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'users' ? (
            <>
              {/* ── Filters ── */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px 8px 32px',
                      border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                      fontSize: '13px', color: T.text, outline: 'none',
                      background: T.bg, boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Role filter */}
                <div style={{ position: 'relative', flex: '0 0 160px' }}>
                  <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px 8px 30px',
                      border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                      fontSize: '13px', color: T.text, background: T.bg,
                      outline: 'none', cursor: 'pointer', appearance: 'none',
                    }}
                  >
                    <option value="all">All Roles</option>
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>

                {/* Status filter */}
                <div style={{ position: 'relative', flex: '0 0 150px' }}>
                  <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px 8px 30px',
                      border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                      fontSize: '13px', color: T.text, background: T.bg,
                      outline: 'none', cursor: 'pointer', appearance: 'none',
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ── Table ── */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {['User', 'Contact', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
                        <th key={h} style={{
                          padding: '9px 14px', textAlign: 'left',
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
                        <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#c0bbb5', fontSize: '13px' }}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const roleStyle = getRoleColor(user.role_title);
                        return (
                          <tr
                            key={user.id}
                            style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = T.bg}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                          >
                            {/* User */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '34px', height: '34px', borderRadius: '50%',
                                  background: T.blue.bg, display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                                  color: T.blue.text, flexShrink: 0,
                                }}>
                                  {(user.full_name || user.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: T.text }}>{user.full_name || user.username}</div>
                                  <div style={{ fontSize: '11px', color: T.muted, fontFamily: 'monospace' }}>@{user.username}</div>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: T.muted, fontSize: '12px' }}>
                                <Mail size={12} /> {user.email}
                              </div>
                              {user.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: T.muted, fontSize: '12px', marginTop: '3px' }}>
                                  <Phone size={12} /> {user.phone}
                                </div>
                              )}
                            </td>

                            {/* Role */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                                background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`,
                                fontSize: '12px', fontWeight: 600,
                              }}>
                                {user.role_title || 'Staff'}
                              </span>
                            </td>

                            {/* Department */}
                            <td style={{ padding: '12px 14px', color: T.muted, fontSize: '13px' }}>
                              {user.department || '—'}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                                background: user.is_active ? T.green.bg : T.bg,
                                color: user.is_active ? T.green.text : T.muted,
                                border: `1px solid ${user.is_active ? T.green.border : T.border}`,
                              }}>
                                <span style={{
                                  width: '6px', height: '6px', borderRadius: '50%',
                                  background: user.is_active ? T.green.text : T.muted,
                                  display: 'inline-block',
                                }} />
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            {/* Last Login */}
                            <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                              {user.last_login ? (
                                <>
                                  <div style={{ color: T.text, fontSize: '12px' }}>
                                    {new Date(user.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                  <div style={{ color: T.muted, fontSize: '11px' }}>
                                    {new Date(user.last_login).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </>
                              ) : (
                                <span style={{ color: '#c0bbb5', fontSize: '12px' }}>Never</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <ActionBtn title="Edit User" color={T.primary} bg={T.blue.bg} onClick={() => onEdit(user)}>
                                  <Edit size={14} />
                                </ActionBtn>
                                <ActionBtn title="Manage Permissions" color="#7c3aed" bg="#f5f3ff" onClick={() => onManagePermissions(user)}>
                                  <Shield size={14} />
                                </ActionBtn>
                                <ActionBtn title="Reset Password" color={T.orange.text} bg={T.orange.bg} onClick={() => alert('Password reset email sent!')}>
                                  <Key size={14} />
                                </ActionBtn>
                                <ActionBtn title="Delete User" color={T.red.text} bg={T.red.bg} onClick={() => handleDelete(user)}>
                                  <Trash2 size={14} />
                                </ActionBtn>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '12px', fontSize: '12px', color: T.muted, paddingTop: '12px', borderTop: `1px solid ${T.border}` }}>
                Showing <strong>{filteredUsers.length}</strong> of <strong>{approvedUsers.length}</strong> users
              </div>
            </>
          ) : (
            <UserApprovalList onRefresh={refresh} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Small icon button helper ── */
function ActionBtn({ children, title, color, bg, onClick }: {
  children: React.ReactNode;
  title: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: '30px', height: '30px', borderRadius: '6px',
        background: 'transparent', border: `1px solid transparent`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = bg;
        (e.currentTarget as HTMLButtonElement).style.borderColor = color + '33';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}