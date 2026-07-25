import React, { useState } from 'react';
import { BaksoSpot, ExpressionId, PriceRange } from '../types';
import { EXPRESSION_LIST } from '../data/expressions';
import { CharacterAvatar } from './CharacterAvatar';
import { BaksoRating } from './BaksoRating';
import { soundFx } from '../utils/audio';
import { X, MapPin, Upload, Image as ImageIcon, Sparkles, AlertCircle, Navigation, Loader2 } from 'lucide-react';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSpot: (spot: Omit<BaksoSpot, 'id' | 'createdAt'>) => void;
  initialCoords?: { lat: number; lng: number } | null;
  onPickFromMap: () => void;
}

// Preset photos if user wants quick sample photo or hasn't uploaded one
const PRESET_PHOTOS = [
  { label: 'Bakso Urat & Kuah', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bakso Halus Spesial', url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bakso Malang Lengkap', url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bakso Bakar Saus', url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80' },
];

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  isOpen,
  onClose,
  onSaveSpot,
  initialCoords,
  onPickFromMap,
}) => {
  if (!isOpen) return null;

  const isValidCoord = (latVal: any, lngVal: any): boolean => {
    return typeof latVal === 'number' && typeof lngVal === 'number' && !isNaN(latVal) && !isNaN(lngVal) && isFinite(latVal) && isFinite(lngVal);
  };

  const defaultLat = isValidCoord(initialCoords?.lat, initialCoords?.lng) ? initialCoords!.lat : -6.2088;
  const defaultLng = isValidCoord(initialCoords?.lat, initialCoords?.lng) ? initialCoords!.lng : 106.8456;

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [rating, setRating] = useState<number>(5);
  const [expression, setExpression] = useState<ExpressionId>('star');
  const [flavorRating, setFlavorRating] = useState<number>(5);
  const [meatballRating, setMeatballRating] = useState<number>(5);
  const [sambalLevel, setSambalLevel] = useState<number>(3);
  const [priceRange, setPriceRange] = useState<PriceRange>('$$');
  const [atmosphere, setAtmosphere] = useState('Nyaman & Bersih');
  const [review, setReview] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_PHOTOS[0].url);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Bakso Urat', 'Pedas']);

  const [errorMsg, setErrorMsg] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');

  // Sync state if initialCoords changes
  React.useEffect(() => {
    if (initialCoords && isValidCoord(initialCoords.lat, initialCoords.lng)) {
      setLat(initialCoords.lat);
      setLng(initialCoords.lng);
    }
  }, [initialCoords]);

  // Handle GPS Location Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Fitur Geolocation GPS tidak didukung di browser ini.');
      return;
    }

    setIsGeolocating(true);
    setErrorMsg('');
    setGpsSuccessMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        if (isValidCoord(userLat, userLng)) {
          setLat(userLat);
          setLng(userLng);
          setIsGeolocating(false);
          setGpsSuccessMsg(`GPS Berhasil! Koordinat terdeteksi (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`);
          soundFx.playSuccess();

          if (!address) {
            setAddress(`Lokasi GPS Saya (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`);
          }
        } else {
          setIsGeolocating(false);
          setErrorMsg('Gagal mendapatkan koordinat GPS yang valid.');
        }
      },
      (err) => {
        setIsGeolocating(false);
        setErrorMsg(`Gagal mendeteksi lokasi GPS: ${err.message || 'Izin lokasi ditolak'}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Image Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Harap isi Nama Kedai Bakso!');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Harap isi Alamat Kedai!');
      return;
    }

    const safeLat = isValidCoord(lat, lng) ? Number(lat) : -6.2088;
    const safeLng = isValidCoord(lat, lng) ? Number(lng) : 106.8456;

    soundFx.playSuccess();

    onSaveSpot({
      name: name.trim(),
      address: address.trim(),
      lat: safeLat,
      lng: safeLng,
      rating,
      characterExpression: expression,
      flavorRating,
      meatballRating,
      sambalLevel,
      priceRange,
      atmosphere,
      review: review.trim() || 'Bakso mantap dan menggugah selera!',
      photoUrl,
      visitDate: new Date().toISOString().split('T')[0],
      tags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1e1726] border-4 border-amber-600 rounded-2xl shadow-2xl p-4 sm:p-6 text-amber-100 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header RPG Banner */}
        <div className="flex items-center justify-between border-b-2 border-amber-800/80 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-amber-950 border border-amber-600 rounded-xl shadow-md">
              🍲
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-pixel text-amber-300 tracking-tight">
                CATAT SPOT BAKSO BARU
              </h3>
              <p className="text-xs font-arcade text-amber-200/70">
                Lengkapi log petualangan bakso untuk mendapatkan XP & Badge!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-amber-950 hover:bg-red-950 border border-amber-700 text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border-2 border-red-500 rounded-xl flex items-center gap-2 text-xs text-red-200 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Basic Info & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#281f33] p-3.5 rounded-xl border border-amber-900/60">
            <div>
              <label className="block text-xs font-pixel text-amber-300 mb-1">
                NAMA KEDAI BAKSO *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Bakso Solo Samrat"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full bg-[#181320] border-2 border-amber-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-100 placeholder-amber-200/40 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-pixel text-amber-300 mb-1">
                ALAMAT / AREA *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Jl. Mangga Besar No.1D, Jakarta"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full bg-[#181320] border-2 border-amber-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-100 placeholder-amber-200/40 outline-none transition-colors"
              />
            </div>

            {/* Coordinates & Map Picker & GPS Triggers */}
            <div className="sm:col-span-2 space-y-2 bg-[#181320] p-3 rounded-xl border border-amber-900/80">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-arcade text-amber-200">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Koordinat: <strong className="text-amber-300">{lat.toFixed(4)}, {lng.toFixed(4)}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Detect GPS Button */}
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={isGeolocating}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold font-pixel text-[10px] rounded-lg border border-emerald-300 transition-all flex items-center justify-center gap-1.5 shadow-md active:translate-y-0.5"
                  >
                    {isGeolocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mencari GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>📍 Gunakan GPS Saya</span>
                      </>
                    )}
                  </button>

                  {/* Pick From Map Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onPickFromMap();
                    }}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-amber-950 font-bold font-pixel text-[10px] rounded-lg border border-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-md active:translate-y-0.5"
                  >
                    🎯 Pilih di Peta
                  </button>
                </div>
              </div>

              {gpsSuccessMsg && (
                <p className="text-[11px] text-emerald-300 font-bold bg-emerald-950/60 p-2 rounded border border-emerald-600">
                  {gpsSuccessMsg}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Character Expression Selector */}
          <div className="bg-[#281f33] p-3.5 rounded-xl border border-amber-900/60">
            <label className="block text-xs font-pixel text-amber-300 mb-1.5">
              EKSPRESI KARAKTER (PIN MAP MARKER)
            </label>
            <p className="text-xs font-arcade text-amber-200/70 mb-3">
              Pilih karakter avatar yang merepresentasikan kesanmu di tempat bakso ini:
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {EXPRESSION_LIST.map((expr) => {
                const isSelected = expression === expr.id;
                return (
                  <button
                    key={expr.id}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setExpression(expr.id);
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-amber-950 border-amber-400 shadow-lg scale-105 ring-2 ring-amber-400/50'
                        : 'bg-[#181320] border-amber-900/60 hover:border-amber-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <CharacterAvatar expression={expr.id} size="md" showFrame={false} />
                    <span className="text-[10px] font-bold text-amber-200 mt-1.5 text-center leading-tight">
                      {expr.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Detailed Ratings & Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#281f33] p-3.5 rounded-xl border border-amber-900/60">
            {/* Overall Bowl Rating */}
            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900">
              <BaksoRating
                rating={rating}
                onChange={setRating}
                interactive
                type="bowl"
                label="RATING UTAMA (MANGKUK BAKSO)"
              />
            </div>

            {/* Flavor / Broth Rating */}
            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900">
              <BaksoRating
                rating={flavorRating}
                onChange={setFlavorRating}
                interactive
                type="star"
                label="GURIH KUAH KALDU"
              />
            </div>

            {/* Meatball Texture Rating */}
            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900">
              <BaksoRating
                rating={meatballRating}
                onChange={setMeatballRating}
                interactive
                type="star"
                label="KUALITAS & TEKSTUR PENTOL"
              />
            </div>

            {/* Sambal Level */}
            <div className="bg-[#181320] p-3 rounded-xl border border-amber-900">
              <BaksoRating
                rating={sambalLevel}
                onChange={setSambalLevel}
                interactive
                type="chili"
                label="TINGKAT KEPEDASAN SAMBAL"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-pixel text-amber-300 mb-1">
                HARGA (PRICE RANGE)
              </label>
              <div className="flex items-center gap-2">
                {(['$', '$$', '$$$'] as PriceRange[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setPriceRange(p);
                    }}
                    className={`flex-1 py-2 font-bold font-pixel text-xs rounded-xl border-2 transition-all ${
                      priceRange === p
                        ? 'bg-amber-600 text-amber-950 border-amber-300 shadow-md'
                        : 'bg-[#181320] text-amber-200 border-amber-900 hover:border-amber-700'
                    }`}
                  >
                    {p} {p === '$' ? '(Murah)' : p === '$$' ? '(Sedang)' : '(Sultan)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Atmosphere */}
            <div>
              <label className="block text-xs font-pixel text-amber-300 mb-1">
                SUASANA TEMPAT
              </label>
              <input
                type="text"
                placeholder="Contoh: AC Dingin, Kipas Angin, Pinggir Jalan"
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                className="w-full bg-[#181320] border-2 border-amber-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-100 outline-none"
              />
            </div>
          </div>

          {/* Section 4: Detailed Review Box */}
          <div className="bg-[#281f33] p-3.5 rounded-xl border border-amber-900/60">
            <label className="block text-xs font-pixel text-amber-300 mb-1">
              REVIEW / CATATAN RASA & PENGALAMAN *
            </label>
            <textarea
              rows={3}
              placeholder="Ceritakan cita rasa kuah, keempukan pentol, sambal, serta kesan unik tempat ini..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full bg-[#181320] border-2 border-amber-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-amber-100 placeholder-amber-200/40 outline-none resize-none"
            />
          </div>

          {/* Section 5: Photo Upload & Presets */}
          <div className="bg-[#281f33] p-3.5 rounded-xl border border-amber-900/60">
            <label className="block text-xs font-pixel text-amber-300 mb-2">
              FOTO KUNJUNGAN (UPLOAD ATAU PILIH PRESET)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* File Upload Button */}
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-amber-700 hover:border-amber-400 rounded-xl bg-[#181320] cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="text-xs font-bold text-amber-200">Upload Foto Sendiri</span>
                <span className="text-[10px] text-amber-200/60">JPG, PNG, WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Photo Preview Container */}
              <div className="relative rounded-xl border-2 border-amber-800 overflow-hidden bg-black/60 h-28 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-amber-200/50 text-xs">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    Belum Ada Foto
                  </div>
                )}
              </div>
            </div>

            {/* Preset Image Options */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-pixel text-amber-300 shrink-0">Preset:</span>
              {PRESET_PHOTOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setPhotoUrl(preset.url);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border transition-all ${
                    photoUrl === preset.url
                      ? 'bg-amber-600 text-amber-950 border-amber-300'
                      : 'bg-[#181320] text-amber-300 border-amber-900 hover:border-amber-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Tags */}
          <div className="bg-[#281f33] p-3.5 rounded-xl border border-amber-900/60">
            <label className="block text-xs font-pixel text-amber-300 mb-1">
              TAGS & SPESIALISASI
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Tambah Tag (cth: Bakso Urat, Tetelan, Es Teller)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-[#181320] border-2 border-amber-800 rounded-xl p-2 text-xs text-amber-100 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-amber-200 font-bold text-xs rounded-xl border border-amber-600"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-amber-950 text-amber-300 text-[11px] rounded-lg border border-amber-700 flex items-center gap-1 font-arcade"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-amber-400 hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 font-pixel text-xs rounded-xl border border-amber-700"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-pixel font-bold text-xs rounded-xl border-2 border-amber-200 shadow-xl btn-retro flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              SIMPAN LOG BAKSO (+100 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
