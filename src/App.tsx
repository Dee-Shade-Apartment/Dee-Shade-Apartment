import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ToastContainer } from '@/components/ui/Toast';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { HomePage } from '@/pages/HomePage';
import { ApartmentsPage } from '@/pages/ApartmentsPage';
import { AmenitiesPage } from '@/pages/AmenitiesPage';
import { LocationPage } from '@/pages/LocationPage';
import { ContactPage } from '@/pages/ContactPage';
import { BookingPage } from '@/pages/BookingPage';
import { BookingLookupPage } from '@/pages/BookingLookupPage';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { DashboardOverview } from '@/pages/admin/DashboardOverview';
import { AdminBookings } from '@/pages/admin/AdminBookings';
import { AdminPaymentQueue } from '@/pages/admin/AdminPaymentQueue';
import { AdminCalendar } from '@/pages/admin/AdminCalendar';
import { AdminGuests } from '@/pages/admin/AdminGuests';
import { AdminCautionFees } from '@/pages/admin/AdminCautionFees';
import { AdminLostOpportunities } from '@/pages/admin/AdminLostOpportunities';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminAuditLog } from '@/pages/admin/AdminAuditLog';
import type { Property, PropertySettings } from '@/lib/types';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [page, setPage] = useState('home');
  const [bookingDates, setBookingDates] = useState<{ checkIn: string; checkOut: string; guests: number }>({ checkIn: '', checkOut: '', guests: 2 });
  const [property, setProperty] = useState<Property | null>(null);
  const [settings, setSettings] = useState<PropertySettings | null>(null);

  useEffect(() => {
    loadPropertyData();
  }, []);

  const loadPropertyData = async () => {
    const { data: prop } = await supabase.from('properties').select('*').limit(1).maybeSingle();
    if (prop) setProperty(prop as Property);
    const { data: sett } = await supabase.from('property_settings').select('*').limit(1).maybeSingle();
    if (sett) setSettings(sett as PropertySettings);
  };

  const navigate = (newPage: string) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleSearch = (checkIn: string, checkOut: string, guests: number) => {
    setBookingDates({ checkIn, checkOut, guests });
    navigate('booking');
  };

  // Admin pages
  const adminPages = ['dashboard', 'bookings', 'payments', 'calendar', 'guests', 'caution-fees', 'lost-opportunities', 'reports', 'settings', 'audit'];
  const isAdminPage = adminPages.includes(page) || page === 'admin';

  // Show admin login if trying to access admin without session
  if (isAdminPage) {
    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950">
          <div className="animate-spin rounded-full border-2 border-ink-700 border-t-gold-600 h-8 w-8" />
        </div>
      );
    }
    if (!session) {
      return <AdminLogin onBack={() => navigate('home')} />;
    }
    if (!profile) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 text-white">
          <div className="text-center">
            <p className="text-sm text-ink-300">Setting up your profile...</p>
          </div>
        </div>
      );
    }

    const adminPageMap: Record<string, React.ReactNode> = {
      dashboard: <DashboardOverview onNavigate={navigate} />,
      bookings: <AdminBookings />,
      payments: <AdminPaymentQueue />,
      calendar: <AdminCalendar />,
      guests: <AdminGuests />,
      'caution-fees': <AdminCautionFees />,
      'lost-opportunities': <AdminLostOpportunities />,
      reports: <AdminReports />,
      settings: <AdminSettings />,
      audit: <AdminAuditLog />,
    };

    return (
      <AdminLayout currentPage={page === 'admin' ? 'dashboard' : page} onNavigate={navigate}>
        {adminPageMap[page] || <DashboardOverview onNavigate={navigate} />}
      </AdminLayout>
    );
  }

  // Customer-facing pages
  const showHeaderFooter = true;

  return (
    <div className="min-h-screen bg-cream-50">
      {showHeaderFooter && <SiteHeader onNavigate={navigate} currentPage={page} />}
      <main>
        {page === 'home' && <HomePage onNavigate={navigate} onSearch={handleSearch} />}
        {page === 'apartments' && <ApartmentsPage onNavigate={navigate} onSearch={handleSearch} />}
        {page === 'amenities' && <AmenitiesPage onNavigate={navigate} />} 
        {page === 'location' && <LocationPage onNavigate={navigate} />}  
        {page === 'contact' && <ContactPage property={property} whatsappNumber={property?.whatsapp_number || null} />}
        {page === 'booking' && (
          <BookingPage
            initialCheckIn={bookingDates.checkIn}
            initialCheckOut={bookingDates.checkOut}
            initialGuests={bookingDates.guests}
            property={property}
            settings={settings}
          />
        )}
        {page === 'lookup' && <BookingLookupPage />}
      </main>
      {showHeaderFooter && <SiteFooter onNavigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer />
    </AuthProvider>
  );
}
