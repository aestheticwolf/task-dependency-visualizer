import {
  PASSWORD_MIN_LENGTH,
  formatAuthMessage,
  hasValidationErrors,
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
    email: "person@example.com",
    password: "12345",
  });

  expect(errors.password).toBe(
    `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`
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
