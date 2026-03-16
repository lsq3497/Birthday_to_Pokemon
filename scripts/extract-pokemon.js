/**
 * 从神奇宝贝百科 HTML 中提取 1-1025 编号的宝可梦名称（中文、日文、英文）
 * 每个编号只取第一次出现，排除地区形态重复项。
 * 运行: node extract-pokemon.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', '宝可梦列表（按全国图鉴编号） - 神奇宝贝百科，关于宝可梦的百科全书.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const list = [];
const idReg = /<td class="rdexn-id">#(\d+)\s*<\/td>/g;
const seen = new Set();

function trimCell(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

let idMatch;
while ((idMatch = idReg.exec(html)) !== null) {
  const id = parseInt(idMatch[1], 10);
  if (id < 1 || id > 1025) continue;
  if (seen.has(id)) continue;

  const after = html.slice(idMatch.index);
  const nameMatch = after.match(/<td class="rdexn-name"><a[^>]*title="([^"]+)"[^>]*>/);
  if (!nameMatch) continue;

  const name = nameMatch[1];
  if (/阿罗拉|伽勒尔|洗翠|帕底亚|地区形态/.test(name)) continue;

  const jpMatch = after.match(/<td class="rdexn-jpname">\s*([^<]*?)\s*<\/td>/);
  const enMatch = after.match(/<td class="rdexn-enname">\s*([^<]*?)\s*<\/td>/);

  seen.add(id);
  list.push({
    id,
    name,
    nameJp: trimCell(jpMatch ? jpMatch[1] : ''),
    nameEn: trimCell(enMatch ? enMatch[1] : '')
  });
}

list.sort((a, b) => a.id - b.id);
const dataDir = path.join(__dirname, '..', 'miniprogram', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const jsonPath = path.join(dataDir, 'pokemon.json');
fs.writeFileSync(jsonPath, JSON.stringify(list, null, 0), 'utf8');

// 微信小程序无法 require(.json)，需用 .js 模块导出
const jsPath = path.join(dataDir, 'pokemon.js');
fs.writeFileSync(jsPath, 'module.exports = ' + JSON.stringify(list) + ';\n', 'utf8');

console.log('Extracted', list.length, 'pokemon (zh/jp/en) to', jsonPath, '&', jsPath);
