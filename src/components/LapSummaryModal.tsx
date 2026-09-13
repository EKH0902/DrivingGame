import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Clock, Flame, RotateCcw, Zap } from 'lucide-react';

interface LapSummaryModalProps {
  isOpen: boolean;
  lapTime: number;
  targetTime: number;
  bestTime: number | null;
  driftScore: number;
  maxSpeed: number;
  onRestart: () => void;
}

export const LapSummaryModal: React.FC<LapSummaryModalProps> = ({
  isOpen,
  lapTime,
  targetTime,
  bestTime,
  driftScore,
  maxSpeed,
  onRestart,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Ignore if confetti not supported
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSecs = Math.floor(lapTime / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const ms = Math.floor((lapTime % 1000) / 10);
  const timeString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;

  const isUnderTarget = lapTime <= targetTime * 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-white">
        {/* Header Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 mb-3 shadow-inner">
            <Award className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            코스 완주 성공!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            2분 원형 서킷 주행 연습을 성공적으로 완료하였습니다.
          </p>
        </div>

        {/* Lap Time Display */}
        <div className="mt-5 rounded-2xl bg-slate-950 p-4 border border-slate-800 text-center">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider">TOTAL LAP TIME</span>
          <div className="font-mono text-4xl font-black text-sky-400 my-1">
            {timeString}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
            {isUnderTarget ? (
              <span className="text-emerald-400 flex items-center gap-1">
                ✓ 2분 목표 시간 달성! ({Math.round(targetTime - lapTime / 1000)}초 단축)
              </span>
            ) : (
              <span className="text-amber-400">
                목표 시간(02:00) 초과 (+{Math.round(lapTime / 1000 - targetTime)}초)
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>최고 속도</span>
            </div>
            <div className="font-mono text-lg font-bold text-slate-100">
              {Math.round(maxSpeed)} <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              <span>드리프트 점수</span>
            </div>
            <div className="font-mono text-lg font-bold text-amber-400">
              {driftScore} <span className="text-xs font-normal text-slate-400">pts</span>
            </div>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-98 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/30 transition"
        >
          <RotateCcw className="h-4 w-4" />
          <span>다시 주행하기 (Drive Again)</span>
        </button>
      </div>
    </div>
  );
};
