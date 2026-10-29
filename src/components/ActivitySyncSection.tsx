import React, { memo, useMemo } from 'react';
import { Activity, RefreshCw, CheckCircle2, Watch, Share2, Clock, Mountain, Coins } from 'lucide-react';

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
  connectedProviderName: string;
  lastSyncedAt?: string;
  isSyncing: boolean;
  onSyncNow: () => void;
  onOpenWatches: () => void;
  onShareStory: (activity: ActivitySyncItem) => void;
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
}: {
  activity: ActivitySyncItem;
  onShareStory: (act: ActivitySyncItem) => void;
}) {
  const elev =
    activity.elevGainMeters ?? Math.max(12, Math.round(activity.distanceKm * 3.7));
  const durationStr = formatDuration(activity.elapsedSeconds);
  const paceStr = formatPace(activity.distanceKm, activity.elapsedSeconds);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2.5 transition-colors hover:border-slate-700/80">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white leading-snug">
              {activity.title || 'دویدن روزانه'}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span>{activity.createdAt || 'امروز'}</span>
              {activity.source && (
                <>
                  <span>·</span>
                  <span className="text-sky-400 font-medium">{activity.source}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {(activity.poolReward ?? 0) > 0 && (
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-[11px] shrink-0 flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
            <span>+{activity.poolReward} دوپول</span>
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">مسافت</span>
          <span className="text-xs font-black font-mono text-white" dir="ltr">
            {activity.distanceKm.toFixed(1)} km
          </span>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
            <Mountain className="w-3 h-3 text-sky-400 shrink-0" />
            <span>الویشن</span>
          </span>
          <span className="text-xs font-black font-mono text-sky-400" dir="ltr">
            +{elev} m
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>زمان / پیس</span>
          </span>
          <span className="text-xs font-black font-mono text-emerald-300" dir="ltr">
            {durationStr} ({paceStr})
          </span>
        </div>
      </div>

      {/* Story Share Action */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[10px] text-emerald-400/90 font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>همگام‌سازی خودکار انجام شد</span>
        </span>
        <button
          type="button"
          onClick={() => onShareStory(activity)}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Share2 className="w-3 h-3 shrink-0" />
          <span>اشتراک رکورد در استوری</span>
        </button>
      </div>
    </div>
  );
});

const ActivitySyncSection = memo(function ActivitySyncSection({
  activities,
  connectedProviderName,
  lastSyncedAt,
  isSyncing,
  onSyncNow,
  onOpenWatches,
  onShareStory,
}: ActivitySyncSectionProps) {
  const acceptedActivities = useMemo(
    () => activities.filter((a) => a.status !== 'REJECTED'),
    [activities]
  );

  return (
    <div className="space-y-3.5">
      {/* Auto-Sync Status Header */}
      <div className="glass-panel rounded-2xl p-3.5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/35 via-slate-900/90 to-slate-950 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shrink-0">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-white">همگام‌سازی خودکار فعالیت‌ها</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                متصل به {connectedProviderName} · {lastSyncedAt || 'بروزرسانی خودکار فعال'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'در حال دریافت...' : 'همگام‌سازی'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
          <span>فعالیت‌های ورزشی شما به صورت خودکار با اپ سینک می‌شوند.</span>
          <button
            type="button"
            onClick={onOpenWatches}
            className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Watch className="w-3 h-3 shrink-0" />
            <span>تنظیم ساعت</span>
          </button>
        </div>
      </div>

      {/* Synced Activities Feed */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>فعالیت‌های سینک شده ({acceptedActivities.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400">دریافت خودکار از ساعت و استراوا</span>
        </div>

        {acceptedActivities.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center space-y-2 border border-slate-800/80">
            <Activity className="w-7 h-7 text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-300">هنوز فعالیتی سینک نشده است</p>
            <p className="text-[10px] text-slate-400">
              به محض ثبت دویدن در ساعت یا استراوا، فعالیت به صورت خودکار اینجا نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {acceptedActivities.map((act) => (
              <SyncedActivityCard
                key={act.id}
                activity={act}
                onShareStory={onShareStory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default ActivitySyncSection;
