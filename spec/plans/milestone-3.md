# תוכנית – Milestone 3: טיפול בשגיאות ובמקרי קצה

**מקורות:** MILESTONES.md (Milestone 3), PRD.md (Flow 3, סעיף 4.ב), ARCHITECTURE.md (סעיפים 2.4, 2.5, 2.6, 2.10, ADR-5, ADR-8), DESIGN.md (סעיפים 1.1, 2.3) ו-`style-guide.png` (Card · Message).

**מצב הקוד היום (בסוף Milestone 2):**
- `app/api/joke/route.ts` כבר מבצע ולידציה ומחזיר `400 invalid_request` (JSON לא תקין, `topic` שאינו מחרוזת, נושא ארוך מ-200 תווים). כל שגיאה אחרת מחזירה `500 server_error`, בלי הבחנה ובלי Log.
- `lib/joke-service.ts` יוצר Client בלי `timeout` ו-`maxRetries`, וזורק `Error` רגיל כשאין מפתח או כשהתשובה ריקה.
- `app/joke-machine.tsx` מציג תמיד את ההודעה הכללית בתוך Card · Joke. אין בדיקת `navigator.onLine`, אין Timeout בצד הלקוח, ואין Card · Message.
- הטקסטים `error.offline` ו-`error.general` כבר קיימים ב-`lib/messages.ts`.

אין חבילות חדשות, אין משתני סביבה חדשים ואין שינוי במסמכי ה-spec.

---

## 1. Backend

### 1.1 `lib/joke-service.ts`
- **הגדרות ה-Client** (ADR-5): להוסיף ל-`new OpenAI({...})` את `timeout: 12_000` ו-`maxRetries: 1`. `baseURL` הקבוע (ADR-7) נשאר.
- **שגיאות מוגדרות** שהמודול מייצא, כדי שה-Route יוכל למפות אותן:
  - `MissingApiKeyError`: כשאין `OPENAI_API_KEY`. ממופה ל-`500 server_error` (סעיף 2.6: "API Key לא מוגדר").
  - `EmptyResponseError`: כש-`output_text` ריק אחרי `trim()`. ממופה ל-`502 empty_response`.
- שגיאות ה-SDK (`OpenAI.APIError` ותת-המחלקות שלה: `APIConnectionError`, `APIConnectionTimeoutError`, `AuthenticationError` וכו') לא נתפסות במודול, ועוברות ל-Route כמו שהן.

### 1.2 `app/api/joke/route.ts`
- להחליף את ה-`catch` הכללי במיפוי לפי ARCHITECTURE.md, סעיף 2.6:

| שגיאה | תשובה |
|---|---|
| `EmptyResponseError` | `502 { "error": "empty_response" }` |
| `OpenAI.APIError` (כולל שגיאות חיבור ו-Timeout) | `502 { "error": "ai_error" }` |
| `MissingApiKeyError` וכל שגיאה אחרת | `500 { "error": "server_error" }` |

- הסדר חשוב: `EmptyResponseError` ← `APIError` ← כל השאר.
- **Log בצד השרת** (`console.error`), שורה אחת לכל שגיאה, עם שני שדות בלבד:
  - `type`: שם המחלקה של השגיאה (למשל `AuthenticationError`, `APIConnectionTimeoutError`, `EmptyResponseError`).
  - `status`: הסטטוס של OpenAI אם קיים (`error.status`), ואחרת הסטטוס שהוחזר ללקוח.
  - לא רושמים את `error.message`, את אובייקט השגיאה, את הנושא, את הבדיחה או את המפתח. הודעות השגיאה של ה-SDK עלולות לכלול חלק מהמפתח או פרטי בקשה, ולכן הן לא נרשמות.
  - שגיאות `400 invalid_request` לא נרשמות. הן קלט לא תקין, לא תקלה.
- גוף התשובה ללקוח מכיל רק את שדה `error`, בלי פרטים פנימיים.
- `maxDuration = 60` נשאר, וההערה על ADR-6 נשארת.

---

## 2. Frontend

### 2.1 `app/joke-machine.tsx` – לוגיקה
- **סוג התוצאה:** `{ kind: "joke"; text } | { kind: "error"; reason: "offline" | "general" } | null`.
- **לפני השליחה:** אם `navigator.onLine === false` → מציגים מיד `error.offline`, בלי `fetch`, בלי מעבר למצב טעינה.
- **Timeout:** `AbortController` שמבוטל אחרי 30 שניות (`setTimeout`), עם `signal` ב-`fetch`. ה-Timer מנוקה ב-`finally`.
- **מיפוי תוצאות** (ARCHITECTURE.md, סעיף 2.6):
  - `fetch` נכשל עם `TypeError` (כשל רשת) → `error.offline`.
  - ביטול בגלל ה-Timeout (`AbortError`) → `error.general`.
  - תשובה שאינה `200` → `error.general`. את הגוף לא צריך לקרוא.
  - תשובת `200` שהגוף שלה לא JSON תקין או בלי `joke` → `error.general`.
- `inFlight` ו-`loading` מתאפסים ב-`finally`, כך שאחרי כל שגיאה הכפתור חוזר להיות פעיל (Flow 3).
- בזמן טעינה הכרטיס הקודם (בדיחה **או** הודעה) נשאר מוצג, כמו היום.
- להסיר את ההערה "Offline/timeout handling comes in Milestone 3".

### 2.2 `app/joke-machine.tsx` – תצוגה
- **Card · Joke**: ללא שינוי.
- **Card · Message** (DESIGN.md, סעיף 2.3 ו-`style-guide.png`), מוצג במקום Card · Joke כשיש שגיאה:
  - אותה צורה: פינות 22px, רקע `bg-card`, ריווח פנימי 24px.
  - מסגרת Alert Coral (`coral`) בעובי 2px במקום גרדיאנט הזהב. **בלי** הזוהר הכחול.
  - אייקון התראה: עיגול עם סימן קריאה, SVG בקו של 1.8px עם קצוות מעוגלים, בצבע Coral, `aria-hidden="true"`. ממוקם בצד ההתחלה (מימין ב-RTL), לפני הטקסט, ומיושר אנכית לשורה הראשונה.
  - הטקסט: Body · Joke (Heebo 18/29, לבן), מיושר לימין. ההודעות בעברית, ולכן אין צורך ב-`dir="auto"`.
- שני הכרטיסים נשארים בתוך אזור ה-`aria-live="polite"` הקיים, כך שקורא מסך מקריא גם את הודעת השגיאה.
- כדי לשמור על הקובץ קריא, אפשר להוציא את האייקון לקומפוננטה קטנה (`AlertIcon`) באותו קובץ.

### 2.3 `lib/messages.ts`
- ללא שינוי. הטקסטים כבר קיימים.

---

## 3. בדיקות שאריץ בעצמי (מקומית)

ההרצה המקומית נעשית עם `npm run dev`, וסוגרים אותה בסיום. את `.env` לא קוראים ולא משנים.

| # | בדיקה | איך |
|---|---|---|
| 1 | `npm run build` ו-`npm run lint` עוברים | פקודות |
| 2 | גוף לא תקין → `400 invalid_request` | `curl` עם גוף שאינו JSON, עם `topic` מספרי ועם מערך |
| 3 | נושא של 201 תווים → `400`, בלי פנייה למודל | `curl`, ובדיקה ב-Log שלא נרשמה שגיאה ולא נשלחה בקשה |
| 4 | מפתח שגוי → `502 ai_error` והודעה כללית במסך | שרת נוסף על פורט אחר, עם `OPENAI_API_KEY=invalid` במשתנה סביבה של הפקודה בלבד (משתנה סביבה של התהליך גובר על `.env`, וכך `.env` לא נוגעים בו) |
| 5 | מפתח חסר → `500 server_error` | אותו דבר עם ערך ריק. אם Next.js ממלא ערך ריק מתוך `.env`, הבדיקה תיעשה עם משתנה סביבה שמכוון לתיקייה בלי `.env`, או תסומן כבדיקה שהמשתמש מבצע |
| 6 | ה-Log מכיל רק `type` ו-`status` | קריאת הפלט של השרת אחרי בדיקות 4–5 |
| 7 | Offline → הודעת "אין חיבור", בלי בקשה | בדפדפן המובנה: הדמיית `navigator.onLine = false`, ובדיקה ברשימת הבקשות שלא נשלחה בקשה ל-`/api/joke` |
| 8 | כשל רשת ב-`fetch` → הודעת "אין חיבור" | עצירת השרת בזמן שהדף פתוח ולחיצה על הכפתור |
| 9 | Timeout של 30 שניות → הודעה כללית | בדפדפן המובנה: החלפה זמנית של `fetch` בבקשה שלא מסתיימת עד שמבטלים אותה, ומדידת הזמן עד ההודעה |
| 10 | אחרי כל שגיאה הכפתור פעיל, וניסיון חוזר מצליח | אחרי בדיקות 7–9: חזרה למצב תקין ולחיצה |
| 11 | Card · Message תואם לעיצוב | צילום מסך ברוחב 375px מול `style-guide.png` |
| 12 | Milestone 2 עדיין עובד | "חתולים", תיבה ריקה, "cats", Enter, חסימת לחיצה כפולה |

---

## 4. בדיקות שהמשתמש מבצע

- **מקומית, ב-DevTools של Chrome:** מצב Offline, ופרופיל האטת רשת מותאם עם השהיה של יותר מ-30 שניות (בדיקת ה-Timeout כפי שמוגדרת ב-Definition of Done).
- **אחרי אישור הדחיפה ל-`main`:** מצב טיסה בטלפון מול כתובת ה-Production, ובדיקה ב-Vercel Logs שלא מופיעים נושאים, בדיחות או המפתח. אדריך צעד אחר צעד.

---

## 5. Definition of Done – איך כל סעיף נבדק

| סעיף | נבדק ב- |
|---|---|
| Offline מציג "אין חיבור" בלי לשלוח בקשה | בדיקה 7 (אני), DevTools/מצב טיסה (המשתמש) |
| מפתח שגוי או חסר → הודעה כללית, בלי פרטים פנימיים | בדיקות 4–5 |
| Timeout מציג הודעה כללית תוך 30 שניות לכל היותר | בדיקה 9 (אני), פרופיל האטה ב-DevTools (המשתמש) |
| גוף לא תקין → `400 invalid_request` | בדיקה 2 |
| נושא ארוך מ-200 תווים → `400`, בלי פנייה למודל | בדיקה 3 |
| אחרי שגיאה הכפתור פעיל וניסיון חוזר מצליח | בדיקה 10 |
| אין נושאים, בדיחות או מפתח ב-Logs | בדיקה 6 (מקומית), Vercel Logs אחרי הדחיפה |
| Milestone 2 עדיין עובר | בדיקה 12 |

---

## 6. קבצים

| קובץ | שינוי |
|---|---|
| `lib/joke-service.ts` | `timeout`, `maxRetries`, שתי מחלקות שגיאה מיוצאות |
| `app/api/joke/route.ts` | מיפוי שגיאות ל-`502`/`500` ו-Log מצומצם |
| `app/joke-machine.tsx` | `navigator.onLine`, `AbortController`, מיפוי שגיאות, Card · Message ואייקון התראה |
| `spec/MILESTONES.md` | סימון 🟡 ליד Milestone 3 בסיום הבנייה |

לא צפוי ADR חדש. אם בבנייה תתקבל החלטה טכנית משמעותית (למשל דרך אחרת לבדוק מפתח חסר), היא תתועד כ-ADR-9.
