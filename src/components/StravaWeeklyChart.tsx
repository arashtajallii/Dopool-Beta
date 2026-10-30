import React, { memo, useMemo, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';

interface StravaWeeklyChartProps {
  username: string;
  totalKm: number;
  acceptedElevGain: number;
  selectedWeekIdx: number;
  onSelectWeek: (idx: number) => void;
  lang?: 'fa' | 'en';
}

const WEEK_RATIOS = [0.42, 0.58, 0.51, 0.74, 0.65, 0.88, 0.79];
const WEEK_LABELS_FA = [
  { label: '۷ هفته پیش', short: 'هفته ۱' },
  { label: '۶ هفته پیش', short: 'هفته ۲' },
  { label: '۵ هفته پیش', short: 'هفته ۳' },
  { label: '۴ هفته پیش', short: 'هفته ۴' },
  { label: '۳ هفته پیش', short: 'هفته ۵' },
  { label: '۲ هفته پیش', short: 'هفته ۶' },
  { label: 'هفته گذشته', short: 'هفته ۷' },
];
const WEEK_LABELS_EN = [
  { label: '7 Weeks Ago', short: 'Wk 1' },
  { label: '6 Weeks Ago', short: 'Wk 2' },
  { label: '5 Weeks Ago', short: 'Wk 3' },
  { label: '4 Weeks Ago', short: 'Wk 4' },
  { label: '3 Weeks Ago', short: 'Wk 5' },
  { label: '2 Weeks Ago', short: 'Wk 6' },
  { label: 'Last Week', short: 'Wk 7' },
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
  lang = 'fa',
}: StravaWeeklyChartProps) {
  const isEn = lang === 'en';

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

    const labels = isEn ? WEEK_LABELS_EN : WEEK_LABELS_FA;

    const computedWeeks = [
      ...labels.map((w, idx) => {
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
        label: isEn ? 'This Week' : 'این هفته',
        short: isEn ? 'This Wk' : 'این هفته',
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
  }, [username, totalKm, acceptedElevGain, isEn]);

  const activeWeek = weeksData[selectedWeekIdx] || weeksData[7];

  const handleNodeClick = useCallback(
    (idx: number) => {
      onSelectWeek(idx);
    },
    [onSelectWeek]
  );

  return (
    <div className="glass-panel rounded-3xl p-4 border border-[#fc4c02]/25 bg-gradient-to-b from-slate-900/95 via-[#111626] to-slate-950/95 shadow-[0_8px_24px_-8px_rgba(252,76,2,0.16)] space-y-3.5 relative overflow-hidden">
      {/* Header (بدون نام استراوا) */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#fc4c02]/25 to-amber-500/15 border border-[#fc4c02]/45 text-[#fc4c02] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>{isEn ? 'Weekly Running Chart' : 'نمودار هفتگی دویدن'}</span>
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              @{username} · <strong className="text-slate-200">{activeWeek.label}</strong>
            </span>
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#fc4c02] to-[#ff6b2b] text-white text-xs font-mono font-black shrink-0 shadow-sm shadow-[#fc4c02]/30"
          dir="ltr"
        >
          {activeWeek.km} km
        </span>
      </div>

      {/* Selected Week 3-Column Telemetry Strip */}
      <div className="relative z-10 grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/85 border border-slate-800/90 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">
            {isEn ? 'Weekly Distance' : 'مسافت هفته'}
          </span>
          <span className="text-xs sm:text-sm font-mono font-black text-[#ff5a14] mt-0.5 block" dir="ltr">
            {activeWeek.km} km
          </span>
        </div>
        <div className="border-x border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">
            {isEn ? 'Running Time' : 'زمان دویدن'}
          </span>
          <span className="text-xs sm:text-sm font-mono font-black text-white mt-0.5 block" dir="ltr">
            {activeWeek.time}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">
            {isEn ? 'Weekly Elevation' : 'الویشن هفته'}
          </span>
          <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 mt-0.5 block" dir="ltr">
            +{activeWeek.elev} m
          </span>
        </div>
      </div>

      {/* Interactive SVG Line & Area Chart (GPU-optimized vector glow without feDropShadow filter lag) */}
      <div className="relative z-10 pt-2">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 20}`}
          className="w-full h-32 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="weeklyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fc4c02" stopOpacity="0.46" />
              <stop offset="65%" stopColor="#fc4c02" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#fc4c02" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="weeklyStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#fc4c02" />
              <stop offset="100%" stopColor="#ff5500" />
            </linearGradient>
          </defs>

          {/* Horizontal Dashed Reference Lines */}
          {GUIDE_RATIOS.map((ratio, idx) => (
            <line
              key={`h-${idx}`}
              x1={PAD_X}
              x2={CHART_WIDTH - PAD_X}
              y1={PAD_Y + USABLE_H * ratio}
              y2={PAD_Y + USABLE_H * ratio}
              stroke="rgba(148, 163, 184, 0.13)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}

          {/* Subtle Vertical Week Tick Lines */}
          {points.map((pt) => (
            <line
              key={`v-${pt.idx}`}
              x1={pt.x}
              x2={pt.x}
              y1={PAD_Y}
              y2={CHART_HEIGHT - 6}
              stroke={
                pt.idx === selectedWeekIdx
                  ? 'rgba(252, 76, 2, 0.45)'
                  : 'rgba(148, 163, 184, 0.07)'
              }
              strokeDasharray={pt.idx === selectedWeekIdx ? 'none' : '2 3'}
              strokeWidth={pt.idx === selectedWeekIdx ? '1.5' : '1'}
            />
          ))}

          {/* Baseline */}
          <line
            x1={PAD_X}
            x2={CHART_WIDTH - PAD_X}
            y1={CHART_HEIGHT - 6}
            y2={CHART_HEIGHT - 6}
            stroke="rgba(252, 76, 2, 0.25)"
            strokeWidth="1"
          />

          {/* Area Fill Under Curve */}
          <path d={areaPath} fill="url(#weeklyAreaGrad)" />

          {/* Lightweight Vector Outer Glow Stroke */}
          <polyline
            fill="none"
            stroke="rgba(252, 76, 2, 0.24)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Primary Progress Polyline */}
          <polyline
            fill="none"
            stroke="url(#weeklyStrokeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Interactive Week Nodes & Floating Active Callout */}
          {points.map((pt) => {
            const isSelected = pt.idx === selectedWeekIdx;
            const badgeY = Math.max(2, pt.y - 20);
            return (
              <g
                key={pt.idx}
                onClick={() => handleNodeClick(pt.idx)}
                className="cursor-pointer"
              >
                {/* Invisible larger touch target for mobile fingers */}
                <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

                {isSelected && (
                  <>
                    {/* Outer glowing halo ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={9.5}
                      fill="rgba(252, 76, 2, 0.22)"
                    />
                    {/* Floating KM Callout Pill above selected node */}
                    <rect
                      x={pt.x - 18}
                      y={badgeY - 9}
                      width={36}
                      height={14}
                      rx={5}
                      fill="#fc4c02"
                    />
                    <text
                      x={pt.x}
                      y={badgeY + 0.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="7.5"
                      fontWeight="900"
                    >
                      {pt.km}k
                    </text>
                  </>
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 5.5 : 3.8}
                  fill={isSelected ? '#ffffff' : '#0f172a'}
                  stroke="#fc4c02"
                  strokeWidth={isSelected ? 3 : 2.2}
                />

                <text
                  x={pt.x}
                  y={CHART_HEIGHT + 13}
                  textAnchor="middle"
                  fill={isSelected ? '#ff6b2b' : '#94a3b8'}
                  fontSize="8.5"
                  fontWeight={isSelected ? '900' : '600'}
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
