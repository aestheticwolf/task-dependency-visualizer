export const PASSWORD_MIN_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeFirebaseMessage(message) {
  return (message || "")
    .replace("Firebase: ", "")
    .replace(/\(auth\/.*?\)\.?/g, "")
    .trim();
}

export function validateEmailAddress(email) {
  if (!email) {
    return "Enter your email address.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validateLoginForm({ email, password }) {
  return {
    email: validateEmailAddress(email),
    password: password ? "" : "Enter your password.",
  };
}

export function validateSignupForm({ email, password }) {
  let passwordError = "";

  if (!password) {
    passwordError = "Create a password to continue.";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    passwordError = `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`;
  }

  return {
    email: validateEmailAddress(email),
    password: passwordError,
  };
}

export function hasValidationErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export function formatAuthMessage(error, context = "default") {
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
