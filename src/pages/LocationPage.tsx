import { useEffect } from 'react';
import {
  MapPin, Navigation, Phone, MessageCircle, Clock, ArrowRight,
  Building2, Star, Car, ShieldCheck,
} from 'lucide-react';
import { SectionTitle, Card } from '@/components/ui/Primitives';
import { BUSINESS } from '@/lib/constants';
import { GALLERY_IMAGES } from '@/lib/images';
import { formatNaira } from '@/lib/utils';

interface LocationPageProps {
  onNavigate: (page: string) => void;
  whatsappNumber?: string | null;
}

export function LocationPage({ onNavigate, whatsappNumber }: LocationPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const mapQuery = encodeURIComponent(BUSINESS.address);
const mapEmbed = `https://www.google.com/maps?q=7.240774,5.2537973&z=17&output=embed`;
const mapLink  = `https://www.google.com/maps/search/?api=1&query=7.240774,5.2537973`;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : null;

  const landmarks = [
    { name: 'Akure City Centre', time: '10 min' },
    { name: 'Ondo State Government House', time: '8 min' },
    { name: 'MKO Abiola Shopping Complex', time: '12 min' },
    { name: 'Federal University of Technology (FUTA)', time: '25 min' },
    { name: 'Akure Airport', time: '30 min' },
  ];

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="relative h-72 overflow-hidden md:h-80">
        <img
          src={GALLERY_IMAGES.exterior}
          alt="DEESHADES APARTMENT exterior"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink-950/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-4 text-center">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Location</h1>
            <p className="mt-2 text-ink-200">Alagbaka Extension · Akure, Ondo State</p>
          </div>
        </div>
      </section>

      {/* Address + details */}
      <section className="section-padding bg-white">
        <div className="container-wide grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionTitle
              eyebrow="Getting Here"
              title="In the heart of Alagbaka Extension"
              subtitle="A serene and secure neighbourhood in Akure with easy access to the city centre, government district and major roads."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                <div>
                  <p className="text-sm font-medium text-ink-900">Property Address</p>
                  <p className="mt-0.5 text-sm text-ink-500">{BUSINESS.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                <div>
                  <p className="text-sm font-medium text-ink-900">Check-in / Check-out</p>
                  <p className="mt-0.5 text-sm text-ink-500">3:00 PM / 11:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-4">
                <Car className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                <div>
                  <p className="text-sm font-medium text-ink-900">Parking</p>
                  <p className="mt-0.5 text-sm text-ink-500">On-site, secure compound</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-ink-100 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                <div>
                  <p className="text-sm font-medium text-ink-900">Security</p>
                  <p className="mt-0.5 text-sm text-ink-500">Gated, 24/7 CCTV monitored</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Navigation className="h-4 w-4" /> Get Directions
              </a>
              <button onClick={() => onNavigate('contact')} className="btn-secondary">
                Contact Us <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Nearby landmarks */}
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink-900">
              <Building2 className="h-5 w-5 text-gold-600" /> Nearby Landmarks
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-600">
              {landmarks.map((item, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <span className="text-ink-400">{item.time}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Map embed */}
      <section className="section-padding bg-cream-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Map"
            title="Find us on the map"
            subtitle="Tap the map to open turn-by-turn directions in Google Maps."
            center
          />
          <div className="mt-10 overflow-hidden rounded-2xl border border-ink-100 shadow-sm">
            <iframe
              title="DEESHADES APARTMENT location map"
              src={mapEmbed}
              className="h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Getting here */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Getting Here"
            title="Easy to reach by road or air"
            center
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Car, title: 'By Road', desc: 'Direct access from Oba Adesida Road and Oyemekun Road. Secure parking inside the compound.' },
              { icon: Navigation, title: 'By Taxi / Ride-hailing', desc: 'Uber, Bolt and local cabs drop off at the gate. Share the address with your driver for a smooth arrival.' },
              { icon: Star, title: 'From the Airport', desc: 'Akure Airport is roughly 30 minutes away. Arrangement for pickup can be made on request.' },
            ].map((item, i) => (
              <Card key={i} className="p-6">
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

      {/* WhatsApp CTA — mirrors HomePage */}
      <section className="bg-sage-700 py-12">
        <div className="container-wide flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-semibold text-white">Not sure how to get here?</h3>
            <p className="mt-2 text-sage-100">
              Message us on WhatsApp and we&apos;ll guide you or arrange pickup.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('booking')}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 active:scale-[0.98]"
            >
              Check Availability
            </button>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Price note */}
      <section className="bg-cream-100 py-10">
        <div className="container-wide text-center">
          <p className="text-sm text-ink-500">
            {formatNaira(BUSINESS.standardRate)} per night · Refundable caution fee {formatNaira(BUSINESS.cautionFee)}
          </p>
        </div>
      </section>
    </div>
  );
}