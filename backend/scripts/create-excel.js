const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create knowledge points data
const knowledgePoints = [
  ['id', 'topic', 'volume', 'unit', 'lesson', 'sub'],
  ['kp_1', '旧石器时代与新石器文明', '中国古代史', '史前时期', '远古时代', '新石器时代'],
  ['kp_5', '商朝的统治', '中国古代史', '夏商周时期', '商朝', '政治制度'],
  ['kp_6', '西周的政治制度', '中国古代史', '夏商周时期', '西周', '分封制度'],
  ['kp_11', '商鞅变法', '中国古代史', '春秋战国', '战国时期', '政治改革'],
  ['kp_12', '孔子的思想', '中国古代史', '春秋战国', '春秋时期', '思想文化'],
  ['kp_17', '秦统一的条件和过程', '中国古代史', '秦汉时期', '秦朝', '政治统一'],
  ['kp_22', '焚书坑儒', '中国古代史', '秦汉时期', '秦朝', '思想统治'],
  ['kp_26', '"文景之治"', '中国古代史', '秦汉时期', '西汉', '治国方针'],
  ['kp_53', '科举制', '中国古代史', '隋唐时期', '隋朝', '选官制度'],
  ['kp_70', '王安石变法的目的与内容', '中国古代史', '宋元时期', '北宋', '政治改革'],
  ['kp_144', '虎门销烟', '中国近代史', '鸦片战争时期', '第一次鸦片战争', '反抗斗争'],
  ['kp_207', '五四运动', '中国近代史', '民国时期', '新文化运动', '爱国运动']
];

// Create workbook
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(knowledgePoints);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'KnowledgePoints');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write to file
const outputPath = path.join(dataDir, 'knowledge-points.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Excel file created at: ${outputPath}`);
console.log(`Number of knowledge points: ${knowledgePoints.length - 1}`); // Subtract header row