/**
 * StructureX frontend controller.
 */

const API = "/api";
const DEFAULT_MAP_KEY = "e6jRUxTkKH6UOJQnLqvl";
const DETAILED_STYLE_URL = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${DEFAULT_MAP_KEY}`;
const PLOTLY_URL = "https://cdn.plot.ly/plotly-2.29.1.min.js";
const DEFAULT_VIEW = {
    center: [77.5946, 12.9716],
    zoom: 14.2,
    pitch: 48,
    bearing: -22,
};
const FALLBACK_LOCATIONS = {
    LOC_001: { label: "Mumbai Bridge A", center: [72.8777, 19.076] },
    LOC_002: { label: "Delhi Pipeline B", center: [77.209, 28.6139] },
    LOC_003: { label: "Chennai Building C", center: [80.2707, 13.0827] },
    LOC_004: { label: "Kolkata Bridge D", center: [88.3639, 22.5726] },
    LOC_005: { label: "Bangalore Pipeline E", center: [77.5946, 12.9716] },
};
const THEME = {
    safe: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
    accent: "#3b82f6",
    grid: "rgba(255, 255, 255, 0.08)",
    text: "#c8d6e5",
    muted: "#5a6e84",
};
const SATELLITE_STATUS_HELP = {
    nominal: {
        label: "Normal",
        text: "Healthy link, low packet loss, and stable telemetry.",
    },
    warning: {
        label: "Watch",
        text: "Some delay, packet loss, or anomaly pressure needs attention.",
    },
    critical: {
        label: "Critical",
        text: "Degraded satellite link. Treat the data stream as urgent.",
    },
};
const TRAFFIC_LANE_LABELS = [
    "L6 Backup",
    "L5 User",
    "L4 Weather",
    "L3 AI scan",
    "L2 Sensor",
    "L1 Command",
];
const SELECTED_BUILDING_COLOR = "#4f8cff";
const GEOCODER_TYPES = [
    "country",
    "region",
    "subregion",
    "county",
    "municipality",
    "municipal_district",
    "locality",
    "neighbourhood",
    "place",
    "postal_code",
    "address",
    "poi",
].join(",");
const INDIA_ADMIN_AREAS = [
    ["Andhra Pradesh", "State of India", 80.9462, 15.9129],
    ["Arunachal Pradesh", "State of India", 94.7278, 28.2180],
    ["Assam", "State of India", 92.9376, 26.2006],
    ["Bihar", "State of India", 85.3131, 25.0961],
    ["Chhattisgarh", "State of India", 81.8661, 21.2787],
    ["Goa", "State of India", 74.1240, 15.2993],
    ["Gujarat", "State of India", 71.1924, 22.2587],
    ["Haryana", "State of India", 76.0856, 29.0588],
    ["Himachal Pradesh", "State of India", 77.1734, 31.1048],
    ["Jharkhand", "State of India", 85.2799, 23.6102],
    ["Karnataka", "State of India", 75.7139, 15.3173],
    ["Kerala", "State of India", 76.2711, 10.8505],
    ["Madhya Pradesh", "State of India", 78.6569, 22.9734],
    ["Maharashtra", "State of India", 75.7139, 19.7515],
    ["Manipur", "State of India", 93.9063, 24.6637],
    ["Meghalaya", "State of India", 91.3662, 25.4670],
    ["Mizoram", "State of India", 92.9376, 23.1645],
    ["Nagaland", "State of India", 94.5624, 26.1584],
    ["Odisha", "State of India", 85.0985, 20.9517],
    ["Punjab", "State of India", 75.3412, 31.1471],
    ["Rajasthan", "State of India", 74.2179, 27.0238],
    ["Sikkim", "State of India", 88.5122, 27.5330],
    ["Tamil Nadu", "State of India", 78.6569, 11.1271],
    ["Telangana", "State of India", 79.0193, 18.1124],
    ["Tripura", "State of India", 91.9882, 23.9408],
    ["Uttar Pradesh", "State of India", 80.9462, 26.8467],
    ["Uttarakhand", "State of India", 79.0193, 30.0668],
    ["West Bengal", "State of India", 87.8550, 22.9868],
    ["Delhi", "National capital territory", 77.1025, 28.7041],
    ["Jammu and Kashmir", "Union territory of India", 76.5762, 33.7782],
    ["Ladakh", "Union territory of India", 77.5619, 34.2268],
    ["Puducherry", "Union territory of India", 79.8083, 11.9416],
    ["Chandigarh", "Union territory of India", 76.7794, 30.7333],
    ["Andaman and Nicobar Islands", "Union territory of India", 92.6586, 11.7401],
    ["Lakshadweep", "Union territory of India", 72.1833, 10.5667],
    ["Dadra and Nagar Haveli and Daman and Diu", "Union territory of India", 72.8328, 20.3974],
].map(([text, type, lng, lat]) => ({
    id: `india-admin-${String(text).toLowerCase().replaceAll(" ", "-")}`,
    text,
    place_name: `${text}, ${type}`,
    center: [lng, lat],
    properties: { source: "India admin", class: "administrative", type },
}));
const WEATHER_CODE_LABELS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
};
const CAPABILITY_SECTIONS = [
    {
        category: "Category 1",
        title: "Expanded Hazard Layers",
        icon: "fa-triangle-exclamation",
        summary: "Multi-hazard situational awareness and cascading hazard overlays beyond earthquakes.",
        features: [
            {
                id: "01",
                title: "Multi-Hazard Integration",
                bullets: [
                    "Flood / storm surge streams: river gauges, rainfall radar, sea-level and levee stress watch.",
                    "Wildfire layers: fire perimeters, wind direction, vegetation dryness, gas-leak ignition risk.",
                    "Landslide, liquefaction, tsunami, and extreme heat / cold overlays linked to soil moisture and shaking intensity.",
                ],
            },
            {
                id: "02",
                title: "Cascading Failure Simulation",
                bullets: [
                    "Network dependency mapping for power, water, transport, hospitals, data centers, and emergency services.",
                    "Domino-effect prediction: route severance, emergency isolation, shelter cutoffs, and downstream infrastructure collapse.",
                ],
            },
        ],
    },
    {
        category: "Category 2",
        title: "Advanced Sensing & Monitoring",
        icon: "fa-satellite-dish",
        summary: "Next-generation sensing layers combining orbital, fiber, mobile, and robotic inspection intelligence.",
        features: [
            {
                id: "04",
                title: "Fiber Optic SHM",
                bullets: [
                    "DAS for ground motion, traffic loads, and pipeline leak signatures using telecom fiber.",
                    "DTS for tunnels, bridges, cables, fire hotspots, and coolant-failure detection.",
                ],
            },
            {
                id: "05",
                title: "Crowdsourced & Mobile Data",
                bullets: [
                    "Smartphone accelerometer aggregation for dense shake maps where seismic stations are sparse.",
                    "NLP pipelines for social media, citizen apps, and first-report detection of shaking, damage, and gas smells.",
                ],
            },
            {
                id: "06",
                title: "Drone & Robotic Inspection",
                bullets: [
                    "Automated dispatch of drones to high-risk bridges, towers, and corridors immediately after events.",
                    "Onboard computer vision for cracks, spalling, leaning, debris, and thermal anomalies in real time.",
                ],
            },
        ],
    },
    {
        category: "Category 3",
        title: "Risk & Decision Intelligence",
        icon: "fa-brain",
        summary: "Decision support focused on what to do, in what order, and with which resources.",
        features: [
            {
                id: "07",
                title: "Population & Occupancy Dynamics",
                bullets: [
                    "Real-time occupancy via mobility or access systems for vulnerable buildings at the moment of impact.",
                    "Critical facility registry for hospitals, shelters, police, fire, data centers, and chemical plants.",
                ],
            },
            {
                id: "08",
                title: "Dynamic Evacuation & Route Planning",
                bullets: [
                    "Safe route calculation using bridge status, debris, flooding, fire perimeters, and congestion.",
                    "Shelter suitability scoring based on structure safety plus power and water utility availability.",
                ],
            },
            {
                id: "09",
                title: "Economic & Insurance Impact",
                bullets: [
                    "Real-time insured and uninsured loss estimation integrated with catastrophe risk models.",
                    "Claim automation packages with asset health history and damage probability pre-filled for rapid recovery.",
                ],
            },
            {
                id: "10",
                title: "Resource Allocation & Logistics",
                bullets: [
                    "Live inventory of generators, sandbags, medical supplies, repair material, and emergency depots.",
                    "Optimized dispatch recommendations based on priority, travel time, crew capability, and traffic.",
                ],
            },
        ],
    },
    {
        category: "Category 4",
        title: "AI & Machine Learning",
        icon: "fa-robot",
        summary: "Self-improving models, automated briefings, and predictive risk forecasting.",
        features: [
            {
                id: "11",
                title: "Self-Learning Vulnerability Models",
                bullets: [
                    "Post-event feedback loops for fragility calibration, retrofit effectiveness, and unexpected failure patterns.",
                    "Transfer learning across similar asset classes and regions after major events.",
                ],
            },
            {
                id: "12",
                title: "Generative AI Emergency Response",
                bullets: [
                    "Automated PDF / HTML emergency action plans with maps, affected assets, actions, and contact lists.",
                    "Executive natural-language briefings summarizing event severity, inspections, and evacuation posture.",
                ],
            },
            {
                id: "13",
                title: "Predictive Seismic Risk Forecasting",
                bullets: [
                    "24-72 hour probabilistic forecasting from seismic swarms, foreshocks, seasonal soil state, and asset health trends.",
                    "Dynamic risk uplift for already degraded assets before the main event occurs.",
                ],
            },
        ],
    },
    {
        category: "Category 5",
        title: "Resilience Planning",
        icon: "fa-city",
        summary: "Long-horizon adaptation, retrofit prioritization, and code-driven resilience planning.",
        features: [
            {
                id: "14",
                title: "Scenario Planning & Stress Testing",
                bullets: [
                    "What-if simulation for hypothetical earthquakes, downtown fault scenarios, and pre-computed cascade outcomes.",
                    "Planner-facing retrofitting and mitigation comparisons before an event happens.",
                ],
            },
            {
                id: "15",
                title: "Retrofit Prioritization Engine",
                bullets: [
                    "Cost-benefit scoring across retrofit cost, replacement cost, life safety impact, and return on resilience.",
                    "Prioritization of low-cost / high-consequence assets for fast resilience gains.",
                ],
            },
            {
                id: "16",
                title: "Building Code Compliance",
                bullets: [
                    "Code-gap analysis against current seismic requirements with non-compliant asset flagging.",
                    "Permit integration so retrofit progress updates vulnerability scores automatically.",
                ],
            },
            {
                id: "17",
                title: "Climate Adaptation Integration",
                bullets: [
                    "Long-term hazard trends for sea-level rise, storm intensity, drought-driven subsidence, and chronic heat stress.",
                    "Future-state vulnerability modeling for assets that are safe today but not in 10-20 years.",
                ],
            },
        ],
    },
    {
        category: "Category 6",
        title: "User Experience & Accessibility",
        icon: "fa-users-viewfinder",
        summary: "Different views for executives, responders, engineers, and citizens.",
        features: [
            {
                id: "18",
                title: "Role-Based Dashboards",
                bullets: [
                    "Executive dashboard: city KPIs, heatmap, funding and impact exposure.",
                    "Emergency manager dashboard: event response, evacuation zones, and resource tracking.",
                    "Engineer dashboard and public portal: asset diagnostics, inspection workflows, shelters, and safety guidance.",
                ],
            },
        ],
    },
];

const state = {
    map: null,
    mapReady: false,
    mapFailed: false,
    mapMarker: null,
    activeBuildingRequestId: 0,
    selectedBuildingKey: null,
    geocodeTimer: null,
    selectedFile: null,
    analysisData: null,
    selectedBuilding: null,
    recentBuildings: [],
    aiMode: "normal",
    activeChart: "vibration",
    activeBottomTab: "charts",
    activeRightTab: "overview",
    rightPanelCollapsed: false,
    rightTabTrayExpanded: false,
    leftPanelCollapsed: false,
    satelliteBlueprints: [],
    satellites: [],
    selectedSatelliteId: null,
    satelliteInterval: null,
    telemetrySeries: {
        labels: [],
        satelliteHealth: [],
        networkHealth: [],
        trafficFlow: [],
    },
    activeHeaderView: "dashboard",
    bottomExpanded: true,
    timelinePlaying: false,
    timelineInterval: null,
    latestSearchResults: [],
    activeSearchIndex: -1,
    mapEnhancementsApplied: false,
    buildingInteractionBound: false,
    buildingSourceName: null,
    buildingSourceLayer: "building",
    selectedBuildingFeatureIds: [],
    userLocation: null,
    locationPromptVisible: false,
    weatherTarget: null,
    weatherData: null,
    weatherLoading: false,
    weatherInterval: null,
    activeWeatherRequestId: 0,
    resilienceData: null,
    resilienceLoading: false,
    resilienceRole: "executive",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let plotlyPromise = null;
const plotlyRenderQueue = new Map();

function loadPlotly() {
    if (window.Plotly) {
        return Promise.resolve(window.Plotly);
    }
    if (plotlyPromise) {
        return plotlyPromise;
    }

    plotlyPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = PLOTLY_URL;
        script.async = true;
        script.onload = () => resolve(window.Plotly);
        script.onerror = () => reject(new Error("Plotly failed to load"));
        document.head.appendChild(script);
    });

    return plotlyPromise;
}

function withPlotly(key, callback) {
    if (window.Plotly) {
        return true;
    }

    plotlyRenderQueue.set(key, callback);
    loadPlotly()
        .then(() => {
            const callbacks = Array.from(plotlyRenderQueue.values());
            plotlyRenderQueue.clear();
            callbacks.forEach((queuedCallback) => queuedCallback());
        })
        .catch((error) => console.warn(error.message));

    return false;
}

function warmPlotly() {
    const warm = () => {
        loadPlotly()
            .then(() => {
                renderSatelliteCharts();
                renderActiveChart();
                if (state.weatherData) {
                    renderWeatherPanel();
                }
                requestPlotResize();
            })
            .catch((error) => console.warn(error.message));
    };

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warm, { timeout: 3500 });
    } else {
        window.setTimeout(warm, 1600);
    }
}

function init() {
    initMap();
    initUpload();
    initSliders();
    initBottomPanel();
    initLeftPanel();
    initRightPanel();
    initSatelliteTelemetry();
    initWeatherPanel();
    initPlaceSearch();
    initUserLocationPrompt();
    initAIMode();
    initAlert();
    initDetailPanel();
    initNav();
    initAnalyzeButton();
    initResizeHandling();
    initAuth();
    initMobileLayout();
    renderAnalysisHistory();
    renderResiliencePanel();
    renderWeatherPanel();
    updateGauge(0, "SAFE");
    setSystemStatus("System online");
    warmPlotly();
}

function initMap() {
    const container = $("#map-container");
    if (!container) {
        return;
    }

    if (!window.maptilersdk) {
        showMapFallback("Map SDK unavailable. Scenario analysis is still operational.");
        return;
    }

    try {
        maptilersdk.config.apiKey = DEFAULT_MAP_KEY;
        state.map = new maptilersdk.Map({
            container: "map-container",
            style: DETAILED_STYLE_URL,
            center: DEFAULT_VIEW.center,
            zoom: DEFAULT_VIEW.zoom,
            pitch: DEFAULT_VIEW.pitch,
            bearing: DEFAULT_VIEW.bearing,
            antialias: false,
            maxPitch: 74,
            fullscreenControl: false,
            navigationControl: false,
        });

        state.map.addControl(
            new maptilersdk.NavigationControl({ showCompass: true, showZoom: true }),
            "bottom-right"
        );

        state.map.on("load", () => {
            state.mapReady = true;
            addMapAtmosphere();
            setSystemStatus("Map online");

            const applyEnhancements = () => {
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(finalizeMapEnhancements, { timeout: 700 });
                    return;
                }
                window.setTimeout(finalizeMapEnhancements, 120);
            };

            state.map.once("idle", applyEnhancements);
        });

        state.map.on("error", () => {
            if (!state.mapReady) {
                showMapFallback("Map could not fully initialize. Core analysis remains available.");
            }
        });
    } catch (error) {
        console.error("Map init failed", error);
        showMapFallback("Map failed to initialize. Core analysis remains available.");
    }
}

function showMapFallback(message) {
    state.mapFailed = true;
    const container = $("#map-container");
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="map-fallback">
            <div class="map-fallback-grid"></div>
            <div class="map-fallback-card glass">
                <div class="map-fallback-title">STRUCTUREX GEO VIEW</div>
                <div class="map-fallback-text">${message}</div>
                <div class="map-fallback-subtext">Upload a dataset or run a scenario to keep using the platform.</div>
            </div>
        </div>
    `;
    setSystemStatus("Map offline fallback");
}

function addMapAtmosphere() {
    if (!state.map) {
        return;
    }

    try {
        state.map.setFog({
            color: "rgba(4, 14, 30, 0.92)",
            "high-color": "rgba(6, 24, 48, 0.85)",
            "space-color": "rgba(1, 4, 12, 1)",
            "horizon-blend": 0.1,
            "star-intensity": 0.15,
        });
    } catch (error) {
        console.warn("Fog setup skipped", error);
    }
}

function finalizeMapEnhancements() {
    if (!state.mapReady || !state.map || state.mapEnhancementsApplied) {
        return;
    }

    enhanceMapDetailLayers();
    add3DBuildings();
    initBuildingInteraction();
    state.mapEnhancementsApplied = true;

    state.map.easeTo({
        pitch: 54,
        duration: 900,
        essential: true,
    });
    setSystemStatus("3D map linked");
}

function enhanceMapDetailLayers() {
    if (!state.map) {
        return;
    }

    const style = state.map.getStyle();
    const sources = style?.sources || {};
    const candidateSources = ["openmaptiles", "maptiler_planet"];
    const sourceName = candidateSources.find((name) => sources[name]);
    if (!sourceName) {
        return;
    }

    const labelLayerId = style.layers?.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

    addLayerIfMissing({
        id: "sx-water-outline",
        source: sourceName,
        "source-layer": "water",
        type: "line",
        paint: {
            "line-color": "rgba(96, 165, 250, 0.45)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.4, 16, 1],
            "line-opacity": 0.65,
        },
    }, labelLayerId);

    addLayerIfMissing({
        id: "sx-park-soft",
        source: sourceName,
        "source-layer": "landuse",
        type: "fill",
        filter: ["match", ["get", "class"], ["park", "grass", "wood"], true, false],
        paint: {
            "fill-color": "rgba(74, 222, 128, 0.05)",
            "fill-opacity": 0.4,
        },
    }, labelLayerId);

    addLayerIfMissing({
        id: "sx-road-major",
        source: sourceName,
        "source-layer": "transportation",
        type: "line",
        filter: ["match", ["get", "class"], ["motorway", "trunk", "primary", "secondary"], true, false],
        layout: {
            "line-join": "round",
            "line-cap": "round",
        },
        paint: {
            "line-color": "rgba(203, 213, 225, 0.24)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 15, 1.4, 18, 2.6],
            "line-opacity": 0.7,
        },
    }, labelLayerId);
}

function addLayerIfMissing(layerConfig, beforeId) {
    if (!state.map || state.map.getLayer(layerConfig.id)) {
        return;
    }

    try {
        state.map.addLayer(layerConfig, beforeId);
    } catch (error) {
        console.warn(`Skipped layer ${layerConfig.id}`, error);
    }
}

function add3DBuildings() {
    if (!state.map || state.map.getLayer("3d-buildings")) {
        return;
    }

    const style = state.map.getStyle();
    const layers = style?.layers || [];
    const candidateSources = ["maptiler_planet", "openmaptiles"];
    const sourceName = candidateSources.find((name) => style?.sources?.[name]);
    if (!sourceName) {
        console.warn("No vector source found for 3D buildings");
        return;
    }
    state.buildingSourceName = sourceName;
    state.buildingSourceLayer = "building";

    const labelLayerId = layers.find((layer) => layer.type === "symbol" && layer.layout?.["text-field"])?.id;

    try {
        state.map.addLayer(
            {
                id: "3d-buildings",
                source: sourceName,
                "source-layer": "building",
                type: "fill-extrusion",
                filter: ["!has", "hide_3d"],
                minzoom: 14,
                paint: {
                    "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                    "fill-extrusion-height": ["coalesce", ["get", "render_height"], 12],
                    "fill-extrusion-color": getDefaultBuildingColorExpression(),
                    "fill-extrusion-opacity": 0.88,
                },
            },
            labelLayerId
        );

        state.map.addLayer(
            {
                id: "3d-buildings-highlight",
                source: sourceName,
                "source-layer": "building",
                type: "fill-extrusion",
                filter: getEmptyBuildingHighlightFilter(),
                paint: {
                    "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                    "fill-extrusion-height": ["+", ["coalesce", ["get", "render_height"], 12], 0.8],
                    "fill-extrusion-color": "#3b82f6",
                    "fill-extrusion-opacity": 0.92,
                    "fill-extrusion-vertical-gradient": false,
                },
            },
            labelLayerId
        );

        state.map.addSource("building-highlight-src", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        });

        state.map.addLayer(
            {
                id: "3d-buildings-highlight-fallback",
                source: "building-highlight-src",
                type: "fill",
                paint: {
                    "fill-color": SELECTED_BUILDING_COLOR,
                    "fill-opacity": 0.38,
                },
            },
            labelLayerId
        );

        state.map.addLayer(
            {
                id: "building-highlight-outline",
                source: "building-highlight-src",
                type: "line",
                paint: {
                    "line-color": "#93c5fd",
                    "line-width": 2,
                    "line-opacity": 0.95,
                },
            },
            labelLayerId
        );
    } catch (error) {
        console.warn("3D building setup skipped", error);
    }
}

function initBuildingInteraction() {
    if (!state.map || !state.map.getLayer("3d-buildings") || state.buildingInteractionBound) {
        return;
    }

    state.buildingInteractionBound = true;

    state.map.on("mouseenter", "3d-buildings", () => {
        state.map.getCanvas().style.cursor = "pointer";
    });

    state.map.on("mouseleave", "3d-buildings", () => {
        state.map.getCanvas().style.cursor = "";
    });

    state.map.on("click", "3d-buildings", (event) => {
        const feature = event.features?.[0];
        if (feature) {
            analyzeBuilding(feature, event.lngLat, event.point);
        }
    });

    state.map.on("click", (event) => {
        const features = state.map.queryRenderedFeatures(event.point, { layers: ["3d-buildings"] });
        if (!features.length) {
            deselectBuilding();
        }
    });
}

async function analyzeBuilding(feature, lngLat, point = null) {
    if (!lngLat) {
        return;
    }

    const selectionKey = getBuildingSelectionKey(feature, lngLat);
    state.activeBuildingRequestId += 1;
    const requestId = state.activeBuildingRequestId;
    state.selectedBuildingKey = selectionKey;

    highlightBuilding(feature, lngLat, point);
    state.selectedBuilding = { feature, lngLat, key: selectionKey };
    centerOnCoordinates([lngLat.lng, lngLat.lat], 17.2);
    openBuildingPanelLoading(lngLat);

    const locationMeta = await reverseGeocode(lngLat.lng, lngLat.lat);
    if (!isActiveBuildingRequest(requestId, selectionKey)) {
        return;
    }
    setWeatherTarget({
        name: locationMeta.label,
        address: locationMeta.address,
        area: locationMeta.area,
        lat: lngLat.lat,
        lng: lngLat.lng,
        source: "Building selection",
    });

    const height = Number(feature.properties?.render_height || feature.properties?.height || 12);
    const payload = {
        lat: lngLat.lat,
        lng: lngLat.lng,
        height,
        address: locationMeta.address,
        area_name: locationMeta.area,
        properties: feature.properties || {},
    };

    try {
        const response = await fetch(`${API}/building-analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Building analysis failed (${response.status})`);
        }

        const result = await response.json();
        if (!isActiveBuildingRequest(requestId, selectionKey)) {
            return;
        }

        renderBuildingAnalysis(result, locationMeta, height, lngLat, feature);
        addToHistory({
            id: selectionKey,
            address: locationMeta.area || locationMeta.address,
            fullAddress: locationMeta.address,
            height,
            risk: Number(result.risk_score || 0),
            lngLat,
        });
        runResilienceAnalysis({ silent: true });
        setSystemStatus("Building AI completed");
        trackBuildingAnalysis(locationMeta.area || locationMeta.address);
    } catch (error) {
        if (!isActiveBuildingRequest(requestId, selectionKey)) {
            return;
        }
        console.error(error);
        renderBuildingError(locationMeta);
        setSystemStatus("Building AI fallback");
    }
}

function highlightBuilding(feature, lngLat, point = null) {
    if (!state.map) {
        return;
    }

    const cluster = collectSelectedBuildingParts(feature, point);
    if (cluster.ids.length) {
        applyBuildingHighlightIds(cluster.ids);
        state.selectedBuildingFeatureIds = cluster.ids;
        clearFallbackBuildingHighlight();
        if (lngLat) {
            addOrMoveMarker([lngLat.lng, lngLat.lat], { mode: "selected scanning" });
        }
        return;
    }

    const geometry = feature?.geometry;
    if (!geometry) {
        clearBuildingHighlight();
        return;
    }

    // Extract ONLY the single polygon the user actually clicked
    let singleGeometry = geometry;

    if (geometry.type === "MultiPolygon" && lngLat) {
        const clickedPoly = findClickedPolygon(geometry.coordinates, lngLat.lng, lngLat.lat);
        if (clickedPoly) {
            singleGeometry = { type: "Polygon", coordinates: clickedPoly };
        } else {
            // Fallback: find the nearest polygon by centroid distance
            singleGeometry = findNearestPolygon(geometry.coordinates, lngLat.lng, lngLat.lat);
        }
    }

    resetBuildingPaintHighlight();

    state.map.getSource("building-highlight-src")?.setData({
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: singleGeometry,
            properties: feature.properties || {},
        }],
    });

    let coords = null;
    if (singleGeometry.type === "Polygon") {
        coords = singleGeometry.coordinates?.[0]?.[0];
    } else if (singleGeometry.type === "MultiPolygon") {
        coords = singleGeometry.coordinates?.[0]?.[0]?.[0];
    }
    if (coords) {
        addOrMoveMarker(coords, { mode: "selected scanning" });
    }
}

function collectSelectedBuildingParts(feature, point) {
    const clickedId = getBuildingFeatureId(feature);
    const candidates = getRenderedBuildingCandidates(feature, point);
    const cluster = expandBuildingCluster(feature, candidates, point);
    let ids = uniqueValues(cluster.map(getBuildingFeatureId).filter((id) => id !== null));

    if (!ids.length && clickedId !== null) {
        ids.push(clickedId);
    }
    if (ids.length > 8) {
        ids = clickedId !== null ? [clickedId] : [];
    }

    return {
        features: cluster,
        ids,
    };
}

function getRenderedBuildingCandidates(feature, point) {
    const items = [feature].filter(Boolean);
    if (!state.map || !point || !state.map.getLayer("3d-buildings")) {
        return items;
    }

    const radius = Math.max(48, Math.min(84, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.08)));
    const box = [
        [point.x - radius, point.y - radius],
        [point.x + radius, point.y + radius],
    ];

    try {
        items.push(...state.map.queryRenderedFeatures(box, { layers: ["3d-buildings"] }));
    } catch (error) {
        console.warn("Building cluster query failed", error);
    }

    return dedupeFeatures(items);
}

function expandBuildingCluster(seedFeature, candidates, point) {
    const seedId = getBuildingFeatureId(seedFeature);
    const seedKeys = getBuildingGroupKeys(seedFeature);
    const cluster = [];

    candidates.forEach((candidate) => {
        if (!candidate) {
            return;
        }
        const candidateId = getBuildingFeatureId(candidate);
        if (seedId !== null && candidateId === seedId) {
            cluster.push(candidate);
            return;
        }
        if (sharesAnyValue(seedKeys, getBuildingGroupKeys(candidate))) {
            cluster.push(candidate);
            return;
        }
    });

    if (!cluster.length) {
        cluster.push(seedFeature);
    }

    return dedupeFeatures(cluster);
}

function getBuildingFeatureId(feature) {
    const id = feature?.id;
    if (id === undefined || id === null || id === "") {
        return null;
    }
    const idText = String(id);
    if (/^\d+$/.test(idText) && Number(idText) < 1000) {
        return null;
    }
    if (idText.length < 4) {
        return null;
    }
    return id;
}

function getEmptyBuildingHighlightFilter() {
    return ["all", ["!", ["has", "hide_3d"]], ["==", ["id"], "__no_selected_building__"]];
}

function getBuildingHighlightFilter(featureId) {
    return ["all", ["!", ["has", "hide_3d"]], ["==", ["id"], featureId]];
}

function getDefaultBuildingColorExpression() {
    return [
        "interpolate",
        ["linear"],
        ["coalesce", ["get", "render_height"], 12],
        0, "#081a30",
        20, "#0d2740",
        60, "#103558",
        120, "#16486d",
        220, "#1c5f8d",
    ];
}

function applyBuildingHighlightIds(ids) {
    if (!state.map?.getLayer("3d-buildings")) {
        return;
    }

    const matchSelected = ["match", ["id"], ids, true, false];
    state.map.setPaintProperty("3d-buildings", "fill-extrusion-color", [
        "case",
        matchSelected,
        SELECTED_BUILDING_COLOR,
        getDefaultBuildingColorExpression(),
    ]);
    state.map.setPaintProperty("3d-buildings", "fill-extrusion-opacity", [
        "case",
        matchSelected,
        0.98,
        0.72,
    ]);
    if (state.map.getLayer("3d-buildings-highlight")) {
        state.map.setFilter("3d-buildings-highlight", getEmptyBuildingHighlightFilter());
    }
}

function resetBuildingPaintHighlight() {
    state.selectedBuildingFeatureIds = [];
    if (!state.map?.getLayer("3d-buildings")) {
        return;
    }
    state.map.setPaintProperty("3d-buildings", "fill-extrusion-color", getDefaultBuildingColorExpression());
    state.map.setPaintProperty("3d-buildings", "fill-extrusion-opacity", 0.88);
    if (state.map.getLayer("3d-buildings-highlight")) {
        state.map.setFilter("3d-buildings-highlight", getEmptyBuildingHighlightFilter());
    }
}

function clearFallbackBuildingHighlight() {
    state.map?.getSource("building-highlight-src")?.setData({ type: "FeatureCollection", features: [] });
}

function clearBuildingHighlight() {
    resetBuildingPaintHighlight();
    clearFallbackBuildingHighlight();
}

function dedupeFeatures(features) {
    const seen = new Set();
    const output = [];
    features.forEach((feature, index) => {
        if (!feature) {
            return;
        }
        const id = getBuildingFeatureId(feature);
        const key = id !== null
            ? `id:${id}`
            : `geom:${index}:${JSON.stringify(feature.geometry?.coordinates?.[0]?.[0] || feature.geometry?.coordinates?.[0] || [])}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        output.push(feature);
    });
    return output;
}

function getBuildingGroupKeys(feature) {
    const props = feature?.properties || {};
    return [
        props.osm_id,
        props.osm_way_id,
        props.osm_relation_id,
        props.way_id,
        props.relation_id,
        props.name,
        props["name:en"],
        props["addr:housenumber"] && props["addr:street"]
            ? `${props["addr:housenumber"]} ${props["addr:street"]}`
            : null,
    ]
        .filter((value) => value !== undefined && value !== null && String(value).trim())
        .map((value) => String(value).toLowerCase());
}

function getFeatureHeight(feature) {
    return Number(feature?.properties?.render_height || feature?.properties?.height || 12);
}

function heightCompatible(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return true;
    }
    return Math.abs(a - b) <= Math.max(22, Math.max(a, b) * 0.85);
}

function sharesAnyValue(a, b) {
    if (!a.length || !b.length) {
        return false;
    }
    const set = new Set(a);
    return b.some((value) => set.has(value));
}

function pointBounds(point) {
    if (!point) {
        return null;
    }
    return { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y };
}

function featureScreenBounds(feature) {
    const coords = [];
    collectGeometryCoordinates(feature?.geometry, coords);
    if (!coords.length || !state.map) {
        return null;
    }

    return coords.reduce((bounds, coord) => {
        const projected = state.map.project(coord);
        return {
            minX: Math.min(bounds.minX, projected.x),
            minY: Math.min(bounds.minY, projected.y),
            maxX: Math.max(bounds.maxX, projected.x),
            maxY: Math.max(bounds.maxY, projected.y),
        };
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function collectGeometryCoordinates(geometry, output) {
    if (!geometry) {
        return;
    }
    if (geometry.type === "Polygon") {
        geometry.coordinates?.forEach((ring) => ring.forEach((coord) => output.push(coord)));
        return;
    }
    if (geometry.type === "MultiPolygon") {
        geometry.coordinates?.forEach((polygon) =>
            polygon.forEach((ring) => ring.forEach((coord) => output.push(coord)))
        );
    }
}

function expandBounds(bounds, amount) {
    return {
        minX: bounds.minX - amount,
        minY: bounds.minY - amount,
        maxX: bounds.maxX + amount,
        maxY: bounds.maxY + amount,
    };
}

function mergeBounds(boundsList) {
    if (!boundsList.length) {
        return null;
    }
    return boundsList.reduce((merged, bounds) => ({
        minX: Math.min(merged.minX, bounds.minX),
        minY: Math.min(merged.minY, bounds.minY),
        maxX: Math.max(merged.maxX, bounds.maxX),
        maxY: Math.max(merged.maxY, bounds.maxY),
    }));
}

function boundsIntersect(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function boundsDistance(a, b) {
    const dx = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
    const dy = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
    return Math.hypot(dx, dy);
}

function uniqueValues(values) {
    return Array.from(new Set(values));
}

/** Ray-casting point-in-polygon: returns the polygon ring-set that contains (px, py), or null */
function findClickedPolygon(multiCoords, px, py) {
    for (const polygonCoords of multiCoords) {
        if (pointInPolygonRings(polygonCoords, px, py)) {
            return polygonCoords;
        }
    }
    return null;
}

/** Find the nearest polygon by centroid when point-in-polygon fails (edge clicks) */
function findNearestPolygon(multiCoords, px, py) {
    let bestDist = Infinity;
    let bestCoords = multiCoords[0];

    for (const polygonCoords of multiCoords) {
        const ring = polygonCoords[0]; // outer ring
        let cx = 0, cy = 0;
        for (const pt of ring) { cx += pt[0]; cy += pt[1]; }
        cx /= ring.length; cy /= ring.length;
        const d = (cx - px) ** 2 + (cy - py) ** 2;
        if (d < bestDist) { bestDist = d; bestCoords = polygonCoords; }
    }

    return { type: "Polygon", coordinates: bestCoords };
}

/** Ray-casting test: checks outer ring and subtracts holes */
function pointInPolygonRings(rings, px, py) {
    if (!rings || !rings.length) return false;
    // Must be inside outer ring
    if (!pointInRing(rings[0], px, py)) return false;
    // Must NOT be inside any hole
    for (let i = 1; i < rings.length; i++) {
        if (pointInRing(rings[i], px, py)) return false;
    }
    return true;
}

/** Classic ray-casting algorithm for a single ring */
function pointInRing(ring, px, py) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function addOrMoveMarker(coords, options = {}) {
    if (!state.mapReady || !state.map || !coords) {
        return;
    }

    const mode = options.mode || "pending";

    if (!state.mapMarker) {
        const markerElement = document.createElement("div");
        markerElement.className = `infra-marker ${mode}`;
        markerElement.innerHTML = `
            <span class="marker-ring"></span>
            <span class="marker-scan"></span>
            <span class="marker-scan marker-scan-delayed"></span>
            <i class="fas fa-building"></i>
        `;
        state.mapMarker = new maptilersdk.Marker({ element: markerElement, anchor: "center" })
            .setLngLat(coords)
            .addTo(state.map);
        return;
    }

    state.mapMarker.setLngLat(coords);
    state.mapMarker.getElement().className = `infra-marker ${mode}`;
}

function openBuildingPanelLoading(lngLat) {
    toggleRightPanel(false);
    setBuildingPanelVisible(true);
    switchRightTab("review");
    renderSatelliteTelemetry();
    $("#detail-panel").classList.remove("expanded");
    $("#det-name").textContent = "Building analysis in progress";
    $("#det-district").textContent = `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`;
    $("#building-loading").style.display = "block";
    $("#building-result").innerHTML = `
        <div class="review-loading-grid">
            <div class="review-skeleton review-skeleton-lg"></div>
            <div class="review-skeleton review-skeleton-md"></div>
            <div class="review-skeleton review-skeleton-sm"></div>
            <div class="review-skeleton review-skeleton-md"></div>
        </div>
    `;
}

function renderBuildingAnalysis(result, locationMeta, height, lngLat, feature) {
    $("#building-loading").style.display = "none";
    $("#det-name").textContent = locationMeta.label;
    $("#det-district").textContent = locationMeta.address;

    const risk = Number(result.risk_score || 0);
    const level = risk >= 55 ? "critical" : risk >= 20 ? "warning" : "safe";
    const color = getRiskColor(risk);
    const type = feature.properties?.type || "building";
    const icon = type.includes("bridge") ? "fa-bridge" : type.includes("industrial") ? "fa-industry" : "fa-building";
    const profile = deriveBuildingProfile(feature, height, result, locationMeta, lngLat);

    $("#det-type").innerHTML = `<i class="fas ${icon}"></i>`;

    $("#building-result").innerHTML = `
        <section class="review-hero">
            <div class="ai-risk-row">
                <div>
                    <div class="ai-risk-label">AI-powered structural review</div>
                    <div class="mini-note">${profile.assetType} in ${locationMeta.area}</div>
                </div>
                <div class="ai-risk-score" style="color:${color}">${risk.toFixed(1)}</div>
            </div>
            <div class="review-status-row">
                <span class="review-status-chip ${level}">${escapeHtml(result.risk_category || riskToLabel(risk))}</span>
                <span class="review-status-meta">${profile.priority}</span>
            </div>
            <div class="ai-summary">${escapeHtml(result.summary || "No executive summary returned.")}</div>
        </section>
        <section class="review-grid">
            ${renderMetricCard("Asset type", profile.assetType, level)}
            ${renderMetricCard("Estimated floors", String(profile.estimatedFloors), "")}
            ${renderMetricCard("Height", `${height.toFixed(1)}m`, "")}
            ${renderMetricCard("Occupancy profile", profile.operationalExposure, "")}
            ${renderMetricCard("Coordinates", `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`, "")}
            ${renderMetricCard("Construction profile", profile.constructionProfile, "")}
        </section>
        ${renderDetailSection("Structural integrity", result.structural_integrity)}
        ${renderDetailSection("Asset-specific findings", result.asset_specific_findings)}
        ${renderDetailSection("Load path and lateral system", result.load_path_and_lateral_system)}
        ${renderDetailSection("Seismic vulnerability", result.seismic_vulnerability)}
        ${renderDetailSection("Soil and foundation", result.soil_foundation)}
        ${renderDetailSection("Climate impact", result.climate_impact)}
        ${renderDetailSection("Environmental hazards", result.environmental_hazards)}
        ${renderDetailSection("Serviceability outlook", result.serviceability_outlook)}
        ${renderDetailSection("Maintenance hotspots", result.maintenance_hotspots)}
        ${renderDetailSection("Lifecycle factors", result.lifecycle_factors)}
        ${renderDetailSection("Inspection priority", profile.priority)}
        ${renderDetailSection("Confidence notes", profile.confidenceNotes)}
        ${renderDetailSection("Data gaps", result.data_gaps)}
        ${renderMetadataSection(feature, locationMeta, profile)}
        <div class="ai-section ai-section-emphasis">
            <div class="ai-section-title" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div><i class="fas fa-tools"></i> Recommended actions</div>
                <button class="inline-voice-btn" data-text="Recommended actions. ${escapeHtml((result.recommendations || []).join('. '))}" aria-label="Read recommendations" title="Read this section">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            <ol class="rec-list">
                ${(result.recommendations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ol>
        </div>
    `;
    renderSelectionSummary({ result, locationMeta, height, lngLat, profile, risk });
}

function renderBuildingError(locationMeta) {
    $("#building-loading").style.display = "none";
    toggleRightPanel(false);
    setBuildingPanelVisible(true);
    switchRightTab("review");
    $("#detail-panel").classList.remove("expanded");
    $("#det-name").textContent = locationMeta.label;
    $("#det-district").textContent = locationMeta.address;
    $("#building-result").innerHTML = `
        <div class="ai-summary">
            Building AI analysis is unavailable right now. Map selection, scenario tools, and CSV analysis still work.
        </div>
        <div class="ai-section">
            <div class="ai-section-title"><i class="fas fa-shield"></i> Next step</div>
            <div class="ai-section-content">
                Use the scenario engine or upload a CSV dataset to continue risk evaluation while the building-specific AI service falls back.
            </div>
        </div>
    `;
    renderSelectionSummary({ locationMeta, fallback: true });
}

function renderDetailSection(title, content) {
    if (!content) {
        return "";
    }

    return `
        <div class="ai-section">
            <div class="ai-section-title" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div><i class="fas fa-angle-right"></i> ${escapeHtml(title)}</div>
                <button class="inline-voice-btn" data-text="${escapeHtml(title)}. ${escapeHtml(content)}" aria-label="Read this section" title="Read this section">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            <div class="ai-section-content">${formatParagraphs(content)}</div>
        </div>
    `;
}

function renderMetricCard(label, value, tone) {
    return `
        <div class="building-metric ${tone}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span class="building-metric-label">${escapeHtml(label)}</span>
                <button class="inline-voice-btn" data-text="${escapeHtml(label)}: ${escapeHtml(value)}" aria-label="Read this metric" title="Read this metric">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            <span class="building-metric-value">${escapeHtml(value)}</span>
        </div>
    `;
}

function renderMetadataSection(feature, locationMeta, profile) {
    const details = [
        ["Map source label", locationMeta.label],
        ["Mapped district", locationMeta.area],
        ["Feature kind", profile.featureKind],
        ["Footprint profile", profile.footprintProfile],
    ].filter(([, value]) => value);

    return `
        <div class="ai-section">
            <div class="ai-section-title"><i class="fas fa-table-list"></i> Asset dossier</div>
            <div class="metadata-grid">
                ${details.map(([label, value]) => `
                    <div class="metadata-row">
                        <span class="metadata-label">${escapeHtml(label)}</span>
                        <span class="metadata-value">${escapeHtml(value)}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function deriveBuildingProfile(feature, height, result, locationMeta, lngLat) {
    const type = String(feature.properties?.type || "building");
    const estimatedFloors = Number(result.estimated_floors || Math.max(1, Math.round(height / 3.5)));
    const assetType = type.includes("bridge")
        ? "Bridge-linked structure"
        : type.includes("industrial")
            ? "Industrial facility"
            : height > 60
                ? "High-rise building"
                : "Urban building";

    return {
        assetType,
        estimatedFloors,
        operationalExposure: result.operational_exposure || (estimatedFloors >= 15 ? "High occupancy / high consequence" : "Moderate occupancy / standard consequence"),
        constructionProfile: result.construction_profile || (height > 45 ? "Likely reinforced concrete or composite frame with lateral-force considerations." : "Likely reinforced concrete frame or masonry-supported urban construction."),
        priority: result.inspection_priority || (Number(result.risk_score || 0) >= 55 ? "Immediate engineering inspection recommended." : Number(result.risk_score || 0) >= 20 ? "Priority field inspection recommended." : "Routine inspection cadence remains acceptable."),
        confidenceNotes: result.confidence_notes || "This review is based on map geometry, location context, and inferred engineering assumptions. A survey-grade assessment would require structural drawings, material data, and on-site inspection.",
        footprintProfile: feature.geometry?.type === "Polygon" ? "Single footprint polygon" : feature.geometry?.type === "MultiPolygon" ? "Composite footprint geometry" : "Geometry available",
        featureKind: type || "building",
        coordinates: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
        locationLabel: locationMeta.label,
    };
}

function deselectBuilding() {
    state.activeBuildingRequestId += 1;
    state.selectedBuilding = null;
    state.selectedBuildingKey = null;
    clearBuildingHighlight();
    if (state.mapMarker) {
        state.mapMarker.getElement().className = "infra-marker pending";
    }
    $("#detail-panel").classList.remove("expanded");
    setBuildingPanelVisible(false);
    renderSelectionSummary();
    renderSatelliteTelemetry();
}

function getBuildingSelectionKey(feature, lngLat) {
    if (feature?.id !== undefined && feature?.id !== null) {
        return `feature:${feature.id}`;
    }
    return `coords:${lngLat.lng.toFixed(6)}:${lngLat.lat.toFixed(6)}`;
}

function isActiveBuildingRequest(requestId, selectionKey) {
    return (
        requestId === state.activeBuildingRequestId &&
        selectionKey === state.selectedBuildingKey
    );
}

async function reverseGeocode(lng, lat) {
    const fallback = {
        label: "Selected structure",
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        area: "Mapped zone",
    };

    try {
        const response = await fetch(
            `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${DEFAULT_MAP_KEY}`
        );
        if (!response.ok) {
            return fallback;
        }
        const payload = await response.json();
        const feature = payload.features?.[0];
        if (!feature) {
            return fallback;
        }

        const context = feature.context || [];
        const area =
            context.find((item) => item.id.startsWith("place"))?.text ||
            context.find((item) => item.id.startsWith("region"))?.text ||
            feature.text ||
            fallback.area;

        return {
            label: feature.text || "Selected structure",
            address: feature.place_name || fallback.address,
            area,
        };
    } catch (error) {
        console.warn("Reverse geocode failed", error);
        return fallback;
    }
}

function initPlaceSearch() {
    const input = $("#place-search");
    const dropdown = $("#search-results");
    const form = $("#place-search-form");
    const locateButton = $("#use-location-btn");
    if (!input || !dropdown) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const query = input.value.trim();
        if (!query) {
            return;
        }
        await runPlaceSearch(query, { autoSelectFirst: true });
    });

    input.addEventListener("input", () => {
        clearTimeout(state.geocodeTimer);
        const query = input.value.trim();
        state.activeSearchIndex = -1;
        if (query.length < 2) {
            dropdown.style.display = "none";
            dropdown.innerHTML = "";
            $("#search-meta").textContent = "Search any city, village, address, landmark, district, state, PIN code, or country.";
            return;
        }

        $("#search-meta").textContent = "Searching global and India map data...";
        state.geocodeTimer = setTimeout(() => runPlaceSearch(query), 250);
    });

    input.addEventListener("keydown", async (event) => {
        const items = $$(".search-result-item");
        if (!items.length && event.key === "Enter") {
            event.preventDefault();
            const query = input.value.trim();
            if (query) {
                await runPlaceSearch(query, { autoSelectFirst: true });
            }
            return;
        }

        if (!items.length) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            state.activeSearchIndex = (state.activeSearchIndex + 1) % items.length;
            updateSearchSelection(items);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            state.activeSearchIndex = (state.activeSearchIndex - 1 + items.length) % items.length;
            updateSearchSelection(items);
            return;
        }

        if (event.key === "Enter" && state.activeSearchIndex >= 0) {
            event.preventDefault();
            items[state.activeSearchIndex]?.click();
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".search-wrap")) {
            dropdown.style.display = "none";
        }
    });

    locateButton?.addEventListener("click", () => {
        requestUserLocation({ source: "search-button" });
    });
}

async function runPlaceSearch(query, options = {}) {
    const dropdown = $("#search-results");
    const meta = $("#search-meta");

    try {
        let features = [];
        const searchQueries = buildSearchQueries(query);

        for (const searchQuery of searchQueries) {
            const mapTilerFeatures = await fetchMapTilerPlaces(searchQuery);
            mapTilerFeatures.forEach((feature) => addSearchFeature(features, feature));
            if (features.length >= 12) {
                break;
            }
        }

        if (features.length < 12) {
            for (const searchQuery of searchQueries) {
                const osmFeatures = await fetchOpenStreetMapPlaces(searchQuery);
                osmFeatures.forEach((feature) => addSearchFeature(features, feature));
                if (features.length >= 16) {
                    break;
                }
            }
        }

        getIndiaAdminMatches(query).forEach((feature) => addSearchFeature(features, feature));
        features = rankSearchFeatures(features, query).slice(0, 16);

        state.latestSearchResults = features;

        if (!features.length) {
            dropdown.innerHTML = `<div class="search-result-empty">No matching city, village, state, district, landmark, or PIN code found.</div>`;
            dropdown.style.display = "block";
            meta.textContent = "Try adding district, state, or India after the place name.";
            return;
        }

        if (options.autoSelectFirst) {
            selectPlaceResult(features[0]);
            dropdown.style.display = "none";
            return;
        }

        dropdown.innerHTML = features
            .map((feature, index) => {
                const iconClass = getFeatureIcon(feature);
                const sourceTag = feature.properties?.source
                    ? `<span class="source-tag">${escapeHtml(feature.properties.source)}</span>`
                    : "";
                return `
                    <button class="search-result-item" type="button"
                        data-index="${index}"
                        data-lng="${feature.center[0]}"
                        data-lat="${feature.center[1]}"
                        data-name="${escapeHtml(feature.text || "Result")}">
                        <i class="fas ${iconClass} search-result-icon"></i>
                        <span class="search-result-copy">
                            <div class="search-result-top">
                                <strong>${escapeHtml(feature.text || "Result")}</strong>
                                ${sourceTag}
                            </div>
                            <span>${escapeHtml(feature.place_name || "")}</span>
                        </span>
                    </button>
                `;
            })
            .join("");
        dropdown.style.display = "block";
        meta.textContent = `${features.length} matches found across cities, villages, districts, states, landmarks, and addresses.`;

        $$(".search-result-item").forEach((button) => {
            button.addEventListener("click", () => {
                const feature = state.latestSearchResults[Number(button.dataset.index)];
                selectPlaceResult(feature);
                dropdown.style.display = "none";
            });
        });
    } catch (error) {
        console.error(error);
        dropdown.innerHTML = `<div class="search-result-empty">Search temporarily unavailable.</div>`;
        dropdown.style.display = "block";
        meta.textContent = "Global search is temporarily unavailable. Please try again.";
    }
}

function buildSearchQueries(query) {
    const clean = query.trim();
    const lower = clean.toLowerCase();
    const queries = [clean];
    if (!lower.includes("india") && !lower.includes("bharat")) {
        queries.push(`${clean}, India`);
    }
    return uniqueValues(queries);
}

async function fetchMapTilerPlaces(query) {
    try {
        const params = new URLSearchParams({
            key: DEFAULT_MAP_KEY,
            limit: "10",
            types: GEOCODER_TYPES,
            autocomplete: "true",
            fuzzyMatch: "true",
            language: "en",
        });
        if (state.userLocation) {
            params.set("proximity", `${state.userLocation.lng},${state.userLocation.lat}`);
        }
        const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params.toString()}`);
        if (!response.ok) {
            console.warn(`MapTiler search returned ${response.status}`);
            return [];
        }
        const payload = await response.json();
        return (payload.features || []).map((feature) => ({
            ...feature,
            properties: {
                ...(feature.properties || {}),
                source: "MapTiler",
            },
        }));
    } catch (error) {
        console.warn("MapTiler search failed", error);
        return [];
    }
}

async function fetchOpenStreetMapPlaces(query) {
    try {
        const params = new URLSearchParams({
            q: query,
            format: "jsonv2",
            limit: "10",
            addressdetails: "1",
            extratags: "1",
            namedetails: "1",
            "accept-language": "en",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return data
            .filter((node) => Number.isFinite(Number(node.lon)) && Number.isFinite(Number(node.lat)))
            .map((node) => ({
                id: `nom-${node.place_id}`,
                text: node.name || node.display_name.split(",")[0],
                place_name: node.display_name,
                center: [Number(node.lon), Number(node.lat)],
                bbox: node.boundingbox
                    ? [Number(node.boundingbox[2]), Number(node.boundingbox[0]), Number(node.boundingbox[3]), Number(node.boundingbox[1])]
                    : null,
                properties: {
                    type: node.type,
                    class: node.class,
                    osm_type: node.osm_type,
                    source: "OSM",
                },
            }));
    } catch (error) {
        console.warn("OpenStreetMap search failed", error);
        return [];
    }
}

function getIndiaAdminMatches(query) {
    const clean = normalizeSearchText(query);
    if (clean.length < 2) {
        return [];
    }
    return INDIA_ADMIN_AREAS.filter((feature) => {
        const name = normalizeSearchText(feature.text);
        const full = normalizeSearchText(feature.place_name);
        return name.includes(clean) || clean.includes(name) || full.includes(clean);
    });
}

function addSearchFeature(features, feature) {
    if (!feature?.center || !Number.isFinite(Number(feature.center[0])) || !Number.isFinite(Number(feature.center[1]))) {
        return;
    }

    const key = `${normalizeSearchText(feature.text || feature.place_name)}:${Number(feature.center[0]).toFixed(4)}:${Number(feature.center[1]).toFixed(4)}`;
    const exists = features.some((item) => {
        const itemKey = `${normalizeSearchText(item.text || item.place_name)}:${Number(item.center[0]).toFixed(4)}:${Number(item.center[1]).toFixed(4)}`;
        const close = Math.abs(item.center[0] - feature.center[0]) < 0.0008 && Math.abs(item.center[1] - feature.center[1]) < 0.0008;
        return itemKey === key || close;
    });
    if (!exists) {
        features.push(feature);
    }
}

function rankSearchFeatures(features, query) {
    const clean = normalizeSearchText(query);
    return [...features].sort((a, b) => searchFeatureScore(b, clean) - searchFeatureScore(a, clean));
}

function searchFeatureScore(feature, cleanQuery) {
    const text = normalizeSearchText(feature.text || "");
    const full = normalizeSearchText(feature.place_name || "");
    const source = feature.properties?.source || "";
    let score = 0;
    if (text === cleanQuery) score += 80;
    if (text.startsWith(cleanQuery)) score += 35;
    if (full.includes(cleanQuery)) score += 20;
    if (full.includes("india")) score += 10;
    if (source === "India admin") score += 18;
    if (source === "MapTiler") score += 8;
    if ((feature.properties?.class || "").includes("boundary")) score += 8;
    return score;
}

function normalizeSearchText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function getFeatureIcon(feature) {
    const cls = (feature.properties?.class || feature.properties?.type || "").toLowerCase();
    const txt = (feature.text || feature.place_name || "").toLowerCase();

    if (cls.includes("monument") || txt.includes("monument")) return "fa-monument";
    if (cls.includes("castle") || txt.includes("fort")) return "fa-fort-awesome";
    if (cls.includes("tower") || txt.includes("tower")) return "fa-broadcast-tower";
    if (cls.includes("museum") || cls.includes("gallery")) return "fa-landmark-dome";
    if (cls.includes("stadium") || cls.includes("arena")) return "fa-circle-dot";
    if (cls.includes("bridge")) return "fa-bridge";
    if (cls.includes("industrial") || cls.includes("factory")) return "fa-industry";
    if (cls.includes("office") || cls.includes("commercial")) return "fa-building";
    if (cls.includes("administrative") || txt.includes("state of india") || txt.includes("union territory")) return "fa-map";
    if (cls.includes("place") || cls.includes("city") || cls.includes("town")) return "fa-city";
    
    return "fa-location-crosshairs";
}

function updateSearchSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle("active", index === state.activeSearchIndex);
    });
}

function selectPlaceResult(feature) {
    if (!feature) {
        return;
    }

    const lng = Number(feature.center?.[0]);
    const lat = Number(feature.center?.[1]);
    const name = feature.place_name || feature.text || "Selected place";
    const isPOI = feature.properties?.source === "OpenStreetMap" || feature.place_type?.includes("poi") || feature.id?.startsWith("nom-");

    $("#place-search").value = feature.text || name;
    $("#search-meta").textContent = `Mapped: ${name}`;
    setWeatherTarget({
        name: feature.text || "Selected place",
        address: feature.place_name || name,
        area: feature.context?.find(c => c.id.includes("place"))?.text || feature.text || "Mapped area",
        lat,
        lng,
        source: feature.properties?.source || "Map search",
    });

    if (state.mapReady && state.map) {
        const zoom = isPOI ? 18.2 : 15.8;
        if (Array.isArray(feature.bbox) && feature.bbox.length === 4) {
            state.map.fitBounds(
                [
                    [feature.bbox[0], feature.bbox[1]],
                    [feature.bbox[2], feature.bbox[3]],
                ],
                {
                    padding: { top: 120, right: 120, bottom: 120, left: 340 },
                    duration: 1400,
                    maxZoom: zoom,
                }
            );
        } else {
            centerOnCoordinates([lng, lat], zoom);
        }
    }

    addOrMoveMarker([lng, lat]);
    
    // Auto-trigger analysis for POIs
    if (isPOI) {
        setSystemStatus(`Deep scan targeting: ${feature.text}`);
        setTimeout(() => {
            const mockFeature = {
                id: feature.id,
                properties: {
                    name: feature.text,
                    category: feature.properties?.class || feature.properties?.type,
                    source: feature.properties?.source
                }
            };
            analyzeBuilding(mockFeature, { lng, lat });
        }, 1500);
    }

    runResilienceAnalysis({ silent: true });
}

function initUserLocationPrompt() {
    const prompt = $("#location-consent");
    const allow = $("#location-allow");
    const skip = $("#location-skip");

    allow?.addEventListener("click", () => requestUserLocation({ source: "startup-prompt" }));
    skip?.addEventListener("click", () => hideLocationPrompt());

    if (!navigator.geolocation || !prompt || sessionStorage.getItem("sx-location-suggested") === "1") {
        return;
    }

    window.setTimeout(() => {
        if (!state.userLocation) {
            showLocationPrompt();
        }
    }, 1200);
}

function showLocationPrompt() {
    const prompt = $("#location-consent");
    if (!prompt) {
        return;
    }
    state.locationPromptVisible = true;
    sessionStorage.setItem("sx-location-suggested", "1");
    prompt.hidden = false;
    prompt.classList.add("show");
}

function hideLocationPrompt() {
    const prompt = $("#location-consent");
    if (!prompt) {
        return;
    }
    state.locationPromptVisible = false;
    prompt.classList.remove("show");
    window.setTimeout(() => {
        prompt.hidden = true;
    }, 180);
}

function requestUserLocation({ source = "manual" } = {}) {
    if (!navigator.geolocation) {
        $("#search-meta").textContent = "Your browser does not support live location detection.";
        hideLocationPrompt();
        return;
    }

    $("#search-meta").textContent = "Waiting for browser location permission...";
    navigator.geolocation.getCurrentPosition(
        (position) => applyUserLocation(position, source),
        (error) => {
            console.warn("Location permission failed", error);
            $("#search-meta").textContent = "Location permission was not enabled. You can still search any place manually.";
            hideLocationPrompt();
        },
        {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000,
        }
    );
}

async function applyUserLocation(position, source) {
    const lat = Number(position.coords.latitude);
    const lng = Number(position.coords.longitude);
    const accuracy = Math.round(position.coords.accuracy || 0);
    state.userLocation = { lat, lng, accuracy };

    const locationMeta = await reverseGeocode(lng, lat);
    const exactLabel = `${locationMeta.address} (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    $("#place-search").value = locationMeta.label || "My current location";
    $("#search-meta").textContent = `Current location: ${exactLabel}${accuracy ? `, accuracy about ${accuracy}m` : ""}.`;

    setWeatherTarget({
        name: locationMeta.label || "My current location",
        address: locationMeta.address || exactLabel,
        area: locationMeta.area || "Current area",
        lat,
        lng,
        source: source === "startup-prompt" ? "Browser location prompt" : "Browser location",
    });

    const applyMapTarget = () => {
        centerOnCoordinates([lng, lat], 16.8);
        addOrMoveMarker([lng, lat], { mode: "selected" });
    };

    if (state.mapReady) {
        applyMapTarget();
    } else if (state.map) {
        state.map.once("load", applyMapTarget);
    }

    setSystemStatus("Current location linked");
    hideLocationPrompt();
    runResilienceAnalysis({ silent: true });
}

function initUpload() {
    const zone = $("#upload-zone");
    const input = $("#file-input");
    const removeButton = $("#file-remove");

    zone.addEventListener("click", () => input.click());
    zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("drag-over");
        if (event.dataTransfer.files?.length) {
            handleFile(event.dataTransfer.files[0]);
        }
    });
    input.addEventListener("change", (event) => {
        if (event.target.files?.length) {
            handleFile(event.target.files[0]);
        }
    });

    removeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        clearFile();
    });
}

function handleFile(file) {
    if (!file?.name?.toLowerCase().endsWith(".csv")) {
        window.alert("Please upload a CSV dataset.");
        return;
    }

    state.selectedFile = file;
    $("#upload-zone").style.display = "none";
    $("#file-badge").style.display = "flex";
    $("#fname").textContent = file.name;
    $("#fsize").textContent = `${(file.size / 1024).toFixed(1)} KB`;
    setSystemStatus(`Dataset ready: ${file.name}`);
}

function clearFile() {
    state.selectedFile = null;
    $("#upload-zone").style.display = "block";
    $("#file-badge").style.display = "none";
    $("#file-input").value = "";
    $("#validation-box").style.display = "none";
    setSystemStatus("Scenario mode active");
}

function initSliders() {
    const sliders = [
        { input: "#sl-eq", output: "#sv-eq", format: (value) => Number(value).toFixed(1) },
        { input: "#sl-temp", output: "#sv-temp", format: (value) => Math.round(Number(value)).toString() },
        { input: "#sl-moist", output: "#sv-moist", format: (value) => Number(value).toFixed(2) },
    ];

    sliders.forEach(({ input, output, format }) => {
        const slider = $(input);
        const label = $(output);
        slider.addEventListener("input", () => {
            label.textContent = format(slider.value);
        });
    });
}

function initAIMode() {
    $$(".ai-btn").forEach((button) => {
        button.addEventListener("click", () => {
            $$(".ai-btn").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            state.aiMode = button.dataset.mode;
            if (state.analysisData?.llm_explanation) {
                renderLLMInsights(state.analysisData.llm_explanation);
            }
        });
    });
}

function initAlert() {
    $("#alert-dismiss").addEventListener("click", () => {
        $("#alert-banner").classList.remove("visible");
    });
}

function initDetailPanel() {
    $("#det-close").addEventListener("click", deselectBuilding);
}

function initRightPanel() {
    $$(".right-tab").forEach((button) => {
        button.addEventListener("click", () => {
            switchRightTab(button.dataset.rtab);
            if (state.rightTabTrayExpanded) {
                toggleRightTabTray(false);
            }
        });
    });

    $("#right-panel-toggle")?.addEventListener("click", () => {
        toggleRightPanel(!state.rightPanelCollapsed);
    });
    $("#right-tabs-menu")?.addEventListener("click", () => {
        toggleRightTabTray(!state.rightTabTrayExpanded);
    });
}

function initLeftPanel() {
    $("#left-panel-toggle")?.addEventListener("click", () => {
        toggleLeftPanel(!state.leftPanelCollapsed);
    });
}

function initWeatherPanel() {
    const [lng, lat] = DEFAULT_VIEW.center;
    setWeatherTarget({
        name: "Bengaluru command zone",
        address: "Bengaluru, Karnataka, India",
        area: "Bengaluru",
        lat,
        lng,
        source: "Default command view",
    });

    if (state.weatherInterval) {
        window.clearInterval(state.weatherInterval);
    }
    state.weatherInterval = window.setInterval(() => {
        if (state.weatherTarget) {
            fetchWeatherForTarget(state.weatherTarget, { silent: true });
        }
    }, 300000);
}

async function initSatelliteTelemetry() {
    try {
        const response = await fetch(`${API}/satellites`);
        if (!response.ok) {
            throw new Error(`Failed to fetch satellite data: ${response.statusText}`);
        }
        state.satelliteBlueprints = await response.json();
        state.satellites = state.satelliteBlueprints.map((satellite, index) => buildSatelliteSnapshot(satellite, index, Date.now()));
        state.selectedSatelliteId = state.satellites[0]?.id || null;
        seedTelemetrySeries();
        renderSatelliteTelemetry();

        if (state.satelliteInterval) {
            window.clearInterval(state.satelliteInterval);
        }
        state.satelliteInterval = window.setInterval(() => {
            tickSatelliteTelemetry();
        }, 1400);
    } catch (error) {
        console.error("Error initializing satellite telemetry:", error);
        // You could show an error message to the user here
    }
}

function tickSatelliteTelemetry() {
    const now = Date.now();
    state.satellites = state.satelliteBlueprints.map((satellite, index) => buildSatelliteSnapshot(satellite, index, now));
    pushTelemetryFrame();
    renderSatelliteTelemetry();
}

function seedTelemetrySeries() {
    state.telemetrySeries = {
        labels: [],
        satelliteHealth: [],
        networkHealth: [],
        trafficFlow: [],
    };

    for (let index = 11; index >= 0; index -= 1) {
        pushTelemetryFrame(Date.now() - index * 1400);
    }
}

function pushTelemetryFrame(timestamp = Date.now()) {
    if (!state.satellites.length) {
        return;
    }

    const series = state.telemetrySeries;
    const selectedSatellite = state.satellites.find((item) => item.id === state.selectedSatelliteId) || state.satellites[0];
    const phase = timestamp / 1000;
    const burstFactor = Math.max(0, Math.sin(phase * 0.17 + 1.2)) * 7.5;
    const meshNoise = Math.sin(phase * 0.93) * 2.4 + Math.cos(phase * 0.41) * 1.8;
    const avgHealth = clampNumber(
        averageBy(state.satellites, (satellite) => satellite.healthPct) - Math.max(0, Math.sin(phase * 0.21)) * 2.1 + meshNoise * 0.25,
        82,
        100
    );
    const networkHealth = clampNumber(
        100 - averageBy(state.satellites, (satellite) => satellite.packetLossPct) * 18 - averageBy(state.satellites, (satellite) => satellite.anomalyRisk) * 55 - burstFactor * 0.35 + meshNoise,
        52,
        100
    );
    const trafficFlow = clampNumber(
        averageBy(state.satellites, (satellite) => satellite.downlinkMbps) * 0.14 +
            (state.selectedBuilding ? 22 : 8) +
            (selectedSatellite?.status === "critical" ? -10 : selectedSatellite?.status === "warning" ? -4 : 4) +
            burstFactor * 1.4 +
            Math.max(0, Math.sin(phase * 0.48)) * 12,
        20,
        140
    );

    series.labels.push(formatTelemetryTime(timestamp));
    series.satelliteHealth.push(roundValue(avgHealth, 1));
    series.networkHealth.push(roundValue(networkHealth, 1));
    series.trafficFlow.push(roundValue(trafficFlow, 1));

    const maxPoints = 24;
    Object.keys(series).forEach((key) => {
        if (series[key].length > maxPoints) {
            series[key] = series[key].slice(-maxPoints);
        }
    });
}

function buildSatelliteSnapshot(blueprint, index, timestamp) {
    const phase = timestamp / 1000 + index * 1.73;
    const healthPct = clampNumber(blueprint.healthPct + Math.sin(phase * 0.31) * 0.9, 86, 100);
    const coveragePct = clampNumber(blueprint.coveragePct + Math.cos(phase * 0.22) * 2.2, 72, 100);
    const latencyMs = clampNumber(blueprint.latencyMs + Math.sin(phase * 0.57) * 9, 90, 240);
    const downlinkMbps = clampNumber(blueprint.downlinkMbps + Math.cos(phase * 0.43) * 28, 240, 760);
    const powerPct = clampNumber(blueprint.powerPct + Math.sin(phase * 0.26) * 2.4, 58, 100);
    const thermalC = clampNumber(blueprint.thermalC + Math.cos(phase * 0.51) * 3.1, -12, 42);
    const signalDbm = clampNumber(blueprint.signalDbm + Math.sin(phase * 0.61) * 2.1, -84, -48);
    const packetLossPct = clampNumber(blueprint.packetLossPct + Math.abs(Math.cos(phase * 0.48)) * 0.18, 0.05, 2.4);
    const anomalyRisk = clampNumber(blueprint.anomalyRisk + Math.abs(Math.sin(phase * 0.33)) * 0.08, 0.03, 0.68);
    const passProgress = ((phase * 7.2) % 100 + 100) % 100;

    let status = "nominal";
    if (healthPct < 90 || anomalyRisk > 0.32 || packetLossPct > 1.0) {
        status = "warning";
    }
    if (healthPct < 87 || anomalyRisk > 0.48 || packetLossPct > 1.5) {
        status = "critical";
    }

    return {
        ...blueprint,
        healthPct,
        coveragePct,
        latencyMs,
        downlinkMbps,
        powerPct,
        thermalC,
        signalDbm,
        packetLossPct,
        anomalyRisk,
        passProgress,
        status,
        nextPassMinutes: Math.max(2, Math.round(18 + index * 4 + (100 - passProgress) * 0.22)),
        uplinkLock: status === "critical" ? "Degraded" : status === "warning" ? "Conditional" : "Locked",
    };
}

function renderSatelliteTelemetry() {
    renderSatelliteHero();
    renderSatelliteCharts();
    renderSatelliteRadar();
    renderSatelliteList();
    renderSatelliteDetail();
}

function renderSatelliteHero() {
    const node = $("#satellite-hero-metrics");
    if (!node || !state.satellites.length) {
        return;
    }

    const nominal = state.satellites.filter((satellite) => satellite.status === "nominal").length;
    const coverage = averageBy(state.satellites, (satellite) => satellite.coveragePct).toFixed(1);
    const latency = Math.round(averageBy(state.satellites, (satellite) => satellite.latencyMs));

    node.innerHTML = `
        ${renderSatelliteHeroChip("Active nodes", `${state.satellites.length}`)}
        ${renderSatelliteHeroChip("Nominal", `${nominal}/${state.satellites.length}`)}
        ${renderSatelliteHeroChip("Coverage", `${coverage}%`)}
        ${renderSatelliteHeroChip("Latency", `${latency} ms`)}
        ${renderSatelliteHeroChip("Scan queue", `${state.selectedBuilding ? "Hot" : "Standby"}`)}
        ${renderSatelliteHeroChip("Telemetry", "Live")}
    `;
}

function renderSatelliteHeroChip(label, value) {
    return `
        <div class="sat-hero-chip">
            <span class="sat-hero-chip-label">${escapeHtml(label)}</span>
            <span class="sat-hero-chip-value">${escapeHtml(value)}</span>
        </div>
    `;
}

function renderSatelliteRadar() {
    const node = $("#satellite-radar");
    if (!node) {
        return;
    }

    node.innerHTML = state.satellites.map((satellite) => `
        <div
            class="sat-orbit-node ${satellite.status}"
            title="${escapeHtml(`${satellite.name}: ${formatSatelliteStatus(satellite.status)} - ${describeSatelliteStatus(satellite.status)}`)}"
            style="left:${satellite.orbitalSlot.x}%; top:${satellite.orbitalSlot.y}%;"
        ></div>
    `).join("");
}

function renderSatelliteList() {
    const node = $("#satellite-list");
    if (!node) {
        return;
    }

    node.innerHTML = state.satellites.map((satellite) => `
        <button class="sat-item ${satellite.id === state.selectedSatelliteId ? "active expanded" : ""}" type="button" data-satellite-id="${satellite.id}">
            <div class="sat-item-head">
                <span class="sat-item-title">${escapeHtml(satellite.name)}</span>
                <span class="sat-status ${satellite.status}" title="${escapeHtml(describeSatelliteStatus(satellite.status))}">${escapeHtml(formatSatelliteStatus(satellite.status))}</span>
            </div>
            <div class="mini-note">${escapeHtml(satellite.mission)}</div>
            <div class="sat-status-note">${escapeHtml(describeSatelliteStatus(satellite.status))}</div>
            <div class="sat-item-meta">
                <div>
                    <span class="sat-item-metric-label">Coverage</span>
                    <span class="sat-item-metric-value">${satellite.coveragePct.toFixed(1)}%</span>
                </div>
                <div>
                    <span class="sat-item-metric-label">Latency</span>
                    <span class="sat-item-metric-value">${Math.round(satellite.latencyMs)} ms</span>
                </div>
                <div>
                    <span class="sat-item-metric-label">Health</span>
                    <span class="sat-item-metric-value">${satellite.healthPct.toFixed(1)}%</span>
                </div>
            </div>
            <div class="sat-item-expanded">
                <div class="sat-item-expanded-grid">
                    <div>
                        <span class="sat-item-metric-label">Beam target</span>
                        <span class="sat-item-metric-value">${escapeHtml(satellite.beamTarget)}</span>
                    </div>
                    <div>
                        <span class="sat-item-metric-label">Downlink</span>
                        <span class="sat-item-metric-value">${satellite.downlinkMbps.toFixed(0)} Mbps</span>
                    </div>
                    <div>
                        <span class="sat-item-metric-label">Next pass</span>
                        <span class="sat-item-metric-value">${satellite.nextPassMinutes} min</span>
                    </div>
                    <div>
                        <span class="sat-item-metric-label">Uplink lock</span>
                        <span class="sat-item-metric-value">${escapeHtml(satellite.uplinkLock)}</span>
                    </div>
                </div>
                <div class="sat-item-advisory">${escapeHtml(satellite.advisory)}</div>
            </div>
        </button>
    `).join("");

    $$(".sat-item").forEach((button) => {
        button.addEventListener("click", () => {
            state.selectedSatelliteId = button.dataset.satelliteId;
            renderSatelliteList();
            renderSatelliteDetail();
        });
    });

}

function renderSatelliteDetail() {
    const node = $("#satellite-detail");
    if (!node) {
        return;
    }

    const satellite = state.satellites.find((item) => item.id === state.selectedSatelliteId) || state.satellites[0];
    if (!satellite) {
        node.innerHTML = `<div class="right-empty"><div><i class="fas fa-satellite"></i><p>No satellite telemetry available.</p></div></div>`;
        return;
    }

    const selectedBuildingLine = state.selectedBuilding
        ? `${state.selectedBuilding.lngLat.lat.toFixed(4)}, ${state.selectedBuilding.lngLat.lng.toFixed(4)}`
        : "No active building scan target";

    node.innerHTML = `
        <div class="sat-detail-head">
            <div>
                <div class="sat-detail-title">${escapeHtml(satellite.name)}</div>
                <div class="sat-detail-sub">${escapeHtml(satellite.orbitClass)} · ${escapeHtml(satellite.mission)}</div>
            </div>
            <span class="sat-status ${satellite.status}" title="${escapeHtml(describeSatelliteStatus(satellite.status))}">${escapeHtml(formatSatelliteStatus(satellite.status))}</span>
        </div>
        <div class="sat-detail-status-text">${escapeHtml(describeSatelliteStatus(satellite.status))}</div>
        <div class="sat-detail-grid">
            ${renderSatelliteDetailCard("Beam target", satellite.beamTarget)}
            ${renderSatelliteDetailCard("Health", `${satellite.healthPct.toFixed(1)}%`)}
            ${renderSatelliteDetailCard("Altitude", `${satellite.altitudeKm.toFixed(0)} km`)}
            ${renderSatelliteDetailCard("Velocity", `${satellite.velocityKps.toFixed(2)} km/s`)}
            ${renderSatelliteDetailCard("Downlink", `${satellite.downlinkMbps.toFixed(0)} Mbps`)}
            ${renderSatelliteDetailCard("Latency", `${Math.round(satellite.latencyMs)} ms`)}
            ${renderSatelliteDetailCard("Power reserve", `${satellite.powerPct.toFixed(1)}%`)}
            ${renderSatelliteDetailCard("Thermal state", `${satellite.thermalC.toFixed(1)} °C`)}
            ${renderSatelliteDetailCard("Signal", `${satellite.signalDbm.toFixed(1)} dBm`)}
            ${renderSatelliteDetailCard("Packet loss", `${satellite.packetLossPct.toFixed(2)}%`)}
            ${renderSatelliteDetailCard("Coverage", `${satellite.coveragePct.toFixed(1)}%`)}
            ${renderSatelliteDetailCard("Next pass", `${satellite.nextPassMinutes} min`)}
            ${renderSatelliteDetailCard("Uplink lock", satellite.uplinkLock)}
            ${renderSatelliteDetailCard("Anomaly risk", `${(satellite.anomalyRisk * 100).toFixed(1)}%`)}
            ${renderSatelliteDetailCard("Inclination", `${satellite.inclinationDeg.toFixed(1)}°`)}
            ${renderSatelliteDetailCard("Building scan target", selectedBuildingLine)}
        </div>
        <div class="sat-detail-section">
            <div class="sat-detail-section-title">Mission advisory</div>
            <div class="sat-detail-text">${escapeHtml(satellite.advisory)}</div>
        </div>
        <div class="sat-detail-section">
            <div class="sat-detail-section-title">Pass progress</div>
            <div class="sat-detail-text">Current orbital pass is ${satellite.passProgress.toFixed(0)}% complete with telemetry uplink ${escapeHtml(satellite.uplinkLock.toLowerCase())} for StructureX ground control.</div>
        </div>
    `;
}

function renderSatelliteCharts() {
    if (!withPlotly("satelliteCharts", renderSatelliteCharts)) {
        return;
    }

    const { labels, satelliteHealth, networkHealth, trafficFlow } = state.telemetrySeries;
    if (!labels.length) {
        return;
    }

    renderSystemStatusChart(labels, satelliteHealth, networkHealth);
    renderNetworkHealthChart(labels, networkHealth);
    renderTrafficFlowChart(labels, trafficFlow);

    const latestHealth = satelliteHealth[satelliteHealth.length - 1];
    const latestNetwork = networkHealth[networkHealth.length - 1];
    const latestTraffic = trafficFlow[trafficFlow.length - 1];
    $("#sat-health-status").textContent = latestHealth >= 94 ? "ACTIVE" : latestHealth >= 88 ? "WATCH" : "DEGRADED";
    $("#sat-network-status").textContent = `${latestNetwork.toFixed(1)}%`;
    $("#sat-traffic-status").textContent = `${latestTraffic >= 90 ? "OVERLOADED" : latestTraffic >= 62 ? "BUSY" : "NORMAL"} (${Math.round(latestTraffic * 142)} /hr)`;
}

function renderSystemStatusChart(labels, satelliteHealth, networkHealth) {
    const subsystemLoad = satelliteHealth.map((value, index) =>
        roundValue((value * 0.56 + networkHealth[index] * 0.44) - 8 + Math.sin(index * 0.6) * 5, 1)
    );
    const latestLabel = labels[labels.length - 1];
    const latestHealth = satelliteHealth[satelliteHealth.length - 1];
    const latestSubsystem = subsystemLoad[subsystemLoad.length - 1];

    Plotly.react(
        "satellite-chart-health",
        [
            {
                type: "scatter",
                mode: "lines",
                x: labels,
                y: satelliteHealth,
                line: { color: "#57e3ff", width: 2.8, shape: "spline", smoothing: 0.9 },
                fill: "tozeroy",
                fillcolor: "rgba(87,227,255,0.24)",
                hovertemplate: "System health: %{y:.1f}%<extra></extra>",
            },
            {
                type: "scatter",
                mode: "markers",
                x: [latestLabel],
                y: [latestHealth],
                marker: { color: "#8df4ff", size: 9, line: { color: "#ffffff", width: 1 } },
                hovertemplate: "Live health: %{y:.1f}%<extra></extra>",
            },
            {
                type: "scatter",
                mode: "lines",
                x: labels,
                y: subsystemLoad,
                line: { color: "#b06cff", width: 2.2, shape: "spline", smoothing: 0.9 },
                fill: "tonexty",
                fillcolor: "rgba(176,108,255,0.14)",
                hovertemplate: "Subsystem load: %{y:.1f}%<extra></extra>",
            },
            {
                type: "scatter",
                mode: "markers",
                x: [latestLabel],
                y: [latestSubsystem],
                marker: { color: "#d8b4fe", size: 7 },
                hovertemplate: "Subsystem live: %{y:.1f}%<extra></extra>",
            },
        ],
        buildTelemetryChartLayout({
            yaxisTitle: "%",
            range: [0, 100],
            transitionMs: 700,
            shapes: [
                {
                    type: "line",
                    xref: "paper",
                    x0: 0,
                    x1: 1,
                    y0: 85,
                    y1: 85,
                    line: { color: "rgba(87,227,255,0.18)", width: 1, dash: "dot" },
                },
            ],
        }),
        { responsive: true, displayModeBar: false }
    );
}

function renderNetworkHealthChart(labels, networkHealth) {
    const realTimeMesh = networkHealth.map((value, index) =>
        roundValue(value - 6 + Math.sin(index * 0.82) * 4.4, 1)
    );
    const latestLabel = labels[labels.length - 1];
    const latestNetwork = networkHealth[networkHealth.length - 1];

    Plotly.react(
        "satellite-chart-network",
        [
            {
                type: "scatter",
                mode: "lines",
                x: labels,
                y: realTimeMesh,
                line: { color: "#9a6cff", width: 1.8, shape: "spline", smoothing: 0.8 },
                hovertemplate: "Real-time mesh: %{y:.1f}%<extra></extra>",
            },
            {
                type: "scatter",
                mode: "lines",
                x: labels,
                y: networkHealth,
                line: { color: "#57e3ff", width: 2.6, shape: "spline", smoothing: 0.9 },
                fill: "tozeroy",
                fillcolor: "rgba(87,227,255,0.18)",
                hovertemplate: "Network health: %{y:.1f}%<extra></extra>",
            },
            {
                type: "scatter",
                mode: "markers",
                x: [latestLabel],
                y: [latestNetwork],
                marker: { color: "#8df4ff", size: 8, line: { color: "#ffffff", width: 1 } },
                hovertemplate: "Network live: %{y:.1f}%<extra></extra>",
            },
        ],
        buildTelemetryChartLayout({
            yaxisTitle: "%",
            range: [0, 100],
            transitionMs: 650,
            annotations: [
                {
                    x: 0.02,
                    y: 1.1,
                    xref: "paper",
                    yref: "paper",
                    text: "REAL TIME HEALTH",
                    showarrow: false,
                    font: { size: 9, color: "#c8d6e5" },
                    xanchor: "left",
                },
                {
                    x: 0.98,
                    y: 1.1,
                    xref: "paper",
                    yref: "paper",
                    text: "Real-time",
                    showarrow: false,
                    font: { size: 9, color: "#57e3ff" },
                    xanchor: "right",
                },
            ],
            shapes: [
                {
                    type: "rect",
                    xref: "paper",
                    yref: "y",
                    x0: 0,
                    x1: 1,
                    y0: 92,
                    y1: 100,
                    fillcolor: "rgba(87,227,255,0.06)",
                    line: { width: 0 },
                },
            ],
        }),
        { responsive: true, displayModeBar: false }
    );
}

function renderTrafficFlowChart(labels, trafficFlow) {
    const recent = trafficFlow.slice(-10);
    const xTicks = labels.slice(-recent.length);
    const heatmap = buildTrafficHeatmap(recent);
    const latestTraffic = recent[recent.length - 1];

    Plotly.react(
        "satellite-chart-traffic",
        [
            {
                type: "heatmap",
                z: heatmap,
                x: recent.map((_, index) => index + 1),
                y: TRAFFIC_LANE_LABELS,
                xaxis: "x",
                yaxis: "y",
                colorscale: [
                    [0, "#1b2560"],
                    [0.18, "#3550d8"],
                    [0.38, "#3fc5ff"],
                    [0.58, "#7df0c8"],
                    [0.78, "#facc15"],
                    [1, "#ef4444"],
                ],
                showscale: false,
                hovertemplate: "%{y}<br>Traffic intensity: %{z:.1f}<extra></extra>",
            },
            {
                type: "bar",
                x: xTicks,
                y: recent.map((value) => Math.round(value * 22)),
                xaxis: "x2",
                yaxis: "y2",
                marker: {
                    color: recent.map((value) => value > 92 ? "#ef4444" : value > 72 ? "#57e3ff" : "#3550d8"),
                },
                hovertemplate: "Traffic volume: %{y} units<extra></extra>",
            },
        ],
        {
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            margin: { t: 8, r: 10, b: 24, l: 70 },
            font: {
                family: "'Inter', sans-serif",
                color: THEME.text,
                size: 10,
            },
            transition: { duration: 700, easing: "cubic-in-out" },
            annotations: [
                {
                    x: 0.98,
                    y: 1.1,
                    xref: "paper",
                    yref: "paper",
                    text: `Live ${Math.round(latestTraffic * 22)} units`,
                    showarrow: false,
                    font: { size: 9, color: latestTraffic > 92 ? "#fca5a5" : "#57e3ff" },
                    xanchor: "right",
                },
            ],
            xaxis: {
                domain: [0, 1],
                anchor: "y",
                showticklabels: false,
                showgrid: false,
                zeroline: false,
                fixedrange: true,
            },
            yaxis: {
                domain: [0.46, 1],
                showgrid: false,
                zeroline: false,
                tickfont: { size: 8, color: "#cbd5e1" },
                fixedrange: true,
            },
            xaxis2: {
                domain: [0, 1],
                anchor: "y2",
                tickfont: { size: 8, color: THEME.muted },
                showgrid: false,
                zeroline: false,
                fixedrange: true,
            },
            yaxis2: {
                domain: [0, 0.28],
                tickfont: { size: 8, color: THEME.muted },
                gridcolor: "rgba(255,255,255,0.05)",
                zerolinecolor: "rgba(255,255,255,0.05)",
                fixedrange: true,
            },
        },
        { responsive: true, displayModeBar: false }
    );
}

function buildTrafficHeatmap(recent) {
    const rows = 6;
    return Array.from({ length: rows }, (_, rowIndex) =>
        recent.map((value, columnIndex) =>
            roundValue(
                clampNumber(
                    value * (0.62 + rowIndex * 0.12) +
                        Math.sin((rowIndex + 1) * (columnIndex + 1) * 0.8) * 8,
                    18,
                    100
                ),
                1
            )
        )
    );
}

function buildTelemetryChartLayout({ yaxisTitle, range, transitionMs = 600, annotations = [], shapes = [] }) {
    return {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 10, r: 12, b: 24, l: 30 },
        showlegend: false,
        transition: { duration: transitionMs, easing: "cubic-in-out" },
        hovermode: "x unified",
        hoverlabel: {
            bgcolor: "rgba(7, 14, 28, 0.96)",
            bordercolor: "rgba(87,227,255,0.24)",
            font: { family: "'Inter', sans-serif", size: 10, color: "#f8fafc" },
        },
        font: {
            family: "'Inter', sans-serif",
            color: THEME.text,
            size: 10,
        },
        xaxis: {
            color: THEME.muted,
            gridcolor: "rgba(255,255,255,0.05)",
            zerolinecolor: "rgba(255,255,255,0.05)",
            tickfont: { size: 8 },
            fixedrange: true,
            showspikes: true,
            spikemode: "across",
            spikecolor: "rgba(87,227,255,0.22)",
            spikethickness: 1,
        },
        yaxis: {
            title: yaxisTitle,
            color: THEME.muted,
            gridcolor: "rgba(255,255,255,0.05)",
            zerolinecolor: "rgba(255,255,255,0.05)",
            range,
            fixedrange: true,
            showspikes: true,
            spikecolor: "rgba(87,227,255,0.18)",
        },
        annotations,
        shapes,
    };
}

function formatSatelliteStatus(status) {
    return SATELLITE_STATUS_HELP[status]?.label || "Unknown";
}

function describeSatelliteStatus(status) {
    return SATELLITE_STATUS_HELP[status]?.text || "Telemetry status is not available.";
}

function renderSatelliteDetailCard(label, value) {
    return `
        <div class="sat-detail-card">
            <span class="sat-detail-card-label">${escapeHtml(label)}</span>
            <span class="sat-detail-card-value">${escapeHtml(String(value))}</span>
        </div>
    `;
}

function averageBy(items, selector) {
    if (!items.length) {
        return 0;
    }
    return items.reduce((total, item) => total + selector(item), 0) / items.length;
}

function setWeatherTarget(target) {
    if (target?.lat === undefined || target?.lng === undefined || target?.lat === null || target?.lng === null) {
        return;
    }

    const normalized = {
        name: target.name || target.area || "Selected area",
        address: target.address || target.name || "Selected area",
        area: target.area || target.name || "Selected area",
        lat: Number(target.lat),
        lng: Number(target.lng),
        source: target.source || "Map target",
    };

    const current = state.weatherTarget;
    const changed = !current ||
        Math.abs(current.lat - normalized.lat) > 0.0001 ||
        Math.abs(current.lng - normalized.lng) > 0.0001 ||
        current.address !== normalized.address;

    state.weatherTarget = normalized;
    if (changed) {
        state.weatherData = null;
    }
    renderWeatherPanel();

    if (changed) {
        fetchWeatherForTarget(normalized);
    }
}

async function fetchWeatherForTarget(target, options = {}) {
    if (!target) {
        return;
    }

    state.activeWeatherRequestId += 1;
    const requestId = state.activeWeatherRequestId;
    state.weatherLoading = true;
    if (!options.silent) {
        renderWeatherPanel();
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(target.lat));
    url.searchParams.set("longitude", String(target.lng));
    url.searchParams.set(
        "current",
        [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
            "surface_pressure",
            "pressure_msl",
            "cloud_cover",
            "visibility",
        ].join(",")
    );
    url.searchParams.set(
        "hourly",
        [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation_probability",
            "wind_speed_10m",
            "cloud_cover",
        ].join(",")
    );
    url.searchParams.set("forecast_hours", "24");
    url.searchParams.set("timezone", "auto");

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Weather request failed (${response.status})`);
        }

        const payload = await response.json();
        if (requestId !== state.activeWeatherRequestId) {
            return;
        }

        state.weatherData = {
            target,
            payload,
            fetchedAt: Date.now(),
        };
        state.weatherLoading = false;
        renderWeatherPanel();
    } catch (error) {
        if (requestId !== state.activeWeatherRequestId) {
            return;
        }
        console.error(error);
        state.weatherLoading = false;
        state.weatherData = {
            target,
            error: error.message,
            fetchedAt: Date.now(),
        };
        renderWeatherPanel();
    }
}

function renderWeatherPanel() {
    const targetLabel = $("#weather-target-label");
    const currentNode = $("#weather-current");
    const gridNode = $("#weather-grid");
    const footnoteNode = $("#weather-footnote");
    if (!targetLabel || !currentNode || !gridNode || !footnoteNode) {
        return;
    }

    const target = state.weatherTarget;
    targetLabel.textContent = target
        ? `${target.address} · ${target.lat.toFixed(4)}, ${target.lng.toFixed(4)}`
        : "Awaiting location target...";

    if (!target) {
        currentNode.innerHTML = `<div class="right-empty"><div><i class="fas fa-cloud-sun"></i><p>Select a place or building to retrieve live weather.</p></div></div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = "";
        return;
    }

    if (state.weatherLoading && !state.weatherData) {
        currentNode.innerHTML = `<div class="weather-loading">Fetching live conditions for ${escapeHtml(target.area)}...</div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = "";
        return;
    }

    if (state.weatherData?.error) {
        currentNode.innerHTML = `<div class="weather-loading">Live weather is temporarily unavailable for ${escapeHtml(target.area)}.</div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = `<div class="weather-footnote-text">Source request failed: ${escapeHtml(state.weatherData.error)}</div>`;
        return;
    }

    const payload = state.weatherData?.payload;
    const current = payload?.current;
    const hourly = payload?.hourly;
    if (!current || !hourly) {
        currentNode.innerHTML = `<div class="weather-loading">Waiting for live weather feed...</div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = "";
        return;
    }

    const weatherLabel = weatherCodeToLabel(current.weather_code);
    const observedTime = formatTimestamp(current.time, payload.timezone_abbreviation || payload.timezone);
    currentNode.innerHTML = `
        <div class="weather-current-main">
            <div>
                <div class="weather-current-label">Current conditions</div>
                <div class="weather-current-temp">${Number(current.temperature_2m).toFixed(1)}°C</div>
                <div class="weather-current-desc">${escapeHtml(weatherLabel)} · feels like ${Number(current.apparent_temperature).toFixed(1)}°C</div>
            </div>
            <div class="weather-current-meta">
                <span class="weather-meta-chip">${escapeHtml(target.source)}</span>
                <span class="weather-meta-chip">Observed ${escapeHtml(observedTime)}</span>
            </div>
        </div>
    `;

    const detailCards = [
        ["Humidity", `${Number(current.relative_humidity_2m).toFixed(0)}%`],
        ["Wind speed", `${Number(current.wind_speed_10m).toFixed(1)} km/h`],
        ["Wind gusts", `${Number(current.wind_gusts_10m).toFixed(1)} km/h`],
        ["Wind direction", formatWindDirection(current.wind_direction_10m)],
        ["Pressure", `${Number(current.pressure_msl || current.surface_pressure).toFixed(0)} hPa`],
        ["Cloud cover", `${Number(current.cloud_cover).toFixed(0)}%`],
        ["Visibility", `${(Number(current.visibility) / 1000).toFixed(1)} km`],
        ["Precipitation", `${Number(current.precipitation).toFixed(1)} mm`],
    ];

    gridNode.innerHTML = detailCards.map(([label, value]) => `
        <div class="weather-card glass">
            <span class="weather-card-label">${escapeHtml(label)}</span>
            <span class="weather-card-value">${escapeHtml(value)}</span>
        </div>
    `).join("");

    footnoteNode.innerHTML = `
        <div class="weather-footnote-text">
            Live weather source: Open-Meteo forecast/current feed. Target timezone: ${escapeHtml(payload.timezone || "auto")}. Elevation: ${Number(payload.elevation || 0).toFixed(0)} m.
        </div>
    `;
    updatedNode.textContent = `Updated ${formatRelativeTime(state.weatherData.fetchedAt)}`;

    renderWeatherChart(hourly);
}

function renderWeatherChart(hourly) {
    if (!withPlotly("weatherChart", () => renderWeatherChart(hourly))) {
        return;
    }

    const times = (hourly.time || []).slice(0, 24).map((value) => formatHourLabel(value));
    const temp = (hourly.temperature_2m || []).slice(0, 24);
    const wind = (hourly.wind_speed_10m || []).slice(0, 24);
    const precip = (hourly.precipitation_probability || []).slice(0, 24);

    Plotly.react(
        "weather-chart-hourly",
        [
            {
                type: "scatter",
                mode: "lines",
                x: times,
                y: temp,
                name: "Temp",
                line: { color: "#3b82f6", width: 2.4 },
                hovertemplate: "Temp: %{y:.1f}°C<extra></extra>",
            },
            {
                type: "scatter",
                mode: "lines",
                x: times,
                y: wind,
                name: "Wind",
                line: { color: "#cbd5e1", width: 2, dash: "dot" },
                yaxis: "y2",
                hovertemplate: "Wind: %{y:.1f} km/h<extra></extra>",
            },
            {
                type: "bar",
                x: times,
                y: precip,
                name: "Precip %",
                marker: { color: "rgba(96,165,250,0.3)" },
                opacity: 0.72,
                yaxis: "y3",
                hovertemplate: "Precip probability: %{y:.0f}%<extra></extra>",
            },
        ],
        {
            ...buildMiniChartLayout(),
            margin: { t: 8, r: 42, b: 32, l: 36 },
            barmode: "overlay",
            legend: {
                orientation: "h",
                x: 0,
                y: 1.18,
                font: { family: "'Inter', sans-serif", size: 10, color: THEME.text },
            },
            yaxis: {
                title: "°C",
                color: THEME.muted,
                gridcolor: THEME.grid,
                zerolinecolor: THEME.grid,
            },
            yaxis2: {
                title: "km/h",
                overlaying: "y",
                side: "right",
                color: THEME.muted,
            },
            yaxis3: {
                overlaying: "y",
                side: "right",
                position: 0.96,
                range: [0, 100],
                showgrid: false,
                showticklabels: false,
            },
        },
        { responsive: true, displayModeBar: false }
    );
}

function renderMiniTelemetryChart(containerId, config) {
    if (!withPlotly(`miniTelemetry-${containerId}`, () => renderMiniTelemetryChart(containerId, config))) {
        return;
    }

    Plotly.react(
        containerId,
        [
            {
                type: "scatter",
                mode: "lines",
                x: config.x,
                y: config.y,
                line: {
                    color: config.color,
                    width: 2.3,
                    shape: "spline",
                    smoothing: 0.8,
                },
                fill: "tozeroy",
                fillcolor: config.fill,
                hovertemplate: `${config.label}: %{y:.1f}${config.suffix}<extra></extra>`,
            },
        ],
        {
            ...buildMiniChartLayout(),
            yaxis: {
                title: config.yaxisTitle,
                color: THEME.muted,
                gridcolor: THEME.grid,
                zerolinecolor: THEME.grid,
            },
        },
        { responsive: true, displayModeBar: false }
    );
}

function renderWeatherPanel() {
    const targetLabel = $("#weather-target-label");
    const currentNode = $("#weather-current");
    const gridNode = $("#weather-grid");
    const footnoteNode = $("#weather-footnote");
    if (!targetLabel || !currentNode || !gridNode || !footnoteNode) {
        return;
    }

    const target = state.weatherTarget;
    targetLabel.textContent = target
        ? `${target.address} · ${target.lat.toFixed(4)}, ${target.lng.toFixed(4)}`
        : "Awaiting location target...";

    if (!target) {
        currentNode.innerHTML = `<div class="right-empty"><div><i class="fas fa-cloud-sun"></i><p>Select a place or building to retrieve live weather.</p></div></div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = "";
        return;
    }

    if (state.weatherLoading && !state.weatherData) {
        currentNode.innerHTML = `<div class="weather-loading">Fetching live conditions for ${escapeHtml(target.area)}...</div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = "";
        return;
    }

    if (state.weatherData?.error) {
        currentNode.innerHTML = `<div class="weather-loading">Live weather is temporarily unavailable for ${escapeHtml(target.area)}.</div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = `<div class="weather-footnote-text">Source request failed: ${escapeHtml(state.weatherData.error)}</div>`;
        return;
    }

    const payload = state.weatherData?.payload;
    const current = payload?.current;
    if (!current) {
        currentNode.innerHTML = `<div class="weather-loading">Waiting for live weather feed...</div>`;
        gridNode.innerHTML = "";
        footnoteNode.innerHTML = "";
        return;
    }

    const weatherLabel = weatherCodeToLabel(current.weather_code);
    const observedTime = formatTimestamp(current.time, payload.timezone_abbreviation || payload.timezone);
    currentNode.innerHTML = `
        <div class="weather-current-main">
            <div>
                <div class="weather-current-label">Current conditions</div>
                <div class="weather-current-temp">${Number(current.temperature_2m).toFixed(1)}°C</div>
                <div class="weather-current-desc">${escapeHtml(weatherLabel)} · feels like ${Number(current.apparent_temperature).toFixed(1)}°C</div>
            </div>
            <div class="weather-current-meta">
                <span class="weather-meta-chip">${escapeHtml(target.source)}</span>
                <span class="weather-meta-chip">Observed ${escapeHtml(observedTime)}</span>
            </div>
        </div>
    `;

    const detailCards = [
        ["Humidity", `${Number(current.relative_humidity_2m).toFixed(0)}%`],
        ["Wind speed", `${Number(current.wind_speed_10m).toFixed(1)} km/h`],
        ["Wind gusts", `${Number(current.wind_gusts_10m).toFixed(1)} km/h`],
        ["Wind direction", formatWindDirection(current.wind_direction_10m)],
        ["Pressure", `${Number(current.pressure_msl || current.surface_pressure).toFixed(0)} hPa`],
        ["Cloud cover", `${Number(current.cloud_cover).toFixed(0)}%`],
        ["Visibility", `${(Number(current.visibility) / 1000).toFixed(1)} km`],
        ["Precipitation", `${Number(current.precipitation).toFixed(1)} mm`],
    ];

    gridNode.innerHTML = detailCards.map(([label, value]) => `
        <div class="weather-card glass">
            <span class="weather-card-label">${escapeHtml(label)}</span>
            <span class="weather-card-value">${escapeHtml(value)}</span>
        </div>
    `).join("");

    footnoteNode.innerHTML = `
        <div class="weather-footnote-text">
            Live weather source: Open-Meteo forecast/current feed. Target timezone: ${escapeHtml(payload.timezone || "auto")}. Elevation: ${Number(payload.elevation || 0).toFixed(0)} m. Last updated ${escapeHtml(formatRelativeTime(state.weatherData.fetchedAt))}.
        </div>
    `;
}

function buildMiniChartLayout() {
    return {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 8, r: 12, b: 26, l: 36 },
        showlegend: false,
        font: {
            family: "'Inter', sans-serif",
            color: THEME.text,
            size: 10,
        },
        xaxis: {
            color: THEME.muted,
            gridcolor: THEME.grid,
            zerolinecolor: THEME.grid,
            tickfont: { size: 9 },
        },
    };
}

function renderEmptyPlot(containerId, message) {
    const node = document.getElementById(containerId);
    if (!node) {
        return;
    }
    if (window.Plotly && node.data) {
        Plotly.purge(node);
    }
    node.innerHTML = `<div class="chart-empty">${escapeHtml(message)}</div>`;
}

function roundValue(value, digits = 1) {
    return Number(Number(value).toFixed(digits));
}

function formatTelemetryTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatHourLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).slice(11, 16);
    }
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTimestamp(value, timezone) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }
    const local = date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    return timezone ? `${local} ${timezone}` : local;
}

function formatRelativeTime(timestamp) {
    if (!timestamp) {
        return "just now";
    }
    const diffSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) {
        return `${diffSeconds}s ago`;
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }
    const diffHours = Math.round(diffMinutes / 60);
    return `${diffHours}h ago`;
}

function weatherCodeToLabel(code) {
    return WEATHER_CODE_LABELS[Number(code)] || "Unknown conditions";
}

function formatWindDirection(degrees) {
    const value = Number(degrees);
    if (!Number.isFinite(value)) {
        return "Unavailable";
    }

    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round((((value % 360) + 360) % 360) / 45) % directions.length;
    return `${directions[index]} (${Math.round(value)}°)`;
}

function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function switchRightTab(tab) {
    state.activeRightTab = tab;
    $$(".right-tab").forEach((button) => {
        button.classList.toggle("active", button.dataset.rtab === tab);
    });
    $$(".right-page").forEach((page) => {
        page.classList.toggle("active", page.id === `rpage-${tab}`);
    });
    if (tab === "resilience" && !state.resilienceData && !state.resilienceLoading) {
        runResilienceAnalysis({ silent: true });
    }
}

function renderResiliencePanel() {
    const node = $("#capability-shell");
    if (!node) {
        return;
    }

    if (state.resilienceLoading) {
        node.innerHTML = `
            <section class="resilience-hero glass">
                <div class="sat-eyebrow">PHASE 1 RESILIENCE</div>
                <h3 class="sat-title">Computed hazard and planning assessment</h3>
                <p class="sat-subtitle">Building multi-hazard layers, cascading dependency impacts, role-based response views, and action plans from the active scenario.</p>
            </section>
            <section class="resilience-controls glass">
                ${renderResilienceControlBar(true)}
            </section>
            <section class="capability-section glass">
                <div class="right-empty">
                    <div>
                        <i class="fas fa-wave-pulse"></i>
                        <p>Computing multi-hazard, cascade, planning, and action-plan outputs...</p>
                    </div>
                </div>
            </section>
        `;
        bindResilienceControls();
        return;
    }

    if (!state.resilienceData) {
        node.innerHTML = `
            <section class="resilience-hero glass">
                <div class="sat-eyebrow">PHASE 1 RESILIENCE</div>
                <h3 class="sat-title">Functional resilience intelligence</h3>
                <p class="sat-subtitle">Run a computed resilience assessment for the active location, current scenario sliders, and selected response role.</p>
            </section>
            <section class="resilience-controls glass">
                ${renderResilienceControlBar(false)}
            </section>
            <section class="capability-section glass">
                <div class="right-empty">
                    <div>
                        <i class="fas fa-layer-group"></i>
                        <p>No resilience assessment yet. Run the module to generate hazards, cascades, role dashboards, stress tests, retrofit priorities, code gaps, and an emergency action plan.</p>
                    </div>
                </div>
            </section>
        `;
        bindResilienceControls();
        return;
    }

    const data = state.resilienceData;
    const selectedRole = data.role_dashboards[state.resilienceRole] || data.role_dashboards.executive;

    node.innerHTML = `
        <section class="resilience-hero glass">
            <div class="sat-eyebrow">PHASE 1 RESILIENCE</div>
            <h3 class="sat-title">${escapeHtml(data.overview.location_name.replaceAll("_", " "))}</h3>
            <p class="sat-subtitle">${escapeHtml(data.overview.asset_type)} under ${escapeHtml(data.overview.top_hazard)} watch with live role-driven response planning.</p>
            <div class="resilience-chip-grid">
                ${renderResilienceHeroChip("Risk", `${Number(data.overview.risk_score).toFixed(1)} / 100`)}
                ${renderResilienceHeroChip("Category", data.overview.risk_category)}
                ${renderResilienceHeroChip("Role", state.resilienceRole.replaceAll("_", " "))}
                ${renderResilienceHeroChip("Cascade", data.overview.cascade_status)}
            </div>
        </section>
        <section class="resilience-controls glass">
            ${renderResilienceControlBar(false)}
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-triangle-exclamation"></i></div>
                <div>
                    <div class="capability-kicker">Multi-Hazard Integration</div>
                    <h4 class="capability-title">Active hazard layers</h4>
                    <p class="capability-summary">Computed overlays for the live scenario and selected location.</p>
                </div>
            </div>
            <div class="capability-grid">
                ${data.hazard_layers.map((hazard) => `
                    <article class="capability-card capability-card-strong">
                        <div class="capability-card-top">
                            <span class="capability-id">${escapeHtml(hazard.id)}</span>
                            <span class="capability-chip ${riskChipClass(hazard.score)}">${escapeHtml(hazard.status)}</span>
                        </div>
                        <h5 class="capability-card-title">${escapeHtml(hazard.title)}</h5>
                        <div class="resilience-metric-row">
                            <span class="resilience-metric-label">Hazard score</span>
                            <span class="resilience-metric-value">${Number(hazard.score).toFixed(1)}</span>
                        </div>
                        <div class="capability-points">
                            <div class="capability-point"><strong>Signal:</strong> ${escapeHtml(hazard.signal)}</div>
                            <div class="capability-point">${escapeHtml(hazard.detail)}</div>
                            <div class="capability-point"><strong>Action:</strong> ${escapeHtml(hazard.action)}</div>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-diagram-project"></i></div>
                <div>
                    <div class="capability-kicker">Cascading Failure Simulation</div>
                    <h4 class="capability-title">Dependency chain and route impacts</h4>
                    <p class="capability-summary">Primary trigger: ${escapeHtml(data.cascade.primary_trigger)}. Route integrity is ${Number(data.cascade.route_integrity_score).toFixed(1)}%.</p>
                </div>
            </div>
            <div class="resilience-status-banner ${riskChipClass(100 - Number(data.cascade.route_integrity_score))}">
                <span>${escapeHtml(data.cascade.status)}</span>
                <span>${data.cascade.estimated_outage_hours} h outage window</span>
            </div>
            <div class="capability-grid">
                ${data.cascade.nodes.map((nodeItem) => `
                    <article class="capability-card">
                        <div class="capability-card-top">
                            <span class="capability-chip">Dependency node</span>
                            <span class="capability-id">${Number(nodeItem.score).toFixed(1)}</span>
                        </div>
                        <h5 class="capability-card-title">${escapeHtml(nodeItem.name)}</h5>
                        <div class="capability-point">${escapeHtml(nodeItem.status)} service posture under cascade simulation.</div>
                    </article>
                `).join("")}
            </div>
            <div class="resilience-chain">
                ${data.cascade.chain.map((step) => `
                    <div class="resilience-chain-step">
                        <div class="resilience-chain-stage">${escapeHtml(step.stage)}</div>
                        <div class="resilience-chain-title">${escapeHtml(step.title)}</div>
                        <div class="resilience-chain-text">${escapeHtml(step.impact)}</div>
                    </div>
                `).join("")}
            </div>
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-users-gear"></i></div>
                <div>
                    <div class="capability-kicker">Role-Based Dashboards</div>
                    <h4 class="capability-title">${escapeHtml(titleCaseWords(state.resilienceRole.replaceAll("_", " ")))}</h4>
                    <p class="capability-summary">${escapeHtml(selectedRole.headline)}</p>
                </div>
            </div>
            <div class="resilience-mini-grid">
                ${selectedRole.kpis.map((kpi) => `
                    <div class="resilience-mini-card">
                        <span class="resilience-mini-label">${escapeHtml(kpi.label)}</span>
                        <span class="resilience-mini-value">${escapeHtml(kpi.value)}</span>
                    </div>
                `).join("")}
            </div>
            <div class="capability-points">
                ${selectedRole.actions.map((item) => `<div class="capability-point">${escapeHtml(item)}</div>`).join("")}
            </div>
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-city"></i></div>
                <div>
                    <div class="capability-kicker">Scenario Planning & Stress Testing</div>
                    <h4 class="capability-title">What-if scenario comparisons</h4>
                    <p class="capability-summary">Planner-facing stress tests derived from the same live scenario inputs.</p>
                </div>
            </div>
            <div class="capability-grid">
                ${data.stress_tests.map((scenario) => `
                    <article class="capability-card">
                        <div class="capability-card-top">
                            <span class="capability-chip">Stress test</span>
                            <span class="capability-id">${Number(scenario.risk_score).toFixed(1)}</span>
                        </div>
                        <h5 class="capability-card-title">${escapeHtml(scenario.name)}</h5>
                        <div class="capability-points">
                            <div class="capability-point"><strong>Trigger:</strong> ${escapeHtml(scenario.trigger)}</div>
                            <div class="capability-point">${escapeHtml(scenario.summary)}</div>
                            <div class="capability-point"><strong>Loss:</strong> $${Number(scenario.loss_estimate_musd).toFixed(1)}M | <strong>Outage:</strong> ${scenario.outage_hours} h</div>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-screwdriver-wrench"></i></div>
                <div>
                    <div class="capability-kicker">Retrofit Prioritization</div>
                    <h4 class="capability-title">Return-on-resilience ranking</h4>
                    <p class="capability-summary">Prioritized interventions ranked by consequence reduction versus retrofit cost.</p>
                </div>
            </div>
            <div class="capability-grid">
                ${data.retrofit_priorities.map((item) => `
                    <article class="capability-card">
                        <div class="capability-card-top">
                            <span class="capability-chip">${escapeHtml(item.priority)}</span>
                            <span class="capability-id">ROR ${Number(item.return_on_resilience).toFixed(2)}</span>
                        </div>
                        <h5 class="capability-card-title">${escapeHtml(item.asset)}</h5>
                        <div class="resilience-mini-grid">
                            <div class="resilience-mini-card">
                                <span class="resilience-mini-label">Retrofit</span>
                                <span class="resilience-mini-value">$${Number(item.retrofit_cost_musd).toFixed(1)}M</span>
                            </div>
                            <div class="resilience-mini-card">
                                <span class="resilience-mini-label">Replacement</span>
                                <span class="resilience-mini-value">$${Number(item.replacement_cost_musd).toFixed(1)}M</span>
                            </div>
                            <div class="resilience-mini-card">
                                <span class="resilience-mini-label">Consequence</span>
                                <span class="resilience-mini-value">${Number(item.consequence_score).toFixed(1)}</span>
                            </div>
                        </div>
                        <div class="capability-point">${escapeHtml(item.recommendation)}</div>
                    </article>
                `).join("")}
            </div>
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-scale-balanced"></i></div>
                <div>
                    <div class="capability-kicker">Code Gap Analysis</div>
                    <h4 class="capability-title">Compliance and inspection gaps</h4>
                    <p class="capability-summary">Composite compliance score: ${Number(data.code_gap.compliance_score).toFixed(1)} / 100.</p>
                </div>
            </div>
            <div class="resilience-mini-grid">
                ${Object.entries(data.code_gap.component_scores).map(([label, value]) => `
                    <div class="resilience-mini-card">
                        <span class="resilience-mini-label">${escapeHtml(titleCaseWords(label.replaceAll("_", " ")))}</span>
                        <span class="resilience-mini-value">${Number(value).toFixed(1)}</span>
                    </div>
                `).join("")}
            </div>
            <div class="capability-points">
                ${data.code_gap.gaps.map((gap) => `
                    <div class="capability-point"><strong>${escapeHtml(gap.component)}:</strong> ${escapeHtml(gap.status)}. ${escapeHtml(gap.finding)}</div>
                `).join("")}
            </div>
        </section>
        <section class="capability-section glass">
            <div class="capability-head">
                <div class="capability-icon"><i class="fas fa-file-lines"></i></div>
                <div>
                    <div class="capability-kicker">Generative Emergency Response</div>
                    <h4 class="capability-title">Operational action plan</h4>
                    <p class="capability-summary">${escapeHtml(data.action_plan.briefing)}</p>
                </div>
            </div>
            <div class="capability-grid">
                <article class="capability-card">
                    <div class="capability-card-top">
                        <span class="capability-chip">Immediate actions</span>
                    </div>
                    <div class="capability-points">
                        ${data.action_plan.immediate_actions.map((item) => `<div class="capability-point">${escapeHtml(item)}</div>`).join("")}
                    </div>
                </article>
                <article class="capability-card">
                    <div class="capability-card-top">
                        <span class="capability-chip">Operations</span>
                    </div>
                    <div class="capability-points">
                        ${data.action_plan.operations.map((item) => `<div class="capability-point">${escapeHtml(item)}</div>`).join("")}
                    </div>
                </article>
                <article class="capability-card">
                    <div class="capability-card-top">
                        <span class="capability-chip">Resources</span>
                    </div>
                    <div class="capability-points">
                        ${data.action_plan.resources.map((item) => `<div class="capability-point">${escapeHtml(item.resource)}: ${escapeHtml(item.status)} (${item.quantity})</div>`).join("")}
                    </div>
                </article>
                <article class="capability-card">
                    <div class="capability-card-top">
                        <span class="capability-chip">Contacts</span>
                    </div>
                    <div class="capability-points">
                        ${data.action_plan.contacts.map((item) => `<div class="capability-point">${escapeHtml(item.role)}: ${escapeHtml(item.contact)}</div>`).join("")}
                        ${data.action_plan.critical_facilities.map((item) => `<div class="capability-point">Critical facility: ${escapeHtml(item)}</div>`).join("")}
                    </div>
                </article>
            </div>
        </section>
    `;

    bindResilienceControls();
}

function renderResilienceControlBar(isLoading) {
    const roles = [
        { key: "executive", label: "Executive" },
        { key: "emergency_manager", label: "Emergency" },
        { key: "engineer", label: "Engineer" },
        { key: "public", label: "Public" },
    ];
    return `
        <div class="resilience-controls-top">
            <div>
                <div class="capability-kicker">Live controls</div>
                <div class="resilience-control-copy">Scenario inputs, selected location, and role-aware decision framing.</div>
            </div>
            <button class="resilience-run-btn" id="resilience-run-btn" type="button" ${isLoading ? "disabled" : ""}>
                <i class="fas fa-bolt"></i>
                <span>${isLoading ? "Running" : "Run module"}</span>
            </button>
        </div>
        <div class="resilience-role-row">
            ${roles.map((role) => `
                <button
                    class="resilience-role-chip ${state.resilienceRole === role.key ? "active" : ""}"
                    type="button"
                    data-resilience-role="${role.key}"
                >${escapeHtml(role.label)}</button>
            `).join("")}
        </div>
    `;
}

function bindResilienceControls() {
    $("#resilience-run-btn")?.addEventListener("click", () => {
        runResilienceAnalysis();
    });

    $$("[data-resilience-role]").forEach((button) => {
        button.addEventListener("click", () => {
            state.resilienceRole = button.dataset.resilienceRole;
            renderResiliencePanel();
            if (state.resilienceData) {
                return;
            }
            runResilienceAnalysis({ silent: true });
        });
    });
}

function renderResilienceHeroChip(label, value) {
    return `
        <div class="sat-hero-chip">
            <span class="sat-hero-chip-label">${escapeHtml(label)}</span>
            <span class="sat-hero-chip-value">${escapeHtml(String(value))}</span>
        </div>
    `;
}

async function runResilienceAnalysis(options = {}) {
    state.resilienceLoading = true;
    renderResiliencePanel();

    try {
        const response = await fetch(`${API}/resilience`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                location_id: resolveLocationId(),
                earthquake_magnitude: Number($("#sl-eq").value),
                temperature: Number($("#sl-temp").value),
                soil_moisture: Number($("#sl-moist").value),
                role: state.resilienceRole,
            }),
        });
        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload.detail || "Resilience analysis failed");
        }
        state.resilienceData = payload;
        if (!options.silent) {
            setSystemStatus(`Resilience module ready for ${payload.overview.location_id}`);
        }
    } catch (error) {
        console.error(error);
        state.resilienceData = null;
        if (!options.silent) {
            window.alert(`Resilience Error: ${error.message}`);
            setSystemStatus("Resilience module error");
        }
    } finally {
        state.resilienceLoading = false;
        renderResiliencePanel();
    }
}

function riskChipClass(score) {
    if (Number(score) >= 70) {
        return "critical";
    }
    if (Number(score) >= 45) {
        return "warning";
    }
    return "safe";
}

function titleCaseWords(value) {
    return String(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toggleRightTabTray(expanded) {
    if (typeof expanded !== "boolean") {
        return;
    }

    state.rightTabTrayExpanded = expanded;
    const panel = $("#right-panel");
    const button = $("#right-tabs-menu");
    const icon = $("#right-tabs-menu-icon");
    panel?.classList.toggle("tab-strip-expanded", expanded);
    button?.setAttribute("aria-label", expanded ? "Collapse right dock tabs" : "Expand right dock tabs");
    if (icon) {
        icon.className = `fas fa-${expanded ? "xmark" : "bars"}`;
    }
}

function toggleLeftPanel(collapsed) {
    if (typeof collapsed !== "boolean") {
        return;
    }

    state.leftPanelCollapsed = collapsed;
    document.body.classList.toggle("left-panel-collapsed", collapsed);

    const button = $("#left-panel-toggle");
    const icon = $("#left-panel-toggle-icon");
    if (button) {
        button.setAttribute("aria-label", collapsed ? "Expand left control column" : "Collapse left control column");
    }
    if (icon) {
        icon.className = `fas fa-${collapsed ? "bars" : "angles-left"}`;
    }
    requestPlotResize();
}

function setBuildingPanelVisible(isVisible) {
    const detailPanel = $("#detail-panel");
    const emptyState = $("#building-empty");
    if (!detailPanel || !emptyState) {
        return;
    }
    detailPanel.style.display = isVisible ? "flex" : "none";
    emptyState.style.display = isVisible ? "none" : "grid";
    
    // Automatically open the right panel on mobile when a building is selected
    if (isVisible && window.innerWidth <= 900) {
        if (typeof openMobilePanel === "function") {
            openMobilePanel("right");
        } else {
            const rightPanel = $("#right-panel");
            const backdrop = $(".mobile-backdrop");
            if (rightPanel) rightPanel.classList.add("mobile-open");
            if (backdrop) backdrop.classList.add("visible");
        }
    }
}

function toggleRightPanel(collapsed) {
    if (typeof collapsed !== "boolean") {
        return;
    }

    state.rightPanelCollapsed = collapsed;
    document.body.classList.toggle("right-panel-collapsed", collapsed);

    const chevron = $("#right-panel-chevron");
    const toggle = $("#right-panel-toggle");
    if (chevron) {
        chevron.className = `fas fa-chevron-${collapsed ? "left" : "right"}`;
    }
    if (toggle) {
        toggle.setAttribute("aria-label", collapsed ? "Expand building AI panel" : "Collapse building AI panel");
    }

    requestPlotResize();
}

function renderSelectionSummary(payload = null) {
    const shell = $("#selection-summary");
    if (!shell) {
        return;
    }

    if (!payload) {
        shell.innerHTML = `
            <div class="right-empty">
                <div>
                    <i class="fas fa-location-dot"></i>
                    <p>No building selected yet. Choose a structure on the map to populate the dossier.</p>
                </div>
            </div>
        `;
        return;
    }

    if (payload.fallback) {
        shell.innerHTML = `
            <div class="metadata-grid">
                <div class="metadata-row">
                    <span class="metadata-label">Selected address</span>
                    <span class="metadata-value">${escapeHtml(payload.locationMeta?.address || "Mapped structure")}</span>
                </div>
                <div class="metadata-row">
                    <span class="metadata-label">Review status</span>
                    <span class="metadata-value">AI review fallback active. Scenario and CSV analysis remain available.</span>
                </div>
            </div>
        `;
        return;
    }

    shell.innerHTML = `
        <div class="metadata-grid">
            <div class="metadata-row">
                <span class="metadata-label">Selected asset</span>
                <span class="metadata-value">${escapeHtml(payload.locationMeta?.label || "Mapped structure")}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Mapped address</span>
                <span class="metadata-value">${escapeHtml(payload.locationMeta?.address || "Unavailable")}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Risk score</span>
                <span class="metadata-value">${Number(payload.risk || 0).toFixed(1)} / 100</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Height</span>
                <span class="metadata-value">${Number(payload.height || 0).toFixed(1)} m</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Estimated floors</span>
                <span class="metadata-value">${escapeHtml(String(payload.profile?.estimatedFloors || "N/A"))}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Occupancy profile</span>
                <span class="metadata-value">${escapeHtml(payload.profile?.operationalExposure || "Unavailable")}</span>
            </div>
            <div class="metadata-row">
                <span class="metadata-label">Coordinates</span>
                <span class="metadata-value">${payload.lngLat?.lat?.toFixed(4)}, ${payload.lngLat?.lng?.toFixed(4)}</span>
            </div>
        </div>
    `;
}

function initNav() {
    $$(".nav-pill").forEach((button) => {
        button.addEventListener("click", () => {
            const view = button.dataset.view;
            if (!view) return;

            // If already active, toggle it off by switching to dashboard (unless it's already dashboard)
            if (button.classList.contains("active") && view !== "dashboard") {
                const dashBtn = Array.from($$(".nav-pill")).find(b => b.dataset.view === "dashboard");
                if (dashBtn) {
                    $$(".nav-pill").forEach((item) => item.classList.remove("active"));
                    dashBtn.classList.add("active");
                    state.activeHeaderView = "dashboard";
                    syncHeaderView("dashboard");
                    // Also collapse bottom panel when toggling off
                    state.bottomExpanded = false;
                    $("#bottom-panel")?.classList.add("collapsed");
                    const chevron = $("#btm-chevron");
                    if (chevron) chevron.className = "fas fa-chevron-up";
                }
                return;
            }

            $$(".nav-pill").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            state.activeHeaderView = view;
            
            // Expand bottom panel when switching to Analysis or Insights
            if (view === "analysis" || view === "insights") {
                state.bottomExpanded = true;
                $("#bottom-panel")?.classList.remove("collapsed");
                const chevron = $("#btm-chevron");
                if (chevron) chevron.className = "fas fa-chevron-down";
            }
            
            syncHeaderView(view);
        });
    });
}

function syncHeaderView(view) {
    if (view === "dashboard") {
        switchBottomTab("charts");
        return;
    }
    if (view === "analysis") {
        switchBottomTab("shap");
        return;
    }
    document.getElementById("left-insights-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    switchBottomTab("charts");
}

function initBottomPanel() {
    $$(".btm-tab").forEach((button) => {
        button.addEventListener("click", () => switchBottomTab(button.dataset.btab));
    });

    $$(".csub").forEach((button) => {
        button.addEventListener("click", () => {
            $$(".csub").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            state.activeChart = button.dataset.chart;
            renderActiveChart();
        });
    });

    $("#btm-toggle").addEventListener("click", () => {
        state.bottomExpanded = !state.bottomExpanded;
        $("#bottom-panel").classList.toggle("collapsed", !state.bottomExpanded);
        $("#btm-chevron").className = `fas fa-chevron-${state.bottomExpanded ? "down" : "up"}`;
        requestPlotResize();
    });
}

function switchBottomTab(tab) {
    state.activeBottomTab = tab;
    $$(".btm-tab").forEach((button) => {
        button.classList.toggle("active", button.dataset.btab === tab);
    });
    $$(".btm-page").forEach((page) => {
        page.classList.toggle("active", page.id === `bpage-${tab}`);
    });
    requestPlotResize();
}

function initAnalyzeButton() {
    $("#btn-analyze").addEventListener("click", runAnalysis);
}

async function runAnalysis() {
    setSystemStatus(state.selectedFile ? "Uploading dataset" : "Running scenario");
    if (state.selectedFile) {
        await runUploadAnalysis();
        return;
    }
    await runScenario();
}

async function runUploadAnalysis() {
    const resetLoading = startLoadingSequence();

    try {
        const formData = new FormData();
        formData.append("file", state.selectedFile);

        const response = await fetch(`${API}/analyze`, {
            method: "POST",
            body: formData,
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload.detail || payload.error || "Dataset analysis failed");
        }

        state.analysisData = payload;
        await completeLoadingSequence(resetLoading);
        renderAnalysisResults(payload);
        setSystemStatus("Dataset analysis complete");
    } catch (error) {
        resetLoading();
        console.error(error);
        window.alert(`Analysis Error: ${error.message}`);
        setSystemStatus("Dataset analysis error");
    }
}

async function runScenario() {
    const resetLoading = startLoadingSequence();

    try {
        const locationId = resolveLocationId();
        const body = {
            location_id: locationId,
            earthquake_magnitude: Number($("#sl-eq").value),
            temperature: Number($("#sl-temp").value),
            soil_moisture: Number($("#sl-moist").value),
        };

        const response = await fetch(`${API}/scenario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.detail || "Scenario simulation failed");
        }

        state.analysisData = normalizeScenarioResponse(payload);
        await completeLoadingSequence(resetLoading);
        renderAnalysisResults(state.analysisData);

        const location = FALLBACK_LOCATIONS[locationId];
        if (location) {
            centerOnCoordinates(location.center, 13.7);
            addOrMoveMarker(location.center);
        }
        setSystemStatus(`Scenario complete for ${locationId}`);
    } catch (error) {
        resetLoading();
        console.error(error);
        window.alert(`Scenario Error: ${error.message}`);
        setSystemStatus("Scenario error");
    }
}

function normalizeScenarioResponse(payload) {
    const prediction = payload.prediction || {};
    return {
        risk_score: Number(prediction.risk_score || 0),
        risk_category: prediction.risk_category || riskToLabel(Number(prediction.risk_score || 0)),
        failure_probability: Number(prediction.failure_probability || 0),
        anomaly_score: Number(prediction.anomaly_score || 0),
        environmental_risk: Number(prediction.environmental_risk || 0),
        predicted_degradation: Number(prediction.predicted_degradation || 0),
        time_to_failure: getTimeToFailure(Number(prediction.failure_probability || 0)),
        time_series: payload.time_series || {},
        shap_features: payload.explanation || {},
        llm_explanation: {
            summary: `Scenario simulation produced a ${prediction.risk_category || "SAFE"} risk profile with a risk score of ${Number(prediction.risk_score || 0).toFixed(1)}.`,
            drivers: "Scenario mode focuses on live model outputs. Upload a CSV for full narrative analysis, validation, and chart bundles.",
            recommendations: buildScenarioRecommendations(prediction),
        },
    };
}

function buildScenarioRecommendations(prediction) {
    const risk = Number(prediction.risk_score || 0);
    if (risk >= 70) {
        return [
            "1. Increase manual inspection frequency immediately.",
            "2. Restrict loading until the scenario drivers are confirmed against field data.",
            "3. Upload telemetry CSV data to compare the scenario profile with real measurements.",
        ].join("\\n");
    }
    if (risk >= 40) {
        return [
            "1. Schedule a pre-emptive inspection window.",
            "2. Track the scenario again after adjusting environmental inputs.",
            "3. Validate the result against uploaded telemetry if available.",
        ].join("\\n");
    }
    return [
        "1. Maintain standard monitoring cadence.",
        "2. Use the sliders to stress-test more severe conditions.",
        "3. Upload a dataset to unlock full explainability and validation reporting.",
    ].join("\\n");
}

function resolveLocationId() {
    if (state.selectedBuilding?.lngLat) {
        const { lat, lng } = state.selectedBuilding.lngLat;
        const nearest = Object.entries(FALLBACK_LOCATIONS)
            .map(([key, location]) => ({
                key,
                distance: Math.hypot(location.center[0] - lng, location.center[1] - lat),
            }))
            .sort((left, right) => left.distance - right.distance)[0];
        return nearest?.key || "LOC_001";
    }

    const searchValue = $("#place-search").value.trim().toLowerCase();
    const match = Object.entries(FALLBACK_LOCATIONS).find(([, location]) =>
        location.label.toLowerCase().includes(searchValue)
    );
    return match?.[0] || "LOC_001";
}

function renderAnalysisResults(data) {
    updateMetrics(data);
    updateGauge(Number(data.risk_score || 0), data.risk_category || "SAFE");
    updateBuildingVisuals(Number(data.risk_score || 0));

    if (data.validation) {
        renderValidation(data.validation);
    } else {
        $("#validation-box").style.display = "none";
    }

    renderActiveChart();
    renderLLMInsights(data.llm_explanation);
    renderSHAP(data.shap_features);
    syncHeaderView(state.activeHeaderView);
    updateAlert(data);
    runResilienceAnalysis({ silent: true });
}

function updateMetrics(data) {
    const risk = Number(data.risk_score || 0);
    const failureProbability = Number(data.failure_probability || 0);
    const anomaly = Number(data.anomaly_score || 0);

    $("#mv-risk").textContent = risk.toFixed(1);
    $("#mv-fail").textContent = `${(failureProbability * 100).toFixed(1)}%`;
    $("#mv-ttf").textContent = data.time_to_failure || getTimeToFailure(failureProbability);
    $("#mv-anom").textContent = anomaly.toFixed(3);

    $("#mv-risk").style.color = getRiskColor(risk);
    $("#mt-risk").textContent = risk >= 70 ? "UP" : risk >= 40 ? "WATCH" : "STABLE";
    $("#mt-risk").style.color = getRiskColor(risk);

    $("#mt-fail").textContent = failureProbability >= 0.5 ? "UP" : "LOW";
    $("#mt-fail").style.color = failureProbability >= 0.5 ? THEME.critical : THEME.safe;

    $("#mt-anom").textContent = anomaly >= 0.7 ? "SPIKE" : "NOMINAL";
    $("#mt-anom").style.color = anomaly >= 0.7 ? THEME.critical : THEME.safe;
}

function updateGauge(score, category) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const boundedScore = Math.max(0, Math.min(score, 100));
    const offset = circumference * (1 - boundedScore / 100);

    $("#gauge-arc").style.strokeDasharray = `${circumference}`;
    $("#gauge-arc").style.strokeDashoffset = `${offset}`;
    $("#gauge-num").textContent = Math.round(boundedScore).toString();
    $("#gauge-tag").textContent = category;
    $("#gauge-num").style.color = getRiskColor(boundedScore);
    $("#gauge-tag").style.color = getRiskColor(boundedScore);
}

function updateBuildingVisuals(score) {
    const level = score >= 70 ? "critical" : score >= 40 ? "warning" : "safe";
    document.body.dataset.riskLevel = level;

    if (state.mapMarker) {
        const element = state.mapMarker.getElement();
        element.className = `infra-marker ${level} selected`;
        element.innerHTML = `<span class="marker-ring"></span><i class="fas fa-building"></i>`;
    }
}

function renderValidation(report) {
    $("#validation-box").style.display = "block";

    const rows = [];
    rows.push(`
        <div class="val-row val-ok">
            <i class="fas fa-check-circle"></i>
            ${report.columns?.length || 14} required columns validated
        </div>
    `);
    rows.push(`
        <div class="val-row val-ok">
            <i class="fas fa-database"></i>
            ${report.final_rows || report.original_rows || 0} rows ready for analysis
        </div>
    `);

    if (report.imputed_columns?.length) {
        rows.push(`
            <div class="val-row val-warn">
                <i class="fas fa-wand-magic-sparkles"></i>
                ${report.imputed_columns.length} columns required imputation
            </div>
        `);
    }

    if (report.clipped_columns?.length) {
        rows.push(`
            <div class="val-row val-warn">
                <i class="fas fa-triangle-exclamation"></i>
                ${report.clipped_columns.length} columns were range-clipped
            </div>
        `);
    }

    if (report.missing_columns?.length) {
        rows.push(`
            <div class="val-row val-err">
                <i class="fas fa-times-circle"></i>
                Missing columns: ${escapeHtml(report.missing_columns.join(", "))}
            </div>
        `);
    }

    $("#validation-content").innerHTML = rows.join("");
}

function updateAlert(data) {
    const risk = Number(data.risk_score || 0);
    if (risk < 70) {
        $("#alert-banner").classList.remove("visible");
        return;
    }

    const failureProbability = Number(data.failure_probability || 0);
    $("#alert-text").textContent =
        `CRITICAL ALERT: risk index ${risk.toFixed(1)} | failure probability ${(failureProbability * 100).toFixed(1)}% | immediate engineering review recommended`;
    $("#alert-banner").classList.add("visible");
}

function renderActiveChart() {
    if (!state.analysisData) {
        return;
    }

    const chartRoot = $("#chart-main");
    if (!withPlotly("activeChart", renderActiveChart)) {
        chartRoot.innerHTML = `<div class="chart-empty">Preparing live chart engine...</div>`;
        return;
    }

    const chartSpec = state.analysisData.charts?.[state.activeChart];
    if (chartSpec?.data) {
        renderPlotlySpec(chartRoot, chartSpec);
        return;
    }

    if (state.activeChart === "risk" && state.analysisData.charts?.risk_trend) {
        renderPlotlySpec(chartRoot, state.analysisData.charts.risk_trend);
        return;
    }

    const series = state.analysisData.time_series || {};
    const dataMap = {
        vibration: {
            values: series.vibration || [],
            label: "Vibration (mm/s)",
            color: "#3b82f6",
        },
        strain: {
            values: series.strain || [],
            label: "Strain",
            color: "#94a3b8",
        },
        temperature: {
            values: series.temperature || [],
            label: "Temperature (deg C)",
            color: "#cbd5e1",
        },
        correlation: null,
        risk: {
            values: state.analysisData.risk_scores_over_time || [],
            label: "Risk score",
            color: "#ef4444",
        },
    };

    const config = dataMap[state.activeChart];
    if (!config?.values?.length) {
        chartRoot.innerHTML = `<div class="chart-empty">No ${state.activeChart} data is available yet.</div>`;
        return;
    }

    Plotly.newPlot(
        chartRoot,
        [
            {
                type: "scatter",
                mode: "lines",
                x: config.values.map((_, index) => index + 1),
                y: config.values,
                line: {
                    color: config.color,
                    width: 2,
                },
                fill: "tozeroy",
                fillcolor: `${config.color}22`,
                hovertemplate: `${config.label}: %{y:.4f}<extra></extra>`,
            },
        ],
        buildChartLayout(config.label),
        { responsive: true, displayModeBar: false }
    );
}

function renderPlotlySpec(container, spec) {
    if (!withPlotly(`plotlySpec-${container.id}`, () => renderPlotlySpec(container, spec))) {
        return;
    }

    Plotly.newPlot(
        container,
        spec.data,
        {
            ...buildChartLayout(),
            ...(spec.layout || {}),
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: {
                family: "'Inter', sans-serif",
                color: THEME.text,
                size: 11,
            },
        },
        { responsive: true, displayModeBar: false }
    );
}

function buildChartLayout(yTitle = "Value") {
    return {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 14, r: 20, b: 42, l: 52 },
        font: {
            family: "'Inter', sans-serif",
            color: THEME.text,
            size: 11,
        },
        xaxis: {
            title: "Timestep",
            color: THEME.muted,
            gridcolor: THEME.grid,
            zerolinecolor: THEME.grid,
        },
        yaxis: {
            title: yTitle,
            color: THEME.muted,
            gridcolor: THEME.grid,
            zerolinecolor: THEME.grid,
        },
    };
}

function renderLLMInsights(llm) {
    const container = $("#llm-scroll");
    if (!llm) {
        container.innerHTML = `<div class="llm-empty"><i class="fas fa-robot"></i><p>No AI insights available yet.</p></div>`;
        return;
    }

    const sections = [
        { icon: "fa-clipboard-list", title: "Risk summary", key: "summary" },
        { icon: "fa-bolt", title: "Key drivers", key: "drivers" },
        { icon: "fa-earth-asia", title: "Environmental impact", key: "environmental_analysis" },
        { icon: "fa-building-shield", title: "Structural impact", key: "structural_analysis" },
        { icon: "fa-network-wired", title: "Infrastructure insights", key: "infrastructure_insights" },
        { icon: "fa-clock", title: "Timeline", key: "time_estimate" },
        { icon: "fa-list-check", title: "Recommendations", key: "recommendations" },
    ];

    const visibleSections = state.aiMode === "expert"
        ? sections
        : sections.filter((section) => ["summary", "recommendations", "time_estimate"].includes(section.key));

    const html = visibleSections
        .filter((section) => llm[section.key])
        .map((section) => `
            <article class="llm-section">
                <div class="llm-sec-title"><i class="fas ${section.icon}"></i> ${section.title}</div>
                <div class="llm-sec-body">${formatStructuredText(llm[section.key])}</div>
            </article>
        `)
        .join("");

    container.innerHTML = html || `<div class="llm-empty"><i class="fas fa-robot"></i><p>No AI insights generated.</p></div>`;
}

function renderSHAP(shap) {
    const chartTarget = $("#chart-shap");
    const listTarget = $("#shap-features");
    const explanations = shap?.explanations || shap?.top_features || [];

    if (!explanations.length) {
        chartTarget.innerHTML = `<div class="chart-empty">Explainability data will appear after analysis.</div>`;
        listTarget.innerHTML = `<div class="llm-empty"><i class="fas fa-search-plus"></i><p>No feature contributions available.</p></div>`;
        return;
    }

    const top = [...explanations]
        .sort((left, right) => Math.abs(right.contribution_value) - Math.abs(left.contribution_value))
        .slice(0, 10)
        .reverse();

    if (!withPlotly("shapChart", () => renderSHAP(shap))) {
        chartTarget.innerHTML = `<div class="chart-empty">Preparing explainability chart...</div>`;
        return;
    }

    Plotly.newPlot(
        chartTarget,
        [
            {
                type: "bar",
                orientation: "h",
                y: top.map((item) => item.feature_name.replace(/_/g, " ")),
                x: top.map((item) => item.contribution_value),
                marker: {
                    color: top.map((item) => item.contribution_value >= 0 ? THEME.critical : THEME.safe),
                },
                hovertemplate: "%{y}: %{x:.4f}<extra></extra>",
            },
        ],
        {
            ...buildChartLayout("Contribution"),
            margin: { t: 12, r: 18, b: 34, l: 140 },
        },
        { responsive: true, displayModeBar: false }
    );

    const max = Math.max(...top.map((item) => Math.abs(item.contribution_value)), 0.001);
    listTarget.innerHTML = top
        .slice()
        .reverse()
        .map((item) => {
            const width = (Math.abs(item.contribution_value) / max) * 100;
            const color = item.contribution_value >= 0 ? THEME.critical : THEME.safe;
            return `
                <div class="shap-row">
                    <span class="shap-name">${escapeHtml(item.feature_name.replace(/_/g, " "))}</span>
                    <div class="shap-bar"><div class="shap-bar-fill" style="width:${width}%; background:${color}"></div></div>
                    <span class="shap-val">${item.contribution_value >= 0 ? "+" : ""}${item.contribution_value.toFixed(4)}</span>
                </div>
            `;
        })
        .join("");
}

function addToHistory(item) {
    state.recentBuildings = [item, ...state.recentBuildings.filter((entry) => entry.id !== item.id)].slice(0, 12);
    renderAnalysisHistory();
}

function renderAnalysisHistory() {
    const container = $("#infra-list");
    if (!state.recentBuildings.length) {
        container.innerHTML = `<div class="history-empty"><i class="fas fa-mouse-pointer"></i><br>No buildings analyzed yet</div>`;
        return;
    }

    container.innerHTML = state.recentBuildings
        .map((item) => `
            <button class="infra-item" type="button" data-lng="${item.lngLat.lng}" data-lat="${item.lngLat.lat}">
                <span class="infra-dot ${riskToClass(item.risk)}"></span>
                <span class="infra-copy">
                    <span class="infra-item-name">${escapeHtml(item.address)}</span>
                    <span class="infra-item-meta">${escapeHtml(item.fullAddress || "")}</span>
                </span>
                <span class="infra-item-type">${item.height.toFixed(0)}m</span>
            </button>
        `)
        .join("");

    $$(".infra-item").forEach((button) => {
        button.addEventListener("click", () => {
            centerOnCoordinates([Number(button.dataset.lng), Number(button.dataset.lat)], 17);
            addOrMoveMarker([Number(button.dataset.lng), Number(button.dataset.lat)]);
        });
    });
}

function initResizeHandling() {
    window.addEventListener("resize", requestPlotResize);
}

function requestPlotResize() {
    if (!withPlotly("plotResize", requestPlotResize)) {
        return;
    }
    [
        "chart-main",
        "chart-shap",
        "satellite-chart-health",
        "satellite-chart-network",
        "satellite-chart-traffic",
    ].forEach((id) => {
        const node = document.getElementById(id);
        if (node?.data) {
            Plotly.Plots.resize(node);
        }
    });
}

function startLoadingSequence() {
    const overlay = $("#loading-overlay");
    const steps = $$(".lstep");
    overlay.style.display = "grid";
    steps.forEach((step) => step.classList.remove("active", "done"));
    let index = 0;
    steps[index]?.classList.add("active");

    const timer = setInterval(() => {
        if (index < steps.length) {
            steps[index]?.classList.remove("active");
            steps[index]?.classList.add("done");
        }
        index += 1;
        steps[Math.min(index, steps.length - 1)]?.classList.add("active");
    }, 420);

    return () => {
        clearInterval(timer);
        overlay.style.display = "none";
        steps.forEach((step) => step.classList.remove("active", "done"));
    };
}

function completeLoadingSequence(reset) {
    return sleep(300).then(reset);
}

function centerOnCoordinates(center, zoom = 16) {
    if (!state.mapReady || !state.map) {
        return;
    }

    state.map.flyTo({
        center,
        zoom,
        pitch: Math.max(state.map.getPitch(), 54),
        bearing: state.map.getBearing(),
        essential: true,
        duration: 1200,
    });
}

function setSystemStatus(text) {
    const status = $(".sys-status span");
    if (status) {
        status.textContent = text.toUpperCase();
    }
}

function getRiskColor(risk) {
    if (risk >= 55) {
        return THEME.critical;
    }
    if (risk >= 20) {
        return THEME.warning;
    }
    return THEME.safe;
}

function riskToClass(risk) {
    if (risk >= 55) {
        return "crit";
    }
    if (risk >= 20) {
        return "warn";
    }
    return "safe";
}

function riskToLabel(risk) {
    if (risk >= 75) {
        return "CRITICAL";
    }
    if (risk >= 55) {
        return "HIGH RISK";
    }
    if (risk >= 30) {
        return "MODERATE RISK";
    }
    if (risk >= 10) {
        return "LOW RISK";
    }
    return "VERY LOW";
}

function getTimeToFailure(probability) {
    if (probability > 0.7) {
        return "< 6 months";
    }
    if (probability > 0.4) {
        return "6-18 months";
    }
    if (probability > 0.2) {
        return "1-3 years";
    }
    return "> 3 years";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatParagraphs(value) {
    return escapeHtml(value).replace(/\n+/g, "<br>");
}

function formatStructuredText(value) {
    const escaped = escapeHtml(String(value));
    return escaped
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/^(\d+\.\s.*)$/gm, '<span class="llm-line llm-line-number">$1</span>')
        .replace(/^-\s(.*)$/gm, '<span class="llm-line llm-line-bullet">$1</span>')
        .replace(/\n/g, "<br>");
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

document.addEventListener("DOMContentLoaded", init);

/**
 * ── Mobile Layout ──
 * Creates bottom nav bar, backdrop, and mobile-aware panel toggling.
 * Only activates on viewports ≤ 900px.
 */
function initMobileLayout() {
    const isMobile = () => window.innerWidth <= 900;
    if (!isMobile()) return;

    // — Create bottom navigation bar by cloning header nav —
    const headerNav = $(".hdr-nav");
    if (headerNav && !$(".hdr-nav.mobile-nav")) {
        const mobileNav = headerNav.cloneNode(true);
        mobileNav.classList.add("mobile-nav");

        // Replace About link target behavior for mobile
        const pills = mobileNav.querySelectorAll(".nav-pill");
        pills.forEach((pill) => {
            // Keep About as external link
            if (pill.getAttribute("href")) return;

            pill.addEventListener("click", (e) => {
                e.preventDefault();
                const view = pill.dataset.view;
                if (!view) return;

                // If already active, toggle it off by switching to dashboard (unless it's already dashboard)
                if (pill.classList.contains("active") && view !== "dashboard") {
                    const dashBtn = mobileNav.querySelector('.nav-pill[data-view="dashboard"]');
                    if (dashBtn) {
                        mobileNav.querySelectorAll(".nav-pill").forEach((p) => p.classList.remove("active"));
                        dashBtn.classList.add("active");
                        closeMobileBackdrop();
                        openMobilePanel("left"); // Dashboard defaults to left panel on mobile
                    }
                    return;
                }

                // Activate tab styling
                mobileNav.querySelectorAll(".nav-pill").forEach((p) => p.classList.remove("active"));
                pill.classList.add("active");

                // Open relevant panel based on view
                closeMobileBackdrop();
                if (view === "dashboard") {
                    openMobilePanel("left");
                } else if (view === "analysis") {
                    openMobilePanel("bottom");
                } else if (view === "insights") {
                    openMobilePanel("right");
                }
            });
        });

        document.body.appendChild(mobileNav);
    }

    // — Create backdrop overlay —
    if (!$(".mobile-backdrop")) {
        const backdrop = document.createElement("div");
        backdrop.className = "mobile-backdrop";
        backdrop.addEventListener("click", closeMobileBackdrop);
        document.body.appendChild(backdrop);
    }

    // — Override left panel hamburger for mobile —
    const leftToggle = $("#left-panel-toggle");
    if (leftToggle) {
        leftToggle.addEventListener("click", (e) => {
            if (!isMobile()) return;
            e.stopPropagation();
            const leftPanel = $("#left-panel");
            if (leftPanel.classList.contains("mobile-open")) {
                closeMobileBackdrop();
            } else {
                openMobilePanel("left");
            }
        });
    }

    // — Override right panel toggle for mobile —
    const rightToggle = $("#right-panel-toggle");
    if (rightToggle) {
        rightToggle.addEventListener("click", (e) => {
            if (!isMobile()) return;
            e.stopPropagation();
            const rightPanel = $("#right-panel");
            if (rightPanel.classList.contains("mobile-open")) {
                closeMobileBackdrop();
            } else {
                openMobilePanel("right");
            }
        });
    }

    // — Override bottom panel toggle for mobile —
    const btmToggle = $("#btm-toggle");
    if (btmToggle) {
        btmToggle.addEventListener("click", (e) => {
            if (!isMobile()) return;
            e.stopPropagation();
            const btmPanel = $("#bottom-panel");
            if (btmPanel.classList.contains("mobile-open")) {
                closeMobileBackdrop();
            } else {
                openMobilePanel("bottom");
            }
        });
    }
}

function openMobilePanel(which) {
    closeMobileBackdrop();
    const backdrop = $(".mobile-backdrop");
    if (backdrop) {
        backdrop.classList.add("visible");
    }

    if (which === "left") {
        $("#left-panel")?.classList.add("mobile-open");
    } else if (which === "right") {
        $("#right-panel")?.classList.add("mobile-open");
    } else if (which === "bottom") {
        $("#bottom-panel")?.classList.add("mobile-open");
    }
}

function closeMobileBackdrop() {
    $(".mobile-backdrop")?.classList.remove("visible");
    $("#left-panel")?.classList.remove("mobile-open");
    $("#right-panel")?.classList.remove("mobile-open");
    $("#bottom-panel")?.classList.remove("mobile-open");
}

/**
 * ── Authentication & User Profile Panel ──
 */

const userProfile = {
    sessionStart: Date.now(),
    clicks: 0,
    buildingsAnalyzed: 0,
    scenariosRun: 0,
    activities: [],
    sessionTimer: null,
    isProfileOpen: false,
};

function closeUserProfilePanel() {
    const profilePanel = $('#user-profile-panel');
    if (profilePanel) {
        profilePanel.classList.remove('show');
    }
    userProfile.isProfileOpen = false;
}

function initAuth() {
    const userJson = localStorage.getItem('sx_user');
    let user = { email: 'user@structurex.io', name: 'User' };

    if (userJson) {
        try {
            user = JSON.parse(userJson);
        } catch (e) {
            console.error("Failed to parse user session", e);
        }
    }

    const displayName = user.name || user.email.split('@')[0];

    // Populate header capsule
    const nameDisplay = $('#display-user-name');
    if (nameDisplay) nameDisplay.textContent = displayName;

    const avatarEl = $('#user-avatar');
    const initials = getInitials(displayName);
    if (avatarEl) avatarEl.textContent = initials;

    // Populate profile panel
    const upName = $('#up-name');
    const upEmail = $('#up-email');
    const upAvatar = $('#up-avatar');
    if (upName) upName.textContent = displayName;
    if (upEmail) upEmail.textContent = user.email || 'user@structurex.io';
    if (upAvatar) upAvatar.textContent = initials;

    // Session count
    let stats = loadUserStats();
    stats.totalSessions = (stats.totalSessions || 0) + 1;
    if (!stats.memberSince) stats.memberSince = new Date().toISOString();
    saveUserStats(stats);

    const memberSince = $('#up-member-since');
    if (memberSince) memberSince.textContent = new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const totalSessions = $('#up-total-sessions');
    if (totalSessions) totalSessions.textContent = stats.totalSessions;

    const totalTime = $('#up-total-time');
    if (totalTime) totalTime.textContent = formatDuration(stats.totalSeconds || 0);

    // Start session timer
    userProfile.sessionTimer = setInterval(updateSessionTimer, 1000);

    // Track global clicks
    document.addEventListener('click', () => { userProfile.clicks++; updateProfileStats(); }, true);

    // Profile panel toggle
    const capsule = $('#user-capsule');
    const profilePanel = $('#user-profile-panel');

    if (capsule && profilePanel) {
        capsule.addEventListener('click', (e) => {
            e.stopPropagation();
            userProfile.isProfileOpen = !userProfile.isProfileOpen;
            profilePanel.classList.toggle('show', userProfile.isProfileOpen);
        });

        profilePanel.addEventListener('click', (e) => e.stopPropagation());

        document.addEventListener('pointerdown', (e) => {
            if (!userProfile.isProfileOpen) return;
            if (profilePanel.contains(e.target) || capsule.contains(e.target)) return;
            closeUserProfilePanel();
        }, true);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && userProfile.isProfileOpen) {
                closeUserProfilePanel();
            }
        });

        document.addEventListener('click', () => {
            if (userProfile.isProfileOpen) {
                closeUserProfilePanel();
            }
        });
    }

    // Logout buttons
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.stopPropagation(); handleLogout(); });

    const upLogoutBtn = $('#up-logout-btn');
    if (upLogoutBtn) upLogoutBtn.addEventListener('click', (e) => { e.stopPropagation(); handleLogout(); });

    // Quick action buttons
    initProfileActions();

    // Log session start
    addActivity('login', 'Session started', 'green');
}

function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
}

function updateSessionTimer() {
    const elapsed = Math.floor((Date.now() - userProfile.sessionStart) / 1000);
    const el = $('#up-session-time');
    if (el) el.textContent = formatTime(elapsed);

    // Save total time every 10 seconds
    if (elapsed % 10 === 0) {
        const stats = loadUserStats();
        stats.totalSeconds = (stats.totalSeconds || 0) + 10;
        saveUserStats(stats);
        const totalTime = $('#up-total-time');
        if (totalTime) totalTime.textContent = formatDuration(stats.totalSeconds);
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(totalSeconds) {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m`;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function updateProfileStats() {
    const clicksEl = $('#up-clicks');
    if (clicksEl) clicksEl.textContent = userProfile.clicks;
    const buildingsEl = $('#up-buildings');
    if (buildingsEl) buildingsEl.textContent = userProfile.buildingsAnalyzed;
    const scenariosEl = $('#up-scenarios');
    if (scenariosEl) scenariosEl.textContent = userProfile.scenariosRun;
}

function addActivity(type, message, color) {
    const icons = {
        login: 'fa-right-to-bracket',
        building: 'fa-building',
        scenario: 'fa-flask',
        search: 'fa-magnifying-glass',
        export: 'fa-download',
        voice: 'fa-microphone',
        analysis: 'fa-chart-line',
        theme: 'fa-palette',
    };

    userProfile.activities.unshift({
        type,
        message,
        color: color || 'blue',
        icon: icons[type] || 'fa-circle-dot',
        time: new Date(),
    });

    // Cap at 20 items
    if (userProfile.activities.length > 20) userProfile.activities.pop();

    renderActivityList();
}

function renderActivityList() {
    const list = $('#up-activity-list');
    if (!list) return;

    if (!userProfile.activities.length) {
        list.innerHTML = '<div class="up-activity-empty"><i class="fas fa-ghost"></i> No activity yet</div>';
        return;
    }

    list.innerHTML = userProfile.activities.map(a => `
        <div class="up-activity-item">
            <div class="up-activity-icon ${a.color}"><i class="fas ${a.icon}"></i></div>
            <div class="up-activity-text">
                <div class="up-activity-title">${a.message}</div>
                <div class="up-activity-time">${getRelativeTime(a.time)}</div>
            </div>
        </div>
    `).join('');
}

function getRelativeTime(date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

function trackBuildingAnalysis(address) {
    userProfile.buildingsAnalyzed++;
    updateProfileStats();
    addActivity('building', `Analyzed: ${address}`, 'blue');
}

function trackScenarioRun(locationId) {
    userProfile.scenariosRun++;
    updateProfileStats();
    addActivity('scenario', `Scenario run: ${locationId}`, 'orange');
}

function trackSearch(query) {
    addActivity('search', `Searched: ${query}`, 'purple');
}

function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('sx_user') || '{}');
    } catch {
        return {};
    }
}

function markdownCell(value) {
    return String(value ?? 'Not available').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function readElementText(selector, fallback = 'Not available') {
    const el = $(selector);
    const text = el ? el.textContent.trim() : '';
    return text || fallback;
}

function readInputValue(selector, fallback = 'Not set') {
    const el = $(selector);
    const value = el ? el.value : '';
    return value || fallback;
}

function buildSessionReport() {
    const elapsed = Math.floor((Date.now() - userProfile.sessionStart) / 1000);
    const user = readStoredUser();
    const stats = loadUserStats();
    const reportDate = new Date();
    const currentLocation = readInputValue('#location-input, #search-input, input[type="text"]');
    const selectedAsset = readElementText('#det-name, .det-name', 'No asset selected');
    const riskScore = readElementText('.ai-risk-score, #risk-score', 'Not calculated');
    const riskLabel = readElementText('.review-status-chip, #risk-label', 'Not calculated');
    const earthquake = readInputValue('#quake-mag', '3.0');
    const temperature = readInputValue('#temperature', '25');
    const soil = readInputValue('#soil-moisture', '0.30');
    const activities = userProfile.activities.length
        ? userProfile.activities.map((activity) => (
            `| ${markdownCell(activity.time.toLocaleTimeString())} | ${markdownCell(activity.message)} |`
        )).join('\n')
        : '| Not recorded | No activity recorded for this session |';

    return [
        '# StructureX Session Report',
        '',
        `Generated: ${reportDate.toLocaleString()}`,
        '',
        '## Operator',
        '| Field | Value |',
        '| --- | --- |',
        `| Name | ${markdownCell(user.name || 'StructureX User')} |`,
        `| Email | ${markdownCell(user.email || 'Not available')} |`,
        '| Role | Operator |',
        '',
        '## Live Session',
        '| Metric | Value |',
        '| --- | --- |',
        `| Session Duration | ${markdownCell(formatTime(elapsed))} |`,
        `| Interactions | ${markdownCell(userProfile.clicks)} |`,
        `| Buildings Analyzed | ${markdownCell(userProfile.buildingsAnalyzed)} |`,
        `| Scenarios Run | ${markdownCell(userProfile.scenariosRun)} |`,
        `| Total Sessions | ${markdownCell(stats.totalSessions || 1)} |`,
        `| Total Recorded Time | ${markdownCell(formatDuration(stats.totalSeconds || 0))} |`,
        '',
        '## Current Workspace',
        '| Field | Value |',
        '| --- | --- |',
        `| Location Search | ${markdownCell(currentLocation)} |`,
        `| Selected Asset | ${markdownCell(selectedAsset)} |`,
        `| Risk Score | ${markdownCell(riskScore)} |`,
        `| Risk Label | ${markdownCell(riskLabel)} |`,
        `| Earthquake Magnitude | ${markdownCell(earthquake)} |`,
        `| Temperature | ${markdownCell(temperature)} |`,
        `| Soil Moisture | ${markdownCell(soil)} |`,
        '',
        '## Activity Timeline',
        '| Time | Event |',
        '| --- | --- |',
        activities,
        '',
        '## Notes',
        '- This report is generated from the active browser session and local dashboard state.',
        '- StructureX is an analytical command center, not an emergency service or certified structural inspection.',
        '- Use field inspection, engineering drawings, material testing, and professional review before safety-critical decisions.',
        '',
    ].join('\n');
}

function downloadSessionReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const report = buildSessionReport();
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `structurex-session-report-${timestamp}.md`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
    }, 250);
}

function initProfileActions() {
    // Export Session Report
    const exportBtn = $('#up-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            downloadSessionReport();
            addActivity('export', 'Session report exported', 'green');
            closeUserProfilePanel();
        }, true);

        exportBtn.addEventListener('click', () => {
            const elapsed = Math.floor((Date.now() - userProfile.sessionStart) / 1000);
            const userJson = localStorage.getItem('sx_user');
            const user = userJson ? JSON.parse(userJson) : { name: 'User', email: 'unknown' };
            
            let report = `STRUCTUREX SESSION REPORT\n`;
            report += `${'═'.repeat(40)}\n\n`;
            report += `User: ${user.name}\n`;
            report += `Email: ${user.email}\n`;
            report += `Date: ${new Date().toLocaleString()}\n`;
            report += `Session Duration: ${formatTime(elapsed)}\n`;
            report += `Total Interactions: ${userProfile.clicks}\n`;
            report += `Buildings Analyzed: ${userProfile.buildingsAnalyzed}\n`;
            report += `Scenarios Run: ${userProfile.scenariosRun}\n\n`;
            report += `ACTIVITY LOG\n${'─'.repeat(40)}\n`;
            userProfile.activities.forEach(a => {
                report += `[${a.time.toLocaleTimeString()}] ${a.message}\n`;
            });

            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `structurex-session-${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            addActivity('export', 'Session report exported', 'green');
        });
    }

    // Clear History
    const clearBtn = $('#up-clear-history-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            userProfile.activities = [];
            renderActivityList();
            addActivity('login', 'Activity history cleared', 'red');
            closeUserProfilePanel();
        });
    }

    // Theme Toggle
    const themeBtn = $('#up-theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('theme-light');
            const isLight = document.body.classList.contains('theme-light');
            themeBtn.innerHTML = isLight
                ? '<i class="fas fa-moon"></i> Dark Mode'
                : '<i class="fas fa-palette"></i> Switch Theme';
            addActivity('theme', isLight ? 'Switched to light theme' : 'Switched to dark theme', 'purple');
            closeUserProfilePanel();
        });
    }

    // Fullscreen
    const fsBtn = $('#up-fullscreen-btn');
    if (fsBtn) {
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                fsBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
                addActivity('theme', 'Entered fullscreen mode', 'blue');
            } else {
                document.exitFullscreen();
                fsBtn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
            }
            closeUserProfilePanel();
        });
    }
}

function loadUserStats() {
    try {
        return JSON.parse(localStorage.getItem('sx_user_stats') || '{}');
    } catch { return {}; }
}

function saveUserStats(stats) {
    localStorage.setItem('sx_user_stats', JSON.stringify(stats));
}

function handleLogout() {
    const capsule = $('#user-capsule');
    if (capsule) capsule.classList.add('logging-out');

    // Save final session time
    const elapsed = Math.floor((Date.now() - userProfile.sessionStart) / 1000);
    const stats = loadUserStats();
    stats.totalSeconds = (stats.totalSeconds || 0) + (elapsed % 10);
    saveUserStats(stats);

    clearInterval(userProfile.sessionTimer);

    setTimeout(() => {
        localStorage.removeItem('sx_user');
        window.location.href = '/login';
    }, 600);
}

/* ==========================================================================
   VOICE ASSISTANT WIDGET LOGIC
   ========================================================================== */
function initVoiceAssistant() {
    // --- Voice Assistant Logic ---
    const synth = window.speechSynthesis;
    if (synth) synth.cancel();
    const navVoiceBtn = document.getElementById('nav-voice-btn');
    const navVoiceMenu = document.getElementById('nav-voice-menu');
    const navReadBtn = document.getElementById('nav-read-btn');
    const navSummarizeBtn = document.getElementById('nav-summarize-btn');
    
    // Updated Status Panel controls
    const statusPanel = document.getElementById('voice-status-panel');
    const timerDisplay = document.getElementById('voice-timer');
    const waveform = document.getElementById('voice-waveform');
    const pauseBtn = document.getElementById('v-status-pause');
    const stopBtn = document.getElementById('v-status-stop');
    const voiceWidget = document.getElementById('voice-assistant-widget');
    const dragHandle = statusPanel ? statusPanel.querySelector('.v-status-top') : null;
    
    let voiceTimer = null;
    let voiceSeconds = 0;
    let utteranceQueue = [];
    let isSpeakingSequence = false;
    let isVoicePaused = false;
    let isNavMenuOpen = false;

    function positionNavVoiceMenu() {
        if (!navVoiceBtn || !navVoiceMenu) return;
        const buttonRect = navVoiceBtn.getBoundingClientRect();
        const gap = 10;
        const menuWidth = navVoiceMenu.offsetWidth || Math.min(430, window.innerWidth - 24);
        const menuHeight = navVoiceMenu.offsetHeight || 360;
        const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8);
        const maxTop = Math.max(8, window.innerHeight - menuHeight - 8);
        const left = Math.min(Math.max(8, buttonRect.left + buttonRect.width / 2 - menuWidth / 2), maxLeft);
        const top = Math.min(Math.max(8, buttonRect.bottom + gap), maxTop);
        navVoiceMenu.style.left = `${left}px`;
        navVoiceMenu.style.top = `${top}px`;
    }

    function openNavVoiceMenu() {
        if (!navVoiceMenu) return;
        isNavMenuOpen = true;
        navVoiceMenu.classList.add('show');
        requestAnimationFrame(positionNavVoiceMenu);
    }

    function closeNavVoiceMenu() {
        if (!navVoiceMenu) return;
        navVoiceMenu.classList.remove('show');
        isNavMenuOpen = false;
    }

    function initVoicePanelDrag() {
        if (!voiceWidget || !statusPanel || !dragHandle) return;
        let drag = null;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        dragHandle.addEventListener('pointerdown', (event) => {
            if (!statusPanel.classList.contains('active') || event.target.closest('button')) return;
            const rect = voiceWidget.getBoundingClientRect();
            drag = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                pointerId: event.pointerId,
            };
            voiceWidget.classList.add('dragging');
            dragHandle.setPointerCapture(event.pointerId);
            event.preventDefault();
        });

        dragHandle.addEventListener('pointermove', (event) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            const panelRect = voiceWidget.getBoundingClientRect();
            const left = clamp(event.clientX - drag.x, 8, window.innerWidth - panelRect.width - 8);
            const top = clamp(event.clientY - drag.y, 8, window.innerHeight - panelRect.height - 8);
            voiceWidget.style.left = `${left}px`;
            voiceWidget.style.top = `${top}px`;
            voiceWidget.style.bottom = 'auto';
            voiceWidget.style.transform = 'none';
            event.preventDefault();
        });

        const finishDrag = (event) => {
            if (!drag || drag.pointerId !== event.pointerId) return;
            drag = null;
            voiceWidget.classList.remove('dragging');
            if (dragHandle.hasPointerCapture(event.pointerId)) {
                dragHandle.releasePointerCapture(event.pointerId);
            }
        };

        dragHandle.addEventListener('pointerup', finishDrag);
        dragHandle.addEventListener('pointercancel', finishDrag);
    }

    initVoicePanelDrag();

    if (navVoiceBtn) {
        navVoiceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isSpeakingSequence) {
                stopSpeaking();
                closeNavVoiceMenu();
            } else {
                if (isNavMenuOpen) {
                    closeNavVoiceMenu();
                } else {
                    openNavVoiceMenu();
                }
            }
        });
    }

    // Prevent clicks inside the menu from closing it
    if (navVoiceMenu) {
        navVoiceMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Close menu when clicking anywhere else on the document
    document.addEventListener('click', (e) => {
        if (isNavMenuOpen && !navVoiceBtn.contains(e.target)) {
            closeNavVoiceMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (isNavMenuOpen) positionNavVoiceMenu();
    });

    if (navReadBtn) {
        navReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNavVoiceMenu();
            const segments = getTextSegments('full');
            speakSequence(segments);
        });
    }

    if (navSummarizeBtn) {
        navSummarizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNavVoiceMenu();
            const segments = getTextSegments('summarize');
            speakSequence(segments);
        });
    }

    document.addEventListener('click', () => {
        if (navVoiceMenu) {
            closeNavVoiceMenu();
        }
    });

    function getTextSegments(mode) {
        let textToRead = "";
        
        // Foolproof extraction logic
        const bNameNode = document.querySelector('.det-name, #det-name');
        const bName = bNameNode ? bNameNode.textContent.trim() : "";
        
        let bRisk = "";
        const rightPanelText = (document.getElementById('right-panel') || document.body).textContent;
        const scoreMatch = rightPanelText.match(/REVIEW\s*([0-9.]+)/i) || rightPanelText.match(/score\s*is\s*([0-9.]+)/i);
        if (scoreMatch) bRisk = scoreMatch[1];
        
        let bReview = "";
        const summaryNode = document.querySelector('.ai-summary');
        if (summaryNode) {
            bReview = summaryNode.textContent;
        } else {
            const resultEl = document.getElementById('building-result');
            if (resultEl) bReview = resultEl.textContent;
        }
        bReview = bReview.replace(/WARNING|CRITICAL|SAFE|Routine structural review advised.*/gi, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

        const isBuildingOpen = bName && bName.toLowerCase() !== "building analysis" && bName.length > 3 && bReview.length > 10;

        if (isBuildingOpen) {
            if (mode === 'summarize') {
                const sentences = bReview.split(/[.!]/).filter(s => s.length > 5);
                const shortSummary = sentences.slice(0, 3).join('. ') + '.';
                textToRead = `Building analysis for ${bName}. The computed structural risk score is ${bRisk || 'unavailable'}. Here is a brief summary of the findings: ${shortSummary} All other telemetry falls within acceptable operational thresholds.`;
            } else {
                textToRead = `Initiating full deep scan review for ${bName}. The current risk index is evaluated at ${bRisk || 'unknown'}. Here are the comprehensive structural findings: ${bReview}. End of structural analysis report.`;
            }
        } else {
            const searchInput = document.querySelector('input[type="text"]');
            const locName = (searchInput && searchInput.value) ? searchInput.value : "the global operational area";
            
            if (mode === 'summarize') {
                textToRead = `Structure X Digital Twin Command Center is actively monitoring ${locName}. All satellite uplinks, ground vibration sensors, and core infrastructure telemetry streams are nominal. The AI engine is currently processing real-time environmental physics and load-path degradation models. Click on any specific building on the map to run a detailed, isolated structural evaluation, or use the CSV dataset tool on the left to run bulk evaluations.`;
            } else {
                textToRead = `Welcome to Structure X. This is the world's most advanced AI-powered digital twin command center. Currently, we are surveying infrastructure networks across ${locName}. Our system ingests thousands of real-time data points including satellite displacement mapping, ground-level vibration sensors, historical maintenance logs, and live environmental factors. By feeding this multimodal data into our physics-informed neural networks, Structure X can predict structural failures before they occur. 

                A core capability of Structure X is our bulk CSV Dataset Engine. We built this feature because manually analyzing thousands of structures across an entire city is inefficient and error-prone. By opening the 'Data & Scenarios' tab on the left, you can seamlessly upload a standard CSV file containing basic building attributes like coordinates, height, and age. The AI engine will instantly parallel-process the entire dataset, correlating your uploaded parameters against our global geographic and seismic risk models. This allows urban planners, civil engineers, and government agencies to instantly visualize city-wide vulnerabilities on the map, prioritizing maintenance and retrofit budgets exactly where they are needed most. 
                
                To interact with the system, simply select any glowing infrastructure node on the map to initialize a deep, targeted architectural scan, or upload your own CSV data to begin a mass portfolio analysis. All systems are currently green and fully operational. Standing by for your commands.`;
            }
        }
        
        // Chunk the text into sentences to prevent browser synthesis from cutting out early
        let cleanText = textToRead.replace(/\s+/g, ' ').trim();
        return cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    }

    const voiceSelect = document.getElementById('v-voice-select');
    const rateSlider = document.getElementById('v-rate-slider');
    const pitchSlider = document.getElementById('v-pitch-slider');

    // Pre-load voices and populate select
    let availableVoices = [];
    function loadVoices() { 
        const newVoices = synth.getVoices();
        if (newVoices.length === 0) return;
        
        // Only repopulate if voice count changed to avoid flickering/selection loss
        if (newVoices.length === availableVoices.length && voiceSelect.options.length > 0) return;
        
        availableVoices = newVoices;
        if (voiceSelect) {
            const currentVal = voiceSelect.value;
            voiceSelect.innerHTML = ''; 
            
            availableVoices.forEach((voice, i) => {
                const option = document.createElement('option');
                option.textContent = `${voice.name.replace('Microsoft', '').replace('Google', '').trim()} (${voice.lang})`;
                option.value = i;
                voiceSelect.appendChild(option);
            });
            
            if (currentVal && availableVoices[currentVal]) {
                voiceSelect.value = currentVal;
            } else {
                const defaultIdx = availableVoices.findIndex(v => v.name.includes('Aria') || v.name.includes('Jenny') || v.name.includes('UK English Female') || v.name.includes('Zira'));
                if (defaultIdx !== -1) voiceSelect.value = defaultIdx;
            }
        }
    }
    loadVoices();
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
    
    // Also try periodic refresh for slow-loading browsers
    const voiceRetry = setInterval(() => {
        if (availableVoices.length === 0) loadVoices();
        else clearInterval(voiceRetry);
    }, 1000);
    
    // Initial engine wake-up to prevent start-up delays
    window.addEventListener('mousedown', () => {
        const wake = new SpeechSynthesisUtterance("");
        wake.volume = 0;
        synth.speak(wake);
    }, { once: true });
    
    function startTimer() {
        voiceSeconds = 0;
        timerDisplay.textContent = "00:00";
        if (voiceTimer) clearInterval(voiceTimer);
        voiceTimer = setInterval(() => {
            if (isSpeakingSequence && !isVoicePaused) {
                voiceSeconds++;
                const m = String(Math.floor(voiceSeconds / 60)).padStart(2, '0');
                const s = String(voiceSeconds % 60).padStart(2, '0');
                timerDisplay.textContent = `${m}:${s}`;
            }
        }, 1000);
    }
    
    function stopTimer() {
        if (voiceTimer) clearInterval(voiceTimer);
    }

    function playNextSegment() {
        if (utteranceQueue.length === 0) {
            stopSpeaking();
            return;
        }
        
        const text = utteranceQueue.shift();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Prevent Chromium garbage collection bug
        window.currentUtterance = utterance;
        
        // Apply User Settings with explicit float parsing
        const rate = rateSlider ? parseFloat(rateSlider.value) : 1.0;
        const pitch = pitchSlider ? parseFloat(pitchSlider.value) : 1.0;
        
        // Clamp values to ensure browser compatibility
        utterance.rate = Math.max(0.5, Math.min(2.0, rate));
        utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));
        
        if (voiceSelect && availableVoices[voiceSelect.value]) {
            utterance.voice = availableVoices[voiceSelect.value];
        } else {
            let bestVoice = availableVoices.find(v => v.name.includes('Aria')) ||
                            availableVoices.find(v => v.name.includes('Jenny')) ||
                            availableVoices.find(v => v.name.includes('English')) ||
                            availableVoices[0];
            if (bestVoice) utterance.voice = bestVoice;
        }

        utterance.onend = () => {
            if (isSpeakingSequence) {
                // Gap adjustment for smoother flow
                setTimeout(() => {
                    if (isSpeakingSequence && !isVoicePaused) playNextSegment();
                }, 50);
            }
        };
        
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis error:", e);
            if (isSpeakingSequence) playNextSegment();
        };

        synth.speak(utterance);
    }

    function speakSequence(segments) {
        // Wake up/Clear engine to prevent the 10s delay bug in some browsers
        synth.cancel();
        const wakeUp = new SpeechSynthesisUtterance("");
        synth.speak(wakeUp);
        
        utteranceQueue = segments;
        isSpeakingSequence = true;
        isVoicePaused = false;
        
        if (navVoiceBtn) navVoiceBtn.classList.add('active');
        statusPanel.classList.add('active');
        pauseBtn.querySelector('i').className = 'fas fa-pause';
        waveform.classList.remove('paused');
        
        startTimer();
        playNextSegment();
    }

    function stopSpeaking() {
        isSpeakingSequence = false;
        isVoicePaused = false;
        utteranceQueue = [];
        synth.cancel();
        if (navVoiceBtn) navVoiceBtn.classList.remove('active');
        statusPanel.classList.remove('active');
        stopTimer();
    }

    pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSpeakingSequence) {
            if (isVoicePaused) {
                synth.resume();
                isVoicePaused = false;
                pauseBtn.querySelector('i').className = 'fas fa-pause';
                waveform.classList.remove('paused');
            } else {
                synth.pause();
                isVoicePaused = true;
                pauseBtn.querySelector('i').className = 'fas fa-play';
                waveform.classList.add('paused');
            }
        }
    });

    stopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopSpeaking();
    });

    const closeBtn = document.getElementById('v-status-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stopSpeaking();
        });
    }

    // Delegation for inline voice buttons inside the right panel
    document.getElementById('right-panel').addEventListener('click', (e) => {
        const btn = e.target.closest('.inline-voice-btn');
        if (btn) {
            e.stopPropagation();
            const text = btn.getAttribute('data-text');
            if (text) {
                let cleanText = text.replace(/\s+/g, ' ').trim();
                let segments = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
                speakSequence(segments);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initVoiceAssistant();
});
