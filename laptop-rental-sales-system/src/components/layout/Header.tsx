import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, User, LogOut, Settings, ChevronDown,
  UserCog, Search, Zap, Clock, Package, CheckCheck, X, Activity
} from 'lucide-react';

interface HeaderProps {
  sidebarCollapsed: boolean;
  userName: string;
  userRole?: string;
  onLogout: () => void;
}

const notifications = [
  {
    id: 1,
    icon: <Zap size={13} />,
    iconColor: '#f59e0b',
    iconBg: '#fef3c7',
    text: '3 rentals expiring this week',
    sub: 'Requires your attention',
    time: '2h ago',
    unread: true,
  },
  {
    id: 2,
    icon: <User size={13} />,
    iconColor: '#3b82f6',
    iconBg: '#dbeafe',
    text: 'New customer registration',
    sub: 'Priya Sharma just signed up',
    time: '5h ago',
    unread: true,
  },
  {
    id: 3,
    icon: <Package size={13} />,
    iconColor: '#ef4444',
    iconBg: '#fee2e2',
    text: 'Low stock alert: Dell XPS 15',
    sub: 'Only 1 unit remaining',
    time: '1d ago',
    unread: false,
  },
];

export function Header({ sidebarCollapsed, userName, userRole = 'User', onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifs, setNotifs] = useState(notifications);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  const dismissNotif = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  // Extract real username from localStorage (stored during Login)
  const displayUserName = localStorage.getItem("username") || userName;
  const displayRole = displayUserName === "admin" ? "Administrator" : "User";

  const initials = displayUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        .lrs-header * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        .lrs-header {
          position: fixed;
          top: 0;
          right: 0;
          height: 58px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px 0 24px;
          z-index: 30;
          transition: left 0.3s ease;
        }

        .lrs-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lrs-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f4f4f5;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 6px 12px;
          transition: all 0.2s;
          cursor: text;
        }
        .lrs-search-wrap:focus-within {
          background: #fff;
          border-color: #e4e4e7;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
        .lrs-search-input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #18181b;
          width: 200px;
        }
        .lrs-search-input::placeholder { color: #a1a1aa; }

        .lrs-kbd {
          background: #e4e4e7;
          border-radius: 5px;
          padding: 1px 6px;
          font-size: 10px;
          color: #71717a;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .lrs-header-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Icon button */
        .lrs-icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #52525b;
          transition: background 0.15s, color 0.15s;
        }
        .lrs-icon-btn:hover { background: #f4f4f5; color: #18181b; }
        .lrs-icon-btn.active { background: #f4f4f5; color: #18181b; }

        .lrs-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }

        .lrs-divider {
          width: 1px;
          height: 22px;
          background: #e4e4e7;
          margin: 0 4px;
        }

        /* User button */
        .lrs-user-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 4px 10px 4px 4px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }
        .lrs-user-btn:hover, .lrs-user-btn.active { background: #f4f4f5; }

        .lrs-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }
        .lrs-user-info { text-align: left; }
        .lrs-user-name {
          font-size: 13px;
          font-weight: 600;
          color: #18181b;
          line-height: 1.2;
        }
        .lrs-user-role {
          font-size: 11px;
          color: #a1a1aa;
          line-height: 1.2;
        }

        /* Dropdown panel */
        .lrs-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: #fff;
          border: 1px solid #e4e4e7;
          border-radius: 14px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          z-index: 100;
          overflow: hidden;
          animation: lrs-pop 0.15s ease;
        }
        @keyframes lrs-pop {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Notification panel */
        .lrs-notif-panel { width: 340px; }

        .lrs-notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid #f4f4f5;
        }
        .lrs-notif-title {
          font-size: 13px;
          font-weight: 700;
          color: #18181b;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .lrs-notif-count {
          background: #3b82f6;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 99px;
          padding: 1px 6px;
        }
        .lrs-notif-mark-all {
          font-size: 11px;
          color: #3b82f6;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .lrs-notif-mark-all:hover { background: #eff6ff; }

        .lrs-notif-list { max-height: 280px; overflow-y: auto; }

        .lrs-notif-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          position: relative;
          transition: background 0.12s;
        }
        .lrs-notif-item:hover { background: #fafafa; }
        .lrs-notif-item.unread { background: #fafbff; }
        .lrs-notif-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #3b82f6;
          border-radius: 0 2px 2px 0;
        }

        .lrs-notif-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .lrs-notif-body { flex: 1; min-width: 0; }
        .lrs-notif-text {
          font-size: 12.5px;
          font-weight: 500;
          color: #18181b;
          line-height: 1.35;
        }
        .lrs-notif-sub {
          font-size: 11px;
          color: #a1a1aa;
          margin-top: 1px;
        }
        .lrs-notif-time {
          font-size: 10.5px;
          color: #d4d4d8;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .lrs-notif-dismiss {
          opacity: 0;
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          border: none;
          background: #f4f4f5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #71717a;
          transition: opacity 0.15s, background 0.15s;
        }
        .lrs-notif-item:hover .lrs-notif-dismiss { opacity: 1; }
        .lrs-notif-dismiss:hover { background: #e4e4e7; color: #3f3f46; }

        .lrs-notif-footer {
          padding: 10px 16px;
          border-top: 1px solid #f4f4f5;
          text-align: center;
        }
        .lrs-notif-footer button {
          font-size: 12px;
          color: #3b82f6;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px 12px;
          border-radius: 7px;
          transition: background 0.12s;
        }
        .lrs-notif-footer button:hover { background: #eff6ff; }

        .lrs-notif-empty {
          padding: 36px 20px;
          text-align: center;
          color: #a1a1aa;
          font-size: 13px;
        }

        /* User menu panel */
        .lrs-user-panel { width: 220px; padding: 6px; }

        .lrs-user-panel-header {
          padding: 10px 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .lrs-avatar-lg {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .lrs-panel-name {
          font-size: 14px;
          font-weight: 700;
          color: #18181b;
          line-height: 1.2;
        }
        .lrs-panel-role {
          font-size: 11px;
          color: #a1a1aa;
          margin-top: 1px;
        }

        .lrs-menu-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #3f3f46;
          text-align: left;
          transition: background 0.12s, color 0.12s;
        }
        .lrs-menu-item:hover { background: #f4f4f5; color: #18181b; }
        .lrs-menu-item.danger { color: #ef4444; }
        .lrs-menu-item.danger:hover { background: #fef2f2; color: #dc2626; }

        .lrs-menu-sep {
          height: 1px;
          background: #f4f4f5;
          margin: 5px 0;
        }

        @media (max-width: 640px) {
          .lrs-search-wrap { display: none; }
          .lrs-user-info { display: none; }
        }
      `}</style>

      <header
        className="lrs-header"
        style={{ left: sidebarCollapsed ? '80px' : '256px' }}
      >
        {/* Left */}
        <div className="lrs-header-left">
          <div className="lrs-search-wrap">
            <Search size={14} color="#a1a1aa" />
            <input
              className="lrs-search-input"
              placeholder="Search anything..."
            />
            <span className="lrs-kbd">⌘K</span>
          </div>
        </div>

        {/* Right */}
        <div className="lrs-header-right">

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className={`lrs-icon-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
              title="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="lrs-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="lrs-dropdown lrs-notif-panel">
                <div className="lrs-notif-header">
                  <span className="lrs-notif-title">
                    Notifications
                    {unreadCount > 0 && <span className="lrs-notif-count">{unreadCount}</span>}
                  </span>
                  {unreadCount > 0 && (
                    <button className="lrs-notif-mark-all" onClick={markAllRead}>
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="lrs-notif-list">
                  {notifs.length === 0 ? (
                    <div className="lrs-notif-empty">You're all caught up ✓</div>
                  ) : notifs.map(n => (
                    <div key={n.id} className={`lrs-notif-item ${n.unread ? 'unread' : ''}`}>
                      <div
                        className="lrs-notif-icon"
                        style={{ background: n.iconBg, color: n.iconColor }}
                      >
                        {n.icon}
                      </div>
                      <div className="lrs-notif-body">
                        <div className="lrs-notif-text">{n.text}</div>
                        <div className="lrs-notif-sub">{n.sub}</div>
                      </div>
                      <div className="lrs-notif-time">{n.time}</div>
                      <button className="lrs-notif-dismiss" onClick={(e) => dismissNotif(n.id, e)}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {notifs.length > 0 && (
                  <div className="lrs-notif-footer">
                    <button onClick={() => setShowNotifications(false)}>
                      View all notifications →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lrs-divider" />

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              className={`lrs-user-btn ${showUserMenu ? 'active' : ''}`}
              onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
            >
              <div className="lrs-avatar">{initials}</div>
              <div className="lrs-user-info">
                <div className="lrs-user-name">{displayUserName}</div>
                <div className="lrs-user-role">{displayRole}</div>
              </div>
              <ChevronDown
                size={14}
                color="#a1a1aa"
                style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {showUserMenu && (
              <div className="lrs-dropdown lrs-user-panel">
                <div className="lrs-user-panel-header">
                  <div className="lrs-avatar-lg">{initials}</div>
                  <div>
                    <div className="lrs-panel-name">{displayUserName}</div>
                    <div className="lrs-panel-role">{displayRole}</div>
                  </div>
                </div>

                <div className="lrs-menu-sep" />

                <button className="lrs-menu-item" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                  <User size={14} /> My Profile
                </button>
                <button className="lrs-menu-item" onClick={() => { navigate('/users'); setShowUserMenu(false); }}>
                  <UserCog size={14} /> Users & Roles
                </button>
                <button className="lrs-menu-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                  <Settings size={14} /> Settings
                </button>
                <button className="lrs-menu-item" onClick={() => { navigate('/activity-logs'); setShowUserMenu(false); }}>
                  <Activity size={14} /> Activity Logs
                </button>

                <div className="lrs-menu-sep" />

                <button className="lrs-menu-item danger" onClick={onLogout}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}