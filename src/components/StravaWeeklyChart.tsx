import React, { memo, useMemo, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';

interface StravaWeeklyChartProps {
  username: string;
  totalKm: number;
  acceptedElevGain: number;
  selectedWeekIdx: number;
  onSelectWeek: (idx: number) => void;
}

const WEEK_RATIOS = [0.42, 0.58, 0.51, 0.74, 0.65, 0.88, 0.79];
const WEEK_LABELS = [
  { label: '۷ هفته پیش', short: 'هفته ۱' },
  { label: '۶ هفته پیش', short: 'هفته ۲' },
  { label: '۵ هفته پیش', short: 'هفته ۳' },
  { label: '۴ هفته پیش', short: 'هفته ۴' },
  { label: '۳ هفته پیش', short: 'هفته ۵' },
  { label: '۲ هفته پیش', short: 'هفته ۶' },
  { label: 'هفته گذشته', short: 'هفته ۷' },
];
const GUIDE_RATIOS = [0.25, 0.55, 0.85];

const CHART_WIDTH = 320;
const CHART_HEIGHT = 100;
const PAD_X = 18;
const PAD_Y = 14;
const USABLE_W = CHART_WIDTH - PAD_X * 2;
const USABLE_H = CHART_HEIGHT - PAD_Y * 2;

const StravaWeeklyChart = memo(function StravaWeeklyChart({
  username,
  totalKm,
  acceptedElevGain,
  selectedWeekIdx,
  onSelectWeek,
}: StravaWeeklyChartProps) {
  // Memoize 8-week personal dataset & SVG geometry so it only recalculates when user stats change
  const { weeksData, points, polylinePoints, areaPath } = useMemo(() => {
    const cleanName = username || 'runner';
    const userSeed = cleanName
      .split('')
      .reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0);

    const currentPersonalKm = Number(Math.max(0, totalKm || 0).toFixed(1));
    const baseKm = Math.max(3.5, currentPersonalKm);
    const currentElev =
      acceptedElevGain > 0 ? acceptedElevGain : Math.round(currentPersonalKm * 12);
    const currentTotalMins = Math.round(currentPersonalKm * 5.6);

    const computedWeeks = [
      ...WEEK_LABELS.map((w, idx) => {
        const seedOffset = (((userSeed + idx * 17) % 9) - 4) * 0.6;
        const wkKm =
          currentPersonalKm > 0
            ? Number(Math.max(2.0, baseKm * WEEK_RATIOS[idx] + seedOffset).toFixed(1))
            : 0;
        const mins = Math.round(wkKm * 5.6);
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return {
          label: w.label,
          short: w.short,
          km: wkKm,
          time: hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`,
          elev: Math.round(wkKm * (11 + ((userSeed + idx) % 4))),
        };
      }),
      {
        label: 'این هفته',
        short: 'این هفته',
        km: currentPersonalKm,
        time:
          Math.floor(currentTotalMins / 60) > 0
            ? `${Math.floor(currentTotalMins / 60)}h ${currentTotalMins % 60}m`
            : `${currentTotalMins}m`,
        elev: currentElev,
      },
    ];

    const maxKm = Math.max(...computedWeeks.map((w) => w.km), 5) * 1.15;

    const svgPoints = computedWeeks.map((w, idx) => {
      const x = Math.round((PAD_X + (idx / (computedWeeks.length - 1)) * USABLE_W) * 10) / 10;
      const y = Math.round((PAD_Y + USABLE_H - (w.km / maxKm) * USABLE_H) * 10) / 10;
      return { x, y, ...w, idx };
    });

    const polyStr = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');
    const areaStr = `M ${svgPoints[0].x},${CHART_HEIGHT - 6} L ${svgPoints
      .map((p) => `${p.x},${p.y}`)
      .join(' L ')} L ${svgPoints[svgPoints.length - 1].x},${CHART_HEIGHT - 6} Z`;

    return {
      weeksData: computedWeeks,
      points: svgPoints,
      polylinePoints: polyStr,
      areaPath: areaStr,
    };
  }, [username, totalKm, acceptedElevGain]);

  const activeWeek = weeksData[selectedWeekIdx] || weeksData[7];

  const handleNodeClick = useCallback(
    (idx: number) => {
      onSelectWeek(idx);
    },
    [onSelectWeek]
  );

  return (
    <div className="glass-panel rounded-2xl p-3.5 border border-slate-800/90 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#fc4c02]/15 border border-[#fc4c02]/35 text-[#fc4c02] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white">نمودار هفتگی دویدن</h3>
            <span className="text-[10px] text-slate-400 block">
              @{username} · {activeWeek.label}
            </span>
          </div>
        </div>

        <span
          className="px-2 py-0.5 rounded-lg bg-[#fc4c02]/15 border border-[#fc4c02]/30 text-[#fc4c02] text-[10px] font-mono font-bold shrink-0"
          dir="ltr"
        >
          {activeWeek.km} km
        </span>
      </div>

      {/* Selected Week Summary Strip */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/75 border border-slate-800/80 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">مسافت هفته</span>
          <span className="text-xs font-mono font-black text-[#fc4c02]" dir="ltr">
            {activeWeek.km} km
          </span>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">زمان دویدن</span>
          <span className="text-xs font-mono font-bold text-white" dir="ltr">
            {activeWeek.time}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">الویشن هفته</span>
          <span className="text-xs font-mono font-bold text-emerald-400" dir="ltr">
            +{activeWeek.elev} m
          </span>
        </div>
      </div>

      {/* Interactive SVG Strava Line & Area Chart */}
      <div className="pt-1">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 18}`}
          className="w-full h-28 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="stravaAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fc4c02" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#fc4c02" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {GUIDE_RATIOS.map((ratio, idx) => (
            <line
              key={idx}
              x1={PAD_X}
              x2={CHART_WIDTH - PAD_X}
              y1={PAD_Y + USABLE_H * ratio}
              y2={PAD_Y + USABLE_H * ratio}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}

          <path d={areaPath} fill="url(#stravaAreaGrad)" />

          <polyline
            fill="none"
            stroke="#fc4c02"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {points.map((pt) => {
            const isSelected = pt.idx === selectedWeekIdx;
            return (
              <g
                key={pt.idx}
                onClick={() => handleNodeClick(pt.idx)}
                className="cursor-pointer"
              >
                {isSelected && (
                  <line
                    x1={pt.x}
                    x2={pt.x}
                    y1={PAD_Y}
                    y2={CHART_HEIGHT - 6}
                    stroke="#fc4c02"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 5.5 : 3.5}
                  fill={isSelected ? '#fc4c02' : '#0f172a'}
                  stroke="#fc4c02"
                  strokeWidth={isSelected ? 2.5 : 2}
                />
                <text
                  x={pt.x}
                  y={CHART_HEIGHT + 12}
                  textAnchor="middle"
                  fill={isSelected ? '#fb923c' : '#64748b'}
                  fontSize="8.5"
                  fontWeight={isSelected ? '800' : '600'}
                >
                  {pt.short}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});

export default StravaWeeklyChart;
