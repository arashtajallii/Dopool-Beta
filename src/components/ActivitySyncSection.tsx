import React, { memo, useMemo } from 'react';
import { Activity, Share2, Clock, Mountain, Coins } from 'lucide-react';
import { translateFaToEn } from '../i18n';

export interface ActivitySyncItem {
  id: string;
  title?: string;
  filename: string;
  distanceKm: number;
  elevGainMeters?: number;
  elapsedSeconds: number;
  avgHeartRate: number;
  paceMinPerKm?: number;
  status?: 'ACCEPTED' | 'REJECTED';
  poolReward?: number;
  createdAt?: string;
  source?: string;
}

interface ActivitySyncSectionProps {
  activities: ActivitySyncItem[];
  onShareStory: (activity: ActivitySyncItem) => void;
  onViewReceipt?: (activity: ActivitySyncItem) => void;
  lang?: 'fa' | 'en';
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatPace = (distanceKm: number, elapsedSeconds: number): string => {
  if (!distanceKm || distanceKm <= 0) return '0:00';
  const totalMin = elapsedSeconds / 60 / distanceKm;
  const pMin = Math.floor(totalMin);
  const pSec = Math.round((totalMin - pMin) * 60);
  if (pSec === 60) return `${pMin + 1}:00`;
  return `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
};

const SyncedActivityCard = memo(function SyncedActivityCard({
  activity,
  onShareStory,
  onViewReceipt,
  isEn,
}: {
  activity: ActivitySyncItem;
  onShareStory: (act: ActivitySyncItem) => void;
  onViewReceipt?: (act: ActivitySyncItem) => void;
  isEn: boolean;
}) {
  const elev =
    activity.elevGainMeters ?? Math.max(12, Math.round(activity.distanceKm * 3.7));
  const durationStr = formatDuration(activity.elapsedSeconds);
  const paceStr = formatPace(activity.distanceKm, activity.elapsedSeconds);
  const displayTitle = isEn
    ? translateFaToEn(activity.title || 'Daily Run')
    : activity.title || 'دویدن روزانه';
  const displayDate = isEn
    ? translateFaToEn(activity.createdAt || 'Today')
    : activity.createdAt || 'امروز';
  const displaySource = activity.source
    ? isEn
      ? translateFaToEn(activity.source)
      : activity.source
    : '';

  return (
    <div
      onClick={() => onViewReceipt?.(activity)}
      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2.5 transition-all hover:border-slate-700/80 active:scale-[0.99] cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white leading-snug">
              {displayTitle}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span>{displayDate}</span>
              {displaySource && (
                <>
                  <span>·</span>
                  <span className="text-sky-400 font-medium">{displaySource}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {(activity.poolReward ?? 0) > 0 && (
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-[11px] shrink-0 flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
            <span>
              +{activity.poolReward} {isEn ? 'Dopool' : 'دوپول'}
            </span>
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">
            {isEn ? 'Distance' : 'مسافت'}
          </span>
          <span className="text-xs font-black font-mono text-white" dir="ltr">
            {activity.distanceKm.toFixed(1)} km
          </span>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
            <Mountain className="w-3 h-3 text-sky-400 shrink-0" />
            <span>{isEn ? 'Elevation' : 'الویشن'}</span>
          </span>
          <span className="text-xs font-black font-mono text-sky-400" dir="ltr">
            +{elev} m
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{isEn ? 'Time / Pace' : 'زمان / پیس'}</span>
          </span>
          <span className="text-xs font-black font-mono text-emerald-300" dir="ltr">
            {durationStr} ({paceStr})
          </span>
        </div>
      </div>

      {/* Receipt & Story Share Actions */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {onViewReceipt ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewReceipt(activity);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{isEn ? 'Activity Receipt' : 'رسید اکتیویتی'}</span>
          </button>
        ) : <span />}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShareStory(activity);
          }}
          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-[10px] flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Share2 className="w-3 h-3 shrink-0" />
          <span>{isEn ? 'Share Record to Story' : 'اشتراک رکورد در استوری'}</span>
        </button>
      </div>
    </div>
  );
});

const ActivitySyncSection = memo(function ActivitySyncSection({
  activities,
  onShareStory,
  onViewReceipt,
  lang = 'fa',
}: ActivitySyncSectionProps) {
  const isEn = lang === 'en';
  const acceptedActivities = useMemo(() => {
    const seenKeys = new Set<string>();
    return activities.filter((a) => {
      if (a.status === 'REJECTED') return false;
      const rawText = `${a.title || ''} ${a.filename || ''} ${a.source || ''}`.toLowerCase();
      if (
        rawText.includes('mention') ||
        rawText.includes('tagged') ||
        rawText.includes('tag_') ||
        rawText.includes('منشن') ||
        rawText.includes('تگ شده') ||
        rawText.includes('تگ‌')
      ) {
        return false;
      }
      const key = `${(a.filename || '').trim().toLowerCase()}|${Number(a.distanceKm).toFixed(2)}_${a.elapsedSeconds}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
  }, [activities]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isEn
              ? `Synced Activities (${acceptedActivities.length})`
              : `فعالیت‌های سینک شده (${acceptedActivities.length})`}
          </span>
        </h3>
      </div>

      {acceptedActivities.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 text-center space-y-2 border border-slate-800/80">
          <Activity className="w-7 h-7 text-slate-500 mx-auto" />
          <p className="text-xs font-bold text-slate-300">
            {isEn ? 'No synced activities yet' : 'هنوز فعالیتی سینک نشده است'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {acceptedActivities.map((act) => (
            <SyncedActivityCard
              key={act.id}
              activity={act}
              onShareStory={onShareStory}
              onViewReceipt={onViewReceipt}
              isEn={isEn}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default ActivitySyncSection;
