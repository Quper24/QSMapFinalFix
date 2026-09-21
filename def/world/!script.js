const fs = require("fs");

// ========================================
// НАСТРОЙКИ
// ========================================

const MAIN_FILE = "./model.rm.sii";
const SECOND_FILE = "./model.rus.sii";
const OUTPUT_FILE = "./model.rus_result.sii";

// ========================================
// ЧТЕНИЕ MAIN
// ========================================

const mainContent = fs.readFileSync(MAIN_FILE, "utf8");

// Имена model_def из MAIN
const mainModels = new Set();

// Ищем:
// model_def : model.7041rus {
const modelRegex = /^\s*model_def\s*:\s*([^\s{]+)\s*\{/gm;

let match;

while ((match = modelRegex.exec(mainContent)) !== null) {
  mainModels.add(match[1]);
}

console.log(`Найдено model_def в MAIN: ${mainModels.size}`);

// ========================================
// ЧТЕНИЕ ВТОРОГО ФАЙЛА
// ========================================

const secondContent = fs.readFileSync(SECOND_FILE, "utf8");

const lines = secondContent.split(/\r?\n/);

const result = [];

let i = 0;
let commentedCount = 0;

while (i < lines.length) {
  const line = lines[i];

  // Проверяем начало model_def
  const modelMatch = line.match(/^\s*model_def\s*:\s*([^\s{]+)\s*\{/);

  // Обычная строка
  if (!modelMatch) {
    result.push(line);
    i++;
    continue;
  }

  const modelName = modelMatch[1];

  // ========================================
  // Если модель есть в MAIN
  // ========================================

  if (mainModels.has(modelName)) {
    // Собираем весь блок
    const block = [];

    let braceLevel = 0;

    while (i < lines.length) {
      const currentLine = lines[i];

      block.push(currentLine);

      // Считаем фигурные скобки
      braceLevel += (currentLine.match(/\{/g) || []).length;
      braceLevel -= (currentLine.match(/\}/g) || []).length;

      i++;

      // Закрыли исходный блок
      if (braceLevel === 0) {
        break;
      }
    }

    // Комментируем каждую строку блока
    for (const blockLine of block) {
      // Не добавляем # перед уже пустой строкой
      if (blockLine.trim() === "") {
        result.push(blockLine);
      } else {
        result.push("# " + blockLine);
      }
    }

    commentedCount++;

    console.log(`Закомментирован: ${modelName}`);
  } else {
    // ========================================
    // Модель не найдена в MAIN
    // Оставляем как есть
    // ========================================

    result.push(line);
    i++;
  }
}

// ========================================
// СОХРАНЕНИЕ
// ========================================

fs.writeFileSync(OUTPUT_FILE, result.join("\n"), "utf8");

console.log("");
console.log("========================================");
console.log(`Готово!`);
console.log(`Совпадений: ${commentedCount}`);
console.log(`Результат: ${OUTPUT_FILE}`);
console.log("========================================");
