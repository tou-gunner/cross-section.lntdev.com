#!/usr/bin/env bash
# Rebuild every dataset in place. Run from anywhere: cd's to the web root.
#
# Notes:
# - sections/ and csv/ are wiped first because a rebuild can SHRINK the
#   section count (collinear joining) and stale XS_*.json/.csv would linger.
# - bankoum + phoungoy need --z-min 0 (river beds at 9 m / 52 m MSL are
#   genuine; the default 100 m floor would flood QC with false warnings).
# - MSL = Hondau + 0.14 m holds for all three sites (regional datum offset).
# - process.py reads .xlsx directly (openpyxl); phoungoy is built from the
#   original Excel deliverables.
# - Each site also has a multibeam CSV pair (dam-site bathymetry filling the
#   reach the main survey skips); it is processed as a second section stream
#   with ids XMU-n and its own accounting.
# - After every run, check datasets/<id>/qc_report.txt: the point-accounting
#   INVARIANT lines (one main + one multibeam per site) must end with "True".
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf datasets/pakchom/sections datasets/pakchom/csv
python3 tools/process.py \
  --input "Data/4_Cross section_Pakchom" --csv "Cross Section_MSL.csv" \
  --check-csv "Cross Section_Hondau.csv" --check-offset 0.14 \
  --multibeam-csv "Section_multibeam-pakchom_MSL.csv" \
  --multibeam-check-csv "Section_multibeam-pakchom_HONDAU.csv" \
  --dataset-id pakchom --name "ປາກຊົມ (ແມ່ນ້ຳຂອງ)" \
  --out datasets/pakchom --index datasets/datasets.json

rm -rf datasets/bankoum/sections datasets/bankoum/csv
python3 tools/process.py \
  --input "Data/4_Cross section_B Koum" \
  --csv "Cross Section MAEKHONG -MSL.csv" \
  --check-csv "Cross Section MAEKHONG -HONDAU.csv" --check-offset 0.14 \
  --multibeam-csv "Section-multibeam_Ban Koum-MSL.csv" \
  --multibeam-check-csv "Section-multibeam_Ban Koum-Hondau.csv" \
  --dataset-id bankoum --name "ບ້ານກຸ່ມ (ແມ່ນ້ຳຂອງ)" --z-min 0 \
  --out datasets/bankoum --index datasets/datasets.json

rm -rf datasets/phoungoy/sections datasets/phoungoy/csv
python3 tools/process.py \
  --input "Data/4_Cross section_PHOUNGOY" --csv "Cross Section_MSL.xlsx" \
  --check-csv "Cross Section_HONDAU.xlsx" --check-offset 0.14 \
  --multibeam-csv "CrossSection_Multibeam_PhouNgou_MSL.csv" \
  --multibeam-check-csv "CrossSection_Multibeam_PhouNgou_HONDAU.csv" \
  --dataset-id phoungoy --name "ພູງອຍ (ແມ່ນ້ຳຂອງ)" --z-min 0 \
  --out datasets/phoungoy --index datasets/datasets.json

echo
grep -H "INVARIANT" datasets/*/qc_report.txt
