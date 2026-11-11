import Link from "next/link";
import { Flame } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
        <Flame className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        This page doesn&apos;t exist. Your streaks are safe — head back to the dashboard to keep going.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition hover:brightness-105"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
