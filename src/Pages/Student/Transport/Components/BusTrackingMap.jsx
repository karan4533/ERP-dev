import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// ─── Route Data ────────────────────────────────────────────────────────────────
// Route: Pickup (Palanganatham) → Queen Mira International School, Kochadai
// Real road geometry (OSRM) — total ≈ 7.1 km / ~13 min drive
const ROUTE_COORDS = [
    [9.91143, 78.11755], // START — Pickup Point (Palanganatham)
    [9.91140, 78.11714],
    [9.91154, 78.11606],
    [9.91156, 78.11583],
    [9.91163, 78.11530],
    [9.91183, 78.11376],
    [9.91195, 78.11278],
    [9.91200, 78.11249],
    [9.91214, 78.11241],
    [9.91224, 78.11236],
    [9.91234, 78.11227],
    [9.91241, 78.11180],
    [9.91249, 78.11162],
    [9.91302, 78.11147],
    [9.91346, 78.11148],
    [9.91394, 78.11152],
    [9.91471, 78.11157],
    [9.91492, 78.11158],
    [9.91511, 78.11159],
    [9.91516, 78.11152],
    [9.91524, 78.11085],
    [9.91543, 78.11059],
    [9.91569, 78.11041],
    [9.91610, 78.11042],
    [9.91632, 78.11039],
    [9.91649, 78.11022],
    [9.91658, 78.10996],
    [9.91686, 78.10899],
    [9.91696, 78.10890],
    [9.91715, 78.10882],
    [9.91788, 78.10880],
    [9.91854, 78.10879],
    [9.91871, 78.10875],
    [9.91883, 78.10865],
    [9.91925, 78.10815],
    [9.91935, 78.10796],
    [9.91984, 78.10739],
    [9.92093, 78.10619],
    [9.92139, 78.10570],
    [9.92205, 78.10496],
    [9.92254, 78.10455],
    [9.92347, 78.10388],
    [9.92425, 78.10318],
    [9.92517, 78.10197],
    [9.92540, 78.10160],
    [9.92599, 78.10086],
    [9.92637, 78.10038],
    [9.92684, 78.09984],
    [9.92705, 78.09967],
    [9.92749, 78.09941],
    [9.92767, 78.09913],
    [9.92788, 78.09868],
    [9.92801, 78.09837],
    [9.92815, 78.09807],
    [9.92838, 78.09765],
    [9.92863, 78.09731],
    [9.92918, 78.09667],
    [9.92987, 78.09587],
    [9.93019, 78.09555],
    [9.93068, 78.09508],
    [9.93139, 78.09432],
    [9.93232, 78.09324],
    [9.93274, 78.09270],
    [9.93286, 78.09250],
    [9.93336, 78.09179],
    [9.93385, 78.09095],
    [9.93413, 78.09025],
    [9.93442, 78.08973],
    [9.93480, 78.08931],
    [9.93607, 78.08788],
    [9.93678, 78.08707],
    [9.93764, 78.08604],
    [9.93784, 78.08585],
    [9.93835, 78.08512],
    [9.93854, 78.08495],
    [9.93866, 78.08485],
    [9.93904, 78.08463],
    [9.93936, 78.08447],
    [9.93971, 78.08430],
    [9.94016, 78.08406],
    [9.94049, 78.08375],
    [9.94097, 78.08331],
    [9.94197, 78.08242],
    [9.94235, 78.08205],
    [9.94273, 78.08150],
    [9.94284, 78.08129],
    [9.94319, 78.08040],
    [9.94371, 78.07918],
    [9.94433, 78.07725],
    [9.94444, 78.07684],
    [9.94483, 78.07536],
    [9.94504, 78.07487],
    [9.94555, 78.07402],
    [9.94638, 78.07281],
    [9.94708, 78.07181],
    [9.94777, 78.07092],
    [9.94814, 78.07027],
    [9.94879, 78.06941],
    [9.94908, 78.06969], // END — Queen Mira International School
];

const BUS_INDEX = 54; // static demo position (~55% of route)
const START_POINT = ROUTE_COORDS[0];
const END_POINT = ROUTE_COORDS[ROUTE_COORDS.length - 1];
const BUS_POSITION = ROUTE_COORDS[BUS_INDEX];

// Static demo stats
const STATS = {
    progress: "~55%",
    distanceLeft: "3.2 km",
    eta: "~8 min",
    speed: "32 km/h",
};

// ─── Custom Leaflet Icons ──────────────────────────────────────────────────────
const makeStopIcon = (color, label) =>
    L.divIcon({
        className: "",
        html: `
      <div style="
        display:flex; flex-direction:column; align-items:center; gap:4px;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
      ">
        <div style="
          background:${color};
          width:16px; height:16px;
          border-radius:50%;
          border:3px solid white;
          box-shadow: 0 0 0 2px ${color};
        "></div>
        <div style="
          background:#0C1E5B;
          color:white;
          font-size:11px;
          font-weight:600;
          padding:3px 8px;
          border-radius:6px;
          white-space:nowrap;
          letter-spacing:0.3px;
        ">${label}</div>
      </div>`,
        iconSize: [0, 0],
        iconAnchor: [8, 8],
    });

const busIcon = L.divIcon({
    className: "",
    html: `
    <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
      <div style="
        background:#515DEF;
        border-radius:50%;
        width:44px; height:44px;
        display:flex; align-items:center; justify-content:center;
        border:3px solid white;
        box-shadow: 0 4px 16px rgba(81,93,239,0.55), 0 0 0 6px rgba(81,93,239,0.18);
        font-size:22px;
      ">🚌</div>
      <div style="
        background:#515DEF;
        color:white;
        font-size:11px;
        font-weight:700;
        padding:3px 10px;
        border-radius:20px;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        letter-spacing:0.5px;
      ">BUS-001</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [22, 22],
});

const startIcon = makeStopIcon("#22c55e", "📍 Pickup Point");
const endIcon = makeStopIcon("#f59e0b", "🏫 Queen Mira School");

// ─── Fit Bounds Helper ─────────────────────────────────────────────────────────
function FitBounds({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            map.fitBounds(coords, { padding: [50, 50] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BusTrackingMap() {
    const completedCoords = ROUTE_COORDS.slice(0, BUS_INDEX + 1); // already travelled
    const remainingCoords = ROUTE_COORDS.slice(BUS_INDEX);        // yet to travel

    return (
        <div className="flex flex-col">

            {/* ── Top Info Bar ── */}
            <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-b border-[#f2f4f7]">
                <div className="flex items-center gap-3">
                    <div className="bg-[#515DEF] p-2 rounded-xl">
                        <span className="text-white text-xl">🚌</span>
                    </div>
                    <div>
                        <p className="text-[#0C1E5B] font-semibold text-base leading-tight">Bus Route — Morning Pick-up</p>
                        <p className="text-[#667085] text-xs">Vehicle: TN 59 AB 1234 &nbsp;·&nbsp; Driver: Rajan M.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Driver call */}
                    <a
                        href="tel:+919999999999"
                        className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200 rounded-full px-3 py-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                        </svg>
                        <span className="text-emerald-700 text-xs font-semibold">Call Driver</span>
                    </a>

                    {/* Live badge */}
                    <div className="flex items-center gap-2 bg-[#EDEEF5] rounded-full px-3 py-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[#0C1E5B] text-xs font-semibold tracking-wide">LIVE</span>
                    </div>
                </div>
            </div>

            {/* ── Map ── */}
            {/* relative z-0 keeps Leaflet panes below the app header/sidebar */}
            <div className="relative z-0 h-[60vh] min-h-[420px]">
                <MapContainer
                    center={BUS_POSITION}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    <FitBounds coords={ROUTE_COORDS} />

                    {/* Completed route — solid brand blue */}
                    <Polyline
                        positions={completedCoords}
                        pathOptions={{ color: "#515DEF", weight: 5, opacity: 0.95 }}
                    />

                    {/* Remaining route — dashed grey */}
                    <Polyline
                        positions={remainingCoords}
                        pathOptions={{ color: "#94a3b8", weight: 4, opacity: 0.7, dashArray: "10 8" }}
                    />

                    {/* START marker */}
                    <Marker position={START_POINT} icon={startIcon}>
                        <Popup>
                            <div className="text-sm font-semibold">📍 Pickup Point</div>
                            <div className="text-xs text-gray-500 mt-1">Palanganatham, Madurai</div>
                            <div className="text-xs text-gray-500">Lat: {START_POINT[0].toFixed(4)}, Lng: {START_POINT[1].toFixed(4)}</div>
                        </Popup>
                    </Marker>

                    {/* END marker */}
                    <Marker position={END_POINT} icon={endIcon}>
                        <Popup>
                            <div className="text-sm font-semibold">🏫 Queen Mira International School</div>
                            <div className="text-xs text-gray-500 mt-1">Kochadai, Madurai — 625 019</div>
                            <div className="text-xs text-gray-500">Lat: {END_POINT[0].toFixed(4)}, Lng: {END_POINT[1].toFixed(4)}</div>
                        </Popup>
                    </Marker>

                    {/* BUS marker */}
                    <Marker position={BUS_POSITION} icon={busIcon}>
                        <Popup>
                            <div className="text-sm font-semibold">🚌 Bus-001 (Current Location)</div>
                            <div className="text-xs text-gray-500 mt-1">En route to Queen Mira School</div>
                            <div className="text-xs text-emerald-600 font-medium mt-1">ETA: {STATS.eta} · {STATS.distanceLeft} away</div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* ── Bottom Journey Panel ── */}
            <div className="px-4 py-4 border-t border-[#f2f4f7]">

                {/* Journey strip */}
                <div className="flex items-center gap-4 mb-4">
                    {/* Start */}
                    <div className="flex-1 min-w-0">
                        <p className="text-[#667085] text-[10px] uppercase tracking-widest mb-0.5">From</p>
                        <p className="text-[#0C1E5B] font-semibold text-sm truncate">Palanganatham</p>
                        <p className="text-[#667085] text-[11px]">Pickup Point</p>
                    </div>

                    {/* Progress line */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="w-28 sm:w-40 relative">
                            <div className="h-1.5 bg-[#EDEEF5] rounded-full w-full" />
                            <div className="h-1.5 bg-[#515DEF] rounded-full absolute top-0 left-0" style={{ width: "55%" }} />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-[#515DEF] border-2 border-white rounded-full w-4 h-4 shadow-md shadow-[#515DEF]/50"
                                style={{ left: "55%" }}
                            />
                        </div>
                        <p className="text-[#515DEF] text-[10px] font-semibold">{STATS.distanceLeft} left</p>
                    </div>

                    {/* End */}
                    <div className="flex-1 min-w-0 text-right">
                        <p className="text-[#667085] text-[10px] uppercase tracking-widest mb-0.5">To</p>
                        <p className="text-[#0C1E5B] font-semibold text-sm truncate">Queen Mira School</p>
                        <p className="text-[#667085] text-[11px]">Kochadai, Madurai</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#f2f4f7]">
                    <div className="text-center">
                        <p className="text-[#515DEF] font-bold text-base">{STATS.progress}</p>
                        <p className="text-[#667085] text-[11px]">Route Done</p>
                    </div>
                    <div className="text-center border-x border-[#f2f4f7]">
                        <p className="text-emerald-500 font-bold text-base">{STATS.eta}</p>
                        <p className="text-[#667085] text-[11px]">ETA</p>
                    </div>
                    <div className="text-center">
                        <p className="text-amber-500 font-bold text-base">{STATS.speed}</p>
                        <p className="text-[#667085] text-[11px]">Speed</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
