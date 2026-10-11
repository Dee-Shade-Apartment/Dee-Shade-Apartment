import { useState, useEffect } from 'react';
import { Save, AlertCircle, Building2, DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { Card, LoadingSpinner } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Property, PropertySettings } from '@/lib/types';

export function AdminSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [settings, setSettings] = useState<PropertySettings | null>(null);
  const [tab, setTab] = useState<'property' | 'rates' | 'bank' | 'policies'>('property');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data: propData } = await supabase.from('properties').select('*').limit(1).maybeSingle();
    if (propData) setProperty(propData as Property);

    const { data: settingsData } = await supabase.from('property_settings').select('*').limit(1).maybeSingle();
    if (settingsData) setSettings(settingsData as PropertySettings);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (property) {
      await supabase.from('properties').update({
        name: property.name,
        address: property.address,
        phone: property.phone,
        email: property.email,
        whatsapp_number: property.whatsapp_number,
        check_in_time: property.check_in_time,
        check_out_time: property.check_out_time,
        map_embed_url: property.map_embed_url,
      }).eq('id', property.id);

      await supabase.from('audit_logs').insert({
        action: 'property_settings_updated',
        entity_type: 'property',
        entity_id: property.id,
        metadata: { fields: ['name', 'address', 'phone', 'email', 'whatsapp', 'check_in', 'check_out'] },
        reason: 'Property details updated',
      });
    }

    if (settings) {
      await supabase.from('property_settings').update({
        standard_rate: settings.standard_rate,
        party_rate: settings.party_rate,
        party_rate_description: settings.party_rate_description,
        party_rate_conditions: settings.party_rate_conditions,
        caution_fee: settings.caution_fee,
        max_occupancy: settings.max_occupancy,
        hold_duration_minutes: settings.hold_duration_minutes,
        bank_name: settings.bank_name,
        account_name: settings.account_name,
        account_number: settings.account_number,
        payment_instructions: settings.payment_instructions,
        house_rules: settings.house_rules,
        cancellation_policy: settings.cancellation_policy,
      }).eq('id', settings.id);

      await supabase.from('audit_logs').insert({
        action: 'property_settings_updated',
        entity_type: 'property_settings',
        entity_id: settings.id,
        metadata: { fields: ['rates', 'bank', 'policies'] },
        reason: 'Property settings updated (rates, bank, policies)',
      });
    }

    setSaving(false);
    toast('success', 'Settings saved successfully.');
  };

  if (loading) return <LoadingSpinner label="Loading settings..." />;

  const bankConfigured = settings?.bank_name && settings?.account_name && settings?.account_number;
  const whatsappConfigured = property?.whatsapp_number;

  const tabs = [
    { id: 'property' as const, label: 'Property Details', icon: Building2 },
    { id: 'rates' as const, label: 'Rates & Fees', icon: DollarSign },
    { id: 'bank' as const, label: 'Bank & Payment', icon: ShieldCheck },
    { id: 'policies' as const, label: 'Policies', icon: Clock },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Property Settings</h1>
          <p className="mt-1 text-sm text-ink-500">Configure property details, rates, bank information, and policies.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      {/* Setup warnings */}
      {!bankConfigured && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Bank details not configured.</p>
            <p>Guests cannot complete the payment flow until you add your bank account details in the Bank & Payment tab.</p>
          </div>
        </div>
      )}
      {!whatsappConfigured && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">WhatsApp number not configured.</p>
            <p>The "Notify DEESHADES" button will not open WhatsApp until you set your WhatsApp business number in the Property Details tab.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id ? 'bg-gold-600 text-white' : 'bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'property' && property && (
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-text">Property Name</label><input value={property.name} onChange={e => setProperty({ ...property, name: e.target.value })} className="input-field" /></div>
            <div><label className="label-text">Phone</label><input value={property.phone || ''} onChange={e => setProperty({ ...property, phone: e.target.value })} className="input-field" placeholder="To be configured" /></div>
            <div><label className="label-text">Email</label><input value={property.email || ''} onChange={e => setProperty({ ...property, email: e.target.value })} className="input-field" placeholder="To be configured" /></div>
            <div><label className="label-text">WhatsApp Number (international format)</label><input value={property.whatsapp_number || ''} onChange={e => setProperty({ ...property, whatsapp_number: e.target.value })} className="input-field" placeholder="e.g. 2348012345678" /></div>
            <div className="sm:col-span-2"><label className="label-text">Address</label><textarea value={property.address} onChange={e => setProperty({ ...property, address: e.target.value })} rows={2} className="input-field resize-none" /></div>
            <div><label className="label-text">Check-in Time</label><input value={property.check_in_time || ''} onChange={e => setProperty({ ...property, check_in_time: e.target.value })} className="input-field" placeholder="e.g. 2:00 PM" /></div>
            <div><label className="label-text">Check-out Time</label><input value={property.check_out_time || ''} onChange={e => setProperty({ ...property, check_out_time: e.target.value })} className="input-field" placeholder="e.g. 12:00 PM" /></div>
            <div className="sm:col-span-2"><label className="label-text">Map Embed URL (optional)</label><input value={property.map_embed_url || ''} onChange={e => setProperty({ ...property, map_embed_url: e.target.value })} className="input-field" placeholder="Google Maps embed iframe URL" /></div>
          </div>
        </Card>
      )}

      {tab === 'rates' && settings && (
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-text">Standard Rate (per night)</label><input type="number" value={settings.standard_rate} onChange={e => setSettings({ ...settings, standard_rate: Number(e.target.value) })} className="input-field" /></div>
            <div><label className="label-text">Party Rate</label><input type="number" value={settings.party_rate} onChange={e => setSettings({ ...settings, party_rate: Number(e.target.value) })} className="input-field" /></div>
            <div><label className="label-text">Caution Fee</label><input type="number" value={settings.caution_fee} onChange={e => setSettings({ ...settings, caution_fee: Number(e.target.value) })} className="input-field" /></div>
            <div><label className="label-text">Maximum Occupancy</label><input type="number" value={settings.max_occupancy} onChange={e => setSettings({ ...settings, max_occupancy: Number(e.target.value) })} className="input-field" /></div>
            <div><label className="label-text">Hold Duration (minutes)</label><input type="number" value={settings.hold_duration_minutes} onChange={e => setSettings({ ...settings, hold_duration_minutes: Number(e.target.value) })} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="label-text">Party Rate Description</label><textarea value={settings.party_rate_description || ''} onChange={e => setSettings({ ...settings, party_rate_description: e.target.value })} rows={2} className="input-field resize-none" /></div>
            <div className="sm:col-span-2"><label className="label-text">Party Rate Conditions / Eligibility</label><textarea value={settings.party_rate_conditions || ''} onChange={e => setSettings({ ...settings, party_rate_conditions: e.target.value })} rows={2} className="input-field resize-none" placeholder="Define the purpose, duration, and eligibility for the party rate" /></div>
          </div>
        </Card>
      )}

      {tab === 'bank' && settings && (
        <Card className="p-6">
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <ShieldCheck className="mr-1.5 inline h-4 w-4" />
            These details are displayed to guests during the payment step. Never invent bank information — enter only the actual business bank account.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label-text">Bank Name</label><input value={settings.bank_name || ''} onChange={e => setSettings({ ...settings, bank_name: e.target.value })} className="input-field" placeholder="e.g. Access Bank" /></div>
            <div><label className="label-text">Account Name</label><input value={settings.account_name || ''} onChange={e => setSettings({ ...settings, account_name: e.target.value })} className="input-field" placeholder="e.g. DEESHADES APARTMENT" /></div>
            <div><label className="label-text">Account Number</label><input value={settings.account_number || ''} onChange={e => setSettings({ ...settings, account_number: e.target.value })} className="input-field" placeholder="e.g. 0123456789" /></div>
            <div className="sm:col-span-2"><label className="label-text">Payment Instructions</label><textarea value={settings.payment_instructions || ''} onChange={e => setSettings({ ...settings, payment_instructions: e.target.value })} rows={3} className="input-field resize-none" placeholder="Additional payment instructions for guests..." /></div>
          </div>
        </Card>
      )}

      {tab === 'policies' && settings && (
        <Card className="p-6">
          <div className="space-y-4">
            <div><label className="label-text">House Rules</label><textarea value={settings.house_rules || ''} onChange={e => setSettings({ ...settings, house_rules: e.target.value })} rows={4} className="input-field resize-none" /></div>
            <div><label className="label-text">Cancellation & Refund Policy</label><textarea value={settings.cancellation_policy || ''} onChange={e => setSettings({ ...settings, cancellation_policy: e.target.value })} rows={4} className="input-field resize-none" /></div>
          </div>
        </Card>
      )}
    </div>
  );
}
