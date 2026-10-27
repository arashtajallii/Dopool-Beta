# 🏃‍♂️ Dopool (دوپول) — Move-to-Earn Fitness & Activity Tracker PWA

اپلیکیشن وب پیشرفته (PWA) **دوپول (Dopool)**؛ پلتفرم هوشمند ورزش و پاداش که فعالیت‌های ورزشی (دویدن، دوچرخه‌سواری و پیاده‌روی) شما را از فایل‌های استاندارد ورزشی (`GPX`, `FIT`, `TCX`) تحلیل کرده، روی نقشه نمایش می‌دهد، سکه‌های دوپول پاداش می‌دهد و استوری‌های ورزشی حرفه‌ای برای اینستاگرام می‌سازد.

---

## ✨ امکانات کلیدی (Features)

- **🔐 احراز هویت و امنیت ابری (Firebase Auth & Firestore):**
  - ورود امن با حساب گوگل (Google Sign-In)
  - ذخیره‌سازی ابری آنی پروفایل، سکه‌ها، تاریخچه فعالیت‌ها و کدهای دعوت در پایگاه داده **Cloud Firestore**
  - قوانین امنیتی Zero-Trust (`firestore.rules`) و تشخیص تقلب با هش رمزنگاری‌شده **SHA-256** برای جلوگیری از ثبت تکراری فایل‌های ورزشی
- **🗺️ تحلیل فایل‌های ورزشی و نقشه حرارتی (Heatmap):**
  - پشتیبانی از فایل‌های `GPX`، `TCX` و `FIT` (خروجی ساعت‌های گارمین، اپل واچ، استراوا و سامسونگ)
  - استخراج دقیق مسافت، زمان حرکت، سرعت/پیس، کالری، ارتفاع و ضربان قلب
- **📸 استودیو ساخت استوری اینستاگرام (9:16 Story Generator):**
  - طراحی اختصاصی در ابعاد استوری (`9:16`) با مسیر واقعی نقشه فعالیت شما
  - قالب‌های **Aura Minimal**، **Magazine**، **Gold** و حالت **Transparent (شفاف روی عکس شخصی)** با قابلیت دانلود مستقیم تصویر باکیفیت (`PNG`)
- **🪙 سیستم پاداش، چالش‌ها و فروشگاه:**
  - جوایز شروع، چالش‌های هفتگی، جدول رده‌بندی (Leaderboard) و تبدیل سکه به کدهای تخفیف
- **📱 قابلیت نصب به عنوان اپلیکیشن (PWA):**
  - قابل نصب روی Android، iOS و دسکتاپ بدون نیاز به اپ‌استور

---

## 🛠️ تکنولوژی‌ها (Tech Stack)

- **Frontend:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS 4 + Lucide Icons
- **Backend & Security:** Firebase Authentication + Cloud Firestore (`firestore.rules`)
- **Maps & Visualization:** Leaflet + HTML5 Canvas (Instagram Story Renderer)

---

## 🚀 راه‌اندازی و اجرا روی سیستم شخصی (Local Development)

### ۱. پیش‌نیازها
- نصب بودن [Node.js](https://nodejs.org/) (نسخه 20 یا بالاتر)
- نصب بودن Git

### ۲. دریافت پروژه و نصب پکیج‌ها
```bash
git clone https://github.com/YOUR_USERNAME/dopool.git
cd dopool
npm install
```

### ۳. اجرای سرور توسعه (Development)
```bash
npm run dev
```
سپس آدرس `http://localhost:3000` را در مرورگر باز کنید.

### ۴. ساخت نسخه نهایی (Production Build)
```bash
npm run build
```
خروجی نهایی در پوشه `dist/` ساخته می‌شود.

---

## 🌐 انتشار رایگان در GitHub Pages یا Vercel

### روش اول: انتشار خودکار در GitHub Pages
این مخزن دارای فایل `.github/workflows/deploy.yml` است. کافیست:
1. کدها را در شاخه `main` گیت‌هاب Push کنید.
2. در مخزن گیت‌هاب به بخش **Settings > Pages** بروید.
3. زیر بخش **Build and deployment**، گزینه **Source** را روی **GitHub Actions** قرار دهید.
4. با هر بار Push، اپلیکیشن به صورت خودکار ساخته و منتشر می‌شود.

### روش دوم: انتشار در Vercel
1. وارد [vercel.com](https://vercel.com) شوید و مخزن گیت‌هاب خود را Import کنید.
2. تنظیمات Framework Preset به صورت خودکار روی **Vite** قرار می‌گیرد.
3. دکمه **Deploy** را بزنید.

---

## 🔒 نکته مهم برای ورود گوگل (Firebase Authorized Domains)

پس از انتشار پروژه روی دامنه جدید (مثلاً `username.github.io` یا `dopool.vercel.app`)، برای اینکه ورود با گوگل روی آدرس جدید کار کند:
1. وارد [Firebase Console](https://console.firebase.google.com/) شوید و پروژه `silent-depot-12w8r` را باز کنید.
2. به منوی **Authentication > Settings > Authorized domains** بروید.
3. روی **Add domain** کلیک کنید و دامنه سایت منتشرشده خود را اضافه نمایید.
