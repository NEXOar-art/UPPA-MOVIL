



import React, { useEffect, useRef, useState } from 'react';
import { MapEvent, Bus, Coordinates, NearestBusStopInfo, BusStop, TravelMode } from '../types'; 
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MICROMOBILITY_SERVICE_ICONS } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { fetchRoute } from '../services/routesService';

// Ambient declarations for Google Maps API types
declare global {
  interface Window {
    googleMapsApiLoaded?: boolean;
    google?: typeof google; // Use typeof google for better typing
    initMapApp?: () => void;
    gm_authFailure?: () => void;
  }
  namespace google {
    namespace maps {
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      class Map {
        constructor(mapDiv: HTMLElement | null, opts?: any);
        panTo(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        getZoom(): number | undefined;
        fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
        [key: string]: any;
      }
      class Marker {
        constructor(opts?: any);
        setMap(map: Map | null): void;
        addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
        [key: string]: any;
        setPosition(pos: LatLng | LatLngLiteral): void;
        setAnimation(animation: Animation | null): void;
      }
      class InfoWindow {
        constructor(opts?: any);
        setContent(content: string | Node): void;
        open(map?: Map, anchor?: MVCObject | Marker): void;
        close(): void;
        [key: string]: any;
      }
       class Polyline {
        constructor(opts?: PolylineOptions);
        setMap(map: Map | null): void;
        [key: string]: any;
      }
      const SymbolPath: {
        CIRCLE: any;
        FORWARD_CLOSED_ARROW: any;
      };
      class Point {
        constructor(x: number, y: number);
        x: number;
        y: number;
      }
      class Size {
          constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
          width: number;
          height: number;
          equals(other: Size): boolean;
          toString(): string;
      }
      interface MapsEventListener {
          remove: () => void;
      }
      interface MVCObject {}
      enum Animation {
        BOUNCE,
        DROP,
      }

      namespace geometry {
        const encoding: {
            decodePath(encodedPath: string): LatLng[];
            encodePath(path: LatLng[] | MVCArray<LatLng>): string;
        };
      }

      class LatLngBounds {
          constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
          contains(latLng: LatLng | LatLngLiteral): boolean;
          equals(other: LatLngBounds | LatLngBoundsLiteral): boolean;
          extend(point: LatLng | LatLngLiteral): void;
          getCenter(): LatLng;
          getNorthEast(): LatLng;
          getSouthWest(): LatLng;
          intersects(other: LatLngBounds | LatLngBoundsLiteral): boolean;
          isEmpty(): boolean;
          toJSON(): LatLngBoundsLiteral;
          toSpan(): LatLng;
          toString(): string;
          toUrlValue(precision?: number): string;
          union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
      }
      interface LatLngBoundsLiteral { east: number; north: number; south: number; west: number; }
      interface Padding { top?: number; right?: number; bottom?: number; left?: number; }
      interface PolylineOptions {
          clickable?: boolean;
          draggable?: boolean;
          editable?: boolean;
          geodesic?: boolean;
          icons?: IconSequence[];
          map?: Map;
          path?: MVCArray<LatLng> | Array<LatLng | LatLngLiteral>;
          strokeColor?: string;
          strokeOpacity?: number;
          strokeWeight?: number;
          visible?: boolean;
          zIndex?: number;
      }
      interface IconSequence { fixedRotation?: boolean; icon?: any; offset?: string; repeat?: string; }
      class MVCArray<T> {}

      // Google Maps Places API specific types
      namespace places {
        class Autocomplete {
          constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
          getPlace(): PlaceResult;
          addListener(eventName: string, handler: () => void): google.maps.MapsEventListener;
        }

        interface AutocompleteOptions {
          types?: string[];
          componentRestrictions?: { country: string | string[] };
          bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
          fields?: string[];
          strictBounds?: boolean;
        }

        interface PlaceResult {
          address_components?: GeocoderAddressComponent[];
          adr_address?: string;
          formatted_address?: string;
          geometry?: PlaceGeometry;
          html_attributions?: string[];
          icon?: string;
          id?: string;
          name?: string;
          photos?: PlacePhoto[];
          place_id?: string;
          plus_code?: PlusCode;
          scope?: string;
          types?: string[];
          url?: string;
          utc_offset_minutes?: number;
          vicinity?: string;
        }

        interface PlaceGeometry {
          location: google.maps.LatLng;
          viewport?: google.maps.LatLngBounds;
        }

        interface GeocoderAddressComponent {
          long_name: string;
          short_name: string;
          types: string[];
        }

        interface PlacePhoto {
          height: number;
          html_attributions: string[];
          photo_reference: string;
          width: number;
          getUrl(opts: PhotoOptions): string;
        }
        interface PhotoOptions { maxHeight?: number; maxWidth?: number; }


        interface PlusCode {
          compound_code: string;
          global_code: string;
        }

      }
    }
  }
}

interface MapDisplayProps {
  events: MapEvent[]; 
  buses: Record<string, Bus>; 
  busStops: BusStop[];
  onEventClick?: (eventId: string, type: MapEvent['type']) => void; 
  onBusClick?: (busId: string) => void; 
  className?: string;
  isGoogleMapsApiLoaded: boolean;
  selectedBusLineId?: string | null;
  nearestBusStop: NearestBusStopInfo | null;
  routeOrigin: Coordinates | null; 
  routeDestination: Coordinates | null; 
  onRouteResult: (result: { duration?: string; distance?: string; error?: string }) => void; 
  userLocationFocus: Coordinates | null;
  travelMode: TravelMode;
}

function getContrastingTextColor(hexColor: string): string {
    if (!hexColor) return '#FFFFFF';
    const rgb = parseInt(hexColor.startsWith('#') ? hexColor.substring(1) : hexColor, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? '#FFFFFF' : '#000000';
}

function tailwindBgToHex(tailwindColor: string): string {
    const colors: Record<string, string> = {
        'bg-red-500': '#EF4444', 'text-red-500': '#EF4444',
        'bg-blue-500': '#3B82F6', 'text-blue-500': '#3B82F6',
        'bg-green-500': '#22C55E', 'text-green-500': '#22C55E',
        'bg-yellow-500': '#EAB308', 'text-yellow-500': '#EAB308',
        'bg-sky-500': '#0EA5E9', 'text-sky-500': '#0EA5E9',
        'bg-indigo-500': '#6366F1', 'text-indigo-500': '#6366F1',
        'bg-purple-500': '#A855F7', 'text-purple-500': '#A855F7',
        'bg-pink-500': '#EC4899', 'text-pink-500': '#EC4899',
        'bg-teal-500': '#14B8A6', 'text-teal-500': '#14B8A6',
    };
    return colors[tailwindColor] || '#718096'; // Default to gray
}

const createFaMarkerIconSvg = (
    faClassName: string, 
    color: string = '#FFD700', 
    isOccupied: boolean = false,
    hasGlow: boolean = false,
    ecoIcon: boolean = false
) => {
    const ocupadoStyle = isOccupied ? "opacity: 0.6; filter: grayscale(50%);" : "";
    const glowFilter = hasGlow ? `filter: drop-shadow(0 0 6px ${color}) drop-shadow(0 0 10px #fff);` : 'filter: drop-shadow(0 0 4px #000);';
    const ecoLeaf = ecoIcon ? `<i class='fas fa-leaf' style='font-size: 12px; color: #4ade80; position: absolute; top: 0px; right: 0px; text-shadow: 0 0 3px #000;'></i>` : '';

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <style>
              @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css");
            </style>
            <foreignObject width="40" height="40">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:28px; text-align:center; line-height:40px; position:relative; ${ocupadoStyle}">
                <i class='${faClassName}' style='color:${color}; ${glowFilter}'></i>
                ${ecoLeaf}
              </div>
            </foreignObject>
        </svg>`
    )}`;
};


const MapDisplay: React.FC<MapDisplayProps> = ({
  events,
  buses, 
  busStops,
  onEventClick,
  onBusClick, 
  className = '',
  isGoogleMapsApiLoaded,
  selectedBusLineId,
  nearestBusStop,
  routeOrigin,
  routeDestination,
  onRouteResult,
  userLocationFocus,
  travelMode,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  
  const markersRef = useRef<google.maps.Marker[]>([]);
  const nearestBusStopMarkerRef = useRef<google.maps.Marker | null>(null);
  const userFocusMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (isGoogleMapsApiLoaded && mapRef.current && !map && window.google?.maps) {
      const gMap = new window.google.maps.Map(mapRef.current!, {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [ 
            { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e88a2a" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#e88a2a" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#6ea88d" }] },
            { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
            { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
            { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#e88a2a" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
        ],
      });
      setMap(gMap);
      setInfoWindow(new window.google.maps.InfoWindow({ 
          content: '',
          pixelOffset: new google.maps.Size(0, -10)
        }));
    }
  }, [isGoogleMapsApiLoaded, map]);

  useEffect(() => {
    if (map && infoWindow && window.google?.maps) {
      markersRef.current.forEach(marker => marker.setMap(null)); 
      const newMarkers: google.maps.Marker[] = [];
      
      const shouldShowMarkers = !routeOrigin || !routeDestination;

      if(shouldShowMarkers) {
        events.forEach(event => {
          let markerIcon: any;
          let infoWindowContent = `<div class="p-2 bg-slate-800 text-white rounded-md shadow-lg max-w-xs" style="background:var(--ps-panel-bg); border:1px solid var(--ps-border);">
                                    <h4 class="text-md font-semibold text-blue-400 font-orbitron">${event.title}</h4>
                                    <p class="text-sm text-slate-300">${event.description || 'Sin descripción detallada.'}</p>
                                  </div>`;
          let zIndex = 1;
          let markerOpacity = 1.0;

          if (event.type === 'BUS_LOCATION' && event.busLineId) {
            const bus = buses[event.busLineId];
            const hexColor = bus ? tailwindBgToHex(bus.color) : '#CCCCCC';
            markerIcon = {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: hexColor,
              fillOpacity: 0.9,
              strokeColor: getContrastingTextColor(hexColor),
              strokeWeight: 1,
              scale: event.busLineId === selectedBusLineId ? 10 : 7,
            };
            zIndex = event.busLineId === selectedBusLineId ? 1001 : 1000;
            infoWindowContent = `<div class="p-3 bg-slate-800 text-white rounded-lg shadow-xl max-w-xs" style="background:var(--ps-panel-bg); border:1px solid var(--ps-border);">
                                  <h3 class="text-lg font-semibold mb-1 font-orbitron" style="color: ${hexColor};">${event.title}</h3>
                                  <p class="text-sm text-slate-300">${event.description}</p>
                                  ${selectedBusLineId === event.busLineId ? '<p class="text-xs text-blue-400 mt-1.5 font-semibold">Línea Seleccionada</p>' : ''}
                                </div>`;
          } else if (event.type === 'MICROMOBILITY_MOTO' || event.type === 'MICROMOBILITY_REMIS') {
              const iconClass = event.type === 'MICROMOBILITY_MOTO' ? MICROMOBILITY_SERVICE_ICONS.Moto : MICROMOBILITY_SERVICE_ICONS.Remis;
              const iconColor = event.type === 'MICROMOBILITY_MOTO' ? tailwindBgToHex('text-sky-500') : tailwindBgToHex('text-indigo-500');
              const hasGlow = (event.rating || 0) >= 4.5;
              const hasEcoIcon = (event.ecoScore || 0) >= 75;

              markerIcon = {
                url: createFaMarkerIconSvg(iconClass, iconColor, event.isOccupied, hasGlow, hasEcoIcon),
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20),
              };
              zIndex = event.isOccupied ? 490 : (hasGlow ? 501 : 500); 
              markerOpacity = event.isOccupied ? 0.7 : 1.0;
              const titleColorClass = event.type === 'MICROMOBILITY_MOTO' ? 'text-sky-300' : 'text-indigo-300';
              const vehicleInfo = event.vehicleModel && event.vehicleColor ? `<p class="text-sm text-gray-300 mb-1.5"><i class="fas fa-car-alt mr-1.5 opacity-75"></i> Vehículo: ${event.vehicleModel} - ${event.vehicleColor}</p>` : '';
              let contactOrOccupiedHtml = '';
              if (event.isOccupied) {
                  contactOrOccupiedHtml = `<div class="mt-2.5 text-center text-sm text-orange-300 bg-orange-700 bg-opacity-60 p-2 rounded-md border border-orange-600">
                                              <i class="fas fa-clock mr-1.5"></i>Servicio actualmente ocupado.
                                           </div>`;
              } else if (event.contactInfo) {
                  contactOrOccupiedHtml = `<a href="https://wa.me/${event.contactInfo.replace(/\D/g,'')}" target="_blank" rel="noopener noreferrer" 
                                             class="mt-2.5 block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-md text-sm text-center transition-colors">
                                             <i class="fab fa-whatsapp mr-1.5"></i> Contactar por WhatsApp
                                           </a>`;
              }
              const ratingInfo = event.rating ? `<span class="flex items-center text-yellow-400 text-xs"><i class="fas fa-star mr-1"></i>${event.rating.toFixed(1)}</span>` : '';
              const ecoInfo = hasEcoIcon ? `<span class="flex items-center text-green-400 text-xs" title="Eco-Score: ${event.ecoScore}"><i class="fas fa-leaf mr-1"></i>Eco</span>` : '';

              infoWindowContent = `<div class="p-3 bg-slate-800 text-white rounded-lg shadow-xl max-w-xs" style="background:var(--ps-panel-bg); border:1px solid var(--ps-border);">
                                    <div class="flex justify-between items-start">
                                      <h4 class="text-lg font-semibold ${titleColorClass} mb-1 flex items-center font-orbitron">
                                        <i class="${iconClass} mr-2 text-xl"></i>${event.title}
                                      </h4>
                                      <div class="flex space-x-2">${ratingInfo}${ecoInfo}</div>
                                    </div>
                                    ${vehicleInfo}
                                    <p class="text-xs text-gray-400 mb-1">${event.description || ''}</p>
                                    ${contactOrOccupiedHtml}
                                  </div>`;
          }
           else { // Generic report marker
             markerIcon = { 
                  path: window.google.maps.SymbolPath.CIRCLE, 
                  fillColor: tailwindBgToHex(event.color || 'bg-yellow-500'),
                  fillOpacity: 0.7,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 0.5,
                  scale: 5,
              };
            zIndex = 100;
          }

          const marker = new window.google.maps.Marker({
            position: event.location,
            map: map,
            title: event.title,
            icon: markerIcon,
            zIndex: zIndex,
            opacity: markerOpacity,
          });

          marker.addListener('click', () => {
            infoWindow.setContent(infoWindowContent);
            infoWindow.open(map, marker);
            if (onEventClick) onEventClick(event.id, event.type);
            if (event.type === 'BUS_LOCATION' && event.busLineId && onBusClick) {
              onBusClick(event.busLineId);
            }
          });
          newMarkers.push(marker);
        });
        
        // Render bus stops for selected line
        if (selectedBusLineId && busStops) {
            const stopIconUrl = createFaMarkerIconSvg('fas fa-sign', '#94a3b8'); // A neutral slate color
            const stopIcon = {
                url: stopIconUrl,
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12),
            };

            busStops
                .filter(stop => stop.busLineIds.includes(selectedBusLineId!))
                .forEach(stop => {
                    const stopMarker = new window.google.maps.Marker({
                        position: stop.location,
                        map: map,
                        title: stop.name,
                        icon: stopIcon,
                        zIndex: 90, // Below reports and buses
                    });

                    const infoWindowContent = `<div class="p-2 bg-slate-800 text-white rounded-md shadow-lg" style="background:var(--ps-panel-bg); border:1px solid var(--ps-border);">
                                                <h4 class="text-md font-semibold text-slate-300 flex items-center"><i class="fas fa-sign mr-2"></i>Parada</h4>
                                                <p class="text-sm text-slate-100">${stop.name}</p>
                                              </div>`;

                    stopMarker.addListener('click', () => {
                        infoWindow.setContent(infoWindowContent);
                        infoWindow.open(map, stopMarker);
                    });
                    newMarkers.push(stopMarker);
                });
        }
      }
      markersRef.current = newMarkers;
    }
  }, [map, events, infoWindow, onEventClick, onBusClick, selectedBusLineId, buses, routeOrigin, routeDestination, busStops]);


  useEffect(() => {
    if (!map || !window.google?.maps?.geometry?.encoding) {
      return;
    }

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (routeOrigin && routeDestination) {
      fetchRoute(routeOrigin, routeDestination, travelMode).then(result => {
        if (!map) return; // Map might have been unmounted

        if (result.polyline && result.duration && result.distance) {
          const decodedPath = window.google.maps.geometry.encoding.decodePath(result.polyline);
          
          let strokeColor = '#00FFFF'; // DRIVE (cyan)
          let strokeWeight = 6;
          let lineIcons: any[] | undefined = [{
              icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor },
              offset: '100%',
              repeat: '100px'
          }];

          if (travelMode === 'BICYCLE') {
              strokeColor = '#34D399'; // BICYCLE (green)
              strokeWeight = 5;
              lineIcons = [{
                  icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: '#FFFFFF' },
                  offset: '100%',
                  repeat: '100px'
              }];
          } else if (travelMode === 'WALK') {
              strokeColor = '#FBBF24'; // WALK (amber)
              strokeWeight = 5;
              // Dashed line for walking
              lineIcons = [{
                  icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4, strokeColor },
                  offset: '0',
                  repeat: '20px'
              }];
          }

          const newRoutePolyline = new window.google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: strokeColor,
            strokeOpacity: 0.9,
            strokeWeight: strokeWeight,
            zIndex: 50,
            icons: lineIcons
          });

          newRoutePolyline.setMap(map);
          routePolylineRef.current = newRoutePolyline;

          const bounds = new window.google.maps.LatLngBounds();
          decodedPath.forEach(point => bounds.extend(point));
          map.fitBounds(bounds, 50);

          onRouteResult({
            duration: result.duration,
            distance: result.distance,
          });

        } else {
          onRouteResult({ error: result.error || 'No se pudo calcular la ruta.' });
        }
      });
    }
  }, [routeOrigin, routeDestination, map, onRouteResult, travelMode]);


  // Effect to pan to selected bus
  useEffect(() => {
    if (!map) return;
    // Do not pan if a route is active
    if(routeOrigin && routeDestination) return;

    if (selectedBusLineId && buses[selectedBusLineId]?.currentLocation) {
        map.panTo(buses[selectedBusLineId].currentLocation!);
        map.setZoom(Math.max(map.getZoom() || DEFAULT_MAP_ZOOM, 14));
    }
  }, [map, selectedBusLineId, buses, routeOrigin, routeDestination]);

  // Effect to manage the nearest bus stop marker
  useEffect(() => {
    if (!map || !infoWindow || !window.google?.maps) return;
    
    // Do not show nearest stop marker if a route is active
    if(routeOrigin && routeDestination){
        if (nearestBusStopMarkerRef.current) {
            nearestBusStopMarkerRef.current.setMap(null);
            nearestBusStopMarkerRef.current = null;
        }
        return;
    }


    // Clear previous nearest stop marker
    if (nearestBusStopMarkerRef.current) {
      nearestBusStopMarkerRef.current.setMap(null);
      nearestBusStopMarkerRef.current = null;
    }

    if (nearestBusStop && selectedBusLineId && nearestBusStop.forBusLineId === selectedBusLineId) {
      const busForStop = buses[nearestBusStop.forBusLineId];
      const busName = busForStop ? busForStop.lineName : nearestBusStop.forBusLineId;
      const stopName = nearestBusStop.stop.name;

      const marker = new window.google.maps.Marker({
        position: nearestBusStop.stop.location,
        map: map,
        title: `Parada ${busName} (Más Cercana): ${stopName}`, // Tooltip on hover
        icon: {
          url: createFaMarkerIconSvg('fas fa-map-pin', tailwindBgToHex('bg-red-500'), false, false, false), // Red pin
          scaledSize: new window.google.maps.Size(36, 36),
          anchor: new window.google.maps.Point(18, 36), // Anchor at bottom center of pin for typical pin shape
        },
        zIndex: 1500, // Higher than bus/event markers
      });

      const content = `<div class="p-3 bg-slate-800 text-white rounded-lg shadow-xl max-w-xs" style="background:var(--ps-panel-bg); border:1px solid var(--ps-border);">
                         <h4 class="text-md font-semibold text-red-300 flex items-center font-orbitron">
                           <i class="fas fa-map-pin mr-2"></i>Parada Más Cercana
                         </h4>
                         <p class="text-sm text-gray-200 mt-1">Línea: ${busName}</p>
                         <p class="text-sm text-gray-300">Nombre: ${stopName}</p>
                       </div>`;

      marker.addListener('click', () => {
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
      nearestBusStopMarkerRef.current = marker;
    }
  }, [map, infoWindow, nearestBusStop, selectedBusLineId, buses, routeOrigin, routeDestination]);


  // Effect for User Location Focus
  useEffect(() => {
    if (!map || !window.google?.maps) return;
  
    if (userLocationFocus) {
      // Pan to location if not in route planning mode
      if (!routeOrigin && !routeDestination) {
        map.panTo(userLocationFocus);
        map.setZoom(Math.max(map.getZoom() || 14, 16));
      }
  
      // Create or update the marker
      if (userFocusMarkerRef.current) {
        userFocusMarkerRef.current.setPosition(userLocationFocus);
        userFocusMarkerRef.current.setMap(map);
      } else {
        userFocusMarkerRef.current = new window.google.maps.Marker({
          position: userLocationFocus,
          map: map,
          title: 'Tu Ubicación',
          icon: {
            url: createFaMarkerIconSvg('fas fa-street-view', '#00ffff', false, false, false), // Bright cyan
            scaledSize: new window.google.maps.Size(36, 36),
            anchor: new window.google.maps.Point(18, 18),
          },
          zIndex: 2000,
        });
      }
      // Apply a drop animation to grab attention
      userFocusMarkerRef.current.setAnimation(window.google.maps.Animation.DROP);
  
    } else {
      // Hide marker when focus is lost (userLocationFocus is null)
      if (userFocusMarkerRef.current) {
        userFocusMarkerRef.current.setMap(null);
      }
    }
  }, [map, userLocationFocus, routeOrigin, routeDestination]);

  useEffect(() => () => { // Cleanup infoWindow and markers on unmount
    if (infoWindow) infoWindow.close();
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    if (nearestBusStopMarkerRef.current) {
      nearestBusStopMarkerRef.current.setMap(null);
      nearestBusStopMarkerRef.current = null;
    }
    if (userFocusMarkerRef.current) {
      userFocusMarkerRef.current.setMap(null);
      userFocusMarkerRef.current = null;
    }
    if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
    }
  }, [infoWindow]);


  if (!isGoogleMapsApiLoaded) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-lg shadow-inner ${className}`}>
        <LoadingSpinner />
        <p className="mt-2 text-slate-400">Iniciando sistema de mapas...</p>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapDisplay;