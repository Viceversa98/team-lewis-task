"use client";

import { useActionState, useEffect } from "react";
import { Alert, Button, FieldError, Form, Input, Label, Link, Spinner, TextField } from "@heroui/react";
import { initialAccountState, type AccountState } from "@/lib/auth/account-state";
import { useBenchStore, type AccountMode } from "@/lib/bench-store";

type AccountFormProps = {
  mode: AccountMode;
  action: (state: AccountState, formData: FormData) => Promise<AccountState>;
};

const copy = {
  register: {
    title: "Create account",
    lead: "One account keeps every portrait you check and its smile score.",
    submit: "Create account",
    pending: "Creating account",
    switchPrompt: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Sign in",
  },
  "sign-in": {
    title: "Sign in",
    lead: "Check a headshot's smile score before it goes into a campaign.",
    submit: "Sign in",
    pending: "Signing in",
    switchPrompt: "New to the bench?",
    switchHref: "/register",
    switchLabel: "Create account",
  },
} as const;

const fieldError = (error: string | null, prefix: string) =>
  error?.startsWith(prefix) ? error : null;

export const AccountForm = ({ mode, action }: AccountFormProps) => {
  const accountMode = useBenchStore((state) => state.accountMode);
  const setAccountMode = useBenchStore((state) => state.setAccountMode);
  const [state, formAction, pending] = useActionState(action, initialAccountState);
  const text = copy[mode];
  const nameError = fieldError(state.error, "Name");
  const emailError = fieldError(state.error, "Email is");
  const passwordError = fieldError(state.error, "Password");
  const formError =
    state.error && !nameError && !emailError && !passwordError ? state.error : null;

  useEffect(() => {
    if (accountMode !== mode) setAccountMode(mode);
  }, [accountMode, mode, setAccountMode]);

  return (
    <div className="flex h-full min-h-0 flex-col justify-end gap-3 lg:justify-center lg:gap-6">
      <div className="grid gap-1.5 lg:gap-2">
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl lg:text-5xl">
          {text.title}
        </h1>
        <p className="hidden max-w-[42ch] text-base leading-6 text-rebate sm:block">{text.lead}</p>
      </div>
      <Form
        action={formAction}
        validationBehavior="aria"
        className="grid w-full max-w-sm gap-3 lg:gap-4"
      >
        {formError ? (
          <Alert status="danger">
            <Alert.Description>{formError}</Alert.Description>
          </Alert>
        ) : null}
        {mode === "register" ? (
          <TextField
            key={`name-${state.values.name}`}
            name="name"
            type="text"
            defaultValue={state.values.name}
            isInvalid={nameError !== null}
            fullWidth
          >
            <Label>Name</Label>
            <Input autoComplete="name" />
            <FieldError>{nameError}</FieldError>
          </TextField>
        ) : null}
        <TextField
          key={`email-${state.values.email}`}
          name="email"
          type="email"
          defaultValue={state.values.email}
          isInvalid={emailError !== null}
          fullWidth
        >
          <Label>Email</Label>
          <Input autoComplete="email" inputMode="email" />
          <FieldError>{emailError}</FieldError>
        </TextField>
        <TextField name="password" type="password" isInvalid={passwordError !== null} fullWidth>
          <Label>Password</Label>
          <Input autoComplete={mode === "register" ? "new-password" : "current-password"} />
          <FieldError>{passwordError}</FieldError>
        </TextField>
        <Button type="submit" variant="primary" fullWidth isDisabled={pending} aria-busy={pending}>
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" color="current" />
              {text.pending}
            </span>
          ) : (
            text.submit
          )}
        </Button>
        <p className="flex flex-wrap items-center gap-x-2 text-base text-rebate">
          {text.switchPrompt}
          <Link href={text.switchHref} className="font-medium text-cyanotype">
            {text.switchLabel}
          </Link>
        </p>
      </Form>
    </div>
  );
};
