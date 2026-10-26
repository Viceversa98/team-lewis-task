import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BenchFallback } from "@/components/bench-fallback";
import { BenchWorkspace } from "@/components/bench-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { listPortraits } from "@/lib/db";

const BenchContent = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const readings = listPortraits(user.id).map((portrait) => ({
    id: portrait.id,
    score: portrait.score,
    createdAt: portrait.createdAt,
  }));

  return <BenchWorkspace name={user.name} readings={readings} />;
};

const BenchPage = () => (
  <Suspense fallback={<BenchFallback />}>
    <BenchContent />
  </Suspense>
);

export default BenchPage;
