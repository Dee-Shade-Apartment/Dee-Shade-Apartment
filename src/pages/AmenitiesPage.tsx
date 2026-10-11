import { useEffect, useMemo } from 'react';
import {
  CheckCircle2, ArrowRight, Wifi, Tv, Wind, Utensils, Bath, BedDouble,
  Car, Zap, ShieldCheck, Dumbbell, Coffee, Droplets, Flame, Sparkles,
  Clock, Key, Users, Home, Waves, Shirt, type LucideIcon,
} from 'lucide-react';
import { SectionTitle, Card } from '@/components/ui/Primitives';
import { AMENITIES, BUSINESS } from '@/lib/constants';
import { GALLERY_IMAGES } from '@/lib/images';
import { formatNaira } from '@/lib/utils';

interface AmenitiesPageProps {
  onNavigate: (page: string) => void;
}

/** AMENITIES in constants only guarantees `name`, so allow optional extras. */
type Amenity = {
  name: string;
  description?: string;
  category?: string;
};

/** Match an amenity name to a lucide icon (fallback: CheckCircle2). */
const ICON_RULES: { match: RegExp; icon: LucideIcon }[] = [
  { match: /wi-?fi|internet|broadband/i, icon: Wifi },
  { match: /tv|television|satellite|cable|netflix|streaming/i, icon: Tv },
  { match: /air ?condition|a\/c|ac\b|cooling|climate/i, icon: Wind },
  { match: /kitchen|cook|utensil|microwave|oven|stove|fridge|refrigerator/i, icon: Utensils },
  { match: /bath|shower|toilet|water heater/i, icon: Bath },
  { match: /bed|linen|mattress|duvet|pillow/i, icon: BedDouble },
  { match: /park|garage|car/i, icon: Car },
  { match: /power|generator|inverter|electric|backup|solar/i, icon: Zap },
  { match: /security|guard|cctv|safe|secure/i, icon: ShieldCheck },
  { match: /gym|fitness|workout|exercise/i, icon: Dumbbell },
  { match: /coffee|tea|kettle|breakfast/i, icon: Coffee },
  { match: /water|borehole|supply/i, icon: Droplets },
  { match: /gas|cooker|flame/i, icon: Flame },
  { match: /clean|housekeep|laundry|washing|shirt|iron/i, icon: Shirt },
  { match: /pool|swim|wave/i, icon: Waves },
  { match: /reception|concierge|front desk|24/i, icon: Clock },
  { match: /key|access|self.?check/i, icon: Key },
  { match: /guest|capacity|family/i, icon: Users },
  { match: /lounge|sofa|living/i, icon: Home },
  { match: /spa|relax|comfort|luxur/i, icon: Sparkles },
];

function iconFor(name: string): LucideIcon {
  return ICON_RULES.find(rule => rule.match.test(name))?.icon ?? CheckCircle2;
}

export function AmenitiesPage({ onNavigate }: AmenitiesPageProps) {
  // Always land at the top when this page mounts.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  /** Group by `category` when the constant provides it; otherwise one flat list. */
  const groups = useMemo(() => {
    const list = AMENITIES as Amenity[];
    const hasCategories = list.some(a => a.category);

    if (!hasCategories) return [{ title: 'All Amenities', items: list }];

    const map = new Map<string, Amenity[]>();
    for (const amenity of list) {
      const key = amenity.category ?? 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(amenity);
    }
    return Array.from(map, ([title, items]) => ({ title, items }));
  }, []);

  const total = (AMENITIES as Amenity[]).length;

  return (
    <div className="pt-16">
      {/* Header */}
      <section className="relative h-72 overflow-hidden md:h-80">
        <img src={GALLERY_IMAGES.hero} alt="Apartment amenities" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink-950/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-4 text-center">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Amenities</h1>
            <p className="mt-2 text-ink-200">
              {total} thoughtful inclusions across every serviced apartment
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="section-padding bg-white">
        <div className="container-wide max-w-3xl text-center">
          <SectionTitle
            eyebrow="Comfort & Convenience"
            title="Everything you need, already here"
            subtitle="Each of our five two-bedroom apartments comes fully equipped so you can settle in from the moment you arrive — no extra shopping, no hidden essentials."
            center
          />
        </div>
      </section>

      {/* Amenity groups */}
      <section className="section-padding bg-cream-100 pt-0">
        <div className="container-wide space-y-12">
          {groups.map(group => (
            <div key={group.title}>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-xl font-semibold text-ink-900">{group.title}</h2>
                <span className="text-sm text-ink-400">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((amenity, i) => {
                  const Icon = iconFor(amenity.name);
                  return (
                    <div
                      key={`${group.title}-${i}`}
                      className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white px-4 py-4 transition-colors hover:border-gold-300"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream-100">
                        <Icon className="h-5 w-5 text-gold-600" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink-800">{amenity.name}</p>
                        {amenity.description && (
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                            {amenity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rate note */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <Card className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-serif text-lg font-semibold text-ink-900">
                All amenities included in one rate
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {formatNaira(BUSINESS.standardRate)} per night · {formatNaira(BUSINESS.cautionFee)} refundable caution fee
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => onNavigate('apartments')} className="btn-secondary">
                View the Apartment
              </button>
              <button onClick={() => onNavigate('booking')} className="btn-primary">
                Book Now <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}