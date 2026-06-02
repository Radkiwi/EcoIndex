
mapboxgl.accessToken = "YOUR_REAL_TOKEN_HERE";

const maxPixelScore = 10; //For each component layer
const fill_color = '#eb2d46';
const flyToDuration = 4000;
const refLineOpacity = 0.8;
const refOpacity = 0.5;
const restorationData = {
    'Built-up and Transport Areas': {
        "label": 'Built-up and Transport Areas',
        "color": '#ff3300',  // Red
    },
    'Regenerating Ecosystems': {
        "label": 'Regenerating Ecosystems',
        "color": '#c99222',  // Mustard
    },
    'Mature Ecosystems': {
        "label": 'Mature Ecosystems',
        "color": '#007a25',  // Dark Green
    },
    'Reconstruction Opportunity': {
        "label": 'Reconstruction Opportunity',
        "color": '#25f730'  // Lime Green
    },
};

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/eco-index/cmhb90hvp001701r67f7j7m9p',
    id: 'light',
    center: [175.4663, -37.8892],
    zoom: 6.6,
    pitch: 45,
    bearing: 315,
});

// Add tileset layers
// tippecanoe -z12 -Z0 -y RestStat18 -S 10 -pS -o tilesets/refLayers_Z0_z12_y_S_pS.mbtiles data/output/contextual_info/*.geojson
var refTilesetSourceUrl = 'mapbox://eco-index.b61mk3fo';

// tippecanoe -z12 -Z0 -y raster_val -S 10 -pS -o tilesets/mangaroa_all_attributes.mbtiles data/output/mangaroa_navigator_all_attributes_4326_20240803.geojson
var mangaroaTilesetUrl = 'mapbox://eco-index.a44dtdr7';

let pixelScoreAttributes = [
    "PixelScore_threatenv", "PixelScore_connect", "PixelScore_vegprox",
    "PixelScore_legalprot", "PixelScore_relaff", "PixelScore_ripben",
    "PixelScore_shapeopt", "PixelScore_protbuff", "PixelScore_landstaf",
    "PixelScore_covergoal"
];

let activeAttributes = new Set(pixelScoreAttributes);

const catchmentsID = 'Waikato_Catchments'
const ecosystemProjectorID = 'Waikato_Ecosystem_Projector'
const landCoverSnapshotID = 'Waikato_Land_Cover_Snapshot'
const mangaroaPropertyID = 'WRC_Boundary'
// const waiwhakaihoCatch = 'Waiwhakaiho_Catchment'
const refLayers = [catchmentsID, ecosystemProjectorID, landCoverSnapshotID, mangaroaPropertyID] //mangaroaPropertyID has to be last to render on top
const polygonLayers = [ecosystemProjectorID, landCoverSnapshotID]

const initialLayers = [mangaroaPropertyID]

const refLayerColors = {
    [mangaroaPropertyID]: '#ff1f9a',  // pinkish
    [catchmentsID]: '#000000',  // black
    // [waiwhakaihoCatch]: '#ff2803'
}

// const colorStops = [
//     { value: 1, color: 'rgba(68, 1, 84, 0.55)' },   // Dark Purple
//     { value: 6, color: 'rgba(71, 44, 122, 0.55)' },  // Purple
//     { value: 12, color: 'rgba(58, 82, 139, 0.75)' }, // Blueish Purple
//     { value: 18, color: 'rgba(32, 114, 142, 0.75)' }, // Greenish Blue
//     { value: 24, color: 'rgba(34, 145, 138, 0.75)' }, // Cyan
//     { value: 30, color: 'rgba(69, 170, 115, 0.75)' }, // Yellowish Green
//     { value: 36, color: 'rgba(121, 192, 77, 0.8)' }, // Yellow-Green
//     { value: 42, color: 'rgba(189, 211, 38, 0.9)' }, // Yellow
//     { value: 45, color: 'rgba(247, 243, 60, 1.0)' }, // Bright Yellow
//     { value: 54, color: 'rgba(247, 243, 60, 1.0)' }  // Bright Yellow
// ];

const colorStops = [
  { value: 1,  color: 'rgba(68, 1, 84, 0.7)' },    // Dark Purple
  { value: 8,  color: 'rgba(71, 44, 122, 0.7)' },  // Purple
  { value: 15, color: 'rgba(59, 81, 139, 0.75)' }, // Indigo
  { value: 22, color: 'rgba(44, 113, 142, 0.75)' },// Teal-Blue
  { value: 29, color: 'rgba(33, 144, 141, 0.8)' }, // Cyan-Green
  { value: 36, color: 'rgba(39, 173, 129, 0.8)' }, // Green
  { value: 43, color: 'rgba(92, 200, 99, 0.85)' }, // Light Green
  { value: 50, color: 'rgba(170, 220, 50, 0.9)' }, // Yellow-Green
  { value: 60, color: 'rgba(253, 231, 37, 0.95)' },// Bright Yellow
  { value: 70, color: 'rgba(255, 255, 160, 1.0)' } // Pale Yellow (upper limit)
];


function calculateExpression() {
    let sumExpression = ['+', 0];
    activeAttributes.forEach(attr => {
        sumExpression.push(['coalesce', ['get', attr], 0]);
    });
    return sumExpression;
}

function calculateFillColor() {
    return [
        'interpolate',
        ['linear'],
        calculateExpression(),
        0, 'rgba(0, 0, 0, 0)', // Clear
        ...colorStops.flatMap((stop) => [
            stop.value,
            stop.color
        ])
    ];
}

function updateLayer() {
    if (map.getLayer('mangaroa-heatmap-layer')) {
        map.setPaintProperty('mangaroa-heatmap-layer', 'fill-color', calculateFillColor());
    } else {
        map.addLayer({
            'id': 'mangaroa-heatmap-layer',
            'type': 'fill',
            'source': 'mangaroa-heatmap',
            'source-layer': 'A00_Navigator_All_Priotisation_Options_waikato',
            'paint': {
                'fill-color': calculateFillColor(),
                'fill-outline-color': 'transparent'
            }
        });
    }
}


const toggleAllCheckbox = document.getElementById('toggleAllReconstruction')
const attrCheckboxes = document.querySelectorAll('#reconstructionToggles input[type="checkbox"]')

function toggleAttribute(attribute) {
    if (activeAttributes.has(attribute)) {
        activeAttributes.delete(attribute);
    } else {
        activeAttributes.add(attribute);
    }
    updateLayer();
}

function toggleAllAttributes(toggleAll) {
    attrCheckboxes.forEach(checkbox => { checkbox.checked = toggleAll; });

    if (toggleAll) {
        pixelScoreAttributes.forEach(attr => activeAttributes.add(attr));
    } else {
        activeAttributes.clear()
    }
    updateLayer();
}

map.on('style.load', () => {
    // Add the satellite (only shown when we click 'ShowPremade' toggle)
    map.addSource("mapbox-satellite", { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 });
    map.addLayer({
        "type": "raster", "id": 'satellite-map', "source": "mapbox-satellite", 'layout': {
            'visibility': 'visible'
        },
    });

// 1) Reusable hover popup helper
function bindHoverLabel(layerId, propertyCandidates, formatFn = v => v) {
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
  let hoveredId = null;

  function pickLabel(props) {
    if (!props) return null;
    for (const key of propertyCandidates) {
      if (props[key] != null && props[key] !== '') return props[key];
    }
    return null;
  }

  map.on('mousemove', layerId, (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (!e.features.length) return;

    const f = e.features[0];
    const id = f.id ?? f.properties?.ID; // support promoteId('ID') or implicit ids
    const rawLabel = pickLabel(f.properties);
    const label = rawLabel ? formatFn(rawLabel) : '(no name)';

    // Show popup near cursor
    popup.setLngLat(e.lngLat)
         .setHTML(`<strong>${label}</strong>`)
         .addTo(map);

    // Optional: highlight via feature-state (if your layer uses it)
    if (hoveredId !== null) {
      try { map.setFeatureState({ source: f.source, sourceLayer: f.sourceLayer, id: hoveredId }, { hover: false }); } catch {}
    }
    hoveredId = id;
    if (id != null) {
      try { map.setFeatureState({ source: f.source, sourceLayer: f.sourceLayer, id }, { hover: true }); } catch {}
    }
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
    if (hoveredId !== null) {
      try { map.setFeatureState({ source: layerId.includes('ref') ? 'ref-tileset' : 'navigator', sourceLayer: layerId, id: hoveredId }, { hover: false }); } catch {}
      hoveredId = null;
    }
  });
}

// 2) Bind for Ecosystem Projector
bindHoverLabel('Waikato_Ecosystem_Projector', [
  'ExpectedEcosystemType'
]);

// 3) Bind for WRC Catchments (try a few common name fields)
bindHoverLabel('Waikato_Catchments', [
  'Catchment'
]);


    // Add daytime fog
    map.setFog({
        'color': 'white',
    });
    // Add 3D (DEM source as a terrain layer with exaggerated height)
    map.addSource('mapbox-terrain-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-terrain-dem', 'exaggeration': 1.5 });

    // Add heatmap
    map.addSource('mangaroa-heatmap', {
        type: 'vector',
        url: mangaroaTilesetUrl,
        minzoom: 0,
        maxzoom: 22,
    });
    updateLayer();

    pixelScoreAttributes.forEach(attr => {
        let toggleElement = document.getElementById(`toggle${attr}`);
        toggleElement.addEventListener('click', () => {
            toggleAttribute(attr);
            toggleAllCheckbox.checked = activeAttributes.size == pixelScoreAttributes.length
        });
    });

    toggleAllCheckbox.addEventListener('click', function () {
        toggleAllAttributes(this.checked);
    });

    // Reference layers
    map.addSource('ref-tileset', {
        type: 'vector',
        url: refTilesetSourceUrl,
        minzoom: 0,
        maxzoom: 22,
        promoteId: 'ID' // Promote the 'id' property

    });

    function initialiseReferenceLayers() {
        refLayers.forEach(layerName => {
            if (layerName === ecosystemProjectorID) {
                map.addLayer({
                    'id': layerName,
                    'type': 'fill',
                    'source': 'ref-tileset',
                    'source-layer': layerName,
                    'layout': {
                        'visibility': 'none'
                    },
                    'paint': {
                        'fill-color': [
                            'match', // Static colors based on EcosystemType
                            ['get', 'ExpectedEcosystemType'],
                            'Mātai-tōtara/black/mountain beech forest', '#FF5733',
                            'Fen', '#33FF57',
                            'Mātai-kahikatea-tōtara forest', '#3357FF',
                            'Mountain beech forest', '#FF33A1',
                            'Scrub, tussock-grassland and herbfield above treeline', '#33FFF5',
                            'Marsh', '#FF8C33',
                            'Mātai-tōtara-kahikatea-rimu/broadleaf-fuchsia forest', '#FF33F5',
                            'Seepage', '#FFC733',
                            'Kahikatea-tōtara forest', '#FF3333',
                            'unclassified', '#999999', // Gray for unclassified
                            'Rimu-miro-tōtara/kāmahi forest', '#FF5733',
                            'Rimu-mātai-miro-tōtara/kāmahi forest', '#FF5733',
                            'Kahikatea-pukatea-tawa forest', '#3375FF',
                            'Kahikatea-mātai/tawa-māhoe forest', '#33FF83',
                            'Swamp', '#5733FF',
                            "Hall's tōtara/broadleaf forest", '#33FFAC',
                            'Rimu/tawa-kamahi forest', '#FFAC33',
                            'Dunelands', '#C733FF',
                            'Mountain beech-red beech forest', '#FF7A33',
                            'Rimu-miro/kāmahi-red beech-hard beech forest', '#33FFFA',
                            "Hall's tōtara-miro-rimu/kāmahi-silver beech-southern rata forest", '#FF336E',
                            'Silver beech forest', '#33FFD1',
                            'Kauri/taraire-kohekohe-tawa forest', '#7AFF33',
                            'Scrub, shrubland and tussock-grassland below treeline', '#FF5733',
                            "Hall's tōtara-miro/kamahi-southern rata broadleaf forest", '#3390FF',
                            "Hall's tōtara/silver-beech-kāmahi-southern rata forest", '#D433FF',
                            'Red beech-silver beech forest', '#FF33B5',
                            '#627BC1' // Default color for any other ecosystem
                        ],
                        'fill-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'hover'], false],
                            0.65, // Opacity when hovered
                            0.5 // Default opacity
                        ],
                    },
                    'promoteId': 'ID' // Promote the 'id' property
                });
            }
            else if (polygonLayers.includes(layerName)) {
                map.addLayer({
                    'id': layerName,
                    'type': 'fill',
                    'source': 'ref-tileset',
                    'source-layer': layerName,
                    'layout': {
                        'visibility': 'none'
                    },
                    'paint': {
                        'fill-color': refLayerColors[layerName] || "blue",
                        'fill-opacity': refOpacity,
                    }
                });
            } else {
                map.addLayer({
                    'id': layerName,
                    'type': 'line',
                    'source': 'ref-tileset',
                    'source-layer': layerName,
                    'layout': {
                        'visibility': 'none'
                    },
                    'paint': {
                        'line-color': refLayerColors[layerName],
                        'line-width': 2.5,
                        'line-opacity': refLineOpacity
                    }
                });
            }
        });

        initialLayers.forEach((layerName)=>{
            map.setLayoutProperty(layerName, "visibility", "visible");
        });

        map.setPaintProperty(landCoverSnapshotID, 'fill-color', [
            'match',
            ['get', 'LandCoverStatus'],
            'Built-up and Transport Areas', restorationData['Built-up and Transport Areas']['color'],
            'Regenerating Ecosystems', restorationData['Regenerating Ecosystems']['color'],
            'Mature Ecosystems', restorationData['Mature Ecosystems']['color'],
            'Reconstruction Opportunity', restorationData['Reconstruction Opportunity']['color'],
            '#cccccc'  // Default color if the value doesn't match any category
        ]);

    }

    // ECOSYSTEM PROJECTOR LOGIC
    let hoveredPolygonId = null;
    let ecoPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });
    map.on('mousemove', ecosystemProjectorID, (e) => {
        map.getCanvas().style.cursor = 'pointer';

        if (e.features.length > 0) {
            const hoveredFeature = e.features[0];
            const featureId = hoveredFeature.properties.ID;
            const ecosystemType = hoveredFeature.properties.ExpectedEcosystemType;
            if (typeof featureId === 'undefined') {
                console.error('Feature does not have a valid id, skipping hover state');
                return;
            }
            ecoPopup
                .setLngLat(e.lngLat)  // Position the popup at the feature's location
                .setHTML(`<strong>Ecosystem Type:</strong> ${ecosystemType}`)
                .addTo(map);

            if (hoveredPolygonId !== null) { // Reset previously hovered feature
                map.setFeatureState(
                    { source: 'ref-tileset', id: hoveredPolygonId, sourceLayer: ecosystemProjectorID },
                    { hover: false }
                );
            }

            // Set the new hovered feature's state to true for hover
            hoveredPolygonId = featureId;
            map.setFeatureState(
                { source: 'ref-tileset', id: hoveredPolygonId, sourceLayer: ecosystemProjectorID },
                { hover: true }
            );
        } else {
            // Hide the popup when no features are under the cursor
            if (hoveredPolygonId !== null) {
                map.setFeatureState(
                    { source: 'ref-tileset', id: hoveredPolygonId, sourceLayer: ecosystemProjectorID },
                    { hover: false }
                );
                hoveredPolygonId = null;
            }
        }
    });

    map.on('mouseleave', ecosystemProjectorID, () => {
        map.setFeatureState(
            { source: 'ref-tileset', id: hoveredPolygonId, sourceLayer: ecosystemProjectorID },
            { hover: false }
        );
        hoveredPolygonId = null;
        ecoPopup.remove(); // Hide the popup
    });


    // Create the scale for the heatmap (only required once)
    function createReconstructionScale() {
        const scale = document.getElementById('reconstructionScale');

        // Create a canvas to draw the gradient
        const canvas = document.createElement('canvas');
        canvas.width = 20; // Width of the gradient
        canvas.height = 100; // Height of the gradient
        const context = canvas.getContext('2d');

        // Create the linear gradient and fill the canvas
        const gradient = context.createLinearGradient(0, 100, 0, 0);
        colorStops.forEach((stop, index) => {
            const offset = index / (colorStops.length - 1);
            gradient.addColorStop(offset, stop.color);
        });
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Create a container for scale and labels
        const entry = document.createElement('div');
        entry.style.display = 'flex';
        entry.style.alignItems = 'center';

        // Create the graduated color scale
        const colorScale = document.createElement('div');
        colorScale.appendChild(canvas);
        colorScale.style.marginLeft = '0px';

        // Create labels for top and bottom
        const labelTop = document.createElement('div');
        labelTop.innerHTML = 'More Optimal<br><i>(zoom in)</i>';
        labelTop.style.marginLeft = '5px';

        const labelBot = document.createElement('div');
        labelBot.textContent = 'Less Optimal';
        labelBot.style.marginLeft = '5px';

        // Create a container for scale and labels
        const labelsContainer = document.createElement('div');
        labelsContainer.style.display = 'flex';
        labelsContainer.style.flexDirection = 'column';
        labelsContainer.style.justifyContent = 'space-between';
        labelsContainer.style.height = '100px'; // Same as canvas
        labelsContainer.append(labelTop, labelBot);
        entry.append(colorScale, labelsContainer);
        scale.append(entry);
    }

    // Initialise layers and scales   
    initialiseReferenceLayers();
    createReconstructionScale();

    // Updated the legend checkboxes to include logic for adjusting layer opacity and visibility
    let satelliteToggle = document.getElementById('heatmapToggle');

    // Updated the legend checkboxes
    refLayers.forEach(refLayer => {
        console.log(refLayer)
        let checkbox = document.getElementById(`toggle${refLayer}`);
        checkbox.addEventListener('click', () => {
            refLayers.forEach(otherLayer => {
                if (otherLayer !== refLayer & !initialLayers.includes(otherLayer)) { // Uncheck all other checkboxes and hide other layers
                    let otherCheckbox = document.getElementById(`toggle${otherLayer}`);
                    otherCheckbox.checked = false;
                    map.setLayoutProperty(otherLayer, 'visibility', 'none');
                }
            });
            map.setLayoutProperty(refLayer, 'visibility', checkbox.checked ? 'visible' : 'none');// Set the visibility of the clicked layer
        });
        checkbox.style.accentColor = refLayerColors[refLayer];     // Set the checkbox accent color
    });

    satelliteToggle.addEventListener('change', function () {
        map.setLayoutProperty('satellite-map', 'visibility', this.checked ? 'visible' : 'none');
    });

    // Toggle Existing Natural Areas legend with the layer
    document.getElementById(`toggle${landCoverSnapshotID}`).addEventListener('change', function (e) {
        document.getElementById('ena-legend').style.display = this.checked ? 'block' : 'none';
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const parentDiv = document.getElementById('navigator-embed');
    let parentRect = parentDiv.getBoundingClientRect();
    var disclaimer = document.createElement('div');
    disclaimer.id = 'disclaimer';
    disclaimer.innerHTML = `
    <div>

            <div id="disclaimer-content">
                <h2>Nau mai, welcome to Navigator X by Eco-index</h2>
                <p>Navigator X provides spatial information to guide ecosystem reconstruction decision-making. 
                <strong>Ecosystem reconstruction</strong> is a specific kind of <strong>restoration</strong> where native ecosystems are rebuilt from 
                scratch. Navigator X provides guidance and options, not prescriptions.</p>

                <p><b>Navigator X provides:</b></p>
                <ul>
                    <li>Guidance on the best bang-for-buck reconstruction options; the brightest colours show the best reconstruction opportunities</li>
                    <li>Prioritisation options that can be toggled on or off</li>
                    <li>Contextual information to help with interpretation</li>
                </ul>

                <p><b>Navigator X does not provide:</b></p>
                <ul>
                    <li>Comprehensive ecosystem reconstruction guidance, please use it alongside other information sources</li>
                    <li>Information about ecosystem quality or condition</li>
                    <li>Guidance for the protection, restoration or maintenance of existing ecosystems; the focus of 
                    Navigator X is ecosystem reconstruction from scratch
                    <li>Integration of climate change projections, but we plan to work on this</li>
                    <li>Local council, land owner or any private information</li>
                </ul>

                <h4>Eco-index Disclaimer</h4>
                <p class="disclaimer-subtext">The information provided is as accurate as possible with the available data sources, 
                but it is still subject to uncertainty. We encourage land managers and decision makers to combine this information
                 with other available guidance. We also recommend ground-truthing guidance from Navigator X in your catchment 
                 before planning any work. Eco-index is not responsible for how this information is applied or any loss, damage 
                 or expense arising from such use or reliance.
                </p>

                <p>By clicking the <b>'Accept'</b> button you acknowledge you have read and accepted the terms of this
                    disclaimer.</p>

                <div id="disclaimer-buttons">
                    <button id="accept-btn">Accept</button>
                    <button id="decline-btn">Decline</button>
                </div>
        </div>`;
    disclaimer.style.display = 'none'; // Initially hidden

    //var siteWrapper = document.getElementById('collection-6731909e1a3d593bb7e7299d'); // Adjust to target siteWrapper
    //siteWrapper.appendChild(disclaimer);
    (document.getElementById('collection-6731909e1a3d593bb7e7299d') || document.body).appendChild(disclaimer);
    document.getElementById("tablink-reconstruction")?.click();


    // Disclaimer code
    var overlay = document.getElementById("overlay");
    var acceptBtn = document.getElementById("accept-btn");
    var declineBtn = document.getElementById("decline-btn");

    // Show the disclaimer
    overlay.style.display = "block";
    disclaimer.style.display = "block";

    // Function to hide the disclaimer and overlay
    function hideDisclaimer() {
        overlay.style.display = "none";
        disclaimer.style.display = "none";
    }

    acceptBtn.addEventListener("click", function () {
        hideDisclaimer();
    });

    // Function to handle decline button click
    declineBtn.addEventListener("click", function () {
        // Block the user from using the content
        hideDisclaimer();
        var navigator_embed = document.getElementById("navigator-embed");
        navigator_embed.innerHTML = "";
        navigator_embed.innerText = "Access denied. Please refresh and accept the disclaimer to access this content.";
    });

    // Draggable tabs behaviour
    function reposition(elemId) {
        /* Repositions the y index of an element if outside the window */
        const elem = document.getElementById(elemId)
        elem.getBoundingClientRect();
        if (elem.offsetTop > parentRect.height - elem.offsetHeight) {
            elem.style.top = `${parentRect.height - elem.offsetHeight}px`;
        }
    }

    // Legend
    function makeMinimisable(legend_id) {
        var toggle = document.getElementById("toggle-" + legend_id);
        toggle.addEventListener('click', function () {
            var legendContent = document.getElementById(legend_id + "-content");
            if (legendContent.style.display === "none") {
                legendContent.style.display = "block";
                this.innerHTML = '<i class="fas fa-minus"></i>';
                reposition(legend_id);
            } else {
                legendContent.style.display = "none";
                this.innerHTML = '<i class="fas fa-plus"></i>';
            }
        });
    }

    function makeDraggable(el) {
        var offsetX = 0, offsetY = 0;
        el.onmousedown = dragMouseDown;

        var blockWidth = 0, blockHeight = 0;

        function dragMouseDown(e) {
            // Get the mouse cursor position at startup
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            parentRect = parentDiv.getBoundingClientRect();
            blockWidth = parentRect.width;
            blockHeight = parentRect.height;
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


    // Control panel tabs behaviour
    function openTab(evt, tabName) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";

        reposition('control-panel');
    }

    makeMinimisable("control-panel");
    makeMinimisable("scale-container");
    makeMinimisable("ena-legend");

    makeDraggable(document.getElementById("control-panel"));
    makeDraggable(document.getElementById("scale-container"));
    makeDraggable(document.getElementById("ena-legend"));

    document.getElementById("tablink-reconstruction").addEventListener("click", function (e) { openTab(e, "tab-reconstruction") })
    document.getElementById("tablink-reference").addEventListener("click", function (e) { openTab(e, "tab-reference") })
    document.getElementById("tablink-reconstruction").click(); // init


    // Legend popup code
    const popupData = {
        "Connectivity": "Priority is given to areas where reconstruction will create a stepping stone to improve ecosystem connectivity between existing native ecosystems. Ecosystem connectivity is important to allow species migration.",
        "eco15boost": 'Priority is given to reconstruction areas that will contribute towards the goal of 15% cover of each native ecosystem type in each catchment. <a href="https://eco-index.nz/resources" target="_blank">See Eco-index 15% rationale</a>.',
        "Land_Stability": 'Priority is given to areas that are most susceptible to landslides according to the <a href="https://data.mfe.govt.nz/document/25197-highly-erodible-land-to-2022/" target="_blank">Highly Erodible Land database</a>.',
        "Legal_Protection": "Reconstruction in areas that are already legally protected will save on legal costs and provide greater assurance that the work will be protected.",
        "Native_Veg_Proximity": "Priority is given to areas that are close to existing native vegetation. Existing vegetation can benefit ecosystem reconstruction projects by providing flora and fauna to help establish a desirable native ecosystem type.",
        "ENA_Shape_Improvement": 'Priority is given to areas that round out existing native vegetation patches. These areas have the potential to reduce <a href="https://www.doc.govt.nz/get-involved/run-a-project/restoration-advice/bush-restoration/understand-the-bush/edge-effects/" target="_blank">edge effects</a> and therefore help to stabilise the internal climate and habitat for flora and fauna.',
        "Protective_Buffer": "Priority is given to areas that could protect an important area such as a Department of Conservation Ecosystem Management Unit or QEII covenant.",
        "Relative_Affordability": "Priority is given to areas that are likely to have relatively low land purchase costs and/or lower economic opportunity costs to retire for ecosystem reconstruction.",
        "Riparian_Benefit": "Priority is given to areas that are within 30 metres of the centreline of a river. This maximises benefits towards smaller waterways as they have the greatest potential for downstream benefits and in-stream shade when protected by riparian buffer planting.",
        "Threatened_Environment": 'Based on the <a href="https://www.landcareresearch.co.nz/tools-and-resources/mapping/threatened-environment-classification/" target="_blank">Threatened Environment Classifications</a>. Priority is given to the more threatened environments.',
        "Catchments": 'Catchment boundaries determined by Eco-index',
        "Corridors": 'Areas where reconstruction could form a continuous ecological corridor or stepping stones to link existing natural areas',
        "LandCover": 'Broad current (c.2018) land cover types, based on LCDB v.5. Eco-index prioritisation options are only applied to the Reconstruction Opportunity area',
        "Ecosystems": 'Ecosystem types expected to be found in the absence of land clearance',
        "Built-up and Transport Areas": 'Areas that are impractical to undertake ecosystem reconstruction, e.g., paved urban areas',
        "Regenerating": 'Areas with young ecosystems or recent disturbance (e.g., landslide)',
        "Mature": 'Areas with mature native ecosystems',
        "Potentially Restorable": 'Areas where native ecosystems are absent but could be reconstructed'
    };
    // Get elements
    const infoIcons = document.querySelectorAll('.info-icon, .legend-info-icon');
    const popup = document.getElementById('info-popup');
    const popupText = document.getElementById('popup-text');

    // Show popup with dynamic content
    infoIcons.forEach(icon => {
        icon.addEventListener('click', function (event) {
            event.stopPropagation();
            const popupIconId = popupText.getAttribute('data-icon-id');
            const iconId = this.getAttribute('data-icon-id');
            const data = popupData[iconId];
            let content = '';

            if (data) {
                // Construct dynamic content
                content = `<p>${data}</p>`;
            } else {
                content = '<p>No data available.</p>';
            }

            if (popup.style.display === 'block' && popupIconId === iconId) {
                popup.style.display = 'none'; // Hide the popup if it's already displayed with the same content
                popupText.setAttribute('data-icon-id', '');
            } else {
                popupText.innerHTML = content;
                popupText.setAttribute('data-icon-id', iconId);
                popup.style.display = 'block';

                // Calculate the content width and adjust the popup width
                popup.style.width = 'auto'; // Allow the content to define the width temporarily
                popup.style.whiteSpace = 'nowrap'; // Prevent wrapping to accurately measure width

                // Measure the content width
                const contentWidth = popup.getBoundingClientRect().width;

                // Adjust the popup width if the content is smaller than 500px
                const maxWidth = 500;
                popup.style.width = `${Math.min(contentWidth, maxWidth)}px`;

                // Remove nowrap to allow wrapping again if needed
                popup.style.whiteSpace = '';

                // Position the popup relative to the icon
                const iconRect = this.getBoundingClientRect();
                const popupRect = popup.getBoundingClientRect();
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
                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;
            }
        });
    });

    // Hide popup when clicking outside of the popup
    window.addEventListener('click', function (event) {
        if (event.target !== popup) {
            popup.style.display = 'none';
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