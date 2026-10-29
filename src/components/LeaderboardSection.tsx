import React, { memo, useMemo } from 'react';
import { Award } from 'lucide-react';
import { translateFaToEn } from '../i18n';

export interface LeaderboardRunner {
  rank: number;
  fullName: string;
  username: string;
  totalKm: number;
  poolBalance: number;
}

interface LeaderboardRowProps {
  item: LeaderboardRunner;
  idx: number;
  isMe: boolean;
  isEn: boolean;
}

const LeaderboardRow = memo(function LeaderboardRow({ item, idx, isMe, isEn }: LeaderboardRowProps) {
  const displayName = isEn ? translateFaToEn(item.fullName) : item.fullName;
  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl transition-colors ${
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
          <span className="text-xs text-slate-200 font-bold flex items-center gap-1.5">
            <span>{displayName}</span>
            {isMe && (
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                {isEn ? '(You)' : '(شما)'}
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block" dir="ltr">
            @{item.username}
          </span>
        </div>
      </div>
      <div className="text-left font-mono shrink-0" dir="ltr">
        <span className="text-xs text-sky-400 font-bold block">{item.totalKm} km</span>
      </div>
    </div>
  );
});

interface LeaderboardSectionProps {
  leaderboard: LeaderboardRunner[];
  currentUsername: string;
  coinLogoUrl: string;
  lang?: 'fa' | 'en';
}

const LeaderboardSection = memo(function LeaderboardSection({
  leaderboard,
  currentUsername,
  coinLogoUrl,
  lang = 'fa',
}: LeaderboardSectionProps) {
  const isEn = lang === 'en';
  const normalizedCurrentUsername = useMemo(
    () => (currentUsername || '').toLowerCase(),
    [currentUsername]
  );

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  return (
    <div className="space-y-3.5">
      {/* Sleek Minimal Sponsor Strip with Refined Gold & Royal Indigo-Emerald Palette */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-950/60 to-emerald-500/15 px-3.5 py-2.5 border border-amber-400/35 flex items-center justify-between gap-2 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.18)]">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={coinLogoUrl}
            alt="Dopool"
            loading="lazy"
            decoding="async"
            className="w-5 h-5 object-contain drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)] shrink-0"
          />
          <span className="text-xs font-black bg-gradient-to-l from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            {isEn ? 'Dopool' : 'دوپول'}
          </span>
          <span className="text-slate-600 text-xs">•</span>
          <span className="text-[11px] text-slate-200 font-medium truncate">
            {isEn ? 'Official League Sponsor' : 'اسپانسر رسمی لیگ دوندگان'}
          </span>
        </div>

        <span className="text-[10px] font-black text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2.5 py-0.5 rounded-lg shrink-0 shadow-xs">
          {isEn ? 'Prize Sponsor' : 'حامی جوایز'}
        </span>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-2 items-end text-center">
          {/* Rank 2 - Silver Medal */}
          <div className="glass-panel rounded-2xl p-2.5 flex flex-col items-center border-slate-300/35">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200/25 to-slate-400/20 border border-slate-300/50 text-slate-200 flex items-center justify-center mb-1 shadow-sm">
              <Award className="w-4 h-4 text-slate-200" />
            </div>
            <span className="text-[10px] font-bold text-slate-200">
              {isEn ? '2nd Place' : 'نفر دوم'}
            </span>
            <span className="text-[11px] font-bold text-white mt-0.5 leading-tight">
              {isEn ? translateFaToEn(topThree[1].fullName) : topThree[1].fullName}
            </span>
            <span className="text-xs text-sky-400 font-mono mt-1 font-bold" dir="ltr">
              {topThree[1].totalKm} km
            </span>
          </div>

          {/* Rank 1 - Gold Medal */}
          <div className="glass-panel-glow rounded-2xl p-3 flex flex-col items-center border-amber-400/55 scale-105">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300/30 to-yellow-500/25 border border-amber-400/60 text-amber-300 flex items-center justify-center mb-1 shadow-sm">
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-[11px] font-black text-amber-400">
              {isEn ? '1st Place' : 'نفر اول'}
            </span>
            <span className="text-[11px] font-black text-white mt-0.5 leading-tight">
              {isEn ? translateFaToEn(topThree[0].fullName) : topThree[0].fullName}
            </span>
            <span className="text-xs text-sky-400 font-mono font-black mt-1" dir="ltr">
              {topThree[0].totalKm} km
            </span>
          </div>

          {/* Rank 3 - Bronze Medal */}
          <div className="glass-panel rounded-2xl p-2.5 flex flex-col items-center border-amber-700/40">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600/25 to-orange-800/25 border border-amber-600/50 text-amber-500 flex items-center justify-center mb-1 shadow-sm">
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold text-amber-500">
              {isEn ? '3rd Place' : 'نفر سوم'}
            </span>
            <span className="text-[11px] font-bold text-white mt-0.5 leading-tight">
              {isEn ? translateFaToEn(topThree[2].fullName) : topThree[2].fullName}
            </span>
            <span className="text-xs text-sky-400 font-mono mt-1 font-bold" dir="ltr">
              {topThree[2].totalKm} km
            </span>
          </div>
        </div>
      )}

      {/* Complete Rankings List */}
      <div className="glass-panel rounded-2xl p-2 space-y-1">
        <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
          <span>{isEn ? 'Rank & Runner' : 'رتبه و مشخصات دونده'}</span>
          <span>{isEn ? 'Total Distance' : 'مسافت ثبت‌شده'}</span>
        </div>
        {leaderboard.map((item, idx) => (
          <LeaderboardRow
            key={item.username}
            item={item}
            idx={idx}
            isMe={item.username.toLowerCase() === normalizedCurrentUsername}
            isEn={isEn}
          />
        ))}
      </div>
    </div>
  );
});

export default LeaderboardSection;
