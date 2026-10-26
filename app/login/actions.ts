"use server";

import { redirect } from "next/navigation";
import { initialAccountState, type AccountState } from "@/lib/auth/account-state";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/db";
import {
  ENTER_PASSWORD,
  PASSWORD_LONG,
  SIGN_IN_FAILED,
  USE_EMAIL,
} from "@/lib/messages";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let timingPad: { hash: string; salt: string } | null = null;

const spendPasswordTime = (password: string) => {
  timingPad ??= hashPassword("portrait-bench-timing");
  verifyPassword(password, timingPad.hash, timingPad.salt);
};

export const login = async (
  _previous: AccountState = initialAccountState,
  formData: FormData,
): Promise<AccountState> => {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { name: "", email };

  if (!EMAIL.test(email)) return { error: USE_EMAIL, values };
  if (password.length === 0) return { error: ENTER_PASSWORD, values };
  if (password.length > 200) return { error: PASSWORD_LONG, values };

  const user = findUserByEmail(email);
  if (!user) {
    spendPasswordTime(password);
    return { error: SIGN_IN_FAILED, values };
  }
  if (!verifyPassword(password, user.passwordHash, user.salt)) {
    return { error: SIGN_IN_FAILED, values };
  }

  await createSession(user.id);
  redirect("/bench");
};
