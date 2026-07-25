import React, { useState } from 'react';
import { BaksoSpot, HunterProfile } from '../types';
import { soundFx } from '../utils/audio';
import {
  X,
  Volume2,
  VolumeX,
  Tv,
  MapPin,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Settings,
  Navigation,
  Check,
  AlertTriangle,
  Play,
  Award,
  BookOpen
} from 'lucide-react';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isScanlinesOn: boolean;
  onToggleScanlines: () => void;
  onSelectCityCenter: (lat: number, lng: number) => void;
  onTriggerGpsLocation: () => void;
  spots: BaksoSpot[];
  profile: HunterProfile;
  onImportData: (spots: BaksoSpot[], profile?: HunterProfile) => void;
  onResetData: () => void;
}

const INDONESIA_CITIES = [
  { name: 'Jakarta (Pusat)', lat: -6.2088, lng: 106.8456, tag: 'Ibu Kota Bakso' },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191, tag: 'Bakso Cuanki & Malang' },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521, tag: 'Bakso Kikil & Tetelan' },
  { name: 'Malang', lat: -7.9625, lng: 112.6375, tag: 'Surga Bakso Malang' },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695, tag: 'Bakso Urat Gudeg' },
  { name: 'Bali (Denpasar)', lat: -8.6705, lng: 115.2126, tag: 'Bakso Sapi Bali' },
  { name: 'Medan', lat: 3.5952, lng: 98.6722, tag: 'Bakso Ribs & Daging' },
  { name: 'Makassar', lat: -5.1477, lng: 119.4327, tag: 'Bakso Nyuknyang' },
];

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  isScanlinesOn,
  onToggleScanlines,
  onSelectCityCenter,
  onTriggerGpsLocation,
  spots,
  profile,
  onImportData,
  onResetData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'home' | 'audio_gfx' | 'gps' | 'data'>('home');
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  // Export Data JSON
  const handleExportData = () => {
    soundFx.playSuccess();
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      spots,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bakso_quest_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError('');
    setImportSuccess('');

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json.spots) || Array.isArray(json)) {
            const importedSpots = Array.isArray(json.spots) ? json.spots : json;
            onImportData(importedSpots, json.profile);
            soundFx.playSuccess();
            setImportSuccess(`Berhasil mengimpor ${importedSpots.length} data spot bakso!`);
          } else {
            setImportError('Format JSON tidak valid. Pastikan file JSON berisi daftar spots.');
          }
        } catch {
          setImportError('Gagal membaca file JSON. Pastikan file tidak rusak.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#3d281d] border-4 border-[#ffd700] rounded-2xl shadow-[6px_6px_0px_#2d1b15] p-4 sm:p-6 text-[#fdf6e3] my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header RPG Banner */}
        <div className="flex items-center justify-between border-b-2 border-[#ffd700]/40 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#800000] border-2 border-[#ffd700] flex items-center justify-center text-2xl shadow-inner">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-pixel text-[#ffd700] tracking-wider drop-shadow-[1px_1px_0px_#000]">
                HALAMAN UTAMA & PENGATURAN
              </h3>
              <p className="text-xs font-arcade text-amber-100">
                Pusat Kontrol Game, Pengaturan Tampilan, GPS & Manajemen Data
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#800000] hover:bg-red-900 border border-[#ffd700] text-[#ffd700] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-[#ffd700]/30 pb-3">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('home');
            }}
            className={`px-3 py-2 rounded-lg font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'home'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#5d4037] hover:bg-[#725146] text-amber-100 border border-[#ffd700]/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Utama & Panduan</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('gps');
            }}
            className={`px-3 py-2 rounded-lg font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'gps'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#5d4037] hover:bg-[#725146] text-amber-100 border border-[#ffd700]/50'
            }`}
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>Lokasi GPS & Kota</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('audio_gfx');
            }}
            className={`px-3 py-2 rounded-lg font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'audio_gfx'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#5d4037] hover:bg-[#725146] text-amber-100 border border-[#ffd700]/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Suara & Grafik</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('data');
            }}
            className={`px-3 py-2 rounded-lg font-pixel text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'bg-[#ffd700] text-[#2d1b15] font-bold border-2 border-white shadow-md'
                : 'bg-[#5d4037] hover:bg-[#725146] text-amber-100 border border-[#ffd700]/50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Kelola Data</span>
          </button>
        </div>

        {/* TAB 1: HOME & PANDUAN BERMAIN */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-[#ffd700]/60 shadow-md">
              <h4 className="text-sm font-pixel text-[#ffd700] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                SELAMAT DATANG DI BAKSO QUEST!
              </h4>
              <p className="text-xs font-arcade leading-relaxed text-amber-100 mb-3">
                Bakso Quest adalah aplikasi RPG pemburu kuliner bakso Nusantara. Kamu bertualang mencatat, memberikan rating mangkuk, review cita rasa, serta memetakan tempat bakso favoritmu di seluruh Indonesia!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div className="bg-[#2d1b15] p-3 rounded-lg border border-[#ffd700]/40 text-center">
                  <div className="text-2xl mb-1">📍</div>
                  <h5 className="font-pixel text-[11px] text-[#ffd700]">1. Peta Interactive</h5>
                  <p className="text-[10px] text-amber-200/80 mt-1">
                    Klik di peta atau gunakan GPS untuk menambahkan lokasi bakso secara langsung.
                  </p>
                </div>

                <div className="bg-[#2d1b15] p-3 rounded-lg border border-[#ffd700]/40 text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <h5 className="font-pixel text-[11px] text-[#ffd700]">2. Raih XP & Level</h5>
                  <p className="text-[10px] text-amber-200/80 mt-1">
                    Setiap spot baru memberikan +100 XP untuk menaikkan level Hunter milikmu.
                  </p>
                </div>

                <div className="bg-[#2d1b15] p-3 rounded-lg border border-[#ffd700]/40 text-center">
                  <div className="text-2xl mb-1">👑</div>
                  <h5 className="font-pixel text-[11px] text-[#ffd700]">3. Koleksi Badge</h5>
                  <p className="text-[10px] text-amber-200/80 mt-1">
                    Buka pencapaian seperti &quot;Suhu Sambal Setan&quot; dan &quot;Master Kuah Kaldu&quot;.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button to Add Spot via GPS */}
            <div className="bg-[#800000] p-4 rounded-xl border-2 border-[#ffd700] shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h5 className="font-pixel text-xs text-[#ffd700] uppercase">
                  📍 Aksi Cepat: Deteksi Lokasi Sekarang
                </h5>
                <p className="text-xs text-amber-100">
                  Tambahkan kedai bakso di sekitar posisi GPS HP / Komputermu saat ini.
                </p>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                  onTriggerGpsLocation();
                }}
                className="px-4 py-2.5 btn-3d font-pixel text-xs rounded-lg flex items-center gap-2 whitespace-nowrap shadow-lg active:translate-y-0.5"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>TAMBAH PAKAI GPS</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LOKASI GPS & KOTA UTAMA */}
        {activeTab === 'gps' && (
          <div className="space-y-4">
            {/* Direct GPS Button */}
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-emerald-400/80 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xl font-bold border border-emerald-300">
                  📍
                </div>
                <div>
                  <h4 className="text-sm font-pixel text-emerald-300">
                    DETEKSI LOKASI GPS REAL-TIME
                  </h4>
                  <p className="text-xs text-amber-100">
                    Sistem akan mengambil koordinat presisi dari perangkatmu untuk memetakan bakso.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                  onTriggerGpsLocation();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel font-bold text-xs rounded-lg border-2 border-emerald-200 shadow-lg transition-all flex items-center justify-center gap-2 active:translate-y-0.5"
              >
                <Navigation className="w-4 h-4 animate-pulse" />
                <span>AMBIL KOORDINAT GPS SAYA & TAMBAH BAKSO</span>
              </button>
            </div>

            {/* Indonesia Major Cities Teleport */}
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-[#ffd700]/60">
              <h4 className="text-sm font-pixel text-[#ffd700] mb-2">
                🌏 PINTASAN WILAYAH & KOTA UTAMA
              </h4>
              <p className="text-xs text-amber-100 mb-3">
                Geser tampilan peta utama langsung ke pusat kota pilihanmu:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INDONESIA_CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      soundFx.playClick();
                      onSelectCityCenter(city.lat, city.lng);
                      onClose();
                    }}
                    className="p-2.5 bg-[#2d1b15] hover:bg-[#800000] border border-[#ffd700]/50 rounded-lg text-left transition-all group"
                  >
                    <span className="font-pixel text-[11px] text-[#ffd700] group-hover:text-white block">
                      {city.name}
                    </span>
                    <span className="text-[10px] text-amber-200/80 block truncate">
                      {city.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIO & GRAFIK SETTINGS */}
        {activeTab === 'audio_gfx' && (
          <div className="space-y-4">
            {/* Audio Controls */}
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-[#ffd700]/60 space-y-3">
              <h4 className="text-sm font-pixel text-[#ffd700] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-300" />
                PENGATURAN SUARA & AUDIO 8-BIT
              </h4>

              <div className="flex items-center justify-between bg-[#2d1b15] p-3 rounded-lg border border-[#ffd700]/30">
                <div>
                  <span className="font-pixel text-xs text-amber-200 block">
                    Master Sound FX
                  </span>
                  <span className="text-[11px] text-amber-100/80">
                    {isMuted ? 'Suara Efek Retro Nonaktif (Muted)' : 'Suara Efek Retro Aktif'}
                  </span>
                </div>
                <button
                  onClick={handleToggleMute}
                  className={`px-3 py-2 rounded-lg font-pixel text-xs flex items-center gap-1.5 transition-all ${
                    isMuted
                      ? 'bg-red-800 text-white border border-red-400'
                      : 'bg-emerald-600 text-white border border-emerald-300'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isMuted ? 'MUTE' : 'AKTIF'}</span>
                </button>
              </div>

              {/* Sound Test Panel */}
              <div>
                <span className="text-xs font-pixel text-amber-300 block mb-2">
                  UJI SUARA RETRO (AUDIO TEST):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => soundFx.playClick()}
                    className="px-2.5 py-1.5 bg-[#2d1b15] hover:bg-amber-900 border border-[#ffd700] rounded text-xs text-amber-200 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-[#ffd700]" /> Click
                  </button>
                  <button
                    onClick={() => soundFx.playOpenModal()}
                    className="px-2.5 py-1.5 bg-[#2d1b15] hover:bg-amber-900 border border-[#ffd700] rounded text-xs text-amber-200 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-[#ffd700]" /> Dialog
                  </button>
                  <button
                    onClick={() => soundFx.playSuccess()}
                    className="px-2.5 py-1.5 bg-[#2d1b15] hover:bg-amber-900 border border-[#ffd700] rounded text-xs text-amber-200 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-emerald-400" /> Level Up Fanfare
                  </button>
                </div>
              </div>
            </div>

            {/* Display & Scanlines */}
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-[#ffd700]/60 space-y-3">
              <h4 className="text-sm font-pixel text-[#ffd700] flex items-center gap-2">
                <Tv className="w-4 h-4 text-amber-300" />
                EFEK LAYAR CRT SCANLINES
              </h4>

              <div className="flex items-center justify-between bg-[#2d1b15] p-3 rounded-lg border border-[#ffd700]/30">
                <div>
                  <span className="font-pixel text-xs text-amber-200 block">
                    Filter Garis CRT Retro
                  </span>
                  <span className="text-[11px] text-amber-100/80">
                    Memberikan sensasi visual monitor TV cembung era 90-an
                  </span>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onToggleScanlines();
                  }}
                  className={`px-3 py-2 rounded-lg font-pixel text-xs transition-all ${
                    isScanlinesOn
                      ? 'bg-[#ffd700] text-[#2d1b15] font-bold border border-white'
                      : 'bg-[#2d1b15] text-amber-300 border border-[#ffd700]'
                  }`}
                >
                  {isScanlinesOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATA MANAGEMENT */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Backup Export / Import */}
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-[#ffd700]/60 space-y-3">
              <h4 className="text-sm font-pixel text-[#ffd700] flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-300" />
                PENCADANGAN & IMPOR JURNAL SPOT
              </h4>
              <p className="text-xs text-amber-100">
                Simpan daftar spot bakso dan profilmu ke dalam file JSON, atau pulihkan dari file cadangan sebelumnya.
              </p>

              {importSuccess && (
                <div className="p-2.5 bg-emerald-950 border border-emerald-500 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  {importSuccess}
                </div>
              )}

              {importError && (
                <div className="p-2.5 bg-red-950 border border-red-500 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Export Button */}
                <button
                  onClick={handleExportData}
                  className="py-2.5 px-3 bg-[#800000] hover:bg-red-900 border border-[#ffd700] rounded-lg font-pixel text-xs text-[#ffd700] flex items-center justify-center gap-2 shadow-md transition-all active:translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  <span>UNDUH FILE JSON</span>
                </button>

                {/* Import File Input Button */}
                <label className="py-2.5 px-3 bg-[#2d1b15] hover:bg-[#4a2e22] border border-[#ffd700] rounded-lg font-pixel text-xs text-amber-200 flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:translate-y-0.5">
                  <Upload className="w-4 h-4 text-[#ffd700]" />
                  <span>IMPOR FILE JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Reset Factory Defaults */}
            <div className="bg-[#5d4037] p-4 rounded-xl border-2 border-red-500/80 space-y-3">
              <h4 className="text-sm font-pixel text-red-300 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                RESET DATA PETUALANGAN
              </h4>
              <p className="text-xs text-amber-100">
                Kembalikan daftar spot ke rekomendasi awal awal game. Action ini tidak dapat dibatalkan.
              </p>

              {resetConfirm ? (
                <div className="p-3 bg-red-950 border-2 border-red-500 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-red-200">
                    Apakah Anda yakin ingin menghapus spot buatan sendiri dan mengembalikan data default?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onResetData();
                        setResetConfirm(false);
                        soundFx.playSuccess();
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-pixel text-xs rounded border border-white"
                    >
                      YA, RESET SEKARANG
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-pixel text-xs rounded"
                    >
                      BATAL
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="py-2 px-3 bg-red-900/80 hover:bg-red-800 border border-red-400 rounded-lg font-pixel text-xs text-red-200 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESET KE SETELAN AWAL</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom Close Action */}
        <div className="mt-6 border-t border-[#ffd700]/30 pt-3 flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-[#800000] hover:bg-red-900 text-[#ffd700] border-2 border-[#ffd700] rounded-xl font-pixel text-xs shadow-md active:translate-y-0.5"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
