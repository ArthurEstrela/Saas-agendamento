import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';

// Corrige o problema do ícone padrão do Leaflet no React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface LocationPickerProps {
  position: { lat: number; lng: number };
  onPositionChange: (position: { lat: number; lng: number }) => void;
}

// Componente interno para recentralizar o mapa quando a posição muda
function ChangeView({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Componente interno para lidar com o marcador arrastável e cliques no mapa
function DraggableMarker({ position, onPositionChange }: LocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<LatLngExpression>(position);
  const markerRef = useRef(null);

  // Event handler para quando o marcador é arrastado
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          // @ts-ignore
          const newPos = marker.getLatLng();
          onPositionChange(newPos);
        }
      },
    }),
    [onPositionChange],
  );

  // Hook para lidar com cliques no mapa, movendo o marcador para o local do clique
  useMapEvents({
    click(e: LeafletMouseEvent) {
        setMarkerPosition(e.latlng);
        onPositionChange(e.latlng);
    }
  });

  // Atualiza a posição do marcador se a prop externa mudar
  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={markerPosition}
      ref={markerRef}>
    </Marker>
  );
}


const LocationPicker: React.FC<LocationPickerProps> = ({ position, onPositionChange }) => {
  // Converte a posição para o formato que o Leaflet espera
  const leafletPosition: LatLngExpression = [position.lat, position.lng];

  return (
    <div className="mt-4 h-80 w-full rounded-lg overflow-hidden border-2 border-gray-600 z-0">
        <MapContainer center={leafletPosition} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={leafletPosition} zoom={16} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={position} onPositionChange={onPositionChange} />
        </MapContainer>
    </div>
  );
};

export default LocationPicker;
