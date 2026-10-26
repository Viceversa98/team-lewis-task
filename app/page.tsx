import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BenchFallback } from "@/components/bench-fallback";
import { getCurrentUser } from "@/lib/auth/session";

const HomeGate = async () => {
  const user = await getCurrentUser();
  redirect(user ? "/bench" : "/login");
};

const HomePage = () => (
  <Suspense fallback={<BenchFallback />}>
    <HomeGate />
  </Suspense>
);

export default HomePage;
