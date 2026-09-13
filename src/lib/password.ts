export const hashPassword = async (password: string, salt = "hello_pkuphysu") => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${password}-${salt}`));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};
