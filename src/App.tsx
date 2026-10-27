import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
  Trophy,
  Activity,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Heart,
  Flame,
  Watch,
  Upload,
  Copy,
  Check,
  LogOut,
  User,
  Users,
  ChevronRight,
  Gift,
  ShoppingBag,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Play,
  FileText,
  Code,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Compass,
  Bell,
  BellRing,
  Radio,
  X,
  Volume2,
  BatteryCharging,
  BatteryMedium,
  TrendingUp,
  MapPin,
  Send,
  PlusCircle,
  Award,
  Swords,
  ArrowUpRight,
  DollarSign,
  Wallet,
  Shield,
  CreditCard,
  BarChart3,
  PlayCircle,
  RotateCcw,
  ExternalLink,
  Link2,
  Share2,
  Smartphone,
  Lock,
  Calendar,
  CheckSquare,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Inbox,
  Coins,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithGoogleCloud,
  signOutCloud,
  loadOrCreateCloudUserVault,
  syncCloudUserVaultUpdate,
  recordCloudRunActivity,
  recordCloudCashout,
  onAuthStateChanged,
  auth,
} from './firebase';

interface CoinParticle {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  scatterX: number;
  scatterY: number;
  rotation: number;
  delay: number;
  scale: number;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  rewardPool: number;
  icon: string;
  isCompleted: boolean;
  isClaimed: boolean;
  progress: number;
  target: number;
  unit: string;
  category: 'checkin' | 'running' | 'social' | 'hardware' | 'battle';
}

export type WatchProviderKey = 'strava' | 'garmin' | 'appleHealth' | 'xiaomi' | 'coros' | 'samsung';

export interface WatchAuthInfo {
  athleteName: string;
  athleteId: string;
  connectedAt: string;
  lastSyncedAt: string;
  accessToken: string;
  autoSync: boolean;
}

export interface WatchProviderMeta {
  id: WatchProviderKey;
  name: string;
  nameFa: string;
  brandColor: string;
  gradient: string;
  badge: string;
  protocol: string;
  scopes: string[];
  oauthUrl: string;
  description: string;
  iconText: string;
  popularInIran: boolean;
}

export const WATCH_PROVIDERS: WatchProviderMeta[] = [
  {
    id: 'strava',
    name: 'Strava',
    nameFa: 'استراوا',
    brandColor: '#FC4C02',
    gradient: 'from-[#FC4C02] to-[#FF6433]',
    badge: 'OAuth 2.0 رسمی',
    protocol: 'Strava API v3 Webhook',
    scopes: ['read', 'activity:read_all', 'profile:read_all'],
    oauthUrl:
      'https://www.strava.com/oauth/authorize?client_id=149821&response_type=code&redirect_uri=https://dopool.ir/oauth/callback/strava&approval_prompt=auto&scope=read,activity:read_all',
    description: 'شبکه جهانی دوندگان و ورزشکاران. همگام‌سازی لحظه‌ای تمام دویدن‌ها، جی‌پی‌اس مسیر و سرعت بدون نیاز به فیلترشکن.',
    iconText: 'S',
    popularInIran: true,
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    nameFa: 'گارمین کانکت',
    brandColor: '#007CC3',
    gradient: 'from-[#007CC3] to-[#00A3E0]',
    badge: 'Garmin Health API',
    protocol: 'Direct FIT Telemetry',
    scopes: ['dailies:read', 'activities:read', 'heartrate:read'],
    oauthUrl:
      'https://connect.garmin.com/oauthConfirm?oauth_token=garmin_health_v2_9182&redirect_uri=https://dopool.ir/oauth/callback/garmin',
    description: 'ساعت‌های سری Forerunner, Fenix و Epix. استخراج مستقیم رکوردهای دقیق دویدن با سنسور ضربان قلب Elevate.',
    iconText: 'G',
    popularInIran: true,
  },
  {
    id: 'appleHealth',
    name: 'Apple Watch & Health',
    nameFa: 'اپل واچ و هلث',
    brandColor: '#FF2D55',
    gradient: 'from-[#FF2D55] to-[#FF6B8B]',
    badge: 'Apple HealthKit',
    protocol: 'HealthKit Webhook Bridge',
    scopes: ['Workouts:Running', 'HeartRate:Live', 'ActiveEnergy'],
    oauthUrl:
      'https://healthautoexport.com/bridge?endpoint=https://dopool.ir/api/webhook/applehealth&client_id=dopool_ios',
    description: 'همگام‌سازی مستقیم تمرینات دویدن از اپل واچ سری ۹، Ultra و SE همراه با پایش ضربان قلب و کالری مصرفی.',
    iconText: '🍎',
    popularInIran: true,
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi Mi Fitness & Amazfit',
    nameFa: 'شیائومی و امیزفیت',
    brandColor: '#FF6900',
    gradient: 'from-[#FF6900] to-[#FFA040]',
    badge: 'Xiaomi Open API',
    protocol: 'Zepp Life / Mi Fitness Cloud',
    scopes: ['sport_data.read', 'device_info.read'],
    oauthUrl:
      'https://account.xiaomi.com/oauth2/authorize?client_id=mi_fitness_dopool&response_type=code&redirect_uri=https://dopool.ir/oauth/callback/xiaomi',
    description: 'پرکاربردترین مچ‌بندهای ورزشی ایران: Mi Band 7/8/9، ساعت‌های Redmi Watch و سری Amazfit با اکانت شیائومی.',
    iconText: 'MI',
    popularInIran: true,
  },
  {
    id: 'coros',
    name: 'COROS Hub',
    nameFa: 'کوروس هاب',
    brandColor: '#06B6D4',
    gradient: 'from-[#06B6D4] to-[#38BDF8]',
    badge: 'COROS Open API',
    protocol: 'COROS Cloud Sync',
    scopes: ['workout:read', 'athlete:read'],
    oauthUrl:
      'https://open.coros.com/oauth2/authorize?client_id=coros_ir_441&response_type=code&redirect_uri=https://dopool.ir/oauth/callback/coros',
    description: 'ساعت‌های تخصصی ماراتن و مسافت طولانی COROS Pace 2/3 و Apex با تحلیل بار تمرینی و توان مصرفی.',
    iconText: 'C',
    popularInIran: false,
  },
  {
    id: 'samsung',
    name: 'Samsung Health',
    nameFa: 'سامسونگ هلث',
    brandColor: '#2B5BE0',
    gradient: 'from-[#2B5BE0] to-[#4D7CFF]',
    badge: 'Samsung Health SDK',
    protocol: 'Wear OS Health Services',
    scopes: ['com.samsung.health.exercise.read'],
    oauthUrl:
      'https://api.samsunghealth.com/oauth/authorize?client_id=samsung_galaxy_dopool&response_type=code&redirect_uri=https://dopool.ir/oauth/callback/samsung',
    description: 'همگام‌سازی ساعت‌های هوشمند سامسونگ سری Galaxy Watch 4/5/6/7 مبتنی بر سیستم‌عامل Wear OS.',
    iconText: 'S',
    popularInIran: false,
  },
];

export const WatchBrandLogo = memo(function WatchBrandLogo({
  providerId,
  size = 'md',
}: {
  providerId: WatchProviderKey;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims =
    size === 'lg'
      ? 'w-11 h-11 rounded-2xl'
      : size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : 'w-9 h-9 rounded-xl';
  const svgSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  switch (providerId) {
    case 'strava':
      return (
        <div
          className={`${dims} bg-[#FC4C02] text-white flex items-center justify-center shadow-md shadow-[#FC4C02]/30 shrink-0`}
          title="Strava"
        >
          <svg viewBox="0 0 24 24" className={svgSize} fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </div>
      );
    case 'garmin':
      return (
        <div
          className={`${dims} bg-[#007CC3] text-white flex flex-col items-center justify-center shadow-md shadow-[#007CC3]/25 shrink-0`}
          title="Garmin Connect"
        >
          <svg viewBox="0 0 24 24" className={svgSize} fill="currentColor">
            <path d="M12 2.5L2.8 19.5h18.4L12 2.5zm0 4.6l5.4 10H6.6l5.4-10z" />
          </svg>
        </div>
      );
    case 'appleHealth':
      return (
        <div
          className={`${dims} bg-gradient-to-br from-[#FF2D55] to-[#FF375F] text-white flex items-center justify-center shadow-md shadow-[#FF2D55]/25 shrink-0`}
          title="Apple Watch & Health"
        >
          <svg viewBox="0 0 24 24" className={svgSize} fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.67-.81 1.12-1.94 1-3.08-.96.04-2.13.64-2.82 1.45-.61.7-.15 1.85-1.03 2.98 1.08.08 2.18-.54 2.85-1.35" />
          </svg>
        </div>
      );
    case 'xiaomi':
      return (
        <div
          className={`${dims} bg-[#FF6900] text-white flex items-center justify-center shadow-md shadow-[#FF6900]/25 shrink-0`}
          title="Xiaomi Mi Fitness"
        >
          <svg viewBox="0 0 24 24" className={svgSize} fill="currentColor">
            <path d="M4.5 6.5h6.2c1.8 0 3.1 1.3 3.1 3.1v7.9h-2.5V10c0-.6-.4-1-1-1H7v8.5H4.5v-11zm4.6 3.8h2.4v7.2H9.1v-7.2zm7.9-3.8h2.5v11H17v-11z" />
          </svg>
        </div>
      );
    case 'coros':
      return (
        <div
          className={`${dims} bg-gradient-to-br from-[#06B6D4] to-[#0284C7] text-white flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0`}
          title="COROS Hub"
        >
          <svg viewBox="0 0 24 24" className={svgSize} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 20.5 7 20.5 17 12 22 3.5 17 3.5 7 12 2" />
            <path d="M14.5 9.2a3.5 3.5 0 1 0 0 5.6" />
          </svg>
        </div>
      );
    case 'samsung':
    default:
      return (
        <div
          className={`${dims} bg-gradient-to-br from-[#1428A0] to-[#2B5BE0] text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0`}
          title="Samsung Health"
        >
          <svg viewBox="0 0 24 24" className={svgSize} fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      );
  }
});

interface UserProfile {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  username: string;
  referralCode: string;
  lockedPoolBalance: number;
  totalKm: number;
  invitedFriendsCount: number;
  invitedBy?: string;
  dailyEnergyMax: number;
  dailyEnergyCurrent: number;
  crewId?: number;
  crewName?: string;
  crewBadge?: string;
  streakDays: number;
  battleWins?: number;
  battleLosses?: number;
  battleRating?: number;
  lastDailyCheckIn?: string;
  firstTimeMilestones?: {
    firstLogin: boolean;
    firstActivity: boolean;
    firstInvite: boolean;
  };
  connectedWatches: {
    strava: boolean;
    garmin: boolean;
    coros: boolean;
    appleHealth?: boolean;
    xiaomi?: boolean;
    samsung?: boolean;
  };
  watchAuthDetails?: Record<string, WatchAuthInfo>;
}

export interface WelcomeEmailData {
  id: string;
  recipientEmail: string;
  recipientName: string;
  phone: string;
  username: string;
  referralCode: string;
  sentAt: string;
  subject: string;
  bonusTokens: number;
  deliveryStatus: 'DELIVERED' | 'SENDING';
}

interface PvPBattle {
  id: string;
  opponentName: string;
  opponentAvatar: string;
  opponentCity: string;
  opponentCrew: string;
  distanceKm: number;
  wagerPool: number;
  prizePool: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  userPace: number;
  opponentPace: number;
  userTimeSec: number;
  opponentTimeSec: number;
  winner: 'USER' | 'OPPONENT' | null;
  createdAt: string;
}

interface CashoutRecord {
  id: string;
  poolAmount: number;
  tomanAmount: number;
  shebaNumber: string;
  bankName: string;
  status: 'PENDING' | 'PROCESSED';
  trackingCode: string;
  createdAt: string;
}

interface RunActivity {
  id: string;
  title?: string;
  filename: string;
  distanceKm: number;
  elevGainMeters?: number;
  elapsedSeconds: number;
  avgHeartRate: number;
  paceMinPerKm: number;
  status: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  poolReward: number;
  createdAt: string;
  source: string;
  multiplier?: number;
  energyUsed?: number;
  gpsScore?: number;
  hrScore?: number;
  cadenceScore?: number;
  proofOfHumanScore?: number;
  firstActivityBonus?: number;
}

export interface ActivityRewardBreakdown {
  title: string;
  elevGainMeters: number;
  formattedTime: string;
  formattedPace: string;
  gpsScore: number;
  hrScore: number;
  cadenceScore: number;
  pohScore: number;
  distanceRate: number;
  distanceCoins: number;
  climbRatePer100m: number;
  climbCoins: number;
  baseCoins: number;
  boostPercent: number;
  boostCoins: number;
  pohDeduction: number;
  firstActivityBonus: number;
  earnedCoins: number;
}

export function computeActivityRewardBreakdown(act: RunActivity): ActivityRewardBreakdown {
  const isAccepted = act.status === 'ACCEPTED';
  const title =
    act.title ||
    (act.filename.toLowerCase().includes('morning')
      ? 'Morning Run · دویدن صبحگاهی'
      : act.filename.toLowerCase().includes('interval')
      ? 'Interval Run · تمرین اینتروال'
      : act.filename.toLowerCase().includes('car') || !isAccepted
      ? 'Unverified Activity · فعالیت رد شده'
      : 'Running Workout · دویدن روزانه');

  const elevGainMeters =
    act.elevGainMeters !== undefined
      ? act.elevGainMeters
      : Math.max(10, Math.round(act.distanceKm * 3.7));

  const totalMins = Math.floor(act.elapsedSeconds / 60);
  const remSecs = Math.round(act.elapsedSeconds % 60);
  const formattedTime = `${totalMins}:${remSecs < 10 ? '0' : ''}${remSecs}`;

  const paceM = Math.floor(act.paceMinPerKm);
  const paceS = Math.round((act.paceMinPerKm - paceM) * 60);
  const formattedPace = `${paceM}:${paceS < 10 ? '0' : ''}${paceS} /km`;

  const gpsScore = act.gpsScore ?? (isAccepted ? 100 : 48);
  const hrScore = act.hrScore ?? (act.avgHeartRate >= 110 && isAccepted ? 100 : 52);
  const cadenceScore = act.cadenceScore ?? (isAccepted ? 76 : 28);
  const pohScore =
    act.proofOfHumanScore ??
    (isAccepted ? Math.min(100, Math.round(gpsScore * 0.4 + hrScore * 0.4 + cadenceScore * 0.2)) : 42);

  const distanceRate = 20;
  const distanceCoins = Math.round(act.distanceKm * distanceRate);
  const climbRatePer100m = 9;
  const climbCoins = Math.round((elevGainMeters / 100) * climbRatePer100m);
  const baseCoins = distanceCoins + climbCoins;

  const mult = act.multiplier ?? 1.0;
  const boostPercent = Math.max(0, Math.round((mult - 1.0) * 100));
  const boostCoins = boostPercent > 0 ? Math.round(baseCoins * (boostPercent / 100)) : 0;

  const subtotalBeforePoh = baseCoins + boostCoins;
  const pohDeduction =
    pohScore < 100 ? -Math.round(subtotalBeforePoh * ((100 - pohScore) / 100)) : 0;

  const firstActivityBonus = act.firstActivityBonus || 0;
  const earnedCoins = isAccepted
    ? Math.max(1, subtotalBeforePoh + pohDeduction + firstActivityBonus)
    : 0;

  return {
    title,
    elevGainMeters,
    formattedTime,
    formattedPace,
    gpsScore,
    hrScore,
    cadenceScore,
    pohScore,
    distanceRate,
    distanceCoins,
    climbRatePer100m,
    climbCoins,
    baseCoins,
    boostPercent,
    boostCoins,
    pohDeduction,
    firstActivityBonus,
    earnedCoins,
  };
}

export function getSinglePostRunRecommendation(distanceKm: number) {
  const burnedCalories = Math.max(65, Math.round(distanceKm * 68));
  if (burnedCalories >= 500) {
    return {
      burnedCalories,
      emoji: '🍗🍌',
      title: 'وعده ریکاوری کامل (پروتئین + کربوهیدرات)',
      suggestion:
        '۱۵۰ گرم سینه مرغ گریل یا چلوکباب جوجه + ۱ عدد موز و ۲ لیوان آب خنک برای جبران کامل انرژی و بازسازی عضلات.',
    };
  }
  if (burnedCalories >= 280) {
    return {
      burnedCalories,
      emoji: '🍌🥚',
      title: 'میان‌وعده بازگشت سریع انرژی',
      suggestion:
        '۱ عدد موز متوسط + ۲ عدد سفیده تخم‌مرغ آب‌پز (یا ۱ اسکوپ پروتئین وی) به همراه ۱.۵ لیوان آب خنک.',
    };
  }
  return {
    burnedCalories,
    emoji: '🍏🥛',
    title: 'تغذیه سبک و آبرسانی بعد از دویدن',
    suggestion:
      '۱ عدد سیب یا موز کوچک + ۱ لیوان شیر کم‌چرب (یا ماست یونانی) و ۱ لیوان آب خنک برای حفظ شادابی.',
  };
}

// Deterministic Activity-Specific GPS Route Generator (produces real-looking GPS track points & KM splits per activity)
export function getActivityGpsRoute(act: RunActivity, variantOffset = 0) {
  const seedStr = `${act.id}_${act.title || ''}_${act.distanceKm.toFixed(2)}_${act.elapsedSeconds}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const baseIdx = (Math.abs(hash) + variantOffset) % 6;

  const trackTemplates: Array<{
    nameFa: string;
    coordsText: string;
    isLoop: boolean;
    waypoints: Array<[number, number]>;
  }> = [
    {
      nameFa: 'جاده تندرستی مجموعه انقلاب',
      coordsText: '35.7924° N · 51.3941° E',
      isLoop: true,
      waypoints: [
        [0.14, 0.62], [0.11, 0.44], [0.17, 0.26], [0.29, 0.16], [0.46, 0.14],
        [0.63, 0.19], [0.78, 0.14], [0.89, 0.25], [0.91, 0.43], [0.84, 0.61],
        [0.88, 0.76], [0.74, 0.86], [0.56, 0.82], [0.41, 0.88], [0.24, 0.81],
        [0.16, 0.71], [0.14, 0.62],
      ],
    },
    {
      nameFa: 'مسیر پارک ملت و ولیعصر',
      coordsText: '35.7782° N · 51.4102° E',
      isLoop: true,
      waypoints: [
        [0.18, 0.78], [0.12, 0.61], [0.16, 0.46], [0.12, 0.29], [0.25, 0.16],
        [0.42, 0.22], [0.58, 0.13], [0.76, 0.18], [0.88, 0.32], [0.82, 0.49],
        [0.89, 0.66], [0.77, 0.82], [0.61, 0.76], [0.44, 0.85], [0.29, 0.83],
        [0.18, 0.78],
      ],
    },
    {
      nameFa: 'پل طبیعت و پارک آب‌وآتش',
      coordsText: '35.7556° N · 51.4204° E',
      isLoop: false,
      waypoints: [
        [0.09, 0.76], [0.18, 0.68], [0.24, 0.52], [0.33, 0.48], [0.39, 0.31],
        [0.48, 0.24], [0.56, 0.36], [0.64, 0.52], [0.71, 0.44], [0.78, 0.26],
        [0.86, 0.19], [0.92, 0.33], [0.87, 0.54], [0.79, 0.71], [0.88, 0.84],
      ],
    },
    {
      nameFa: 'پیست ساحلی مرجان کیش',
      coordsText: '26.5321° N · 54.0185° E',
      isLoop: false,
      waypoints: [
        [0.11, 0.82], [0.19, 0.71], [0.28, 0.74], [0.37, 0.59], [0.45, 0.42],
        [0.54, 0.45], [0.62, 0.29], [0.73, 0.22], [0.83, 0.26], [0.90, 0.16],
        [0.86, 0.38], [0.77, 0.54], [0.84, 0.72], [0.72, 0.84],
      ],
    },
    {
      nameFa: 'بولوار چمران و پیست سلامت',
      coordsText: '29.6540° N · 52.4912° E',
      isLoop: true,
      waypoints: [
        [0.13, 0.54], [0.21, 0.34], [0.35, 0.24], [0.49, 0.15], [0.66, 0.18],
        [0.81, 0.27], [0.90, 0.44], [0.83, 0.62], [0.71, 0.78], [0.54, 0.86],
        [0.38, 0.79], [0.24, 0.72], [0.13, 0.54],
      ],
    },
    {
      nameFa: 'مسیر کوهپایه‌ای بام تهران',
      coordsText: '35.8165° N · 51.3998° E',
      isLoop: false,
      waypoints: [
        [0.12, 0.86], [0.26, 0.81], [0.21, 0.67], [0.38, 0.62], [0.31, 0.48],
        [0.52, 0.44], [0.46, 0.31], [0.68, 0.28], [0.63, 0.16], [0.84, 0.14],
        [0.91, 0.27], [0.82, 0.44], [0.89, 0.62],
      ],
    },
  ];

  const chosen = trackTemplates[baseIdx];
  const titleLower = (act.title || '').toLowerCase();
  const displayNameFa = titleLower.includes('لاله')
    ? 'پیست پارک لاله تهران'
    : titleLower.includes('انقلاب')
    ? 'جاده تندرستی باشگاه انقلاب'
    : titleLower.includes('بام')
    ? 'مسیر کوهپایه‌ای بام تهران'
    : chosen.nameFa;

  const densePoints: Array<{ x: number; y: number; progress: number }> = [];
  const raw = chosen.waypoints;
  const totalSegments = raw.length - 1;

  for (let i = 0; i < totalSegments; i++) {
    const [x1, y1] = raw[i];
    const [x2, y2] = raw[i + 1];
    const subSteps = 3;
    for (let s = 0; s < subSteps; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / subSteps;
      const globalProg = (i + t) / totalSegments;
      const jitterSeed = Math.sin((hash % 997) + i * 7.3 + s * 2.1 + act.distanceKm);
      const jx = s === 0 || (i === totalSegments - 1 && s === subSteps - 1) ? 0 : jitterSeed * 0.018;
      const jy = s === 0 || (i === totalSegments - 1 && s === subSteps - 1) ? 0 : Math.cos(jitterSeed * 5) * 0.018;
      densePoints.push({
        x: Math.min(0.94, Math.max(0.06, x1 + (x2 - x1) * t + jx)),
        y: Math.min(0.91, Math.max(0.09, y1 + (y2 - y1) * t + jy)),
        progress: globalProg,
      });
    }
  }
  const lastWp = raw[raw.length - 1];
  densePoints.push({ x: lastWp[0], y: lastWp[1], progress: 1 });

  const svgW = 260;
  const svgH = 145;
  const padX = 16;
  const padY = 14;
  const svgPts = densePoints.map((p) => ({
    x: Math.round((padX + p.x * (svgW - padX * 2)) * 10) / 10,
    y: Math.round((padY + p.y * (svgH - padY * 2)) * 10) / 10,
    progress: p.progress,
  }));

  const svgPath = svgPts.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

  const totalKmInt = Math.max(1, Math.min(8, Math.floor(act.distanceKm)));
  const splits: Array<{ km: number; x: number; y: number; normX: number; normY: number }> = [];
  for (let k = 1; k <= totalKmInt; k++) {
    const targetRatio = k / (act.distanceKm + 0.15);
    const ptIdx = Math.min(
      svgPts.length - 2,
      Math.max(1, Math.floor(targetRatio * (svgPts.length - 1)))
    );
    splits.push({
      km: k,
      x: svgPts[ptIdx].x,
      y: svgPts[ptIdx].y,
      normX: densePoints[ptIdx].x,
      normY: densePoints[ptIdx].y,
    });
  }

  return {
    routeNameFa: displayNameFa,
    coordsText: chosen.coordsText,
    isLoop: chosen.isLoop,
    points: densePoints,
    svgPts,
    svgPath,
    startPt: svgPts[0],
    endPt: svgPts[svgPts.length - 1],
    splits,
  };
}

export const ActivityVerificationReceiptCard = memo(function ActivityVerificationReceiptCard({
  activity,
  onShare,
}: {
  activity: RunActivity;
  onShare?: (act: RunActivity) => void;
}) {
  const [showFullMath, setShowFullMath] = useState(false);
  const b = useMemo(() => computeActivityRewardBreakdown(activity), [activity]);
  const route = useMemo(() => getActivityGpsRoute(activity), [activity]);
  const isAccepted = activity.status === 'ACCEPTED';
  const caloriesBurned = Math.max(65, Math.round(activity.distanceKm * 68));
  const tomanVal = Math.round(b.earnedCoins * 15000);

  return (
    <div className="ActivityVerificationReceiptCard rounded-3xl bg-slate-900/95 border border-slate-800/90 p-3.5 sm:p-4 space-y-3 shadow-xl">
      {/* 1. Compact Header + Mini GPS Heatmap Route Preview */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isAccepted ? 'bg-emerald-400 shadow-sm shadow-emerald-400/60' : 'bg-rose-500'
              }`}
            />
            <h3 className="text-sm sm:text-base font-black text-white truncate">{b.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 truncate">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="shrink-0">{activity.createdAt}</span>
            <span className="text-slate-600 shrink-0">·</span>
            <span className="text-emerald-400/95 font-medium inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{route.routeNameFa}</span>
            </span>
          </div>
        </div>

        {/* Mini GPS Heatmap Box + Earned Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-11 rounded-xl bg-slate-950/90 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0">
            <svg viewBox="0 0 260 145" className="w-full h-full overflow-visible" fill="none">
              <defs>
                <linearGradient id={`rcpGrad-${activity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
              <path
                d={route.svgPath}
                stroke={`url(#rcpGrad-${activity.id})`}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={route.startPt.x} cy={route.startPt.y} r="10" fill="#10b981" />
              <circle cx={route.endPt.x} cy={route.endPt.y} r="11" fill="#fbbf24" />
            </svg>
          </div>

          <div className="text-left shrink-0" dir="ltr">
            <div
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border inline-flex items-center gap-1 ${
                isAccepted
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/35'
              }`}
            >
              <Coins className="w-3 h-3 shrink-0" />
              <span>{isAccepted ? `+${b.earnedCoins} POOL` : 'REJECTED'}</span>
            </div>
            {isAccepted && (
              <span className="text-[9px] font-bold text-emerald-400 block text-center mt-0.5" dir="rtl">
                {tomanVal.toLocaleString('fa-IR')} تومان
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4-Column Telemetry Strip (Distance, Pace, Time, Calories/BPM) */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800/80 text-center">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-slate-400 inline-flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>مسافت</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white font-mono mt-0.5 block" dir="ltr">
            {activity.distanceKm.toFixed(2)} km
          </span>
        </div>
        <div className="border-r border-slate-800/80 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-slate-400 inline-flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-sky-400 shrink-0" />
            <span>پیس میانگین</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-sky-400 font-mono mt-0.5 block" dir="ltr">
            {b.formattedPace}
          </span>
        </div>
        <div className="border-r border-slate-800/80 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-slate-400 inline-flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>زمان کل</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono mt-0.5 block" dir="ltr">
            {b.formattedTime}
          </span>
        </div>
        <div className="border-r border-slate-800/80 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold text-slate-400 inline-flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-orange-400 shrink-0" />
            <span>کالری · ضربان</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-orange-400 font-mono mt-0.5 block" dir="ltr">
            {caloriesBurned} <span className="text-[9px] text-rose-400">({activity.avgHeartRate})</span>
          </span>
        </div>
      </div>

      {/* 3. Compact Proof of Human + Collapsible Reward Formula */}
      {isAccepted ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-emerald-400 inline-flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>اصالت دونده: {b.pohScore}%</span>
              </span>
              <span className="text-slate-600 shrink-0">|</span>
              <span className="text-slate-400 font-mono text-[10px] truncate" dir="ltr">
                GPS {b.gpsScore} · HR {b.hrScore} · CAD {b.cadenceScore}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowFullMath((prev) => !prev)}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>{showFullMath ? 'بستن فرمول پاداش' : 'فرمول محاسبه سکه'}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  showFullMath ? '-rotate-90' : 'rotate-90'
                }`}
              />
            </button>
          </div>

          {showFullMath && (
            <div className="rounded-2xl bg-slate-950/90 border border-amber-500/25 p-3 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>پاداش پایه مسافت و صعود ({activity.distanceKm.toFixed(2)}km + {b.elevGainMeters}m)</span>
                <span className="font-mono font-bold text-white" dir="ltr">+{b.baseCoins} POOL</span>
              </div>
              {b.boostPercent > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>ضریب تقویتی استریک و کلاب (+{b.boostPercent}%)</span>
                  <span className="font-mono font-bold" dir="ltr">+{b.boostCoins} POOL</span>
                </div>
              )}
              {b.pohDeduction !== 0 && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>تعدیل ضریب اصالت ({b.pohScore}%)</span>
                  <span className="font-mono" dir="ltr">{b.pohDeduction} POOL</span>
                </div>
              )}
              {b.firstActivityBonus > 0 && (
                <div className="flex items-center justify-between text-sky-400 font-bold">
                  <span>هدیه اولین اکتیویتی</span>
                  <span className="font-mono" dir="ltr">+{b.firstActivityBonus} POOL</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 font-black text-amber-400">
                <span>خالص واریزی به کیف پول</span>
                <span className="font-mono" dir="ltr">+{b.earnedCoins} POOL</span>
              </div>
            </div>
          )}

          {onShare && (
            <button
              type="button"
              onClick={() => onShare(activity)}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>اشتراک استوری اینستاگرام (Aura + هیت‌مپ مسیر)</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
          <div className="font-black text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>رد شده توسط سیستم Proof of Human:</span>
          </div>
          <p className="pr-5">{activity.rejectionReason || 'عدم تطابق ضربان قلب و سرعت با الگوی دویدن انسان.'}</p>
        </div>
      )}
    </div>
  );
});

interface LeaderboardUser {
  rank: number;
  fullName: string;
  username: string;
  totalKm: number;
  poolBalance: number;
}

interface RunningCrew {
  id: number;
  name: string;
  city: string;
  badge: string;
  description: string;
  weeklyKm: number;
  totalKm: number;
  membersCount: number;
  rank: number;
}

interface CrewMessage {
  id: number;
  crewId: number;
  userName: string;
  message: string;
  createdAt: string;
}

interface VoucherItem {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  costPool: number;
  discount: string;
  badge: string;
}

interface ChallengeItem {
  id: string;
  title: string;
  subtitle: string;
  entryFeePool: number;
  prizePool: string;
  participants: number;
  daysLeft: number;
}

interface PushNotificationItem {
  id: string;
  type: 'REFERRAL_BONUS' | 'TOKEN_AWARD' | 'RANK_UP' | 'SYSTEM';
  title: string;
  body: string;
  poolAmount?: number;
  isRead: boolean;
  createdAt: string;
}

export const DOPOOL_LOGO_LIGHT_URL = '/assets/aistudio/dopool_logo_clean.png?v=4';
export const DOPOOL_LOGO_DARK_URL = '/assets/aistudio/dopool_logo_dark_clean.png?v=4';
export const DOPOOL_COIN_URL = '/assets/aistudio/dopool_coin_clean.png?v=4';

export default function App() {
  // Startup & Login Logo Loading Animation State (لوگو با اسم دوپول مثل لود شدن هنگام ورود)
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashSubtitle, setSplashSubtitle] = useState<string>('در حال بارگذاری سامانه دوپول...');

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1850);
    return () => clearTimeout(timer);
  }, [showSplash]);

  // Authentication State (Starts at Login Portal after Splash so user sees the new Login Page with Logo, while preserving saved profile data on login)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cloudUid, setCloudUid] = useState<string | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('sohrab_run');
  const [loginPassword, setLoginPassword] = useState('pass123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States (اسم و فامیل، شماره، ایمیل، نام کاربری، رمز عبور)
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regReferral, setRegReferral] = useState('');
  const [regTermsAccepted, setRegTermsAccepted] = useState(true);

  // Beautiful Auth Modals & Welcome Email States
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordInput, setForgotPasswordInput] = useState('');
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);
  const [showWelcomeEmailModal, setShowWelcomeEmailModal] = useState(false);
  const [sentWelcomeEmail, setSentWelcomeEmail] = useState<WelcomeEmailData | null>(null);
  const [isSendingWelcomeEmail, setIsSendingWelcomeEmail] = useState(false);
  const [showTesterShareModal, setShowTesterShareModal] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalledPWA, setIsInstalledPWA] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  // Active Tab: 'home' | 'sync' | 'watches' | 'invite' | 'crews' | 'leaderboard' | 'store' | 'history' | 'support' | 'code'
  const [activeTab, setActiveTab] = useState<'home' | 'sync' | 'watches' | 'invite' | 'crews' | 'leaderboard' | 'store' | 'history' | 'support' | 'code'>('home');
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Running Crews State
  const [crews, setCrews] = useState<RunningCrew[]>([
    {
      id: 1,
      name: 'باشگاه انقلاب تهران (Enghelab Crew)',
      city: 'تهران',
      badge: '🔥',
      description: 'تیم رسمی دوندگان پیست تارتان و جاده تندرستی مجموعه ورزشی انقلاب',
      weeklyKm: 584.2,
      totalKm: 3420.0,
      membersCount: 48,
      rank: 1,
    },
    {
      id: 2,
      name: 'دوندگان پارک لاله و چمران',
      city: 'تهران',
      badge: '⚡',
      description: 'دونده‌های سحرخیز بامداد پنجشنبه پارک لاله و بلوار کشاورز',
      weeklyKm: 425.6,
      totalKm: 2680.0,
      membersCount: 36,
      rank: 2,
    },
    {
      id: 3,
      name: 'تیم ماراتن شیراز (Shiraz Runners)',
      city: 'شیراز',
      badge: '🌸',
      description: 'گروه استقامت و تریل‌رانینگ باغ ارم و بلوار چمران شیراز',
      weeklyKm: 340.0,
      totalKm: 2150.0,
      membersCount: 29,
      rank: 3,
    },
    {
      id: 4,
      name: 'کلاب دوندگان ساحلی کیش',
      city: 'کیش',
      badge: '🌊',
      description: 'دویدن غروب خلیج فارس از ساحل سیمرغ تا اسکله تفریحی',
      weeklyKm: 298.5,
      totalKm: 1890.0,
      membersCount: 22,
      rank: 4,
    },
    {
      id: 5,
      name: 'تیم اسکای‌رانینگ توچال و درکه',
      city: 'تهران',
      badge: '🏔️',
      description: 'ارتفاعات شمالی پایتخت، شیب‌زنی و آمادگی ماراتن‌های سنگین',
      weeklyKm: 245.0,
      totalKm: 1540.0,
      membersCount: 19,
      rank: 5,
    },
  ]);

  // Crew Messages
  const [crewMessages, setCrewMessages] = useState<CrewMessage[]>([
    {
      id: 1,
      crewId: 1,
      userName: 'پوریا رضایی (کاپیتان)',
      message: 'بچه‌ها فردا ساعت ۶ صبح دم ورودی اصلی پیست تارتان انقلاب جمع میشیم برای تمپو ران.',
      createdAt: '۱۰ دقیقه پیش',
    },
    {
      id: 2,
      crewId: 1,
      userName: 'نیلوفر داوودی',
      message: 'عالیه! بچه‌ها ۳۵ کیلومتر با صدر جدول تیمی فاصله داریم، فردا همه انرژی رو پر کنین! 💪',
      createdAt: '۲۵ دقیقه پیش',
    },
    {
      id: 3,
      crewId: 1,
      userName: 'کامران حسینی',
      message: 'دویدن امروز صبح در زون ۲ فوق‌العاده بود. ضریب پاداش صبحگاهی فعال شد (+۵۲ POOL).',
      createdAt: '۱ ساعت پیش',
    },
  ]);

  const [newCrewMsg, setNewCrewMsg] = useState('');
  const [showCreateCrewModal, setShowCreateCrewModal] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewCity, setNewCrewCity] = useState('');
  const [newCrewBadge, setNewCrewBadge] = useState('🔥');
  const [newCrewDesc, setNewCrewDesc] = useState('');

  // Push Notifications State & Drawer
  const [notifications, setNotifications] = useState<PushNotificationItem[]>(() => {
    const saved = localStorage.getItem('dopool_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'notif-1',
        type: 'REFERRAL_BONUS',
        title: 'پاداش دعوت دوست واریز شد! 🎉',
        body: 'دوست شما (نیلوفر رضایی) با کد معرف شما ثبت‌نام کرد. ۱۰ توکن POOL به حساب شما اضافه شد.',
        poolAmount: 10,
        isRead: false,
        createdAt: '۱۰ دقیقه پیش',
      },
      {
        id: 'notif-2',
        type: 'TOKEN_AWARD',
        title: 'پاداش فعالیت دویدن واریز شد! ⚡',
        body: 'فعالیت دویدن ۵.۲ کیلومتری شما تایید شد (+۶۷.۶ توکن POOL با ضریب ۱.۳x). ۱۰.۴ انرژی مصرف شد.',
        poolAmount: 67.6,
        isRead: true,
        createdAt: 'امروز، ساعت ۰۶:۴۵',
      },
      {
        id: 'notif-3',
        type: 'RANK_UP',
        title: 'ارتقای رتبه در جدول برترین‌ها! 🏆',
        body: 'تبریک! شما با رسیدن به مسافت ۱۲.۵ کیلومتر، به رتبه ۴ جدول لیگ دوندگان نایکی صعود کردید!',
        isRead: true,
        createdAt: 'دیروز',
      },
    ];
  });

  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [colorTheme, setColorTheme] = useState<'velvet' | 'warm' | 'daylight'>(() => {
    const saved = localStorage.getItem('dopool_eye_theme');
    if (saved === 'velvet' || saved === 'warm' || saved === 'daylight') return saved;
    return 'velvet';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem('dopool_eye_theme', colorTheme);
  }, [colorTheme]);

  const [pushPermission, setPushPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; detail?: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  // Copied state
  const [copiedRef, setCopiedRef] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Selected Activity Receipt Modal (shows right after any run is verified)
  const [selectedReceiptActivity, setSelectedReceiptActivity] = useState<RunActivity | null>(null);
  // Single Post-Activity Nutrition Pop-up Modal (shows one quick suggestion right after recording a run)
  const [postRunNutritionPopup, setPostRunNutritionPopup] = useState<RunActivity | null>(null);

  // Viral Instagram Story Studio State (9:16 Story Only + Pace Heatmap Only + 4 Aura Models: Gold, Minimal, Magazine, Transparent Overlay)
  type StoryModelType = 'gold' | 'strava' | 'poster' | 'transparent';

  const [storyModalActivity, setStoryModalActivity] = useState<RunActivity | null>(null);
  const [storyTheme, setStoryTheme] = useState<StoryModelType>('gold');
  const [storyRouteVariant, setStoryRouteVariant] = useState<number>(0);
  const [storyCustomPhoto, setStoryCustomPhoto] = useState<string | null>(null);
  const [storyShowToman, setStoryShowToman] = useState<boolean>(true);
  const [storyHookIndex, setStoryHookIndex] = useState<number>(0);
  const [isExportingStory, setIsExportingStory] = useState<boolean>(false);
  const storyPhotoInputRef = useRef<HTMLInputElement>(null);

  const storyViralHooks = [
    'هر قدمت پول نقده! با دوپول بدو و سکه بگیر ⚡',
    'امروز دویدم و پاداشم رو گرفتم! تو چطور؟ 🏃‍♂️🪙',
    'تبدیل کالری به درآمد واقعی در اپلیکیشن دوپول 🔥',
    'چالش دویدن با جایزه نقدی · همراهم شو! 🏆',
  ];

  const handleStoryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStoryCustomPhoto(reader.result);
        setStoryTheme('transparent');
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate 1080x1920 Instagram Story PNG via HTML5 Canvas (Always Pace Heatmap GPS + Supports True Transparent PNG or Photo Overlay)
  const handleExportStoryImage = async (mode: 'download' | 'share') => {
    if (!storyModalActivity) return;
    setIsExportingStory(true);
    try {
      const act = storyModalActivity;
      const b = computeActivityRewardBreakdown(act);
      const route = getActivityGpsRoute(act, storyRouteVariant);
      const tomanVal = Math.round(b.earnedCoins * 15000);
      const caloriesBurned = Math.max(65, Math.round(act.distanceKm * 68));
      const refCode = user?.referralCode || 'POOL-8834';
      const activeHook = storyViralHooks[storyHookIndex] || storyViralHooks[0];

      const W = 1080;
      const H = 1920;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      const isPureTransparentSticker = storyTheme === 'transparent' && !storyCustomPhoto;

      // Helper to render the Activity's Pace Heatmap GPS Route on the Canvas
      const drawCanvasHeatmapRoute = (
        mapX: number,
        mapY: number,
        mapW: number,
        mapH: number,
        showCardBg: boolean
      ) => {
        ctx.save();
        if (showCardBg) {
          roundRect(mapX, mapY, mapW, mapH, 36);
          ctx.fillStyle = 'rgba(7, 12, 24, 0.72)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle =
            storyTheme === 'gold'
              ? 'rgba(251, 191, 36, 0.38)'
              : storyTheme === 'poster'
              ? 'rgba(168, 85, 247, 0.38)'
              : 'rgba(56, 189, 248, 0.35)';
          ctx.stroke();
        }

        ctx.save();
        roundRect(mapX, mapY, mapW, mapH, 36);
        ctx.clip();

        if (showCardBg) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
          ctx.lineWidth = 1;
          const stepX = mapW / 6;
          const stepY = mapH / 4;
          for (let gx = mapX + stepX; gx < mapX + mapW; gx += stepX) {
            ctx.beginPath();
            ctx.moveTo(gx, mapY);
            ctx.lineTo(gx, mapY + mapH);
            ctx.stroke();
          }
          for (let gy = mapY + stepY; gy < mapY + mapH; gy += stepY) {
            ctx.beginPath();
            ctx.moveTo(mapX, gy);
            ctx.lineTo(mapX + mapW, gy);
            ctx.stroke();
          }

          ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
          ctx.font = 'bold 21px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`📍 ${route.routeNameFa}`, mapX + mapW - 28, mapY + 42);

          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(route.coordsText, mapX + 28, mapY + 42);
        }

        const innerPadX = 58;
        const innerPadY = showCardBg ? 64 : 26;
        const drawW = mapW - innerPadX * 2;
        const drawH = mapH - innerPadY * 2;

        const canvasPts = route.points.map((pt) => ({
          x: mapX + innerPadX + pt.x * drawW,
          y: mapY + innerPadY + pt.y * drawH,
        }));

        // Outer ambient Pace Heatmap glow
        ctx.beginPath();
        canvasPts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 22;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.22)';
        ctx.stroke();

        // Main Pace Heatmap GPS Route Stroke (#10b981 -> #fbbf24 -> #f43f5e)
        ctx.beginPath();
        canvasPts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.lineWidth = 10;
        const routeGrad = ctx.createLinearGradient(mapX, mapY, mapX + mapW, mapY + mapH);
        routeGrad.addColorStop(0, '#10b981');
        routeGrad.addColorStop(0.5, '#fbbf24');
        routeGrad.addColorStop(1, '#f43f5e');
        ctx.strokeStyle = routeGrad;
        ctx.shadowColor = 'rgba(251, 191, 36, 0.78)';
        ctx.shadowBlur = 22;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw KM Split Markers along the GPS track
        route.splits.slice(0, 5).forEach((sp) => {
          const sx = mapX + innerPadX + sp.normX * drawW;
          const sy = mapY + innerPadY + sp.normY * drawH;
          ctx.beginPath();
          ctx.arc(sx, sy, 13, 0, Math.PI * 2);
          ctx.fillStyle = '#090e1c';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#fbbf24';
          ctx.stroke();

          ctx.fillStyle = '#fde68a';
          ctx.font = '900 13px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${sp.km}`, sx, sy + 4.5);
        });

        // Start Point Pin (Green) & Finish Point Pin (Gold)
        const sPt = canvasPts[0];
        const ePt = canvasPts[canvasPts.length - 1];
        if (sPt && ePt) {
          ctx.beginPath();
          ctx.arc(sPt.x, sPt.y, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(ePt.x, ePt.y, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        ctx.restore();
        ctx.restore();
      };

      // 1. Background Layer based on selected Aura Model
      if (isPureTransparentSticker) {
        // Leave canvas 100% transparent so the user gets a true transparent PNG overlay sticker!
        ctx.clearRect(0, 0, W, H);
      } else if (storyTheme === 'transparent' && storyCustomPhoto) {
        try {
          const bgImg = await loadImg(storyCustomPhoto);
          const scale = Math.max(W / bgImg.width, H / bgImg.height);
          const w = bgImg.width * scale;
          const h = bgImg.height * scale;
          ctx.drawImage(bgImg, (W - w) / 2, (H - h) / 2, w, h);
        } catch {
          ctx.fillStyle = '#070b16';
          ctx.fillRect(0, 0, W, H);
        }
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, H);
        overlayGrad.addColorStop(0, 'rgba(6, 9, 19, 0.72)');
        overlayGrad.addColorStop(0.45, 'rgba(6, 9, 19, 0.18)');
        overlayGrad.addColorStop(1, 'rgba(6, 9, 19, 0.88)');
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, W, H);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        if (storyTheme === 'gold') {
          bgGrad.addColorStop(0, '#060913');
          bgGrad.addColorStop(0.5, '#101829');
          bgGrad.addColorStop(1, '#1d1406');
        } else if (storyTheme === 'strava') {
          bgGrad.addColorStop(0, '#070b14');
          bgGrad.addColorStop(0.5, '#0f172a');
          bgGrad.addColorStop(1, '#070b14');
        } else {
          // 'poster' (Aura Magazine)
          bgGrad.addColorStop(0, '#130926');
          bgGrad.addColorStop(0.5, '#0b132b');
          bgGrad.addColorStop(1, '#050814');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const radGrad = ctx.createRadialGradient(W / 2, H * 0.36, 40, W / 2, H * 0.36, 650);
        const glowColor =
          storyTheme === 'gold'
            ? 'rgba(245, 158, 11, 0.25)'
            : storyTheme === 'poster'
            ? 'rgba(168, 85, 247, 0.24)'
            : 'rgba(56, 189, 248, 0.22)';
        radGrad.addColorStop(0, glowColor);
        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // Giant Watermark Distance in Aura Magazine Mode
      if (storyTheme === 'poster') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.font = '900 390px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${act.distanceKm.toFixed(1)}`, W / 2, 820);
        ctx.restore();
      }

      // 2. Draw Official Transparent Winged Coin Logo at Top
      try {
        const logoImg = await loadImg(DOPOOL_LOGO_DARK_URL);
        const logoW = 350;
        const logoH = (logoImg.height / logoImg.width) * logoW;
        ctx.drawImage(logoImg, (W - logoW) / 2, 64, logoW, logoH);
      } catch {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 52px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DOPOOL | دوپول', W / 2, 135);
      }

      // 3. Draw Activity Pace Heatmap GPS Route Map & Core Aura Story Layout (9:16 · 1080x1920)
      const isMinimalOrTransparent = storyTheme === 'strava' || storyTheme === 'transparent';
      drawCanvasHeatmapRoute(80, 330, 920, 440, !isMinimalOrTransparent);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 150px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${act.distanceKm.toFixed(2)}`, W / 2, 925);

      ctx.fillStyle = storyTheme === 'gold' ? '#fbbf24' : '#34d399';
      ctx.font = '900 36px sans-serif';
      ctx.fillText('KILOMETERS · کیلومتر دویدن', W / 2, 985);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${b.title} · ${route.routeNameFa}`, W / 2, 1045);
      ctx.restore();

      const metrics = [
        { label: 'پیس (PACE)', val: b.formattedPace },
        { label: 'زمان (TIME)', val: b.formattedTime },
        { label: 'کالری (KCAL)', val: `${caloriesBurned}` },
        { label: 'ضربان (BPM)', val: `${act.avgHeartRate}` },
      ];
      const boxW = 215;
      const gap = 20;
      const startX = (W - (boxW * 4 + gap * 3)) / 2;
      metrics.forEach((m, idx) => {
        const x = startX + idx * (boxW + gap);
        const y = 1115;
        roundRect(x, y, boxW, 150, 28);
        ctx.fillStyle = isPureTransparentSticker ? 'rgba(9, 14, 28, 0.55)' : 'rgba(15, 23, 42, 0.84)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m.label, x + boxW / 2, y + 52);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 32px monospace';
        ctx.fillText(m.val, x + boxW / 2, y + 112);
      });

      roundRect(80, 1310, 920, 250, 42);
      const cardGrad = ctx.createLinearGradient(80, 1310, 1000, 1560);
      cardGrad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
      cardGrad.addColorStop(0.5, isPureTransparentSticker ? 'rgba(9, 14, 28, 0.65)' : 'rgba(15, 23, 42, 0.94)');
      cardGrad.addColorStop(1, 'rgba(16, 185, 129, 0.28)');
      ctx.fillStyle = cardGrad;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('پاداش ثبت این فعالیت در دوپول', W / 2, 1370);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 88px monospace';
      ctx.fillText(`+${b.earnedCoins} POOL`, W / 2, 1470);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(
        storyShowToman
          ? `معادل نقدی: ${tomanVal.toLocaleString('fa-IR')} تومان`
          : `ضریب پاداش دویدن: x${(act.multiplier ?? 1).toFixed(1)}`,
        W / 2,
        1532
      );

      roundRect(80, 1600, 920, 210, 38);
      ctx.fillStyle = isPureTransparentSticker ? 'rgba(9, 14, 28, 0.65)' : 'rgba(9, 14, 28, 0.92)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeHook, W / 2, 1675);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 34px monospace';
      ctx.fillText(`🎁 ۱۰ سکه هدیه شروع با کد دعوت: ${refCode}`, W / 2, 1755);

      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png', 0.95));
      if (!blob) throw new Error('Blob creation failed');

      const fileName = `dopool-story-${storyTheme}-${act.distanceKm}km.png`;
      if (mode === 'share' && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'رکورد دویدن من در دوپول',
            text: `${activeHook} — کد دعوت من برای ۱۰ سکه هدیه: ${refCode}`,
            files: [file],
          });
          triggerToast(
            'آماده انتشار در استوری! 🚀',
            'تصویر استوری (9:16) با نقشه هیت‌مپ مسیر به منوی اشتراک‌گذاری ارسال شد.',
            'success'
          );
          setIsExportingStory(false);
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast(
        isPureTransparentSticker ? 'استیکر شفاف PNG دانلود شد! 🔲' : 'تصویر استوری دانلود شد! 📸',
        isPureTransparentSticker
          ? 'فایل PNG بدون پس‌زمینه آماده قرارگیری روی هر عکسی در گالری یا اینستاگرام است.'
          : 'کارت استوری (1080×1920) با نقشه هیت‌مپ ذخیره شد.',
        'success'
      );
    } catch {
      triggerToast('خطا در ساخت تصویر', 'لطفاً دوباره تلاش کنید.', 'error');
    } finally {
      setIsExportingStory(false);
    }
  };

  // Helper to deduplicate activities by filename or identical workout telemetry signature
  const deduplicateActivitiesList = (list: RunActivity[]): RunActivity[] => {
    const seenFiles = new Set<string>();
    const seenTelemetry = new Set<string>();
    const result: RunActivity[] = [];
    for (const item of list) {
      const normFile = (item.filename || '').trim().toLowerCase();
      const telemetryKey = `${Number(item.distanceKm).toFixed(2)}_${item.elapsedSeconds}_${item.avgHeartRate}`;
      if ((normFile && seenFiles.has(normFile)) || seenTelemetry.has(telemetryKey)) {
        continue;
      }
      if (normFile) seenFiles.add(normFile);
      seenTelemetry.add(telemetryKey);
      result.push(item);
    }
    return result;
  };

  // Activities List
  const [activities, setActivities] = useState<RunActivity[]>(() => {
    const saved = localStorage.getItem('dopool_activities_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateActivitiesList(parsed);
        }
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'act-100',
        title: 'Morning Run · دویدن صبحگاهی',
        filename: 'Morning_Run_9.2K.fit',
        distanceKm: 9.2,
        elevGainMeters: 34,
        elapsedSeconds: 3596,
        avgHeartRate: 152,
        paceMinPerKm: 6.516,
        status: 'ACCEPTED',
        poolReward: 178,
        createdAt: 'امروز · ۲۹ مهر',
        source: 'Garmin Connect',
        multiplier: 1.0,
        energyUsed: 0,
        gpsScore: 100,
        hrScore: 100,
        cadenceScore: 76,
        proofOfHumanScore: 95,
      },
      {
        id: 'act-101',
        title: 'دویدن پارک لاله · Laleh Park Run',
        filename: 'Morning_LalehPark_5.4K.fit',
        distanceKm: 5.4,
        elevGainMeters: 24,
        elapsedSeconds: 1710,
        avgHeartRate: 148,
        paceMinPerKm: 5.27,
        status: 'ACCEPTED',
        poolReward: 120,
        createdAt: 'دیروز، ساعت ۰۶:۴۵',
        source: 'Garmin Forerunner 965',
        multiplier: 1.2,
        energyUsed: 10.4,
        gpsScore: 100,
        hrScore: 100,
        cadenceScore: 84,
        proofOfHumanScore: 97,
      },
      {
        id: 'act-103',
        title: 'تست سرعت غیرمجاز خودرو',
        filename: 'Highway_Drive_Test.fit',
        distanceKm: 8.5,
        elevGainMeters: 10,
        elapsedSeconds: 780,
        avgHeartRate: 102,
        paceMinPerKm: 1.52,
        status: 'REJECTED',
        rejectionReason: 'سرعت غیرطبیعی (پیس ۱:۳۱ سریع‌تر از ۲:۴۰ دقیقه/کیلومتر - احتمال استفاده از خودرو یا موتور).',
        poolReward: 0,
        createdAt: '۳ روز پیش',
        source: 'Cheater Engine',
        gpsScore: 45,
        hrScore: 50,
        cadenceScore: 22,
        proofOfHumanScore: 41,
      },
    ];
  });

  // Individual Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([
    { rank: 1, fullName: 'پوریا رضایی', username: 'pouria_ultra', totalKm: 142.6, poolBalance: 1426.0 },
    { rank: 2, fullName: 'نیلوفر داوودی', username: 'niloofar_run', totalKm: 118.2, poolBalance: 1182.0 },
    { rank: 3, fullName: 'کامران حسینی', username: 'kamran_fast', totalKm: 98.4, poolBalance: 984.0 },
    { rank: 4, fullName: 'سهراب مرادی', username: 'sohrab_run', totalKm: 12.5, poolBalance: 125.0 },
    { rank: 5, fullName: 'الناز شاکری', username: 'elnaz_marathon', totalKm: 76.0, poolBalance: 760.0 },
    { rank: 6, fullName: 'رضا کمالی', username: 'reza_runner', totalKm: 64.5, poolBalance: 645.0 },
    { rank: 7, fullName: 'مریم اکبری', username: 'maryam_trail', totalKm: 52.8, poolBalance: 528.0 },
  ]);

  // Vouchers
  const vouchers: VoucherItem[] = [
    {
      id: 'nike_kish_30',
      brand: 'Nike Kish Official',
      title: 'کد تخفیف ۳۰٪ نایکی کیش',
      subtitle: 'خرید انواع کفش‌های مسابقه‌ای ZoomX Vaporfly و رانینگ Pegasus',
      costPool: 80,
      discount: '۳۰ درصد تخفیف',
      badge: 'پرفروش‌ترین',
    },
    {
      id: 'majid_merooj_50',
      brand: 'Merooj (Majid)',
      title: 'کوپن ۱۰۰,۰۰۰ تومانی برند مجید',
      subtitle: 'خرید تیشرت‌های ضدتعریق رانینگ، لگ و ساق ورزشی مروژ',
      costPool: 50,
      discount: '۱۰۰ هزار تومان',
      badge: 'برند ملی',
    },
    {
      id: 'digikala_running',
      brand: 'Digikala Sport',
      title: 'تخفیف ۴۰٪ اکسسوری و تغذیه دوندگان',
      subtitle: 'شیکر، ژل‌های انرژی ایزوتونیک، کمربند بطری‌دار و جوراب ضدتاول',
      costPool: 60,
      discount: '۴۰ درصد تخفیف',
      badge: 'ارسال فوری',
    },
    {
      id: 'snappfood_fit',
      brand: 'SnappFood Diet',
      title: 'تخفیف ۲۵٪ سالادبار و غذای رژیمی',
      subtitle: 'سفارش پروتئین بار و وعده‌های ریکاوری استاندارد بعد از دویدن',
      costPool: 40,
      discount: '۲۵ درصد تخفیف',
      badge: 'تغذیه ورزشکاران',
    },
  ];

  // Challenges
  const challenges: ChallengeItem[] = [
    {
      id: 'tehran_virtual_10k',
      title: 'چالش ۱۰ کیلومتر هفتگی پایتخت',
      subtitle: 'تکمیل ۱۰ کیلومتر دویدن در طول هفته و قرعه‌کشی ساعت ورزشی Garmin Forerunner',
      entryFeePool: 20,
      prizePool: '۵,۰۰۰ POOL + ساعت گارمین',
      participants: 512,
      daysLeft: 4,
    },
    {
      id: 'bam_morning_speed',
      title: 'چالش صعود سرعتی بام تهران',
      subtitle: 'دویدن در شیب با میانگین ضربان قلب بالاتر از ۱۵۰ bpm و ثبت عملکرد برتر',
      entryFeePool: 15,
      prizePool: '۲,۵۰۰ POOL نقد',
      participants: 340,
      daysLeft: 2,
    },
    {
      id: 'persian_gulf_marathon',
      title: 'نیم ماراتن مجازی خلیج فارس (۲۱K)',
      subtitle: 'پیمایش مسافت ۲۱.۱ کیلومتر طی حداکثر ۳ روز و دریافت مدال فلزی ارسالی به آدرس',
      entryFeePool: 35,
      prizePool: '۱۰,۰۰۰ POOL + مدال یادبود',
      participants: 680,
      daysLeft: 9,
    },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const topWalletRef = useRef<HTMLDivElement>(null);
  const heroWalletRef = useRef<HTMLDivElement>(null);

  // Flying Coins Reward Animation State
  const [flyingCoins, setFlyingCoins] = useState<CoinParticle[]>([]);
  const [walletPulse, setWalletPulse] = useState(false);
  const [recentRewardGain, setRecentRewardGain] = useState<{ amount: number; id: number } | null>(null);

  // PvP Battles & Staking Arena State (Option 4)
  const [battles, setBattles] = useState<PvPBattle[]>(() => {
    const saved = localStorage.getItem('dopool_battles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'btl-101',
        opponentName: 'پوریا رضایی',
        opponentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        opponentCity: 'تهران',
        opponentCrew: 'باشگاه انقلاب تهران',
        distanceKm: 3.0,
        wagerPool: 25,
        prizePool: 47.5,
        status: 'COMPLETED',
        userPace: 4.65,
        opponentPace: 4.85,
        userTimeSec: 837,
        opponentTimeSec: 873,
        winner: 'USER',
        createdAt: 'دیروز',
      },
      {
        id: 'btl-102',
        opponentName: 'نیلوفر داوودی',
        opponentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
        opponentCity: 'شیراز',
        opponentCrew: 'ماراتن شیراز',
        distanceKm: 1.0,
        wagerPool: 10,
        prizePool: 19.0,
        status: 'COMPLETED',
        userPace: 4.40,
        opponentPace: 4.25,
        userTimeSec: 264,
        opponentTimeSec: 255,
        winner: 'OPPONENT',
        createdAt: '۲ روز پیش',
      },
    ];
  });

  // Active Duel Simulation state
  const [activeDuel, setActiveDuel] = useState<{
    isRunning: boolean;
    distanceKm: number;
    wagerPool: number;
    opponentName: string;
    opponentAvatar: string;
    opponentCity: string;
    opponentCrew: string;
    userProgress: number;
    opponentProgress: number;
    userPace: number;
    opponentPace: number;
    userHr: number;
    liveLog: string;
    elapsedSeconds: number;
    finished: boolean;
    winner: 'USER' | 'OPPONENT' | null;
  } | null>(null);

  const [selectedDuelDist, setSelectedDuelDist] = useState<number>(3.0);
  const [selectedDuelWager, setSelectedDuelWager] = useState<number>(25);

  // Cashout Modal & State (تسویه ریالی تومان - Option 4)
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutPoolAmount, setCashoutPoolAmount] = useState<number>(50);
  const [shebaInput, setShebaInput] = useState<string>('IR');

  // Smartwatch & Strava OAuth Modal State
  const [authWatchModal, setAuthWatchModal] = useState<{
    isOpen: boolean;
    provider: WatchProviderKey;
  }>({
    isOpen: false,
    provider: 'strava',
  });
  const [isAuthorizingWatch, setIsAuthorizingWatch] = useState(false);
  const [authStep, setAuthStep] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncingFromProvider, setIsSyncingFromProvider] = useState(false);

  // Daily Tasks & Daily Check-in State
  const [showDailyTasksModal, setShowDailyTasksModal] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('dopool_daily_tasks');
    const savedDate = localStorage.getItem('dopool_daily_tasks_date');
    if (saved && savedDate === today) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'task-login',
        title: 'ورود روزانه به اپلیکیشن',
        description: 'هر روز با ورود به برنامه، ۱۰ سکه POOL به عنوان تشویق دریافت کنید.',
        rewardPool: 10,
        icon: 'Gift',
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        target: 1,
        unit: 'ورود',
        category: 'checkin',
      },
      {
        id: 'task-run',
        title: 'دویدن حداقل ۱ کیلومتر در روز',
        description: 'امروز حداقل ۱ کیلومتر بدوید و فعالیت را با موفقیت تایید کنید.',
        rewardPool: 5,
        icon: 'Activity',
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        target: 1.0,
        unit: 'km',
        category: 'running',
      },
      {
        id: 'task-sync',
        title: 'همگام‌سازی ساعت ورزشی یا Strava',
        description: 'ساعت هوشمند خود را متصل کرده یا یک فعالیت را همگام‌سازی کنید.',
        rewardPool: 5,
        icon: 'Watch',
        isCompleted: true,
        isClaimed: false,
        progress: 1,
        target: 1,
        unit: 'سینک',
        category: 'hardware',
      },
      {
        id: 'task-crew',
        title: 'ارسال پیام تشویقی در کلاب تیمی',
        description: 'روی تالار گفتگوی کلاب دویدن خود یک پیام روحیه بخش ارسال کنید.',
        rewardPool: 3,
        icon: 'Users',
        isCompleted: false,
        isClaimed: false,
        progress: 0,
        target: 1,
        unit: 'پیام',
        category: 'social',
      },
    ];
  });
  const [cardInput, setCardInput] = useState<string>('');
  const [accountOwnerName, setAccountOwnerName] = useState<string>('سهراب مرادی');
  const [cashoutHistory, setCashoutHistory] = useState<CashoutRecord[]>(() => {
    const saved = localStorage.getItem('dopool_cashouts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'csh-101',
        poolAmount: 40,
        tomanAmount: 200000,
        shebaNumber: 'IR820170000000123456789012',
        bankName: 'بانک ملت',
        status: 'PROCESSED',
        trackingCode: 'PAYA-994821',
        createdAt: '۳ روز پیش',
      },
    ];
  });

  // Listen to Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setCloudUid(fbUser ? fbUser.uid : null);
    });
    return () => unsub();
  }, []);

  // Sync to localStorage & Firebase Cloud Vault
  useEffect(() => {
    if (user) {
      localStorage.setItem('dopool_user_session', JSON.stringify(user));
      localStorage.setItem('dopool_saved_profile', JSON.stringify(user));
      setLeaderboard((prev) =>
        prev.map((item) =>
          item.username.toLowerCase() === user.username.toLowerCase()
            ? { ...item, totalKm: user.totalKm, poolBalance: user.lockedPoolBalance }
            : item
        )
      );

      if (cloudUid && auth.currentUser?.emailVerified) {
        syncCloudUserVaultUpdate({
          fullName: user.fullName,
          username: user.username,
          email: user.email || `${user.username}@dopool.ir`,
          phone: user.phone || '09120000000',
          referralCode: user.referralCode,
          lockedPoolBalance: user.lockedPoolBalance,
          totalKm: user.totalKm,
          invitedFriendsCount: user.invitedFriendsCount,
          streakDays: user.streakDays || 1,
          battleWins: user.battleWins || 0,
          battleLosses: user.battleLosses || 0,
          battleRating: user.battleRating || 1200,
          firstLogin: Boolean(user.firstTimeMilestones?.firstLogin),
          firstActivity: Boolean(user.firstTimeMilestones?.firstActivity),
          firstInvite: Boolean(user.firstTimeMilestones?.firstInvite),
        }).catch(() => {});
      }
    } else {
      localStorage.removeItem('dopool_user_session');
    }
  }, [user, cloudUid]);

  useEffect(() => {
    localStorage.setItem('dopool_activities_v2', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('dopool_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('dopool_battles', JSON.stringify(battles));
  }, [battles]);

  useEffect(() => {
    localStorage.setItem('dopool_cashouts', JSON.stringify(cashoutHistory));
  }, [cashoutHistory]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dopool_daily_tasks', JSON.stringify(dailyTasks));
    localStorage.setItem('dopool_daily_tasks_date', today);
  }, [dailyTasks]);

  // PWA Install Prompt & URL ?ref= Referral Code Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL query parameters for ?ref=...
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setRegReferral(refParam.toUpperCase());
    }

    // Check if running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalledPWA(isStandalone);

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOSDevice(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalledPWA(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const canClaimCheckInToday = Boolean(user && user.lastDailyCheckIn !== todayDateStr);

  const activeMultiplier = useMemo(() => {
    let mult = 1.0;
    const hour = new Date().getHours();
    if (hour >= 5 && hour <= 10) mult += 0.2;
    if (user?.crewId) mult += 0.1;
    if ((user?.streakDays || 0) >= 3) mult += 0.1;
    if ((user?.battleRating || 1200) >= 1300) mult += 0.1;
    return Math.round(mult * 10) / 10;
  }, [user?.crewId, user?.streakDays, user?.battleRating]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Chime Synthesis (Reuses single AudioContext for zero main-thread blocking)
  const playChime = (type: 'bonus' | 'rank_up') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (type === 'rank_up') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.4);
        });
      } else {
        const notes = [659.25, 987.77];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.35);
        });
      }
    } catch {
      // Browser audio restriction fallback
    }
  };

  // Trigger Coin Flying Animation to Top Wallet
  const triggerCoinReward = (amount: number, origin?: { x: number; y: number } | HTMLElement | null) => {
    try {
      let startX = window.innerWidth / 2;
      let startY = window.innerHeight * 0.65;

      if (origin) {
        if ('x' in origin && 'y' in origin) {
          startX = origin.x;
          startY = origin.y;
        } else if (origin instanceof HTMLElement) {
          const rect = origin.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
        }
      }

      // Target: Top Wallet Pill in header
      let targetX = window.innerWidth - 75;
      let targetY = 32;
      if (topWalletRef.current) {
        const tRect = topWalletRef.current.getBoundingClientRect();
        targetX = tRect.left + tRect.width / 2;
        targetY = tRect.top + tRect.height / 2;
      }

      const count = Math.min(6, Math.max(4, Math.round(amount * 0.4)));
      const newCoins: CoinParticle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.3 - 0.15);
        const distance = 35 + Math.random() * 55;
        const scatterX = Math.cos(angle) * distance;
        const scatterY = Math.sin(angle) * distance - 24;

        newCoins.push({
          id: `coin-${Date.now()}-${i}`,
          startX,
          startY,
          targetX,
          targetY,
          scatterX,
          scatterY,
          rotation: (Math.random() - 0.5) * 360,
          delay: i * 0.03,
          scale: 0.9,
        });
      }

      setFlyingCoins(newCoins);
      setRecentRewardGain({ amount, id: Date.now() });

      // Impact on wallet badge when coins reach the top
      setTimeout(() => {
        setWalletPulse(true);
        playChime('bonus');
        setTimeout(() => setWalletPulse(false), 450);
      }, 550);

      // Clear particles & reward banner after animation
      setTimeout(() => {
        setFlyingCoins([]);
      }, 1250);
      setTimeout(() => {
        setRecentRewardGain(null);
      }, 2400);
    } catch (e) {
      console.error('Error triggering coin animation', e);
    }
  };

  // Dispatch Push Notification (Supports Mobile Service Worker + Desktop + Haptic Vibration)
  const dispatchPushNotification = ({
    type,
    title,
    body,
    poolAmount = 0,
  }: {
    type: 'REFERRAL_BONUS' | 'TOKEN_AWARD' | 'RANK_UP' | 'SYSTEM';
    title: string;
    body: string;
    poolAmount?: number;
  }) => {
    playChime(type === 'RANK_UP' ? 'rank_up' : 'bonus');

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 60, 140]);
      } catch {
        // Ignore on unsupported devices
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notifOptions: NotificationOptions = {
        body,
        dir: 'rtl',
        lang: 'fa',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `dopool-${Date.now()}`,
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, notifOptions);
          })
          .catch(() => {
            try {
              new Notification(title, notifOptions);
            } catch {
              // Fallback
            }
          });
      } else {
        try {
          new Notification(title, notifOptions);
        } catch {
          // Fallback
        }
      }
    }

    const newNotif: PushNotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title,
      body,
      poolAmount,
      isRead: false,
      createdAt: 'همین الان',
    };

    setNotifications((prev) => [newNotif, ...prev]);
    triggerToast(title, body, type === 'RANK_UP' ? 'success' : 'success');

    // Trigger Flying Coins Animation towards top wallet
    if (poolAmount && poolAmount > 0) {
      triggerCoinReward(poolAmount);
    }
  };

  // Request browser push notification permission
  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      triggerToast('عدم پشتیبانی', 'مرورگر شما از سرویس Web Push پشتیبانی نمی‌کند.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        triggerToast('نوتیفیکیشن فعال شد! 🔔', 'اکنون پیام‌های پاداش دویدن و ارتقای رتبه را دریافت خواهید کرد.', 'success');
        dispatchPushNotification({
          type: 'SYSTEM',
          title: 'سرویس پوش نوتیفیکیشن دوپول فعال شد! ⚡',
          body: 'هر زمان پاداش رفرال یا رتبه جدید کسب کنید، پیام آنی روی گوشی شما نمایش داده خواهد شد.',
        });
      } else {
        triggerToast('مجوز صادر نشد', 'ارسال نوتیفیکیشن در تنظیمات مرورگر مسدود است.', 'warning');
      }
    } catch {
      triggerToast('خطا', 'امکان دریافت مجوز در این وضعیت وجود ندارد.', 'error');
    }
  };

  // Claim Daily Login Check-in Bonus (10 POOL)
  const handleClaimDailyCheckIn = (e?: React.MouseEvent) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    if (user.lastDailyCheckIn === today) {
      triggerToast('قبلاً دریافت شده', 'شما پاداش ورود ۱۰ سکه‌ای امروز را دریافت کرده‌اید. فردا دوباره سر بزنید!', 'info');
      return;
    }

    const rewardAmount = 10;
    const newBalance = Math.round((user.lockedPoolBalance + rewardAmount) * 10) / 10;
    const newStreak = (user.streakDays || 0) + 1;

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lockedPoolBalance: newBalance,
        streakDays: newStreak,
        lastDailyCheckIn: today,
      };
    });

    // Mark task-login as completed and claimed
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === 'task-login' ? { ...t, isCompleted: true, isClaimed: true, progress: 1 } : t))
    );

    localStorage.setItem('dopool_daily_checkin_date', today);

    // Trigger visual coins flying to the top wallet!
    const targetElement = (e?.currentTarget as HTMLElement) || heroWalletRef.current;
    triggerCoinReward(rewardAmount, targetElement);

    dispatchPushNotification({
      type: 'TOKEN_AWARD',
      title: 'پاداش ورود روزانه دریافت شد! 🎁⚡',
      body: `۱۰ سکه POOL به مناسبت ورود روزانه به اپلیکیشن به حساب شما افزوده شد. استریک شما به ${newStreak} روز رسید!`,
      poolAmount: rewardAmount,
    });

    triggerToast('پاداش ورود دریافت شد! 🎉', `۱۰ سکه POOL تشویقی به کیف پول شما اضافه گردید.`, 'success');
  };

  // Claim Daily Task Reward
  const handleClaimTaskReward = (taskId: string, e?: React.MouseEvent) => {
    if (!user) return;
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!task.isCompleted) {
      triggerToast('تکمیل نشده', 'ابتدا باید شرایط این تسک را برآورده کنید.', 'warning');
      return;
    }
    if (task.isClaimed) {
      triggerToast('قبلاً دریافت شده', 'شما قبلاً پاداش این تسک را دریافت کرده‌اید.', 'info');
      return;
    }

    const rewardAmount = task.rewardPool;
    const newBalance = Math.round((user.lockedPoolBalance + rewardAmount) * 10) / 10;

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lockedPoolBalance: newBalance,
      };
    });

    setDailyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isClaimed: true } : t))
    );

    const targetElement = (e?.currentTarget as HTMLElement) || heroWalletRef.current;
    triggerCoinReward(rewardAmount, targetElement);

    dispatchPushNotification({
      type: 'TOKEN_AWARD',
      title: `جایزه ماموریت «${task.title}» 🏆`,
      body: `${rewardAmount} سکه POOL به کیف پول شما واریز شد!`,
      poolAmount: rewardAmount,
    });

    triggerToast('ماموریت تکمیل شد! ⭐', `${rewardAmount} سکه POOL به کیف پول شما واریز گردید.`, 'success');
  };

  // Show Toast
  const triggerToast = (message: string, detail?: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setToast({ message, detail, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Calculate user rank on leaderboard
  const getUserRank = (totalKm: number) => {
    const higherCount = leaderboard.filter(
      (r) => r.username.toLowerCase() !== user?.username.toLowerCase() && r.totalKm > totalKm
    ).length;
    return higherCount + 1;
  };

  // Anti-Cheat Engine (Proof of Human) Verification
  const verifyAntiCheat = (distanceKm: number, avgHr: number, paceMinPerKm: number) => {
    const reasons: string[] = [];
    if (distanceKm < 1.0) {
      reasons.push(`مسافت ثبت‌شده (${distanceKm.toFixed(2)} km) کمتر از حداقل مجاز (۱.۰ کیلومتر) است.`);
    }
    if (avgHr < 110) {
      reasons.push(`میانگین ضربان قلب (${avgHr} bpm) کمتر از حد فعالیت شدید دویدن (۱۱۰ bpm) است.`);
    }
    if (paceMinPerKm < 2.66) {
      const pMin = Math.floor(paceMinPerKm);
      const pSec = Math.round((paceMinPerKm - pMin) * 60);
      reasons.push(`سرعت نامتعارف (پیس ${pMin}:${pSec < 10 ? '0' : ''}${pSec} سریع‌تر از ۲:۴۰ دقیقه/کیلومتر - تقلب خودرو/دوچرخه).`);
    } else if (paceMinPerKm > 9.5) {
      const pMin = Math.floor(paceMinPerKm);
      const pSec = Math.round((paceMinPerKm - pMin) * 60);
      reasons.push(`سرعت پایین‌تر از حد دویدن (پیس ${pMin}:${pSec < 10 ? '0' : ''}${pSec} کندتر از ۹:۳۰ دقیقه/کیلومتر - پیاده‌روی).`);
    }

    const isValid = reasons.length === 0;
    return {
      isValid,
      reason: isValid ? undefined : reasons.join(' | '),
    };
  };

  // Check if an activity with the same filename or identical telemetry is already registered
  const findExistingDuplicateActivity = (
    filename: string,
    distanceKm: number,
    elapsedSec: number,
    avgHr: number
  ): RunActivity | undefined => {
    const normFile = filename.trim().toLowerCase();
    return activities.find(
      (a) =>
        a.filename.trim().toLowerCase() === normFile ||
        (Math.abs(a.distanceKm - distanceKm) < 0.01 &&
          a.elapsedSeconds === elapsedSec &&
          a.avgHeartRate === avgHr)
    );
  };

  // Process a verified run with Proof of Human, Anti-Duplicate Check & Multi-Factor Reward Breakdown
  const handleProcessRun = (
    distanceKm: number,
    elapsedSec: number,
    avgHr: number,
    filename: string,
    source: string,
    customMeta?: {
      title?: string;
      elevGainMeters?: number;
      cadenceScore?: number;
      proofOfHumanScore?: number;
      overrideMultiplier?: number;
    }
  ): boolean => {
    if (!user) return false;

    // 1. Anti-Duplicate Activity Check (جلوگیری از ثبت تکراری اکتیویتی)
    const existingDuplicate = findExistingDuplicateActivity(filename, distanceKm, elapsedSec, avgHr);
    if (existingDuplicate) {
      triggerToast(
        'خطای ثبت تکراری اکتیویتی ⚠️',
        `این فعالیت (${existingDuplicate.title || existingDuplicate.filename} · ${existingDuplicate.distanceKm} km) قبلاً در سیستم ثبت شده و امکان دریافت سکه مجدد وجود ندارد.`,
        'error'
      );
      return false;
    }

    const pace = distanceKm > 0 ? elapsedSec / 60 / distanceKm : 99;
    const { isValid, reason } = verifyAntiCheat(distanceKm, avgHr, pace);

    const isFirstActivityBonus = isValid && !user.firstTimeMilestones?.firstActivity;
    const firstActivityBonusAmount = isFirstActivityBonus ? 10 : 0;
    const mult = customMeta?.overrideMultiplier ?? activeMultiplier;

    const draftActivity: RunActivity = {
      id: `act-${Date.now()}`,
      title:
        customMeta?.title ||
        (filename.toLowerCase().includes('morning')
          ? 'Morning Run · دویدن صبحگاهی'
          : `دویدن ${source}`),
      filename,
      distanceKm: Math.round(distanceKm * 100) / 100,
      elevGainMeters:
        customMeta?.elevGainMeters ?? Math.max(12, Math.round(distanceKm * 3.7)),
      elapsedSeconds: elapsedSec,
      avgHeartRate: avgHr,
      paceMinPerKm: pace,
      status: isValid ? 'ACCEPTED' : 'REJECTED',
      rejectionReason: reason,
      poolReward: 0,
      createdAt: 'لحظاتی پیش',
      source,
      multiplier: mult,
      energyUsed: 0,
      gpsScore: isValid ? 100 : 45,
      hrScore: isValid ? 100 : 52,
      cadenceScore: customMeta?.cadenceScore ?? (isValid ? 76 : 28),
      proofOfHumanScore: customMeta?.proofOfHumanScore ?? (isValid ? 95 : 42),
      firstActivityBonus: firstActivityBonusAmount,
    };

    const breakdown = computeActivityRewardBreakdown(draftActivity);
    const totalEarned = isValid ? breakdown.earnedCoins : 0;
    const newActivity: RunActivity = {
      ...draftActivity,
      poolReward: totalEarned,
    };

    setActivities((prev) => deduplicateActivitiesList([newActivity, ...prev]));
    setSelectedReceiptActivity(newActivity);

    // Record SHA-256 fingerprint & verified activity in Firebase Firestore Cloud Vault
    recordCloudRunActivity({
      id: newActivity.id,
      title: newActivity.title || 'دویدن دوپول',
      filename: newActivity.filename,
      distanceKm: newActivity.distanceKm,
      elapsedSeconds: newActivity.elapsedSeconds,
      avgHeartRate: newActivity.avgHeartRate,
      paceMinPerKm: newActivity.paceMinPerKm,
      status: newActivity.status,
      poolReward: newActivity.poolReward,
      source: newActivity.source,
    }).catch(() => {});

    if (isValid) {
      setPostRunNutritionPopup(newActivity);
      const oldRank = getUserRank(user.totalKm);
      const newTotalKm = Math.round((user.totalKm + distanceKm) * 10) / 10;
      const newPoolBal = Math.round((user.lockedPoolBalance + totalEarned) * 10) / 10;

      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lockedPoolBalance: newPoolBal,
          totalKm: newTotalKm,
          firstTimeMilestones: {
            firstLogin: prev.firstTimeMilestones?.firstLogin || false,
            firstActivity: true,
            firstInvite: prev.firstTimeMilestones?.firstInvite || false,
          },
        };
      });

      triggerCoinReward(totalEarned, topWalletRef.current);

      // Update Crew total & weekly km if user is in a crew
      if (user.crewId) {
        setCrews((prev) =>
          prev.map((c) =>
            c.id === user.crewId
              ? {
                  ...c,
                  weeklyKm: Math.round((c.weeklyKm + distanceKm) * 10) / 10,
                  totalKm: Math.round((c.totalKm + distanceKm) * 10) / 10,
                }
              : c
          )
        );
      }

      // 1. Dispatch Push Notification: Token Award
      dispatchPushNotification({
        type: 'TOKEN_AWARD',
        title: isFirstActivityBonus
          ? `تایید فعالیت + ${totalEarned} سکه (همراه هدیه اولین اکتیویتی)! 🎉⚡`
          : `پاداش فعالیت دویدن واریز شد (+${totalEarned} POOL)! ⚡`,
        body: `مسافت ${distanceKm.toFixed(2)}km با امتیاز Proof of Human ${breakdown.pohScore}/100 تایید شد و ${totalEarned} سکه POOL به کیف پول شما اضافه گردید.`,
        poolAmount: totalEarned,
      });

      // 2. Check if user ranked up on leaderboard
      const newRank = getUserRank(newTotalKm);
      if (newRank < oldRank) {
        setTimeout(() => {
          dispatchPushNotification({
            type: 'RANK_UP',
            title: 'ارتقای رتبه در جدول برترین‌ها! 🏆',
            body: `تبریک قهرمان! شما با رسیدن به مسافت ${newTotalKm} کیلومتر، از رتبه ${oldRank} به رتبه ${newRank} صعود کردید!`,
          });
        }, 1200);
      }
    } else {
      triggerToast('رد توسط سیستم ضدتقلب ⚠️', reason || 'فعالیت با استانداردهای دویدن تطابق ندارد.', 'warning');
    }
    return true;
  };

  // Refill user daily energy
  const handleRefillEnergy = () => {
    if (!user) return;
    setUser({ ...user, dailyEnergyCurrent: user.dailyEnergyMax });
    triggerToast('شارژ انرژی ⚡', 'انرژی روزانه شما به ۲۰ / ۲۰ شارژ مجدد گردید.', 'success');
  };

  // PvP Battle Handlers (Option 4)
  const handleStartDuel = () => {
    if (!user) return;
    if (user.lockedPoolBalance < selectedDuelWager) {
      triggerToast('موجودی ناکافی POOL', `برای شرکت در این دوئل به ${selectedDuelWager} توکن استیک نیاز دارید.`, 'error');
      return;
    }

    const newBal = Math.round((user.lockedPoolBalance - selectedDuelWager) * 10) / 10;
    setUser({ ...user, lockedPoolBalance: newBal });

    const opponents = [
      { name: 'پوریا رضایی', city: 'تهران', crew: 'باشگاه انقلاب تهران', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces', basePace: 4.45 },
      { name: 'نیلوفر داوودی', city: 'شیراز', crew: 'تیم ماراتن شیراز', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces', basePace: 4.60 },
      { name: 'کامران حسینی', city: 'تهران', crew: 'دوندگان پارک لاله', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces', basePace: 4.75 },
      { name: 'الناز شاکری', city: 'کیش', crew: 'کلاب دوندگان ساحلی کیش', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces', basePace: 4.80 },
    ];
    const picked = opponents[Math.floor(Math.random() * opponents.length)];

    const userBasePace = Math.max(3.8, 4.45 - ((user.battleRating || 1250) - 1200) * 0.002);
    const opponentFinalPace = picked.basePace + (Math.random() * 0.4 - 0.2);

    setActiveDuel({
      isRunning: true,
      distanceKm: selectedDuelDist,
      wagerPool: selectedDuelWager,
      opponentName: picked.name,
      opponentAvatar: picked.avatar,
      opponentCity: picked.city,
      opponentCrew: picked.crew,
      userProgress: 5,
      opponentProgress: 5,
      userPace: Math.round(userBasePace * 100) / 100,
      opponentPace: Math.round(opponentFinalPace * 100) / 100,
      userHr: 148,
      liveLog: 'شلیک تپانچه آغاز مسابقه! هر دو دونده با شتاب از خط استارت جدا شدند.',
      elapsedSeconds: 0,
      finished: false,
      winner: null,
    });
  };

  useEffect(() => {
    if (!activeDuel || !activeDuel.isRunning || activeDuel.finished) return;

    const interval = setInterval(() => {
      setActiveDuel((prev) => {
        if (!prev || !prev.isRunning || prev.finished) return prev;

        const nextElapsed = prev.elapsedSeconds + 12;
        const userStep = 18 + Math.random() * 14;
        const oppStep = 16 + Math.random() * 15;

        const nextUserProg = Math.min(100, prev.userProgress + userStep);
        const nextOppProg = Math.min(100, prev.opponentProgress + oppStep);

        const commentaries = [
          `سهراب با گام‌های کشیده در حال افزایش فاصله است (پیس: ${prev.userPace} min/km)`,
          `${prev.opponentName} با ریتم تنفس منظم در تعقیب مستقیم است`,
          `عبور از پیچ میانی مسیر مسابقه ${prev.distanceKm} کیلومتری - رقابت شانه به شانه!`,
          `موتور ضدتقلب و هوش مصنوعی داوری سلامت ضربان و کادنس هر دو دونده را تایید کرد`,
          `ورود به ۱۰۰ متر پایانی و اسپری نهایی به سمت خط پایان!`,
        ];
        const logMsg = commentaries[Math.floor(Math.random() * commentaries.length)];

        if (nextUserProg >= 100 || nextOppProg >= 100) {
          const userWon = nextUserProg >= nextOppProg;
          return {
            ...prev,
            userProgress: userWon ? 100 : Math.min(99, nextUserProg),
            opponentProgress: userWon ? Math.min(98, nextOppProg) : 100,
            elapsedSeconds: nextElapsed,
            liveLog: userWon ? `سهراب با افتخار از خط پایان گذشت و پیروز دوئل شد! 🏆` : `${prev.opponentName} زودتر به خط پایان رسید.`,
            finished: true,
            winner: userWon ? 'USER' : 'OPPONENT',
          };
        }

        return {
          ...prev,
          userProgress: nextUserProg,
          opponentProgress: nextOppProg,
          elapsedSeconds: nextElapsed,
          liveLog: logMsg,
          userHr: Math.min(178, prev.userHr + Math.floor(Math.random() * 4)),
        };
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [activeDuel]);

  const handleClaimDuelResult = () => {
    if (!activeDuel || !user || !activeDuel.finished) return;

    const isUserWinner = activeDuel.winner === 'USER';
    const totalPrize = Math.round(activeDuel.wagerPool * 2 * 0.95 * 10) / 10;

    if (isUserWinner) {
      const newBal = Math.round((user.lockedPoolBalance + totalPrize) * 10) / 10;
      const newWins = (user.battleWins || 0) + 1;
      const newRating = (user.battleRating || 1200) + 25;
      setUser({
        ...user,
        lockedPoolBalance: newBal,
        battleWins: newWins,
        battleRating: newRating,
      });

      playChime('rank_up');
      dispatchPushNotification({
        type: 'TOKEN_AWARD',
        title: 'پیروزی در دوئل ورزشی بیت‌ران! ⚔️🏆',
        body: `شما در مسابقه ${activeDuel.distanceKm}km مقابل ${activeDuel.opponentName} پیروز شدید (+${totalPrize} POOL جایزه و +25 امتیاز رتبه بتل).`,
        poolAmount: totalPrize,
      });
      triggerToast('پیروزی در دوئل! ⚔️🎉', `تبریک! ${totalPrize} توکن POOL جایزه به کیف پول شما واریز شد.`, 'success');
    } else {
      const newLosses = (user.battleLosses || 0) + 1;
      const newRating = Math.max(1000, (user.battleRating || 1200) - 15);
      setUser({
        ...user,
        battleLosses: newLosses,
        battleRating: newRating,
      });
      triggerToast('پایان مسابقه', `حریف با اختلاف ناچیز به پیروزی رسید. امتیاز بتل شما: ${newRating}`, 'info');
    }

    const record: PvPBattle = {
      id: `btl-${Date.now()}`,
      opponentName: activeDuel.opponentName,
      opponentAvatar: activeDuel.opponentAvatar,
      opponentCity: activeDuel.opponentCity,
      opponentCrew: activeDuel.opponentCrew,
      distanceKm: activeDuel.distanceKm,
      wagerPool: activeDuel.wagerPool,
      prizePool: totalPrize,
      status: 'COMPLETED',
      userPace: activeDuel.userPace,
      opponentPace: activeDuel.opponentPace,
      userTimeSec: activeDuel.elapsedSeconds,
      opponentTimeSec: activeDuel.elapsedSeconds + (isUserWinner ? 8 : -8),
      winner: activeDuel.winner,
      createdAt: 'لحظاتی پیش',
    };
    setBattles((prev) => [record, ...prev]);
    setActiveDuel(null);
  };

  // Cashout Handler (Option 4)
  const handleRequestCashout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (cashoutPoolAmount < 20) {
      triggerToast('حداقل مبلغ تسویه', 'حداقل تعداد توکن قابل تسویه ۲۰ POOL می‌باشد.', 'warning');
      return;
    }
    if (user.lockedPoolBalance < cashoutPoolAmount) {
      triggerToast('موجودی ناکافی', `موجودی شما (${user.lockedPoolBalance} POOL) کمتر از مبلغ درخواستی است.`, 'error');
      return;
    }
    const cleanSheba = shebaInput.trim().toUpperCase();
    if (!cleanSheba.startsWith('IR') || cleanSheba.length < 16) {
      triggerToast('شماره شبا نامعتبر', 'لطفاً شماره شبا معتبر بانکی را به صورت کامل (IR...) وارد فرمایید.', 'error');
      return;
    }

    const toman = cashoutPoolAmount * 5000;
    const newBal = Math.round((user.lockedPoolBalance - cashoutPoolAmount) * 10) / 10;
    const tracking = `PAYA-${Math.floor(100000 + Math.random() * 900000)}`;

    setUser({ ...user, lockedPoolBalance: newBal });

    const newCashout: CashoutRecord = {
      id: `csh-${Date.now()}`,
      poolAmount: cashoutPoolAmount,
      tomanAmount: toman,
      shebaNumber: cleanSheba,
      bankName: 'بانک عضو شتاب',
      status: 'PENDING',
      trackingCode: tracking,
      createdAt: 'لحظاتی پیش',
    };
    setCashoutHistory((prev) => [newCashout, ...prev]);
    setShowCashoutModal(false);

    // Record payout audit log in Firebase Firestore Cloud Vault
    recordCloudCashout(newCashout).catch(() => {});

    dispatchPushNotification({
      type: 'SYSTEM',
      title: 'درخواست تسویه ریالی ثبت شد 💳🇮🇷',
      body: `مبلغ ${toman.toLocaleString('fa-IR')} تومان معادل ${cashoutPoolAmount} POOL ثبت شد. کد پیگیری پایا: ${tracking}`,
    });
    triggerToast('تسویه در جریان 💳', `درخواست تسویه ${toman.toLocaleString('fa-IR')} تومان با کد ${tracking} در صف انتقال پایا قرار گرفت.`, 'success');
  };

  // Join a Running Crew
  const handleJoinCrew = (crew: RunningCrew) => {
    if (!user) return;
    setUser({
      ...user,
      crewId: crew.id,
      crewName: crew.name,
      crewBadge: crew.badge,
    });
    setCrews((prev) =>
      prev.map((c) => (c.id === crew.id ? { ...c, membersCount: c.membersCount + 1 } : c))
    );
    dispatchPushNotification({
      type: 'SYSTEM',
      title: 'عضویت در کلاب دویدن تایید شد! 🏃‍♂️',
      body: `شما به تیم «${crew.name}» پیوستید. ضریب پاداش کلاب تیمی (+0.1x) برای شما فعال گردید!`,
    });
    triggerToast('خوش آمدید!', `شما با موفقیت به تیم ${crew.name} ملحق شدید.`, 'success');
  };

  // Leave Crew
  const handleLeaveCrew = () => {
    if (!user) return;
    setUser({
      ...user,
      crewId: undefined,
      crewName: undefined,
      crewBadge: undefined,
    });
    triggerToast('ترک تیم', 'شما از کلاب دویدن خارج شدید.', 'info');
  };

  // Post a message to Crew message board
  const handleSendCrewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewMsg.trim() || !user || !user.crewId) return;

    const newMsg: CrewMessage = {
      id: Date.now(),
      crewId: user.crewId,
      userName: user.fullName,
      message: newCrewMsg.trim(),
      createdAt: 'همین الان',
    };

    setCrewMessages([newMsg, ...crewMessages]);
    setNewCrewMsg('');
    triggerToast('ارسال پیام', 'پیام شما روی دیوار گفتگوی کلاب ثبت شد.', 'success');
  };

  // Create a new crew
  const handleCreateCrewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim() || !newCrewCity.trim() || !user) return;

    const newCrew: RunningCrew = {
      id: Date.now(),
      name: newCrewName.trim(),
      city: newCrewCity.trim(),
      badge: newCrewBadge || '🔥',
      description: newCrewDesc.trim() || 'کلاب دوندگان پرانرژی',
      weeklyKm: 0,
      totalKm: 0,
      membersCount: 1,
      rank: crews.length + 1,
    };

    setCrews([...crews, newCrew]);
    setUser({
      ...user,
      crewId: newCrew.id,
      crewName: newCrew.name,
      crewBadge: newCrew.badge,
    });

    setShowCreateCrewModal(false);
    setNewCrewName('');
    setNewCrewCity('');
    setNewCrewDesc('');

    dispatchPushNotification({
      type: 'SYSTEM',
      title: 'کلاب دویدن شما تاسیس شد! 🏁',
      body: `تیم جدید «${newCrew.name}» با کاپیتانی شما ایجاد گردید. دوندگان را به تیم دعوت کنید!`,
    });
    triggerToast('تبریک!', `کلاب ${newCrew.name} با موفقیت راه‌اندازی شد.`, 'success');
  };

  // Simulate friend joining with referral code (+ First Invite 10-coin milestone)
  const simulateFriendReferral = () => {
    if (!user) return;
    const isFirstInvite = !user.firstTimeMilestones?.firstInvite;
    const rewardAmount = 10.0;
    const newBal = Math.round((user.lockedPoolBalance + rewardAmount) * 10) / 10;
    const newCount = user.invitedFriendsCount + 1;

    setUser({
      ...user,
      lockedPoolBalance: newBal,
      invitedFriendsCount: newCount,
      firstTimeMilestones: {
        firstLogin: user.firstTimeMilestones?.firstLogin || false,
        firstActivity: user.firstTimeMilestones?.firstActivity || false,
        firstInvite: true,
      },
    });

    const friendNames = ['کامران داوودی', 'نیلوفر رضایی', 'رضا شاکری', 'الناز حسینی', 'مهدی صادقی'];
    const randomFriend = friendNames[Math.floor(Math.random() * friendNames.length)];

    dispatchPushNotification({
      type: 'REFERRAL_BONUS',
      title: isFirstInvite ? 'جایزه اولین دعوت (+۱۰ سکه) واریز شد! 🎉' : 'پاداش دعوت دوست واریز شد! 🎉',
      body: `دوست شما (${randomFriend}) با کد معرف ${user.referralCode} ثبت‌نام کرد و ۱۰ سکه POOL به حساب شما اضافه شد!`,
      poolAmount: rewardAmount,
    });
  };

  // Claim 10-Coin First-Time Milestone Rewards (اولین لاگین، اولین اکتیویتی، اولین دعوت)
  const handleClaimFirstMilestone = (
    key: 'firstLogin' | 'firstActivity' | 'firstInvite',
    e?: React.MouseEvent
  ) => {
    if (!user) return;
    const currentMilestones = user.firstTimeMilestones || {
      firstLogin: false,
      firstActivity: false,
      firstInvite: false,
    };

    if (currentMilestones[key]) {
      triggerToast('قبلاً دریافت شده ✓', 'جایزه ۱۰ سکه‌ای این مرحله قبلاً به کیف پول شما واریز شده است.', 'info');
      return;
    }

    const rewardAmount = 10.0;
    const newBal = Math.round((user.lockedPoolBalance + rewardAmount) * 10) / 10;

    const labels: Record<'firstLogin' | 'firstActivity' | 'firstInvite', { title: string; body: string }> = {
      firstLogin: {
        title: 'جایزه اولین لاگین (+۱۰ سکه) دریافت شد! 🎁',
        body: '۱۰ سکه POOL به مناسبت اولین ورود به حساب کاربری به کیف پول شما واریز گردید.',
      },
      firstActivity: {
        title: 'جایزه اولین اکتیویتی (+۱۰ سکه) دریافت شد! 🏃‍♂️',
        body: '۱۰ سکه POOL به مناسبت ثبت اولین فعالیت ورزشی به کیف پول شما افزوده شد.',
      },
      firstInvite: {
        title: 'جایزه اولین دعوت (+۱۰ سکه) دریافت شد! 🤝',
        body: '۱۰ سکه POOL به مناسبت اولین دعوت از دوستان به کیف پول شما واریز شد.',
      },
    };

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lockedPoolBalance: newBal,
        totalKm: key === 'firstActivity' && prev.totalKm === 0 ? 1.5 : prev.totalKm,
        invitedFriendsCount: key === 'firstInvite' && prev.invitedFriendsCount === 0 ? 1 : prev.invitedFriendsCount,
        firstTimeMilestones: {
          firstLogin: prev.firstTimeMilestones?.firstLogin || false,
          firstActivity: prev.firstTimeMilestones?.firstActivity || false,
          firstInvite: prev.firstTimeMilestones?.firstInvite || false,
          [key]: true,
        },
      };
    });

    const targetElement = (e?.currentTarget as HTMLElement) || topWalletRef.current;
    triggerCoinReward(rewardAmount, targetElement);

    dispatchPushNotification({
      type: key === 'firstInvite' ? 'REFERRAL_BONUS' : 'TOKEN_AWARD',
      title: labels[key].title,
      body: labels[key].body,
      poolAmount: rewardAmount,
    });
  };

  const handleResetFirstMilestones = () => {
    if (!user) return;
    setUser({
      ...user,
      firstTimeMilestones: {
        firstLogin: false,
        firstActivity: false,
        firstInvite: false,
      },
    });
    triggerToast('ریست جوایز شروع 🔄', 'هر ۳ جایزه ۱۰ سکه‌ای (اولین لاگین، اولین اکتیویتی، اولین دعوت) مجدداً آماده دریافت شدند.', 'info');
  };

  // Simulate rank up directly from tester
  const simulateRankUp = () => {
    if (!user) return;
    const newTotalKm = Math.round((user.totalKm + 15.0) * 10) / 10;
    setUser({ ...user, totalKm: newTotalKm });

    dispatchPushNotification({
      type: 'RANK_UP',
      title: 'ارتقای رتبه در جدول برترین‌ها! 🏆',
      body: `تبریک! شما به رتبه ۲ جدول رده‌بندی دوندگان برتر نایکی ایران صعود کردید!`,
    });
  };

  // File Upload
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.fit')) {
      triggerToast('فرمت نامعتبر', 'لطفاً فقط فایل با پسوند .fit بارگذاری فرمایید.', 'error');
      return;
    }

    const randDist = 4.0 + (file.size % 70) / 10;
    const randHr = 138 + (file.size % 25);
    const randPace = 4.8 + (file.size % 15) / 10;
    const elapsed = Math.round(randDist * randPace * 60);

    // Immediate anti-duplicate check before parsing
    const existingDup = findExistingDuplicateActivity(file.name, randDist, elapsed, randHr);
    if (existingDup) {
      triggerToast(
        'خطای فایل تکراری ⚠️',
        `فایل «${file.name}» قبلاً در سیستم ثبت شده و پاداش آن دریافت گردیده است.`,
        'error'
      );
      return;
    }

    triggerToast('تحلیل فایل .fit', 'در حال استخراج استریم ضربان قلب و بررسی سرعت...', 'info');

    setTimeout(() => {
      handleProcessRun(randDist, elapsed, randHr, file.name, 'FIT File Parse');
    }, 1200);
  };

  // Open Watch / Strava OAuth Modal
  const openWatchAuthModal = (provider: WatchProviderKey) => {
    setAuthWatchModal({
      isOpen: true,
      provider,
    });
    setCopiedLink(false);
    setIsAuthorizingWatch(false);
    setAuthStep(1);
  };

  // Authorize Watch / Strava Account (OAuth 2.0 Handshake)
  const handleAuthorizeWatch = (provider: WatchProviderKey) => {
    if (!user) return;
    setIsAuthorizingWatch(true);
    setAuthStep(1);

    setTimeout(() => {
      setAuthStep(2);
    }, 700);

    setTimeout(() => {
      setAuthStep(3);
    }, 1400);

    setTimeout(() => {
      setIsAuthorizingWatch(false);
      setAuthStep(1);

      const providerInfo = WATCH_PROVIDERS.find((p) => p.id === provider);
      const providerName = providerInfo ? providerInfo.nameFa : provider;

      setUser((prev) => {
        if (!prev) return null;
        const currentDetails = prev.watchAuthDetails || {};
        return {
          ...prev,
          connectedWatches: {
            ...prev.connectedWatches,
            [provider]: true,
          },
          watchAuthDetails: {
            ...currentDetails,
            [provider]: {
              athleteName: prev.fullName || 'سهراب مرادی',
              athleteId:
                provider === 'strava'
                  ? '4829103'
                  : provider === 'garmin'
                  ? 'GRM-98124'
                  : provider === 'appleHealth'
                  ? 'HK-77291'
                  : provider === 'xiaomi'
                  ? 'MI-91283'
                  : 'ATH-44810',
              connectedAt:
                'امروز، ساعت ' +
                new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
              lastSyncedAt: 'هم‌اکنون',
              accessToken: `${provider}_live_` + Math.random().toString(36).slice(2, 10),
              autoSync: true,
            },
          },
        };
      });

      dispatchPushNotification({
        type: 'SYSTEM',
        title: `اتصال ${providerName} تایید شد ⚡`,
        body: 'اکانت ورزشی شما با موفقیت به پروتکل ماینینگ دوپ‌Pool متصل گردید. دویدن‌های بعدی به طور خودکار همگام می‌شوند.',
      });

      triggerToast(
        'اتصال موفق OAuth 2.0 ⚡',
        `سرویس ${providerName} با موفقیت احراز هویت و مجوزهای لازم اعطا شد.`,
        'success'
      );
    }, 2100);
  };

  // Revoke Watch / Strava OAuth Access
  const handleRevokeWatch = (provider: WatchProviderKey) => {
    if (!user) return;
    const providerInfo = WATCH_PROVIDERS.find((p) => p.id === provider);
    const providerName = providerInfo ? providerInfo.nameFa : provider;

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        connectedWatches: {
          ...prev.connectedWatches,
          [provider]: false,
        },
      };
    });

    triggerToast(
      'قطع ارتباط سرویس',
      `مجوز دسترسی ${providerName} با موفقیت لغو و اتصال قطع گردید.`,
      'info'
    );
  };

  // Fetch latest run from Watch / Strava Server (Protected against duplicate syncing)
  const handleSyncWatchActivity = (provider: WatchProviderKey) => {
    if (!user) return;

    const providerInfo = WATCH_PROVIDERS.find((p) => p.id === provider);
    const providerName = providerInfo ? providerInfo.nameFa : provider;
    const todayKey = new Date().toISOString().split('T')[0];

    const providerDailyWorkouts: Record<
      WatchProviderKey,
      { dist: number; elapsed: number; hr: number; elev: number; title: string }
    > = {
      strava: { dist: 6.8, elapsed: 2040, hr: 154, elev: 42, title: 'دویدن عصرگاهی استراوا · Strava Run' },
      garmin: { dist: 7.5, elapsed: 2205, hr: 151, elev: 48, title: 'دویدن گارمین · Garmin Connect Run' },
      appleHealth: { dist: 5.6, elapsed: 1736, hr: 149, elev: 28, title: 'دویدن اپل واچ · Apple Watch Workout' },
      xiaomi: { dist: 4.8, elapsed: 1536, hr: 145, elev: 21, title: 'دویدن شیائومی · Zepp Life Run' },
      coros: { dist: 8.4, elapsed: 2436, hr: 156, elev: 55, title: 'دویدن کوروس · COROS Pace Run' },
      samsung: { dist: 6.1, elapsed: 1890, hr: 147, elev: 31, title: 'دویدن سامسونگ · Galaxy Watch Run' },
    };

    const workout = providerDailyWorkouts[provider] || providerDailyWorkouts.strava;
    const syncFilename = `${provider}_sync_${todayKey}.fit`;

    // Check if today's workout from this provider was already synced
    const alreadySynced = findExistingDuplicateActivity(
      syncFilename,
      workout.dist,
      workout.elapsed,
      workout.hr
    );
    if (alreadySynced) {
      triggerToast(
        'خطای ثبت تکراری اکتیویتی ⚠️',
        `آخرین فعالیت ثبت‌شده در ${providerName} (${workout.dist} km) قبلاً همگام‌سازی و سکه آن دریافت شده است.`,
        'error'
      );
      return;
    }

    setIsSyncingFromProvider(true);

    setTimeout(() => {
      setIsSyncingFromProvider(false);

      const registered = handleProcessRun(
        workout.dist,
        workout.elapsed,
        workout.hr,
        syncFilename,
        `${providerName} Auto-Sync`,
        {
          title: workout.title,
          elevGainMeters: workout.elev,
        }
      );

      if (!registered) return;

      // Update last sync in watchAuthDetails
      setUser((prev) => {
        if (!prev) return null;
        const currentDetails = prev.watchAuthDetails || {};
        const provDetail = currentDetails[provider] || {
          athleteName: prev.fullName,
          athleteId: '4829103',
          connectedAt: 'امروز',
          accessToken: 'tok_active_' + Math.random().toString(36).slice(2, 8),
          autoSync: true,
          lastSyncedAt: 'هم‌اکنون',
        };

        return {
          ...prev,
          watchAuthDetails: {
            ...currentDetails,
            [provider]: {
              ...provDetail,
              lastSyncedAt: 'هم‌اکنون',
            },
          },
        };
      });

      triggerToast(
        'همگام‌سازی موفق ⚡',
        `یک فعالیت ${workout.dist} کیلومتری با موفقیت از ${providerName} دریافت و پاداش POOL به کیف پول واریز شد!`,
        'success'
      );
    }, 1400);
  };

  // Copy OAuth URL
  const handleCopyOAuthLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    triggerToast('کپی شد', 'لینک رسمی احراز هویت در کلیپ‌بورد کپی شد.', 'info');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Legacy quick toggle for backward compatibility
  const toggleWatchSync = (provider: WatchProviderKey) => {
    openWatchAuthModal(provider);
  };

  // PWA Install handler
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalledPWA(true);
        setDeferredPrompt(null);
        triggerToast('نصب آغاز شد! 📱', 'اپلیکیشن دوپول به صفحه اصلی موبایل شما اضافه شد.', 'success');
      }
      return;
    }
    if (isIOSDevice) {
      setShowIOSInstallGuide(true);
      return;
    }
    triggerToast(
      'راهنمای نصب روی گوشی 📱',
      'در مرورگر کروم یا سافاری گوشی، گزینه Add to Home Screen یا Install App را از منوی مرورگر انتخاب کنید.',
      'info'
    );
  };

  // Public Share URL & Creator Dev URL for Testers
  const SHARED_APP_ORIGIN = 'https://ais-pre-4na4txaxdrjrflclwscra3-143596266038.asia-east1.run.app';
  const DEV_APP_ORIGIN = 'https://ais-dev-4na4txaxdrjrflclwscra3-143596266038.asia-east1.run.app';
  const [selectedShareLinkType, setSelectedShareLinkType] = useState<'public' | 'dev'>(() =>
    typeof window !== 'undefined' && window.location.origin.includes('ais-pre-') ? 'public' : 'dev'
  );

  const activeShareOrigin = selectedShareLinkType === 'public' ? SHARED_APP_ORIGIN : DEV_APP_ORIGIN;
  const testerShareUrl = user ? `${activeShareOrigin}/?ref=${user.referralCode}` : activeShareOrigin;

  const testerInviteMessage = `🏃‍♂️ دعوت به تست نسخه اولیه اپلیکیشن «دوپول (Dopool)»!\nبا دویدن روزانه و اتصال ساعت هوشمند، توکن ورزشی POOL پاداش بگیرید (همراه با ۱۰ سکه هدیه ثبت‌نام و ۱۰ سکه ورود روزانه).\n🎁 کد معرف هدیه: ${
    user?.referralCode || 'DP-8834'
  }\n🔗 لینک ورود و نصب روی گوشی:\n${testerShareUrl}`;

  const handleCopyTesterUrl = () => {
    navigator.clipboard.writeText(testerShareUrl);
    setCopiedShareUrl(true);
    triggerToast('لینک تست کپی شد! 🔗', 'هم‌اکنون می‌توانید لینک را در مرورگر گوشی باز کنید یا برای تسترها بفرستید.', 'success');
    setTimeout(() => setCopiedShareUrl(false), 3000);
  };

  const handleCopyTesterInviteText = () => {
    navigator.clipboard.writeText(testerInviteMessage);
    setCopiedInviteText(true);
    triggerToast('متن دعوت کپی شد! 📨', 'متن کامل دعوت‌نامه آماده ارسال در تلگرام یا واتساپ است.', 'success');
    setTimeout(() => setCopiedInviteText(false), 3000);
  };

  const handleNativeShareTester = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Dopool (دوپول) - پلتفرم کسب درآمد با دویدن',
          text: testerInviteMessage,
          url: testerShareUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    handleCopyTesterInviteText();
  };

  // Google Cloud Login & Firestore Vault Sync Handler
  const handleGoogleCloudAuth = async () => {
    setIsCloudSyncing(true);
    try {
      const fbUser = await signInWithGoogleCloud();
      const seedProfile: UserProfile = user || {
        id: 1,
        fullName: fbUser.displayName || 'سهراب مرادی',
        phone: '09121234567',
        email: fbUser.email || 'runner@dopool.ir',
        username: (fbUser.email ? fbUser.email.split('@')[0] : 'sohrab_run').toLowerCase(),
        referralCode: 'DP-' + Math.floor(1000 + Math.random() * 9000),
        lockedPoolBalance: 125.0,
        totalKm: 12.5,
        invitedFriendsCount: 3,
        dailyEnergyMax: 20.0,
        dailyEnergyCurrent: 16.0,
        crewId: 1,
        crewName: 'باشگاه انقلاب تهران (Enghelab Crew)',
        crewBadge: '🔥',
        streakDays: 4,
        battleWins: 4,
        battleLosses: 1,
        battleRating: 1250,
        firstTimeMilestones: {
          firstLogin: false,
          firstActivity: false,
          firstInvite: false,
        },
        connectedWatches: {
          strava: true,
          garmin: false,
          coros: false,
          appleHealth: false,
          xiaomi: false,
          samsung: false,
        },
      };

      const cloudVault = await loadOrCreateCloudUserVault(fbUser, {
        fullName: seedProfile.fullName,
        username: seedProfile.username,
        email: fbUser.email || seedProfile.email || 'runner@dopool.ir',
        phone: seedProfile.phone || '09121234567',
        referralCode: seedProfile.referralCode,
        lockedPoolBalance: seedProfile.lockedPoolBalance,
        totalKm: seedProfile.totalKm,
        invitedFriendsCount: seedProfile.invitedFriendsCount,
        streakDays: seedProfile.streakDays || 1,
        battleWins: seedProfile.battleWins || 0,
        battleLosses: seedProfile.battleLosses || 0,
        battleRating: seedProfile.battleRating || 1200,
        firstLogin: Boolean(seedProfile.firstTimeMilestones?.firstLogin),
        firstActivity: Boolean(seedProfile.firstTimeMilestones?.firstActivity),
        firstInvite: Boolean(seedProfile.firstTimeMilestones?.firstInvite),
      });

      const mergedUser: UserProfile = {
        ...seedProfile,
        fullName: cloudVault.fullName,
        username: cloudVault.username,
        email: cloudVault.email,
        phone: cloudVault.phone,
        referralCode: cloudVault.referralCode,
        lockedPoolBalance: cloudVault.lockedPoolBalance,
        totalKm: cloudVault.totalKm,
        invitedFriendsCount: cloudVault.invitedFriendsCount,
        streakDays: cloudVault.streakDays,
        battleWins: cloudVault.battleWins,
        battleLosses: cloudVault.battleLosses,
        battleRating: cloudVault.battleRating,
        firstTimeMilestones: {
          firstLogin: cloudVault.firstLogin,
          firstActivity: cloudVault.firstActivity,
          firstInvite: cloudVault.firstInvite,
        },
      };

      setCloudUid(fbUser.uid);
      setSplashSubtitle(`اتصال امن ابری Firebase برقرار شد · ${mergedUser.fullName}`);
      setShowSplash(true);
      setUser(mergedUser);
      setShowLogoutConfirmModal(false);
      setActiveTab('home');
      setTimeout(() => {
        triggerCoinReward(10, topWalletRef.current);
        triggerToast(
          'کیف پول ابری Firebase فعال شد! 🔒☁️',
          `حساب ${mergedUser.email} به دیتابیس ابری Firestore متصل و همگام‌سازی شد.`,
          'success'
        );
      }, 1500);
    } catch {
      triggerToast(
        'لغو یا عدم تکمیل پنجره گوگل',
        'پنجره احراز هویت گوگل بسته شد. می‌توانید مجدداً تلاش کنید یا با حساب کاربری وارد شوید.',
        'warning'
      );
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Login handler (Awards +10 POOL for First Login or restores saved profile!)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      triggerToast('خطا', 'لطفاً نام کاربری، ایمیل یا شماره موبایل خود را وارد کنید.', 'error');
      return;
    }
    const cleanInput = loginUsername.trim();
    const isDemoSohrab = cleanInput.toLowerCase() === 'sohrab_run' || cleanInput === '09121234567';

    // Check if we have a saved profile in localStorage to preserve user balance
    const savedRaw = localStorage.getItem('dopool_saved_profile') || localStorage.getItem('dopool_user_session');
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw) as UserProfile;
        if (parsed && (!isDemoSohrab || parsed.username?.toLowerCase() === 'sohrab_run')) {
          const updatedUser: UserProfile = {
            ...parsed,
            firstTimeMilestones: {
              firstLogin: parsed.firstTimeMilestones?.firstLogin || false,
              firstActivity: parsed.firstTimeMilestones?.firstActivity || false,
              firstInvite: parsed.firstTimeMilestones?.firstInvite || false,
            },
          };
          setSplashSubtitle(`خوش آمدید ${updatedUser.fullName} · در حال ورود به دوپول...`);
          setShowSplash(true);
          setUser(updatedUser);
          setActiveTab('home');
          setTimeout(() => {
            triggerCoinReward(10, topWalletRef.current);
            triggerToast('خوش آمدید 👋', `${updatedUser.fullName} عزیز، با موفقیت وارد کیف پول ورزشی شدید.`, 'success');
          }, 1600);
          return;
        }
      } catch {
        // Fallback to default login profile below
      }
    }

    const loggedInUser: UserProfile = {
      id: 1,
      fullName: isDemoSohrab ? 'سهراب مرادی' : cleanInput,
      phone: '09121234567',
      email: isDemoSohrab ? 'sohrab.moradi@dopool.ir' : `${cleanInput.toLowerCase()}@gmail.com`,
      username: cleanInput.toLowerCase(),
      referralCode: 'DP-8834',
      lockedPoolBalance: 125.0,
      totalKm: 12.5,
      invitedFriendsCount: 3,
      dailyEnergyMax: 20.0,
      dailyEnergyCurrent: 16.0,
      crewId: 1,
      crewName: 'باشگاه انقلاب تهران (Enghelab Crew)',
      crewBadge: '🔥',
      streakDays: 4,
      battleWins: 4,
      battleLosses: 1,
      battleRating: 1250,
      firstTimeMilestones: {
        firstLogin: false,
        firstActivity: false,
        firstInvite: false,
      },
      connectedWatches: {
        strava: true,
        garmin: false,
        coros: false,
        appleHealth: false,
        xiaomi: false,
        samsung: false,
      },
      watchAuthDetails: {
        strava: {
          athleteName: 'سهراب مرادی (Sohrab Moradi)',
          athleteId: '4829103',
          connectedAt: '۱۴۰۳/۰۷/۱۵',
          lastSyncedAt: 'امروز، ساعت ۰۶:۴۵',
          accessToken: 'strava_oauth_98af21d9b4c09',
          autoSync: true,
        },
      },
    };
    setSplashSubtitle(`خوش آمدید ${loggedInUser.fullName} · در حال ورود به دوپول...`);
    setShowSplash(true);
    setUser(loggedInUser);
    setActiveTab('home');
    setTimeout(() => {
      dispatchPushNotification({
        type: 'TOKEN_AWARD',
        title: `جایزه اولین لاگین (+۱۰ سکه) واریز شد! 🎉`,
        body: `${loggedInUser.fullName} عزیز خوش آمدید! ۱۰ سکه POOL بابت اولین ورود به حساب شما اضافه شد.`,
        poolAmount: 10,
      });
      triggerToast('ورود موفق + ۱۰ سکه هدیه ✨', `خوش آمدید ${loggedInUser.fullName}! ۱۰ سکه جایزه اولین لاگین واریز شد.`, 'success');
    }, 1600);
  };

  // Register handler (Collects Full Name, Phone, Email -> Sends Welcome Email + Mobile Push Notification + 10 Coin First Login)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regPhone.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword.trim()) {
      triggerToast('تکمیل فیلدها الزامی است', 'لطفاً نام و نام خانوادگی، شماره موبایل، ایمیل، نام کاربری و رمز عبور را وارد کنید.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      triggerToast('ایمیل نامعتبر', 'لطفاً یک آدرس ایمیل معتبر (مانند name@gmail.com) جهت دریافت ایمیل خوش‌آمدگویی وارد کنید.', 'warning');
      return;
    }

    setIsSendingWelcomeEmail(true);

    const uniqueCode = 'DP-' + Math.floor(1000 + Math.random() * 9000);
    const hasRef = Boolean(regReferral.trim());
    const welcomeBonus = hasRef ? 20.0 : 10.0; // 10 POOL first login gift + 10 POOL if referred

    const newUser: UserProfile = {
      id: Date.now(),
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      username: regUsername.toLowerCase().trim(),
      referralCode: uniqueCode,
      lockedPoolBalance: welcomeBonus,
      totalKm: 0,
      invitedFriendsCount: 0,
      dailyEnergyMax: 20.0,
      dailyEnergyCurrent: 20.0,
      crewId: 1,
      crewName: 'باشگاه انقلاب تهران (Enghelab Crew)',
      crewBadge: '🔥',
      streakDays: 1,
      battleWins: 0,
      battleLosses: 0,
      battleRating: 1200,
      invitedBy: hasRef ? regReferral.trim().toUpperCase() : undefined,
      firstTimeMilestones: {
        firstLogin: true,
        firstActivity: false,
        firstInvite: false,
      },
      connectedWatches: {
        strava: false,
        garmin: false,
        coros: false,
        appleHealth: false,
        xiaomi: false,
        samsung: false,
      },
    };

    const welcomeEmailObj: WelcomeEmailData = {
      id: `mail-${Date.now()}`,
      recipientEmail: regEmail.trim(),
      recipientName: regFullName.trim(),
      phone: regPhone.trim(),
      username: regUsername.toLowerCase().trim(),
      referralCode: uniqueCode,
      sentAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      subject: `🎉 به خانواده دوندگان دوپول خوش آمدید، ${regFullName.trim()} عزیز! (+${welcomeBonus} POOL هدیه اولین ورود)`,
      bonusTokens: welcomeBonus,
      deliveryStatus: 'DELIVERED',
    };

    setSplashSubtitle(`خوش آمدید ${newUser.fullName} · در حال ساخت حساب دوپول...`);
    setShowSplash(true);

    setTimeout(() => {
      setIsSendingWelcomeEmail(false);
      setUser(newUser);
      setActiveTab('home');
      setSentWelcomeEmail(welcomeEmailObj);
      setShowWelcomeEmailModal(true);

      // Dispatch Mobile Push Notification + Flying Coins
      dispatchPushNotification({
        type: 'TOKEN_AWARD',
        title: `ثبت‌نام موفق و جایزه اولین لاگین (+${welcomeBonus} سکه)! 📧🎁`,
        body: `${regFullName.trim()} عزیز، ایمیل خوش‌آمدگویی به ${regEmail.trim()} ارسال شد و ${welcomeBonus} سکه هدیه به کیف پولتان واریز گردید.`,
        poolAmount: welcomeBonus,
      });
    }, 1500);
  };

  // Format pace
  const formatPace = (paceMinKm: number) => {
    const m = Math.floor(paceMinKm);
    const s = Math.round((paceMinKm - m) * 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Redeem voucher
  const handleRedeemVoucher = (v: VoucherItem) => {
    if (!user) return;
    if (user.lockedPoolBalance < v.costPool) {
      triggerToast('موجودی ناکافی', `برای این خرید به ${v.costPool} توکن POOL نیاز دارید. موجودی فعلی: ${user.lockedPoolBalance}`, 'warning');
      return;
    }

    const newBal = Math.round((user.lockedPoolBalance - v.costPool) * 10) / 10;
    setUser({ ...user, lockedPoolBalance: newBal });
    const code = `DOOP-${v.id.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    triggerToast('کد تخفیف صادر شد! 🎁', `کد خرید اختصاصی شما: ${code} (در بخش پیام‌ها ذخیره شد)`, 'success');
  };

  // Join Challenge
  const handleJoinChallenge = (ch: ChallengeItem) => {
    if (!user) return;
    if (user.lockedPoolBalance < ch.entryFeePool) {
      triggerToast('موجودی ناکافی', `هزینه ورودی چالش ${ch.entryFeePool} توکن است.`, 'warning');
      return;
    }
    const newBal = Math.round((user.lockedPoolBalance - ch.entryFeePool) * 10) / 10;
    setUser({ ...user, lockedPoolBalance: newBal });
    triggerToast('ثبت نام در چالش تایید شد! 🏁', `شما به جمع شرکت‌کنندگان "${ch.title}" پیوستید.`, 'success');
  };

  // Copy referral
  const handleCopyReferral = () => {
    if (!user) return;
    const refLink = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(refLink);
    setCopiedRef(true);
    triggerToast('کپی شد!', 'لینک دعوت اختصاصی در کلیپ‌بورد ذخیره شد.', 'success');
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // Mark all notifications as read
  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    triggerToast('انجام شد', 'همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند.', 'info');
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return (
    <div className="min-h-screen app-outer-shell text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-300">
      {/* Mobile-First Frame: 480px max width, centered on desktop */}
      <div className="w-full max-w-[480px] min-h-screen sm:min-h-[92vh] flex flex-col app-canvas-shell sm:rounded-3xl sm:border sm:border-slate-800/80 shadow-2xl relative overflow-hidden pb-24 transition-colors duration-300">

        {/* ANIMATED STARTUP SPLASH SCREEN WITH OFFICIAL DOPOOL LOGO */}
        <AnimatePresence>
          {showSplash && (
            <motion.div
              key="dopool-splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.06, filter: 'blur(8px)' }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              onClick={() => setShowSplash(false)}
              className="fixed sm:absolute inset-0 z-[120] bg-[#080d1a] flex flex-col items-center justify-between p-8 text-center select-none cursor-pointer overflow-hidden"
            >
              {/* Ambient Golden & Emerald Radial Glows */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.3, 0.55, 0.3],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-500/25 blur-3xl pointer-events-none"
              />
              <motion.div
                animate={{
                  scale: [1.1, 0.9, 1.1],
                  opacity: [0.2, 0.45, 0.2],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
              />

              {/* Top Subtle Tag */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="relative z-10 pt-2"
              >
                <span className="text-[11px] font-bold tracking-wide text-amber-300/90">
                  پلتفرم دویدن و کسب درآمد ورزشی ایران · Move-to-Earn
                </span>
              </motion.div>

              {/* Centerpiece Animated Winged Coin Logo */}
              <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-6">
                <div className="relative flex items-center justify-center">
                  {/* Soft Radial Golden Glow Behind Transparent Logo */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{
                      scale: [0.95, 1.2, 0.95],
                      opacity: [0.35, 0.75, 0.35],
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-56 h-56 rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/20 to-emerald-400/25 blur-2xl absolute pointer-events-none"
                  />

                  {/* Second Rotating Dashed Orbit Ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    className="w-60 h-60 rounded-full border border-dashed border-amber-400/35 absolute pointer-events-none"
                  />

                  {/* Main Official Dopool Transparent Logo (No Box Background) */}
                  <motion.div
                    initial={{ scale: 0.25, opacity: 0, rotate: -12, y: 24 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      rotate: 0,
                      y: [0, -8, 0],
                    }}
                    transition={{
                      scale: { type: 'spring', stiffness: 220, damping: 16 },
                      opacity: { duration: 0.35 },
                      rotate: { type: 'spring', stiffness: 180, damping: 14 },
                      y: { delay: 0.45, duration: 2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className="relative w-56 h-48 flex items-center justify-center"
                  >
                    <img
                      src={DOPOOL_LOGO_DARK_URL}
                      alt="Dopool | دوپول"
                      className="w-full h-full object-contain drop-shadow-[0_16px_36px_rgba(245,158,11,0.5)]"
                    />
                  </motion.div>
                </div>

                {/* Animated Brand Title & Tagline */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.45 }}
                  className="space-y-2"
                >
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    دوپول <span className="text-amber-400 mx-1">|</span>{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 font-mono">
                      Dopool
                    </span>
                  </h1>
                  <p className="text-xs text-slate-300 max-w-[260px] mx-auto leading-relaxed">
                    هر گام شما، یک سکه طلایی <span className="text-amber-400 font-mono font-bold">POOL</span> در کیف پول ورزشی
                  </p>
                </motion.div>
              </div>

              {/* Bottom Animated Loading Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="relative z-10 w-full max-w-[250px] space-y-2.5 pb-2"
              >
                <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden p-[1px] border border-amber-500/30">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.65, ease: 'easeInOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                  <span>{splashSubtitle}</span>
                  <span className="text-amber-300 font-mono">100%</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean, Minimal & User-Friendly Top Header */}
        <header className="px-4 py-3 flex items-center justify-between border-b border-slate-800/60 sticky top-0 app-header-bar z-30 transition-colors duration-300">
          {/* Right Side: User Profile / Official Dopool Logo */}
          <button
            type="button"
            onClick={() => {
              if (user) {
                setShowLogoutConfirmModal(true);
              } else {
                setShowSplash(true);
              }
            }}
            className="flex items-center gap-2.5 text-right rounded-2xl p-1 -mr-1 hover:bg-slate-800/50 transition-colors cursor-pointer min-w-0"
            title={user ? 'مدیریت حساب کاربری و خروج' : 'پخش مجدد انیمیشن لوگو دوپول'}
          >
            <div className="relative w-10 h-10 rounded-2xl bg-slate-900/90 border border-amber-500/30 shrink-0 flex items-center justify-center shadow-sm">
              <img
                src={DOPOOL_COIN_URL}
                alt="Dopool"
                className="w-8 h-7 object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.35)]"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white truncate max-w-[135px]">
                  {user ? user.fullName : 'دوپول | Dopool'}
                </h1>
                {user?.crewBadge && (
                  <span className="text-xs shrink-0" title={user.crewName}>
                    {user.crewBadge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 block truncate">
                {user ? 'مشاهده حساب کاربری' : 'باشگاه دویدن و پاداش'}
              </span>
            </div>
          </button>

          {/* Left Side: 1-Tap Theme Toggle + Notifications + 3-Line Menu */}
          <div ref={topWalletRef} className="flex items-center gap-1.5 shrink-0">
            {/* Single 1-Tap Eye-Comfort Theme Cycle Button */}
            <button
              type="button"
              onClick={() =>
                setColorTheme((prev) =>
                  prev === 'velvet' ? 'warm' : prev === 'warm' ? 'daylight' : 'velvet'
                )
              }
              className="h-9 px-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="تغییر تم رنگی محافظ چشم (شب ملایم / گرم / روز روشن)"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  colorTheme === 'velvet'
                    ? 'bg-[#4fd1be]'
                    : colorTheme === 'warm'
                    ? 'bg-[#f4be6c]'
                    : 'bg-[#38bdf8]'
                }`}
              />
              <span>
                {colorTheme === 'velvet'
                  ? 'شب'
                  : colorTheme === 'warm'
                  ? 'گرم'
                  : 'روشن'}
              </span>
            </button>

            {/* Notification Bell Button */}
            <button
              type="button"
              onClick={() => setShowNotifDrawer(true)}
              className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white relative flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="اعلان‌ها و پیام‌ها"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              ) : (
                <Bell className="w-4 h-4 shrink-0" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 3-Line Hamburger Menu Button (منوی ۳ خط شامل اتصال ساعت هوشمند، جوایز، رتبه‌بندی و پشتیبانی) */}
            {user && (
              <button
                type="button"
                onClick={() => setShowHamburgerMenu(true)}
                className={`w-9 h-9 rounded-xl border relative flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  activeTab === 'watches' ||
                  activeTab === 'store' ||
                  activeTab === 'leaderboard' ||
                  activeTab === 'crews' ||
                  activeTab === 'history' ||
                  activeTab === 'support'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200 hover:text-white'
                }`}
                title="منوی امکانات (اتصال ساعت هوشمند، جوایز، رتبه‌بندی، کلاب‌ها، سوابق و پشتیبانی)"
              >
                <Menu className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

          {/* If NOT logged in: Show Beautiful Auth Portal with Official Dopool Logo */}
          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4 py-2"
            >
              {/* Premium Hero Auth Banner with Large Transparent Official Dopool Logo */}
              <div className="relative overflow-hidden rounded-3xl px-5 py-6 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/35 shadow-xl text-center space-y-3">
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Official Dopool Transparent Logo Showcase on Login Screen (No Box Background) */}
                <div className="flex justify-center">
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [0.95, 1.12, 0.95],
                        opacity: [0.35, 0.7, 0.35],
                      }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-44 h-36 rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-400/20 to-emerald-400/20 blur-2xl absolute pointer-events-none"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowSplash(true)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      title="پخش مجدد انیمیشن لوگو"
                      className="relative w-52 h-44 flex items-center justify-center cursor-pointer focus:outline-none"
                    >
                      <img
                        src={colorTheme === 'daylight' ? DOPOOL_LOGO_LIGHT_URL : DOPOOL_LOGO_DARK_URL}
                        alt="Dopool | دوپول"
                        className="w-full h-full object-contain drop-shadow-[0_12px_26px_rgba(245,158,11,0.4)]"
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h2 className="text-xl font-black text-white tracking-tight">
                    به باشگاه ورزشی{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400">
                      دوپول | Dopool
                    </span>{' '}
                    خوش آمدید
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                    با هر کیلومتر دویدن و تایید سلامت گام و ضربان قلب، سکه ورزشی{' '}
                    <span className="text-amber-400 font-mono font-bold">POOL</span> دریافت کنید و به تومان تسویه نمایید.
                  </p>
                </div>
              </div>

              {/* Segmented Auth Mode Switcher */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>ورود به حساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>نام‌نویسی جدید (+هدیه)</span>
                </button>
              </div>

              {authMode === 'login' ? (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleLoginSubmit}
                  className="glass-panel-glow rounded-3xl p-5 space-y-4 border border-slate-800"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <img
                          src={DOPOOL_COIN_URL}
                          alt="Dopool"
                          className="w-8 h-7 object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.3)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white truncate">ورود دونده به سامانه دوپول</h3>
                        <span className="text-[11px] text-slate-400 block truncate">اطلاعات حساب کاربری خود را وارد نمایید</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5 font-bold">نام کاربری، ایمیل یا شماره موبایل</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="sohrab_run یا 09121234567"
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-3.5 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                        dir="ltr"
                      />
                      <span className="w-5 h-5 flex items-center justify-center text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User className="w-4 h-4 shrink-0" />
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-slate-300 font-bold">رمز عبور</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordSubmitted(false);
                          setShowForgotPasswordModal(true);
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                      >
                        رمز عبور را فراموش کرده‌اید؟
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                        dir="ltr"
                      />
                      <span className="w-5 h-5 flex items-center justify-center text-sky-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Lock className="w-4 h-4 shrink-0" />
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                      />
                      <span>ذخیره نشست در این دستگاه</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono inline-flex items-center gap-1">
                      <Shield className="w-3 h-3 shrink-0" />
                      <span>SSL Encrypted</span>
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>ورود به کیف پول ورزشی</span>
                    <ChevronRight className="w-4 h-4 rotate-180 shrink-0" />
                  </button>

                  {/* Official Google Cloud / Firebase Vault Auth Button + Demo Quick Fill */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleGoogleCloudAuth}
                      disabled={isCloudSyncing}
                      className="w-full py-3 px-3.5 bg-slate-950 hover:bg-slate-900 border border-sky-500/40 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>
                        {isCloudSyncing
                          ? 'در حال اتصال به دیتابیس ابری Firebase...'
                          : 'ورود امن ابری با حساب Google (Firebase Vault)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginUsername('sohrab_run');
                        setLoginPassword('pass123');
                      }}
                      className="w-full py-2 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>اکانت تست آماده: <strong className="text-emerald-400 font-mono">sohrab_run</strong></span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded font-bold shrink-0">پر کردن خودکار</span>
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="register-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleRegisterSubmit}
                  className="glass-panel-glow rounded-3xl p-5 space-y-3.5 border border-emerald-500/30"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <img
                          src={DOPOOL_COIN_URL}
                          alt="Dopool"
                          className="w-8 h-7 object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.3)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white truncate">نام‌نویسی دونده جدید</h3>
                        <span className="text-[11px] text-slate-400 block truncate">همراه با ارسال ایمیل خوش‌آمدگویی و نوتیفیکیشن موبایل</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                      +10 POOL هدیه
                    </span>
                  </div>

                  {/* 1. First & Last Name (اسم و فامیل) */}
                  <div>
                    <label className="block text-xs text-slate-200 mb-1 font-bold">
                      نام و نام خانوادگی (اسم و فامیل) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="مثال: آرش کمانگیر"
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <span className="w-5 h-5 flex items-center justify-center text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <User className="w-4 h-4 shrink-0" />
                      </span>
                    </div>
                  </div>

                  {/* 2. Mobile Phone Number (شماره موبایل) */}
                  <div>
                    <label className="block text-xs text-slate-200 mb-1 font-bold flex items-center justify-between">
                      <span>شماره موبایل <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">جهت پیامک و نوتیفیکیشن گوشی</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                        dir="ltr"
                      />
                      <span className="w-5 h-5 flex items-center justify-center text-sky-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Phone className="w-4 h-4 shrink-0" />
                      </span>
                    </div>
                  </div>

                  {/* 3. Email Address (ایمیل جهت دریافت ایمیل خوش‌آمدگویی) */}
                  <div>
                    <label className="block text-xs text-slate-200 mb-1 font-bold flex items-center justify-between">
                      <span>آدرس ایمیل <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span>ارسال آنی ایمیل خوش‌آمدگویی</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="runner@gmail.com"
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                        dir="ltr"
                      />
                      <span className="w-5 h-5 flex items-center justify-center text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Mail className="w-4 h-4 shrink-0" />
                      </span>
                    </div>
                  </div>

                  {/* 4. Username & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs text-slate-200 mb-1 font-bold">نام کاربری (انگلیسی) <span className="text-rose-400">*</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="arash_run"
                          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                          dir="ltr"
                        />
                        <span className="w-5 h-5 flex items-center justify-center text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <User className="w-4 h-4 shrink-0" />
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-200 mb-1 font-bold">رمز عبور <span className="text-rose-400">*</span></label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="حداقل ۶ کاراکتر"
                          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left font-mono"
                          dir="ltr"
                        />
                        <span className="w-5 h-5 flex items-center justify-center text-rose-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Lock className="w-4 h-4 shrink-0" />
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5. Referral Code */}
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium flex items-center justify-between">
                      <span>کد معرف (اختیاری)</span>
                      <span className="text-[10px] text-amber-400 font-bold">+۱۰ سکه اضافه برای شما و معرف!</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regReferral}
                        onChange={(e) => setRegReferral(e.target.value)}
                        placeholder="DP-8834"
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2 text-sm text-sky-300 placeholder-slate-600 focus:outline-none focus:border-sky-400 transition-colors text-left font-mono uppercase"
                        dir="ltr"
                      />
                      <span className="w-5 h-5 flex items-center justify-center text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Gift className="w-4 h-4 shrink-0" />
                      </span>
                    </div>
                  </div>

                  {/* Mobile Push Notification & Welcome Email Info Box */}
                  <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>دریافت نوتیفیکیشن روی گوشی و ایمیل خوش‌آمدگویی</span>
                      </span>
                      {pushPermission !== 'granted' && (
                        <button
                          type="button"
                          onClick={requestPushPermission}
                          className="px-2 py-0.5 bg-emerald-500 text-slate-950 rounded-md font-bold text-[10px] shrink-0 cursor-pointer"
                        >
                          فعال‌سازی نوتیف
                        </button>
                      )}
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      بلافاصله پس از تکمیل نام‌نویسی، ایمیل رسمی خوش‌آمدگویی به آدرس ایمیل شما ارسال شده و پیام تایید روی صفحه گوشی شما ظاهر می‌شود.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingWelcomeEmail}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl shadow-emerald-500/25 active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>
                      {isSendingWelcomeEmail
                        ? 'در حال ایجاد حساب و ارسال ایمیل خوش‌آمدگویی...'
                        : 'تکمیل نام‌نویسی و دریافت ایمیل خوش‌آمدگویی'}
                    </span>
                  </button>
                </motion.form>
              )}

              {/* Mobile PWA Install & Share Card on Auth Screen */}
              <div className="glass-panel rounded-2xl p-3.5 border border-sky-500/25 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Smartphone className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">نصب نسخه موبایل (PWA) و تست</h4>
                    <span className="text-[10px] text-slate-400 block truncate">
                      نصب مستقیم روی صفحه اصلی اندروید و آیفون برای دریافت نوتیفیکیشن
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTesterShareModal(true)}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap transition-colors shrink-0 cursor-pointer"
                >
                  نصب / اشتراک
                </button>
              </div>
            </motion.div>
          ) : (
            /* Logged-in Dashboard — Clean, Minimal Main Menu & Organized Separate Tabs */
            <>
              {/* INSTANT, ZERO-LATENCY TAB CONTAINER */}
              <div className="space-y-4">
                  {/* TAB 0: MINIMAL MAIN MENU (منو اصلی ساده و مینیمال) */}
                  {activeTab === 'home' && (
                    <div className="space-y-4">
                      {/* 1. Theme-Aligned & Attractive Wallet Balance Hero Card */}
                      <div
                        ref={heroWalletRef}
                        className="glass-panel-glow rounded-3xl p-5 bg-gradient-to-br from-emerald-500/15 via-slate-900/95 to-sky-500/15 border border-emerald-500/35 space-y-4 relative overflow-hidden"
                      >
                        {/* Top Accent Gradient Line */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 opacity-85" />

                        {/* Ambient Theme Glows */}
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

                        {/* Card Header */}
                        <div className="flex items-center justify-between relative gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-sky-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-sm shrink-0">
                              <Wallet className="w-5 h-5 shrink-0" />
                            </div>
                            <span className="text-sm font-black text-white truncate">کیف پول هوشمند دوپول</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowCashoutModal(true)}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                          >
                            <CreditCard className="w-3.5 h-3.5 shrink-0" />
                            <span>تسویه ریالی</span>
                          </button>
                        </div>

                        {/* Centerpiece Balance Showcase */}
                        <div className="relative rounded-2xl p-4 bg-gradient-to-l from-emerald-500/10 via-slate-950/85 to-sky-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Glossy Coin Emblem */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-400 to-sky-500 p-[1.5px] shadow-md shadow-emerald-500/20 shrink-0">
                              <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center">
                                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="text-[8px] font-black text-emerald-400 tracking-wider font-mono">POOL</span>
                              </div>
                            </div>

                            <div className="min-w-0">
                              <span className="text-[11px] text-slate-400 font-bold block">موجودی قابل برداشت</span>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                                  {user.lockedPoolBalance.toFixed(1)}
                                </span>
                                <span className="text-xs font-black text-sky-400 font-mono">POOL</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab('sync')}
                            className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-black shrink-0 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>کسب سکه</span>
                          </button>
                        </div>

                        {/* Theme-Harmonized 3-Column Stats (Emerald / Sky / Amber) */}
                        <div className="grid grid-cols-3 gap-2.5 relative">
                          <button
                            type="button"
                            onClick={() => setActiveTab('sync')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/15 rounded-2xl p-2.5 border border-emerald-500/25 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <Activity className="w-3.5 h-3.5 shrink-0" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">مسافت کل</span>
                            <span className="text-xs font-black text-white font-mono">
                              {user.totalKm.toFixed(1)} <span className="text-[10px] text-emerald-400">km</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab('invite')}
                            className="bg-sky-500/10 hover:bg-sky-500/15 rounded-2xl p-2.5 border border-sky-500/25 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">دعوت موفق</span>
                            <span className="text-xs font-black text-white font-mono">
                              {user.invitedFriendsCount} <span className="text-[10px] text-sky-400 font-sans">نفر</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab('leaderboard')}
                            className="bg-amber-500/10 hover:bg-amber-500/15 rounded-2xl p-2.5 border border-amber-500/25 flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                              <Trophy className="w-3.5 h-3.5 shrink-0" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">رتبه شما</span>
                            <span className="text-xs font-black text-amber-400 font-mono">
                              #{getUserRank(user.totalKm)}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Three Animated 10-Coin Starter Milestones (حذف خودکار هر جایزه پس از دریافت و حذف کل باکس پس از دریافت هر ۳ جایزه) */}
                      <AnimatePresence>
                        {(!user.firstTimeMilestones?.firstLogin ||
                          !user.firstTimeMilestones?.firstActivity ||
                          !user.firstTimeMilestones?.firstInvite) && (
                          <motion.div
                            key="starter-milestones-card"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.25 }}
                            className="rounded-3xl p-4 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-amber-950/20 border border-amber-500/35 space-y-3 relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <motion.div
                                  animate={{ y: [0, -4, 0], rotate: [0, 5, -5, 0] }}
                                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                                  className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20"
                                >
                                  <img src={DOPOOL_COIN_URL} alt="POOL Coin" className="w-8 h-7 object-contain" />
                                </motion.div>
                                <div className="min-w-0">
                                  <h3 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                                    <span>جوایز ۱۰ سکه‌ای شروع</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono shrink-0" dir="ltr">
                                      +{([
                                        !user.firstTimeMilestones?.firstLogin,
                                        !user.firstTimeMilestones?.firstActivity,
                                        !user.firstTimeMilestones?.firstInvite,
                                      ].filter(Boolean).length * 10)}{' '}
                                      POOL
                                    </span>
                                  </h3>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    سکه هدیه انیمیشنی برای اولین ورود، اولین فعالیت و اولین دعوت
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <AnimatePresence mode="popLayout">
                                {/* Milestone 1: First Login (اولین لاگین - ۱۰ سکه) */}
                                {!user.firstTimeMilestones?.firstLogin && (
                                  <motion.div
                                    key="milestone-first-login"
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 40, scale: 0.9 }}
                                    transition={{ duration: 0.22 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="p-3 rounded-2xl bg-slate-950/85 border border-emerald-500/30 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 to-emerald-500/20 border border-amber-400/40 flex flex-col items-center justify-center shrink-0"
                                      >
                                        <img src={DOPOOL_COIN_URL} alt="coin" className="w-6 h-5 object-contain" />
                                        <span className="text-[9px] font-mono font-black text-amber-300" dir="ltr">+10</span>
                                      </motion.div>
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate">سکه هدیه اولین ورود</h4>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          ۱۰ سکه طلایی اولین لاگین به حساب کاربری
                                        </span>
                                      </div>
                                    </div>
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.93 }}
                                      onClick={(e) => handleClaimFirstMilestone('firstLogin', e)}
                                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 inline-flex items-center gap-1.5 cursor-pointer shrink-0 animate-shimmer"
                                    >
                                      <Coins className="w-3.5 h-3.5 shrink-0" />
                                      <span>دریافت +۱۰ سکه</span>
                                    </motion.button>
                                  </motion.div>
                                )}

                                {/* Milestone 2: First Activity (اولین اکتیویتی - ۱۰ سکه) */}
                                {!user.firstTimeMilestones?.firstActivity && (
                                  <motion.div
                                    key="milestone-first-activity"
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 40, scale: 0.9 }}
                                    transition={{ duration: 0.22 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="p-3 rounded-2xl bg-slate-950/85 border border-sky-500/30 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2.2, delay: 0.3, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 to-sky-500/20 border border-amber-400/40 flex flex-col items-center justify-center shrink-0"
                                      >
                                        <img src={DOPOOL_COIN_URL} alt="coin" className="w-6 h-5 object-contain" />
                                        <span className="text-[9px] font-mono font-black text-amber-300" dir="ltr">+10</span>
                                      </motion.div>
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate">سکه جایزه اولین اکتیویتی</h4>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          ۱۰ سکه هدیه ثبت اولین فعالیت دویدن
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab('sync')}
                                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
                                      >
                                        تب اکتیویتی
                                      </button>
                                      <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.93 }}
                                        onClick={(e) => handleClaimFirstMilestone('firstActivity', e)}
                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 cursor-pointer animate-shimmer"
                                      >
                                        <Coins className="w-3.5 h-3.5 shrink-0" />
                                        <span>دریافت +۱۰ سکه</span>
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Milestone 3: First Invite (اولین دعوت - ۱۰ سکه) */}
                                {!user.firstTimeMilestones?.firstInvite && (
                                  <motion.div
                                    key="milestone-first-invite"
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 40, scale: 0.9 }}
                                    transition={{ duration: 0.22 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="p-3 rounded-2xl bg-slate-950/85 border border-amber-500/30 flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2.4, delay: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-400/45 flex flex-col items-center justify-center shrink-0"
                                      >
                                        <img src={DOPOOL_COIN_URL} alt="coin" className="w-6 h-5 object-contain" />
                                        <span className="text-[9px] font-mono font-black text-amber-300" dir="ltr">+10</span>
                                      </motion.div>
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate">سکه جایزه اولین دعوت</h4>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          ۱۰ سکه هدیه اولین دعوت از دوستان
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setActiveTab('invite')}
                                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
                                      >
                                        تب دعوت
                                      </button>
                                      <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.93 }}
                                        onClick={(e) => handleClaimFirstMilestone('firstInvite', e)}
                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 inline-flex items-center gap-1.5 cursor-pointer animate-shimmer"
                                      >
                                        <Coins className="w-3.5 h-3.5 shrink-0" />
                                        <span>دریافت +۱۰ سکه</span>
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* 3. Minimal Section Grid (دسترسی سریع و مرتب به هر تب) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab('sync')}
                          className="p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/35 flex items-center justify-between gap-2.5 text-right transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <Activity className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">ثبت اکتیویتی</span>
                              <span className="text-[10px] text-slate-400 block truncate">ثبت دویدن و سکه</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('invite')}
                          className="p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/35 flex items-center justify-between gap-2.5 text-right transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">دعوت دوستان</span>
                              <span className="text-[10px] text-slate-400 block truncate">+۱۰ سکه دعوت</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('store')}
                          className="p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/35 flex items-center justify-between gap-2.5 text-right transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                              <Gift className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">جوایز و فروشگاه</span>
                              <span className="text-[10px] text-slate-400 block truncate">تسک و کد تخفیف</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('support')}
                          className="p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/35 flex items-center justify-between gap-2.5 text-right transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <Phone className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">پشتیبانی واتساپ</span>
                              <span className="text-[10px] text-slate-400 block truncate">۰۹۱۵۳۰۰۳۹۰۸</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('leaderboard')}
                          className="p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/35 flex items-center justify-between gap-2.5 text-right transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                              <Trophy className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">جدول برترین‌ها</span>
                              <span className="text-[10px] text-slate-400 block truncate">رتبه شما: #{getUserRank(user.totalKm)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('history')}
                          className="p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/35 flex items-center justify-between gap-2.5 text-right transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">تاریخچه فعالیت</span>
                              <span className="text-[10px] text-slate-400 block truncate">{activities.length} رکورد ثبت‌شده</span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 rotate-180 shrink-0" />
                        </button>
                      </div>

                      {/* Subtle Quick Utility Row (اشتراک‌گذاری تسترها و جایزه روزانه) */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDailyTasksModal(true)}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>ماموریت‌های روزانه</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTesterShareModal(true)}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>نصب و لینک تست</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: ACTIVITY & SMARTWATCH SYNC (تب مجزای اکتیویتی و ساعت) */}
                  {activeTab === 'sync' && (
                    <div className="space-y-4">
                      {/* First Activity +10 Coin Milestone Banner (حذف پس از دریافت) */}
                      {!user.firstTimeMilestones?.firstActivity && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/80 to-emerald-950/70 border border-sky-500/30 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/35 text-sky-300 flex flex-col items-center justify-center shrink-0">
                              <Activity className="w-4 h-4 mb-0.5" />
                              <span className="font-mono font-black text-[9px] leading-none" dir="ltr">+10</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white truncate">پاداش اولین اکتیویتی (+۱۰ سکه هدیه)</h4>
                              <span className="text-[10px] text-slate-300 block mt-0.5 leading-snug">
                                با ثبت اولین فعالیت در این بخش، ۱۰ سکه اضافه هدیه می‌گیرید!
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProcessRun(5.2, 1638, 146, 'First_Run_5K.fit', 'Garmin Watch')}
                            className="px-3 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black rounded-xl text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span>ثبت سریع (+۱۰)</span>
                          </button>
                        </div>
                      )}

                      {/* Manual .FIT File Upload & Quick Activity Simulation */}
                      <div className="glass-panel rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <Upload className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-slate-200 truncate">بارگذاری فایل ورزشی (.FIT / .GPX)</h3>
                              <span className="text-[10px] text-slate-400 block truncate">پشتیبانی مستقیم از خروجی Garmin، COROS و Apple Watch</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            <span>ضد تکراری</span>
                          </span>
                        </div>

                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-950/30 space-y-2.5"
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept=".fit"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                processSelectedFile(e.target.files[0]);
                                e.target.value = '';
                              }
                            }}
                          />
                          <div className="flex items-center justify-center gap-2">
                            <WatchBrandLogo providerId="strava" size="sm" />
                            <WatchBrandLogo providerId="garmin" size="sm" />
                            <WatchBrandLogo providerId="appleHealth" size="sm" />
                            <WatchBrandLogo providerId="xiaomi" size="sm" />
                            <WatchBrandLogo providerId="coros" size="sm" />
                            <WatchBrandLogo providerId="samsung" size="sm" />
                          </div>
                          <p className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                              فایل <span className="text-emerald-400 font-mono">.fit</span> ساعت خود را انتخاب یا اینجا رها کنید
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          {(() => {
                            const is9kRegistered = Boolean(
                              findExistingDuplicateActivity('Morning_Run_9.2K.fit', 9.2, 3596, 152)
                            );
                            const is5kRegistered = Boolean(
                              findExistingDuplicateActivity('Morning_Run_5K.fit', 5.2, 1638, 146)
                            );
                            const isCheatRegistered = Boolean(
                              findExistingDuplicateActivity('Car_Ride_8K.fit', 8.0, 720, 120)
                            );

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleProcessRun(9.2, 3596, 152, 'Morning_Run_9.2K.fit', 'Strava GPS', {
                                      title: 'Morning Run · دویدن صبحگاهی',
                                      elevGainMeters: 34,
                                      cadenceScore: 76,
                                      proofOfHumanScore: 95,
                                      overrideMultiplier: 1.0,
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border text-right cursor-pointer flex items-center gap-2.5 sm:col-span-2 transition-all ${
                                    is9kRegistered
                                      ? 'bg-slate-900/70 border-slate-800 text-slate-400'
                                      : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                                  }`}
                                >
                                  <WatchBrandLogo providerId="strava" size="sm" />
                                  <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="font-black text-white truncate">
                                        ثبت دویدن صبحگاهی ۹.۲ کیلومتر (Morning Run)
                                      </div>
                                      <span className="text-[10px] text-amber-300/90 block mt-0.5 truncate">
                                        {is9kRegistered
                                          ? 'این فعالیت قبلاً در سیستم ثبت شده است (عدم امکان ثبت تکراری)'
                                          : 'محاسبه ضرایب مسافت، صعود و Proof of Human (+178 POOL)'}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-lg font-mono font-black text-[11px] shrink-0 flex items-center gap-1 ${
                                        is9kRegistered
                                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-amber-400 text-slate-950'
                                      }`}
                                      dir="ltr"
                                    >
                                      {is9kRegistered ? (
                                        <>
                                          <Check className="w-3 h-3 shrink-0" />
                                          <span>ثبت شده</span>
                                        </>
                                      ) : (
                                        <>
                                          <Coins className="w-3 h-3 shrink-0" />
                                          <span>+178 POOL</span>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleProcessRun(5.2, 1638, 146, 'Morning_Run_5K.fit', 'Garmin Watch')}
                                  className={`p-2.5 rounded-xl border text-right cursor-pointer flex items-center justify-between gap-2 transition-all ${
                                    is5kRegistered
                                      ? 'bg-slate-900/70 border-slate-800 text-slate-400'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <WatchBrandLogo providerId="garmin" size="sm" />
                                    <div className="min-w-0">
                                      <div className="font-bold truncate">دویدن استاندارد ۵.۲k</div>
                                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                        {is5kRegistered ? 'ثبت شده در سوابق ✓' : 'با ضریب ساعت و استریک'}
                                      </span>
                                    </div>
                                  </div>
                                  {is5kRegistered && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/30 shrink-0">
                                      ثبت شده ✓
                                    </span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleProcessRun(8.0, 720, 120, 'Car_Ride_8K.fit', 'Cheater Engine')}
                                  className={`p-2.5 rounded-xl border text-right cursor-pointer flex items-center justify-between gap-2 transition-all ${
                                    isCheatRegistered
                                      ? 'bg-slate-900/70 border-slate-800 text-slate-400'
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                                      <ShieldAlert className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold truncate">تست سواره / سرعت غیرمجاز</div>
                                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                                        {isCheatRegistered ? 'قبلاً بررسی شده ✓' : 'بررسی سیستم ضدتقلب'}
                                      </span>
                                    </div>
                                  </div>
                                  {isCheatRegistered && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-rose-400 border border-rose-500/30 shrink-0">
                                      ثبت شده ✓
                                    </span>
                                  )}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Latest Verified Activity Receipt & Reward Breakdown directly in Sync Tab */}
                      {activities.length > 0 && (
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black text-slate-200 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                              <span>آخرین رسید تایید فعالیت و محاسبه ضرایب سکه</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('history')}
                              className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-0.5 cursor-pointer shrink-0"
                            >
                              <span>همه سوابق ({activities.length})</span>
                              <ChevronRight className="w-3.5 h-3.5 rotate-180 shrink-0" />
                            </button>
                          </div>
                          <ActivityVerificationReceiptCard
                            activity={activities[0]}
                            onShare={(act) => setStoryModalActivity(act)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* DEDICATED SMARTWATCHES & STRAVA CONNECTION TAB (منتقل شده به منوی ۳ خط) */}
                  {activeTab === 'watches' && (
                    <div className="space-y-4">
                      {/* Header Banner */}
                      <div className="rounded-3xl p-4 bg-gradient-to-br from-sky-950/60 via-slate-900 to-emerald-950/40 border border-sky-500/35 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0">
                            <Watch className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-white truncate">اتصال به ساعت‌های هوشمند و Strava</h3>
                            <span className="text-[11px] text-slate-300 block mt-0.5 truncate">
                              همگام‌سازی خودکار فعالیت‌ها و فعال‌سازی ضریب پاداش ساعت
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-black shrink-0 flex items-center gap-1" dir="ltr">
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          <span>{activeMultiplier}x Boost</span>
                        </span>
                      </div>

                      {/* Smartwatch & Strava Hub */}
                      <div className="glass-panel rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                              <Watch className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-200">مدیریت حساب‌ها و گجت‌های پوشیدنی</h3>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                            {Object.values(user.connectedWatches).filter(Boolean).length} دستگاه متصل
                          </span>
                        </div>

                        {/* Featured Strava Hub Banner */}
                        <div className="rounded-2xl p-3.5 border border-[#FC4C02]/40 bg-gradient-to-br from-[#FC4C02]/15 via-slate-900/80 to-slate-950/90 relative overflow-hidden space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <WatchBrandLogo providerId="strava" size="lg" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-white">استراوا (Strava)</h4>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FC4C02]/20 text-[#FC4C02] border border-[#FC4C02]/30 shrink-0">
                                    OAuth 2.0
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-300 block mt-0.5 truncate">
                                  {user.connectedWatches.strava
                                    ? `ورزشکار: ${user.watchAuthDetails?.strava?.athleteName || user.fullName}`
                                    : 'همگام‌سازی لحظه‌ای دویدن‌ها با Strava API'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold shrink-0 flex items-center gap-1 ${
                                user.connectedWatches.strava
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              }`}
                            >
                              {user.connectedWatches.strava ? (
                                <>
                                  <Check className="w-3 h-3 shrink-0" />
                                  <span>متصل</span>
                                </>
                              ) : (
                                'نیاز به اتصال'
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                            {user.connectedWatches.strava ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSyncWatchActivity('strava')}
                                  disabled={isSyncingFromProvider}
                                  className="flex-1 py-2 px-3 bg-gradient-to-r from-[#FC4C02] to-[#FF6F3C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncingFromProvider ? 'animate-spin' : ''}`} />
                                  <span>{isSyncingFromProvider ? 'در حال دریافت...' : 'دریافت آخرین دویدن از استراوا'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openWatchAuthModal('strava')}
                                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium cursor-pointer shrink-0 flex items-center gap-1"
                                >
                                  <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>مدیریت</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openWatchAuthModal('strava')}
                                className="w-full py-2 px-3 bg-gradient-to-r from-[#FC4C02] to-[#FF6F3C] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Link2 className="w-3.5 h-3.5 shrink-0" />
                                <span>اتصال و احراز هویت در Strava</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Supported Smartwatches Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {WATCH_PROVIDERS.filter((p) => p.id !== 'strava').map((provider) => {
                            const isConnected = user.connectedWatches[provider.id];
                            return (
                              <div
                                key={provider.id}
                                className={`p-3 rounded-2xl border transition-all text-right flex flex-col justify-between gap-2.5 ${
                                  isConnected
                                    ? 'bg-slate-900/90 border-emerald-500/40'
                                    : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <WatchBrandLogo providerId={provider.id} size="md" />
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${
                                      isConnected
                                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                                        : 'text-slate-400 bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    {isConnected ? (
                                      <>
                                        <Check className="w-2.5 h-2.5 shrink-0" />
                                        <span>متصل</span>
                                      </>
                                    ) : (
                                      'آماده اتصال'
                                    )}
                                  </span>
                                </div>
                                <div>
                                  <h5 className="text-xs font-black text-slate-100 truncate">{provider.nameFa}</h5>
                                  <span className="text-[10px] font-mono text-slate-400 block truncate mt-0.5" dir="ltr">
                                    {provider.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openWatchAuthModal(provider.id)}
                                  className="w-full py-1.5 px-2 rounded-xl text-[10px] font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Link2 className="w-3 h-3 text-sky-400 shrink-0" />
                                  <span>{isConnected ? 'مدیریت / سینک' : 'اتصال ساعت'}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DEDICATED INVITE & SHARE TAB (تب مجزای دعوت دوستان و جایزه ۱۰ سکه‌ای اولین دعوت) */}
                  {activeTab === 'invite' && (
                    <div className="space-y-4">
                      {/* Viral Instagram Story Card Promo Banner */}
                      <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-950/40 border border-amber-500/40 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
                              <img
                                src={DOPOOL_COIN_URL}
                                alt="Dopool"
                                className="w-8 h-7 object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)]"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                                VIRAL STORY GENERATOR · موتور جذب زیرمجموعه
                              </span>
                              <h3 className="text-sm font-black text-white truncate">
                                کارت استوری اینستاگرام با کد دعوت اختصاصی
                              </h3>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          رکورد آخرین دویدن، مقدار سکه و پاداش تومانی خود را همراه با کد معرف{' '}
                          <span className="font-mono font-bold text-amber-300">{user.referralCode}</span> به صورت یک تصویر استوری آماده دانلود کنید (حتی روی عکس سلفی خودتان!):
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const acceptedAct = activities.find((a) => a.status === 'ACCEPTED') || activities[0];
                            if (acceptedAct) {
                              setStoryModalActivity(acceptedAct);
                            }
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>طراحی و دانلود کارت استوری رکورد من</span>
                        </button>
                      </div>

                      {/* First Invite +10 Coin Banner (حذف پس از دریافت) */}
                      {!user.firstTimeMilestones?.firstInvite && (
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/35 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex flex-col items-center justify-center shrink-0">
                                <Gift className="w-4 h-4 mb-0.5" />
                                <span className="font-mono font-black text-[9px] leading-none" dir="ltr">+10</span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-black text-white truncate">جایزه ۱۰ سکه‌ای اولین دعوت</h3>
                                <span className="text-[11px] text-slate-300 block mt-0.5">
                                  با دعوت اولین دوست به دوپول، ۱۰ سکه POOL هدیه بگیرید!
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Referral Link & Code Card */}
                      <div className="glass-panel rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <h3 className="text-xs font-bold text-slate-200">لینک و کد معرف اختصاصی شما</h3>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg" dir="ltr">
                            {user.referralCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 rounded-xl p-2 border border-slate-800">
                          <input
                            readOnly
                            value={`${window.location.origin}/?ref=${user.referralCode}`}
                            className="bg-transparent text-xs text-sky-300 font-mono w-full px-2 outline-none select-all"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={handleCopyReferral}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            {copiedRef ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                            <span>{copiedRef ? 'کپی شد' : 'کپی لینک'}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={simulateFriendReferral}
                          className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          <Gift className="w-4 h-4 shrink-0" />
                          <span>ثبت دعوت دوست و دریافت +۱۰ سکه جایزه دعوت</span>
                        </button>
                      </div>

                      {/* Share & Install App for Testers */}
                      <div className="glass-panel rounded-2xl p-4 space-y-3 border border-sky-500/25">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-white truncate">اشتراک نسخه تستی و نصب روی موبایل</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTesterShareModal(true)}
                            className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 shrink-0" />
                            <span>پنل کامل و بارکد QR</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          برای ارسال لینک تست به دوستان در تلگرام/واتساپ یا نصب مستقیم اپلیکیشن روی صفحه اصلی گوشی از دکمه بالا استفاده کنید.
                        </p>
                      </div>
                    </div>
                  )}

              {/* TAB 2: RUNNING CREWS (کلاب‌های دویدن گروهی) */}
              {activeTab === 'crews' && (
                <div className="space-y-4">
                  {/* Crew Header with Weekly Pot */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 p-4 border border-emerald-500/30 shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1">
                          <Trophy className="w-3 h-3 shrink-0" />
                          <span>لیگ هفتگی کلاب‌های دویدن</span>
                        </span>
                        <h4 className="text-sm font-black text-white mt-1.5">جایزه اسپانسر: ۵,۰۰۰ POOL</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">تقسیم بین اعضای تیمی که بیشترین کیلومتر هفتگی را ثبت کند</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-2xl border border-emerald-500/30 shrink-0">
                        {user.crewBadge || '🏃'}
                      </div>
                    </div>
                  </div>

                  {/* User's Active Crew Status Card */}
                  {user.crewId ? (
                    <div className="glass-panel-glow rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] text-emerald-400 font-bold block mb-0.5">تیم فعال شما:</span>
                          <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                            <span>{user.crewBadge}</span>
                            <span className="truncate">{user.crewName}</span>
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleLeaveCrew}
                          className="px-2.5 py-1 text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3 shrink-0" />
                          <span>تغییر تیم</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                        <div className="bg-slate-950/50 p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>کیلومتر هفتگی شما</span>
                          </span>
                          <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block" dir="ltr">{user.totalKm} km</span>
                        </div>
                        <div className="bg-slate-950/50 p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>بانس گروهی فعال</span>
                          </span>
                          <span className="text-sm font-black text-sky-400 font-mono mt-0.5 block" dir="ltr">+0.1x Boost</span>
                        </div>
                      </div>

                      {/* Crew Message Wall */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-slate-300 block">گفتگو و هماهنگی اعضای کلاب:</span>
                        
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-0.5">
                          {crewMessages.map((m) => (
                            <div key={m.id} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span className="font-bold text-emerald-400">{m.userName}</span>
                                <span>{m.createdAt}</span>
                              </div>
                              <p className="text-slate-200 text-[11px]">{m.message}</p>
                            </div>
                          ))}
                        </div>

                        {/* Send message form */}
                        <form onSubmit={handleSendCrewMessage} className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={newCrewMsg}
                            onChange={(e) => setNewCrewMsg(e.target.value)}
                            placeholder="ارسال پیام برای هم‌تیمی‌ها..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="submit"
                            className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel rounded-2xl p-4 text-center space-y-2 border-amber-500/20">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-white">شما در حال حاضر عضو هیچ کلابی نیستید</h4>
                      <p className="text-[11px] text-slate-400">
                        با عضویت در یکی از کلاب‌های زیر، ضریب پاداش دویدن شما ۰.۱x افزایش می‌یابد و در استخر جوایز تیمی شریک می‌شوید.
                      </p>
                    </div>
                  )}

                  {/* Create Crew Action */}
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>کلاب‌های برتر دوندگان ایران</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateCrewModal(true)}
                      className="px-2.5 py-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 rounded-xl border border-sky-500/25 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>تاسیس کلاب جدید</span>
                    </button>
                  </div>

                  {/* Crews List */}
                  <div className="space-y-2.5">
                    {crews.map((c, idx) => {
                      const isMyCrew = user?.crewId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={`glass-panel rounded-2xl p-3.5 space-y-2 transition-all ${
                            isMyCrew ? 'border-emerald-500/40 bg-emerald-950/15' : 'hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 text-center text-xs font-mono font-black text-amber-400 shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0">
                                {c.badge}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                  <span className="truncate">{c.name}</span>
                                  {isMyCrew && (
                                    <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                                      (تیم شما)
                                    </span>
                                  )}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>{c.city}</span>
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="flex items-center gap-0.5">
                                    <Users className="w-3 h-3 text-sky-400 shrink-0" />
                                    <span>{c.membersCount} دونده</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left font-mono shrink-0" dir="ltr">
                              <span className="text-xs font-bold text-sky-400 block">{c.weeklyKm} km</span>
                              <span className="text-[10px] text-slate-500 font-sans block text-right">هفتگی</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed pr-8">{c.description}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 pr-8">
                            <span className="text-[10px] text-emerald-400 font-mono">مجموع کل: {c.totalKm} km</span>
                            {!isMyCrew ? (
                              <button
                                type="button"
                                onClick={() => handleJoinCrew(c)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>پیوستن (+0.1x Boost)</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>عضو رسمی تیم</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: LEADERBOARD */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  {/* Fake Sponsor Banner */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-stone-900 to-black p-4 border border-amber-500/30 shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 inline-flex items-center gap-1">
                          <Award className="w-3 h-3 shrink-0" />
                          <span>اسپانسر رسمی لیگ دوندگان</span>
                        </span>
                        <h4 className="text-sm font-black text-white">نایکی دویدن ایران | Nike Running</h4>
                        <p className="text-[11px] text-slate-400">
                          اهدای ۳ جفت کفش مسابقه‌ای Nike Vaporfly به نفرات اول تا سوم ماهانه
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-3xl font-black text-amber-400 italic tracking-tighter">NIKE</span>
                      </div>
                    </div>
                  </div>

                  {/* Top 3 Podium */}
                  <div className="grid grid-cols-3 gap-2 pt-2 items-end text-center">
                    {/* Rank 2 - Silver */}
                    <div className="glass-panel rounded-2xl p-2.5 flex flex-col items-center border-slate-400/30">
                      <div className="w-7 h-7 rounded-xl bg-slate-400/15 border border-slate-400/30 text-slate-300 flex items-center justify-center mb-1">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">رتبه ۲</span>
                      <span className="text-xs font-bold text-white mt-0.5 truncate max-w-[95px]">{leaderboard[1].fullName}</span>
                      <span className="text-xs text-sky-400 font-mono mt-0.5 font-bold" dir="ltr">{leaderboard[1].totalKm} km</span>
                      <span className="text-[10px] text-emerald-400 font-mono" dir="ltr">{leaderboard[1].poolBalance} POOL</span>
                    </div>

                    {/* Rank 1 - Gold */}
                    <div className="glass-panel-glow rounded-2xl p-3 flex flex-col items-center border-amber-400/50 scale-105">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mb-1 shadow-sm">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-amber-400">قهرمان اول</span>
                      <span className="text-xs font-black text-white mt-0.5 truncate max-w-[100px]">{leaderboard[0].fullName}</span>
                      <span className="text-xs text-sky-400 font-mono font-black mt-0.5" dir="ltr">{leaderboard[0].totalKm} km</span>
                      <span className="text-[10px] text-emerald-400 font-bold font-mono" dir="ltr">{leaderboard[0].poolBalance} POOL</span>
                    </div>

                    {/* Rank 3 - Bronze */}
                    <div className="glass-panel rounded-2xl p-2.5 flex flex-col items-center border-amber-700/30">
                      <div className="w-7 h-7 rounded-xl bg-amber-700/20 border border-amber-600/30 text-amber-500 flex items-center justify-center mb-1">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-amber-500">رتبه ۳</span>
                      <span className="text-xs font-bold text-white mt-0.5 truncate max-w-[95px]">{leaderboard[2].fullName}</span>
                      <span className="text-xs text-sky-400 font-mono mt-0.5 font-bold" dir="ltr">{leaderboard[2].totalKm} km</span>
                      <span className="text-[10px] text-emerald-400 font-mono" dir="ltr">{leaderboard[2].poolBalance} POOL</span>
                    </div>
                  </div>

                  {/* Rank Up Simulation Button */}
                  <div className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-2 border-amber-500/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">رتبه فعلی شما: رتبه {getUserRank(user.totalKm)}</span>
                        <span className="text-[11px] text-slate-400 block truncate">با افزایش کیلومتر، پیام صعود در جدول را دریافت کنید</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={simulateRankUp}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>تست صعود</span>
                    </button>
                  </div>

                  {/* Complete Rankings List */}
                  <div className="glass-panel rounded-2xl p-2 space-y-1">
                    <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
                      <span>رتبه و مشخصات دونده</span>
                      <span>کیلومتر کل / پاداش</span>
                    </div>
                    {leaderboard.map((item, idx) => {
                      const isMe = item.username.toLowerCase() === user.username.toLowerCase();
                      return (
                        <div
                          key={item.username}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                            isMe ? 'bg-emerald-500/15 border border-emerald-500/30' : 'hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                                  : idx === 1
                                  ? 'bg-slate-400/15 text-slate-300 border border-slate-400/25'
                                  : idx === 2
                                  ? 'bg-amber-700/20 text-amber-500 border border-amber-600/30'
                                  : 'text-slate-500'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs text-slate-200 font-bold flex items-center gap-1.5 truncate">
                                <span className="truncate">{item.fullName}</span>
                                {isMe && (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                                    (شما)
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block" dir="ltr">@{item.username}</span>
                            </div>
                          </div>
                          <div className="text-left font-mono shrink-0" dir="ltr">
                            <span className="text-xs text-sky-400 font-bold block">{item.totalKm} km</span>
                            <span className="text-[10px] text-emerald-400">{item.poolBalance} POOL</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: STORE / REWARDS / CHALLENGES */}
              {activeTab === 'store' && (
                <div className="space-y-4">
                  {/* Daily Check-In & Tasks Card inside Rewards Tab */}
                  <div className="rounded-2xl p-4 border border-amber-500/30 bg-slate-900/80 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                          <Gift className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-black text-white truncate">پاداش ورود روزانه و تسک‌ها (+۱۰ سکه)</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDailyTasksModal(true)}
                        className="text-[11px] text-sky-400 font-bold flex items-center gap-0.5 shrink-0 cursor-pointer"
                      >
                        <span>همه تسک‌ها</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180 shrink-0" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
                        {canClaimCheckInToday ? (
                          <>
                            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>۱۰ سکه ورود امروز آماده دریافت است</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>پاداش ورود امروز دریافت شد</span>
                          </>
                        )}
                      </span>
                      {canClaimCheckInToday && (
                        <button
                          type="button"
                          onClick={handleClaimDailyCheckIn}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5 shrink-0" />
                          <span>دریافت ۱۰ سکه</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* VIP Running Challenges */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-200">چالش‌های دویدن VIP با استخر جایزه</h3>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                        ورودی با POOL
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {challenges.map((ch) => (
                        <div key={ch.id} className="glass-panel rounded-2xl p-3.5 space-y-2 border-amber-500/20">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-medium inline-flex items-center gap-1">
                                <Coins className="w-3 h-3 shrink-0" />
                                <span>استخر: {ch.prizePool}</span>
                              </span>
                              <h4 className="text-xs font-bold text-white mt-1.5">{ch.title}</h4>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{ch.daysLeft} روز مهلت</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{ch.subtitle}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3 text-sky-400 shrink-0" />
                              <span>{ch.participants} دونده ثبت‌نام کرده‌اند</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleJoinChallenge(ch)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 shrink-0" />
                              <span>ورود ({ch.entryFeePool} POOL)</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Brand Discount Codes */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-200">تبدیل توکن به تخفیف برندهای ورزشی</h3>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                        کوپن دیجیتال
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {vouchers.map((v) => (
                        <div key={v.id} className="glass-panel rounded-2xl p-3.5 space-y-2 hover:border-emerald-500/40 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                                <span>{v.badge}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-bold">{v.brand}</span>
                              </div>
                              <h4 className="text-xs font-bold text-white mt-1">{v.title}</h4>
                            </div>
                            <span className="text-xs font-black text-emerald-400 font-mono shrink-0 flex items-center gap-1" dir="ltr">
                              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{v.costPool} POOL</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{v.subtitle}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-xs font-bold text-sky-400">{v.discount}</span>
                            <button
                              type="button"
                              onClick={() => handleRedeemVoucher(v)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Gift className="w-3.5 h-3.5 shrink-0" />
                              <span>دریافت کوپن تخفیف</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-200">تاریخچه فعالیت‌ها و ریز ضرایب پاداش</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                      {activities.length} فعالیت ثبت‌شده
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {activities.length === 0 ? (
                      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400 text-xs">
                        هنوز هیچ فعالیتی ثبت نکرده‌اید. با بارگذاری فایل .fit یا انتخاب سناریوهای تستی در تب اکتیویتی، اولین توکن‌های خود را دشت کنید!
                      </div>
                    ) : (
                      activities.slice(0, 10).map((act) => (
                        <ActivityVerificationReceiptCard
                          key={act.id}
                          activity={act}
                          onShare={(a) => setStoryModalActivity(a)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SUPPORT (پشتیبانی واتساپ ۰۹۱۵۳۰۰۳۹۰۸) */}
              {activeTab === 'support' && (
                <div className="space-y-4">
                  <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/45 via-slate-900 to-slate-950 border border-emerald-500/35 shadow-lg space-y-4 text-center relative overflow-hidden">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-md">
                      <Phone className="w-7 h-7" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>پاسخگویی سریع در واتساپ</span>
                      </span>
                      <h3 className="text-base font-black text-white">پشتیبانی کاربران دوپول</h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                        برای هرگونه سوال، راهنمایی اتصال ساعت، تسویه حساب یا گزارش مشکل، در واتساپ با شماره زیر در ارتباط باشید:
                      </p>
                    </div>

                    {/* WhatsApp Number Box */}
                    <div className="p-4 rounded-2xl bg-slate-950/85 border border-emerald-500/30 space-y-2">
                      <span className="text-[11px] text-slate-400 block">شماره پشتیبانی واتساپ:</span>
                      <div className="text-2xl font-black text-emerald-400 tracking-wider font-mono" dir="ltr">
                        ۰۹۱۵۳۰۰۳۹۰۸
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block" dir="ltr">
                        0915 300 3908
                      </span>
                    </div>

                    {/* Direct WhatsApp & Copy Actions */}
                    <div className="space-y-2.5 pt-1">
                      <a
                        href="https://wa.me/989153003908"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4 shrink-0" />
                        <span>ارسال پیام مستقیم در واتساپ (۰۹۱۵۳۰۰۳۹۰۸)</span>
                      </a>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText('09153003908');
                            triggerToast('شماره کپی شد ✓', 'شماره پشتیبانی ۰۹۱۵۳۰۰۳۹۰۸ در حافظه کپی شد.', 'success');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>کپی شماره</span>
                        </button>

                        <a
                          href="tel:09153003908"
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>تماس تلفنی</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </>
      )}

        </main>

        {/* MODAL: CREATE NEW RUNNING CREW */}
        {showCreateCrewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-[420px] bg-[#091122] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>تاسیس کلاب دویدن جدید (Running Crew)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateCrewModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCrewSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">نام کلاب / تیم</label>
                  <input
                    type="text"
                    required
                    value={newCrewName}
                    onChange={(e) => setNewCrewName(e.target.value)}
                    placeholder="مثال: دوندگان بام چیتگر"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">شهر / منطقه</label>
                  <input
                    type="text"
                    required
                    value={newCrewCity}
                    onChange={(e) => setNewCrewCity(e.target.value)}
                    placeholder="مثال: تهران یا اصفهان"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">نشان اموجی تیم</label>
                  <div className="grid grid-cols-6 gap-1.5 text-center">
                    {['🔥', '⚡', '🏃', '🐆', '🏔️', '🌊'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCrewBadge(emoji)}
                        className={`p-2 rounded-xl text-lg border transition-all ${
                          newCrewBadge === emoji ? 'bg-emerald-500/20 border-emerald-500 scale-105' : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">توضیحات و مسیر تمرین</label>
                  <textarea
                    rows={2}
                    value={newCrewDesc}
                    onChange={(e) => setNewCrewDesc(e.target.value)}
                    placeholder="تمرینات اینتروال صبح‌های دوشنبه دور دریاچه..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ثبت رسمی کلاب و ارتقا به کاپیتان
                </button>
              </form>
            </div>
          </div>
        )}

        {/* NOTIFICATION CENTER SLIDE-OVER DRAWER */}
        {showNotifDrawer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-[480px] max-h-[85vh] bg-[#091122] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">مرکز اعلان‌ها و رویدادهای زنده</h3>
                    <span className="text-[11px] text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} اعلان جدید خوانده نشده` : 'همه پیام‌ها خوانده شده است'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className={`w-4 h-4 ${pushPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {pushPermission === 'granted' ? 'پوش نوتیفیکیشن مرورگر فعال است ✓' : 'فعال‌سازی نوتیفیکیشن روی گوشی'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {pushPermission === 'granted'
                        ? 'پیام‌های پاداش و صعود رتبه روی دستگاه شما ارسال می‌شوند.'
                        : 'برای دریافت آنی پیام پاداش رفرال و رتبه، دسترسی را تایید کنید.'}
                    </span>
                  </div>
                </div>
                {pushPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestPushPermission}
                    className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer"
                  >
                    فعال‌سازی
                  </button>
                )}
              </div>

              {/* Push Tester */}
              <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-slate-950 to-[#0c162d] border border-sky-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>آزمایش سناریوهای اعلان (Interactive Tester):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real-Time</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={simulateFriendReferral}
                    className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-center transition-all cursor-pointer font-medium"
                  >
                    <span className="block font-bold">پاداش رفرال</span>
                    <span className="text-[9px] text-emerald-400/80">+۱۰ POOL</span>
                  </button>

                  <button
                    type="button"
                    onClick={simulateRankUp}
                    className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-center transition-all cursor-pointer font-medium"
                  >
                    <span className="block font-bold">صعود رتبه</span>
                    <span className="text-[9px] text-amber-400/80">Rank Up 🏆</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!user) return;
                      const newBal = Math.round((user.lockedPoolBalance + 52.0) * 10) / 10;
                      setUser({ ...user, lockedPoolBalance: newBal, totalKm: user.totalKm + 5.2 });
                      dispatchPushNotification({
                        type: 'TOKEN_AWARD',
                        title: 'پاداش فعالیت دویدن واریز شد! ⚡',
                        body: 'فعالیت دویدن ۵.۲ کیلومتری شما تایید شد و ۵۲ توکن POOL به حساب شما اضافه شد.',
                        poolAmount: 52,
                      });
                    }}
                    className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-center transition-all cursor-pointer font-medium"
                  >
                    <span className="block font-bold">پاداش دویدن</span>
                    <span className="text-[9px] text-sky-400/80">+۵۲ POOL</span>
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-0.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    هیچ اعلانی در حال حاضر ثبت نشده است.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        !n.isRead
                          ? 'bg-slate-900/90 border-emerald-500/30 shadow-md'
                          : 'bg-slate-950/40 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === 'REFERRAL_BONUS'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : n.type === 'RANK_UP'
                              ? 'bg-amber-500/20 text-amber-400'
                              : n.type === 'TOKEN_AWARD'
                              ? 'bg-sky-500/20 text-sky-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {n.type === 'REFERRAL_BONUS' ? (
                            <Gift className="w-4 h-4" />
                          ) : n.type === 'RANK_UP' ? (
                            <Trophy className="w-4 h-4" />
                          ) : n.type === 'TOKEN_AWARD' ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{n.title}</span>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}
                            </h4>
                            <span className="text-[10px] text-slate-500">{n.createdAt}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.body}</p>
                          {n.poolAmount && n.poolAmount > 0 ? (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                              <span>+{n.poolAmount} POOL</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  علامت‌گذاری همه به عنوان خوانده‌شده
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotifDrawer(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ACTIVE DUEL SIMULATION MODAL (Option 4) */}
        {activeDuel && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[440px] glass-panel-glow rounded-3xl p-5 border border-amber-500/40 relative overflow-hidden shadow-2xl animate-fade-in space-y-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                <span className="bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  <span>مسابقه زنده {activeDuel.distanceKm} کیلومتر</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  جایزه برنده: {Math.round(activeDuel.wagerPool * 2 * 0.95 * 10) / 10} POOL
                </span>
              </div>

              {/* Race Track Animation */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-4">
                {/* Lane 1: User */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="text-base">👟</span>
                      <span>شما (سهراب مرادی)</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-[11px]">
                      {activeDuel.userProgress.toFixed(0)}% · پیس: {activeDuel.userPace}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 rounded-full transition-all duration-700"
                      style={{ width: `${activeDuel.userProgress}%` }}
                    />
                  </div>
                </div>

                {/* Lane 2: Opponent */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                      <span className="text-base">🏃</span>
                      <span>{activeDuel.opponentName} ({activeDuel.opponentCity})</span>
                    </div>
                    <span className="text-amber-400 font-mono font-bold text-[11px]">
                      {activeDuel.opponentProgress.toFixed(0)}% · پیس: {activeDuel.opponentPace}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 relative">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 rounded-full transition-all duration-700"
                      style={{ width: `${activeDuel.opponentProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Telemetry */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">زمان سپری‌شده</span>
                  <span className="font-mono font-black text-white text-sm">
                    {Math.floor(activeDuel.elapsedSeconds / 60)}:{String(activeDuel.elapsedSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">ضربان قلب شما</span>
                  <span className="font-mono font-black text-rose-400 text-sm">{activeDuel.userHr} bpm</span>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">استیک هر طرف</span>
                  <span className="font-mono font-black text-amber-300 text-sm">{activeDuel.wagerPool} POOL</span>
                </div>
              </div>

              {/* Real-time Commentary Ticker */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>گزارش زنده مسیر:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {activeDuel.liveLog}
                </p>
              </div>

              {/* Arbiter Anti-Cheat Badge */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>داور هوشمند بیت‌ران: بررسی سلامت پیس، کادنس و ضربان قلب فعال است.</span>
              </div>

              {/* Finished State / Claim Button */}
              {activeDuel.finished && (
                <div className="pt-2 animate-bounce">
                  <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 mb-3">
                    <span className="text-3xl block mb-1">{activeDuel.winner === 'USER' ? '🏆' : '🥈'}</span>
                    <h4 className="text-sm font-black text-white">
                      {activeDuel.winner === 'USER' ? 'پیروزی شکوهمند در دوئل!' : 'پایان مسابقه'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {activeDuel.winner === 'USER'
                        ? `شما برنده جایزه ${Math.round(activeDuel.wagerPool * 2 * 0.95 * 10) / 10} توکن POOL شدید!`
                        : `حریف با اختلاف ناچیز به خط پایان رسید.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClaimDuelResult}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-95"
                  >
                    ثبت نتیجه در کارنامه و دریافت جوایز
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CASHOUT MODAL (Option 4 - تسویه ریالی تومان) */}
        {showCashoutModal && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[440px] glass-panel-glow rounded-3xl p-5 border border-emerald-500/40 relative shadow-2xl animate-fade-in space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white">تسویه ریالی توکن‌های دوپول</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCashoutModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>نرخ تبدیل مصوب:</span>
                  <span className="font-mono text-emerald-400 font-bold">۱ POOL = ۵,۰۰۰ تومان</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>موجودی قابل تسویه:</span>
                  <span className="font-mono text-white font-bold">{user ? user.lockedPoolBalance.toFixed(1) : '0'} POOL</span>
                </div>
              </div>

              <form onSubmit={handleRequestCashout} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">تعداد توکن برای تسویه (حداقل ۲۰ POOL)</label>
                  <input
                    type="number"
                    min="20"
                    max={user?.lockedPoolBalance || 100}
                    required
                    value={cashoutPoolAmount}
                    onChange={(e) => setCashoutPoolAmount(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 text-left"
                    dir="ltr"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>معادل ریالی قابل واریز:</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {(cashoutPoolAmount * 5000).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">شماره شبا حساب بانکی (IR...)</label>
                  <input
                    type="text"
                    required
                    value={shebaInput}
                    onChange={(e) => setShebaInput(e.target.value)}
                    placeholder="IR820170000000123456789012"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-sky-300 font-mono focus:outline-none focus:border-sky-400 text-left uppercase"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    پشتیبانی از کلیه بانک‌های عضو شتاب (ملت، ملی، صادرات، سامان، پاسارگاد، بلو، رسالت)
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">نام و نام خانوادگی صاحب حساب</label>
                  <input
                    type="text"
                    required
                    value={accountOwnerName}
                    onChange={(e) => setAccountOwnerName(e.target.value)}
                    placeholder="سهراب مرادی"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-98"
                  >
                    ثبت و انتقال وجه به سامانه پایا/ساتنا
                  </button>
                </div>
              </form>

              {/* History Preview */}
              {cashoutHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 block">آخرین درخواست تسویه:</span>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">
                        {cashoutHistory[0].tomanAmount.toLocaleString('fa-IR')} تومان
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        کد: {cashoutHistory[0].trackingCode} · {cashoutHistory[0].createdAt}
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      {cashoutHistory[0].status === 'PROCESSED' ? 'تایید پایا' : 'در صف واریز'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SMARTWATCH & STRAVA OAUTH 2.0 AUTHORIZATION MODAL */}
        {authWatchModal.isOpen && (() => {
          const provider = WATCH_PROVIDERS.find((p) => p.id === authWatchModal.provider) || WATCH_PROVIDERS[0];
          const isConnected = user?.connectedWatches[provider.id] || false;
          const authDetails = user?.watchAuthDetails?.[provider.id];

          return (
            <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
              <div
                className="w-full max-w-[460px] glass-panel-glow rounded-3xl p-5 border relative shadow-2xl animate-fade-in space-y-4 max-h-[92vh] overflow-y-auto"
                style={{ borderColor: `${provider.brandColor}50` }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <WatchBrandLogo providerId={provider.id} size="md" />
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>احراز هویت {provider.nameFa}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-normal bg-slate-800 text-slate-300">
                          OAuth 2.0
                        </span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {provider.protocol}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthWatchModal({ ...authWatchModal, isOpen: false })}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Description & Overview */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">سرویس ورزشی:</span>
                    <span className="font-bold text-white">{provider.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pt-1 border-t border-slate-800/60">
                    {provider.description}
                  </p>
                </div>

                {/* OAuth Direct Link & URL Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>لینک رسمی تایید احراز هویت (OAuth URL):</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">Redirect URI OK</span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={provider.oauthUrl}
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2.5 text-[11px] text-sky-300 font-mono focus:outline-none text-left select-all truncate pr-20"
                      dir="ltr"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyOAuthLink(provider.oauthUrl)}
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? 'کپی شد' : 'کپی'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-500 font-mono">Client ID: 149821 · Scope: {provider.scopes.join(', ')}</span>
                    <a
                      href={provider.oauthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold underline underline-offset-2"
                    >
                      <span>باز کردن لینک در تب جدید</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Requested Permissions Scopes */}
                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">مجوزهای دسترسی مورد تایید کاربر:</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>دریافت فایل‌های فعالیت دویدن، مسافت و زمان پیمایش ({provider.scopes[1] || 'activity:read'})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>تایید نام و شناسه یکتای ورزشکار جهت مبارزه با چندحسابی ({provider.scopes[2] || 'profile:read'})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>پایش سنسور ضربان قلب و آهنگ گام جهت اعتبارسنجی انسان‌بودن (Anti-Cheat)</span>
                    </div>
                  </div>
                </div>

                {/* Current Connection Status / Handshake */}
                {isConnected ? (
                  <div className="space-y-3 pt-1">
                    {/* Athlete Connection Card */}
                    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          ارتباط فعال و تایید شده
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Token: Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-500/20">
                        <div>
                          <span className="text-slate-400 block text-[10px]">ورزشکار متصل:</span>
                          <span className="font-bold text-white">{authDetails?.athleteName || user?.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">شناسه ورزشکار:</span>
                          <span className="font-mono text-emerald-300">{authDetails?.athleteId || '#4829103'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">تاریخ احراز هویت:</span>
                          <span className="text-slate-300">{authDetails?.connectedAt || '۱۴۰۳/۰۷/۱۵'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">آخرین استعلام سرور:</span>
                          <span className="text-emerald-400 font-bold">{authDetails?.lastSyncedAt || 'هم‌اکنون'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions when Connected */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleSyncWatchActivity(provider.id)}
                        disabled={isSyncingFromProvider}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingFromProvider ? 'animate-spin' : ''}`} />
                        <span>{isSyncingFromProvider ? 'در حال ارتباط با API و دریافت فایل دویدن...' : '⚡ همگام‌سازی و دریافت آخرین فعالیت دویدن'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeWatch(provider.id)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        قطع ارتباط و لغو مجوز دسترسی OAuth
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Authorization Flow Button when NOT connected */
                  <div className="space-y-3 pt-1">
                    {isAuthorizingWatch ? (
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30 text-center space-y-2.5 animate-pulse">
                        <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mx-auto" />
                        <p className="text-xs font-bold text-white">
                          {authStep === 1
                            ? 'گام ۱/۳: ارسال درخواست و دریافت Authorization Code...'
                            : authStep === 2
                            ? 'گام ۲/۳: مبادله توکن امن Access Token و تایید هویت ورزشکار...'
                            : 'گام ۳/۳: راه‌اندازی Webhook و شروع استخراج خودکار رکوردهای دویدن...'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          HTTPS POST /oauth/token · RFC 6749 Compliant
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAuthorizeWatch(provider.id)}
                        className="w-full py-3.5 text-white font-black rounded-xl text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        style={{
                          backgroundColor: provider.brandColor,
                          boxShadow: `0 10px 25px ${provider.brandColor}40`,
                        }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>تایید مجوزها و اتصال حساب کاربری (Authorize Account)</span>
                      </button>
                    )}

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>اتصال با استاندارد رمزنگاری بدون نیاز به وارد کردن کلمه عبور در دوپ‌Pool</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* DAILY TASKS & 7-DAY CHECK-IN MODAL */}
        {showDailyTasksModal && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[460px] glass-panel-glow rounded-3xl p-5 border border-amber-500/40 relative shadow-2xl animate-fade-in space-y-4 max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 flex items-center justify-center font-black shadow-md">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>تسک‌ها و پاداش ورود روزانه</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Daily Hub
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ورود روزانه و انجام ماموریت‌ها برای کسب سکه‌های POOL
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDailyTasksModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 7-Day Streak Calendar */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>تقویم پاداش ورود متوالی (۷ روزه)</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                    استریک: {user ? user.streakDays : 0} روز
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {[
                    { day: 1, reward: 10, label: 'روز ۱' },
                    { day: 2, reward: 10, label: 'روز ۲' },
                    { day: 3, reward: 15, label: 'روز ۳' },
                    { day: 4, reward: 10, label: 'روز ۴' },
                    { day: 5, reward: 15, label: 'روز ۵' },
                    { day: 6, reward: 20, label: 'روز ۶' },
                    { day: 7, reward: 35, label: 'روز ۷', isMega: true },
                  ].map((d) => {
                    const currentStreak = user?.streakDays || 1;
                    const isPassed = d.day < currentStreak || (!canClaimCheckInToday && d.day === currentStreak);
                    const isToday = canClaimCheckInToday && d.day === (currentStreak > 7 ? ((currentStreak - 1) % 7) + 1 : currentStreak);

                    return (
                      <div
                        key={d.day}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-between gap-1 transition-all ${
                          isToday
                            ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                            : isPassed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] font-bold block">{d.label}</span>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px]">
                          {isPassed ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span>{d.isMega ? '🏆' : '🪙'}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white">+{d.reward}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Instant Check-in Action in Modal */}
                {canClaimCheckInToday ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => {
                      handleClaimDailyCheckIn(e);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>دریافت ۱۰ سکه هدیه امروز (Claim Daily Check-In)</span>
                  </motion.button>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>پاداش ۱۰ سکه امروز با موفقیت دریافت گردید! فردا بازگردید.</span>
                  </div>
                )}
              </div>

              {/* Daily Tasks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <CheckSquare className="w-4 h-4 text-sky-400" />
                    <span>ماموریت‌های ورزشی امروز:</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">ریست روزانه: ساعت ۰۰:۰۰ بامداد</span>
                </div>

                <div className="space-y-2">
                  {dailyTasks.filter((task) => task.category !== 'battle').map((task) => {
                    const isCompleted = task.isCompleted;
                    const isClaimed = task.isClaimed;

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-2xl border transition-all space-y-2 ${
                          isClaimed
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                            : isCompleted
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 text-xs shrink-0 mt-0.5">
                              {task.category === 'checkin' ? (
                                <Gift className="w-4 h-4" />
                              ) : task.category === 'running' ? (
                                <Activity className="w-4 h-4" />
                              ) : task.category === 'hardware' ? (
                                <Watch className="w-4 h-4" />
                              ) : (
                                <Users className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-bold text-white">{task.title}</h5>
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  +{task.rewardPool} POOL
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{task.description}</p>
                            </div>
                          </div>

                          {/* Claim / Action Button */}
                          <div className="shrink-0">
                            {isClaimed ? (
                              <span className="text-[10px] text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1 font-bold">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>دریافت شد</span>
                              </span>
                            ) : isCompleted ? (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.94 }}
                                onClick={(e) => handleClaimTaskReward(task.id, e)}
                                className="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>دریافت پاداش</span>
                              </motion.button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDailyTasksModal(false);
                                  if (task.category === 'running' || task.category === 'hardware') setActiveTab('sync');
                                  else if (task.category === 'social') setActiveTab('crews');
                                }}
                                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-xl text-[11px] font-bold border border-slate-800 transition-colors cursor-pointer"
                              >
                                انجام ماموریت
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar for progressive tasks */}
                        {task.target > 1 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>پیشرفت:</span>
                              <span className="font-mono">
                                {task.progress.toFixed(1)} / {task.target} {task.unit}
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BEAUTIFUL LOGOUT & PROFILE CONFIRMATION MODAL */}
        {showLogoutConfirmModal && user && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[420px] glass-panel-glow rounded-3xl p-5 border border-rose-500/35 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">مدیریت نشست و خروج از حساب</h3>
                    <span className="text-[10px] text-slate-400">اطلاعات کیف پول و فعالیت‌های شما ذخیره شده است</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirmModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Runner Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">نام و نام خانوادگی:</span>
                  <span className="font-bold text-white">{user.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">شماره موبایل:</span>
                  <span className="font-mono text-sky-300" dir="ltr">{user.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ایمیل ثبت‌شده:</span>
                  <span className="font-mono text-emerald-300 text-[11px]" dir="ltr">
                    {user.email || `${user.username}@dopool.ir`}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">موجودی کیف پول:</span>
                  <span className="font-mono font-black text-emerald-400">{user.lockedPoolBalance.toFixed(1)} POOL</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">وضعیت امنیت ابری (Firebase):</span>
                  {cloudUid ? (
                    <span className="text-[11px] font-bold text-emerald-400 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>متصل و رمزنگاری‌شده در Firestore</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-400">نشست محلی (آماده اتصال ابری)</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {!cloudUid && (
                  <button
                    type="button"
                    onClick={handleGoogleCloudAuth}
                    disabled={isCloudSyncing}
                    className="w-full py-2.5 px-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {isCloudSyncing
                        ? 'در حال اتصال به فضای ابری...'
                        : 'اتصال و پشتیبان‌گیری کیف پول در فضای ابری Google Firebase'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const currentRef = user.referralCode;
                    setShowLogoutConfirmModal(false);
                    setUser(null);
                    setAuthMode('register');
                    setRegReferral(currentRef);
                    triggerToast('آماده نام‌نویسی جدید', 'فرم ثبت‌نام کاربر جدید با کد معرف شما باز شد.', 'info');
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>خروج و تست صفحه «نام‌نویسی کاربر جدید» (+ایمیل خوش‌آمدگویی)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      signOutCloud().catch(() => {});
                      setShowLogoutConfirmModal(false);
                      setUser(null);
                      setAuthMode('login');
                      triggerToast('خروج موفق 👋', 'با موفقیت از حساب کاربری خود خارج شدید.', 'info');
                    }}
                    className="py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>خروج از حساب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirmModal(false)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    انصراف و ادامه
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* WELCOME EMAIL PREVIEW MODAL (ارسال ایمیل خوش‌آمدگویی پس از نام‌نویسی) */}
        {showWelcomeEmailModal && sentWelcomeEmail && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-[460px] glass-panel-glow rounded-3xl p-5 border border-emerald-500/40 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white">ایمیل خوش‌آمدگویی ارسال شد!</h3>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                        SMTP 250 OK
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      تحویل آنی به صندوق ورودی ایمیل کاربر
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWelcomeEmailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Email Envelope Metadata */}
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">فرستنده:</span>
                  <span className="font-mono text-slate-200" dir="ltr">Dopool Running Club &lt;welcome@dopool.ir&gt;</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">گیرنده (شما):</span>
                  <span className="font-mono text-emerald-400 font-bold" dir="ltr">{sentWelcomeEmail.recipientEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">شماره تماس ثبت‌شده:</span>
                  <span className="font-mono text-sky-300" dir="ltr">{sentWelcomeEmail.phone}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800/80 text-white font-bold">
                  موضوع: {sentWelcomeEmail.subject}
                </div>
              </div>

              {/* Rendered Persian HTML Email Body */}
              <div className="rounded-2xl bg-gradient-to-b from-[#0c182e] to-slate-950 border border-emerald-500/30 p-4 space-y-3 text-xs leading-relaxed">
                <div className="text-center pb-3 border-b border-slate-800/80 space-y-1">
                  <span className="text-2xl">🏃‍♂️⚡🏅</span>
                  <h4 className="text-sm font-black text-white">سلام {sentWelcomeEmail.recipientName} عزیز!</h4>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    به اولین پلتفرم دویدن و کسب درآمد (Move-to-Earn) ایران خوش آمدید
                  </p>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  حساب کاربری و کیف پول ورزشی شما با نام کاربری <strong className="text-white font-mono">@{sentWelcomeEmail.username}</strong> با موفقیت فعال گردید. به پاس عضویت شما، <strong className="text-emerald-400">{sentWelcomeEmail.bonusTokens} سکه POOL</strong> به عنوان هدیه خوش‌آمدگویی به کیف پول شما واریز شد!
                </p>

                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">هدیه خوش‌آمدگویی</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">+{sentWelcomeEmail.bonusTokens} POOL</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">کد دعوت اختصاصی شما</span>
                    <span className="text-sm font-black text-sky-400 font-mono">{sentWelcomeEmail.referralCode}</span>
                  </div>
                </div>

                <ul className="space-y-1 text-[11px] text-slate-300 list-disc pr-4">
                  <li>هر روز با ورود به برنامه <strong>۱۰ سکه تشویقی</strong> دریافت کنید.</li>
                  <li>ساعت هوشمند یا استراوای خود را متصل کنید و به ازای هر کیلومتر دویدن سکه بگیرید.</li>
                  <li>نوتیفیکیشن گوشی شما برای اعلام پاداش‌ها و رتبه جدول فعال است.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dispatchPushNotification({
                      type: 'SYSTEM',
                      title: `تاییدیه موبایل برای ${sentWelcomeEmail.recipientName} 📱`,
                      body: `نوتیفیکیشن گوشی شما به همراه ایمیل ${sentWelcomeEmail.recipientEmail} به درستی متصل است!`,
                    });
                  }}
                  className="py-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>تست نوتیف روی گوشی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowWelcomeEmailModal(false)}
                  className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ورود به داشبورد دوپول
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* FORGOT PASSWORD MODAL */}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-[400px] glass-panel-glow rounded-3xl p-5 border border-sky-500/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white">بازیابی رمز عبور</h3>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {!forgotPasswordSubmitted ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setForgotPasswordSubmitted(true);
                    triggerToast('لینک بازیابی ارسال شد', 'لینک تغییر رمز عبور به ایمیل و شماره موبایل شما ارسال گردید.', 'success');
                  }}
                  className="space-y-3"
                >
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ایمیل یا شماره موبایل خود را وارد کنید تا لینک بازنشانی رمز عبور برایتان ارسال شود:
                  </p>
                  <input
                    type="text"
                    required
                    value={forgotPasswordInput}
                    onChange={(e) => setForgotPasswordInput(e.target.value)}
                    placeholder="runner@gmail.com یا 0912..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white text-left font-mono"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                  >
                    ارسال کد و لینک بازیابی
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-3 py-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-200 font-bold">
                    لینک بازیابی با موفقیت به <span className="font-mono text-sky-300">{forgotPasswordInput}</span> ارسال شد.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    بازگشت به صفحه ورود
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TESTER RELEASE, SHARE & MOBILE PWA INSTALL MODAL (انتشار اولیه و تست با کاربران) */}
        {showTesterShareModal && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[460px] glass-panel-glow rounded-3xl p-5 border border-sky-500/40 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white">انتشار نسخه اولیه و دعوت تسترها</h3>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                        LIVE v1.0
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      آماده اشتراک‌گذاری با دوستان، نصب PWA روی موبایل و تست نوتیفیکیشن
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTesterShareModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* IMPORTANT FIX FOR "Error: Page not found" ON MOBILE */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>چرا در گوشی خطای «Page not found» می‌دهد؟ (راه‌حل ۱۰ ثانیه‌ای)</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  در محیط Google AI Studio، لینک عمومی تا زمانی که دکمه <strong>Share (اشتراک‌گذاری)</strong> را روشن نکنید برای گوشی و سایر افراد قفل است:
                </p>
                <div className="bg-slate-950/85 rounded-xl p-2.5 border border-amber-500/25 space-y-1.5 text-[11px] text-slate-200">
                  <p className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-black">۱.</span>
                    <span>
                      در <strong>بالا سمت راست همین صفحه (نوار بالای AI Studio)</strong> روی دکمه <strong>Share (آیکون اشتراک‌گذاری)</strong> یا <strong>Deploy (آیکون موشک 🚀)</strong> بزنید.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-black">۲.</span>
                    <span>
                      گزینه دسترسی را روی <strong>Public (عمومی)</strong> قرار دهید تا لینک برای همه گوشی‌ها فعال شود.
                    </span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-black">💡</span>
                    <span className="text-emerald-300">
                      اگر می‌خواهید همین الان روی گوشی خودتان (که با همین جیمیل لاگین است) تست کنید، از <strong>«لینک مخصوص گوشی خودتان (Dev)»</strong> در کادر زیر استفاده کنید!
                    </span>
                  </p>
                </div>
              </div>

              {/* 1. Direct Share Link for Testers (With Public vs Dev Switcher & QR Code) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-sky-400" />
                    <span>انتخاب نوع لینک ورود به برنامه:</span>
                  </span>
                </div>

                {/* Switch between Public (ais-pre) and Creator Dev (ais-dev) */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedShareLinkType('public')}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedShareLinkType === 'public'
                        ? 'bg-sky-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    لینک عمومی تسترها (Public)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShareLinkType('dev')}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedShareLinkType === 'dev'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    لینک مخصوص گوشی خودتان (Dev)
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {selectedShareLinkType === 'public'
                    ? 'مخصوص ارسال به دوستان و تسترها (نیازمند روشن کردن دکمه Share -> Public در بالای صفحه AI Studio).'
                    : 'مخصوص باز کردن روی گوشی خودتان (وقتی با همین اکانت جیمیل در سافاری یا کروم گوشی لاگین هستید).'}
                </p>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={testerShareUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-sky-300 font-mono select-all text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleCopyTesterUrl}
                    className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedShareUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShareUrl ? 'کپی شد' : 'کپی لینک'}</span>
                  </button>
                </div>

                {/* Scannable QR Code for iPhone / Android Camera */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=6&data=${encodeURIComponent(testerShareUrl)}`}
                    alt="QR Code"
                    className="w-16 h-16 rounded-lg bg-white p-1 shrink-0"
                  />
                  <div className="space-y-1 text-[11px]">
                    <span className="font-bold text-white block">اسکن سریع با دوربین آیفون یا اندروید 📷</span>
                    <p className="text-slate-400 text-[10px] leading-snug">
                      دوربین گوشی خود را مقابل این بارکد بگیرید تا بدون نیاز به تایپ آدرس، مستقیماً وارد اپلیکیشن دوپول شوید.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyTesterInviteText}
                    className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedInviteText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{copiedInviteText ? 'متن دعوت کپی شد' : 'کپی متن دعوت تلگرام/واتساپ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShareTester}
                    className="py-2 px-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال مستقیم به دوستان</span>
                  </button>
                </div>
              </div>

              {/* 2. Install as Mobile App (PWA) & Push Notification Check */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>نصب روی گوشی موبایل (اندروید و آیفون)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    {isInstalledPWA ? 'نصب شده ✓' : 'PWA Ready'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  وقتی تسترها لینک بالا را در گوشی باز کنند، می‌توانند با دکمه زیر برنامه را مثل یک اپ بومی روی صفحه اصلی گوشی نصب کرده و نوتیفیکیشن دریافت کنند:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleInstallPWA}
                    className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{isInstalledPWA ? 'نصب شده روی دستگاه' : 'نصب اپ روی گوشی'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pushPermission !== 'granted') {
                        requestPushPermission();
                      } else {
                        dispatchPushNotification({
                          type: 'TOKEN_AWARD',
                          title: 'تست نوتیفیکیشن موبایل دوپول 🔔⚡',
                          body: 'تبریک! نوتیفیکیشن و ویبره گوشی شما برای نسخه آزمایشی کاملاً فعال است.',
                          poolAmount: 10,
                        });
                      }
                    }}
                    className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BellRing className="w-4 h-4" />
                    <span>تست نوتیف روی گوشی</span>
                  </button>
                </div>

                {showIOSInstallGuide && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/30 text-[11px] text-slate-200 space-y-1">
                    <span className="font-bold text-sky-400 block">راهنمای نصب در آیفون (Safari):</span>
                    <p>۱. در نوار پایین سافاری روی دکمه <strong>Share</strong> بزنید.</p>
                    <p>۲. گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.</p>
                  </div>
                )}
              </div>

              {/* 3. Quick Test of New User Registration Flow */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">می‌خواهید خودتان فرآیند ثبت‌نام تسترها را امتحان کنید؟</span>
                <p className="text-[11px] text-slate-400">
                  با کلیک روی دکمه زیر، به صفحه «نام‌نویسی جدید» (با دریافت اسم و فامیل، شماره، ایمیل و ارسال ایمیل خوش‌آمدگویی) منتقل می‌شوید:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const refCode = user?.referralCode || 'DP-8834';
                    setShowTesterShareModal(false);
                    setUser(null);
                    setAuthMode('register');
                    setRegReferral(refCode);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-emerald-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >
                  مشاهده و تست فرم نام‌نویسی جدید + ایمیل خوش‌آمدگویی
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* POST-ACTIVITY VERIFICATION & REWARD BREAKDOWN MODAL */}
        {selectedReceiptActivity && (
          <div className="fixed inset-0 bg-[#060913]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-[460px] space-y-3 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>گزارش تایید فعالیت و محاسبه ضرایب پاداش</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptActivity(null)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>بستن</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <ActivityVerificationReceiptCard
                activity={selectedReceiptActivity}
                onShare={(act) => {
                  setSelectedReceiptActivity(null);
                  setStoryModalActivity(act);
                }}
              />

              <button
                type="button"
                onClick={() => setSelectedReceiptActivity(null)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                تایید و بازگشت به برنامه
              </button>
            </motion.div>
          </div>
        )}

        {/* SINGLE POST-ACTIVITY NUTRITION RECOMMENDATION POP-UP MODAL */}
        {postRunNutritionPopup && (() => {
          const rec = getSinglePostRunRecommendation(postRunNutritionPopup.distanceKm);
          return (
            <div className="fixed inset-0 bg-[#060913]/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-[360px] rounded-3xl bg-slate-900 border border-emerald-500/40 p-5 text-center space-y-3.5 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto">
                  {rec.emoji}
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[11px] font-mono font-black text-orange-400" dir="ltr">
                    🔥 {rec.burnedCalories} kcal · {postRunNutritionPopup.distanceKm.toFixed(1)} km
                  </span>
                  <h3 className="text-sm font-black text-white pt-1">{rec.title}</h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
                  {rec.suggestion}
                </p>

                <button
                  type="button"
                  onClick={() => setPostRunNutritionPopup(null)}
                  className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                >
                  متوجه شدم ✓
                </button>
              </motion.div>
            </div>
          );
        })()}

        {/* VIRAL AURA INSTAGRAM STORY STUDIO MODAL (9:16 Story Only + Pace Heatmap Only + 4 Models: Gold, Minimal, Magazine, Transparent Photo Overlay) */}
        {storyModalActivity && (
          <div className="fixed inset-0 bg-[#060913]/92 backdrop-blur-xl z-50 flex items-center justify-center p-2.5 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-[440px] max-h-[95vh] overflow-y-auto rounded-3xl bg-[#090e1c] border border-slate-800 p-3.5 sm:p-4 space-y-2.5 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-white truncate">
                      استودیو استوری اینستاگرام (Aura · 9:16)
                    </h3>
                    <span className="text-[10px] text-slate-400 block truncate">
                      نقشه هیت‌مپ واقعی مسیر اکتیویتی + حالت ترنسپرنت روی عکس
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStoryModalActivity(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4 Focused Aura Models Selector Grid */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  {[
                    { id: 'gold', label: 'اورا گلد', icon: Sparkles, activeCls: 'from-amber-500 to-yellow-400 text-slate-950' },
                    { id: 'strava', label: 'اورا مینیمال', icon: Activity, activeCls: 'from-sky-400 to-cyan-300 text-slate-950' },
                    { id: 'poster', label: 'اورا مگزین', icon: Award, activeCls: 'from-purple-500 to-pink-400 text-white' },
                    { id: 'transparent', label: 'ترنسپرنت / عکس', icon: Share2, activeCls: 'from-emerald-500 to-teal-400 text-slate-950' },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStoryTheme(item.id as StoryModelType)}
                        className={`py-2 px-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
                          storyTheme === item.id
                            ? `bg-gradient-to-r ${item.activeCls} font-black shadow`
                            : 'text-slate-400 hover:text-white bg-slate-900/60'
                        }`}
                      >
                        <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  ref={storyPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStoryPhotoUpload}
                  className="hidden"
                />

                {/* Transparent Mode Helper Bar: Upload Own Photo OR Export Pure Transparent PNG Sticker */}
                {storyTheme === 'transparent' && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <button
                      type="button"
                      onClick={() => storyPhotoInputRef.current?.click()}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>{storyCustomPhoto ? 'تغییر عکس پس‌زمینه' : 'انتخاب عکس از گالری من'}</span>
                    </button>

                    {storyCustomPhoto ? (
                      <button
                        type="button"
                        onClick={() => setStoryCustomPhoto(null)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[10px] cursor-pointer"
                      >
                        حالت بدون پس‌زمینه (PNG شفاف)
                      </button>
                    ) : (
                      <span className="text-[9.5px] text-emerald-300 font-bold px-1 flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 shrink-0" />
                        <span>استیکر شفاف PNG</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Route Switcher, Viral Hook Selector & Toman Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStoryHookIndex((prev) => (prev + 1) % storyViralHooks.length)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      <span>شعار ({storyHookIndex + 1}/4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStoryRouteVariant((prev) => prev + 1)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 font-bold flex items-center gap-1 cursor-pointer"
                      title="تغییر زاویه هیت‌مپ مسیر"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>زاویه هیت‌مپ</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStoryShowToman((prev) => !prev)}
                    className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                        storyShowToman
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      {storyShowToman && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>معادل تومانی</span>
                  </button>
                </div>
              </div>

              {/* LIVE 9:16 INSTAGRAM STORY PREVIEW (Always Pace Heatmap GPS Route) */}
              {(() => {
                const b = computeActivityRewardBreakdown(storyModalActivity);
                const route = getActivityGpsRoute(storyModalActivity, storyRouteVariant);
                const tomanVal = Math.round(b.earnedCoins * 15000);
                const caloriesBurned = Math.max(65, Math.round(storyModalActivity.distanceKm * 68));
                const refCode = user?.referralCode || 'POOL-8834';
                const activeHook = storyViralHooks[storyHookIndex] || storyViralHooks[0];
                const isMinimalOrTransparent = storyTheme === 'strava' || storyTheme === 'transparent';

                // Activity Pace Heatmap GPS Route SVG
                const renderPaceHeatmapSvg = (compact = false) => (
                  <div
                    className={`relative w-full overflow-hidden rounded-2xl transition-all ${
                      isMinimalOrTransparent
                        ? 'bg-transparent py-1'
                        : 'bg-[#060b17]/80 border border-white/10 backdrop-blur-md p-2.5 shadow-inner'
                    }`}
                  >
                    {!isMinimalOrTransparent && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-25"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
                          backgroundSize: '22px 22px',
                        }}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between text-[8px] font-bold text-slate-300 mb-1 px-0.5">
                      <span className="flex items-center gap-1 truncate drop-shadow">
                        <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span>{route.routeNameFa}</span>
                      </span>
                      <span className="font-mono text-sky-400 drop-shadow" dir="ltr">
                        {route.coordsText}
                      </span>
                    </div>

                    <svg
                      viewBox="0 0 260 145"
                      className={`w-full ${compact ? 'h-22' : 'h-28'} overflow-visible mx-auto`}
                      fill="none"
                    >
                      <defs>
                        <linearGradient id="storyPaceHeatmapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>

                      {/* Outer Pace Heatmap Glow */}
                      <path
                        d={route.svgPath}
                        stroke="url(#storyPaceHeatmapGrad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.26"
                      />

                      {/* Crisp Primary Pace Heatmap Track */}
                      <path
                        d={route.svgPath}
                        stroke="url(#storyPaceHeatmapGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.75))',
                        }}
                      />

                      {/* KM Split Markers */}
                      {route.splits.slice(0, 5).map((sp) => (
                        <g key={sp.km}>
                          <circle
                            cx={sp.x}
                            cy={sp.y}
                            r="5.2"
                            fill="#090e1c"
                            stroke="#fbbf24"
                            strokeWidth="1.4"
                          />
                          <text
                            x={sp.x}
                            y={sp.y + 2.2}
                            textAnchor="middle"
                            fill="#fde68a"
                            fontSize="6.2"
                            fontWeight="900"
                            fontFamily="monospace"
                          >
                            {sp.km}
                          </text>
                        </g>
                      ))}

                      {/* Start Beacon (Emerald) & Finish Beacon (Amber Gold) */}
                      <circle
                        cx={route.startPt.x}
                        cy={route.startPt.y}
                        r="4.5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={route.endPt.x}
                        cy={route.endPt.y}
                        r="5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </svg>

                    <div className="relative z-10 flex items-center justify-between text-[7.5px] text-slate-300 pt-0.5 px-1 drop-shadow">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        استارت نرمال
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                        پیس میانی ({b.formattedPace})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        فینیش سرعتی
                      </span>
                    </div>
                  </div>
                );

                return (
                  <div
                    className={`relative mx-auto w-full max-w-[330px] aspect-[9/16] rounded-3xl overflow-hidden border shadow-2xl flex flex-col justify-between p-3.5 select-none transition-all duration-300 ${
                      storyTheme === 'gold'
                        ? 'bg-gradient-to-b from-[#060913] via-[#101829] to-[#1d1406] border-amber-500/45'
                        : storyTheme === 'strava'
                        ? 'bg-gradient-to-b from-[#070b14] via-[#111a2e] to-[#070b14] border-sky-400/40'
                        : storyTheme === 'poster'
                        ? 'bg-gradient-to-b from-[#140b29] via-[#0b132b] to-[#050814] border-purple-500/45'
                        : 'bg-[#0b1120] border-emerald-500/45'
                    }`}
                    style={
                      storyTheme === 'transparent' && !storyCustomPhoto
                        ? {
                            backgroundImage:
                              'linear-gradient(45deg, rgba(30,41,59,0.55) 25%, transparent 25%), linear-gradient(-45deg, rgba(30,41,59,0.55) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(30,41,59,0.55) 75%), linear-gradient(-45deg, transparent 75%, rgba(30,41,59,0.55) 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                          }
                        : undefined
                    }
                  >
                    {/* Optional Custom User Photo Backdrop in Transparent Mode */}
                    {storyTheme === 'transparent' && storyCustomPhoto && (
                      <>
                        <img
                          src={storyCustomPhoto}
                          alt="Runner Backdrop"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/75 via-[#060913]/15 to-[#060913]/90" />
                      </>
                    )}

                    {/* Giant Watermark Number for Aura Magazine Mode */}
                    {storyTheme === 'poster' && (
                      <div
                        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[115px] font-black font-mono text-white/[0.04] pointer-events-none select-none"
                        dir="ltr"
                      >
                        {storyModalActivity.distanceKm.toFixed(1)}
                      </div>
                    )}

                    {/* Ambient Glow */}
                    {storyTheme !== 'transparent' && (
                      <div
                        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
                          storyTheme === 'gold'
                            ? 'bg-amber-500/20'
                            : storyTheme === 'poster'
                            ? 'bg-purple-500/20'
                            : 'bg-sky-500/20'
                        }`}
                      />
                    )}

                    {/* 1. Top Section: Official Winged Coin Dopool Logo */}
                    <div className="relative z-10 flex items-center justify-between px-1">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-slate-300 drop-shadow">
                        {storyTheme === 'transparent' ? 'TRANSPARENT' : 'IG STORY · 9:16'}
                      </span>
                      <img
                        src={DOPOOL_LOGO_DARK_URL}
                        alt="Dopool"
                        className="w-28 h-20 object-contain drop-shadow-[0_8px_22px_rgba(245,158,11,0.48)]"
                      />
                      <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 drop-shadow">
                        HEATMAP GPS
                      </span>
                    </div>

                    {/* 2. Center Section: Aura Model Showcase + Pace Heatmap Route */}
                    <div className="relative z-10 flex flex-col items-center text-center my-auto w-full space-y-1.5">
                      {isMinimalOrTransparent ? (
                        /* Aura Minimal & Transparent Overlay: Floating Heatmap Route + Clean Aura Stack */
                        <div className="w-full space-y-1.5 py-0.5">
                          {renderPaceHeatmapSvg(true)}
                          <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-white/15">
                            <div>
                              <span className="text-[8px] font-bold tracking-widest text-slate-300 uppercase block drop-shadow">
                                DISTANCE
                              </span>
                              <div className="text-xl font-black text-white font-mono drop-shadow" dir="ltr">
                                {storyModalActivity.distanceKm.toFixed(2)}
                                <span className="text-[10px] text-amber-400 ml-0.5">km</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold tracking-widest text-slate-300 uppercase block drop-shadow">
                                AVG PACE
                              </span>
                              <div className="text-xl font-black text-sky-400 font-mono drop-shadow" dir="ltr">
                                {b.formattedPace}
                              </div>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold tracking-widest text-slate-300 uppercase block drop-shadow">
                                TIME
                              </span>
                              <div className="text-xl font-black text-emerald-400 font-mono drop-shadow" dir="ltr">
                                {b.formattedTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Aura Gold & Aura Magazine: Framed Pace Heatmap Route + Giant Distance */
                        <div className="w-full space-y-1.5 flex flex-col items-center">
                          {renderPaceHeatmapSvg(false)}
                          <div className="pt-0.5">
                            <div
                              className="text-4xl font-black text-white font-mono tracking-tighter leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]"
                              dir="ltr"
                            >
                              {storyModalActivity.distanceKm.toFixed(2)}{' '}
                              <span className="text-base font-bold text-amber-400">KM</span>
                            </div>
                            <span className="text-[10px] text-slate-300 font-bold block mt-0.5">
                              {b.title}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Bottom Section: Telemetry + POOL Reward + Viral Hook */}
                    <div className="relative z-10 space-y-1.5">
                      <div className="grid grid-cols-4 gap-1 text-center">
                        <div className="p-1 rounded-xl bg-slate-950/75 border border-white/15 backdrop-blur-md">
                          <span className="text-[7.5px] text-slate-300 block">پیس (PACE)</span>
                          <span className="text-[9.5px] font-black text-white font-mono mt-0.5 block" dir="ltr">
                            {b.formattedPace}
                          </span>
                        </div>
                        <div className="p-1 rounded-xl bg-slate-950/75 border border-white/15 backdrop-blur-md">
                          <span className="text-[7.5px] text-slate-300 block">زمان (TIME)</span>
                          <span className="text-[9.5px] font-black text-white font-mono mt-0.5 block" dir="ltr">
                            {b.formattedTime}
                          </span>
                        </div>
                        <div className="p-1 rounded-xl bg-slate-950/75 border border-white/15 backdrop-blur-md">
                          <span className="text-[7.5px] text-slate-300 block">کالری (KCAL)</span>
                          <span className="text-[9.5px] font-black text-orange-400 font-mono mt-0.5 block" dir="ltr">
                            {caloriesBurned}
                          </span>
                        </div>
                        <div className="p-1 rounded-xl bg-slate-950/75 border border-white/15 backdrop-blur-md">
                          <span className="text-[7.5px] text-slate-300 block">ضربان (BPM)</span>
                          <span className="text-[9.5px] font-black text-rose-400 font-mono mt-0.5 block" dir="ltr">
                            {storyModalActivity.avgHeartRate}
                          </span>
                        </div>
                      </div>

                      <div className="py-1.5 px-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-slate-950/85 to-emerald-500/20 border border-amber-400/50 flex items-center justify-between backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <img src={DOPOOL_COIN_URL} alt="coin" className="w-5 h-4 object-contain" />
                          <span className="text-lg font-black text-amber-400 font-mono tracking-tight">
                            +{b.earnedCoins} POOL
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400">
                          {storyShowToman
                            ? `معادل ${tomanVal.toLocaleString('fa-IR')} تومان`
                            : `ضریب پاداش x${(storyModalActivity.multiplier ?? 1).toFixed(1)}`}
                        </span>
                      </div>

                      <div className="px-2.5 py-1.5 rounded-2xl bg-slate-950/85 border border-emerald-500/40 text-center space-y-0.5 backdrop-blur-md shadow-md">
                        <p className="text-[9.5px] font-black text-white leading-snug truncate">
                          {activeHook}
                        </p>
                        <div className="text-[9px] font-mono font-black text-amber-300">
                          🎁 ۱۰ سکه هدیه شروع با کد دعوت: {refCode}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Download & Native Share Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isExportingStory}
                  onClick={() => handleExportStoryImage('download')}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>
                    {isExportingStory
                      ? 'در حال ساخت...'
                      : storyTheme === 'transparent' && !storyCustomPhoto
                      ? 'دانلود استیکر شفاف (PNG)'
                      : 'دانلود استوری (9:16)'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isExportingStory}
                  onClick={() => handleExportStoryImage('share')}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>اشتراک مستقیم استوری</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3-LINE HAMBURGER MENU DRAWER (شامل جوایز و رتبه‌بندی) */}
        <AnimatePresence>
          {showHamburgerMenu && user && (
            <div
              className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
              onClick={() => setShowHamburgerMenu(false)}
            >
              <motion.div
                initial={{ x: '-100%', opacity: 0.5 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-[84%] max-w-[330px] h-full bg-[#090e1c] border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl overflow-y-auto"
              >
                <div className="space-y-4">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <img
                          src={DOPOOL_COIN_URL}
                          alt="Dopool"
                          className="w-7 h-6 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white truncate">منوی امکانات دوپول</h3>
                        <span className="text-[10px] text-slate-400 block truncate">
                          دسترسی سریع به جوایز و رتبه‌بندی
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHamburgerMenu(false)}
                      className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Requested Items: Smartwatches (اتصال ساعت هوشمند), Rewards (جوایز) & Leaderboard (رتبه‌بندی) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 px-1 block">
                      بخش‌های اصلی منو
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('watches');
                        setShowHamburgerMenu(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeTab === 'watches'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                          <Watch className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span className="truncate">اتصال به ساعت‌های هوشمند</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 shrink-0">
                              {Object.values(user.connectedWatches).filter(Boolean).length} متصل
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            اتصال Strava، گارمین، اپل واچ، شیائومی و سامسونگ
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('store');
                        setShowHamburgerMenu(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeTab === 'store'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">جوایز و فروشگاه کوپن</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            تبدیل سکه به کد تخفیف و چالش‌های VIP
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('leaderboard');
                        setShowHamburgerMenu(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeTab === 'leaderboard'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span className="truncate">جدول رتبه‌بندی دوندگان</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                              رتبه #{getUserRank(user.totalKm)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            رده‌بندی انفرادی، دوئل‌ها و برترین‌های ایران
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('crews');
                        setShowHamburgerMenu(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeTab === 'crews'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">کلاب‌های دویدن تیمی</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            لیگ هفتگی تیم‌ها و گفتگوی اعضا
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('history');
                        setShowHamburgerMenu(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeTab === 'history'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">تاریخچه فعالیت‌ها و رسیدها</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            مشاهده {activities.length} فعالیت ثبت‌شده و ضرایب
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('support');
                        setShowHamburgerMenu(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        activeTab === 'support'
                          ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">پشتیبانی واتساپ و تماس</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono truncate" dir="ltr">
                            0915 300 3908 · پاسخگویی سریع
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>
                  </div>

                  {/* Quick Actions inside 3-line menu */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 px-1 block">
                      ابزارهای سریع
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        const acceptedAct = activities.find((a) => a.status === 'ACCEPTED') || activities[0];
                        if (acceptedAct) setStoryModalActivity(acceptedAct);
                      }}
                      className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/35 text-right flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/35 text-amber-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white truncate">ساخت استوری اینستاگرام</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400 rotate-180 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        setShowCashoutModal(true);
                      }}
                      className="w-full p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-right flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-200 truncate">تسویه حساب ریالی (شبا)</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rotate-180 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>کد دعوت: <strong className="text-amber-400 font-mono">{user.referralCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHamburgerMenu(false);
                      setShowLogoutConfirmModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>خروج</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Symmetrical 3-Column Bottom App Navigation Bar */}
        {user && (
          <nav className="fixed sm:absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto app-header-bar border-t border-slate-800/80 px-3 py-1.5 grid grid-cols-3 gap-1 items-center z-40 transition-colors duration-300">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'home' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === 'home'
                    ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[10px] leading-tight">منو اصلی</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'sync' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === 'sync'
                    ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[10px] leading-tight">اکتیویتی</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'invite' ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                  activeTab === 'invite'
                    ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[10px] leading-tight">دعوت</span>
            </button>
          </nav>
        )}

        {/* Global Toast Alert */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[420px] p-3.5 rounded-2xl glass-panel shadow-2xl z-50 flex items-center gap-3 border transition-opacity">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : toast.type === 'error'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <XCircle className="w-5 h-5" />
              ) : toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">{toast.message}</p>
              {toast.detail && <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.detail}</p>}
            </div>
          </div>
        )}

        {/* ANIMATED COIN REWARD CELEBRATION BANNER + FLYING COINS OVERLAY */}
        <AnimatePresence>
          {recentRewardGain && (
            <motion.div
              key={recentRewardGain.id}
              initial={{ opacity: 0, y: -40, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[998] pointer-events-none"
            >
              <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/95 via-yellow-400/95 to-emerald-400/95 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.45)] border-2 border-yellow-100 flex items-center gap-2.5">
                <motion.img
                  src={DOPOOL_COIN_URL}
                  alt="POOL Coin"
                  animate={{ rotateY: [0, 360], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                  className="w-8 h-7 object-contain drop-shadow"
                />
                <div className="text-right">
                  <span className="text-[10px] font-black block leading-none text-slate-900">
                    سکه جایزه واریز شد! ✨
                  </span>
                  <span className="text-sm font-black font-mono block leading-tight" dir="ltr">
                    +{recentRewardGain.amount} POOL
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {flyingCoins.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
            {flyingCoins.map((coin) => (
              <motion.div
                key={coin.id}
                initial={{
                  x: coin.startX,
                  y: coin.startY,
                  scale: 0.3,
                  opacity: 0,
                  rotate: -20,
                }}
                animate={{
                  x: [coin.startX, coin.startX + coin.scatterX, coin.targetX],
                  y: [coin.startY, coin.startY + coin.scatterY, coin.targetY],
                  scale: [0.35, 1.25, 0.45],
                  opacity: [0, 1, 0],
                  rotate: [0, coin.rotation],
                }}
                transition={{
                  duration: 0.85,
                  delay: coin.delay,
                  ease: 'easeOut',
                }}
                className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 will-change-transform"
              >
                <img
                  src={DOPOOL_COIN_URL}
                  alt="POOL"
                  className="w-9 h-8 object-contain drop-shadow-[0_4px_12px_rgba(245,158,11,0.75)]"
                />
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
