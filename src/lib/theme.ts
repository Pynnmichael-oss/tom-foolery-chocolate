/**
 * Brand color tokens, shared between components that need to pick a
 * background dynamically (StorySection) and know what stays legible on it.
 * Raw values live in `src/app/globals.css`; this just maps token names to
 * their CSS var and a guaranteed-readable foreground pairing.
 */
export type TfColorToken =
  | "black"
  | "white"
  | "turmeric"
  | "juniper"
  | "cinnamon"
  | "rose";

export const TOKEN_VAR: Record<TfColorToken, string> = {
  black: "--tf-black",
  white: "--tf-white",
  turmeric: "--tf-turmeric",
  juniper: "--tf-juniper",
  cinnamon: "--tf-cinnamon",
  rose: "--tf-rose",
};

/** Accessible foreground token for each color used as a background. */
export const TOKEN_CONTRAST: Record<TfColorToken, TfColorToken> = {
  black: "white",
  white: "black",
  turmeric: "black",
  juniper: "black",
  cinnamon: "white",
  rose: "black",
};
