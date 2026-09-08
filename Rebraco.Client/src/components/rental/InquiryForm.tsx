import { useState, type FormEvent } from 'react';
import { LEASE_TERMS } from '../../types/rental';

interface InquiryFormProps {
  propertyName: string;
  propertyId: string;
  unitName?: string;
  unitId?: string;
  efPropertyId?: number;
  efUnitId?: number;
  leaseTermOptions?: string[];
}

export default function InquiryForm({
  propertyName,
  propertyId,
  unitName,
  unitId,
  efPropertyId,
  efUnitId,
  leaseTermOptions,
}: InquiryFormProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    moveInDate: '',
    leaseTerm: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "w-full px-4 py-2.5 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm";

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          moveInDate: form.moveInDate || undefined,
          leaseTerm: form.leaseTerm || undefined,
          message: form.message || undefined,
          propertyName,
          propertyId,
          unitName: unitName || undefined,
          unitId: unitId || undefined,
          efPropertyId: efPropertyId || undefined,
          efUnitId: efUnitId || undefined,
        }),
      });

      if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-heading mb-1">Inquiry Sent!</h3>
        <p className="text-sm text-text-muted">
          We&apos;ll be in touch about {unitName || propertyName} soon.
        </p>
      </div>
    );
  }

  const heading = unitName
    ? `Interested in ${unitName}?`
    : `Interested in ${propertyName}?`;

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-heading mb-4">{heading}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="John Doe"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="john@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="(208) 555-0123"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">Preferred Move-In Date</label>
          <input
            type="date"
            value={form.moveInDate}
            onChange={(e) => update('moveInDate', e.target.value)}
            className={inputClass}
          />
        </div>

        {leaseTermOptions && leaseTermOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text mb-1">Preferred Lease Term</label>
            <select
              value={form.leaseTerm}
              onChange={(e) => update('leaseTerm', e.target.value)}
              className={inputClass}
            >
              <option value="">Select a term</option>
              {leaseTermOptions.map((term) => {
                const label = LEASE_TERMS.find(t => t.value === term)?.label || term;
                return <option key={term} value={term}>{label}</option>;
              })}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-1">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            placeholder="Tell us a bit about what you're looking for..."
            rows={4}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center"
        >
          {submitting ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Sending...</> : 'Send Inquiry'}
        </button>
      </form>
    </div>
  );
}
