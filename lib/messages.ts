// UI texts in Hebrew (ARCHITECTURE.md, section 2.4)
export const messages = {
  title: "מכונת הבדיחות",
  inputLabel: "על מה תרצו בדיחה?",
  placeholder: "על מה תרצו בדיחה? (אפשר להשאיר ריק)",
  button: "ספרו לי בדיחה",
  loading: "חושב על משהו מצחיק...",
  error: {
    offline: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.",
    general: "אופס, משהו השתבש. נסו שוב.",
  },
} as const;

export const MAX_TOPIC_LENGTH = 200;
