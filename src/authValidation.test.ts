import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  formatAuthMessage,
  getPasswordStrength,
  hasValidationErrors,
  normalizeDisplayName,
  validateDisplayName,
  validateEmailAddress,
  validateLoginForm,
  validateSignupForm,
} from "./authValidation";

test("validates missing login fields with professional messages", () => {
  const errors = validateLoginForm({ email: "", password: "" });

  expect(errors).toEqual({
    email: "Enter your email address.",
    password: "Enter your password.",
  });
  expect(hasValidationErrors(errors)).toBe(true);
});

test("rejects invalid email addresses", () => {
  expect(validateEmailAddress("not-an-email")).toBe("Enter a valid email address.");
  expect(validateEmailAddress("person@example.com")).toBe("");
});

test("validates signup password length", () => {
  const errors = validateSignupForm({
    name: "Test User",
    email: "person@example.com",
    password: "12345",
  });

  expect(errors.password).toBe(
    `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`
  );
});

test("grades password strength for security indicators", () => {
  expect(getPasswordStrength("abc")).toEqual({ level: 1, label: "Weak" });
  expect(getPasswordStrength("abcdef12")).toEqual({ level: 2, label: "Fair" });
  expect(getPasswordStrength("Abcdef1234")).toEqual({ level: 3, label: "Good" });
  expect(getPasswordStrength("Abcdef12!@")).toEqual({ level: 4, label: "Strong" });
});

test("requires a valid signup display name", () => {
  const errors = validateSignupForm({
    name: " ",
    email: "person@example.com",
    password: "123456",
  });

  expect(errors.name).toBe("Enter your full name.");
  expect(hasValidationErrors(errors)).toBe(true);
});

test("normalizes and validates professional display names", () => {
  expect(normalizeDisplayName("  richard    roe  ")).toBe("richard roe");
  expect(validateDisplayName("R")).toBe("Use at least 2 characters for your name.");
  expect(validateDisplayName("Richard Roe")).toBe("");
  expect(validateDisplayName("A".repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toBe(
    `Use ${DISPLAY_NAME_MAX_LENGTH} characters or fewer for your name.`
  );
});

test("maps common Firebase auth errors to friendly copy", () => {
  expect(formatAuthMessage({ code: "auth/invalid-credential" }, "login")).toBe(
    "Incorrect email or password. Please try again."
  );
  expect(formatAuthMessage({ code: "auth/email-already-in-use" }, "signup")).toBe(
    "An account with this email already exists. Sign in instead or reset your password."
  );
  expect(formatAuthMessage({ code: "auth/too-many-requests" }, "passwordReset")).toBe(
    "Too many reset requests were made. Please wait a moment and try again."
  );
});
