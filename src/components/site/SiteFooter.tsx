import { Building2, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { BUSINESS } from '@/lib/constants';

interface SiteFooterProps {
  onNavigate: (page: string) => void;
}

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'apartments', label: 'Apartments' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'booking', label: 'Booking' },
    { id: 'contact', label: 'Contact' },
    { id: 'lookup', label: 'Check My Booking' },
  ];

  return (
    <footer className="bg-ink-950 text-ink-200">
      <div className="container-wide py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-white">DEESHADES</p>
                <p className="text-[10px] uppercase tracking-widest text-gold-400">Apartment</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-400">
              Premium serviced two-bedroom apartments in Akure, Ondo State. Comfortable, secure, and thoughtfully equipped for your stay.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Navigate</h4>
            <ul className="mt-4 space-y-2">
              {navItems.map(item => (
                <li key={item.id}>
                  <button onClick={() => onNavigate(item.id)} className="text-sm text-ink-400 transition-colors hover:text-gold-400">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Policies</h4>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-ink-400">Maximum 4 overnight guests</li>
              <li className="text-sm text-ink-400">No smoking inside the apartment</li>
              <li className="text-sm text-ink-400">Refundable caution fee: ₦50,000</li>
              <li className="text-sm text-ink-400">Non-refundable after confirmation</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm text-ink-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                {BUSINESS.address}
              </li>
              <li className="flex items-center gap-2 text-sm text-ink-400">
                <Phone className="h-4 w-4 shrink-0 text-gold-500" />
                Configurable in admin settings
              </li>
              <li className="flex items-center gap-2 text-sm text-ink-400">
                <Mail className="h-4 w-4 shrink-0 text-gold-500" />
                Configurable in admin settings
              </li>
              <li className="flex items-center gap-2 text-sm text-ink-400">
                <MessageCircle className="h-4 w-4 shrink-0 text-gold-500" />
                WhatsApp support available
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-ink-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-ink-500">
              © {new Date().getFullYear()} DEESHADES APARTMENT. All rights reserved.
            </p>
            <button
              onClick={() => onNavigate('admin')}
              className="text-xs text-ink-600 transition-colors hover:text-gold-400"
            >
              Staff Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
