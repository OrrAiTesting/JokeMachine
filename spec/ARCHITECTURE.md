# ARCHITECTURE – מכונת הבדיחות

מסמך זה מתרגם את דרישות [PRD.md](PRD.md) לתכנון טכני. הוא מתאר את ה-Technology Stack שנבחר ואת ארכיטקטורת המערכת.

---

## 1. Technology Stack שנבחר

### 1.1 טבלת רכיבים

| תחום | טכנולוגיה | תפקיד |
|---|---|---|
| שפת פיתוח | TypeScript | שפה אחת ל-Frontend ול-Backend, עם בדיקת טיפוסים |
| Framework | Next.js 16 (App Router) | מסך יחיד (Frontend) ו-Route Handler (Backend) באותו פרויקט |
| UI | React (מגיע עם Next.js) | רכיבי הממשק והניהול של מצבי המסך |
| עיצוב | Tailwind CSS 4 | עיצוב Mobile-first ו-RTL |
| גופן | `next/font` עם גופן עברי (Heebo) | הגופן נארז ב-Build ומוגש מהאתר עצמו, ולכן זמין גם בלי חיבור |
| PWA – Manifest | `app/manifest.ts` (יכולת מובנית ב-Next.js) | שם, אייקונים ותצוגת standalone |
| PWA – Service Worker | קובץ `public/sw.js` שנכתב ידנית, ללא ספרייה | טעינת מעטפת האפליקציה ללא חיבור (FR5.3) |
| Backend Runtime | Vercel Functions (Node.js LTS, Fluid compute) | הרצת ה-Route Handler שפונה למודל ה-AI |
| שירות AI | Anthropic Claude API, מודל `claude-opus-5-5` | יצירת הבדיחות |
| AI SDK | `@anthropic-ai/sdk` (ה-SDK הרשמי ל-TypeScript) | פנייה ל-Claude API מה-Backend |
| ניהול קוד | Git, Repository ב-GitHub | ניהול גרסאות ומקור לפריסה האוטומטית |
| Hosting ו-CI/CD | Vercel (Git Integration) | Build ופריסה אוטומטיים מ-GitHub, HTTPS ו-CDN |
| Database | **אין** | ה-PRD אוסר מסד נתונים, ולכן אין Supabase |
| Authentication | **אין** | ה-PRD לא כולל משתמשים או התחברות |

### 1.2 נימוקים להחלטות המרכזיות

- **Next.js על Vercel, ולא Frontend סטטי עם שרת נפרד.** ה-PRD דורש Backend שמחזיק את ה-API Key, ולכן GitHub Pages (סטטי בלבד) לא מספיק. Next.js מאפשר לכתוב את המסך ואת נקודת הקצה ב-Backend באותו פרויקט, ו-Vercel (היצרן של Next.js) פורס את שניהם יחד בלי הגדרות נוספות. חלופות שנבחנו:
  - **Vite + React עם Vercel Functions:** נדרשת תצורה נפרדת ל-Functions.
  - **Astro:** פחות נפוץ בפרויקטים עם Backend.
  
  שתי החלופות אפשריות, אבל Next.js הוא הנפוץ ביותר, הכי מתועד, ונוח במיוחד לפיתוח בעזרת AI.
- **Vercel Functions מתאים למודל ההרצה.** קריאה ליצירת בדיחה נמשכת שניות בודדות, והיא בטווח מגבלת זמן הריצה (300 שניות גם בתוכנית Hobby). זמן ההמתנה למודל ה-AI לא נספר כזמן CPU פעיל, ולכן העלות נמוכה. גודל הבקשה והתשובה (טקסט קצר) רחוק ממגבלת ה-4.5MB.
- **Service Worker ידני במקום ספרייה.** הדרישה היא רק שמעטפת האפליקציה תיטען בלי חיבור (FR5.3). קובץ Service Worker של כמה עשרות שורות מכסה את זה, בלי תלות ב-Serwist ובלי שינויי Build. התיעוד הרשמי של Next.js מציג Serwist רק כאופציה לתמיכת Offline מלאה, שלא נדרשת כאן.
- **Claude API עם `claude-opus-5-5`.** זה המודל הנוכחי שמומלץ כברירת מחדל ב-Anthropic. הוא כותב היטב בעברית ובאנגלית, ויודע לזהות את שפת הקלט ולענות בה (FR3.4). הפנייה מתבצעת עם ה-SDK הרשמי ל-TypeScript. שם המודל נקבע במשתנה סביבה, כדי שאפשר יהיה להחליף אותו בלי לשנות קוד (ראו סעיף 1.3).
- **Tailwind CSS.** נפוץ מאוד ותומך ב-Logical Properties (`ms-`/`me-`, `start`/`end`) שמתאימים ל-RTL. רוב כלי ה-AI מכירים אותו היטב.
- **אין Database, Authentication או אחסון קבצים.** בהתאם לאילוצי ה-PRD. לכן אין צורך ב-Supabase, בסביבות Database או ב-Migrations.

### 1.3 סיכונים, מגבלות והסתייגויות

| נושא | פירוט | התמודדות |
|---|---|---|
| **עלות ה-AI ללא הגבלה** | ה-PRD קובע שאין Rate Limiting ואין הגבלת אורך קלט. מי שיודע את כתובת ה-API יכול לשלוח בקשות רבות או ארוכות ולייצר חיוב. במחירון הנוכחי `claude-opus-5-5` עולה 4$ למיליון Tokens בקלט ו-20$ למיליון Tokens בפלט, כלומר בדיחה בודדת עולה כסנט. | הגדרת **Spend Limit** חודשי בחשבון Anthropic (Console), שמגביל את הנזק הכספי בלי לשנות את המוצר. שינוי המודל לזול יותר (למשל `claude-haiku-5-5`) הוא החלטה עסקית שלך, ואפשר לבצע אותה בעדכון משתנה הסביבה `ANTHROPIC_MODEL` בלבד. |
| **תוכנית Vercel Hobby** | Hobby מיועדת לשימוש אישי ולא מסחרי בלבד. חריגה ממגבלות השימוש עלולה לגרום להשהיית החשבון. | אם המוצר מסחרי (פרסומות, קידום שירות, תשלום על הפיתוח), נדרשת תוכנית Pro. |
| **iOS ו-PWA** | ב-Safari על iOS אין כפתור התקנה אוטומטי. ההתקנה נעשית דרך "שיתוף" ואז "הוספה למסך הבית". | המנגנון המובנה של הדפדפן מספיק לדרישת ה-PRD (Flow 4). לא מוסיפים כפתור התקנה ייעודי. |
| **סירוב של המודל** | Claude עשוי לסרב לבקשות מסוימות (`stop_reason: "refusal"`). במקרה כזה התשובה עשויה להגיע בלי טקסט. | טקסט סירוב שהמודל מחזיר מוצג כמו שהוא (FR4.3). תשובה ללא טקסט מטופלת כ"תשובה ריקה", ומוצגת הודעת השגיאה הכללית. |
| **תלות בשירות חיצוני** | כשה-Claude API לא זמין, אי אפשר ליצור בדיחות. | הודעת השגיאה הכללית וניסיון חוזר על ידי המשתמש, בהתאם ל-PRD. |

---

## 2. ארכיטקטורת המערכת

### 2.1 מבנה כללי

```
┌──────────────────────── דפדפן המשתמש (מובייל) ────────────────────────┐
│                                                                        │
│   מסך יחיד (React Client Component)      Service Worker (public/sw.js) │
│   ─ תיבת טקסט, כפתור, אזור תוצאה          ─ Cache למעטפת האפליקציה      │
│   ─ ניהול מצבים: idle/loading/            ─ לא מתערב בבקשות /api/*      │
│     success/error                                                      │
│              │ POST /api/joke  (HTTPS, JSON)                           │
└──────────────┼─────────────────────────────────────────────────────────┘
               ▼
┌──────────────────────────── Vercel ────────────────────────────────────┐
│   CDN: נכסים סטטיים (HTML, JS, CSS, גופן, אייקונים, manifest)           │
│                                                                        │
│   Vercel Function: Route Handler  app/api/joke/route.ts                │
│   ─ ולידציה ונרמול של הקלט                                              │
│   ─ בניית ההנחיה למודל                                                  │
│   ─ קריאה ל-Claude API עם ANTHROPIC_API_KEY (משתנה סביבה בשרת בלבד)    │
│   ─ מיפוי התשובה או השגיאה לפורמט אחיד                                  │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ HTTPS (Anthropic SDK)
               ▼
        Anthropic Claude API
```

### 2.2 רכיבים ואחריות

| רכיב | אחריות | אינו אחראי על |
|---|---|---|
| **מסך ראשי (Client)** | הצגת הממשק בעברית וב-RTL, ניהול מצבי המסך, שליחת הבקשה, הצגת הבדיחה או השגיאה, מיפוי קודי שגיאה לטקסטים בעברית | גישה ל-AI, החזקת סודות |
| **Layout ו-Metadata (Server)** | `<html lang="he" dir="rtl">`, טעינת הגופן, כותרת, `theme-color`, קישור ל-manifest | לוגיקה עסקית |
| **Manifest** | שם "מכונת הבדיחות", אייקונים, `display: standalone`, `start_url: "/"`, `lang: "he"`, `dir: "rtl"` | – |
| **Service Worker** | שמירה ב-Cache ושליפה של מעטפת האפליקציה, כדי שהיא תיפתח גם בלי חיבור | יצירת בדיחות Offline, Cache לבקשות API |
| **Route Handler `/api/joke`** | ולידציה, בניית ההנחיה, קריאה ל-Claude, טיפול בשגיאות ו-Timeout, החזרת JSON אחיד | שמירת נתונים מכל סוג |
| **מודול AI (Server-only)** | אתחול לקוח Anthropic, הגדרת המודל והפרמטרים, הגדרת ה-System Prompt | ממשק משתמש |

### 2.3 Modules ושכבות לוגיות

```
app/
  layout.tsx            ← שכבת מעטפת: lang/dir, גופן, metadata, רישום Service Worker
  page.tsx              ← שכבת תצוגה: המסך היחיד (Client Component)
  manifest.ts           ← PWA Manifest
  api/joke/route.ts     ← שכבת API: קלט ← לוגיקה ← תשובה
lib/
  joke-service.ts       ← שכבת לוגיקה (server-only): בניית ההנחיה וקריאה ל-Claude
  messages.ts           ← טקסטי הממשק בעברית ומיפוי קודי שגיאה להודעות
public/
  sw.js                 ← Service Worker
  icons/                ← אייקוני PWA (192, 512, maskable, apple-touch-icon)
```

**כללי תלות:**
- `page.tsx` תלוי רק ב-`messages.ts` ובפורמט ה-API (סעיף 2.6). הוא לא מייבא את `joke-service.ts`.
- `joke-service.ts` מסומן `import "server-only"`. כך Next.js נכשל ב-Build אם קוד Client מנסה לייבא אותו, וזה מונע זליגה של ה-API Key.
- `route.ts` הוא שכבה דקה: ולידציה, קריאה ל-`joke-service`, והמרה של התוצאה ל-HTTP.

### 2.4 מבנה ה-Frontend

**מצבי המסך (State Machine):**

| מצב | תצוגה | כפתור |
|---|---|---|
| `idle` | אזור התוצאה ריק | פעיל |
| `loading` | הטקסט "חושב על משהו מצחיק..." | מושבת |
| `success` | טקסט הבדיחה | פעיל |
| `error` | הודעת שגיאה לפי הקוד (`offline` או `general`) | פעיל |

**כללי התנהגות:**
- התיבה והכפתור נמצאים בתוך `<form>`, כך ש-Enter שולח את הבקשה. בזמן `loading` שליחה נוספת נחסמת (FR2.2).
- הנושא נשאר בתיבה אחרי קבלת תשובה (FR1.4). בדיחה חדשה מחליפה את הקודמת (FR4.2).
- **כיווניות:** אזור הבדיחה מקבל `dir="auto"`, כך שבדיחה באנגלית מוצגת LTR ובדיחה בעברית RTL. כדי לשמור על שבירות השורה שהמודל יצר, משתמשים ב-`white-space: pre-line`.
- הבדיחה מוצגת כטקסט רגיל ולא כ-HTML, כך שאין סיכון XSS מתשובת המודל.
- אזור התוצאה מסומן `aria-live="polite"`, כדי שקורא מסך יקריא את הבדיחה כשהיא מגיעה.
- **בדיקת חיבור:** לפני השליחה נבדק `navigator.onLine`. אם אין חיבור, מוצגת הודעת "אין חיבור" בלי לשלוח בקשה. אם `fetch` נכשל ברמת הרשת (`TypeError`), מוצגת אותה הודעה.
- **Timeout בצד הלקוח:** `AbortController` עם 30 שניות. בחריגה מוצגת הודעת השגיאה הכללית.
- **עיצוב:** Mobile-first, עמודה אחת ברוחב מוגבל במסכים רחבים. גודל מינימלי לרכיבי מגע הוא 44px, והטקסט של הבדיחה גדול ובריווח נוח. משתמשים ב-Logical Properties של Tailwind כדי שהמיקום יתאים ל-RTL.

**טקסטי הממשק** (מרוכזים ב-`lib/messages.ts`, בהתאם ל-PRD):

| מפתח | טקסט |
|---|---|
| `title` | מכונת הבדיחות |
| `placeholder` | על מה תרצו בדיחה? (אפשר להשאיר ריק) |
| `button` | ספרו לי בדיחה |
| `loading` | חושב על משהו מצחיק... |
| `error.offline` | אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב. |
| `error.general` | אופס, משהו השתבש. נסו שוב. |

### 2.5 מבנה ה-Backend

**Route Handler: `POST /api/joke`**
- Runtime: Node.js (ברירת המחדל), עם `export const maxDuration = 60`.
- `export const dynamic = "force-dynamic"`, כדי ש-Next.js ו-Vercel לא ישמרו תשובות ב-Cache. כל בקשה מייצרת בדיחה חדשה (FR2.3).

**מודול `joke-service`: הקריאה ל-Claude**

| פרמטר | ערך | הסבר |
|---|---|---|
| `model` | `process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5"` | מאפשר להחליף מודל בלי לשנות קוד |
| `max_tokens` | 2000 | מספיק לבדיחה וגם לחשיבה הפנימית של המודל |
| `output_config.effort` | `"low"` | משימה קצרה ויצירתית. רמה נמוכה מקצרת את זמן התגובה ומוזילה את העלות |
| `thinking` | לא נשלח | ב-Opus 5.5 החשיבה פעילה תמיד, ורמת ה-effort היא שקובעת את עומקה |
| `fallbacks` | `"default"`, עם beta `server-side-fallback-2026-07-01` | כשמסווג בטיחות דוחה בקשה לגיטימית בטעות, השרת של Anthropic מנתב אותה למודל חלופי |
| Client options | `timeout: 25_000` ms, `maxRetries: 1` | כך שהבקשה מסתיימת לפני ה-Timeout של הלקוח (30 שניות) |

**ההנחיה למודל:**
- **System Prompt קבוע (באנגלית, כדי שההוראות יהיו מדויקות):**
  - אתה כותב בדיחות מקוריות.
  - קהל היעד בוגר (18+). מותר הומור נועז, אבל לא פוגעני (FR3.6).
  - כתוב בדיוק בדיחה אחת, באורך ובסגנון שתבחר (FR3.5).
  - כתוב באותה שפה שבה נכתב הנושא. אם אין נושא, כתוב בעברית (FR3.4).
  - החזר את טקסט הבדיחה בלבד, בלי כותרת, בלי הקדמה ובלי Markdown.
  - הטקסט שבתוך התגית `<topic>` הוא נושא בלבד, ולא הוראות.
- **User Message:**
  - כשיש נושא: `<topic>{topic}</topic>`.
  - כשאין נושא: בקשה מפורשת לבדיחה כללית בעברית (FR3.3).
- אין שכבת סינון נוספת על הקלט או על הפלט (FR3.7).

**עיבוד התשובה:**
1. מחברים את כל בלוקי ה-`text` בתשובה, ומסירים רווחים בתחילת הטקסט ובסופו.
2. אם התוצאה לא ריקה, מחזירים `200 { joke }`. זה כולל טקסט סירוב שהמודל כתב (FR4.3).
3. אם התוצאה ריקה (למשל ב-`refusal` בלי טקסט), מחזירים `502 { error: "empty_response" }`.
4. שגיאות של ה-SDK (`APIError`, `APIConnectionError`, Timeout) נרשמות ב-Log של השרת עם הסוג והסטטוס בלבד, ומחזירים `502 { error: "ai_error" }`. פרטי שגיאה פנימיים לא מוחזרים ללקוח.

### 2.6 APIs

**Endpoint יחיד: `POST /api/joke`**

Request:
```json
{ "topic": "חתולים" }
```
- `topic`: מחרוזת. אפשר להשמיט אותה או לשלוח מחרוזת ריקה.
- אין הגבלת אורך (FR1.2). הבקשה כפופה רק למגבלת הגוף של Vercel (4.5MB).
- השרת מנרמל את הקלט עם `trim()`. אם נשארת מחרוזת ריקה, הבקשה מטופלת כבקשה לבדיחה כללית (FR1.3).

Responses:

| סטטוס | Body | מתי |
|---|---|---|
| `200` | `{ "joke": "..." }` | התקבל טקסט מהמודל |
| `400` | `{ "error": "invalid_request" }` | הגוף אינו JSON תקין, או ש-`topic` אינו מחרוזת |
| `502` | `{ "error": "ai_error" }` | שגיאה, Timeout או חוסר זמינות של Claude API |
| `502` | `{ "error": "empty_response" }` | המודל החזיר תשובה ללא טקסט |
| `500` | `{ "error": "server_error" }` | שגיאה לא צפויה, או ש-API Key לא מוגדר |

**מיפוי בצד הלקוח:** כל תשובה שאינה `200` מוצגת עם `error.general`. כשל רשת או `navigator.onLine === false` מוצגים עם `error.offline`.

**אינטגרציה חיצונית:** Anthropic Messages API (`POST /v1/messages`) דרך `@anthropic-ai/sdk`. זו האינטגרציה החיצונית היחידה.

### 2.7 Data Model

**אין מסד נתונים ואין שמירה מתמשכת של נתונים בשרת.** הנתונים קיימים רק בזמן ריצה:

| ישות | היכן קיימת | משך חיים |
|---|---|---|
| `JokeRequest { topic?: string }` | גוף בקשת ה-HTTP | בקשה אחת |
| `JokeResponse { joke: string }` או `{ error: ErrorCode }` | גוף תשובת ה-HTTP ו-State של React | עד הבקשה הבאה או עד רענון המסך |
| `ErrorCode = "invalid_request" \| "ai_error" \| "empty_response" \| "server_error"` | חוזה ה-API | – |

**אחסון מקומי בדפדפן:** רק Cache Storage של ה-Service Worker, ובו נכסים סטטיים של מעטפת האפליקציה. לא נשמרים בו בדיחות, נושאים או היסטוריה. לא משתמשים ב-`localStorage`.

### 2.8 Data Flow

**בקשת בדיחה (Flow 1 ו-Flow 2 ב-PRD):**
1. המשתמש לוחץ על הכפתור או על Enter. המסך עובר ל-`loading` והכפתור מושבת.
2. הלקוח בודק `navigator.onLine`. אם אין חיבור, הוא עובר ל-`error(offline)` והתהליך נעצר.
3. `fetch("POST /api/joke", { topic })` נשלח עם `AbortController` של 30 שניות. ה-Service Worker לא מתערב בבקשה.
4. ה-Route Handler מבצע ולידציה ו-`trim()`, ואז קורא ל-`joke-service`.
5. `joke-service` שולח ל-Claude את ה-System Prompt ואת הנושא (או את הבקשה לבדיחה כללית), עם המפתח מ-`process.env.ANTHROPIC_API_KEY`.
6. Claude מחזיר את הבדיחה. השרת מחלץ את הטקסט ומחזיר `200 { joke }`.
7. הלקוח עובר ל-`success` ומציג את הבדיחה עם `dir="auto"`. הכפתור חוזר להיות פעיל.
8. בכל כשל, בשלבים 3 עד 6, הלקוח עובר ל-`error` עם ההודעה המתאימה, והכפתור חוזר להיות פעיל (Flow 3).

**פתיחת האפליקציה ללא חיבור (Edge case ב-PRD):**
1. הדפדפן מבקש את `/`, וה-Service Worker מנסה קודם את הרשת.
2. הרשת נכשלת, וה-Service Worker מחזיר את `/` מה-Cache. גם נכסי JS, CSS, הגופן והאייקונים מוגשים מה-Cache.
3. המסך נטען כרגיל. לחיצה על הכפתור מגיעה לשלב 2 בתהליך הקודם, ומוצגת הודעת "אין חיבור".

### 2.9 Service Worker: אסטרטגיית Cache

| סוג בקשה | אסטרטגיה |
|---|---|
| Navigation (`/`) | **Network-first**: מנסים קודם את הרשת ומעדכנים את ה-Cache. בכשל מחזירים את הגרסה השמורה |
| `/_next/static/*`, גופנים, `/icons/*`, manifest | **Cache-first**: קבצים עם Hash בשם, שלא משתנים |
| `/api/*` | **לא מיורט.** הבקשה עוברת ישירות לרשת ואינה נשמרת ב-Cache |
| בקשות `POST` ובקשות ל-Origin אחר | לא מיורטות |

- ב-`install`, ה-Service Worker שומר מראש את `/` ואת האייקונים.
- ב-`activate`, הוא מוחק Caches של גרסאות קודמות (שם ה-Cache כולל מספר גרסה) וקורא ל-`clients.claim()`.
- הרישום מתבצע מצד הלקוח (`navigator.serviceWorker.register("/sw.js")`) רק ב-Production, כדי שלא יפריע לפיתוח.
- `sw.js` מוגש עם `Cache-Control: no-cache`, כדי שגרסאות חדשות ייקלטו מיד. ההגדרה נעשית דרך `headers()` ב-`next.config.ts`.

### 2.10 Authentication, Authorization, אבטחה ופרטיות

**Authentication ו-Authorization:** אין. ה-Endpoint ציבורי, בהתאם ל-PRD.

**אבטחת ה-API Key:**
- `ANTHROPIC_API_KEY` נשמר כמשתנה סביבה ב-Vercel ומסומן כ-**Sensitive**. בפיתוח מקומי הוא נשמר ב-`.env.local`.
- שם המשתנה **לא** מתחיל ב-`NEXT_PUBLIC_`, ולכן Next.js לא מכניס אותו לקוד שנשלח לדפדפן.
- `import "server-only"` במודול שמשתמש במפתח.
- `.env*.local` נמצא ב-`.gitignore`, כך שהמפתח לא נכנס ל-Repository. ב-Repository נשמר רק `.env.example` עם שמות המשתנים, בלי ערכים.
- המפתח לא מופיע בתשובות API, בהודעות שגיאה או ב-Logs.

**אבטחה כללית:**
- HTTPS בכל הסביבות (Vercel מספק אותו אוטומטית). זה גם תנאי להתקנת PWA.
- Security Headers דרך `next.config.ts`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- הבדיחה מוצגת כטקסט רגיל, ולא נעשה שימוש ב-`dangerouslySetInnerHTML`.
- **Prompt Injection:** הנושא נשלח בתוך התגית `<topic>`, וה-System Prompt מגדיר אותו כנתון ולא כהוראה. ההשפעה מוגבלת בכל מקרה: אין למודל כלים, אין נתונים רגישים בהקשר, והפלט מוצג רק למשתמש ששלח את הבקשה.
- **שימוש לרעה ועלויות:** אין Rate Limiting, בהתאם ל-PRD. ההגנה היחידה היא Spend Limit בחשבון Anthropic (ראו סעיף 1.3).

**פרטיות:**
- אין Cookies, אין Analytics ואין זיהוי משתמשים.
- הנושא נשלח ל-Anthropic לצורך יצירת הבדיחה בלבד (כפי שמצוין ב-PRD).
- השרת לא רושם את תוכן הנושא או את הבדיחה ב-Logs. נרשמים רק סוג השגיאה והסטטוס.

### 2.11 תשתיות, Hosting, פריסה ותצורה

**ניהול קוד:**
- Repository יחיד ב-GitHub שמכיל את כל הפרויקט (Frontend ו-Backend).
- ענף `main` הוא ענף ה-Production.

**פריסה אוטומטית (Vercel Git Integration):**

| אירוע ב-GitHub | תוצאה ב-Vercel |
|---|---|
| Push או Merge ל-`main` | Build ופריסה אוטומטית ל-**Production** |
| Push לכל ענף אחר או פתיחת Pull Request | **Preview Deployment** אוטומטי עם כתובת ייחודית לבדיקה |

- Vercel מזהה את Next.js אוטומטית, ולכן לא נדרש קובץ `vercel.json`.
- ה-Build מורץ ב-Vercel (`next build`) ולא במחשב המשתמש. אין תהליך פריסה ידני.
- Region של ה-Functions: ברירת המחדל (`iad1`). השרתים של Anthropic נמצאים בארה"ב, ולכן Region אמריקאי מקצר את זמן הקריאה למודל.

**סביבות ומשתני סביבה:**

| משתנה | Development (מקומי) | Preview (Vercel) | Production (Vercel) | הערות |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | ב-`.env.local`. מפתח נפרד לפיתוח | מפתח הפיתוח | מפתח Production. נשמר **רק** ב-Vercel | Sensitive, בצד השרת בלבד |
| `ANTHROPIC_MODEL` | אופציונלי | אופציונלי | אופציונלי | ברירת המחדל היא `claude-opus-5-5` |

- מומלץ ליצור שני API Keys נפרדים ב-Anthropic Console (פיתוח ו-Production). כך אפשר להחליף או לבטל אחד מהם בלי לפגוע בשני, ולעקוב אחרי העלות של כל סביבה בנפרד.
- כל שינוי במשתני הסביבה ב-Vercel נכנס לתוקף רק בפריסה הבאה (Redeploy).

**הרצה מקומית לבדיקה:** `npm install`, יצירת `.env.local` לפי `.env.example`, ואז `npm run dev`. לא נדרשים Docker, Database או שירותים מקומיים נוספים. בדיקת התקנה כ-PWA והתנהגות ה-Service Worker נעשית על Preview Deployment, שרץ ב-HTTPS כמו בסביבה האמיתית.

### 2.12 החלטות טכניות נוספות

- **PWA Icons:** אייקונים בגדלים 192×192 ו-512×512, גרסת `maskable` עבור Android, ו-`apple-touch-icon` (180×180) עבור iOS.
- **`theme-color` ו-`background_color`:** מוגדרים ב-Manifest וב-metadata, כדי שהמסך יופיע עם צבעי האפליקציה בעת הפתיחה כאפליקציה מותקנת.
- **אין Streaming של התשובה:** הבדיחה קצרה, וההצגה שלה בבת אחת מתאימה ל-Flow שהוגדר ב-PRD (טעינה ואז תוצאה). כך הקוד פשוט יותר.
- **נגישות:** `lang="he"`, `<label>` לתיבת הטקסט (מוסתר ויזואלית, הטקסט הנראה הוא ה-placeholder), `aria-live` לאזור התוצאה, ו-`aria-busy` בזמן טעינה.
- **תמיכה בדפדפנים:** כל מה שנבחר (Next.js 16, Service Worker, Web App Manifest) נתמך בגרסאות העדכניות של Chrome ב-Android, Safari ב-iOS ודפדפני Desktop הנפוצים, בהתאם להנחה שב-PRD.

---

## מקורות

- [Next.js – How to build a PWA (תיעוד רשמי)](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Next.js Blog – גרסאות 16.x](https://nextjs.org/blog)
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)
- [Vercel – Fair Use Guidelines (שימוש מסחרי ב-Hobby)](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel – Hobby Plan](https://vercel.com/docs/plans/hobby)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Anthropic – Pricing](https://www.anthropic.com/pricing)
