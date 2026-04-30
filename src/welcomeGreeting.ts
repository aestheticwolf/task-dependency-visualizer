type WelcomePeriod = {
  kicker: string;
  title: string;
  icon: string;
  detail: string;
};

type WelcomeBanner = {
  kicker: string;
  greeting: string;
  name: string;
  icon: string;
  detail: string;
};

type HourSource = {
  getHours(): number;
};

function normalizeHour(hour: number): number {
  if (!Number.isFinite(hour)) return 9;
  return ((Math.trunc(hour) % 24) + 24) % 24;
}

export function getWelcomePeriod(hour: number): WelcomePeriod {
  const safeHour = normalizeHour(hour);

  if (safeHour < 5) {
    return {
      kicker: "Late-night sync",
      title: "Good night",
      icon: "✨",
      detail: "Your workspace is ready whenever inspiration hits.",
    };
  }

  if (safeHour < 12) {
    return {
      kicker: "Morning sync",
      title: "Good morning",
      icon: "☀️",
      detail: "Your dashboard is ready for a focused start.",
    };
  }

  if (safeHour < 17) {
    return {
      kicker: "Afternoon sync",
      title: "Good afternoon",
      icon: "☕",
      detail: "Everything is lined up for your next push.",
    };
  }

  if (safeHour < 22) {
    return {
      kicker: "Evening sync",
      title: "Good evening",
      icon: "🌙",
      detail: "Your task graph is synced for a smooth wrap-up.",
    };
  }

  return {
    kicker: "Late-night sync",
    title: "Good night",
    icon: "✨",
    detail: "Your workspace is ready whenever inspiration hits.",
  };
}

export function buildWelcomeBanner(name: string, date: HourSource = new Date()): WelcomeBanner {
  const displayName = String(name || "").trim() || "there";
  const period = getWelcomePeriod(date.getHours());

  return {
    kicker: period.kicker,
    greeting: `${period.title},`,
    name: displayName,
    icon: period.icon,
    detail: period.detail,
  };
}
