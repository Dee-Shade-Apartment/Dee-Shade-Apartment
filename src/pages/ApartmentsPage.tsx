import { useState, useEffect } from 'react';
import {
  Calendar, Users, Maximize, Home, CheckCircle2, X,
  ChevronLeft, ChevronRight, Search, BedDouble, Sofa,
  Utensils, Bath, Tv,
} from 'lucide-react';
import { SectionTitle, Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { AMENITIES, BUSINESS, HOUSE_RULES } from '@/lib/constants';
import { GALLERY_IMAGES } from '@/lib/images';
import { formatNaira, formatDate, todayISO, tomorrowISO, calculateNights } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { ApartmentUnit } from '@/lib/types';

interface ApartmentsPageProps {
  onNavigate: (page: string) => void;
  onSearch: (checkIn: string, checkOut: string, guests: number) => void;
}

type GalleryCategory = 'all' | 'living' | 'bedrooms' | 'kitchens' | 'bathrooms' | 'recreation';

export function ApartmentsPage({ onNavigate, onSearch }: ApartmentsPageProps) {
  const [units, setUnits] = useState<ApartmentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [category, setCategory] = useState<GalleryCategory>('all');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [searchError, setSearchError] = useState('');

  const galleryByCategory: Record<GalleryCategory, { url: string; alt: string }[]> = {
    all: [
      ...GALLERY_IMAGES.livingRoom.map(u => ({ url: u, alt: 'Living Room' })),
      ...GALLERY_IMAGES.bedrooms.map(u => ({ url: u, alt: 'Bedroom' })),
      ...GALLERY_IMAGES.kitchens.map(u => ({ url: u, alt: 'Kitchen' })),
      ...GALLERY_IMAGES.bathrooms.map(u => ({ url: u, alt: 'Bathroom' })),
      ...GALLERY_IMAGES.recreation.map(u => ({ url: u, alt: 'Recreation' })),
    ],
    living: GALLERY_IMAGES.livingRoom.map(u => ({ url: u, alt: 'Living Room' })),
    bedrooms: GALLERY_IMAGES.bedrooms.map(u => ({ url: u, alt: 'Bedroom' })),
    kitchens: GALLERY_IMAGES.kitchens.map(u => ({ url: u, alt: 'Kitchen' })),
    bathrooms: GALLERY_IMAGES.bathrooms.map(u => ({ url: u, alt: 'Bathroom' })),
    recreation: GALLERY_IMAGES.recreation.map(u => ({ url: u, alt: 'Recreation' })),
  };

  const currentGallery = galleryByCategory[category];

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    setLoading(true);
    const { data } = await supabase.from('apartment_units').select('*').order('unit_number');
    if (data) setUnits(data);
    setLoading(false);
  };

  const nights = calculateNights(checkIn, checkOut);

  const handleSearch = () => {
    setSearchError('');
    if (!checkIn || !checkOut) { setSearchError('Please select check-in and check-out dates.'); return; }
    if (checkIn < todayISO()) { setSearchError('Check-in date cannot be in the past.'); return; }
    if (checkOut <= checkIn) { setSearchError('Check-out must be after check-in.'); return; }
    onSearch(checkIn, checkOut, guests);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightbox(currentGallery[index].url);
  };

  const nextImage = () => {
    const next = (lightboxIndex + 1) % currentGallery.length;
    setLightboxIndex(next);
    setLightbox(currentGallery[next].url);
  };

  const prevImage = () => {
    const prev = (lightboxIndex - 1 + currentGallery.length) % currentGallery.length;
    setLightboxIndex(prev);
    setLightbox(currentGallery[prev].url);
  };

  const categoryTabs: { id: GalleryCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All', icon: Home },
    { id: 'living', label: 'Living Room', icon: Sofa },
    { id: 'bedrooms', label: 'Bedrooms', icon: BedDouble },
    { id: 'kitchens', label: 'Kitchen', icon: Utensils },
    { id: 'bathrooms', label: 'Bathroom', icon: Bath },
    { id: 'recreation', label: 'Recreation', icon: Tv },
  ];

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="relative h-72 overflow-hidden md:h-80">
        <img src={GALLERY_IMAGES.hero} alt="Apartment" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink-950/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">The Apartment</h1>
            <p className="mt-2 text-ink-200">Two-bedroom serviced apartments · 5 units available</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionTitle
                eyebrow="Accommodation"
                title="Two-bedroom serviced apartments"
                subtitle="Each unit features a spacious living area, two bedrooms, a fully equipped kitchen, and modern bathroom facilities."
              />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-ink-100 p-4">
                  <BedDouble className="h-5 w-5 text-gold-600" />
                  <p className="mt-2 text-sm font-medium text-ink-900">2 Bedrooms</p>
                </div>
                <div className="rounded-xl border border-ink-100 p-4">
                  <Users className="h-5 w-5 text-gold-600" />
                  <p className="mt-2 text-sm font-medium text-ink-900">Max 4 Guests</p>
                </div>
                <div className="rounded-xl border border-ink-100 p-4">
                  <Maximize className="h-5 w-5 text-gold-600" />
                  <p className="mt-2 text-sm font-medium text-ink-900">Spacious Layout</p>
                </div>
                <div className="rounded-xl border border-ink-100 p-4">
                  <Calendar className="h-5 w-5 text-gold-600" />
                  <p className="mt-2 text-sm font-medium text-ink-900">{formatNaira(BUSINESS.standardRate)}/night</p>
                </div>
              </div>
            </div>

            {/* Availability Widget */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink-900">Check Availability</h3>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label-text">Check-in</label>
                    <input type="date" min={todayISO()} value={checkIn} onChange={e => setCheckIn(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label-text">Check-out</label>
                    <input type="date" min={checkIn || tomorrowISO()} value={checkOut} onChange={e => setCheckOut(e.target.value)} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="label-text">Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="input-field">
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                  </select>
                </div>
                {nights > 0 && (
                  <p className="text-sm text-ink-500">
                    {nights} {nights === 1 ? 'night' : 'nights'} · {formatNaira(nights * BUSINESS.standardRate)} + {formatNaira(BUSINESS.cautionFee)} caution fee
                  </p>
                )}
                {searchError && <p className="text-sm text-red-600">{searchError}</p>}
                <button onClick={handleSearch} className="btn-primary w-full">
                  <Search className="h-4 w-4" /> Check Availability
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section-padding bg-cream-100">
        <div className="container-wide">
          <SectionTitle eyebrow="Gallery" title="Explore the spaces" center />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categoryTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  category === tab.id ? 'bg-gold-600 text-white' : 'bg-white text-ink-600 hover:bg-ink-50'
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentGallery.map((img, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className="group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  loading="lazy"
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-3 left-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {img.alt}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle eyebrow="Amenities" title="Everything included" center />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AMENITIES.map((amenity, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-cream-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-gold-600" />
                <span className="text-sm font-medium text-ink-700">{amenity.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="section-padding bg-cream-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Our Units"
            title="Five independently managed apartments"
            subtitle="All units are similar two-bedroom apartments, tracked separately for availability and assignment."
          />
          {loading ? (
            <LoadingSpinner label="Loading units..." />
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {units.map(unit => (
                <Card key={unit.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-lg font-semibold text-ink-900">{unit.unit_label}</p>
                    <Badge status={unit.status === 'active' ? 'CONFIRMED' : 'EXPIRED'} label={unit.status === 'active' ? 'Available' : unit.status === 'maintenance' ? 'Maintenance' : 'Inactive'} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-ink-500">
                    <p>2 Bedroom · 4 Guests</p>
                    <p className="font-medium text-ink-700">{formatNaira(BUSINESS.standardRate)}/night</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* House Rules */}
      <section className="section-padding bg-white">
        <div className="container-wide max-w-3xl">
          <SectionTitle eyebrow="House Rules" title="Please review before booking" center />
          <Card className="mt-8 p-6">
            <ul className="space-y-3">
              {HOUSE_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                  {rule}
                </li>
              ))}
            </ul>
          </Card>
          <div className="mt-6 text-center">
            <button onClick={() => onNavigate('booking')} className="btn-primary">
              <Search className="h-4 w-4" /> Check Availability
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4 animate-fade-in" onClick={() => setLightbox(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightbox(null); }} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-8 w-8" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 text-white/70 hover:text-white">
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img src={lightbox} alt="Gallery" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 text-white/70 hover:text-white">
            <ChevronRight className="h-10 w-10" />
          </button>
        </div>
      )}
    </div>
  );
}
