export const getPeriodFromHour = (hour: number): keyof typeof PERIODS =>
  hour === 0
    ? "midnight"
    : hour >= 1 && hour < 4
      ? "pastMidnight"
      : hour >= 4 && hour < 6
        ? "dawn"
        : hour >= 6 && hour < 12
          ? "morning"
          : hour >= 12 && hour < 17
            ? "afternoon"
            : hour >= 17 && hour < 19
              ? "dusk"
              : hour >= 19 && hour < 21
                ? "evening"
                : "night";

const PERIODS = {
  dawn: true,
  morning: true,
  afternoon: true,
  dusk: true,
  evening: true,
  night: true,
  midnight: true,
  pastMidnight: true,
} as const;

export const getSmartGreeting = (userName?: string, serverHour?: number, t?: (key: string, options?: any) => string) => {
  const hour = typeof serverHour === "number" ? serverHour : new Date().getHours();
  const isLoggedIn = Boolean(userName);
  const n = userName ?? "";

  const getGreetingKey = (period: string) => {
    // Each period has anonymous greetings (always shown) and named greetings (logged-in only).
    // When logged out, only the anonymous pool is used — no awkward "Morning, you."
    const greetingKeys: { [key: string]: { anonymous: string[]; named: string[] } } = {
      dawn: {
        anonymous: [
          t ? t('chat.greeting_dawn') : "Up before the world.",
          t ? t('chat.greeting_dawn_3') : "The quiet before everything.",
          t ? t('chat.greeting_dawn_4') : "Something about dawn makes thinking easier.",
        ],
        named: [
          t ? t('chat.greeting_dawn_2', { name: n }) : `Early start, ${n}.`,
        ],
      },
      morning: {
        anonymous: [
          t ? t('chat.greeting_morning') : "Good morning.",
          t ? t('chat.greeting_morning_3') : "A fresh start.",
          t ? t('chat.greeting_morning_4') : "The day is open.",
        ],
        named: [
          t ? t('chat.greeting_morning_2', { name: n }) : `Morning, ${n}.`,
        ],
      },
      afternoon: {
        anonymous: [
          t ? t('chat.greeting_afternoon') : "Good afternoon.",
          t ? t('chat.greeting_afternoon_3') : "The day is moving.",
          t ? t('chat.greeting_afternoon_4') : "Still going. Good.",
        ],
        named: [
          t ? t('chat.greeting_afternoon_2', { name: n }) : `Afternoon, ${n}.`,
        ],
      },
      dusk: {
        anonymous: [
          t ? t('chat.greeting_dusk') : "That golden hour.",
          t ? t('chat.greeting_dusk_3') : "The day slows. The mind doesn't have to.",
          t ? t('chat.greeting_dusk_4') : "Dusk. A good time to think.",
        ],
        named: [
          t ? t('chat.greeting_dusk_2', { name: n }) : `Evening's coming, ${n}.`,
        ],
      },
      evening: {
        anonymous: [
          t ? t('chat.greeting_evening') : "Good evening.",
          t ? t('chat.greeting_evening_3') : "Evening thoughts tend to be the honest ones.",
          t ? t('chat.greeting_evening_4') : "Still at it. What's on your mind?",
        ],
        named: [
          t ? t('chat.greeting_evening_2', { name: n }) : `Evening, ${n}.`,
        ],
      },
      night: {
        anonymous: [
          t ? t('chat.greeting_night') : "Night. The quiet kind.",
          t ? t('chat.greeting_night_3') : "Most people are winding down. You're here.",
          t ? t('chat.greeting_night_4') : "The late hours have their own clarity.",
        ],
        named: [
          t ? t('chat.greeting_night_2', { name: n }) : `Late night, ${n}.`,
        ],
      },
      midnight: {
        anonymous: [
          t ? t('chat.greeting_midnight') : "Right at midnight.",
          t ? t('chat.greeting_midnight_3') : "A clean divide between days.",
          t ? t('chat.greeting_midnight_4') : "The day just flipped.",
        ],
        named: [
          t ? t('chat.greeting_midnight_2', { name: n }) : `Still here, ${n}.`,
        ],
      },
      pastMidnight: {
        anonymous: [
          t ? t('chat.greeting_pastMidnight') : "Past midnight.",
          t ? t('chat.greeting_pastMidnight_3') : "Still here. That says something.",
          t ? t('chat.greeting_pastMidnight_4') : "The small hours. Worth it.",
        ],
        named: [
          t ? t('chat.greeting_pastMidnight_2', { name: n }) : `Deep night, ${n}.`,
        ],
      },
    };

    const entry = greetingKeys[period] ?? greetingKeys.morning;
    return isLoggedIn
      ? [...entry.anonymous, ...entry.named]
      : entry.anonymous;
  };

  const period = getPeriodFromHour(hour);
  const periodGreetings = getGreetingKey(period);
  return periodGreetings[Math.floor(Math.random() * periodGreetings.length)];
};

export const getGreetingSubtitle = (serverHour?: number, t?: (key: string, options?: any) => string, isLoggedIn?: boolean) => {
  const hour = typeof serverHour === "number" ? serverHour : new Date().getHours();

  if (!isLoggedIn) {
    const loggedOutSubtitles = [
      t ? t('chat.subtitle_logged_out_1') : "Sign in to pick up where you left off.",
      t ? t('chat.subtitle_logged_out_2') : "Your conversations are waiting.",
      t ? t('chat.subtitle_logged_out_3') : "Everything's here. Sign in when you're ready.",
      t ? t('chat.subtitle_logged_out_4') : "Continue where you left off.",
    ];
    return loggedOutSubtitles[Math.floor(Math.random() * loggedOutSubtitles.length)];
  }

  const getSubtitleKey = (period: string) => {
    const subtitleKeys: { [key: string]: string[] } = {
      dawn: [
        "The world is still quiet. What's on your mind?",
        "A good hour for clear thinking.",
        "Early light, open page.",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      morning: [
        "What are we thinking about today?",
        "Let's make this one count.",
        "A good time to start something.",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      afternoon: [
        "The day is in full swing.",
        "What's next?",
        "Momentum is yours to use.",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      dusk: [
        "Between the day and the night.",
        "Good light for big thoughts.",
        "The day winds down. The mind doesn't have to.",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      evening: [
        "Time to reflect, plan, or just think.",
        "What's still on your mind?",
        "The day's done. What comes next?",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      night: [
        "Late nights have their own kind of focus.",
        "Quiet world. Loud thoughts.",
        "What brought you here tonight?",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      midnight: [
        "New day, new page.",
        "Right at the edge of yesterday and tomorrow.",
        "The midnight kind of quiet.",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
      pastMidnight: [
        "Not many people are awake right now.",
        "The small hours tend to clarify things.",
        "What's keeping you up?",
        t ? t('chat.ready_to_help') : "What would you like to explore?",
      ],
    };

    return subtitleKeys[period] || subtitleKeys.morning;
  };

  const period = getPeriodFromHour(hour);
  const periodSubtitles = getSubtitleKey(period);
  return periodSubtitles[Math.floor(Math.random() * periodSubtitles.length)];
};