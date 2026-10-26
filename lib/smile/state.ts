export type ReadSmileState = {
  score: number | null;
  error: string | null;
  readingId: number | null;
};

export const initialReadSmileState: ReadSmileState = {
  score: null,
  error: null,
  readingId: null,
};
