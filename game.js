/**
 * 小游戏入口（从项目根打开时的兼容入口）
 * 完整本命宝可梦功能：生日选择、图源切换、图片刷新（路径相对项目根）
 */
const { birthdayToPokemonId, getPokemonImageUrl, IMAGE_SOURCE_LIST } = require('./miniprogram/utils/util.js');
const pokemonList = require('./miniprogram/data/pokemon.js');

const STORAGE_SOURCE_INDEX = 'imageSourceIndex';
const systemInfo = wx.getSystemInfoSync();
const width = systemInfo.windowWidth;
const height = systemInfo.windowHeight;
const dpr = systemInfo.pixelRatio || 1;

let canvas;
let ctx;
let state = {
  birthday: '',
  imageSourceIndex: 0,
  pokemonId: null,
  pokemonName: '',
  pokemonNameJp: '',
  pokemonNameEn: '',
  imageUrl: '',
  imageObj: null,
  imageLoaded: false
};

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function initBirthday() {
  const d = new Date();
  state.birthday = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function saveSourceIndex() {
  try {
    wx.setStorageSync(STORAGE_SOURCE_INDEX, state.imageSourceIndex);
  } catch (e) {}
}

function loadSourceIndex() {
  try {
    const saved = wx.getStorageSync(STORAGE_SOURCE_INDEX);
    if (typeof saved === 'number' && saved >= 0 && saved < IMAGE_SOURCE_LIST.length) {
      state.imageSourceIndex = saved;
    }
  } catch (e) {}
}

function computePokemon() {
  if (!state.birthday) return;
  const id = birthdayToPokemonId(state.birthday);
  const item = pokemonList.find(p => p.id === id);
  const sourceId = IMAGE_SOURCE_LIST[state.imageSourceIndex].id;
  let url = getPokemonImageUrl(id, sourceId);
  state.pokemonId = id;
  state.pokemonName = item ? item.name : '';
  state.pokemonNameJp = item ? (item.nameJp || '') : '';
  state.pokemonNameEn = item ? (item.nameEn || '') : '';
  state.imageUrl = url;
  state.imageLoaded = false;
  state.imageObj = null;
  loadPokemonImage();
}

function loadPokemonImage() {
  if (!state.imageUrl) return;
  const img = wx.createImage();
  img.onload = () => {
    state.imageObj = img;
    state.imageLoaded = true;
    draw();
  };
  img.onerror = () => {
    draw();
  };
  img.src = state.imageUrl;
}

function draw() {
  const w = width;
  const h = height;
  ctx.fillStyle = '#e8f4fc';
  ctx.fillRect(0, 0, w, h);

  let y = 28;
  ctx.fillStyle = '#4a90d9';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('本命宝可梦', w / 2, y);
  y += 22;
  ctx.fillStyle = '#333';
  ctx.font = '14px sans-serif';
  ctx.fillText(state.birthday || '请选择生日', w / 2, y);

  const btnH = 36;
  const btnY1 = 58;
  const btnY2 = 100;
  const btnY3 = 142;
  const btnW = 160;
  const btnX = (w - btnW) / 2;

  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(btnX, btnY1, btnW, btnH);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('选择生日', w / 2, btnY1 + btnH / 2 + 5);

  ctx.fillStyle = '#6ba3e8';
  ctx.fillRect(btnX, btnY2, btnW, btnH);
  ctx.fillStyle = '#fff';
  ctx.fillText('图源: ' + (IMAGE_SOURCE_LIST[state.imageSourceIndex].name.split('（')[0]), w / 2, btnY2 + btnH / 2 + 5);

  ctx.fillStyle = '#357abd';
  ctx.fillRect(btnX, btnY3, btnW, btnH);
  ctx.fillStyle = '#fff';
  ctx.fillText('查看本命宝可梦', w / 2, btnY3 + btnH / 2 + 5);

  if (state.pokemonId != null) {
    y = 200;
    if (state.imageLoaded && state.imageObj) {
      const size = Math.min(200, w * 0.6);
      const x = (w - size) / 2;
      ctx.drawImage(state.imageObj, x, y - size - 10, size, size);
      y += 10;
    } else if (state.imageUrl && !state.imageLoaded) {
      ctx.fillStyle = '#999';
      ctx.font = '12px sans-serif';
      ctx.fillText('加载中...', w / 2, y - 80);
    }
    y += 120;
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText('No.' + ('000' + state.pokemonId).slice(-4), w / 2, y);
    y += 22;
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(state.pokemonName, w / 2, y);
    y += 20;
    if (state.pokemonNameJp) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#555';
      ctx.fillText('日文 ' + state.pokemonNameJp, w / 2, y);
      y += 18;
    }
    if (state.pokemonNameEn) {
      ctx.fillText('English ' + state.pokemonNameEn, w / 2, y);
      y += 28;
    }
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(btnX, y, btnW, btnH);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('刷新图片', w / 2, y + btnH / 2 + 5);
    state.refreshBtnY = y;
  } else {
    state.refreshBtnY = null;
  }

  state.btnSelect = { x: btnX, y: btnY1, w: btnW, h: btnH };
  state.btnSource = { x: btnX, y: btnY2, w: btnW, h: btnH };
  state.btnConfirm = { x: btnX, y: btnY3, w: btnW, h: btnH };
  state.refreshBtn = state.refreshBtnY != null ? { x: btnX, y: state.refreshBtnY, w: btnW, h: btnH } : null;
}

function hit(b, x, y) {
  return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function showDatePicker() {
  const years = [];
  for (let i = 1980; i <= 2010; i++) years.push(String(i));
  const months = [];
  for (let i = 1; i <= 12; i++) months.push(i + '月');
  const days = [];
  for (let i = 1; i <= 31; i++) days.push(i + '日');

  wx.showActionSheet({
    itemList: years,
    success(res) {
      const year = 1980 + res.tapIndex;
      wx.showActionSheet({
        itemList: months,
        success(res2) {
          const month = res2.tapIndex + 1;
          wx.showActionSheet({
            itemList: days,
            success(res3) {
              let day = res3.tapIndex + 1;
              const maxDay = new Date(year, month, 0).getDate();
              if (day > maxDay) day = maxDay;
              state.birthday = year + '-' + pad(month) + '-' + pad(day);
              draw();
            }
          });
        }
      });
    }
  });
}

function showSourcePicker() {
  wx.showActionSheet({
    itemList: IMAGE_SOURCE_LIST.map(s => s.name),
    success(res) {
      state.imageSourceIndex = res.tapIndex;
      saveSourceIndex();
      if (state.pokemonId != null) {
        const sourceId = IMAGE_SOURCE_LIST[state.imageSourceIndex].id;
        state.imageUrl = getPokemonImageUrl(state.pokemonId, sourceId);
        state.imageLoaded = false;
        state.imageObj = null;
        loadPokemonImage();
      }
      draw();
    }
  });
}

function main() {
  canvas = wx.createCanvas();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  initBirthday();
  loadSourceIndex();

  draw();

  wx.onTouchEnd((e) => {
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    if (hit(state.btnSelect, x, y)) {
      showDatePicker();
      return;
    }
    if (hit(state.btnSource, x, y)) {
      showSourcePicker();
      return;
    }
    if (hit(state.btnConfirm, x, y)) {
      computePokemon();
      draw();
      return;
    }
    if (hit(state.refreshBtn, x, y)) {
      if (state.pokemonId != null && state.imageUrl) {
        const sep = state.imageUrl.indexOf('?') >= 0 ? '&' : '?';
        state.imageUrl = state.imageUrl.split('?')[0] + sep + 't=' + Date.now();
        state.imageLoaded = false;
        state.imageObj = null;
        loadPokemonImage();
      }
      draw();
    }
  });
}

main();
