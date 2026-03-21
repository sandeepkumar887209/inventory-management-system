import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronDown, UserCog } from 'lucide-react';

interface HeaderProps {
  sidebarCollapsed: boolean;
  userName: string;   // ✅ now required
  userRole?: string;
  onLogout: () => void;
}

export function Header({ sidebarCollapsed, userName, userRole = 'User', onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [showUserMenu,      setShowUserMenu]      = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: '3 rentals expiring this week', time: '2h ago',  unread: true  },
    { id: 2, text: 'New customer registration',    time: '5h ago',  unread: true  },
    { id: 3, text: 'Low stock alert: Dell XPS 15', time: '1d ago',  unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-neutral-200 transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      <div className="h-full flex items-center justify-between px-6">

        {/* Left empty space (since search removed) */}
        <div></div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">
                <div className="px-4 py-2 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-neutral-50 cursor-pointer ${
                        notification.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm text-neutral-900">{notification.text}</p>
                      <p className="text-xs text-neutral-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-neutral-200">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-sm font-medium text-neutral-900">{userName}</div>
                <div className="text-xs text-neutral-500">{userRole}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">

                {/* User info */}
                <div className="px-4 py-2 border-b border-neutral-200">
                  <div className="font-medium text-neutral-900">{userName}</div>
                  <div className="text-sm text-neutral-500">{userRole}</div>
                </div>

                {/* Profile */}
                <button
                  onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">My Profile</span>
                </button>

                {/* Users & Roles */}
                <button
                  onClick={() => { navigate('/users'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                >
                  <UserCog className="w-4 h-4" />
                  <span className="text-sm">Users & Roles</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 text-neutral-700"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </button>

                <div className="border-t border-neutral-200 my-2"></div>

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}