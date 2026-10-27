"use client";

import dynamic from "next/dynamic";
import { BenchFallback } from "@/components/bench-fallback";
import type { Reading } from "@/components/earlier-readings";

const BenchWorkspace = dynamic(
  () =>
    import("@/components/bench-workspace").then((mod) => ({
      default: mod.BenchWorkspace,
    })),
  {
    ssr: false,
    loading: () => <BenchFallback />,
  },
);

type BenchAppProps = {
  name: string;
  readings: Reading[];
};

export const BenchApp = ({ name, readings }: BenchAppProps) => (
  <BenchWorkspace name={name} readings={readings} />
);
