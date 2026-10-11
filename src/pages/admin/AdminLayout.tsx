import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard, CalendarDays, CreditCard, Users, DollarSign,
  TrendingDown, BarChart3, Settings, ScrollText, LogOut, Menu, X,
  Building2, Bell, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/constants';
import { getInitials } from '@/lib/utils';

interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}

export function AdminLayout({ currentPage, onNavigate, children }: AdminLayoutProps) {
  const { profile, user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'payments', label: 'Payment Verification', icon: CreditCard },
    { id: 'calendar', label: 'Availability Calendar', icon: CalendarDays },
    { id: 'guests', label: 'Guests', icon: Users },
    { id: 'caution-fees', label: 'Caution Fees', icon: DollarSign },
    { id: 'lost-opportunities', label: 'Lost Opportunities', icon: TrendingDown },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Log', icon: ScrollText },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-100 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-600">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-serif text-sm font-semibold text-ink-900">DEESHADES</p>
            <p className="text-[9px] uppercase tracking-widest text-gold-600">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-gold-600 text-white'
                  : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white animate-slide-in">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-600">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <p className="font-serif text-sm font-semibold text-ink-900">DEESHADES</p>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-ink-400" /></button>
            </div>
            <nav className="p-3">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    currentPage === item.id ? 'bg-gold-600 text-white' : 'text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100 bg-white/95 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-ink-600 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-ink-500">Welcome back, {profile?.full_name || 'Admin'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-ink-400 hover:bg-ink-50">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-gold-500" />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-600 text-xs font-semibold text-white">
                  {getInitials(profile?.full_name || user?.email || 'A')}
                </div>
                <ChevronDown className="h-4 w-4 text-ink-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-ink-100 bg-white p-3 shadow-lg">
                  <p className="text-sm font-semibold text-ink-900">{profile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-ink-400">{user?.email}</p>
                  <div className="mt-2 rounded-lg bg-gold-50 px-3 py-1.5">
                    <p className="text-xs font-medium text-gold-700">{ROLE_LABELS[profile?.role || 'receptionist']}</p>
                  </div>
                  <button onClick={handleSignOut} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
