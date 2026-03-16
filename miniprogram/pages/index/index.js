const { birthdayToPokemonId, getPokemonImageUrl, IMAGE_SOURCE_LIST } = require('../../utils/util');
const pokemonList = require('../../data/pokemon.js');

const STORAGE_SOURCE_INDEX = 'imageSourceIndex';

Page({
  data: {
    birthday: '',
    imageSourceList: IMAGE_SOURCE_LIST,
    imageSourceIndex: 0,
    pokemonId: null,
    pokemonName: '',
    pokemonNameJp: '',
    pokemonNameEn: '',
    pokemonImageUrl: '',
    showResult: false
  },

  onLoad() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    let imageSourceIndex = 0;
    try {
      const saved = wx.getStorageSync(STORAGE_SOURCE_INDEX);
      if (typeof saved === 'number' && saved >= 0 && saved < IMAGE_SOURCE_LIST.length) {
        imageSourceIndex = saved;
      }
    } catch (e) {}
    this.setData({
      birthday: `${y}-${m}-${d}`,
      imageSourceIndex
    });
  },

  onBirthdayChange(e) {
    const birthday = e.detail.value;
    this.setData({ birthday });
    this.computePokemon(birthday);
  },

  onSourceChange(e) {
    const index = parseInt(e.detail.value, 10);
    this.setData({ imageSourceIndex: index });
    try {
      wx.setStorageSync(STORAGE_SOURCE_INDEX, index);
    } catch (e) {}
    if (this.data.showResult && this.data.pokemonId) {
      const sourceId = IMAGE_SOURCE_LIST[index].id;
      const pokemonImageUrl = getPokemonImageUrl(this.data.pokemonId, sourceId);
      this.setData({ pokemonImageUrl });
    }
  },

  computePokemon(birthday) {
    if (!birthday) {
      this.setData({ showResult: false });
      return;
    }
    const id = birthdayToPokemonId(birthday);
    const item = pokemonList.find(p => p.id === id);
    const sourceId = IMAGE_SOURCE_LIST[this.data.imageSourceIndex].id;
    const pokemonImageUrl = getPokemonImageUrl(id, sourceId);
    this.setData({
      pokemonId: id,
      dexNoFormatted: String(id).padStart(4, '0'),
      pokemonName: item ? item.name : '',
      pokemonNameJp: item ? (item.nameJp || '') : '',
      pokemonNameEn: item ? (item.nameEn || '') : '',
      pokemonImageUrl,
      showResult: true
    });
  },

  onImageError() {
    wx.showToast({
      title: '图片加载失败，请切换图源为 jsDelivr 或点击刷新',
      icon: 'none',
      duration: 3000
    });
  },

  onRefreshImage() {
    if (!this.data.showResult || !this.data.pokemonId) return;
    const sourceId = IMAGE_SOURCE_LIST[this.data.imageSourceIndex].id;
    const baseUrl = getPokemonImageUrl(this.data.pokemonId, sourceId);
    const sep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
    this.setData({
      pokemonImageUrl: baseUrl + sep + 't=' + Date.now()
    });
  },

  onConfirm() {
    this.computePokemon(this.data.birthday);
  }
});
