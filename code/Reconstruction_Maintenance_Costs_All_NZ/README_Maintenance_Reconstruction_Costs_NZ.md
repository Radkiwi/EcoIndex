# Maintenance & Reconstruction Costs NZ

## Overview
This repository generates geospatial maintenance and reconstruction cost layers for native ecosystem investment in Aotearoa New Zealand.

The aim of the code is to reproduce the **Reconstruction Costings** and **Maintenance Costings** approach described in the Eco-index *Product Deep Dive*, especially the methodology on **pages 28–31**. In practice, the notebook:

- calculates **reconstruction costs** for areas identified as suitable for building brand new native ecosystems;
- calculates **maintenance costs** for both existing natural areas and reconstructed ecosystems;
- joins ecosystem and land-cover classes to cost lookup tables;
- produces spatial outputs that can be mapped, summarised, and intersected with catchments.

This workflow is intended for analysts, researchers, and practitioners who want to understand, reproduce, audit, or adapt the Eco-index NZ cost-generation process for biodiversity restoration planning.

---

## What this code implements
The notebook operationalises the costing framework described in the product deep dive:

### Reconstruction costings
Based on pages 28–29 of the deep dive, reconstruction costs cover one-off actions required to establish new ecosystems in modified areas. The baseline framework includes:

- **Plant cost** per stem
- **Planting density** per hectare
- **Early plant care** for the first 3 years
- **Fence installation cost** per metre
- **Fencing requirement assumptions** by area/shape scenario

The code applies these costs by linking each predicted ecosystem type (`PNVW`) to an **Aggregated Reconstruction Ecosystem Group** such as:

- Dunes
- High-altitude forest
- Lowland forest
- Mid-altitude forest
- Scrub
- Wetland acidic
- Wetland alkaline
- Wetland fertile

It then assigns the relevant planting, early-care, and fencing values to each restorable polygon.

### Maintenance costings
Based on pages 30–31 of the deep dive, maintenance costs are ongoing annual costs applied to:

- **existing ecosystems** (Existing Natural Areas), and
- **reconstructed ecosystems**.

The baseline framework includes:

- **Non-native animal management** cost per ha per annum
- **Non-native plant management** cost per ha per annum
- **Fence maintenance** as a percentage of fence install cost

The code applies these using ecosystem-group weightings and lookup tables derived from land-cover class and wetland context.

---

## Repository purpose
Use this code when you want to:

- recreate Eco-index style maintenance and reconstruction cost layers for NZ;
- inspect how source geospatial layers are transformed into costing outputs;
- validate the assumptions used in the published methodology;
- generate spatial layers for downstream analysis, dashboards, or catchment summaries.

---

## Expected inputs
The notebook depends on a set of geospatial layers and lookup tables that sit outside the notebook itself. At minimum, you should expect the project to require the following.

### Core geospatial inputs
- `../BaseLayersEco-index/Eco-index_EcosystemProjector_Details_v260924.gpkg`
- `../BaseLayersEco-index/Eco-index_EcosystemProjector_Details__Restorable_v260924.gpkg`
- `../BaseLayersEco-index/Eco-index_LandCoverSnapshot_v290824.gpkg`
- `../BaseLayersEco-index/Eco-index_LandCoverSnapshot__Public_Simple_v290824.gpkg`
- `../BaseLayersEco-index/Eco-index_LandCoverSnapshot__Catchments_v290824.gpkg`
- `../BaseLayersEco-index/Eco-index_RestorableAreas_v290824.gpkg`
- `../BaseLayersEco-index/Eco-index_Catchments_v080623.gpkg`

### Cost lookup tables
- `../BaseLayersEco-index/CostsLookUpTable_ENA_v110924.csv`
- `../BaseLayersEco-index/CostsLookUpTable_PNVWEET.csv`

### Optional / downstream comparison layers used later in the notebook
- `../BaseLayersNavigator/B02_Costings/MaintenanceCostings_20240911.gpkg`
- `../BaseLayersNavigator/B02_Costings/ReconstructionCostings_20240829.gpkg`
- `../BaseLayersNavigator/B01_EcosystemServicesValuer/EcosystemServicesValuer__ExistingAreas_20240829.gpkg`
- `../BaseLayersNavigator/B01_EcosystemServicesValuer/Eco-index_EcosystemServicesValuer_ReconstructionAreas_20240926.gpkg`

### Example local AOI path seen in development
- `mangaroa_restorable_pnvw_20240624.gpkg`
- `C:\Users\corey\Desktop\Eco-index\Mangaroa_Farms_Proj\3_attr_outputs\attr00\ecocatch_mangaroa.shp`

These example paths suggest the notebook was originally developed in a larger local project structure. If you are packaging this repository for public use, you should replace hard-coded relative paths with a configuration file or clearly documented directory structure.

---

## Recommended project structure
A public-facing version of this project will be much easier to run if organised like this:

```text
project-root/
├── README.md
├── environment.yml
├── requirements.txt
├── Maintenance_Reconstruction_Costs_NZ.ipynb
├── data/
│   ├── raw/
│   │   ├── Eco-index_EcosystemProjector_Details_v260924.gpkg
│   │   ├── Eco-index_LandCoverSnapshot_v290824.gpkg
│   │   ├── Eco-index_LandCoverSnapshot__Public_Simple_v290824.gpkg
│   │   ├── Eco-index_LandCoverSnapshot__Catchments_v290824.gpkg
│   │   ├── Eco-index_RestorableAreas_v290824.gpkg
│   │   ├── Eco-index_Catchments_v080623.gpkg
│   │   ├── CostsLookUpTable_ENA_v110924.csv
│   │   └── CostsLookUpTable_PNVWEET.csv
│   └── processed/
├── output_layers/
├── docs/
│   └── Eco-index_Product_Deep_Dive_v2.pdf
└── src/
    └── utils.py
```

If you do not want to refactor the notebook yet, keep the relative folder names exactly as expected by the code.

---

## Software requirements
The notebook imports the following Python packages:

- `pandas`
- `numpy`
- `geopandas`
- `shapely`
- `rasterio`
- `pyproj`
- `matplotlib`
- `plotly`
- `unidecode`

You will also need geospatial system dependencies compatible with `geopandas` and `rasterio`, such as GDAL/PROJ.

### Example Python install
```bash
pip install pandas numpy geopandas shapely rasterio pyproj matplotlib plotly Unidecode
```

For reproducibility, a pinned `requirements.txt` or `environment.yml` is strongly recommended.

---

## How the workflow runs
At a high level, the notebook follows this sequence:

1. **Load area-of-interest and core geospatial layers**  
   Reads the ecosystem projector, land cover snapshot, and restorable-area layers.

2. **Prepare existing natural area maintenance costs**  
   Filters mature and regenerating land cover classes, joins them to `CostsLookUpTable_ENA_v110924.csv`, and writes a maintenance costing layer.

3. **Prepare reconstruction costs for new ecosystems**  
   Intersects predicted ecosystems with restorable areas, joins to `CostsLookUpTable_PNVWEET.csv`, and applies reconstruction cost fields.

4. **Standardise / relabel outputs**  
   Cleans field names and output schemas for later use in Eco-index products.

5. **Create catchment-level overlays**  
   Intersects maintenance and reconstruction outputs with catchment boundaries to support catchment summaries.

---

## Main outputs
The notebook writes or references outputs such as:

- `../OutputArtifacts/B02_Costings/MaintenanceCostings.gpkg`
- `../BaseLayersNavigator/B02_Costings/Eco-index_ReconstructionCostings_Catchment.gpkg`
- `../BaseLayersNavigator/B02_Costings/Eco-index_MaintenanceCostings_Catchment.gpkg`

Depending on how you package the project, you may also create public-facing outputs like:

- `output_layers/Ecosystem_Reconstruction_and_Maintenance_Cost_Generator_EXISTING_AREAS_*.gpkg`
- `output_layers/Ecosystem_Reconstruction_and_Maintenance_Cost_Generator_RECONSTRUCTION_AREAS_*.gpkg`

---

## Important assumptions and limitations
This code should be used with the same caution as the published methodology.

- Costs are **baseline estimates**, not site-specific quotes.
- Costs **exclude** planning, permits, major earthworks, major infrastructure, and water-level restoration works.
- Actual costs will vary with site conditions, contractor rates, volunteer labour, access, area shape, fencing needs, and ecosystem condition.
- The grouping of ecosystems into aggregated categories is a modelling convenience and may smooth over local ecological differences.
- Some outputs depend on the availability and versioning of external Eco-index layers.
- The notebook currently includes **hard-coded paths** and appears to have been developed inside a larger private folder structure.

For public release, it is best to add:

- a data dictionary,
- a configuration file for paths,
- explicit versioning for input layers,
- a changelog,
- and a worked example using a small sample dataset.

---

## Public-use guidance
If you are sharing this code publicly, these steps will make it much more usable:

1. Replace hard-coded local paths with relative paths from a `data/` folder or a config file.
2. Include sample input data or a clear script for obtaining source layers.
3. Add a `requirements.txt` or `environment.yml` with pinned versions.
4. Export the notebook to a `.py` script for easier automation.
5. Add validation checks for missing columns, CRS mismatches, and null joins.
6. Document every expected input field in the lookup tables and geospatial layers.
7. Include one small example run and expected output filenames.

---

## Suggested files to include in a public repository
At minimum:

- `README.md`
- `LICENSE`
- `requirements.txt` or `environment.yml`
- `Maintenance_Reconstruction_Costs_NZ.ipynb`
- `data/README.md` describing how to source required inputs
- `docs/methodology.md` summarising the pages 28–31 costing method
- `CHANGELOG.md`

Strongly recommended:

- `src/` folder with reusable helper functions
- `config.yaml` for file paths and versioned layer names
- `tests/` for basic schema and join validation
- `example_outputs/` with non-sensitive sample artefacts

---

## Citation and methodology reference
This code is designed to implement the reconstruction and maintenance costing approach described in the Eco-index *Product Deep Dive*, Version 2.0, September 2024, especially pages 28–31.

If you use or adapt this workflow, cite the underlying methodology document and clearly state any changes you make to:

- ecosystem grouping rules,
- baseline costs,
- lookup tables,
- fencing scenarios,
- or input layer versions.

---

## Status
This notebook appears to be a working analytical notebook rather than a fully packaged software project. It is suitable as a strong methodological starting point, but public users will benefit from additional packaging, path standardisation, and documentation before production use.
