# תוכנית – Milestone 4: התקנה כ-PWA ופתיחה ללא חיבור

מבוסס על: MILESTONES.md (Milestone 4), PRD.md (Flow 4, F5: FR5.1–FR5.3, טבלת מקרי הקצה: "אין חיבור"), ARCHITECTURE.md (סעיפים 1.1, 1.3, 2.9, 2.11, 2.12), DESIGN.md (סעיף 1.1 ו-2.4: Emblem, צבע Midnight).

תיעוד Next.js 16 שנבדק: `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md`, `.../03-file-conventions/01-metadata/manifest.md`, `.../04-functions/generate-metadata.md` (`appleWebApp`, `icons`).

---

## 1. מה קיים היום (רלוונטי ל-Milestone הזה)

- `app/layout.tsx`: `lang="he"`, `dir="rtl"`, גופנים דרך `next/font` (מוגשים מ-`/_next/static/media/*`), `viewport` עם `viewportFit: "cover"` ו-`themeColor: "#070a2e"`. ה-Metadata מכיל רק `title`.
- `app/page.tsx`: הריווח העליון והתחתון כבר כולל `env(safe-area-inset-*)`.
- `app/joke-machine.tsx`: בודק `navigator.onLine` לפני שליחה ומציג את הודעת "אין חיבור". אין צורך בשינוי בו.
- `app/emblem.tsx`: ה-Emblem כ-SVG (viewBox 64×64). זה מקור העיצוב לאייקונים.
- `next.config.ts`: `headers()` עם Security Headers לכל הנתיבים.
- `sharp` (גרסה 0.35.5) כבר מותקן ב-`node_modules` כתלות של Next.js.
- `.claude/launch.json`: רק תצורת `dev`.

---

## 2. קבצים ליצירה ולשינוי

| קובץ | פעולה | תוכן |
|---|---|---|
| `assets/app-icon.svg` | חדש | קובץ ה-SVG המקור היחיד לאייקונים |
| `scripts/generate-icons.mjs` | חדש | סקריפט שמייצר את קובצי ה-PNG מה-SVG בעזרת `sharp` |
| `public/icons/icon-192.png` | נוצר מהסקריפט | 192×192 |
| `public/icons/icon-512.png` | נוצר מהסקריפט | 512×512 |
| `public/icons/icon-maskable-512.png` | נוצר מהסקריפט | 512×512, `purpose: "maskable"` |
| `public/icons/apple-touch-icon.png` | נוצר מהסקריפט | 180×180 |
| `app/manifest.ts` | חדש | ה-Manifest (מוגש ב-`/manifest.webmanifest`, ו-Next.js מוסיף את ה-`<link>` אוטומטית) |
| `public/sw.js` | חדש | ה-Service Worker, נכתב ידנית |
| `app/service-worker-register.tsx` | חדש | Client Component שרושם את ה-SW ב-Production ושולח לו את רשימת הנכסים |
| `app/layout.tsx` | שינוי | `icons`, `appleWebApp` ב-Metadata, ורינדור רכיב הרישום |
| `next.config.ts` | שינוי | Header `Cache-Control: no-cache` ל-`/sw.js` |
| `package.json` | שינוי | `sharp` ב-`devDependencies` וסקריפט `icons` |
| `.claude/launch.json` | שינוי | תצורה נוספת `prod` (`npm run start`, פורט 3000) לבדיקה מקומית של ה-SW |

אין שינוי ב-`.gitignore` (קובצי ה-PNG נשמרים ב-Repository). אין משתני סביבה חדשים. אין שינוי ב-`lib/messages.ts` (אין טקסטים חדשים בממשק).

---

## 3. אייקונים

### 3.1 קובץ המקור `assets/app-icon.svg`
- viewBox 512×512, רקע מלא בצבע Midnight `#070A2E` (ריבוע מלא, בלי פינות מעוגלות; מערכת ההפעלה מעגלת בעצמה).
- במרכז: ה-Emblem בדיוק כמו ב-`app/emblem.tsx` (אותן צורות, אותם צבעים: מילוי Navy `#0E1450`, טבעת זהב `#E5B12E`, טבעת כסופה פנימית `#9AA3BC`, פרצוף מחייך בקו Gold Light `#F8DC7A` עם קצוות מעוגלים), בתוך `<g>` עם `transform` שמגדיל וממרכז אותו.
- ה-SVG לא כולל `filter` (זוהר), כי `sharp` לא מרנדר אותו באופן אמין ובגודל אייקון הוא לא נראה.
- קנה המידה של ה-Emblem נקבע לפי סוג האייקון (ראו 3.2). כדי לא לשכפל את הצורות, הסקריפט מקבל את ה-SVG כתבנית ומחליף בו את ערך קנה המידה (למשל placeholder `{{SCALE}}` בתוך ה-`transform`), או מקבל את ה-Emblem כ-`<g id="emblem">` ועוטף אותו. הבנייה בוחרת את הדרך הפשוטה מבין השתיים, ובלבד שיש **קובץ SVG מקור אחד**.

### 3.2 הגדלים
| קובץ | גודל | ה-Emblem תופס בערך | הסבר |
|---|---|---|---|
| `icon-192.png` | 192×192 | 84% מהרוחב | `purpose: "any"` |
| `icon-512.png` | 512×512 | 84% מהרוחב | `purpose: "any"` |
| `icon-maskable-512.png` | 512×512 | 64% מהרוחב | חייב להישאר בתוך ה-Safe Zone (עיגול בקוטר 80%), כי Android חותך את האייקון לצורות שונות |
| `apple-touch-icon.png` | 180×180 | 78% מהרוחב | iOS מעגל פינות; הרקע אטום (iOS ממלא שקיפות בשחור) |

### 3.3 הסקריפט `scripts/generate-icons.mjs`
- ESM פשוט: קורא את `assets/app-icon.svg`, מייצר לכל שורה בטבלה SVG עם קנה המידה המתאים, ומרנדר עם `sharp(Buffer.from(svg), { density })` → `.resize(size, size)` → `.png()` → `public/icons/<name>.png`.
- `package.json`: `"icons": "node scripts/generate-icons.mjs"`, ו-`"sharp": "^0.35.5"` ב-`devDependencies` (אותה גרסה שכבר מותקנת, כדי שהסקריפט לא יסתמך על תלות עקיפה).
- מריצים את הסקריפט פעם אחת בזמן הבנייה, וקובצי ה-PNG נשמרים ב-Repository. הסקריפט **לא** רץ ב-`next build` ולא ב-Vercel.
- אחרי ההרצה: לפתוח את ארבעת קובצי ה-PNG ולוודא בעין שהם נראים כמו ה-Emblem, ממורכזים ובלי חיתוך.

---

## 4. Manifest – `app/manifest.ts`

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מכונת הבדיחות",
    short_name: "מכונת הבדיחות",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "he",
    dir: "rtl",
    theme_color: "#070a2e",
    background_color: "#070a2e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

- הקובץ סטטי (בלי Request-time APIs), ולכן נשמר ב-Cache של Next.js ב-Build. אם `cacheComponents: true` דורש שינוי כלשהו בקובץ, לבדוק בתיעוד ולתעד.
- אין שדה `description` (לא מוגדר ב-spec).

---

## 5. Metadata ב-`app/layout.tsx`

תוספות ל-`metadata` הקיים:
- `icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" }`: ה-`apple-touch-icon` ל-iOS (ARCHITECTURE.md, סעיף 2.12), ואותו אייקון גם כ-favicon בלשונית הדפדפן.
- `appleWebApp: { capable: true, title: "מכונת הבדיחות", statusBarStyle: "black-translucent" }`:
  - `capable` מבטיח פתיחה במסך מלא ב-iOS (אם הטיפוס ב-Next.js 16 לא כולל `capable`, להסתפק ב-`title` ו-`statusBarStyle` ולבדוק בפלט ה-HTML ש-`mobile-web-app-capable` נוצר).
  - `black-translucent`: התוכן נפרס מתחת לשורת הסטטוס, והרקע הכהה ממשיך עד למעלה. הריווח הקיים עם `env(safe-area-inset-top)` מונע מהתוכן להיות מוסתר (תנאי ה-DoD של iOS).
- `themeColor` כבר קיים ב-`viewport` ונשאר כמו שהוא.
- רינדור `<ServiceWorkerRegister />` בתוך `<body>`.

---

## 6. Service Worker – `public/sw.js`

JavaScript רגיל (לא עובר Build), לפי ARCHITECTURE.md סעיף 2.9.

### 6.1 קבועים
- `CACHE_NAME = "joke-machine-v1"`. מעלים את המספר **רק** כששינוי ב-`sw.js` מחייב ניקוי Cache (לא בכל פריסה; ראו 6.6).
- `PRECACHE_URLS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/icons/apple-touch-icon.png"]`.

### 6.2 `install`
- `cache.addAll(PRECACHE_URLS)` בתוך `event.waitUntil`, ואז `self.skipWaiting()`.

### 6.3 `activate`
- מחיקת כל Cache ששמו שונה מ-`CACHE_NAME`, ואז `self.clients.claim()`, הכול בתוך `event.waitUntil`.

### 6.4 `fetch` – סדר הבדיקות
1. `request.method !== "GET"` → `return` (לא מיורט).
2. Origin אחר → `return`.
3. נתיב שמתחיל ב-`/api/` → `return`. הבקשה לא נוגעת ב-Cache בכלל.
4. `request.mode === "navigate"` → **Network-first**:
   - `fetch(request)`. אם התשובה `ok`, שומרים עותק ב-Cache תחת המפתח `"/"` (יש רק מסך אחד) ומחזירים אותה.
   - בכשל רשת: `caches.match("/")`. אם אין כלום ב-Cache, מחזירים את שגיאת הרשת המקורית (הדפדפן מציג את דף השגיאה הרגיל שלו).
5. נכס סטטי: הנתיב מתחיל ב-`/_next/static/` או ב-`/icons/`, או שהוא `/manifest.webmanifest` → **Cache-first**:
   - `caches.match(request)`. אם נמצא, מחזירים.
   - אחרת `fetch(request)`, ואם `ok` שומרים עותק ב-Cache ומחזירים.
6. כל השאר (למשל בקשות RSC של Next.js עם `?_rsc=`) → `return`. לא מיורט.

### 6.5 `message` – שמירת הנכסים מהביקור הראשון
- הודעה בפורמט `{ type: "CACHE_URLS", urls: string[] }`.
- סינון: רק כתובות מאותו Origin, ורק כאלה שעוברות את כלל 5 (נכסים סטטיים). כך `/api/*` וכתובות אחרות לא נשמרות גם אם יישלחו.
- שמירה של כל כתובת בנפרד (`cache.add(url).catch(() => {})`), כדי שכשל בקובץ אחד לא יבטל את השאר. הכול בתוך `event.waitUntil`.

### 6.6 עדכון גרסה (תנאי DoD: "גרסה חדשה בפתיחה הבאה")
- ה-HTML תמיד מגיע מהרשת כשיש חיבור (Network-first), ולכן אחרי פריסה הוא מפנה לקבצי ה-JS/CSS החדשים. לקבצים האלה יש Hash חדש בשם, כך שהם לא נמצאים ב-Cache ונטענים מהרשת.
- `sw.js` מוגש עם `no-cache`, והדפדפן בודק אותו בכל ניווט. לכן שינוי ב-`sw.js` עצמו נקלט, ו-`skipWaiting` + `clients.claim` מפעילים אותו מיד.
- מגבלה מקובלת: קבצים סטטיים של גרסאות קודמות נשארים ב-Cache עד שמעלים את `CACHE_NAME`. הקבצים קטנים, ויש מסך אחד בלבד.

---

## 7. רישום – `app/service-worker-register.tsx`

```tsx
"use client";
// Registers the service worker in production only (ARCHITECTURE.md, section 2.9)
```
- `useEffect` שרץ פעם אחת. יוצא מיד אם `process.env.NODE_ENV !== "production"` או אם `!("serviceWorker" in navigator)`.
- הרישום מתבצע אחרי שהדף נטען: אם `document.readyState === "complete"` רושמים מיד, אחרת מאזינים ל-`load` (ומסירים את המאזין ב-cleanup).
- `navigator.serviceWorker.register("/sw.js")`, ואז `navigator.serviceWorker.ready` → `registration.active?.postMessage({ type: "CACHE_URLS", urls })`.
- `urls`: `performance.getEntriesByType("resource")` → `entry.name` → רק אותו Origin (`new URL(name).origin === location.origin`). הסינון הסופי נעשה ב-SW (6.5).
- שגיאות רישום נבלעות בשקט (`.catch(() => {})`). האפליקציה עובדת גם בלי SW.
- הרכיב מחזיר `null`.

---

## 8. Headers – `next.config.ts`

הוספת רשומה ל-`headers()`:
```ts
{
  source: "/sw.js",
  headers: [{ key: "Cache-Control", value: "no-cache" }],
},
```
ה-Security Headers הקיימים (`/:path*`) ממשיכים לחול גם על `sw.js`. לא מוסיפים CSP (לא מוגדר ב-ARCHITECTURE.md).

---

## 9. החלטות לתיעוד כ-ADR ב-ARCHITECTURE.md

- **ADR-9: יצירת האייקונים בסקריפט חד-פעמי עם `sharp`, והקבצים נשמרים ב-Repository.** הקשר: ARCHITECTURE.md דורש אייקונים מקובץ SVG אחד, בלי לקבוע כלי. החלטה: `scripts/generate-icons.mjs` + `npm run icons`; לא רץ ב-Build. השלכות: שינוי באייקון = עריכת ה-SVG והרצת הסקריפט מחדש.
- **ADR-10: `statusBarStyle: "black-translucent"` ב-iOS.** הקשר: דרישת מסך מלא בלי שהתוכן יוסתר. החלטה ונימוק לפי סעיף 5. השלכות: ה-Safe Area padding הקיים הוא מה שמגן על התוכן.
- אם במהלך הבנייה מתקבלת החלטה משמעותית נוספת (למשל בגלל `cacheComponents`), לתעד גם אותה.

---

## 10. בדיקות בזמן הבנייה (מקומית)

ה-SW נרשם רק ב-Production, ולכן הבדיקה המקומית נעשית עם `npm run build` ואז `npm run start` (תצורת `prod` ב-`launch.json`). `localhost` נחשב לסביבה מאובטחת, כך שה-SW וה-Manifest עובדים גם בלי HTTPS.

1. `npm run build` ו-`npm run lint` עוברים בלי שגיאות.
2. `npm run dev`: ה-SW **לא** נרשם (`navigator.serviceWorker.getRegistration()` מחזיר `undefined`).
3. `npm run start`, ואז בדפדפן:
   - `/manifest.webmanifest` מחזיר את כל השדות מסעיף 4, וכל ארבעת האייקונים נטענים (200).
   - ה-HTML מכיל `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `<meta name="theme-color">` ותגיות ה-`apple-mobile-web-app-*`.
   - תשובת `/sw.js` כוללת `Cache-Control: no-cache` ואת ה-Security Headers.
   - ה-SW במצב `activated`, ו-Cache Storage מכיל את `/`, את האייקונים, את ה-Manifest ואת קובצי ה-JS, ה-CSS והגופנים (`.woff2`) של הביקור הראשון.
   - לחיצה על הכפתור (עם מפתח הפיתוח) מחזירה בדיחה, ו-`/api/joke` **לא** מופיע ב-Cache Storage. לחיצה נוספת מחזירה בדיחה חדשה.
   - מצב Offline (דרך DevTools/CDP), ואז רענון: המסך נטען עם העיצוב המלא (גופנים, צבעים, רקע), ולחיצה על הכפתור מציגה את הודעת "אין חיבור".
   - בדיקת Installability ב-Chrome (לשונית Application → Manifest): אין שגיאות. אם הכלים הזמינים לא מאפשרים לפתוח את DevTools, הבדיקה הזו מועברת למשתמש עם הוראות.
4. עדכון גרסה (סימולציה מקומית): שינוי טקסט זמני, `build` + `start` מחדש, פתיחה עם חיבור → הגרסה החדשה מוצגת. אחר כך מחזירים את השינוי.
5. רגרסיה של Milestones 2 ו-3 (מקומית): נושא בעברית ובאנגלית, תיבה ריקה, Enter, מצב טעינה, `400` לגוף לא תקין ולנושא ארוך, הודעת Offline.
6. סגירת השרת בסיום.

---

## 11. מה נבדק רק אחרי דחיפה ל-`main` (באישור המשתמש)

הבדיקות האלה דורשות את כתובת ה-Production (HTTPS) ומכשירים אמיתיים, ולכן הן נעשות אחרי שהמשתמש מאשר דחיפה (MILESTONES.md, כלל 7). בסיום הבנייה אכין למשתמש הדרכה צעד אחר צעד:
- **Android (Chrome):** פתיחת הכתובת → "התקנת אפליקציה" / "הוספה למסך הבית" → פתיחה מהאייקון במסך מלא, עם השם והאייקון.
- **iOS (Safari):** "שיתוף" → "הוספה למסך הבית" → פתיחה מהאייקון במסך מלא, והכותרת לא מוסתרת מתחת לשורת הסטטוס.
- **מצב טיסה:** אחרי פתיחה אחת עם חיבור, סגירה מלאה של האפליקציה, מצב טיסה, פתיחה מחדש → מסך מלא ומעוצב, ולחיצה מציגה "אין חיבור".
- **עדכון גרסה:** בדיקה בפריסה הבאה שאחרי ה-Milestone הזה (או בדחיפה של תיקון), שהאפליקציה המותקנת מציגה את הגרסה החדשה.

---

## 12. מחוץ לתחום

- אין כפתור התקנה ייעודי ואין הנחיה בממשק להתקנה (ARCHITECTURE.md, סעיף 1.3).
- אין יצירת בדיחות Offline, ואין באנר Offline (PRD, Out of Scope). לא משתמשים ב-`experimental.useOffline` של Next.js.
- אין Push Notifications, אין Splash Screens ייעודיים ל-iOS (`startupImage`) ואין ספריית PWA.
- אין שינוי במסך, בטקסטים או ב-API.

---

## 13. Definition of Done (מתוך MILESTONES.md) ואיך כל תנאי נבדק

| תנאי | איפה נבדק |
|---|---|
| Manifest תקין ומוצג כ-installable ב-DevTools | מקומית (`npm run start`) ושוב ב-Production |
| התקנה ב-Android, מסך מלא, שם ואייקון | Production, על ידי המשתמש עם הדרכה |
| iOS: הוספה למסך הבית, מסך מלא, תוכן לא מוסתר | Production, על ידי המשתמש עם הדרכה |
| פתיחה במצב טיסה אחרי ביקור אחד, עיצוב מלא והודעת "אין חיבור" | מקומית (Offline ב-DevTools), ואז במכשיר אמיתי ב-Production |
| `/api/joke` לא ב-Cache Storage, וכל לחיצה מחזירה בדיחה חדשה | מקומית ושוב ב-Production |
| גרסה חדשה מוצגת בפתיחה הבאה אחרי פריסה | מקומית (סימולציה), ובמלואה בפריסה הבאה |
| בדיקות ה-DoD של Milestones 2 ו-3 עדיין עוברות | מקומית, ושוב ב-Production אחרי הדחיפה |
