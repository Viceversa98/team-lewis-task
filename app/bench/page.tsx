import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BenchApp } from "@/components/bench-app";
import { BenchFallback } from "@/components/bench-fallback";
import { getCurrentUser } from "@/lib/auth/session";
import { listPortraits } from "@/lib/db";

const BenchContent = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const readings = (await listPortraits(user.id)).map((portrait) => ({
    id: portrait.id,
    score: portrait.score,
    createdAt: portrait.createdAt,
  }));

  return <BenchApp name={user.name} readings={readings} />;
};

const BenchPage = () => (
  <Suspense fallback={<BenchFallback />}>
    <BenchContent />
  </Suspense>
);

export default BenchPage;
