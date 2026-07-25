import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BaksoSpot, ExpressionId } from '../types';
import { EXPRESSIONS } from '../data/expressions';
import { soundFx } from '../utils/audio';

interface BaksoMapProps {
  spots: BaksoSpot[];
  selectedSpot: BaksoSpot | null;
  onSelectSpot: (spot: BaksoSpot) => void;
  onViewSpotDetail: (spot: BaksoSpot) => void;
  onDeleteSpot?: (id: string) => void;
  onMapClickLocation?: (lat: number, lng: number) => void;
  isAddingMode?: boolean;
  pendingCoords?: { lat: number; lng: number } | null;
  center?: [number, number];
  zoom?: number;
}

export const BaksoMap: React.FC<BaksoMapProps> = ({
  spots,
  selectedSpot,
  onSelectSpot,
  onViewSpotDetail,
  onDeleteSpot,
  onMapClickLocation,
  isAddingMode = false,
  pendingCoords,
  center = [-6.2088, 106.8456], // Default Jakarta
  zoom = 12,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const pendingMarkerRef = useRef<L.Marker | null>(null);

  // Helper to create HTML DivIcon for Character Head Map Markers
  const createCharacterHeadIcon = (expression: ExpressionId, rating: number, isSelected: boolean) => {
    const exprData = EXPRESSIONS[expression] || EXPRESSIONS.happy;

    const htmlContent = `
      <div class="relative group cursor-pointer transform transition-transform duration-200 ${
        isSelected ? 'scale-125 z-50 animate-bounce' : 'hover:scale-115 hover:z-40'
      }">
        <!-- Pixel Head Frame -->
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl border-3 border-amber-950 p-1 transition-all"
             style="background-color: ${exprData.bgHex}; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
          <div class="w-full h-full flex items-center justify-center text-xl select-none">
            ${exprData.emoji}
          </div>
        </div>
        
        <!-- Bowl Rating Badge -->
        <div class="absolute -top-2 -right-2 bg-amber-950 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500 flex items-center gap-0.5 shadow-md">
          🥣 ${rating}
        </div>

        <!-- Marker Pulse Ring if selected -->
        ${
          isSelected
            ? `<div class="absolute -inset-1 rounded-2xl bg-amber-400 opacity-40 animate-ping pointer-events-none"></div>`
            : ''
        }

        <!-- Marker Pin Point Bottom Indicator -->
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-950 mx-auto -mt-0.5"></div>
      </div>
    `;

    return L.divIcon({
      html: htmlContent,
      className: 'bakso-character-marker',
      iconSize: [44, 52],
      iconAnchor: [22, 52],
      popupAnchor: [0, -48],
    });
  };

  // Helper for pending new spot marker icon
  const createPendingIcon = () => {
    const htmlContent = `
      <div class="relative cursor-pointer animate-bounce flex flex-col items-center justify-center w-full">
        <div class="w-11 h-11 rounded-2xl bg-amber-500 border-3 border-amber-950 flex items-center justify-center text-xl shadow-2xl shrink-0">
          📍
        </div>
        <div class="bg-amber-950 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-amber-400 mt-1 text-center shadow-md whitespace-nowrap max-w-[120px]">
          LOKASI BARU
        </div>
      </div>
    `;
    return L.divIcon({
      html: htmlContent,
      className: 'pending-spot-marker',
      iconSize: [120, 70],
      iconAnchor: [60, 50],
    });
  };

  // Safe check for valid numerical coordinates
  const isValidCoord = (lat: any, lng: any): boolean => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    const numLat = Number(lat);
    const numLng = Number(lng);
    return !isNaN(numLat) && !isNaN(numLng) && isFinite(numLat) && isFinite(numLng);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean container if leftover leaflet state exists
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
      mapContainerRef.current.innerHTML = '';
    }

    if (!mapRef.current) {
      const safeLat = isValidCoord(center?.[0], center?.[1]) ? Number(center![0]) : -6.2088;
      const safeLng = isValidCoord(center?.[0], center?.[1]) ? Number(center![1]) : 106.8456;
      const initialCenter: L.LatLngTuple = [safeLat, safeLng];

      const safeZoom = typeof zoom === 'number' && !isNaN(zoom) && isFinite(zoom) ? zoom : 12;

      try {
        // Create Leaflet map instance
        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: safeZoom,
          zoomControl: false,
        });

        // Add Zoom Control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Tile layer suitable for retro game aesthetic
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
            subdomains: 'abcd',
          }
        ).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);
        markersGroupRef.current = markersGroup;
        mapRef.current = map;

        // Invalidate size on initial mount after frame layout
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 150);

        // Click event on map
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (onMapClickLocation && e && e.latlng && isValidCoord(e.latlng.lat, e.latlng.lng)) {
            soundFx.playClick();
            onMapClickLocation(Number(e.latlng.lat), Number(e.latlng.lng));
          }
        });
      } catch {
        // Fallback catch for map creation
      }
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.off();
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  // ResizeObserver to handle window/container resizing safely
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Update center when selected spot or center changes
  useEffect(() => {
    if (!mapRef.current || !center || !isValidCoord(center[0], center[1])) return;
    const map = mapRef.current;
    const safeLat = Number(center[0]);
    const safeLng = Number(center[1]);

    try {
      map.invalidateSize();
      const currentZoom = map.getZoom();
      const targetZoom = typeof currentZoom === 'number' && !isNaN(currentZoom) && isFinite(currentZoom)
        ? (currentZoom < 13 ? 14 : currentZoom)
        : 13;

      map.flyTo([safeLat, safeLng], targetZoom, {
        duration: 1.2,
      });
    } catch {
      try {
        map.setView([safeLat, safeLng], 12);
      } catch {
        // ignore fallback errors
      }
    }
  }, [center]);

  // Render Map Spot Markers
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    spots.forEach((spot) => {
      if (!spot || !isValidCoord(spot.lat, spot.lng)) return;

      const spotLat = Number(spot.lat);
      const spotLng = Number(spot.lng);

      const isSelected = selectedSpot?.id === spot.id;
      const icon = createCharacterHeadIcon(spot.characterExpression, spot.rating, isSelected);

      try {
        const marker = L.marker([spotLat, spotLng], { icon });

        // RPG Dialog Popup HTML Content
        const exprData = EXPRESSIONS[spot.characterExpression] || EXPRESSIONS.happy;
        const popupHtml = `
          <div class="p-3 bg-[#5d4037] text-[#fdf6e3] rounded-lg max-w-[280px]">
            <!-- Header Tag -->
            <div class="flex items-center justify-between gap-2 border-b border-[#ffd700]/40 pb-2 mb-2">
              <span class="text-[10px] font-bold font-pixel uppercase px-2 py-0.5 rounded bg-[#800000] text-[#ffd700] border border-[#ffd700]">
                ${exprData.emoji} ${exprData.name}
              </span>
              <span class="text-xs font-pixel text-[#ffd700]">
                🥣 ${spot.rating}/5
              </span>
            </div>

            <!-- Spot Title & Address -->
            <h4 class="text-base font-bold text-[#ffd700] leading-tight mb-1 font-pixel tracking-tight">
              ${spot.name}
            </h4>
            <p class="text-xs text-amber-100/90 mb-2 truncate">
              📍 ${spot.address}
            </p>

            <!-- Photo Thumbnail if present -->
            ${
              spot.photoUrl
                ? `<div class="w-full h-24 mb-2 rounded border-2 border-[#ffd700] overflow-hidden bg-black/40">
                     <img src="${spot.photoUrl}" alt="${spot.name}" class="w-full h-full object-cover" />
                   </div>`
                : ''
            }

            <!-- Review Snippet -->
            <p class="text-xs text-amber-100 italic bg-[#3d281d] p-2 rounded border border-[#ffd700]/30 mb-3 line-clamp-2">
              "${spot.review}"
            </p>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <button id="view-detail-btn-${spot.id}" class="flex-1 py-1.5 px-2 bg-[#800000] hover:bg-red-900 text-[#ffd700] border border-[#ffd700] font-pixel font-bold text-[10px] rounded transition-all active:translate-y-0.5 flex items-center justify-center gap-1 shadow">
                📜 Detail
              </button>
              ${
                onDeleteSpot
                  ? `<button id="delete-btn-${spot.id}" class="py-1.5 px-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-600 font-pixel font-bold text-[10px] rounded transition-all active:translate-y-0.5 flex items-center justify-center gap-1 shadow">
                      🗑️ Hapus
                     </button>`
                  : ''
              }
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml, {
          closeButton: true,
          autoPan: true,
        });

        marker.on('click', () => {
          soundFx.playOpenModal();
          onSelectSpot(spot);
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-detail-btn-${spot.id}`);
          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              soundFx.playClick();
              onViewSpotDetail(spot);
            };
          }
          const delBtn = document.getElementById(`delete-btn-${spot.id}`);
          if (delBtn) {
            delBtn.onclick = (e) => {
              e.stopPropagation();
              soundFx.playClick();
              if (onDeleteSpot) {
                onDeleteSpot(spot.id);
                map.closePopup();
              }
            };
          }
        });

        markersGroup.addLayer(marker);
      } catch {
        // Skip invalid marker creation safely
      }
    });

    // Handle Pending Marker for new spot placement
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    if (pendingCoords && isValidCoord(pendingCoords.lat, pendingCoords.lng)) {
      const pLat = Number(pendingCoords.lat);
      const pLng = Number(pendingCoords.lng);

      try {
        const pendingMarker = L.marker([pLat, pLng], {
          icon: createPendingIcon(),
        }).addTo(map);
        pendingMarkerRef.current = pendingMarker;

        map.invalidateSize();
        map.panTo([pLat, pLng]);
      } catch {
        // ignore fallback errors
      }
    }
  }, [spots, selectedSpot, pendingCoords]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Interactive HUD Banner overlay when adding location */}
      {isAddingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-[#800000] text-[#ffd700] border-3 border-[#ffd700] px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-[4px_4px_0px_#2d1b15] flex items-center gap-2 sm:gap-3 animate-pulse max-w-[90vw] text-center">
          <span className="text-lg sm:text-xl shrink-0">📍</span>
          <p className="text-[10px] sm:text-xs font-pixel leading-tight break-words">
            KLIK PADA PETA UNTUK MENENTUKAN LOKASI KEDAI BAKSO!
          </p>
        </div>
      )}
    </div>
  );
};
