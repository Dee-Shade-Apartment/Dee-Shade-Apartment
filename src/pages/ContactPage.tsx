import { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send, Clock } from 'lucide-react';
import { SectionTitle, Card, LoadingSpinner } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { BUSINESS } from '@/lib/constants';
import { buildWhatsAppLink } from '@/lib/utils';
import type { Property } from '@/lib/types';

interface ContactPageProps {
  property: Property | null;
  whatsappNumber: string | null;
}

export function ContactPage({ property, whatsappNumber }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !message) {
      toast('error', 'Please fill in your name, phone number and message.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('enquiries').insert({
      guest_name: name,
      guest_phone: phone,
      guest_email: email || null,
      message,
      follow_up_status: 'new',
    });
    setSubmitting(false);
    if (error) {
      toast('error', 'Could not submit your enquiry. Please try again.');
      return;
    }
    toast('success', 'Your enquiry has been submitted. We will contact you soon.');
    setName(''); setEmail(''); setPhone(''); setMessage('');
  };

  const whatsappLink = whatsappNumber
    ? buildWhatsAppLink(whatsappNumber, 'Hello DEESHADES APARTMENT, I have an enquiry about booking.')
    : null;

  return (
    <div className="pt-16">
      <section className="relative h-56 overflow-hidden">
        <img src="https://images.pexels.com/photos/2771935/pexels-photo-2771935.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink-950/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Contact Us</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <SectionTitle
            eyebrow="Get in Touch"
            title="We're here to help"
            subtitle="Reach out for booking enquiries, directions, or any assistance you need."
            center
          />

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {/* Contact info cards */}
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50">
                    <MapPin className="h-5 w-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Address</p>
                    <p className="mt-1 text-sm text-ink-500">{BUSINESS.address}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50">
                    <Phone className="h-5 w-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Phone</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {property?.phone || 'To be configured by management'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50">
                    <Mail className="h-5 w-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Email</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {property?.email || 'To be configured by management'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">WhatsApp</p>
                    {whatsappLink ? (
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-green-600 hover:underline">
                        Chat with us →
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-ink-500">To be configured by management</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50">
                    <Clock className="h-5 w-5 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Check-in / Check-out</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {property?.check_in_time ? `Check-in: ${property.check_in_time}` : 'Check-in: To be configured'}
                    </p>
                    <p className="text-sm text-ink-500">
                      {property?.check_out_time ? `Check-out: ${property.check_out_time}` : 'Check-out: To be configured'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-ink-900">Send us a message</h3>
                <p className="mt-1 text-sm text-ink-500">We'll get back to you as soon as possible.</p>
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-text">Full Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="label-text">Phone Number *</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="+234..." />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Email (optional)</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="label-text">Message *</label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={5}
                      className="input-field resize-none"
                      placeholder="Tell us about your enquiry..."
                    />
                  </div>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
                    {submitting ? <LoadingSpinner size="sm" /> : <><Send className="h-4 w-4" /> Send Enquiry</>}
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-10">
            {property?.map_embed_url ? (
              <div className="overflow-hidden rounded-2xl shadow-md" dangerouslySetInnerHTML={{ __html: property.map_embed_url }} />
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <MapPin className="h-10 w-10 text-ink-300" />
                <p className="mt-3 text-sm text-ink-500">Map integration will appear here once management configures the location URL.</p>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
