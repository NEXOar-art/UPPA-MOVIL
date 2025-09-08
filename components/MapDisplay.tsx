
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { Coordinates, BusStop, Bus, Report, MicromobilityService, MicromobilityServiceType } from '../types';
import { REPORT_TYPE_ICONS, MICROMOBILITY_SERVICE_ICONS } from '../constants';

interface MapDisplayProps {
  center: Coordinates;
  zoom: number;
  userLocation: Coordinates | null;
  busStops: BusStop[];
  selectedBus: Bus | null;
  reports: Report[];
  micromobilityServices: MicromobilityService[];
  routeGeometry: any | null; // GeoJSON
  onMapError: (message: string) => void;
  onMapReady: () => void;
}

// Cleanup default Leaflet icon behavior
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createIcon = (iconClass: string, color: string, size: number = 28) => {
    return L.divIcon({
        html: `<i class="${iconClass}" style="font-size: ${size}px; color: ${color}; text-shadow: 0 0 6px ${color};"></i>`,
        className: 'leaflet-div-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
    });
};

const MapDisplay: React.FC<MapDisplayProps> = ({
  center, zoom, userLocation, busStops, selectedBus, reports, micromobilityServices, routeGeometry, onMapError, onMapReady
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const busStopLayerRef = useRef<L.LayerGroup | null>(null);
  const reportLayerRef = useRef<L.LayerGroup | null>(null);
  const micromobilityLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const heatLayerRef = useRef<any | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        try {
            const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            
            mapRef.current = map;
            busStopLayerRef.current = L.layerGroup().addTo(map);
            reportLayerRef.current = L.layerGroup().addTo(map);
            micromobilityLayerRef.current = L.layerGroup().addTo(map);
            heatLayerRef.current = (L as any).heatLayer([], { radius: 25, blur: 15, maxZoom: 12, gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'} }).addTo(map);
            
            onMapReady();
        } catch (error: any) {
            console.error("Leaflet map initialization error:", error);
            onMapError(error.message || "Failed to initialize map.");
        }
    }
  // FIX: This useEffect should only run once on mount. Map view changes are handled by a separate effect.
  // This prevents re-initializing the map unnecessarily.
  }, [onMapError, onMapReady]);

  // Update map view
  useEffect(() => {
    // Ensure map is initialized before trying to set view
    if (mapRef.current) {
        mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  // Update user location marker
  useEffect(() => {
    if (mapRef.current && userLocation) {
        const userIcon = createIcon('fas fa-crosshairs', 'var(--ps-cyan)', 32);
        if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapRef.current);
            userMarkerRef.current.bindPopup("<b>Tu Ubicación</b>").openPopup();
        } else {
            userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        }
    }
  }, [userLocation]);

  // Update bus stops layer
  useEffect(() => {
    busStopLayerRef.current?.clearLayers();
    if (mapRef.current && busStops) {
        const stopIcon = createIcon('fas fa-map-pin', 'rgba(255, 255, 255, 0.6)', 20);
        busStops.forEach(stop => {
            L.marker([stop.location.lat, stop.location.lng], { icon: stopIcon })
             .bindPopup(`<b>Parada:</b> ${stop.name}`)
             .addTo(busStopLayerRef.current!);
        });
    }
  }, [busStops]);

  // Update reports layer & heatmap
  useEffect(() => {
    // FIX: Add a call to invalidateSize() to ensure the map container has correct dimensions
    // before the heatmap layer attempts to draw on its canvas. This prevents the "source width is 0" error
    // that occurs when this effect runs before the map container is fully rendered with its final size.
    if (mapRef.current) {
        mapRef.current.invalidateSize();
    }
      
    reportLayerRef.current?.clearLayers();
    const heatData: L.LatLngTuple[] = [];
    if (mapRef.current && reports) {
        reports.forEach(report => {
          if(report.location) {
            const reportIcon = createIcon(REPORT_TYPE_ICONS[report.type] || 'fas fa-info-circle', 'var(--ps-magenta)', 24);
            L.marker([report.location.lat, report.location.lng], { icon: reportIcon })
             .bindPopup(`<b>${report.type}</b><br>${report.description}<br><small>Por: ${report.userName}</small>`)
             .addTo(reportLayerRef.current!);
            heatData.push([report.location.lat, report.location.lng]);
          }
        });
    }
    // Defensive check in case heatLayer is not yet initialized.
    if(heatLayerRef.current) {
        heatLayerRef.current.setLatLngs(heatData);
    }
  }, [reports]);

  // Update micromobility services
  useEffect(() => {
    micromobilityLayerRef.current?.clearLayers();
    if (mapRef.current && micromobilityServices) {
        micromobilityServices.forEach(service => {
            if (service.isActive && service.isAvailable && !service.isOccupied) {
                const isMoto = service.type === MicromobilityServiceType.Moto;
                const icon = createIcon(MICROMOBILITY_SERVICE_ICONS[service.type], isMoto ? 'var(--ps-lime)' : 'var(--ps-cyan)', 30);
                L.marker([service.location.lat, service.location.lng], { icon })
                 .bindPopup(`<b>${service.serviceName}</b><br>${service.providerName}<br>Rating: ${service.rating.toFixed(1)}/5`)
                 .addTo(micromobilityLayerRef.current!);
            }
        });
    }
  }, [micromobilityServices]);

  // Update route layer
  useEffect(() => {
    if (routeLayerRef.current) {
        mapRef.current?.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
    }
    if (mapRef.current && routeGeometry) {
        routeLayerRef.current = L.geoJSON(routeGeometry, {
            style: {
                color: 'var(--ps-cyan)',
                weight: 5,
                opacity: 0.8,
            }
        }).addTo(mapRef.current);
        mapRef.current.fitBounds(routeLayerRef.current.getBounds());
    }
  }, [routeGeometry]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default MapDisplay;
