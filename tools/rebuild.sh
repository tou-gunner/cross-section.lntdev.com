#!/usr/bin/env bash
# Rebuild every dataset in place. Run from anywhere: cd's to the web root.
#
# Notes:
# - sections/ and csv/ are wiped first because a rebuild can SHRINK the
#   section count (collinear joining) and stale XS_*.json/.csv would linger.
# - bankoum + phoungoy need --z-min 0 (river beds at 9 m / 52 m MSL are
#   genuine; the default 100 m floor would flood QC with false warnings).
# - MSL = Hondau + 0.14 m holds for all three sites (regional datum offset).
#   Every site is built twice — once per datum — with the other datum's file
#   as the cross-check (offset 0.14 from MSL, -0.14 from Hondau). Stanzas are
#   interleaved MSL/Hondau per site so the viewer dropdown pairs them up.
# - process.py reads .xlsx directly (openpyxl); phoungoy is built from the
#   original Excel deliverables.
# - Each site also has a multibeam CSV pair (dam-site bathymetry filling the
#   reach the main survey skips); it is processed as a second section stream
#   with ids XMU-n and its own accounting.
# - Extension_X82-X92_{MSL,HONDAU}.xlsx (delivered 2026-07-23) re-deliver
#   sections X-82..X-92 extended landward to ~196 m; --extend-csv drops the
#   re-delivered duplicate points and folds the new ground into the same
#   sections (ids stay stable).
# - After every run, check datasets/<id>/qc_report.txt: the point-accounting
#   INVARIANT lines (one main + one multibeam per dataset) must end "True".
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf datasets/pakchom/sections datasets/pakchom/csv
python3 tools/process.py \
  --input "Data/4_Cross section_Pakchom" --csv "Cross Section_MSL.csv" \
  --check-csv "Cross Section_Hondau.csv" --check-offset 0.14 \
  --extend-csv "Extension_X82-X92_MSL.xlsx" \
  --extend-check-csv "Extension_X82-X92_HONDAU.xlsx" \
  --multibeam-csv "Section_multibeam-pakchom_MSL.csv" \
  --multibeam-check-csv "Section_multibeam-pakchom_HONDAU.csv" \
  --dataset-id pakchom --name "ປາກຊົມ (ແມ່ນ້ຳຂອງ, MSL)" \
  --out datasets/pakchom --index datasets/datasets.json

rm -rf datasets/pakchom-hondau/sections datasets/pakchom-hondau/csv
python3 tools/process.py \
  --input "Data/4_Cross section_Pakchom" --csv "Cross Section_Hondau.csv" \
  --check-csv "Cross Section_MSL.csv" --check-offset -0.14 \
  --extend-csv "Extension_X82-X92_HONDAU.xlsx" \
  --extend-check-csv "Extension_X82-X92_MSL.xlsx" \
  --multibeam-csv "Section_multibeam-pakchom_HONDAU.csv" \
  --multibeam-check-csv "Section_multibeam-pakchom_MSL.csv" \
  --dataset-id pakchom-hondau --name "ປາກຊົມ (ແມ່ນ້ຳຂອງ, Hondau)" --datum Hondau \
  --out datasets/pakchom-hondau --index datasets/datasets.json

rm -rf datasets/bankoum/sections datasets/bankoum/csv
python3 tools/process.py \
  --input "Data/4_Cross section_B Koum" \
  --csv "Cross Section MAEKHONG -MSL.csv" \
  --check-csv "Cross Section MAEKHONG -HONDAU.csv" --check-offset 0.14 \
  --multibeam-csv "Section-multibeam_Ban Koum-MSL.csv" \
  --multibeam-check-csv "Section-multibeam_Ban Koum-Hondau.csv" \
  --dataset-id bankoum --name "ບ້ານກຸ່ມ (ແມ່ນ້ຳຂອງ, MSL)" --z-min 0 \
  --out datasets/bankoum --index datasets/datasets.json

rm -rf datasets/bankoum-hondau/sections datasets/bankoum-hondau/csv
python3 tools/process.py \
  --input "Data/4_Cross section_B Koum" \
  --csv "Cross Section MAEKHONG -HONDAU.csv" \
  --check-csv "Cross Section MAEKHONG -MSL.csv" --check-offset -0.14 \
  --multibeam-csv "Section-multibeam_Ban Koum-Hondau.csv" \
  --multibeam-check-csv "Section-multibeam_Ban Koum-MSL.csv" \
  --dataset-id bankoum-hondau --name "ບ້ານກຸ່ມ (ແມ່ນ້ຳຂອງ, Hondau)" --datum Hondau --z-min 0 \
  --out datasets/bankoum-hondau --index datasets/datasets.json

rm -rf datasets/phoungoy/sections datasets/phoungoy/csv
python3 tools/process.py \
  --input "Data/4_Cross section_PHOUNGOY" --csv "Cross Section_MSL.xlsx" \
  --check-csv "Cross Section_HONDAU.xlsx" --check-offset 0.14 \
  --multibeam-csv "CrossSection_Multibeam_PhouNgou_MSL.csv" \
  --multibeam-check-csv "CrossSection_Multibeam_PhouNgou_HONDAU.csv" \
  --dataset-id phoungoy --name "ພູງອຍ (ແມ່ນ້ຳຂອງ, MSL)" --z-min 0 \
  --out datasets/phoungoy --index datasets/datasets.json

rm -rf datasets/phoungoy-hondau/sections datasets/phoungoy-hondau/csv
python3 tools/process.py \
  --input "Data/4_Cross section_PHOUNGOY" --csv "Cross Section_HONDAU.xlsx" \
  --check-csv "Cross Section_MSL.xlsx" --check-offset -0.14 \
  --multibeam-csv "CrossSection_Multibeam_PhouNgou_HONDAU.csv" \
  --multibeam-check-csv "CrossSection_Multibeam_PhouNgou_MSL.csv" \
  --dataset-id phoungoy-hondau --name "ພູງອຍ (ແມ່ນ້ຳຂອງ, Hondau)" --datum Hondau --z-min 0 \
  --out datasets/phoungoy-hondau --index datasets/datasets.json

echo
grep -H "INVARIANT" datasets/*/qc_report.txt
