export type AccountValues = {
  name: string;
  email: string;
};

export type AccountState = {
  error: string | null;
  values: AccountValues;
};

export const initialAccountState: AccountState = {
  error: null,
  values: { name: "", email: "" },
};
