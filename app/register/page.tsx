import { Suspense } from "react";
import { redirect } from "next/navigation";
import { register } from "@/app/register/actions";
import { AccountForm } from "@/components/account-form";
import { BenchFallback } from "@/components/bench-fallback";
import { BenchHeader, BenchShell } from "@/components/bench-shell";
import { ExamplePrint } from "@/components/example-print";
import { getCurrentUser } from "@/lib/auth/session";

const RegisterContent = async () => {
  const user = await getCurrentUser();
  if (user) redirect("/bench");

  return (
    <BenchShell
      variant="auth"
      header={<BenchHeader tone="paper" />}
      aside={<AccountForm mode="register" action={register} />}
      print={<ExamplePrint />}
    />
  );
};

const RegisterPage = () => (
  <Suspense fallback={<BenchFallback />}>
    <RegisterContent />
  </Suspense>
);

export default RegisterPage;
