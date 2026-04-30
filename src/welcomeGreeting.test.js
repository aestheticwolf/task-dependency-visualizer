import { buildWelcomeBanner, getWelcomePeriod } from "./welcomeGreeting";

test("returns a morning greeting before noon", () => {
  expect(getWelcomePeriod(9)).toMatchObject({
    kicker: "Morning sync",
    title: "Good morning",
    icon: "☀️",
  });
});

test("returns an afternoon greeting after noon", () => {
  expect(getWelcomePeriod(14)).toMatchObject({
    kicker: "Afternoon sync",
    title: "Good afternoon",
    icon: "☕",
  });
});

test("returns an evening greeting after work hours", () => {
  expect(getWelcomePeriod(19)).toMatchObject({
    kicker: "Evening sync",
    title: "Good evening",
    icon: "🌙",
  });
});

test("builds a personalized banner copy", () => {
  const mockDate = { getHours: () => 23 };

  expect(buildWelcomeBanner("Richard", mockDate)).toEqual({
    kicker: "Late-night sync",
    greeting: "Good night,",
    name: "Richard",
    icon: "✨",
    detail: "Your workspace is ready whenever inspiration hits.",
  });
});
