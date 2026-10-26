"use server";

import { redirect } from "next/navigation";
import { initialAccountState, type AccountState } from "@/lib/auth/account-state";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createUser, isUniqueConstraint } from "@/lib/db";
import {
  EMAIL_TAKEN,
  ENTER_NAME,
  NAME_LONG,
  PASSWORD_LONG,
  USE_EMAIL,
  USE_PASSWORD,
} from "@/lib/messages";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (
  _previous: AccountState = initialAccountState,
  formData: FormData,
): Promise<AccountState> => {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { name, email };

  if (name.length === 0) return { error: ENTER_NAME, values };
  if (name.length > 80) return { error: NAME_LONG, values };
  if (!EMAIL.test(email)) return { error: USE_EMAIL, values };
  if (password.length < 8) return { error: USE_PASSWORD, values };
  if (password.length > 200) return { error: PASSWORD_LONG, values };

  const { hash, salt } = hashPassword(password);
  let userId = 0;
  try {
    userId = createUser({ name, email, passwordHash: hash, salt }).id;
  } catch (error) {
    if (isUniqueConstraint(error)) return { error: EMAIL_TAKEN, values };
    throw error;
  }

  await createSession(userId);
  redirect("/bench");
};
