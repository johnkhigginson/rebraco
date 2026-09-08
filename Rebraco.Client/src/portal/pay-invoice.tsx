import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { portalFetch } from "./api";

interface InvoiceDetail {
  id: number;
  description: string;
  amountCents: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function CheckoutForm({ invoiceId }: { invoiceId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/portal/invoices/${invoiceId}?status=success`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed.");
      setProcessing(false);
    }
    // If successful, the page will redirect to return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button type="submit" disabled={!stripe || processing}
        className="w-full btn btn-primary disabled:opacity-50">
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function PayInvoicePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [payError, setPayError] = useState("");
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  const paymentSuccess = searchParams.get("status") === "success";

  useEffect(() => {
    portalFetch(`/api/portal/invoices/${id}`)
      .then((r) => r.json())
      .then(setInvoice)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const initiatePayment = async () => {
    setInitiatingPayment(true);
    setPayError("");

    try {
      const res = await portalFetch(`/api/portal/invoices/${id}/pay`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPayError(data?.error || "Failed to initiate payment.");
        return;
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);

      // Load Stripe with the correct publishable key
      const stripeOptions = data.connectedAccountId
        ? { stripeAccount: data.connectedAccountId }
        : undefined;
      setStripePromise(loadStripe(data.publishableKey, stripeOptions));
    } catch {
      setPayError("Failed to initiate payment.");
    } finally {
      setInitiatingPayment(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!invoice) return <div className="text-gray-500 py-8">Invoice not found.</div>;

  // Payment success state
  if (paymentSuccess || invoice.status === "Paid") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-1">{invoice.description}</p>
        <p className="text-2xl font-bold text-gray-900 mb-6">{formatCents(invoice.amountCents)}</p>
        <Link to="/portal/invoices" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to invoices
        </Link>
      </div>
    );
  }

  // Invoice not payable
  if (invoice.status !== "Sent") {
    return (
      <div className="max-w-lg">
        <Link to="/portal/invoices" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
          &larr; Back to invoices
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{invoice.description}</h1>
          <p className="text-gray-500">This invoice is not currently payable (status: {invoice.status}).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link to="/portal/invoices" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to invoices
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{invoice.description}</h1>
        <p className="text-sm text-gray-500 mb-4">Due: {invoice.dueDate}</p>
        <p className="text-3xl font-bold text-gray-900">{formatCents(invoice.amountCents)}</p>
      </div>

      {payError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {payError}
        </div>
      )}

      {clientSecret && stripePromise ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <CheckoutForm invoiceId={id!} />
          </Elements>
        </div>
      ) : (
        <button onClick={initiatePayment} disabled={initiatingPayment}
          className="w-full btn btn-primary disabled:opacity-50">
          {initiatingPayment ? "Preparing Payment..." : "Proceed to Payment"}
        </button>
      )}
    </div>
  );
}
