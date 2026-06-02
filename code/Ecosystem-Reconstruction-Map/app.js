mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';

const opacity = 0.7;

const ecosystemColours = {
    "Inland saline": "#10ee9b",
    "Mātai-tōtara/black/mountain beech forest": "#c1e4c7",
    "Fen": "#067aa5",
    "Mātai-kahikatea-tōtara forest": "#799639",
    "Mountain beech forest": "#5b741d",
    "Hall's tōtara-miro-rimu/kāmahi-silver beech-southern rata forest": "#439878",
    "Hall's tōtara-miro-rimu/kāmahi-southern rata-broadleaf forest": "#449981",
    "Hall's tōtara-miro/kamahi-southern rata broadleaf forest": "#8bb653",
    "Scrub, tussock-grassland and herbfield above treeline": "#dfc494",
    "Silver beech forest": "#3b4b12",
    "Marsh": "#02f3f5",
    "Mātai-tōtara-kahikatea-rimu/broadleaf-fuchsia forest": "#3d9c6f",
    "Dunelands": "#f8e71c",
    "Seepage": "#60f3ac",
    "Mountain beech-red beech forest": "#829e3a",
    "Rimu-miro/kāmahi-red beech-hard beech forest": "#45b68b",
    "Gumland": "#49bbac",
    "Rimu-miro/tāwari-red beech-kāmahi-tawa forest": "#99c8b2",
    "Kahikatea-tōtara forest": "#a9dd31",
    "Hall's tōtara/silver-beech-kāmahi-southern rata forest": "#55711f",
    "Bog": "#8cddfb",
    "Scrub, shrubland and tussock-grassland below treeline": "#bd9a5e",
    "Pakihi": "#11d8a9",
    "Unclassified": "#e1e1e1",
    "Rimu-miro-tōtara/kāmahi forest": "#d3e5d6",
    "Wetland_Unclassified": "#3388ff",
    "Rimu-mātai-miro-tōtara/kāmahi forest": "#add164",
    "Kahikatea-pukatea-tawa forest": "#9ec546",
    "Kahikatea-mātai/tawa-māhoe forest": "#3d8c66",
    "Swamp": "#5b75b3",
    "Hall's tōtara/broadleaf forest": "#a4ca73",
    "Red beech-silver beech forest": "#406b0c",
    "Kauri/taraire-kohekohe-tawa forest": "#cde1a5",
    "Rimu/tawa-kamahi forest": "#117c50"
};


let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/wpearson-litmus/clvao8tps004201rd1ps2ctqm',
    id: 'light',
    center: [173.5, -41],
    zoom: 5,
    pitch: 0,
    bearing: 0,
});

// Add tileset layers

// tippecanoe -z10 -Z0 -y Priority -S 10 -pS -o data/output/tiles_2.0_Z0_z10_yP_S_pS.mbtiles data/output/*.geojson
// var tilesetSourceUrl = 'mapbox://wpearson-litmus.7h6k4rzk';
// tippecanoe -z10 -Z0 -S 10 -pS -o data/output/ecosystem_tiles_2.0_Z0_z10_S_pS.mbtiles data/output/restoration_priority_levels.geojson
var restorationSourceUrl = 'mapbox://wpearson-litmus.1n2jls85';
// tippecanoe -z10 -Z0 -S 10 -pS -o data/output/cost_tiles_2.0_Z0_z10_S_pS.mbtiles data/output/costs_per_catchment.geojson
// var costSourceUrl = 'mapbox://wpearson-litmus.bb5o9iyw';
var costSourceUrl = 'mapbox://wpearson-litmus.56q4h1fu';

// tippecanoe -z10 -Z0 -S 10 -pS -o data/output/catchment_tiles_2.0_Z0_z10_S_pS.mbtiles data/output/eco-index-catchment*.geojson
var catchmentsSourceUrl = 'mapbox://wpearson-litmus.3bu49g26'
// uploaded eco-index-catchment-labels.geojson to mapbox datasets and converted to tileset
var catchmentLabelsSourceUrl = 'mapbox://wpearson-litmus.cm1voimkv1d0a1vo6p322pgcp-6dl9a'
// tippecanoe -z10 -Z0 -S 10 -pS -o data/output/iwi_tiles_2.0_Z0_z10_S_pS.mbtiles data/output/iwi-areas-of-interest.geojson
var iwiSourceUrl = 'mapbox://wpearson-litmus.6epr7kb7'

map.on('style.load', () => {
    // // Add the satellite (only shown when we click 'ShowPremade' toggle)
    // map.addSource("mapbox-satellite", { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 });
    // map.addLayer({
    //     "type": "raster", "id": 'satellite-map', "source": "mapbox-satellite", 'layout': {
    //         'visibility': 'none'
    //     },
    // });
    // // Add daytime fog
    // map.setFog({
    //     'range': [-1, 2],
    //     'horizon-blend': 0.3,
    //     'color': 'white',
    // });
    // Add 3D (DEM source as a terrain layer with exaggerated height)
    map.addSource('mapbox-terrain-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-terrain-dem', 'exaggeration': 2 });

    // Add restoration data layers
    map.addSource('tileset', {
        type: 'vector',
        url: restorationSourceUrl,
        minzoom: 0,
        maxzoom: 22,
    });
    map.addLayer({
        id: 'expectednaturalrangeofecosystems',
        type: 'fill',
        source: 'tileset',
        'source-layer': 'restoration_priority_levels',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': 'rgba(0, 0, 0, 0)', // Remove outlines due to the tileset layer being split at PNVW level
            'fill-color': [
                'match',
                ['get', 'PNVWmacron'],
                ...Object.keys(ecosystemColours).flatMap(key => [key, ecosystemColours[key]]),
                '#ffffff'  // Default color if the value doesn't match any category
            ],
            'fill-opacity': opacity,
        }
    });
    map.addLayer({
        id: 'restorationprioritylevels',
        type: 'fill',
        source: 'tileset',
        'source-layer': 'restoration_priority_levels',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'fill-color': [
                'step',
                ['get', 'ENA_prop'],
                '#bd0026',
                0.05, '#f03b20',
                0.1, '#fd8d3c',
                0.15, '#feb24c',
                0.25, '#fed976',
                0.35, '#ffffb2'
            ],
            'fill-outline-color': 'rgba(0, 0, 0, 0)', // Remove outlines due to the tileset layer being split at PNVW level
            'fill-opacity': opacity,
        }
    });

    // Add cost data layer
    map.addSource('cost_tileset', {
        type: 'vector',
        url: costSourceUrl,
        minzoom: 0,
        maxzoom: 22,
    });
    map.addLayer({
        id: 'costs_per_catchment',
        type: 'fill',
        source: 'cost_tileset',
        'source-layer': 'recon_costs_per_catchment_4326_20241212',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-color': [
                'interpolate',
                ['linear'],  // Using a log scale to handle the wide range of values
                ['get', 'log_cost'],
                4.7, '#f7fbff',
                5.5, '#deebf7',
                6.5, '#c6dbef',
                7.5, '#9ecae1',
                8.5, '#6baed6',
                9.5, '#4292c6',
                10.5, '#2171b5',
                11.5, '#084594'
            ],
            'fill-outline-color': 'rgba(0, 0, 0, 0)',
            'fill-opacity': 0.9
        }
    });
    map.addLayer({
        id: 'costs_per_catchment_line',
        type: 'line',
        source: 'cost_tileset',
        'source-layer': 'recon_costs_per_catchment_4326_20241212',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'line-color': '#08306b',
            'line-opacity': 0.5,
            'line-width': 1,
        }
    });

    map.addSource('catchments_tileset', {
        type: 'vector',
        url: catchmentsSourceUrl,
        minzoom: 0,
        maxzoom: 22,
    });
    map.addLayer({
        id: 'ecoindexcatchments',
        type: 'line',
        source: 'catchments_tileset',
        'source-layer': 'ecoindexcatchments',
        'layout': {
            'visibility': 'visible'
        },
        'paint': {
            'line-color': 'rgba(0, 0, 0, 1)',
            'line-width': 1,
        }
    });
    map.addSource('catchment_labels_tileset', {
        type: 'vector',
        url: catchmentLabelsSourceUrl,
        minzoom: 0,
        maxzoom: 22,
    });
    map.addLayer({
        'id': 'ecoindexcatchmentlabels',
        'type': 'symbol',
        'source': 'catchment_labels_tileset',
        'source-layer': 'eco-index-catchment-labels',
        'layout': {
            'text-field': ['get', 'Catchment'],
            'text-size': 12,
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
            'text-anchor': 'center',
            'visibility': 'visible'
        },
        'paint': {
            'text-color': '#000'
        },
    });

    map.addSource('iwi_tileset', {
        type: 'vector',
        url: iwiSourceUrl,
        minzoom: 0,
        maxzoom: 22,
    });
    map.addLayer({
        id: 'iwiareasofinterest-line',
        type: 'line',
        source: 'iwi_tileset',
        'source-layer': 'iwiareasofinterest',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'line-color': 'rgba(150, 0, 255, 1)',
            'line-width': 1,
        }
    });
    map.addLayer({
        id: 'iwiareasofinterest',
        type: 'fill',
        source: 'iwi_tileset',
        'source-layer': 'iwiareasofinterest',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-color': 'rgba(0,0,0,0)'
        }
    });
    map.addLayer({
        id: 'iwiareasofinterest-highlighted',
        type: 'fill',
        source: 'iwi_tileset',
        'source-layer': 'iwiareasofinterest',
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            'fill-outline-color': '#484896',
            'fill-color': '#6e599f',
            'fill-opacity': 0.5
        },
        'filter': ['in', 'TPK_Code', '']
    });

    let ecoPopup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '400px'
    });

    const ecosystemTypes = {
        'Bog': 'bog',
        'Dunelands': 'dunelands',
        'Fen': 'fen',
        'Gumland': 'gumlands',
        "Hall's tōtara-miro-rimu/kāmahi-silver beech-southern rata forest": "halls-totara-miro-rimu-silver-beech-rata",
        "Hall's tōtara-miro-rimu/kāmahi-southern rata-broadleaf forest": "halls-totara-miro-rimu-silver-beech-rata",
        "Hall's tōtara-miro/kāmahi-southern rata broadleaf forest": "halls-totara-miro-kamahi-rata",
        "Hall's tōtara/broadleaf forest": "halls-totara-broadleaf-forest",
        "Hall's tōtara/silver-beech-kāmahi-southern rata forest": "halls-totara-silverbeech-kamahi-rata",
        'Inland saline': 'inland-saline',
        'Kahikatea-mātai/tawa-māhoe forest': 'kahikatea-tawa-mahoe',
        'Kahikatea-pukatea-tawa forest': 'kahikatea-pukatea-tawa',
        'Kahikatea-tōtara forest': 'kahikatea-totara',
        'Kauri/taraire-kohekohe-tawa forest': 'kauri-northern-broadleaved',
        'Marsh': 'marsh',
        'Mountain beech forest': 'mountain-beech',
        'Mountain beech-red beech forest': 'mountain-beech-red-beech',
        'Mātai-kahikatea-tōtara forest': 'matai-kahikatea-totara',
        'Mātai-tōtara-kahikatea-rimu/broadleaf-fuchsia forest': 'matai-totara-kahikatea-rimu-broadleaf-fuchsia',
        'Mātai-tōtara/black/mountain beech forest': 'matai-totara-black-beech-mountain-beech',
        'Pakihi': 'pakihi',
        'Red beech-silver beech forest': 'red-beech-silver-beech',
        'Rimu-miro-tōtara/kāmahi forest': 'rimu-miro-totara-kamahi',
        'Rimu-miro/kāmahi-red beech-hard beech forest': 'rimu-miro-kamahi-red-beech-hard-beech',
        'Rimu-miro/tāwari-red beech-kāmahi-tawa forest': 'rimu-miro-tawari-red-beech-kamahi-tawa',
        'Rimu-mātai-miro-tōtara/kāmahi forest': 'rimu-matai-miro-totara-kamahi',
        'Rimu/tawa-kamahi forest': 'rimu-tawa-kamahi',
        'Scrub, shrubland and tussock-grassland below treeline': 'scrub-shrubland-tussock-grassland-below-treeline',
        'Scrub, tussock-grassland and herbfield above treeline': 'scrub-tussock-grassland-herbfield',
        'Seepage': 'seepage',
        'Silver beech forest': 'silver-beech',
        'Swamp': 'swamp',
        'Unclassified': null,
        'Wetland Unclassified': null
    };

    // Function to simplify and format large numbers to 3 significant figures
    function formatNumber(num) {
        if (num >= 1e9) {
            return (num / 1e9).toPrecision(3) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toPrecision(3) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toPrecision(3) + 'K';
        } else if (num == 0) {
            return '0';
        } else {
            return num.toPrecision(3);
        }
    }

    const pnvwDataLayers = ["expectednaturalrangeofecosystems", "restorationprioritylevels"];
    const catchmentDataLayers = ["costs_per_catchment"];
    const allPopupLayers = ["expectednaturalrangeofecosystems", "restorationprioritylevels", "costs_per_catchment", "iwiareasofinterest"];
    const refLayers = ["ecoindexcatchments", "iwiareasofinterest"];

    map.on('click', (e) => {
        map.setFilter('iwiareasofinterest-highlighted', ['==', 'TPK_Code', '']);

        // pnvw popup
        let features = map.queryRenderedFeatures(e.point, { layers: ["expectednaturalrangeofecosystems", "restorationprioritylevels", "iwiareasofinterest"] });
        let restorationFeatures = features.filter(f => pnvwDataLayers.includes(f.layer.id));
        if (restorationFeatures.length) {
            let restorationProperties = restorationFeatures[0].properties;
            let iwiFeatures = features.filter(f => f.layer.id == "iwiareasofinterest");
            let iwiPresent = iwiFeatures.map(f => f.properties.Name).join(", ");

            var priority = restorationProperties["Priority"].split(" / ")[0];

            var reconstructionNeeded = ((restorationProperties["Restorable"] + restorationProperties["ENA_Area_h"] + restorationProperties["Unavailabl"]) * 0.15) - restorationProperties["ENA_Area_h"];
            reconstructionNeeded = Math.max(0, reconstructionNeeded);

            var popupContent = `
                <div class="mapbox-popup-content">
                    <p class="mapbox-popup-row"><strong>Catchment:</strong> ${restorationProperties["Catchment"]}</p>
                    <p class="mapbox-popup-row"><strong>Projected ecosystem type:</strong> ${restorationProperties["PNVWmacron"]}</p>
                    <p class="mapbox-popup-row"><strong>Reconstruction priority:</strong> ${priority}</p>
                    <p class="mapbox-popup-row"><strong>Reconstruction needed to achieve 15% cover in this catchment:</strong> ${reconstructionNeeded.toFixed(2)} ha</p>
                    ${iwiPresent !== '' ? `<p class="mapbox-popup-row"><strong>Iwi Area of Interest:</strong> ${iwiPresent}</p>` : ''}
                    ${ecosystemTypes[restorationProperties["PNVWmacron"]] !== null ? `<iframe class="mapbox-iframe" width="340" height="220" src="https://eco-index.nz/ecosystem-types/${ecosystemTypes[restorationProperties["PNVWmacron"]]}"></iframe>` : ''}
                </div>
            `;

            ecoPopup
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
            return;
        }

        // costs popup
        features = map.queryRenderedFeatures(e.point, { layers: catchmentDataLayers });
        if (features.length) {
            let properties = features[0].properties;
            console.log(properties);
            let lowEstimate = properties['recon_costs_except_fencing'] + properties['Phase1: Fencing scenarioC 5ha compact'];
            let highEstimate = properties['recon_costs_except_fencing'] + properties['Phase1: Fencing scenarioB 1ha convoluted'];
            console.log(lowEstimate, highEstimate);

            var popupContent = `
                <div class="mapbox-popup-content">
                    <p class="mapbox-popup-row"><strong>Catchment:</strong> ${properties['Catchment']}</p>
                    <p class="mapbox-popup-row"><strong>Reconstruction Costs Estimate:</strong></p>
                    <p class="mapbox-popup-row">$${formatNumber(lowEstimate)} - $${formatNumber(highEstimate)}</p>
                </div>
            `;

            ecoPopup
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map);
            return;
        }

        // iwi popup
        features = map.queryRenderedFeatures(e.point, { layers: ["iwiareasofinterest"] });
        if (features.length) {
            if (!features.length) {
                return;
            }

            let currentPage = 0;
            const totalPages = features.length;
            const popupWidth = '120px';

            const createPopupContent = (page) => {
                const feature = features[page];
                let content = `<div class="mapbox-popup-content" style="width: ${popupWidth};">`; // Apply fixed width to the popup
                content += `<div><strong>Iwi:</strong></div>`;
                content += `<div>${feature.properties.Name}</div>`; // Replace 'name' with the relevant property
                // Flex container for navigation arrows and page counter at the bottom
                content += `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                        <div>
                            <button id="prevPage" ${page === 0 ? 'disabled' : ''} class="nav-button">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button id="nextPage" ${page === totalPages - 1 ? 'disabled' : ''} class="nav-button" style="margin-left: 5px;">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <span>${page + 1} of ${totalPages}</span>
                    </div>
                `;

                content += `</div>`; // Close the fixed-width container

                return content;
            };

            const updateHighlight = (feature) => {
                console.log(feature.properties);
                map.setFilter('iwiareasofinterest-highlighted', ['==', 'TPK_Code', feature.properties.TPK_Code]);
            };
            updateHighlight(features[currentPage]);

            // Create the popup
            ecoPopup
                .setLngLat(e.lngLat)
                .setHTML(createPopupContent(currentPage))
                .addTo(map);


            // Event listeners for navigation buttons
            ecoPopup.getElement().addEventListener('click', (event) => {
                const prevButton = event.target.closest('#prevPage');
                const nextButton = event.target.closest('#nextPage');
                if (prevButton && currentPage > 0) {
                    currentPage--;
                    ecoPopup.setHTML(createPopupContent(currentPage));
                    updateHighlight(features[currentPage]);
                } else if (nextButton && currentPage < totalPages - 1) {
                    currentPage++;
                    ecoPopup.setHTML(createPopupContent(currentPage));
                    updateHighlight(features[currentPage]);
                }
            });
            return;
        } else {
            map.setFilter('iwiareasofinterest-highlighted', ['==', 'TPK_Code', '']);
        }
    });

    map.on('mouseenter', allPopupLayers, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', allPopupLayers, () => {
        map.getCanvas().style.cursor = '';
    });

    // Update the legend checkboxes
    refLayers.forEach(function (layerId) {
        let checkbox = document.getElementById(`toggle${layerId}`);
        checkbox.addEventListener('change', function (e) {
            map.setLayoutProperty(layerId, 'visibility', checkbox.checked ? 'visible' : 'none');
            if (layerId == 'ecoindexcatchments') {
                map.setLayoutProperty('ecoindexcatchmentlabels', 'visibility', checkbox.checked ? 'visible' : 'none');
            } else if (layerId == 'iwiareasofinterest') {
                map.setLayoutProperty('iwiareasofinterest-highlighted', 'visibility', checkbox.checked ? 'visible' : 'none');
                map.setLayoutProperty('iwiareasofinterest-line', 'visibility', checkbox.checked ? 'visible' : 'none');
            }
        });
    });
    const exclusiveLayers = ["expectednaturalrangeofecosystems", "restorationprioritylevels", "costs_per_catchment"];
    exclusiveLayers.forEach(function (layerId) {
        let checkbox = document.getElementById(`toggle${layerId}`);
        checkbox.addEventListener('change', (e) => {
            console.log(e.target);
            map.setLayoutProperty(layerId, 'visibility', checkbox.checked ? 'visible' : 'none');
            exclusiveLayers.forEach((otherLayer) => {
                if (layerId == otherLayer) { return; }
                let otherCheckbox = document.getElementById(`toggle${otherLayer}`);
                otherCheckbox.checked = false;
                map.setLayoutProperty(otherLayer, 'visibility', 'none');
                if (otherLayer == 'costs_per_catchment') {  // Hide outlines if applicable
                    map.setLayoutProperty(`${otherLayer}_line`, 'visibility', 'none');
                }
                if (otherLayer == 'restorationprioritylevels') {
                    document.getElementById('scale-container').style.display = otherCheckbox.checked ? 'block' : 'none';
                }
            });
            if (layerId == 'restorationprioritylevels') {
                document.getElementById('scale-container').style.display = checkbox.checked ? 'block' : 'none';
            }
        });
    });

    function createReconstructionScale() {
        const canvas = document.getElementById('reconstructionCanvas');
        const context = canvas.getContext('2d');

        const colorStops = [
            { color: `rgba(255, 255, 178, ${opacity})` }, // Light yellow at 0.0
            { color: `rgba(254, 217, 118, ${opacity})` }, // Light orange at 0.05
            { color: `rgba(254, 178, 76, ${opacity})` }, // Darker orange at 0.1
            { color: `rgba(253, 141, 60, ${opacity})` }, // Red-orange at 0.15
            { color: `rgba(240, 59, 32, ${opacity})` }, // Dark red at 0.25
            { color: `rgba(189, 0, 38, ${opacity})` }  // Darkest red at 0.35
        ];

        // Create the linear gradient
        const gradient = context.createLinearGradient(0, canvas.height, 0, 0);
        colorStops.forEach((stop, index) => {
            const offset = index / (colorStops.length - 1);
            gradient.addColorStop(offset, stop.color);
        });

        // Fill the canvas with the gradient
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    createReconstructionScale();
});

// Disclaimer code
document.addEventListener("DOMContentLoaded", function () {
    const parentDiv = document.getElementById('navigator-embed');

    var popup = document.createElement("div");
    popup.id = "popup";
    popup.innerHTML = `
    <div>
        <div id="popup-content">
            <h2>Ecosystem Reconstruction Map version 2.0</h2>
            <p><b>This map is a guide to:</b></p>
            <ul>
                <li>Ecosystem reconstruction priority levels - based on current cover of native ecosystems, by catchment.</li>
                <li>Projected native ecosystems - based on expected ecosystem cover if people had never arrived in Aotearoa NZ.</li>
                <li>The area of new ecosystem reconstruction required to reach a goal of 15% native ecosystem cover, by catchment.
                    <a href="https://eco-index.nz/resources" title="15% goal rationale" target="_blank">Find the
                        rationale for the 15% goal here.</a>
                </li>
                <li>The estimated costs of ecosystem reconstruction and maintenance, by catchment.</li>
            </ul>

            <p><b>This map is not:</b></p>
            <ul>
                <li>Intended to distract from the importance of protecting existing native ecosystems. <b>Protection and restoration of existing ecosystems is the highest priority for biodiversity management.</b></li>
                <li>A comprehensive ecological reconstruction or restoration guide. Please use it alongside other information sources.</li>
                <li>A resource about ecosystem quality or condition.</li>
            </ul>

            <p><a href="http://www.eco-index.nz/frequently-asked-questions" title="FAQs" target="_blank">Click here
                    for frequently asked questions.</a></p>
            <p>For best results, this map should be viewed on a computer, laptop or tablet.</p>
            <p><a rel="license" href="http://creativecommons.org/licenses/by/4.0/" target="_blank"></a> The
                Ecosystem Reconstruction Map v2.0 is a Digital Public Good by Eco-index® under <a rel="license"
                    href="http://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a> license.</p>

            <p><b>Eco-index Disclaimer</b></p>
            <p class="disclaimer">Eco-index provides biodiversity information for general information purposes only, and any reliance you place on such information is strictly at your own risk. You should not construe or rely on any such information as legal, tax, investment, financial or other advice. You assume sole responsibility of evaluating the merits and risks associated with the use of any Eco-index provided information (including for conclusions drawn from such use). Accordingly, Eco-index is not responsible for how this information is applied. Eco-index information does not imply landowner input, permission, or endorsement. Ecosystem Reconstruction Priority Level data are based on land cover maps created from satellite images obtained in 2018-19, and may not represent present day land cover due to natural changes or land use change.
</p>

            <p class="disclaimer">By clicking the <b>‘Accept’</b> button you acknowledge you have read and
                accepted the terms of this disclaimer.</p>

            <div id="popup-buttons">
                <button id="accept-btn">Accept</button>
                <button id="decline-btn">Decline</button>
            </div>

        </div>
    </div>
    `;

    var siteWrapper = document.getElementById('collection-666621d7f7f6f644548a71dd');
    siteWrapper.appendChild(popup);

    var overlay = document.getElementById("overlay");
    var acceptBtn = document.getElementById("accept-btn");
    var declineBtn = document.getElementById("decline-btn");

    // Show the disclaimer popup
    overlay.style.display = "block";
    popup.style.display = "block";

    // Function to hide the popup and overlay
    function hidePopup() {
        overlay.style.display = "none";
        popup.style.display = "none";
    }

    // Function to handle accept button click
    acceptBtn.addEventListener("click", function () {
        // Hide the popup and overlay
        hidePopup();
    });

    // Function to handle decline button click
    declineBtn.addEventListener("click", function () {
        // Block the user from using the content
        var navigator_embed = document.getElementById("navigator-embed");
        navigator_embed.innerHTML = "";
        navigator_embed.innerText = "Access denied. Please refresh and accept the disclaimer to access this content.";
    });

    let squarespaceBlock = document.getElementsByClassName("fe-block-yui_3_17_2_1_1712616198102_7897")
    let in_squarespace = false;
    if (squarespaceBlock.length == 1) {
        squarespaceBlock = squarespaceBlock[0];
        in_squarespace = true;
    }

    function reposition(elem) {
        if (in_squarespace) {
            blockWidth = squarespaceBlock.offsetWidth;
            blockHeight = squarespaceBlock.offsetHeight;
        } else {
            blockWidth = window.innerWidth;
            blockHeight = window.innerHeight;
        }
        /* Repositions the y index of an element if outside the window */
        if (elem.offsetTop > blockHeight - elem.offsetHeight) {
            elem.style.top = `${blockHeight - elem.offsetHeight}px`;
        }
    }

    // Legend
    function makeMinimisable(legend_id) {
        var legend = document.getElementById(legend_id);
        var toggle = document.getElementById("toggle-" + legend_id);
        toggle.addEventListener('click', function () {
            var legendContent = document.getElementById(legend_id + "-content");
            if (legendContent.style.display === "none") {
                legendContent.style.display = "block";
                this.innerHTML = '<i class="fas fa-minus"></i>';
                reposition(legend);
            } else {
                legendContent.style.display = "none";
                this.innerHTML = '<i class="fas fa-plus"></i>';
            }
        });
    }

    makeMinimisable("legend");
    makeMinimisable("scale-container");

    function makeDraggable(el) {
        var offsetX = 0, offsetY = 0;
        el.onmousedown = dragMouseDown;

        var blockWidth = 0, blockHeight = 0;

        function dragMouseDown(e) {
            // Get the mouse cursor position at startup
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            if (in_squarespace) {
                blockWidth = squarespaceBlock.offsetWidth;
                blockHeight = squarespaceBlock.offsetHeight;
            } else {
                blockWidth = window.innerWidth;
                blockHeight = window.innerHeight;
            }
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            // Calculate the new cursor position
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Boundary checks
            const minLeft = 0;
            const minTop = 0;
            const maxLeft = blockWidth - el.offsetWidth;
            const maxTop = blockHeight - el.offsetHeight;

            if (newLeft < minLeft) newLeft = minLeft;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop < minTop) newTop = minTop;
            if (newTop > maxTop) newTop = maxTop;

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    makeDraggable(document.getElementById("legend"));
    makeDraggable(document.getElementById("scale-container"));


    // Legend popup code
    const popupData = {
        "restoration": 'Areas where widespread ecosystem clearance has occurred are the highest priority for reconstruction of native ecosystems. <a href="https://eco-index.nz/frequently-asked-questions" target="_blank">See FAQ for more.</a>',
        "ecosystems": 'The type and area of native ecosystems that might be present if people never arrived in Aotearoa New Zealand. <a href="https://eco-index.nz/frequently-asked-questions" target="_blank">See FAQ for more.</a>',
        "costs": 'Estimated costs to reconstruct native ecosystem in each catchment to 15% of their projected cover. Including planting, fencing and early plant care costs. <a href="https://eco-index.nz/frequently-asked-questions" target="_blank">See FAQ for more.</a>.',
        "catchments": "Major ecological catchments of Aotearoa New Zealand, developed from MfE's sea draining catchments layer.",
        "iwi": 'Sourced from <a href="https://hub.arcgis.com/datasets/57126dc2c577429792b10e4d478406db/about" target="_blank">Te Puni Kōkiri</a>.'
    };

    const infoIcons = document.querySelectorAll('.info-icon');
    const infoPopup = document.getElementById('info-popup');
    const popupText = document.getElementById('info-popup-text');

    infoIcons.forEach(icon => {
        icon.addEventListener('click', function (event) {
            event.stopPropagation();
            const popupIconId = popupText.getAttribute('data-icon-id');
            const iconId = this.getAttribute('data-icon-id');
            const data = popupData[iconId];
            let content = '';

            if (data) {
                content = `<p>${data}</p>`;
            } else {
                content = '<p>No data available.</p>';
            }
            console.log(infoPopup)

            if (infoPopup.style.display === 'block' && popupIconId === iconId) {
                infoPopup.style.display = 'none'; // Hide the popup if it's already displayed with the same content
                popupText.setAttribute('data-icon-id', '');
            } else {
                popupText.innerHTML = content;
                popupText.setAttribute('data-icon-id', iconId);
                infoPopup.style.display = 'block';

                // Calculate the content width and adjust the popup width
                infoPopup.style.width = 'auto'; // Allow the content to define the width temporarily
                infoPopup.style.whiteSpace = 'nowrap'; // Prevent wrapping to accurately measure width

                // Measure the content width
                const contentWidth = infoPopup.getBoundingClientRect().width;

                // Adjust the popup width if the content is smaller than 500px
                const maxWidth = 500;
                infoPopup.style.width = `${Math.min(contentWidth, maxWidth)}px`;

                // Remove nowrap to allow wrapping again if needed
                infoPopup.style.whiteSpace = '';

                // Position the popup relative to the icon
                const iconRect = this.getBoundingClientRect();
                const popupRect = infoPopup.getBoundingClientRect();
                const parentRect = parentDiv.getBoundingClientRect();

                let left = iconRect.right - parentRect.left + 10;
                let top = iconRect.top - parentRect.top - popupRect.height / 2 + iconRect.height / 2;

                if (left + popupRect.width > parentRect.width) {
                    left = iconRect.left - parentRect.left - popupRect.width - 10;
                }
                if (top + popupRect.height > parentRect.height) {
                    top = parentRect.height - popupRect.height - 10;
                }

                // Set popup position
                infoPopup.style.left = `${left}px`;
                infoPopup.style.top = `${top}px`;
            }
        });
    });
    // Hide popup when clicking outside of the popup
    window.addEventListener('click', function (event) {
        if (event.target !== infoPopup) {
            infoPopup.style.display = 'none';
            popupText.setAttribute('data-icon-id', '');
        }
    });


    // Full screen button
    const fullscreenButton = document.getElementById('fullscreen-btn');
    const fullscreenIcon = fullscreenButton.querySelector('i');
    const navigatorEmbed = document.getElementById('navigator-embed');

    fullscreenButton.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            navigatorEmbed.requestFullscreen().then(() => {
                fullscreenIcon.classList.remove('fa-expand');
                fullscreenIcon.classList.add('fa-compress');
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                fullscreenIcon.classList.remove('fa-compress');
                fullscreenIcon.classList.add('fa-expand');
            });
        }
    });

    function resetElementPositions() {
        const resetElements = document.querySelectorAll('.reset');
        resetElements.forEach(el => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.right = '';
            el.style.bottom = '';
            el.style.transform = ''; // Reset any transforms that might affect positioning
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenIcon.classList.remove('fa-compress');
            fullscreenIcon.classList.add('fa-expand');
        }
        parentRect = parentDiv.getBoundingClientRect();
        resetElementPositions();
    });
});
