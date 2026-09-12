"use client";

import { useState } from "react";

const fields = [
  { id: "name", label: "Name", type: "text", required: true, autoComplete: "name" },
  { id: "email", label: "Work email", type: "email", required: true, autoComplete: "email" },
  { id: "company", label: "Company", type: "text", required: true, autoComplete: "organization" },
  { id: "team", label: "Team size", type: "text", required: false, autoComplete: "off", placeholder: "e.g. 40 engineers" },
] as const;

export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [protecting, setProtecting] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    if (name.length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid work email.";
    if (company.length < 2) next.company = "Enter your company.";
    if (protecting.trim().length < 3) next.protecting = "Tell us what you are protecting.";
    if (message.trim().length < 10) next.message = "Add a few words about your setup (10+ characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // TODO: wire to a real endpoint (e.g. POST /api/demo-request) before launch.
    setSent(true);
  };

  if (sent) {
    return (
      <div className="border border-line p-8" role="status">
        <p className="font-display text-2xl font-medium tracking-tight">Request received.</p>
        <p className="mt-3 leading-relaxed text-muted">
          Thanks — this demo form is currently front-end only. Wire <code className="font-mono text-sm">POST /api/demo-request</code> to
          receive submissions, and we&apos;ll reply within two business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="border border-line p-6 md:p-8" aria-label="Demo request form">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className={field.id === "team" ? "" : "sm:col-span-1"}>
            <label htmlFor={field.id} className="meta-label text-muted">
              {field.label} {field.required && <span aria-hidden>*</span>}
            </label>
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={"placeholder" in field ? field.placeholder : undefined}
              aria-invalid={Boolean(errors[field.id])}
              aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
              className="mt-2 min-h-[48px] w-full rounded-md border border-line bg-paper px-3.5 text-[15px] aria-[invalid=true]:border-ink"
            />
            {errors[field.id] && (
              <p id={`${field.id}-error`} role="alert" className="mt-1.5 text-sm text-ink">
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}
        <div className="sm:col-span-2">
          <label htmlFor="protecting" className="meta-label text-muted">
            What are you protecting? <span aria-hidden>*</span>
          </label>
          <input
            id="protecting"
            name="protecting"
            type="text"
            value={protecting}
            onChange={(e) => setProtecting(e.target.value)}
            placeholder="e.g. customer contracts, source code, payroll"
            aria-invalid={Boolean(errors.protecting)}
            aria-describedby={errors.protecting ? "protecting-error" : undefined}
            className="mt-2 min-h-[48px] w-full rounded-md border border-line bg-paper px-3.5 text-[15px] aria-[invalid=true]:border-ink"
          />
          {errors.protecting && (
            <p id="protecting-error" role="alert" className="mt-1.5 text-sm text-ink">
              {errors.protecting}
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="meta-label text-muted">
            Message <span aria-hidden>*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Models you use, team shape, timeline…"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : undefined}
            className="mt-2 w-full rounded-md border border-line bg-paper px-3.5 py-3 text-[15px] aria-[invalid=true]:border-ink"
          />
          {errors.message && (
            <p id="message-error" role="alert" className="mt-1.5 text-sm text-ink">
              {errors.message}
            </p>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-ink px-6 font-medium text-paper transition-colors hover:bg-soot sm:w-auto"
      >
        Request demo
      </button>
      <p className="mt-4 text-xs text-muted">No backend is connected yet — submissions stay in your browser (see TODO in code).</p>
    </form>
  );
}
