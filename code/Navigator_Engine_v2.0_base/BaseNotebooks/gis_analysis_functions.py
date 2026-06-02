from pathlib import Path
import time
from matplotlib import pyplot as plt
import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import box, shape
import rasterio
from rasterio.enums import Resampling
from rasterio.features import rasterize, shapes
from rasterio.windows import Window



def sum_prioritisation_option_geotiffs(files, output_path):
    """Sum the same quadrant across multiple TIFF files."""
    with rasterio.open(files[0]) as src:
        # Get metadata from the first file for output files
        meta = src.meta.copy()
        meta["dtype"] = "int8"

        # Initialize an array to store the sum of the quadrants
        sum_array = None

        # Sum the same quadrant across all files
        for file in files:
            if Path(file).exists():
                print(f"Adding file: {file}")

                with rasterio.open(file) as f:
                    data = f.read(1).astype("int8")
                    # Handle nodata values; assuming nodata is properly defined
                    nodata = f.nodata
                    if nodata is not None:
                        data[data == nodata] = 0

                    if sum_array is None:
                        sum_array = data
                    else:
                        sum_array += data
            else:
                print(f"""File not found: {file}. This should only happen if there were no polygons
                       for this Prioritisation Oprtion within the area of interest. Continuing to next file.""")


        # Write the result to a new file
        # output_path = f'{output_base_path}_{quadrant}.tif'
        meta["width"], meta["height"] = sum_array.shape[1], sum_array.shape[0]
        with rasterio.open(output_path, "w", **meta) as out:
            out.write(sum_array, 1)

def load_raster_chunks(raster_path, chunk_size):
    """Yield chunks of raster data along with their geographic transforms and pixel bounds."""
    with rasterio.open(raster_path) as src:
        # Calculate number of chunks based on raster dimensions and chunk size
        ncols, nrows = src.width // chunk_size, src.height // chunk_size
        for i in range(ncols + 1):  # +1 to include the residual part if any
            for j in range(nrows + 1):  # Similarly for rows
                window = rasterio.windows.Window(i * chunk_size, j * chunk_size, chunk_size, chunk_size)
                data = src.read(1, window=window)
                transform = src.window_transform(window)
                # Store pixel bounds (i, j are the chunk indices)
                pixel_bounds = {
                    'row_start': j * chunk_size,
                    'row_end': j * chunk_size + data.shape[0],
                    'col_start': i * chunk_size,
                    'col_end': i * chunk_size + data.shape[1]
                }
                yield data, transform, src.crs, pixel_bounds

def polygonize_raster(data, transform):
    """Convert raster data to polygons and include pixel values, ignoring null value of 99."""
    # Adjust the mask to exclude null values (99) and other non-relevant values if needed
    mask = (data != 99) & (data > 0)
    polygon_values = []
    for geom, value in shapes(data, mask=mask, transform=transform):
        # Ensure only capturing relevant values (exclude any potential residuals from masking)
        if value != 99 and value > 0:
            polygon_values.append((shape(geom), value))
    return polygon_values


def process_and_save_chunks(raster_files, file_short_mapping, output_folder, chunk_size=1024):
    """Process each chunk of each raster and save as individual GeoJSON files including metadata."""
    folder_path = Path(output_folder)
    folder_path.mkdir(parents=True, exist_ok=True)

    for raster_path in raster_files:
        if Path(raster_path).exists():
            print('Processing: ', raster_path)
        else:
            print('Skipping missing file: ', raster_path)
            continue

        for index, (data, transform, crs, pixel_bounds) in enumerate(load_raster_chunks(raster_path, chunk_size)):
            if data.size == 0:  # Skip empty data windows
                continue
            polygon_values = polygonize_raster(data, transform)
            gdf = gpd.GeoDataFrame({
                'geometry': [pv[0] for pv in polygon_values],
                f'PixelScore_{file_short_mapping[raster_path]}': [pv[1] for pv in polygon_values],
                'pixel_bounds': [str(pixel_bounds)] * len(polygon_values)
            }, crs=crs)
            output_path = f"{output_folder}/{file_short_mapping[raster_path]}_chunk_{index:04d}.gpkg"

            gdf.to_file(output_path)
            
    return index

def overlay_chunks(raster_files, file_short_mapping, max_index, simplify_tolerance, prev_output_folder, new_output_folder):
    """Process each chunk of each raster and save as individual GeoJSON files including metadata."""
    folder_path = Path(new_output_folder)
    folder_path.mkdir(parents=True, exist_ok=True)

    for index in range(0, max_index+1):
        # print(f'starting {index}')
        raster_path = raster_files[0]
        short_name = file_short_mapping[raster_path]
        new_gdf = gpd.read_file(f"{prev_output_folder}/{short_name}_chunk_{index:04d}.gpkg")
        new_gdf["geometry"] = new_gdf.simplify(simplify_tolerance, preserve_topology=True)
        new_gdf["geometry"] = new_gdf.set_precision(0.1)
        new_gdf = new_gdf.drop('pixel_bounds', axis=1)
        new_gdf.sindex
        # print(index, new_gdf.columns, raster_name)

        start_time = time.time()
        for raster_path in raster_files[1:]:
            if not Path(raster_path).exists():
                # Skip null layers that wont have any chunks associated
                continue

            short_name = file_short_mapping[raster_path]
            
            # Load and simplify next layer
            try:
                gdf = gpd.read_file(f"{prev_output_folder}/{short_name}_chunk_{index:04d}.gpkg")
                if new_gdf.shape[0] ==0:
                    continue
                gdf["geometry"] = gdf.simplify(simplify_tolerance, preserve_topology=True)
                gdf["geometry"] = gdf.set_precision(0.0001)
                gdf = gdf.drop('pixel_bounds', axis=1)
                
                # Union with previous layers
                new_gdf = new_gdf.overlay(gdf, how="union", keep_geom_type=True)
                new_gdf["geometry"] = new_gdf.simplify(simplify_tolerance)
                new_gdf = new_gdf[new_gdf.area > 1]
                new_gdf.sindex
            except Exception as e:
                print(e)
                print(gdf.head(), new_gdf.head())
                raise(e)
            # print(index, new_gdf.columns, raster_name)
            # break
        
        end_time = time.time()
        # print(f"Resulting GDF shape: {new_gdf.shape}")
        # print(f"Overlay time for all layers: {end_time - start_time:.2f} seconds")
        new_output_path = f"{new_output_folder}/chunk_unioned_{index:04d}.gpkg"
        new_gdf.to_file(new_output_path)
        print(f"Index {index} saved to {new_output_path} in {end_time - start_time:.2f} seconds", end='\r', flush=True)

def combine_overlaid_chunks(overlaid_chunks_path):
    """Combine all of the overlaid chunks, and add a new column for the sum of all pixels"""

    # Pattern to match all GeoPackage files in the directory
    directory = Path(overlaid_chunks_path)  # Convert directory to a Path object if it's a string
    file_paths = list(directory.glob("*.gpkg"))  # Modify the extension if different
    
    # List to hold each GeoDataFrame
    gdfs = []
    # Load each file into a GeoDataFrame
    for file_path in file_paths:
        gdf = gpd.read_file(file_path)
        gdfs.append(gdf)
    
    combined_gdf = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True))

    pix_cols = [col for col in combined_gdf.columns if col.startswith('PixelScore_')]
    combined_gdf['PixelScore'] = combined_gdf[pix_cols].sum(axis=1).astype(int)
    return combined_gdf


def do_connectivity_stacking(stepping_stones, corridors):
    """Corridors and stepping stones aren't mutually exclusive, so make sure that areas
    which are both stepping stones and a corridor get only marked as corridor (which is the higher priority

    TODO: this function could be generalised for n layers"""
    # Start from Highest Priority:
    # Needs no change as this sits on top
    highest_layer = corridors.copy()
    print("Step1 complete")

    # Buffer 8:
    # subtract the layer on top
    second_layer = stepping_stones.overlay(corridors, how="difference")
    print("Step2 complete")

    combined = pd.concat([highest_layer, second_layer]).set_geometry("geometry")
    return combined


def rasterize_and_save(
    gdf_for_bounds, gdf_to_raster, x_resolution, y_resolution, output_path
):
    # Determine the bounds of the combined geometries
    gdf_for_bounds = gdf_for_bounds.to_crs("epsg:2193")
    gdf_to_raster = gdf_to_raster.to_crs("epsg:2193")

    minx, miny, maxx, maxy = gdf_for_bounds.total_bounds

    # Define the raster transform and shape
    width = int((maxx - minx) / x_resolution)
    height = int((maxy - miny) / y_resolution)
    transform = rasterio.transform.from_bounds(minx, miny, maxx, maxy, width, height)

    # Prepare shapes and values for rasterization
    shapes = (
        (geom, value)
        for geom, value in zip(gdf_to_raster.geometry, gdf_to_raster.PixelScore)
    )

    # Rasterize the shapes
    raster = rasterize(
        shapes=shapes,
        out_shape=(height, width),
        transform=transform,
        fill=99,  # Nodata value
        dtype="uint8",
    )

    # Save the raster to file with compression
    with rasterio.open(
        output_path,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=1,
        dtype="uint8",
        crs=gdf_for_bounds.crs,
        transform=transform,
        compress="lzw",
        nodata=99,
        tiled=True,
        blockxsize=256,
        blockysize=256,
    ) as dst:
        dst.write(raster, 1)
        dst.build_overviews([2, 4, 8, 16], Resampling.average)
        dst.update_tags(ns="rio_overview", resampling="average")

    print(f"Raster saved and pyramids built at: {output_path}")




def dissolve_overlapping(gdf, id_col=None):
    """Return a new dataframe where overlapping polygons are dissolved, while preserving the index

    Args:
        gdf (gpd.GeoDataFrame): Input GeoDataFram to be dissolved

    Returns:
        gpd.GeoDataFrame: Output GeoDaraFrame with one row per overlapping polygon group
    """
    if id_col is None:
        gdf = gdf.reset_index().rename({"index": "uid"}, axis=1)
        gdf["uid"] = gdf["uid"].astype(str)
    else:
        gdf["uid"] = gdf[id_col].astype(str)
    overlaps = gpd.sjoin(gdf, gdf, how="inner", predicate="intersects")
    overlaps = overlaps[overlaps.index != overlaps.index_right]

    # Handling label columns correctly
    # Combine Label_1 and Label_2 from both sides of the join, avoiding duplicates
    if overlaps.shape[0] == 0:
        return gdf
    else:
        overlaps["combined_labels"] = overlaps.apply(
            lambda row: ", ".join(sorted(set([row["uid_left"], row["uid_right"]]))),
            axis=1,
        )
        overlaps = overlaps.reset_index().rename({"index": "index_left"}, axis=1)
        # Aggregate combined labels for each original polygon involved in any overlap
        grouped = (
            overlaps.groupby(overlaps.index_left)["combined_labels"]
            .agg(lambda labels: ", ".join(sorted(set(", ".join(labels).split(", ")))))
            .rename("agg_labels")
        )

        # Update the original dataframe with aggregated labels
        gdf.loc[grouped.index, "uid"] = grouped.values

        # Mark polygons as overlapping or non-overlapping
        gdf["overlap_group"] = gdf.index.map(
            lambda x: "overlapping" if x in grouped.index else "non-overlapping"
        )

        # Dissolve polygons based on overlapping status, using 'first' to keep the aggregated labels
        if id_col is None:
            result = (
                gdf.dissolve(by="uid", aggfunc="first")
                .drop("overlap_group", axis=1)
                .reset_index()
            )
        else:
            result = (
                gdf.dissolve(by="uid", aggfunc="first")
                .reset_index()
                .drop(["overlap_group", id_col], axis=1)
                .rename({"uid": id_col}, axis=1)
            )
        return result


def expand_stepping_stone_until_size(gdf, min_size_ha=1):
    """Expand polygons in a GeoDataFrame until they reach a minimum size in hectares.

    Args:
        gdf (gpd.GeoDataFrame): Input GeoDataFrame containing polygons that represent potential ecological stepping stones.
        min_size_ha (float): Minimum size in hectares that each polygon must be expanded to, default is 1 hectare.

    Returns:
        gpd.GeoDataFrame: Returns a GeoDataFrame with undersized polygons buffered until they meet the min_size_ha requirement.
    """
    # Convert hectares to square meters (1 ha = 10,000 square meters)
    min_size_m2 = min_size_ha * 1 / m2_to_ha

    # buffer_amount = 1  # Initial buffer amount
    # buffer_amount = (min_size_m2 - min(gdf.area)) / 10  # Dynamic increment
    buffer_amount = 10
    increment = 10
    if min(gdf.area) < min_size_m2:
        print(f"needs expanding to meet min size: smallest_area = {min(gdf.area)}")
        while min(gdf.area) < min_size_m2:
            print(
                "\nWas: ", min(gdf.area), min_size_m2, "buffer_amunt = ", buffer_amount
            )
            buffer_amount += increment

            gdf.loc[gdf.area < min_size_m2, "geometry"] = gdf.loc[
                gdf.area < min_size_m2, "geometry"
            ].buffer(buffer_amount)
            gdf = gdf.dissolve().explode(index_parts=False)
            print("Now: ", min(gdf.area), min_size_m2)
    else:
        print(
            f"No expanding required to meet min size: smallest_area = {min(gdf.area)}"
        )
    return gdf


def expand_stepping_stone_until_size_with_overlay(
    gdf,
    envelope,
    min_size_ha=1,
    max_buffer_amount=250,
    buffer_increment=25,
    debug=False,
):
    """Expand polygons in a GeoDataFrame until they reach a minimum size in hectares. This version of the function is
    more complex as it requires increasing the buffer size, and then overlaying the stepping stone envelope each time
    to ensure that the resulting polygon is valid.

    Args:
        gdf (gpd.GeoDataFrame): Input GeoDataFrame containing polygons that represent potential ecological stepping stones.
        min_size_ha (float): Minimum size in hectares that each polygon must be expanded to, default is 1 hectare.
        max_buffer_amount (int): Max we're allowed to increase the stepping stone buffer size.
        buffer_increment (float): How much we increase buffer size each iteration. Smaller = slower but less overshoot

    Returns:
        (gpd.GeoDataFrame, gpd.GeoDataFrame): Returns two dataframes - a GeoDataFrame with undersized polygons buffered
        until they meet the min_size_ha requirement and a debug dataframe of small polygons
    """
    gdf = gdf[["geometry"]].overlay(envelope[["geometry"]])
    if gdf.shape[0] == 0:
        return None, None
    gdf = gdf.dissolve().explode()

    gdf["Label"] = [str(i) for i in range(gdf.shape[0])]
    # gdf = gdf[gdf.Label.isin(["127", "128", "129"])].copy()

    min_area_m2 = min_size_ha * (1 / m2_to_ha)
    smallest_area_m2 = min(gdf.area)

    buffer_amount = buffer_increment
    # 200 means that stepping stones could be have a min distance of 900 - 200 or a max distance of 1100 + 200
    if smallest_area_m2 < min_area_m2:
        print(
            f"Stepping stones have been cut off and are now below the min_area threshold: smallest_area_m2 = {smallest_area_m2}"
        )
        small_gdfs = []

        while (min(gdf.area) < min_area_m2) and (buffer_amount <= max_buffer_amount):
            if debug:
                print("\n\n")
                print("Smallest: ", gdf[gdf.area == min(gdf.area)])
                print("Smalls: ", gdf[gdf.area <= min_area_m2])
                print("Smallest area: ", min(gdf.area))
                print("Smallest shape: ", gdf[gdf.area == min(gdf.area)].shape[0])
                print(
                    f"Was: {min(gdf.area)},{min_area_m2},buffer_amunt = {buffer_amount}"
                )
                small_gdfs.append(
                    gdf[
                        (gdf.Label.str.contains("127"))
                        | (gdf.Label.str.contains("128"))
                        | (gdf.Label.str.contains("129"))
                    ]
                )
            small_gdfs.append(gdf[(gdf.Label.str.contains("5"))])

            buffer_amount += buffer_increment

            gdf.loc[gdf.area < min_area_m2, "geometry"] = gdf.loc[
                gdf.area < min_area_m2, "geometry"
            ].buffer(buffer_amount)

            gdf = dissolve_overlapping(gdf, id_col="Label")

            gdf = gdf.overlay(envelope)
            gdf = gdf.reset_index()
            gdf = gdf.dissolve(by="Label").reset_index().drop(["index"], axis=1)
            if debug:
                print("Now: ", min(gdf.area), min_area_m2)
                fig, ax = plt.subplots(figsize=(5, 5))
                subset = small_gdfs
                for idx, small in enumerate(subset[::-1]):
                    small.plot(ax=ax, alpha=0.51, column="Label", edgecolor="black")
                    break
                plt.show()
        if min(gdf.area) < min_area_m2:
            print(
                "Some areas couldn't be expanded and kept in the restoration envelope"
            )
        else:
            print("Successfully expanded to target minimum amount of 1ha")

        return gdf, small_gdfs
    else:
        print("No changes required")
        return gdf, None


def generate_stepping_stones(
    terr, envelope, first_buffer_size=900, buffer_width=200, min_size_ha=1, debug=False
):
    def do_self_join(df):
        cross = pd.merge(left=df, right=df, how="cross")
        cross = cross.loc[cross["id_x"] < cross["id_y"]]  # Remove self joins

        cross = cross.loc[
            cross.geometry_x.intersects(cross.geometry_y)
        ]  # Select only polygons intersecting
        cross["inter"] = cross.geometry_x.intersection(
            cross.geometry_y
        )  # Intersect them
        cross = cross.set_geometry("inter")
        return cross

    # Buffer some of the way, otherwise we end up with stepping stones perpendicular to ENAs
    terr_buffer_half = terr.copy()
    terr_buffer_half["geometry"] = terr_buffer_half.buffer(first_buffer_size / 2)
    terr_buffer_half = terr_buffer_half.dissolve().explode()

    # Buffer the rest of the way to first_buffer_size
    terr_buffer_indv = terr_buffer_half.copy()
    terr_buffer_indv["geometry"] = terr_buffer_indv.geometry.apply(
        lambda x: x.buffer(first_buffer_size / 2, resolution=5)
    )
    terr_buffer_indv = terr_buffer_indv.explode()
    if debug:
        terr_buffer_indv[['geometry']].to_file('terr_buffer_indv.gpkg')

    # Buffer the buffer_width - this is where stepping stones can live
    terr_buffer_200 = terr_buffer_indv.copy()
    terr_buffer_200["geometry"] = terr_buffer_200.geometry.apply(
        lambda x: x.buffer(buffer_width, resolution=5)
    )
    terr_buffer_200 = terr_buffer_200.explode()
    if debug:
        terr_buffer_200[['geometry']].to_file('terr_buffer_200.gpkg')

    # creat ID colummn
    terr_buffer_200 = (
        terr_buffer_200.reset_index(drop=True)
        .reset_index()
        .rename({"index": "id"}, axis=1)
    )
    # join on self so we can get intersections between neighboring ENAs
    terr_sse_candidates = do_self_join(terr_buffer_200)
    # remove the original buffer we don't want
    if terr_sse_candidates.shape[0] == 0:
        print("No candidates found")
        return None
    terr_sse_candidates = terr_sse_candidates.overlay(
        terr_buffer_indv, how="difference"
    )
    terr_sse_candidates = terr_sse_candidates.dissolve().explode()
    terr_sse_candidates["geometry"] = terr_sse_candidates["inter"]
    terr_sse_candidates = terr_sse_candidates.set_geometry("geometry")

    if debug:
        terr_sse_candidates[['geometry']].to_file('dummy.gpkg')
    # expand stepping stone candidates to 1ha target
    terr_sse_candidates_expand = terr_sse_candidates.copy()
    terr_sse_candidates_expand = terr_sse_candidates_expand.dissolve().explode(
        index_parts=False
    )
    terr_sse_candidates_expand = expand_stepping_stone_until_size(
        terr_sse_candidates_expand,
        min_size_ha=min_size_ha,
    )
    # expand stepping stones that are made smaller by the overlay with the allowable area
    # We do this in addition to the previous step as it reduces the risk of losing
    # stepping stones
    terr_sse_candidates_filt, _ = expand_stepping_stone_until_size_with_overlay(
        terr_sse_candidates_expand,
        envelope[["geometry"]],
        min_size_ha=min_size_ha,
        debug=False,
    )
    return terr_sse_candidates_filt


from shapely.geometry import Polygon


def priority_stack_n_layers(layers_desc_prio, geometry_col="geometry", debug=False):
    """
    Stack a n layers, such that one layer of higher priority is 'on top' and unchanged,
    and sucessive layers are below and cropped so there's no overlapping polygons
    """

    stacked_layers = []

    # Start from Highest Priority:
    # Needs no change as this sits on top
    combined_layer = layers_desc_prio[0].copy()

    for n_layer, layer in enumerate(layers_desc_prio[1:]):
        # subtract the layer on top
        next_layer = layer.overlay(combined_layer, how="difference", keep_geom_type=True)
        if debug:
            print(f"Subtracted layer {n_layer+1}")

        combined_layer = gpd.GeoDataFrame(
            pd.concat([combined_layer, next_layer], axis=0, ignore_index=True)
        )
    return combined_layer
