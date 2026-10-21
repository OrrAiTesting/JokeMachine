# תוכנית – Milestone 1: הקמת הפרויקט והפריסה האוטומטית

מבוסס על: `MILESTONES.md` (Milestone 1), `ARCHITECTURE.md` (סעיפים 1.1, 2.3, 2.10, 2.11, ADR-2, ADR-4), `DESIGN.md` (סעיפים 2.1, 2.2).

**מטרה:** שלד Next.js שרץ מקומית ומציג את הכותרת "מכונת הבדיחות" בעברית וב-RTL, עם הגופנים, צבעי ה-Style Guide כ-Design Tokens, Security Headers, `.env.example`, וחיבור ל-Vercel כך שכל Push ל-`main` נפרס אוטומטית.

**מחוץ לטווח של Milestone זה:** API (`/api/joke`), `joke-service`, `lib/messages.ts`, עיצוב המסך המלא, Manifest, Service Worker ואייקונים. אלה שייכים ל-Milestones 2–4. לא מתקינים עדיין את `@anthropic-ai/sdk` ואת `server-only`.

---

## 0. תנאי מקדים: Node.js

Node.js לא מותקן במחשב (בדיקה: `node` ו-`npm` לא נמצאו). בלי זה אי אפשר להריץ `npm install` / `npm run dev` / `npm run build`.

**פעולה של המשתמש (לפני תחילת הבנייה):**
1. להיכנס ל-https://nodejs.org ולהוריד את גרסת **LTS** ל-Windows (קובץ `.msi`).
2. להריץ את קובץ ההתקנה ולאשר את ברירות המחדל (כולל "Add to PATH").
3. לסגור ולפתוח מחדש את אפליקציית Claude, כדי שהפקודות `node` ו-`npm` יזוהו.

בתחילת הבנייה: לוודא `node -v` (גרסה 20.9 ומעלה, הדרישה של Next.js 16) ו-`npm -v`. אם עדיין לא מותקן — לעצור ולהגיד למשתמש.

---

## 1. יצירת שלד הפרויקט

שורש הפרויקט כבר מכיל `CLAUDE.md`, `spec/`, `.gitignore` ו-`.git`, ולכן `create-next-app` לא ירוץ ישירות בו (הוא מסרב לתיקייה עם קבצים קיימים).

**גישה:**
1. להריץ `create-next-app` בתיקייה זמנית ב-scratchpad:
   `npx create-next-app@16 joke-machine --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes`
   (אם דגל מסוים לא קיים בגרסה המותקנת — להשמיט אותו ולענות על השאלות לפי אותן בחירות.)
2. להעתיק לשורש הפרויקט את כל הקבצים שנוצרו, **חוץ מ:** `.gitignore` (לא מחליפים את הקיים), `README.md`, `node_modules/`, `.git/`.
3. להריץ `npm install` בשורש הפרויקט.
4. למחוק מ-`public/` את קובצי ה-SVG לדוגמה של התבנית (`next.svg`, `vercel.svg` וכו'), ואת `app/favicon.ico` של Next.js. (זה ניקוי של קבצי תבנית שנוצרו זה עתה — לא מידע של המשתמש.)
5. לוודא ב-`package.json`: `next` בגרסה 16.x, `tailwindcss` בגרסה 4.x, וסקריפטים `dev`, `build`, `start`, `lint`.

**`.gitignore`:** הקובץ הקיים כבר מכסה `node_modules/`, `.next/`, `.env`, `.env.*` (עם `!.env.example`), `*.tsbuildinfo`, `.vercel/`. להוסיף רק את מה שחסר מתוך ה-`.gitignore` של התבנית, אם יש (למשל `next-env.d.ts`). לא להסיר שורות.

---

## 2. קבצים ליצור / לשנות

| קובץ | פעולה | תוכן |
|---|---|---|
| `app/layout.tsx` | שינוי | ראו 2.1 |
| `app/page.tsx` | החלפה | ראו 2.2 |
| `app/globals.css` | החלפה | ראו 2.3 |
| `next.config.ts` | שינוי | ראו 2.4 |
| `.env.example` | חדש | ראו 2.5 |
| `.env` | חדש (העתקה חד-פעמית של `.env.example`) | ראו 2.5 |
| `.gitignore` | הוספת שורות בלבד, אם חסרות | ראו סעיף 1 |
| `CLAUDE.md` | מילוי סעיף "פקודות הרצה" | ראו 2.6 |
| `spec/MILESTONES.md` | סימון 🟡 ליד כותרת Milestone 1 בסיום הבנייה | – |

### 2.1 `app/layout.tsx` – מעטפת האפליקציה
- `<html lang="he" dir="rtl">`.
- גופנים דרך `next/font/google`:
  - `Heebo` — `subsets: ["hebrew", "latin"]`, משקלים 400, 500, 700, `variable: "--font-heebo"`, `display: "swap"`.
  - `Frank_Ruhl_Libre` — `subsets: ["hebrew", "latin"]`, משקל 900, `variable: "--font-frank"`, `display: "swap"`.
  - שני המשתנים מוצמדים ל-`<html>` דרך `className`.
- `export const metadata: Metadata = { title: "מכונת הבדיחות" }` (בלבד — description, manifest ו-icons שייכים ל-Milestones הבאים).
- `<body>` עם רקע Midnight וגופן Heebo כברירת מחדל (דרך המחלקות של ה-tokens).
- בלי רישום Service Worker ובלי `viewport-fit=cover` (שייכים ל-Milestones 2 ו-4).

### 2.2 `app/page.tsx` – דף זמני
- Server Component פשוט (אין צורך ב-`"use client"`).
- מציג `<h1>` עם הטקסט **מכונת הבדיחות** בלבד, ממורכז במסך.
- סגנון בסיסי בכיוון ה-Display של DESIGN.md 2.2: גופן Frank Ruhl Libre במשקל 900, גודל 40px / גובה שורה 46px, צבע Gold. (גרדיאנט הזהב והזוהר המלאים — ב-Milestone 2.)
- הטקסט מוקלד ישירות בקובץ. `lib/messages.ts` יווצר ב-Milestone 2, וכשייווצר הכותרת תעבור אליו.

### 2.3 `app/globals.css` – Design Tokens (Tailwind 4)
ב-Tailwind 4 אין `tailwind.config`; ה-tokens מוגדרים ב-CSS:

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-midnight: #070A2E;
  --color-navy: #0E1450;
  --color-indigo: #1C2380;
  --color-royal-purple: #3A2A8F;
  --color-spotlight: #3D7BFF;
  /* Accents & text */
  --color-gold-light: #F8DC7A;
  --color-gold: #E5B12E;
  --color-gold-deep: #9C6B12;
  --color-white: #FFFFFF;
  --color-silver: #DCE1EC;
  --color-silver-400: #9AA3BC;
  --color-coral: #F07167;
  /* Fonts (variables come from next/font in layout.tsx) */
  --font-sans: var(--font-heebo), system-ui, sans-serif;
  --font-display: var(--font-frank), serif;
}
```

- כך נוצרות מחלקות כמו `bg-midnight`, `text-gold`, `font-display`.
- **הערה:** השם `indigo` דורס את סקאלת ה-`indigo-*` המובנית של Tailwind רק בשם `indigo` עצמו (בלי מספר) — זה בסדר, הסקאלה המובנית לא בשימוש.
- גרדיאנטים (Gold Gradient, Glow, רקע כרטיס) — לא ב-Milestone זה; יוגדרו ב-Milestone 2 כשמשתמשים בהם.
- להסיר מקובץ התבנית את משתני `--background`/`--foreground` ואת ה-`prefers-color-scheme: dark` של התבנית — האפליקציה תמיד כהה לפי ה-Style Guide.

### 2.4 `next.config.ts` – Security Headers
לפי ARCHITECTURE.md 2.10, דרך `headers()` לכל הנתיבים (`source: "/:path*"`):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

(ה-Header של `sw.js` מתווסף ב-Milestone 4.)

### 2.5 `.env.example` ו-`.env`
`.env.example`:
```
# Anthropic API key (server-side only; never prefix with NEXT_PUBLIC_)
ANTHROPIC_API_KEY=
# Optional: model override (default: claude-sonnet-5-5)
ANTHROPIC_MODEL=
```
- להעתיק **פעם אחת** ל-`.env` (רק אם `.env` עדיין לא קיים). לא לקרוא את `.env` אחר כך.
- לוודא ש-`git check-ignore .env` מחזיר את הקובץ (כלומר הוא מוחרג), ו-`.env.example` לא מוחרג.
- להגיד למשתמש למלא את מפתח ה-Development ב-`.env` (המפתח לא נדרש להרצה ב-Milestone הזה, אבל כדאי שיהיה מוכן ל-Milestone 2).

### 2.6 `CLAUDE.md` – פקודות הרצה
למלא את הסעיף הקיים:
- **הרצה (dev):** `npm run dev` (ואז לפתוח http://localhost:3000)
- **בדיקות (test):** אין (בדיקה: `npm run build` ו-`npm run lint`)

---

## 3. בדיקה עצמית בזמן הבנייה (מקומית)

1. `npm run build` — עובר בלי שגיאות.
2. `npm run lint` — עובר.
3. `npm run dev`, ואז בדפדפן המובנה http://localhost:3000:
   - הכותרת **מכונת הבדיחות** מוצגת, ממורכזת, על רקע Midnight.
   - ב-HTML: `<html lang="he" dir="rtl">`.
   - הגופן המחושב של הכותרת הוא Frank Ruhl Libre (בדיקה דרך `getComputedStyle` ו-`document.fonts`).
4. Security Headers מקומית: בדיקת Headers של תשובת `/` (למשל דרך בקשת רשת בדפדפן) — שלושתם קיימים.
5. `git status` — `.env` לא מופיע; `.env.example` מופיע כקובץ חדש.
6. לסגור את שרת ה-dev בסיום.

---

## 4. פעולות של המשתמש (הדרכה צעד אחר צעד בסיום הבנייה)

אלה מתבצעים על ידי המשתמש. ההדרכה תינתן בשפה פשוטה, צעד אחר צעד:

1. **Node.js** — ראו סעיף 0 (לפני הבנייה).
2. **Anthropic Console** (https://console.anthropic.com):
   - יצירת חשבון (אם אין).
   - יצירת שני API Keys: `joke-machine-dev` ו-`joke-machine-prod`.
   - הגדרת Spend Limit חודשי (Settings → Limits).
   - מפתח ה-Dev — הדבקה בקובץ `.env` במחשב, בשורה `ANTHROPIC_API_KEY=`. **לא להדביק בשיחה.**
3. **Vercel** (https://vercel.com):
   - הרשמה עם חשבון GitHub.
   - Add New → Project → Import של `OrrAiTesting/JokeMachine`. Vercel מזהה Next.js אוטומטית; לא משנים הגדרות Build.
   - Settings → Environment Variables: `ANTHROPIC_API_KEY` עם מפתח ה-Prod, סביבה **Production בלבד**, מסומן **Sensitive**.
   - לוודא ב-Settings → Git ש-Production Branch הוא `main`.
   - הערה: אם ה-Import מתבצע לפני שיש קוד ב-`main`, הפריסה הראשונה תיכשל — זה צפוי; היא תצליח אחרי הדחיפה.

---

## 5. דחיפה והבדיקות על Production

לפי CLAUDE.md, הדחיפה נעשית רק כשהמשתמש מבקש ("דחוף שינויים לגיטהאב"). ה-repo כבר מחובר ל-`https://github.com/OrrAiTesting/JokeMachine.git`.

אחרי הדחיפה (ורק אחריה) בודקים את סעיפי ה-DoD שדורשים את האתר הפרוס:
- ש-Vercel יצר פריסה אוטומטית מה-Push והכתובת הציבורית מציגה את הכותרת.
- שה-Security Headers מופיעים בתשובת ה-HTTP של הכתובת הפרוסה (למשל `curl -I <כתובת>`).
- שהמשתמש מאשר שמפתח ה-Prod מוגדר ב-Vercel ושה-Spend Limit מוגדר.

---

## 6. מיפוי ל-Definition of Done

| תנאי DoD | איך מתקיים | מתי נבדק |
|---|---|---|
| `npm run dev` מציג את הכותרת, RTL, בגופן Frank Ruhl Libre | 2.1–2.3 | בבנייה (סעיף 3) |
| `npm run build` עובר בלי שגיאות | סעיף 1–2 | בבנייה |
| Push ל-`main` מעדכן את Production אוטומטית | חיבור Vercel (4.3) | אחרי הדחיפה |
| `.env` לא ב-Repository, `.env.example` קיים בלי ערכים | 2.5 + `.gitignore` קיים | בבנייה (git status), ושוב אחרי הדחיפה ב-GitHub |
| מפתח Prod ב-Vercel ו-Spend Limit ב-Anthropic — המשתמש מאשר | 4.2–4.3 | אישור המשתמש |
| Security Headers בתשובת ה-HTTP של האתר הפרוס | 2.4 | מקומית בבנייה, וסופית אחרי הדחיפה |

---

## 7. נקודות לתשומת לב בבנייה
- הערות בקוד באנגלית בלבד.
- לא להוסיף פיצ'רים מעבר לרשום כאן (אין API, אין manifest, אין SW).
- לא לבצע commit או push.
- אם `create-next-app@16` מייצר מבנה שונה מהצפוי (למשל דגלים שהשתנו), להתאים בלי לשנות את הבחירות: TypeScript, App Router, Tailwind 4, בלי `src/`, alias `@/*`, npm.
- אין צורך ב-ADR חדש — כל ההחלטות כבר מתועדות ב-ARCHITECTURE.md. אם במהלך הבנייה תתקבל החלטה טכנית משמעותית חדשה, לתעד כ-ADR-6.
