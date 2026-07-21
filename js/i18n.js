// Lao UI strings — single source of truth for all labels.
export const t = {
  title: 'ລະບົບເບິ່ງໜ້າຕັດຂວາງແມ່ນ້ຳ',
  dataset: 'ຊຸດຂໍ້ມູນ',
  section: 'ໜ້າຕັດຂວາງ',
  elevation: 'ລະດັບຄວາມສູງ (ມ, MSL)',
  offset: 'ໄລຍະຕາມແນວຕັດ (ມ)',
  chainage: 'ໄລຍະຕາມລຳນ້ຳ (ມ)',
  download_csv: 'ດາວໂຫຼດ CSV',
  download_all_csv: 'ດາວໂຫຼດ CSV ທັງໝົດ (ZIP)',
  vert_exag: 'ອັດຕາຂະຫຍາຍແນວຕັ້ງ',
  auto: 'ອັດຕະໂນມັດ',
  satellite: 'ພາບຖ່າຍດາວທຽມ (Esri)',
  osm: 'ແຜນທີ່ OSM',
  longitudinal: 'ເສັ້ນຕາມລຳນ້ຳ',
  strays: 'ຈຸດນອກແນວ',
  points: 'ຈຳນວນຈຸດ',
  width: 'ຄວາມກວ້າງ',
  meters: 'ມ',
  select_prompt: 'ກະລຸນາເລືອກໜ້າຕັດຂວາງໃນແຜນທີ່ ຫຼື ຈາກລາຍການ ເພື່ອເບິ່ງໂປຣໄຟລ໌',
  loading: 'ກຳລັງໂຫຼດ…',
  error_load: 'ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ',
  distance: 'ໄລຍະ',
  level: 'ລະດັບ',
  northing: 'ພິກັດເໜືອ (N)',
  easting: 'ພິກັດຕາເວັນອອກ (E)',
  save_png: 'ບັນທຶກຮູບ PNG',
  restore: 'ຄືນຄ່າເດີມ',
  zoom_x: 'ຊູມແກນນອນ',
  point_no: 'ຈຸດທີ',
};

// Fill every element carrying data-i18n="key" with its Lao string.
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
}
