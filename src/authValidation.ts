export const PASSWORD_MIN_LENGTH = 6;
export const DISPLAY_NAME_MAX_LENGTH = 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthContext = "default" | "login" | "signup" | "passwordReset";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = LoginFormValues & {
  name: string;
};

export type LoginFormErrors = {
  email: string;
  password: string;
};

export type SignupFormErrors = LoginFormErrors & {
  name: string;
};

export type PasswordStrength = {
  level: 0 | 1 | 2 | 3 | 4;
  label: "" | "Weak" | "Fair" | "Good" | "Strong";
};

type AuthErrorLike = {
  code?: string;
  message?: string;
} | null | undefined;

function sanitizeFirebaseMessage(message?: string): string {
  return (message || "")
    .replace("Firebase: ", "")
    .replace(/\(auth\/.*?\)\.?/g, "")
    .trim();
}

export function validateEmailAddress(email: string): string {
  if (!email) {
    return "Enter your email address.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function normalizeDisplayName(name: string): string {
  return (name || "").trim().replace(/\s+/g, " ");
}

export function validateDisplayName(name: string): string {
  const normalizedName = normalizeDisplayName(name);

  if (!normalizedName) {
    return "Enter your full name.";
  }

  if (normalizedName.length < 2) {
    return "Use at least 2 characters for your name.";
  }

  if (normalizedName.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer for your name.`;
  }

  return "";
}

export function validateLoginForm({ email, password }: LoginFormValues): LoginFormErrors {
  return {
    email: validateEmailAddress(email),
    password: password ? "" : "Enter your password.",
  };
}

export function validateSignupForm({
  name,
  email,
  password,
}: SignupFormValues): SignupFormErrors {
  let passwordError = "";

  if (!password) {
    passwordError = "Create a password to continue.";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    passwordError = `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
  }

  return {
    name: validateDisplayName(name),
    email: validateEmailAddress(email),
    password: passwordError,
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: 0, label: "" };
  }

  let score = 0;

  if (password.length >= PASSWORD_MIN_LENGTH) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 1, label: "Weak" };
  if (score === 2) return { level: 2, label: "Fair" };
  if (score === 3) return { level: 3, label: "Good" };

  return { level: 4, label: "Strong" };
}

export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some(Boolean);
}

export function formatAuthMessage(error: AuthErrorLike, context: AuthContext = "default"): string {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-email":
    case "auth/missing-email":
      return "Enter a valid email address.";
    case "auth/missing-password":
      return context === "signup"
        ? "Create a password to continue."
        : "Enter your password to continue.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in instead or reset your password.";
    case "auth/weak-password":
      return `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return context === "passwordReset"
        ? "We could not send a reset link with those details. Check the email address and try again."
        : "Incorrect email or password. Please try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support if you need help.";
    case "auth/too-many-requests":
      return context === "passwordReset"
        ? "Too many reset requests were made. Please wait a moment and try again."
        : "Too many attempts were made. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "We could not reach the server. Check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return context === "signup"
        ? "Account creation is currently unavailable. Please contact support."
        : "Email sign-in is currently unavailable. Please contact support.";
    case "auth/quota-exceeded":
      return "We could not complete that request right now. Please try again shortly.";
    default: {
      const fallback = sanitizeFirebaseMessage(error?.message);
      return fallback || "Something went wrong. Please try again.";
    }
  }
}
