// Comprehensive Persian <-> English Translation Engine for Dopool PWA

const EXACT_MAP: Record<string, string> = {
  // Brand & Header
  'دوپول | Dopool': 'Dopool',
  'اپلیکیشن ورزشی دوپول': 'Dopool Running App',
  'پلتفرم دویدن و کسب درآمد ورزشی ایران · Move-to-Earn': 'Move-to-Earn Running & Fitness Rewards Platform',
  'دوپول': 'Dopool',
  'هر گام شما، یک سکه طلایی دوپول در کیف پول ورزشی': 'Every step earns golden Dopool coins in your fitness wallet',
  'در حال آماده‌سازی کیف پول ورزشی شما...': 'Preparing your fitness wallet...',
  'اعلان‌ها': 'Notifications',
  'منوی امکانات': 'Menu',

  // Auth / Login / Register
  'ورود به دوپول': 'Sign In to Dopool',
  'ویژه کاربران فعال': 'For Registered Runners',
  'آیدی کاربری (ID)': 'Username (ID)',
  'رمز عبور': 'Password',
  'فراموشی رمز؟': 'Forgot Password?',
  'ورود': 'Sign In',
  'ورود دو مرحله‌ای با شماره همراه': '2FA Mobile Verification',
  'کد دو مرحله‌ای پیامکی': '2FA SMS Code',
  'ارسال کد': 'Send Code',
  'ارسال مجدد': 'Resend',
  'کد ۴ رقمی': '4-Digit Code',
  'کد تایید ۴ رقمی': '4-Digit OTP Code',
  'فعال برای شماره': 'Active for',
  'ثبت‌نام کاربر جدید': 'Create New Account',
  'اطلاعات اولیه خود را وارد کنید': 'Enter your basic details to start earning',
  'اسم': 'First Name',
  'فامیل': 'Last Name',
  'آیدی (ID)': 'Username (ID)',
  'ثبت‌نام و ورود': 'Sign Up & Enter',
  'کاربر جدید هستم': 'Create a New Account',
  'کاربر فعال هستم (ورود به حساب)': 'Already have an account? Sign In',
  'مثال: سهراب': 'e.g. Sohrab',
  'مثال: مرادی': 'e.g. Moradi',

  // Bottom Navigation
  'داشبورد': 'Dashboard',
  'اکتیویتی': 'Activity',
  'چالش‌ها': 'Challenges',
  'دعوت': 'Invite',

  // Dashboard / Wallet
  'موجودی کیف پول': 'Wallet Balance',
  'دارایی سکه‌های شما': 'Your Earned Coins',
  'مسافت کل': 'Total Distance',
  'تعداد فعالیت': 'Activities',
  'دعوت موفق': 'Referrals',
  'رتبه شما': 'Your Rank',
  'کیلومتر': 'km',
  'الویشن': 'Elevation',
  'مسافت': 'Distance',
  'زمان / پیس': 'Time / Pace',
  'نمودار هفتگی دویدن': 'Weekly Running Chart',
  'مسافت هفته': 'Weekly Distance',
  'زمان دویدن': 'Running Time',
  'الویشن هفته': 'Weekly Elevation',
  'این هفته': 'This Week',
  'هفته گذشته': 'Last Week',
  '۲ هفته پیش': '2 Weeks Ago',
  '۳ هفته پیش': '3 Weeks Ago',
  '۴ هفته پیش': '4 Weeks Ago',
  '۵ هفته پیش': '5 Weeks Ago',
  '۶ هفته پیش': '6 Weeks Ago',
  '۷ هفته پیش': '7 Weeks Ago',
  'هفته ۱': 'Wk 1',
  'هفته ۲': 'Wk 2',
  'هفته ۳': 'Wk 3',
  'هفته ۴': 'Wk 4',
  'هفته ۵': 'Wk 5',
  'هفته ۶': 'Wk 6',
  'هفته ۷': 'Wk 7',

  // Activity Tab
  'همگام‌سازی خودکار فعالیت‌ها': 'Automatic Activity Sync',
  'بروزرسانی خودکار فعال': 'Auto-sync active',
  'همگام‌سازی خودکار فعال': 'Auto-sync active',
  'در حال دریافت...': 'Syncing...',
  'همگام‌سازی': 'Sync Now',
  'فعالیت‌های ورزشی شما به صورت خودکار با اپ سینک می‌شوند.': 'Your workouts are automatically synced with the app.',
  'تنظیم ساعت': 'Watch Setup',
  'دریافت خودکار از ساعت و استراوا': 'Auto-synced from Watch & Strava',
  'هنوز فعالیتی سینک نشده است': 'No synced activities yet',
  'به محض ثبت دویدن در ساعت یا استراوا، فعالیت به صورت خودکار اینجا نمایش داده می‌شود.':
    'As soon as you record a run on your watch or Strava, it will automatically appear here.',
  'همگام‌سازی خودکار انجام شد': 'Auto-synced',
  'اشتراک رکورد در استوری': 'Share Record to Story',
  'اکتیویتی ثبت شد': 'Activity Synced',

  // Watches & Strava Tab
  'اتصال ساعت و استراوا': 'Connect Watch & Strava',
  'همگام‌سازی مستقیم با سرویس‌های جهانی': 'Direct sync with global fitness platforms',
  'مدیریت': 'Manage',
  'اتصال': 'Connect',
  'متصل': 'Connected',
  'آماده اتصال': 'Ready to Connect',
  'سرویس‌های قابل اتصال': 'Available Integrations',
  'وضعیت اتصال': 'Connection Status',
  'دریافت آخرین دویدن': 'Sync Latest Run',
  'قطع اتصال': 'Disconnect',

  // Leaderboard Tab
  'جدول رتبه‌بندی': 'Leaderboard',
  'رقابت دوندگان برتر': 'Top Runners League',
  '· اسپانسر رسمی لیگ دوندگان': '· Official Runners League Sponsor',
  'اسپانسر رسمی لیگ دوندگان': 'Official League Sponsor',
  'حامی جوایز': 'Prize Sponsor',
  'نفر اول': '1st Place',
  'نفر دوم': '2nd Place',
  'نفر سوم': '3rd Place',
  'رتبه و مشخصات دونده': 'Rank & Runner',
  'مسافت ثبت‌شده': 'Total Distance',
  '(شما)': '(You)',

  // Missions & Challenges Tab
  'ماموریت روزانه': 'Daily Missions',
  'چالش و پاداش': 'Challenges & Rewards',
  'هدیه ورود روزانه': 'Daily Check-In Bonus',
  'هر روز ورود به برنامه +۱۰ دوپول': '+10 Dopool for logging in every day',
  'دریافت +۱۰': 'Claim +10',
  'دریافت شد': 'Claimed',
  'دریافت': 'Claim',
  'انجام نشده': 'Incomplete',
  'ماموریت‌های امروز': "Today's Missions",
  'روزانه': 'Daily',
  'چالش‌های دویدن': 'Running Challenges',
  'کوپن‌های تخفیف ورزشی': 'Sports Discount Vouchers',
  'تحویل آنی': 'Instant Delivery',

  // Invite Tab
  'جایزه +۱۰ دوپول برای هر دعوت': '+10 Dopool Bonus per Referral',
  'با اشتراک لینک یا استوری دعوت، ۱۰ دوپول هدیه بگیرید.': 'Share your invite link or story to earn 10 Dopool.',
  'اشتراک‌گذاری دعوت دوستان': 'Invite Friends & Earn',
  'لینک دعوت یا تصویر استوری اینستاگرام': 'Referral link or 9:16 Instagram Story image',
  'لینک دعوت': 'Invite Link',
  'عکس استوری (۹:۱۶)': 'Story Image (9:16)',
  'کپی لینک': 'Copy Link',
  'کپی شد': 'Copied',
  'ارسال در واتساپ': 'Share on WhatsApp',
  'ارسال در تلگرام': 'Share on Telegram',
  'ثبت دعوت دوست و دریافت +۱۰ دوپول هدیه': 'Simulate Friend Referral (+10 Dopool)',
  'با دویدن سکه «دوپول» جایزه بگیرید': 'Run & Earn Dopool Coins',
  'تبدیل کیلومتر به سکه دوپول': 'Convert running kilometers into Dopool coins',
  'اتصال به ساعت‌های هوشمند و استراوا': 'Connect with smartwatches & Strava',
  'ماموریت‌های روزانه، چالش‌ها و جدول رتبه‌بندی': 'Daily missions, challenges & leaderboard',
  'سکه دوپول هدیه ویژه شروع با کد دعوت زیر': 'Starter bonus coins with the invite code below',
  'همین الان وارد لینک شوید و اولین دویدن خود را ثبت کنید': 'Join via the link now and log your first run',
  'دانلود و اشتراک عکس تبلیغاتی سایز استوری اینستا (۹:۱۶)': 'Download & Share 9:16 Instagram Story Image',
  'در حال ساخت تصویر استوری باکیفیت...': 'Generating HD Story Image...',

  // Profile Tab
  'پروفایل کاربری': 'User Profile',
  'مشاهده و ویرایش اطلاعات حساب': 'View & edit account details',
  'ویرایش': 'Edit',
  'ذخیره تغییرات': 'Save Changes',
  'ذخیره': 'Save',
  'انتخاب آواتار (۱۰ طرح):': 'Choose Avatar (10 Styles):',
  'اسم و فامیل': 'Full Name',
  'نام و نام خانوادگی': 'Full Name',
  'آیدی': 'Username',
  'شماره تماس': 'Phone Number',
  'ایمیل': 'Email Address',
  'تایید شده': 'Verified',
  'تایید شماره': 'Verify Phone',
  'تایید ایمیل': 'Verify Email',
  'تایید': 'Verify',

  // Avatars
  'پلنگ': 'Leopard',
  'شیر': 'Lion',
  'میمون': 'Monkey',
  'مار': 'Snake',
  'عقاب': 'Eagle',
  'گرگ': 'Wolf',
  'تاس': 'Dice',
  'توپ': 'Ball',
  'موشک': 'Rocket',
  'صاعقه': 'Bolt',

  // Hamburger Menu & Settings + Privacy + Support + Contact Us
  'تنظیمات': 'Settings',
  'تنظیمات و پشتیبانی': 'Settings & Support',
  'تنظیمات و امکانات حساب': 'Settings & Account Options',
  'بازگشت به منوی تنظیمات': 'Back to Settings Menu',
  'تم برنامه، اعلان‌ها، پشتیبانی و ارتباط با ما': 'Language, Privacy, Support & Contact Us',
  'حریم خصوصی': 'Privacy',
  'حریم خصوصی و امنیت': 'Privacy & Security',
  'ورود دو مرحله‌ای و تغییر رمز ورود': '2FA & Change Password',
  'تغییر رمز ورود': 'Change Password',
  'رمز ورود فعلی': 'Current Password',
  'رمز ورود جدید': 'New Password',
  'تکرار رمز ورود جدید': 'Confirm New Password',
  'ثبت رمز جدید': 'Update Password',
  'نمودار هفتگی': 'Weekly Chart',
  'پشتیبانی': 'Support',
  'ارتباط با ما': 'Contact Us',
  'تنظیمات برنامه': 'App Settings',
  'زبان برنامه': 'App Language',
  'فارسی': 'Persian (فارسی)',
  'انگلیسی (English)': 'English',
  'محافظت از حساب کاربری و کیف پول دوپول': 'Protect your account and Dopool wallet',
  'فعال · ارسال کد پیامکی هنگام ورود به حساب': 'Enabled · SMS verification required at sign-in',
  'غیرفعال · برای امنیت بیشتر روشن کنید': 'Disabled · Turn on for extra account security',
  'روشن': 'ON',
  'خاموش': 'OFF',
  'شماره همراه تایید دو مرحله‌ای:': '2FA Mobile Number:',
  'کد معرف اختصاصی': 'Your Referral Code',
  'رتبه فعلی شما': 'Your Current Rank',
  'تم رنگی برنامه': 'App Color Theme',
  'شب ملایم': 'Velvet Night',
  'گرم': 'Warm Glow',
  'روز روشن': 'Daylight',
  'اعلان‌ها و نوتیفیکیشن': 'Push Notifications',
  'فعال': 'Enabled',
  'غیرفعال': 'Disabled',
  'فعال ✓': 'Enabled ✓',
  'فعال‌سازی': 'Enable',
  'خروج از حساب کاربری': 'Sign Out of Account',
  'خروج': 'Sign Out',
  'ابزار سریع': 'Quick Tools',
  'پشتیبانی کاربران دوپول': 'Dopool User Support',
  'پاسخگویی سریع در واتساپ برای راهنمایی اتصال ساعت، تسویه و سوالات شما':
    'Fast WhatsApp support for watch connection, rewards, and general inquiries',
  'شماره پشتیبانی واتساپ:': 'WhatsApp Support Number:',
  'ارسال پیام مستقیم در واتساپ': 'Message on WhatsApp',
  'کپی شماره': 'Copy Number',
  'تماس تلفنی': 'Call Support',
  'راه‌های ارتباطی رسمی، همکاری و ارسال پیشنهاد به تیم دوپول':
    'Official contact channels, partnerships, and feedback for the Dopool team',
  'وب‌سایت رسمی': 'Official Website',
  'ایمیل ارتباطی': 'Contact Email',
  'ارسال پیام مستقیم': 'Send Direct Message',
  'موضوع پیام (مثلاً پیشنهاد یا همکاری)': 'Subject (e.g. Feedback or Partnership)',
  'متن پیام خود را بنویسید...': 'Write your message here...',
  'ارسال پیام': 'Send Message',

  // Notifications Drawer
  'خواندن همه': 'Mark All Read',
  'بستن': 'Close',
  'هیچ اعلانی وجود ندارد': 'No notifications yet',

  // Demo Names & Data
  'سهراب مرادی': 'Sohrab Moradi',
  'پوریا رضایی': 'Pouria Rezaei',
  'نیلوفر داوودی': 'Niloofar Davoudi',
  'کامران حسینی': 'Kamran Hosseini',
  'الناز شاکری': 'Elnaz Shakeri',
  'رضا کمالی': 'Reza Kamali',
  'مریم اکبری': 'Maryam Akbari',
  'دویدن صبحگاهی': 'Morning Run',
  'دویدن روزانه': 'Daily Run',
  'دویدن عصرگاهی استراوا · Strava Run': 'Evening Strava Run',
  'دویدن پارک لاله · Laleh Park Run': 'Laleh Park Run',
  'Morning Run · دویدن صبحگاهی': 'Morning Run',
  'امروز': 'Today',
  'دیروز': 'Yesterday',
  'هم‌اکنون': 'Just now',
  'همین الان': 'Just now',
};

const SUBSTRING_REPLACEMENTS: Array<[string, string]> = [
  ['پاداش دعوت دوست', 'Friend Referral Bonus'],
  ['دوست شما با کد معرف ثبت‌نام کرد و ۱۰ دوپول به کیف پول اضافه شد.', 'Your friend joined with your code and +10 Dopool was added to your wallet.'],
  ['پاداش ثبت اکتیویتی', 'Activity Sync Reward'],
  ['دویدن ۵.۲ کیلومتری ثبت شد و ۵۲ دوپول به حساب شما واریز گردید.', '5.2 km run synced and +52 Dopool was credited to your wallet.'],
  ['صعود در جدول رتبه‌بندی', 'Leaderboard Rank Up'],
  ['با ثبت رکورد جدید به رتبه ۴ جدول دوندگان صعود کردید.', 'You climbed to Rank #4 on the runners leaderboard!'],
  ['ورود روزانه به اپلیکیشن', 'Daily App Check-In'],
  ['ثبت حداقل ۲ کیلومتر دویدن روزانه', 'Run at least 2 km today'],
  ['ثبت ۵ کیلومتر دویدن استقامتی', 'Complete a 5 km endurance run'],
  ['اتصال ساعت هوشمند یا اکانت استراوا', 'Connect a Smartwatch or Strava'],
  ['دعوت یک دوست جدید به دوپول', 'Invite a new friend to Dopool'],
  ['چالش ۱۰ کیلومتر هفتگی پایتخت', 'Weekly 10K Capital Challenge'],
  ['چالش صعود سرعتی بام تهران', 'Bam-e Tehran Speed Climb Challenge'],
  ['نیم ماراتن مجازی خلیج فارس (۲۱K)', 'Persian Gulf Virtual Half-Marathon (21K)'],
  ['کد تخفیف ۳۰٪ نایکی کیش', '30% Off Nike Running Shoes'],
  ['کوپن ۱۰۰,۰۰۰ تومانی برند مجید', 'Majid Sportswear Discount Voucher'],
  ['تخفیف ۴۰٪ اکسسوری و تغذیه دوندگان', '40% Off Running Gear & Nutrition'],
  ['تخفیف ۲۵٪ سالادبار و غذای رژیمی', '25% Off Healthy Runner Meals'],
  ['پرفروش‌ترین', 'Best Seller'],
  ['برند ملی', 'Official Partner'],
  ['ارسال فوری', 'Fast Delivery'],
  ['تغذیه ورزشکاران', 'Runner Nutrition'],
  ['استراوا (Strava)', 'Strava'],
  ['گارمین (Garmin Connect)', 'Garmin Connect'],
  ['اپل واچ (Apple Health)', 'Apple Watch'],
  ['شیائومی (Zepp / Mi Fitness)', 'Xiaomi Zepp'],
  ['کوروس (COROS Hub)', 'COROS Hub'],
  ['سامسونگ (Samsung Health)', 'Samsung Health'],
  ['پاداش:', 'Reward:'],
  ['جایزه:', 'Prize:'],
  ['روز مهلت', 'days left'],
  ['روز متوالی', 'day streak'],
  ['فعالیت‌های سینک شده', 'Synced Activities'],
  ['متصل به', 'Connected to'],
  ['کد دعوت:', 'Referral Code:'],
  ['دقیقه پیش', 'mins ago'],
  ['ساعت پیش', 'hours ago'],
  ['روز پیش', 'days ago'],
  ['امروز · ۲۹ مهر', 'Today'],
  ['دیروز، ساعت ۰۶:۴۵', 'Yesterday, 06:45'],
  ['امروز، ساعت ۰۶:۴۵', 'Today, 06:45'],
  ['۵,۰۰۰ دوپول + ساعت گارمین', '5,000 Dopool + Garmin Watch'],
  ['۱۰,۰۰۰ دوپول + مدال یادبود', '10,000 Dopool + Finisher Medal'],
  ['۲,۵۰۰ دوپول', '2,500 Dopool'],
  ['۳۰ درصد تخفیف', '30% OFF'],
  ['۴۰ درصد تخفیف', '40% OFF'],
  ['۲۵ درصد تخفیف', '25% OFF'],
  ['۱۰۰ هزار تومان', '100K Voucher'],
  ['ورود (', 'Join ('],
  ['سکه دوپول', 'Dopool'],
  ['دوپول', 'Dopool'],
  ['تومان', 'Toman'],
  ['کیلومتر', 'km'],
  ['الویشن', 'Elevation'],
  ['ساعت', 'Watch'],
  ['تایید', 'Verify'],
  ['ویرایش', 'Edit'],
  ['ذخیره', 'Save'],
  ['انصراف', 'Cancel'],
  ['بستن', 'Close'],
  ['خروج', 'Sign Out'],
  ['ورود', 'Sign In'],
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toEnglishDigits(str: string): string {
  let out = str;
  for (let i = 0; i < 10; i++) {
    out = out.split(PERSIAN_DIGITS[i]).join(String(i));
  }
  return out;
}

export function translateFaToEn(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  if (EXACT_MAP[trimmed]) {
    return EXACT_MAP[trimmed];
  }

  let result = toEnglishDigits(input);

  if (EXACT_MAP[result.trim()]) {
    return EXACT_MAP[result.trim()];
  }

  for (const [fa, en] of SUBSTRING_REPLACEMENTS) {
    if (result.includes(fa)) {
      result = result.split(fa).join(en);
    }
  }

  // Strip any remaining Persian/Arabic characters if any dynamic string had extra words
  if (/[\u0600-\u06FF]/.test(result)) {
    result = result.replace(/[\u0600-\u06FF]+/g, '').replace(/\s+/g, ' ').trim();
    if (!result) return 'Dopool';
  }

  return result;
}
