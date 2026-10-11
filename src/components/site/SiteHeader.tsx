import { useState, useEffect } from 'react';
import { Building2, Menu, X } from 'lucide-react';

interface SiteHeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function SiteHeader({ onNavigate, currentPage }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'apartments', label: 'Apartments' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'location', label: 'Location' },
    { id: 'booking', label: 'Booking' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 z-40 w-full transition-all duration-300 ${
      scrolled ? 'bg-cream-50/95 shadow-sm backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="container-wide flex h-16 items-center justify-between md:h-20">
        <button onClick={() => handleNav('home')} className="flex items-center gap-2.5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${scrolled ? 'bg-gold-600' : 'bg-white/15 backdrop-blur'}`}>
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className={`font-serif text-lg font-semibold leading-tight ${scrolled ? 'text-ink-900' : 'text-white'}`}>
              DEESHADES
            </p>
            <p className={`text-[10px] uppercase tracking-widest ${scrolled ? 'text-gold-600' : 'text-white/70'}`}>
              Apartment
            </p>
          </div>
        </button>

        
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? scrolled ? 'bg-gold-50 text-gold-700' : 'bg-white/15 text-white'
                  : scrolled ? 'text-ink-600 hover:bg-ink-50 hover:text-ink-900' : 'text-white/80 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button onClick={() => handleNav('booking')} className="btn-primary ml-2">
            Check Availability
          </button>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`rounded-lg p-2 md:hidden ${scrolled ? 'text-ink-900' : 'text-white'}`}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-ink-100 bg-white md:hidden">
          <nav className="container-wide flex flex-col gap-1 py-4">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`rounded-lg px-4 py-3 text-left text-sm font-medium ${
                  currentPage === item.id ? 'bg-gold-50 text-gold-700' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button onClick={() => handleNav('booking')} className="btn-primary mt-2">
              Check Availability
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
