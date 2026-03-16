/**
 * 根据生日日期计算一年中的第几天（1-365 或 闰年 1-366）
 */
function getDayOfYear(year, month, day) {
  const jan1 = new Date(year, 0, 1);
  const d = new Date(year, month - 1, day);
  const diff = d - jan1;
  return Math.floor(diff / 86400000) + 1;
}

/**
 * 生日日期 → 宝可梦全国图鉴编号 1-1025
 * 映射规则：一年中的第 N 天 对应 编号 ((N-1) % 1025) + 1
 */
function birthdayToPokemonId(birthday) {
  const [year, month, day] = birthday.split('-').map(Number);
  const dayOfYear = getDayOfYear(year, month, day);
  return ((dayOfYear - 1) % 1025) + 1;
}

/**
 * 图源列表：id、显示名称、URL 模板（{id} 会被替换为图鉴编号）
 */
const IMAGE_SOURCE_LIST = [
  {
    id: 'jsdelivr',
    name: 'jsDelivr CDN（国内推荐）',
    template: 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/{id}.png'
  },
  {
    id: 'github',
    name: 'GitHub Raw',
    template: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png'
  }
];

/**
 * 根据编号与图源获取宝可梦官方立绘 URL
 * @param {number} id - 图鉴编号 1-1025
 * @param {string} sourceId - 图源 id，默认 'jsdelivr'
 */
function getPokemonImageUrl(id, sourceId) {
  const source = IMAGE_SOURCE_LIST.find(s => s.id === sourceId) || IMAGE_SOURCE_LIST[0];
  return source.template.replace('{id}', id);
}

module.exports = {
  getDayOfYear,
  birthdayToPokemonId,
  getPokemonImageUrl,
  IMAGE_SOURCE_LIST
};
