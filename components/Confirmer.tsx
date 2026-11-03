"use client";
export default function Confirmer({ action, message, children, className }:
  { action: () => Promise<void>; message: string; children: React.ReactNode; className?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      <button className={className}>{children}</button>
    </form>
  );
}
