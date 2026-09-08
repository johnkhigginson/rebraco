import { useState, type FormEvent } from 'react';
import type { BlockContentProps, RichTextValue } from '../../types/blocks';
import { RichText } from '../../lib/richtext';

interface FormFieldData {
  content: {
    properties: {
      fieldLabel?: string;
      fieldType?: string;
      required?: boolean;
      placeholder?: string;
      options?: string;
    };
  };
}

interface FormBlockData {
  heading?: string;
  description?: RichTextValue | null;
  formType?: string;
  submitButtonText?: string;
  successMessage?: string;
  recipientEmail?: string;
  fields?: {
    items: FormFieldData[];
  };
}

export default function FormBlock({ data }: BlockContentProps<FormBlockData>) {
  const fields = data.fields?.items || [];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (fields.length === 0 && data.formType !== 'newsletter') return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: data.formType || 'custom',
          recipientEmail: data.recipientEmail,
          fields: formData,
        }),
      });

      if (!res.ok) {
        throw new Error(`Form submission failed: ${res.status}`);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-heading mb-2">Thank you!</h3>
          <p className="text-text-muted">{data.successMessage || 'Your message has been sent successfully.'}</p>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {data.heading && (
        <h2 className="text-3xl font-bold text-heading mb-4">{data.heading}</h2>
      )}
      <RichText value={data.description} className="prose prose-headings:text-heading prose-p:text-text-muted mb-8" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field, i) => {
            const fp = field.content.properties;
            const key = fp.fieldLabel || `field-${i}`;

            return (
              <div key={i}>
                <label className="block text-sm font-medium text-text mb-1">
                  {fp.fieldLabel}
                  {fp.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <FormInput
                  type={fp.fieldType || 'text'}
                  placeholder={fp.placeholder}
                  required={fp.required}
                  options={fp.options}
                  value={formData[key] || ''}
                  onChange={(val) => setFormData(prev => ({ ...prev, [key]: val }))}
                />
              </div>
            );
          })}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary disabled:opacity-50"
          >
            {submitting ? 'Sending...' : (data.submitButtonText || 'Submit')}
          </button>
        </form>
    </div>
  );
}

function FormInput({
  type,
  placeholder,
  required,
  options,
  value,
  onChange,
}: {
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const inputClass = "w-full px-4 py-3 border border-border rounded-[var(--border-radius,0.5rem)] bg-bg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition";

  if (type === 'textarea') {
    return (
      <textarea
        className={inputClass}
        placeholder={placeholder}
        required={required}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type === 'select') {
    const opts = (options || '').split('\n').map(o => o.trim()).filter(Boolean);
    return (
      <select
        className={inputClass}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder || 'Select an option'}</option>
        {opts.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === 'checkbox') {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          required={required}
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm text-text-muted">{placeholder}</span>
      </label>
    );
  }

  return (
    <input
      type={type}
      className={inputClass}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
