import { ReportType, Bus, MicromobilityServiceType, Coordinates, BusStop, BusLineDetails } from './types';


export const API_KEY_ERROR_MESSAGE = "La variable de entorno API_KEY para Gemini no está configurada. Por favor, asegúrese de que esté configurada.";
// The API key for Google Maps services must be provided via an environment variable.
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; 
export const SUBE_URL = "https://tarjetasube.sube.gob.ar/SubeWeb/Webforms/Account/Views/login.aspx";
export const UPPA_MERCADO_PAGO_ALIAS = "uppa.colectivo.mp"; // Example Mercado Pago Alias for UppA
export const UPPA_CRYPTO_ADDRESS_EXAMPLE = "0x123abcDEF456GHI789jklMNO012pQrS345"; // Example Crypto Address
export const MAX_MICROMOBILITY_SERVICES_PER_PROVIDER = 10;


export const DEFAULT_USER_ID = "user_default_123";
export const DEFAULT_USER_NAME = "Invitado"; // Default name if needed, but login will override

// Approximate coordinates for Buenos Aires locations
const BA_OBELISCO = { lat: -34.6037, lng: -58.3816 };
const BA_PLAZA_DE_MAYO = { lat: -34.6083, lng: -58.3722 };
const BA_RECOLETA = { lat: -34.5880, lng: -58.3939 };
const BA_PALERMO_SOHO = { lat: -34.5895, lng: -58.4299 };
const BA_PLAZA_ITALIA = { lat: -34.5822, lng: -58.4230 };
const ZARATE_CENTRO = { lat: -34.0925, lng: -59.0260 };
const CAMPANA_PLAZA = { lat: -34.1670, lng: -58.9590 };

export const MOCK_BUS_LINES: Record<string, Bus> = {
  "LINEA_228CB": { id: "LINEA_228CB", lineName: "Línea 228CB", description: "Zarate-Campana", statusEvents: [], color: "bg-red-500", currentLocation: ZARATE_CENTRO },
  "LINEA_194": { id: "LINEA_194", lineName: "Línea 194", description: "Plaza Italia (CABA) - Zárate (x Campana)", statusEvents: [], color: "bg-blue-500", currentLocation: BA_PLAZA_ITALIA },
  "LINEA_152": { id: "LINEA_152", lineName: "Línea 152", description: "La Boca - Olivos (x Parque)", statusEvents: [], color: "bg-green-500", currentLocation: BA_RECOLETA },
  "LINEA_39": { id: "LINEA_39", lineName: "Línea 39", description: "Barracas - Chacarita", statusEvents: [], color: "bg-yellow-500", currentLocation: BA_PALERMO_SOHO },
};

export const BUS_LINE_ADDITIONAL_INFO: Record<string, BusLineDetails> = {
  "LINEA_228CB": {
    operator: "MOTSA",
    generalDescription: "La línea de colectivo 228 es operada por MOTSA y cubre varias rutas y horarios en la zona de Buenos Aires. La línea 228CB es una variante principal que se enfoca en el tramo Zárate - Campana y otros segmentos.",
    mainCoverage: "Pte. Saavedra - Est. Garín - Est. Benavidez - Campana - Zárate - Luján (Cobertura general de la línea 228)",
    segments: [
      { name: "Pte. Saavedra - Est. Garín", details: "X Paul Groussac - X Est. Benavidez" },
      { name: "Garín - Pte. Saavedra", details: "X R. Rojas" },
      { name: "Est. Garín - Pte. Saavedra", details: "X Est. Benavidez - X Paul Groussac" },
      { name: "Pte. Saavedra - Garín", details: "X R. Rojas" },
      { name: "Luján - Zárate" },
      { name: "Zárate - Campana" },
      { name: "Campana - Zárate" },
      { name: "Zárate - Luján" },
    ],
    variants: ["Línea 228D: Zárate - Luján (Otra variante conocida)"],
    specificRoutes: [
      {
        name: "Campana - Zárate",
        stopsCount: 80,
        approxDuration: "78 minutos",
        startPoint: "Vigalondo Y Bomberos Voluntarios (Campana)",
        endPoint: "Centro De Transferencia De Zárate (también parada para líneas 194, 204, 429 y combi)",
        keyStops: [
          "Vigalondo Y Bomberos Voluntarios", "A. Schinoni, 222", "Casaux Y Chapuis (Las Campanas)",
          "Escuela Técnica Roberto Rocca", "Colectora Sur Y Avenida Bellomo", "Colectora Sur Y Avenida Lavezzari",
          "Estación Campana", "San Martín Y Avenida Mitre", "Rp 6 Y Rn 12", "Avenida Lavalle Y Pellegrini",
          "Leandro Alem Y Rivadavia", "Florestano Andrade Atucha (varias paradas, ej., 173, 1387)",
          "Calle Juan José Paso (varias paradas, ej., 1185, 1750)", "Avenida Anta Y España",
          "Centro De Transferencia De Zárate",
        ],
      },
    ],
    operatingHours: {
      general: "Opera todos los días. Horario regular de operación general: 05:15 a 21:45.",
      weekdaysSaturdaysStart: "El servicio comienza a operar a las 05:15 los lunes, martes, miércoles, jueves, viernes y sábados.",
      sundaysEnd: "El servicio deja de operar a las 21:30 los domingos.",
      detailed: [
        { days: "Lunes a Viernes", operationHours: "05:15 - 21:45", frequency: "30 minutos" },
        { days: "Sábado", operationHours: "05:15 - 21:55", frequency: "40 minutos" },
        { days: "Domingo", operationHours: "05:30 - 21:30", frequency: "60 minutos" },
      ],
    },
  },
};


export const MOCK_BUS_STOPS_DATA: Record<string, BusStop[]> = {
  "LINEA_228CB": [
    { id: "stop_228cb_zarate_centro", name: "Zárate Centro (Mitre y Justa Lima)", location: ZARATE_CENTRO, busLineIds: ["LINEA_228CB", "LINEA_194"] },
    { id: "stop_228cb_estacion_zarate", name: "Estación Zárate", location: { lat: -34.0980, lng: -59.0275 }, busLineIds: ["LINEA_228CB"] },
    { id: "stop_228cb_campana_plaza", name: "Campana Plaza Principal", location: CAMPANA_PLAZA, busLineIds: ["LINEA_228CB", "LINEA_194"] },
    { id: "stop_228cb_campana_estacion", name: "Estación Campana", location: { lat: -34.1700, lng: -58.9550 }, busLineIds: ["LINEA_228CB"] },
  ],
  "LINEA_194": [
    { id: "stop_194_plaza_italia", name: "Plaza Italia (CABA)", location: BA_PLAZA_ITALIA, busLineIds: ["LINEA_194"] },
    { id: "stop_194_puente_saavedra", name: "Puente Saavedra", location: { lat: -34.5420, lng: -58.4800 }, busLineIds: ["LINEA_194"] },
    { id: "stop_194_campana_plaza", name: "Campana Plaza Principal", location: CAMPANA_PLAZA, busLineIds: ["LINEA_194", "LINEA_228CB"] },
    { id: "stop_194_zarate_terminal", name: "Zárate Terminal", location: { lat: -34.1005, lng: -59.0300 }, busLineIds: ["LINEA_194"] },
  ],
  "LINEA_152": [
    { id: "stop_152_la_boca", name: "La Boca (Caminito)", location: { lat: -34.6350, lng: -58.3640 }, busLineIds: ["LINEA_152"] },
    { id: "stop_152_retiro", name: "Retiro (Estación)", location: { lat: -34.5900, lng: -58.3730 }, busLineIds: ["LINEA_152"] },
    { id: "stop_152_olivos_puerto", name: "Olivos (Puerto)", location: { lat: -34.5050, lng: -58.4750 }, busLineIds: ["LINEA_152"] },
    { id: "stop_152_congreso", name: "Congreso", location: { lat: -34.6095, lng: -58.3920 }, busLineIds: ["LINEA_152"] },
  ],
  "LINEA_39": [
    { id: "stop_39_barracas_parque_lezama", name: "Barracas (Parque Lezama)", location: { lat: -34.6290, lng: -58.3700 }, busLineIds: ["LINEA_39"] },
    { id: "stop_39_constitucion", name: "Constitución (Plaza)", location: { lat: -34.6270, lng: -58.3810 }, busLineIds: ["LINEA_39"] },
    { id: "stop_39_chacarita_cementerio", name: "Chacarita (Cementerio)", location: { lat: -34.5920, lng: -58.4570 }, busLineIds: ["LINEA_39"] },
    { id: "stop_39_palermo_plaza_italia", name: "Palermo (Plaza Italia)", location: BA_PLAZA_ITALIA, busLineIds: ["LINEA_39"] },
  ],
};


export const DEFAULT_MAP_CENTER = BA_OBELISCO;
export const DEFAULT_MAP_ZOOM = 12;

export const REPORT_TYPE_ICONS: Record<ReportType, string> = {
  [ReportType.Delay]: "fas fa-clock",
  [ReportType.RouteChange]: "fas fa-route",
  [ReportType.Detour]: "fas fa-random",
  [ReportType.WaitTime]: "fas fa-hourglass-half",
  [ReportType.SafetyIncident]: "fas fa-shield-alt",
  [ReportType.MechanicalIssue]: "fas fa-bus-alt",
  [ReportType.ComfortIssue]: "fas fa-couch",
  [ReportType.PriceUpdate]: "fas fa-dollar-sign",
  [ReportType.LocationUpdate]: "fas fa-map-marker-alt",
  [ReportType.Crowded]: "fas fa-users",
  [ReportType.BusMoving]: "fas fa-bus",
  [ReportType.BusStopped]: "fas fa-traffic-light",
  [ReportType.Full]: "fas fa-user-friends", 
  [ReportType.VeryFull]: "fas fa-people-carry", 
  [ReportType.GoodService]: "fas fa-thumbs-up", 
  [ReportType.BadService]: "fas fa-thumbs-down", 
};

export const MICROMOBILITY_SERVICE_ICONS: Record<MicromobilityServiceType, string> = {
  [MicromobilityServiceType.Moto]: "fas fa-motorcycle",
  [MicromobilityServiceType.Remis]: "fas fa-car",
};

export const MICROMOBILITY_PRICING: Record<MicromobilityServiceType, Record<number, number>> = {
  [MicromobilityServiceType.Moto]: { 1: 2000, 2: 4000, 3: 6000, 4: 8000, 5: 10000 },
  [MicromobilityServiceType.Remis]: { 1: 5000, 2: 10000, 3: 15000, 4: 20000, 5: 25000 },
};

export const MICROMOBILITY_TERMS_CONTENT = {
  title: "Reglas y Condiciones del Servicio de Micromovilidad",
  sections: [
    {
      icon: "fa-users",
      title: "1. Acceso Universal",
      content: "Todos los miembros de la comunidad UppA tienen la oportunidad de registrarse y ofrecer servicios de micromovilidad (Moto o Remis)."
    },
    {
      icon: "fa-user-secret",
      title: "2. Contratación Directa y Anónima",
      content: "La contratación es un acuerdo directo entre el pasajero y el proveedor. UppA facilita el contacto a través de un número de WhatsApp que proporcionas. La plataforma no interviene en la comunicación, negociación ni en el viaje."
    },
    {
      icon: "fa-power-off",
      title: "3. Activación y Visibilidad",
      content: "Para que tu servicio sea visible en el mapa para los pasajeros, debes activarlo realizando el pago de una entrada. Tu servicio no será público hasta que la activación sea confirmada."
    },
    {
      icon: "fa-coins",
      title: "4. Tarifas de Publicación (Entradas)",
      content: "La entrada mantiene tu servicio visible en el mapa por un tiempo determinado. Puedes elegir la duración que prefieras. Una vez finalizado el tiempo, deberás abonar una nueva entrada para seguir apareciendo. Los costos se deducirán de tus Fichas."
    },
    {
      icon: "fa-trophy",
      title: "5. Sistema de Ranking",
      content: "UppA implementará un sistema de ranking para proveedores. Los proveedores con mejores calificaciones y más viajes completados tendrán mayor visibilidad y prestigio en la plataforma."
    },
    {
      icon: "fa-shield-alt",
      title: "6. Descargo de Responsabilidad",
      content: "UppA actúa únicamente como un nexo tecnológico entre usuarios. No nos responsabilizamos por ningún tipo de incidente, desacuerdo o problema que pueda surgir antes, durante o después del servicio. La seguridad, el estado del vehículo y el cumplimiento de las normativas locales son responsabilidad exclusiva del proveedor del servicio."
    }
  ],
  conclusion: "Al registrar tu servicio, confirmas que has leído, entendido y aceptado estas condiciones."
};


export const CHAT_EMOJIS: { emoji: string; description: string; type?: ReportType }[] = [
  { emoji: "🚌💨", description: "Colectivo en movimiento" },
  { emoji: "⚠️", description: "Alerta/Problema General" },
  { emoji: "⏰", description: "Reportar Demora", type: ReportType.Delay },
  { emoji: "🛑", description: "Colectivo Detenido", type: ReportType.BusStopped },
  { emoji: "🚦", description: "Mucho tráfico" },
  { emoji: "🛠️", description: "Reportar Falla Mecánica", type: ReportType.MechanicalIssue },
  { emoji: "🚨", description: "Reportar Incidente de Seguridad", type: ReportType.SafetyIncident },
  { emoji: " overcrowded", description: "Reportar Aglomeración", type: ReportType.Crowded}, 
  { emoji: "👍", description: "Todo bien / OK" },
  { emoji: "👎", description: "Algo no va bien" },
  { emoji: "👋", description: "Hola!" },
  { emoji: "❓", description: "Tengo una pregunta" },
];

export const REPORT_FORM_EMOJIS: { emoji: string; description: string }[] = [
  { emoji: "👍", description: "Pulgar arriba" },
  { emoji: "👎", description: "Pulgar abajo" },
  { emoji: "😊", description: "Contento" },
  { emoji: "😠", description: "Enojado" },
  { emoji: "✅", description: "Confirmado / OK" },
  { emoji: "❌", description: "Cancelado / No" },
  { emoji: "🚌", description: "Autobús" },
  { emoji: "🧍", description: "Persona esperando" },
  { emoji: "⏰", description: "Reloj / Demora" },
  { emoji: "⚠️", description: "Advertencia / Problema" },
  { emoji: "💰", description: "Dinero / Precio" },
  { emoji: "📍", description: "Ubicación" },
  { emoji: "🛠️", description: "Herramienta / Falla" },
  { emoji: "🧼", description: "Limpieza" },
  { emoji: "💨", description: "Rápido / Movimiento" },
];


export const MICROMOBILITY_CHAT_EMOJIS: { emoji: string; description: string }[] = [
  { emoji: "🏍️💨", description: "Moto rápida" },
  { emoji: "🚗💨", description: "Remis en camino" },
  { emoji: "📍", description: "Compartiendo ubicación" },
  { emoji: "👍", description: "Servicio OK" },
  { emoji: "👎", description: "Problemas con servicio" },
  { emoji: "💸", description: "Consultando precio" },
  { emoji: "🗺️", description: "Info de zona" },
  { emoji: "🤔", description: "Pregunta general" },
  { emoji: "👋", description: "Saludo" },
  { emoji: "✅", description: "Confirmado" },
];

export const CHAT_ACTION_ICONS = {
  emoji: "fas fa-smile",
  gif: "fas fa-gift", 
  image: "fas fa-image",
  poll: "fas fa-poll-h",
  location: "fas fa-map-marker-alt",
  ai_draft: "fas fa-magic",
  calculator: "fas fa-calculator",
  sube: "fas fa-credit-card",
};

export const CONTACTS_INFO_CAMPANA_ZARATE = `
Teléfonos y Direcciones de Interés - Campana y Zárate:

**EMERGENCIAS:**
- Policía: 911
- Bomberos (Campana): 100 / (03489) 422222
- Bomberos (Zárate): 100 / (03487) 422222
- Defensa Civil (Campana): 103 / (03489) 433719
- Defensa Civil (Zárate): 103 / (03487) 437651

**MUNICIPALIDADES:**
- Municipalidad de Campana:
  - Dirección: Av. Varela 750, Campana.
  - Teléfono: (03489) 407400
- Municipalidad de Zárate:
  - Dirección: Rivadavia 751, Zárate.
  - Teléfono: (03487) 443700

**TERMINAL DE ÓMNIBUS:**
- Terminal de Ómnibus de Campana:
  - Dirección: Alberdi y Av. Varela, Campana.
  - Teléfono: (03489) 432720
`;


export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
export const GEMINI_CHAT_DRAFT_MODEL = 'gemini-2.5-flash';