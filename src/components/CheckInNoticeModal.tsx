import React from 'react';
import { soundFx } from '../utils/audio';
import { Sparkles, AlertTriangle, CheckCircle2, MapPin, X, Navigation } from 'lucide-react';

export interface NoticeModalData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  subtitle?: string;
  message: string;
  spotName?: string;
  distanceStr?: string;
  xpGained?: number;
}

interface CheckInNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeModalData | null;
  onForceCheckIn?: () => void;
}

export const CheckInNoticeModal: React.FC<CheckInNoticeModalProps> = ({
  isOpen,
  onClose,
  notice,
  onForceCheckIn,
}) => {
  if (!isOpen || !notice) return null;

  const isSuccess = notice.type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-pixel">
      <div
        className={`relative w-full max-w-md bg-[#1e1726] border-4 rounded-3xl p-5 sm:p-6 text-amber-100 shadow-2xl space-y-4 pixel-border-gold ${
          isSuccess ? 'border-emerald-500 shadow-emerald-950/50' : 'border-red-500 shadow-red-950/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center text-2xl shadow ${
                isSuccess
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                  : 'bg-red-950 border-red-500 text-red-300'
              }`}
            >
              {isSuccess ? '✨' : '🚫'}
            </div>
            <div>
              <h3
                className={`text-sm sm:text-base font-bold tracking-tight ${
                  isSuccess ? 'text-emerald-300' : 'text-red-400'
                }`}
              >
                {notice.title}
              </h3>
              {notice.subtitle && (
                <p className="text-[10px] text-amber-300/80 font-arcade">
                  {notice.subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Info Box */}
        <div className="bg-[#281f33] p-4 rounded-2xl border border-amber-800 space-y-3 text-xs leading-relaxed">
          {notice.spotName && (
            <div className="flex items-center gap-2 bg-[#181320] p-2.5 rounded-xl border border-amber-900">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-200 font-pixel font-bold truncate">
                {notice.spotName}
              </span>
            </div>
          )}

          <p className="font-sans-clean text-amber-100 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
            {notice.message}
          </p>

          {/* Success Rewards Badge */}
          {isSuccess && notice.xpGained && (
            <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-500 flex items-center justify-between text-emerald-200">
              <span className="text-[11px] font-pixel">HADIAH REVOLUSI FOG OF WAR:</span>
              <span className="text-amber-300 font-pixel font-bold flex items-center gap-1">
                +{notice.xpGained} XP <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Distance warning if present */}
          {!isSuccess && notice.distanceStr && (
            <div className="bg-red-950/60 p-2.5 rounded-xl border border-red-800 flex items-center justify-between text-red-200 font-pixel text-[11px]">
              <span>Jarak GPS Kamu:</span>
              <span className="text-amber-300 font-bold">{notice.distanceStr}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
          {isSuccess ? (
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-pixel font-bold text-xs rounded-xl border-2 border-emerald-300 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SIAP, PETUALANGAN BERLANJUT!</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 font-pixel text-xs rounded-xl border border-amber-700 transition-all active:scale-95"
              >
                Tutup
              </button>

              {onForceCheckIn && (
                <button
                  onClick={() => {
                    soundFx.playSuccess();
                    onForceCheckIn();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-pixel font-bold text-xs rounded-xl border-2 border-emerald-400 shadow-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Check-in di Titik Ini (+100 XP)</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
