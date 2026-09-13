import React from 'react';
import {
  X,
  Keyboard,
  MousePointer,
  RotateCw,
  Eye,
  Sliders,
  Flag,
  Volume2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DrivingMode } from '../types';

interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivingMode: DrivingMode;
  onToggleMode: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({
  isOpen,
  onClose,
  drivingMode,
  onToggleMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        id="controls-guide-window"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl shadow-sky-950/40 text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                3D 버스 시뮬레이터 조작법 안내
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  도심 서킷
                </span>
              </h2>
              <p className="text-xs text-slate-400">현실적인 5단 수동 버스 드라이빙 & 시점 제어 가이드</p>
            </div>
          </div>
          <button
            id="close-controls-modal-btn"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            title="닫기 (ESC)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Driving Mode Quick Switch Banner */}
        <div className="mt-4 p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {drivingMode === 'normal' ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Zap className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                현재 주행 모드:{' '}
                <span className={drivingMode === 'normal' ? 'text-emerald-400' : 'text-rose-400'}>
                  {drivingMode === 'normal' ? '일반 운전 모드 (안전/승차감 중심)' : '레이스 모드 (드리프트 활성화)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {drivingMode === 'normal'
                  ? '부드러운 조향 & ESP 자세제어로 안정적인 버스 운전 연습'
                  : '스페이스바로 핸드브레이크 파워 슬라이드 & 드리프트 테크닉 가능'}
              </p>
            </div>
          </div>
          <button
            id="toggle-mode-in-modal-btn"
            onClick={onToggleMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              drivingMode === 'normal'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {drivingMode === 'normal' ? '레이스 모드로 전환 (M)' : '일반 모드로 전환 (M)'}
          </button>
        </div>

        {/* Control Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {/* 1. Drive & Steer */}
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-800/30">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" /> 방향키 직관적 주행 & 조향
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">전진 가속 (자동 변속 1~5단)</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">↑</kbd>
                  <span className="text-slate-500">또는</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">W</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">감속 / 브레이크 (정지 후 후진)</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">↓</kbd>
                  <span className="text-slate-500">또는</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">S</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">좌회전 / 우회전 조향</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">←</kbd>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">→</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">A</kbd>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">D</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-300">핸드브레이크 / 파워 슬라이드</span>
                <kbd className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-amber-300 font-bold">Space</kbd>
              </div>
            </div>
          </div>

          {/* 2. Manual Gearbox & Engine */}
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-800/30">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> 엔진 시동 & 수동 기어박스
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">엔진 시동 걸기 / 끄기</span>
                <kbd className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 font-mono text-emerald-300 font-bold">I</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">수동 / 자동 변속 모드 전환</span>
                <kbd className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 font-mono text-sky-300 font-bold">T</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">단수 올리기 / 내리기</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 font-mono text-sky-300 font-bold">E</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 font-mono text-sky-300 font-bold">Q</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">기어 직접 선택</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">1~5</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">N</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">B(후진)</kbd>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800">
                • HUD의 기어 슬롯(R, N, 1~5)을 클릭해서 바로 변속할 수도 있습니다.<br />
                • 시동이 꺼져있을 때는 가속 페달을 밟아도 엔진이 구동되지 않습니다.
              </div>
            </div>
          </div>

          {/* 3. Camera & Free Look */}
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-800/30">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MousePointer className="h-3.5 w-3.5" /> 마우스 자유 시점 & 1인칭
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">마우스 우클릭 꾹 누르고 드래그</span>
                <span className="text-emerald-400 font-semibold">360° 자유 회전</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">시점 모드 변경</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">C</kbd>
                  <span className="text-[11px] text-slate-400">(1인칭/3인칭/탑뷰)</span>
                </div>
              </div>
              <div className="pt-1.5 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800">
                💡 <strong>1인칭 운전석</strong>에서 우클릭 드래그 시 실제 기사처럼 좌/우 미러 및 차창을 자유롭게 둘러볼 수 있습니다!
              </div>
            </div>
          </div>

          {/* 4. Utility & Functions */}
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-800/30">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <RotateCw className="h-3.5 w-3.5" /> 기능 단축키
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">차량 위치 리셋 (출발선)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">R</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">버스 경적 (클랙슨)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">H</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">전조등 (헤드라이트)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">L</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">주행 모드 전환 (일반/레이스)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-white font-bold">M</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5 text-sky-400" />
            목표: 2분 내에 원형 도심 격자 코스를 완주하세요!
          </span>
          <button
            id="confirm-controls-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors"
          >
            확인하고 주행 시작
          </button>
        </div>
      </div>
    </div>
  );
};
