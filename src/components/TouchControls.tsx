import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Disc, Volume2 } from 'lucide-react';

interface TouchControlsProps {
  onInputStart: (action: 'accel' | 'brake' | 'left' | 'right' | 'handbrake') => void;
  onInputEnd: (action: 'accel' | 'brake' | 'left' | 'right' | 'handbrake') => void;
  onShiftUp: () => void;
  onShiftDown: () => void;
  onHorn: (active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInputStart,
  onInputEnd,
  onShiftUp,
  onShiftDown,
  onHorn,
}) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-between px-4 sm:hidden">
      {/* Left steering pad */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onTouchStart={() => onInputStart('left')}
          onTouchEnd={() => onInputEnd('left')}
          onMouseDown={() => onInputStart('left')}
          onMouseUp={() => onInputEnd('left')}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/80 active:bg-sky-600 text-white border border-slate-700/80 shadow-lg active:scale-95 transition"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <button
          onTouchStart={() => onInputStart('right')}
          onTouchEnd={() => onInputEnd('right')}
          onMouseDown={() => onInputStart('right')}
          onMouseUp={() => onInputEnd('right')}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/80 active:bg-sky-600 text-white border border-slate-700/80 shadow-lg active:scale-95 transition"
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>

      {/* Right pedals pad */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onTouchStart={() => onInputStart('handbrake')}
          onTouchEnd={() => onInputEnd('handbrake')}
          onMouseDown={() => onInputStart('handbrake')}
          onMouseUp={() => onInputEnd('handbrake')}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-900/80 active:bg-amber-600 text-amber-200 border border-amber-700/80 shadow-lg active:scale-95 transition text-[11px] font-bold"
        >
          DRIFT
        </button>

        <button
          onTouchStart={() => onInputStart('brake')}
          onTouchEnd={() => onInputEnd('brake')}
          onMouseDown={() => onInputStart('brake')}
          onMouseUp={() => onInputEnd('brake')}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/80 active:bg-rose-600 text-rose-200 border border-rose-800/80 shadow-lg active:scale-95 transition"
        >
          <ArrowDown className="h-6 w-6" />
        </button>

        <button
          onTouchStart={() => onInputStart('accel')}
          onTouchEnd={() => onInputEnd('accel')}
          onMouseDown={() => onInputStart('accel')}
          onMouseUp={() => onInputEnd('accel')}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/80 active:bg-emerald-600 text-emerald-200 border border-emerald-800/80 shadow-lg active:scale-95 transition"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
