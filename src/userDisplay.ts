type UserLike = {
  displayName?: string | null;
  email?: string | null;
} | null | undefined;

function titleCaseWord(word = ""): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatUserDisplayName(user: UserLike): string {
  const directName = typeof user?.displayName === "string" ? user.displayName.trim() : "";
  if (directName) return directName;

  const email = typeof user?.email === "string" ? user.email.trim() : "";
  const localPart = email.split("@")[0]?.trim() || "";
  if (!localPart) return "User";

  const normalized = localPart
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "User";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

export function getUserInitial(user: UserLike): string {
  const displayName = formatUserDisplayName(user);
  const firstChar = displayName.match(/[A-Za-z0-9]/)?.[0] || "U";
  return firstChar.toUpperCase();
}
