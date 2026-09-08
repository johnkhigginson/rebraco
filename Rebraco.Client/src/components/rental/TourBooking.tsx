import { useState, useEffect, type FormEvent } from 'react';

interface TourBookingProps {
  propertyId: number;
  units?: { id: number; unitNumber: string }[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  availableSpots: number;
}

function formatTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export default function TourBooking({ propertyId, units }: TourBookingProps) {
  const [step, setStep] = useState<'date' | 'slot' | 'form' | 'done'>('date');
  const [dates, setDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [unitId, setUnitId] = useState('');
  const [notes, setNotes] = useState('');

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm';

  // Fetch available dates
  useEffect(() => {
    setLoadingDates(true);
    fetch(`/api/public/tours/dates/${propertyId}`)
      .then((r) => r.json())
      .then((data) => setDates(Array.isArray(data) ? data : []))
      .catch(() => setDates([]))
      .finally(() => setLoadingDates(false));
  }, [propertyId]);

  // Fetch slots when date selected
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    fetch(`/api/public/tours/slots/${propertyId}?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(Array.isArray(data) ? data : []);
        setStep('slot');
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          fullName,
          email,
          phone: phone || undefined,
          scheduledDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          unitId: unitId ? Number(unitId) : undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to book tour.');
      }

      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Done state
  if (step === 'done') {
    return (
      <div className="card text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-heading mb-1">Tour Booked!</h3>
        <p className="text-sm text-text-muted">
          {formatDateLabel(selectedDate)} at {selectedSlot && formatTime(selectedSlot.startTime)}
        </p>
        <p className="text-xs text-text-muted mt-2">We'll send you a confirmation email shortly.</p>
      </div>
    );
  }

  // No availability
  if (!loadingDates && dates.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold text-heading mb-2">Schedule a Tour</h3>
        <p className="text-sm text-text-muted">No tour times are currently available for this property. Please contact us to schedule a visit.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-heading mb-4">Schedule a Tour</h3>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4 text-xs text-text-muted">
        <span className={step === 'date' ? 'font-semibold text-primary' : ''}>1. Date</span>
        <span>&rarr;</span>
        <span className={step === 'slot' ? 'font-semibold text-primary' : ''}>2. Time</span>
        <span>&rarr;</span>
        <span className={step === 'form' ? 'font-semibold text-primary' : ''}>3. Details</span>
      </div>

      {/* Step 1: Date */}
      {step === 'date' && (
        <div>
          {loadingDates ? (
            <p className="text-sm text-text-muted py-4">Loading available dates...</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => handleDateSelect(date)}
                  className="px-3 py-2.5 text-sm border border-border rounded-lg hover:border-primary hover:bg-primary/5 text-text transition text-left"
                >
                  {formatDateLabel(date)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Slot */}
      {step === 'slot' && (
        <div>
          <button
            onClick={() => setStep('date')}
            className="text-xs text-primary hover:underline mb-3 inline-block"
          >
            &larr; Change date
          </button>
          <p className="text-sm font-medium text-text mb-2">{formatDateLabel(selectedDate)}</p>
          {loadingSlots ? (
            <p className="text-sm text-text-muted py-4">Loading times...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-text-muted py-4">No slots available for this date.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => handleSlotSelect(slot)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-border rounded-lg hover:border-primary hover:bg-primary/5 text-text transition"
                >
                  <span>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
                  <span className="text-xs text-text-muted">{slot.availableSpots} spot{slot.availableSpots !== 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Contact form */}
      {step === 'form' && selectedSlot && (
        <div>
          <button
            onClick={() => setStep('slot')}
            className="text-xs text-primary hover:underline mb-3 inline-block"
          >
            &larr; Change time
          </button>
          <p className="text-sm font-medium text-text mb-3">
            {formatDateLabel(selectedDate)} · {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="(208) 555-0123" className={inputClass} />
            </div>

            {units && units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">Interested Unit</label>
                <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={inputClass}>
                  <option value="">Any / General tour</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything we should know?" rows={3} className={inputClass} />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full btn btn-primary disabled:opacity-50">
              {submitting ? 'Booking...' : 'Book Tour'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
