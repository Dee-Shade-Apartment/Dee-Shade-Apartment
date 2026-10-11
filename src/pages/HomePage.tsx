import { useState } from 'react';
import {
  Calendar, Users, Search, Zap, Wifi, Tv, Utensils, ShieldCheck,
  Car, Wind, Refrigerator, Play, MonitorPlay, Plug, Circle,
  Table, Trees, ChevronDown, MapPin, MessageCircle, Star,
  ArrowRight, Clock,
} from 'lucide-react';
import { SectionTitle, Card } from '@/components/ui/Primitives';
import { AMENITIES, FAQS, HOUSE_RULES, BUSINESS } from '@/lib/constants';
import { GALLERY_IMAGES } from '@/lib/images';
import { formatNaira, todayISO, tomorrowISO, calculateNights } from '@/lib/utils';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onSearch: (checkIn: string, checkOut: string, guests: number) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Plug, Circle, Table, Utensils, Wind, Refrigerator, Tv, Play,
  MonitorPlay, Wifi, ShieldCheck, Trees, Car,
};

export function HomePage({ onNavigate, onSearch }: HomePageProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchError, setSearchError] = useState('');

  const nights = calculateNights(checkIn, checkOut);

  const handleSearch = () => {
    setSearchError('');
    if (!checkIn || !checkOut) {
      setSearchError('Please select check-in and check-out dates.');
      return;
    }
    if (checkIn < todayISO()) {
      setSearchError('Check-in date cannot be in the past.');
      return;
    }
    if (checkOut <= checkIn) {
      setSearchError('Check-out must be after check-in.');
      return;
    }
    onSearch(checkIn, checkOut, guests);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={GALLERY_IMAGES.hero}
            alt="DEESHADES APARTMENT luxury living room"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/50 to-ink-950/80" />
        </div>

        <div className="container-wide relative z-10 pt-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-gold-400 animate-fade-in">
              Premium Serviced Apartments · Akure
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl text-balance animate-fade-in-up">
              Your comfortable, secure and premium stay in Akure
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-200 animate-fade-in-up">
              Two-bedroom apartments with 24/7 electricity, Starlink Wi-Fi, fully equipped kitchens and modern amenities in the serene Alagbaka Extension.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up">
              <button onClick={() => onNavigate('booking')} className="btn-primary">
                <Search className="h-4 w-4" /> Check Availability
              </button>
              <button onClick={() => onNavigate('apartments')} className="btn-secondary border-white/30 text-white hover:bg-white/10">
                Explore the Apartment
              </button>
            </div>
          </div>

          {/* Quick Search Widget */}
          <div className="mt-12 max-w-4xl rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md sm:p-6 animate-fade-in-up">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gold-600" /> Check-in
                </label>
                <input
                  type="date"
                  min={todayISO()}
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gold-600" /> Check-out
                </label>
                <input
                  type="date"
                  min={checkIn || tomorrowISO()}
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gold-600" /> Guests
                </label>
                <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="input-field">
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleSearch} className="btn-primary w-full">
                  <Search className="h-4 w-4" /> Search
                </button>
              </div>
            </div>
            {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
            {nights > 0 && (
              <p className="mt-3 text-sm text-ink-500">
                {nights} {nights === 1 ? 'night' : 'nights'} · {formatNaira(nights * BUSINESS.standardRate)} accommodation + {formatNaira(BUSINESS.cautionFee)} caution fee
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section-padding bg-cream-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Why Stay With Us"
            title="Everything you need for a refined stay"
            subtitle="Each apartment is thoughtfully equipped with premium amenities and round-the-clock utilities."
            center
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: '24/7 Electricity', desc: 'Uninterrupted power supply with standby generator backup.' },
              { icon: Wifi, title: 'Starlink Wi-Fi', desc: 'High-speed satellite internet for work and streaming.' },
              { icon: ShieldCheck, title: 'Security & CCTV', desc: 'Serene, secure environment with round-the-clock monitoring.' },
              { icon: Utensils, title: 'Fully Equipped Kitchen', desc: 'Cook with ease using modern appliances and cookware.' },
            ].map((item, i) => (
              <Card key={i} className="p-6 transition-all hover:shadow-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50">
                  <item.icon className="h-6 w-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Amenities & Features"
            title="Premium facilities in every apartment"
            center
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AMENITIES.map((amenity, i) => {
              const Icon = iconMap[amenity.icon] || Star;
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-cream-50 px-4 py-3 transition-all hover:border-gold-200 hover:bg-gold-50">
                  <Icon className="h-5 w-5 shrink-0 text-gold-600" />
                  <span className="text-sm font-medium text-ink-700">{amenity.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="section-padding bg-cream-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Gallery"
            title="Step inside the apartment"
            subtitle="Preview the living spaces, bedrooms, kitchen and recreation areas."
            center
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY_IMAGES.livingRoom.slice(0, 3).map((img, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl">
                <img
                  src={img}
                  alt={`Apartment view ${i + 1}`}
                  loading="lazy"
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => onNavigate('apartments')} className="btn-secondary">
              View Full Gallery <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Pricing"
            title="Transparent rates, no hidden fees"
            center
          />
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="overflow-hidden">
                <div className="bg-ink-900 px-6 py-5">
                  <p className="text-sm font-medium uppercase tracking-wider text-gold-400">Standard Rate</p>
                  <p className="mt-2 text-3xl font-bold text-white">{formatNaira(BUSINESS.standardRate)}</p>
                  <p className="text-sm text-ink-300">per night</p>
                </div>
                <div className="px-6 py-5">
                  <ul className="space-y-2.5 text-sm text-ink-600">
                    <li className="flex items-center gap-2"><Star className="h-4 w-4 text-gold-500" /> Two-bedroom apartment</li>
                    <li className="flex items-center gap-2"><Star className="h-4 w-4 text-gold-500" /> Up to 4 overnight guests</li>
                    <li className="flex items-center gap-2"><Star className="h-4 w-4 text-gold-500" /> All amenities included</li>
                    <li className="flex items-center gap-2"><Star className="h-4 w-4 text-gold-500" /> Refundable caution fee: {formatNaira(BUSINESS.cautionFee)}</li>
                  </ul>
                </div>
              </Card>

              <Card className="overflow-hidden border-gold-200">
                <div className="bg-gold-600 px-6 py-5">
                  <p className="text-sm font-medium uppercase tracking-wider text-gold-100">Party Rate</p>
                  <p className="mt-2 text-3xl font-bold text-white">{formatNaira(BUSINESS.partyRate)}</p>
                  <p className="text-sm text-gold-100">configurable terms</p>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-ink-600">
                    The purpose, duration and eligibility of the party rate are configurable in admin settings. This rate is not applied automatically until management confirms the conditions are met.
                  </p>
                  <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <Clock className="mr-1 inline h-3 w-3" />
                    Rate conditions require management confirmation.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section id="location" className="section-padding bg-cream-100">
        <div className="container-wide">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionTitle
                eyebrow="Location"
                title="In the heart of Alagbaka Extension"
                subtitle="A serene and secure neighbourhood in Akure, Ondo State, with easy access to the city centre."
              />
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                <div>
                  <p className="text-sm font-medium text-ink-900">Property Address</p>
                  <p className="mt-1 text-sm text-ink-500">{BUSINESS.address}</p>
                </div>
              </div>
              <button onClick={() => onNavigate('contact')} className="btn-secondary mt-6">
                Get Directions <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl shadow-lg">
              <img
                src={GALLERY_IMAGES.exterior}
                alt="DEESHADES APARTMENT exterior"
                loading="lazy"
                className="h-80 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* House Rules & Policy */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-ink-900">House Rules</h3>
              <ul className="mt-4 space-y-3">
                {HOUSE_RULES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {rule}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-ink-900">Booking Policy</h3>
              <div className="mt-4 space-y-3 text-sm text-ink-600">
                <p>Reservations become confirmed only after management verifies the required bank transfer and approves the booking.</p>
                <p>Once a reservation is confirmed and payment has been verified, the stated policy is non-refundable, subject to applicable law and any mandatory consumer protections.</p>
                <p>The refundable caution fee of {formatNaira(BUSINESS.cautionFee)} is tracked separately from accommodation revenue and returned after checkout subject to inspection.</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-cream-100">
        <div className="container-wide">
          <SectionTitle eyebrow="FAQ" title="Frequently asked questions" center />
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {FAQS.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-ink-900">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-ink-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-ink-500 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-sage-700 py-12">
        <div className="container-wide flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-semibold text-white">Need help with your booking?</h3>
            <p className="mt-2 text-sage-100">Our team is available on WhatsApp to assist you.</p>
          </div>
          <button onClick={() => onNavigate('contact')} className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 active:scale-[0.98]">
            <MessageCircle className="h-4 w-4" /> Contact Us
          </button>
        </div>
      </section>
    </div>
  );
}
