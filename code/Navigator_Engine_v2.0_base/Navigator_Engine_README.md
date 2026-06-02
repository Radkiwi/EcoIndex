# Navigator Engine

This repository (the **Navigator Engine**) represents the Eco-index
technical team's effort to consolidate, simplify, and automate the GIS
processing required to produce Eco-index spatial products for client
projects.

The Navigator Engine generates the **Eco-index Navigator layer**, which
forms the core spatial foundation for a range of Eco-index analyses
including:

-   Ecosystem service valuation
-   Ecosystem reconstruction costs
-   Ecosystem maintenance costs
-   Biodiversity and restoration planning tools

The methodology aligns with the **Eco-index Product Deep Dive**,
particularly the **Navigator methodology (pages 9--21)**.

------------------------------------------------------------------------

# Repository Purpose

The Navigator Engine provides a repeatable and transparent workflow for
generating Eco-index spatial outputs from client GIS data and national
environmental datasets.

The system is designed to:

-   Standardise spatial processing workflows
-   Ensure reproducibility between projects
-   Maintain a record of which processing code was used for each client
-   Allow the workflow to be progressively automated

------------------------------------------------------------------------

# Repository Structure

NavigatorEngine/ Notebooks/ C01_Create_Client_Navigator_Layers.ipynb

    ClientProcessing/
        TEMPLATE/
            Client_BaseLayers/
            Client_Outputs/

  -----------------------------------------------------------------------
  Component                           Description
  ----------------------------------- -----------------------------------
  Notebooks                           Contains the processing notebooks
                                      used to generate Navigator layers

  ClientProcessing                    Contains a separate directory for
                                      each client

  Client_BaseLayers                   Location where input GIS datasets
                                      are stored

  Client_Outputs                      Location where generated outputs
                                      are written
  -----------------------------------------------------------------------

Each client receives a separate processing directory to preserve a
record of the code and data used to produce their results.

------------------------------------------------------------------------

# Proposed Processing Workflow

1.  **Client provides GIS data** describing the project site or area.
2.  Duplicate the template directory:

ClientProcessing/TEMPLATE

Rename it to the client name:

ClientProcessing/CLIENT_NAME

3.  Add client spatial data to:

ClientProcessing/CLIENT_NAME/Client_BaseLayers/

4.  Open the notebook:

C01_Create_Client_Navigator_Layers.ipynb

5.  Update the constants at the top of the notebook to reference the
    client directory and datasets.
6.  Run the notebook sequentially.

Outputs will be written to:

ClientProcessing/CLIENT_NAME/Client_Outputs/

------------------------------------------------------------------------

# The Navigator Index

The **Eco-index Navigator** is a spatial index designed to represent
ecological condition and environmental context across landscapes.

Navigator is built by combining **10 environmental indicator layers**,
each representing a different ecological dimension. These layers and
their methodology are described in the **Product Deep Dive (pages
9--21)**.

Each layer is calculated independently and then normalised and combined
to produce the final Navigator index surface.

------------------------------------------------------------------------

# Navigator Layers

The Navigator index consists of ten component layers.

  -----------------------------------------------------------------------
  Layer Code              Indicator Theme         Description
  ----------------------- ----------------------- -----------------------
  N01                     Ecosystem Type          Land cover and
                                                  ecosystem
                                                  classification

  N02                     Habitat Integrity       Degree of natural
                                                  habitat condition

  N03                     Naturalness             Degree of human
                                                  modification

  N04                     Connectivity            Landscape connectivity
                                                  between habitats

  N05                     Hydrological Context    Relationship to rivers,
                                                  wetlands, and water
                                                  systems

  N06                     Biodiversity Value      Known biodiversity
                                                  significance

  N07                     Ecological              Representation of
                          Representation          ecosystems across
                                                  landscapes

  N08                     Proximity to Natural    Distance to intact
                          Areas                   ecosystems

  N09                     Vegetation Condition    Health and maturity of
                                                  vegetation

  N10                     Ecological Significance Presence of protected
                                                  or high-value
                                                  ecological areas
  -----------------------------------------------------------------------

Each layer is processed and scored before being normalised and
aggregated into the final Navigator score.

------------------------------------------------------------------------

# Required Data Inputs

The Navigator Engine requires multiple national-scale environmental
datasets.

These datasets are not distributed with this repository because they
may:

-   be large spatial datasets
-   be updated frequently
-   require external licensing
-   originate from multiple government data providers

Users must obtain these datasets independently.

Typical New Zealand data sources include:

  Data Type             Example Source
  --------------------- ----------------------------
  Land cover            Land Cover Database (LCDB)
  Protected areas       Department of Conservation
  Hydrology             LINZ / NIWA
  Vegetation            Landcare Research
  Biodiversity layers   DOC or regional councils
  Infrastructure        LINZ transport datasets
  Topography            LINZ DEM datasets

The exact dataset requirements for each Navigator layer are defined in
the processing notebook.

------------------------------------------------------------------------

# Preparing Input Layers

Before running the Navigator Engine:

1.  Download the required national datasets.
2.  Clip large datasets to the client area of interest where possible.
3.  Ensure all datasets use a common coordinate reference system
    (typically **NZTM2000 -- EPSG:2193**).
4.  Convert layers to supported formats such as GeoPackage (.gpkg) or
    GeoTIFF (.tif).
5.  Place all datasets in:

ClientProcessing/CLIENT_NAME/Client_BaseLayers/

Example:

ClientProcessing/ CLIENT_NAME/ Client_BaseLayers/ landcover.gpkg
protected_areas.gpkg hydrology.gpkg biodiversity_layers.gpkg
Client_Outputs/

------------------------------------------------------------------------

# Running the Navigator Engine

Once datasets are prepared:

1.  Duplicate the TEMPLATE client directory.
2.  Rename it to the client name.
3.  Add datasets to Client_BaseLayers.
4.  Open the processing notebook.
5.  Update configuration constants.
6.  Run all cells sequentially.

The notebook will generate:

-   Individual Navigator indicator layers
-   Intermediate processing layers
-   Final Navigator index outputs

Outputs will be saved to:

Client_Outputs/

------------------------------------------------------------------------

# Outputs

Typical outputs include:

  Output                        Description
  ----------------------------- ----------------------------------
  Navigator indicator layers    Individual environmental layers
  Normalised indicator layers   Standardised scoring layers
  Navigator index               Final composite ecological index
  Validation layers             Intermediate processing outputs

Outputs are typically stored as GeoPackage or raster layers.

------------------------------------------------------------------------

# Important Notes

-   This repository does **not automatically download required
    datasets**.
-   Users must obtain and prepare input spatial datasets independently.
-   Dataset availability may vary between regions.
-   Substitutions may be required when applying the methodology outside
    New Zealand.
-   The conceptual methodology is described in the **Eco-index Product
    Deep Dive (pages 9--21)**.

------------------------------------------------------------------------

# Relationship to Other Eco-index Modules

The Navigator layer forms the **core ecological dataset** used by other
Eco-index analyses, including:

-   Ecosystem service valuation models
-   Ecosystem reconstruction cost models
-   Ecosystem maintenance cost models
-   Biodiversity restoration planning tools

These modules rely on the Navigator outputs or the underlying ecological
layers generated by this repository.
