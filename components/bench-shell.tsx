import type { ReactNode } from "react";

type BenchShellProps = {
  variant?: "auth" | "bench";
  header: ReactNode;
  aside: ReactNode;
  print: ReactNode;
};

export const BenchShell = ({
  variant = "bench",
  header,
  aside,
  print,
}: BenchShellProps) => {
  if (variant === "auth") {
    return (
      <main className="mx-auto grid h-dvh w-full max-w-[92rem] grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden p-3 sm:gap-4 sm:p-5 lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-6 lg:p-8">
        <div className="order-2 flex min-h-0 min-w-0 flex-col bg-paper px-5 py-5 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:px-8 sm:py-7 lg:order-1">
          {header}
          <div className="min-h-0 flex-1">{aside}</div>
        </div>
        <div className="order-1 min-h-0 min-w-0 lg:order-2">{print}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid h-dvh w-full max-w-[92rem] grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-3 sm:gap-4 sm:p-5 lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-6 lg:p-8">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{header}</div>
      <div className="min-h-0 min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">{print}</div>
      <div className="min-h-0 min-w-0 lg:col-start-1 lg:row-start-2">{aside}</div>
    </main>
  );
};

type BenchHeaderProps = {
  tone?: "studio" | "paper";
  children?: ReactNode;
};

export const BenchHeader = ({ tone = "studio", children }: BenchHeaderProps) => (
  <header className="flex min-h-11 items-center justify-between gap-4">
    <p
      className={`font-display text-xl tracking-tight ${
        tone === "paper" ? "text-ink" : "text-paper"
      }`}
    >
      Portrait bench
    </p>
    {children}
  </header>
);
