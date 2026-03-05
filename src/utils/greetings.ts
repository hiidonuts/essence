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
  const n = userName || "you";

  const getGreetingKey = (period: string) => {
    const greetingKeys: { [key: string]: string[] } = {
      dawn: [
        t ? t('chat.greeting_dawn') : "First light,",
        t ? t('chat.greeting_dawn_2', { name: n }) : `${n} returns! Dawn edition`,
        t ? t('chat.greeting_dawn_3') : "Early bird. Big energy",
        t ? t('chat.greeting_dawn_4', { name: n }) : `Sky turning. ${n} ready`,
      ],
      morning: [
        t ? t('chat.greeting_morning') : "Rise and shine,",
        t ? t('chat.greeting_morning_2', { name: n }) : `${n} returns! Coffee time`,
        t ? t('chat.greeting_morning_3') : "Main character energy",
        t ? t('chat.greeting_morning_4') : "Fresh slate. Let's go",
      ],
      afternoon: [
        t ? t('chat.greeting_afternoon') : "Hey there,",
        t ? t('chat.greeting_afternoon_2', { name: n }) : `${n} returns! Power hour`,
        t ? t('chat.greeting_afternoon_3', { name: n }) : `Peak hours. ${n}'s zone`,
        t ? t('chat.greeting_afternoon_4') : "Halfway there. Still going",
      ],
      dusk: [
        t ? t('chat.greeting_dusk') : "Golden hour,",
        t ? t('chat.greeting_dusk_2', { name: n }) : `${n} returns! Golden hour`,
        t ? t('chat.greeting_dusk_3') : "Sunset hits different",
        t ? t('chat.greeting_dusk_4') : "Golden hour vibes",
      ],
      evening: [
        t ? t('chat.greeting_evening') : "It's getting late,",
        t ? t('chat.greeting_evening_2') : "Evening vibes",
        t ? t('chat.greeting_evening_3') : "Wind down or power through",
        t ? t('chat.greeting_evening_4') : "Lights low. Thoughts loud",
      ],
      night: [
        t ? t('chat.greeting_night') : "Night owl,",
        t ? t('chat.greeting_night_2', { name: n }) : `Night owl, ${n}`,
        t ? t('chat.greeting_night_3') : "Dark outside. Bright ideas",
        t ? t('chat.greeting_night_4', { name: n }) : `${n}'s night shift`,
      ],
      midnight: [
        t ? t('chat.greeting_midnight') : "Midnight,",
        t ? t('chat.greeting_midnight_2', { name: n }) : `${n}, midnight legend`,
        t ? t('chat.greeting_midnight_3', { name: n }) : `Clock reset. ${n} too`,
        t ? t('chat.greeting_midnight_4', { name: n }) : `Most are asleep. ${n} is building`,
      ],
      pastMidnight: [
        t ? t('chat.greeting_pastMidnight') : "Deep night,",
        t ? t('chat.greeting_pastMidnight_2') : "2am energy hits harder",
        t ? t('chat.greeting_pastMidnight_3', { name: n }) : `${n} on graveyard shift`,
        t ? t('chat.greeting_pastMidnight_4') : "Long night. Long focus",
      ],
    };

    return greetingKeys[period] || greetingKeys.morning;
  };

  const period = getPeriodFromHour(hour);
  const periodGreetings = getGreetingKey(period);
  return periodGreetings[Math.floor(Math.random() * periodGreetings.length)];
};

export const getGreetingSubtitle = (serverHour?: number, t?: (key: string, options?: any) => string) => {
  const hour = typeof serverHour === "number" ? serverHour : new Date().getHours();

  const getSubtitleKey = (period: string) => {
    const subtitleKeys: { [key: string]: string[] } = {
      dawn: [
        "The world is still asleep",
        "First light, first thoughts",
        "Silence before the rush",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      morning: [
        "Let us turn ideas into action",
        "The day is young and so is your focus",
        "Morning energy is real. Use it",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      afternoon: [
        "Peak productivity window",
        "Momentum is on your side",
        "The grind is paying off",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      dusk: [
        "When the light turns golden",
        "Day and night shake hands here",
        "Perfect light for thinking",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      evening: [
        "Time to unwind and think",
        "The day is done; the mind is still on",
        "Evening clarity hits different",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      night: [
        "When the best ideas come out",
        "Night owl hours",
        "Quiet world, loud thoughts",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      midnight: [
        "Clean slate, new day",
        "The witching hour for ideas",
        "Everyone else is asleep",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
      pastMidnight: [
        "The small hours",
        "When the world is off",
        "Late night clarity",
        t ? t('chat.ready_to_help') : "Ready to help you explore ideas",
      ],
    };

    return subtitleKeys[period] || subtitleKeys.morning;
  };

  const period = getPeriodFromHour(hour);
  const periodSubtitles = getSubtitleKey(period);
  return periodSubtitles[Math.floor(Math.random() * periodSubtitles.length)];
};
