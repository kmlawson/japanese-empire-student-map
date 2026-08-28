#!/bin/sh
# Fetch 근대지리정보 (Modern Geographic Information) from the National
# Institute of Korean History and unpack it beside this script.
#
# The site has no direct link to the file: the page posts a form to
# fileDownload.do with the stored name and the display name. That is what
# this reproduces. See README.md for what comes out.
set -e
cd "$(dirname "$0")"

# Descriptive, and deliberately carries no contact address.
UA='japanese-empire-student-map/1.0 (historical GIS reference)'

curl -fsS -A "$UA" -e 'https://hgis.history.go.kr/mod_g1/main.do' \
  -o mk_mod_info.zip \
  -X POST 'https://hgis.history.go.kr/pro_g1/fileDownload.do' \
  --data-urlencode 'fileName=mk_mod_info.zip' \
  --data-urlencode 'orgFileName=근대지리정보.zip'

shasum -a 256 -c mk_mod_info.zip.sha256 || \
  echo 'NOTE: checksum differs — the dataset is updated from time to time.'

# The .hwp inside has a CP949 filename, which unzip mangles; the shapefile
# names are plain ASCII, so take those and leave the document alone.
rm -rf shp && mkdir shp
unzip -o -j mk_mod_info.zip 'place_modern_open.*' -d shp

echo
echo 'Unpacked into shp/ . To look at it in lon/lat:'
echo '  ogr2ogr -f GeoJSON places.geojson shp/place_modern_open.shp -t_srs EPSG:4326'
