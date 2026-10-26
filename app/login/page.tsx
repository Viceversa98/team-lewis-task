import { Suspense } from "react";
import { redirect } from "next/navigation";
import { login } from "@/app/login/actions";
import { AccountForm } from "@/components/account-form";
import { BenchFallback } from "@/components/bench-fallback";
import { BenchHeader, BenchShell } from "@/components/bench-shell";
import { ExamplePrint } from "@/components/example-print";
import { getCurrentUser } from "@/lib/auth/session";

const LoginContent = async () => {
  const user = await getCurrentUser();
  if (user) redirect("/bench");

  return (
    <BenchShell
      variant="auth"
      header={<BenchHeader tone="paper" />}
      aside={<AccountForm mode="sign-in" action={login} />}
      print={<ExamplePrint />}
    />
  );
};

const LoginPage = () => (
  <Suspense fallback={<BenchFallback />}>
    <LoginContent />
  </Suspense>
);

export default LoginPage;
