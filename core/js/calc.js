/* ═══════════════════════════════════════════════════
   ПРАЙС-ЛИСТ — все ставки здесь, меняйте только это
   ═══════════════════════════════════════════════════ */
const P = {
  markup:              0,    // наценка студии, %

  // Тип работы: руб. за 1 м²
  type_per_m2: {
    interior:          560,
    office:            420,
    exterior:          420,
    residential:        21,
  },

  // Надбавка за тип чертежа: руб. за 1 м²
  drawing_per_m2: {
    hand:              140,   // от руки
    pdf:               112,   // скан PDF
    dwg:                 0,   // DWG — без надбавки
  },

  // Файлы проекта: доля от стоимости моделирования
  files_ratio:         0.5,

  // Фото: руб. за 1 изображение
  photo_per_img: {
    hd:                210,
    fhd:               420,
    qhd:               840,
    k4:               1400,
    k8:               2800,
    k16:              4900,
  },

  // Видео: руб. за 1 кадр
  video_per_frame: {
    hd:                 14,
    fhd:                28,
    qhd:                56,
    k4:                 98,
  },

  // 360-тур: руб. за 1 точку
  pano_per_point: {
    p4k:              1400,
    p8k:              2800,
    p16k:             5600,
  },

  // Платформенная версия тура (WEB / macOS / Windows)
  tour_platform:      7000,

  // Аванс: доля от итога
  advance_ratio:       0.5,
};
/* ═══════════════════════════════════════════════════ */

const $  = id => document.getElementById(id);
const fv = id => parseFloat($(id).value) || 0;
const on = id => $(id).classList.contains('on');
const fmt = n => Math.round(n).toLocaleString('ru-RU');
const withM = n => n + n * P.markup / 100;

function ss(slId, dispId, unit) {
  $(dispId).innerHTML = $(slId).value + '<small>' + unit + '</small>';
}
function pickR(gId, el) {
  document.querySelectorAll('#' + gId + ' .ritem').forEach(r => r.classList.remove('on'));
  el.classList.add('on');
}
function togCk(el) { el.classList.toggle('on'); }
function nStep(id, delta) {
  const el = $(id);
  let val = parseInt(el.value) || 0;
  val = Math.max(0, val + delta);
  el.value = val;
  calc();
}

function accToggle(key) {
  const trg  = $('trg-' + key);
  const body = $('body-' + key);
  const hint = $('hint-' + key);
  trg.classList.toggle('open');
  body.classList.toggle('open');
  if (hint) hint.classList.toggle('open');
}

function calc() {
  // Основное
  const typeKey   = $('sel-type').value;
  const typeRate  = P.type_per_m2[typeKey] || 0;
  const area      = fv('inp-area');
  const drawEl    = document.querySelector('#rg-draw .ritem.on');
  const drawKey   = drawEl ? drawEl.dataset.val : 'hand';
  const drawRate  = P.drawing_per_m2[drawKey] || 0;
  const modeling  = withM((typeRate + drawRate) * area);
  $('out-model').innerHTML = fmt(modeling) + '<small>₽</small>';

  // Файлы проекта
  const files = on('ck-files') ? withM(modeling * P.files_ratio) : 0;
  $('out-files').innerHTML = fmt(files) + '<small>₽</small>';

  // Фото
  const photoKey  = $('sel-pres').value;
  const photoRate = P.photo_per_img[photoKey] || 0;
  const photoCnt  = fv('sl-photos');
  const photo     = withM(photoRate * photoCnt);
  $('out-photo').innerHTML = fmt(photo) + '<small>₽</small>';

  // Видео
  const vKey    = $('sel-vres').value;
  const vRate   = P.video_per_frame[vKey] || 0;
  const fps     = fv('sel-fps');
  const dur     = fv('inp-dur');
  const frames  = fps * dur;
  $('out-frames').innerHTML = fmt(frames) + '<small>кадров</small>';
  const video = withM(vRate * frames);
  $('out-video').innerHTML = fmt(video) + '<small>₽</small>';

  // Тур 360
  const panoKey  = $('sel-pano').value;
  const panoRate = P.pano_per_point[panoKey] || 0;
  const points   = fv('sl-pts');
  const dn       = on('ck-dn') ? 2 : 1;
  const platCnt  = (on('ck-web') ? 1 : 0) + (on('ck-mac') ? 1 : 0) + (on('ck-win') ? 1 : 0);
  const tour     = withM(panoRate * points * dn + platCnt * P.tour_platform);
  $('out-tour').innerHTML = fmt(tour) + '<small>₽</small>';

  // Итог
  const total = modeling + files + photo + video + tour;
  $('out-total').innerHTML = fmt(total) + '<small>₽</small>';
  $('out-adv').innerHTML   = fmt(total * P.advance_ratio) + '<small>₽</small>';
}

calc();
