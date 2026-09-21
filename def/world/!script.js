const fs = require("fs");

// ========================================
// НАСТРОЙКИ
// ========================================

const MAIN_FILE = "./prefab_corner.fld.sii";
const SECOND_FILE = "./prefab_corner.fldtranssib.sii";
const OUTPUT_FILE = "./prefab_corner.fldtranssib_result.sii";

// Какой ключ ищем
// Например:
// "model_def"
// "prefab_model"
// "building_scheme"
// "vehicle"
// и т.д.
const KEY = "prefab_corner";

// ========================================
// ФУНКЦИЯ ЭКРАНИРОВАНИЯ REGEX
// ========================================

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ========================================
// REGEX ДЛЯ ПОИСКА КЛЮЧА
// ========================================

// Поддерживает оба варианта:
//
// prefab_model : prefab.test {
// prefab_model : prefab.test
// {
//
// Также допускает табы и несколько пробелов.
function getKeyRegex(key) {
  const escapedKey = escapeRegExp(key);

  return new RegExp(`^\\s*${escapedKey}\\s*:\\s*([^\\s{]+)`, "i");
}

// ========================================
// ПОЛУЧЕНИЕ ИМЁН ИЗ MAIN
// ========================================

function getNamesFromMain(content, key) {
  const names = new Set();

  const lines = content.split(/\r?\n/);

  const regex = getKeyRegex(key);

  for (const line of lines) {
    const match = line.match(regex);

    if (match) {
      names.add(match[1]);
    }
  }

  return names;
}

// ========================================
// ЧИТАЕМ MAIN
// ========================================

const mainContent = fs.readFileSync(MAIN_FILE, "utf8");

const mainNames = getNamesFromMain(mainContent, KEY);

console.log("========================================");
console.log(`Ключ: ${KEY}`);
console.log(`Файл MAIN: ${MAIN_FILE}`);
console.log(`Найдено блоков в MAIN: ${mainNames.size}`);
console.log("========================================");

// ========================================
// ЧИТАЕМ ВТОРОЙ ФАЙЛ
// ========================================

const secondContent = fs.readFileSync(SECOND_FILE, "utf8");

const lines = secondContent.split(/\r?\n/);

const result = [];

const keyRegex = getKeyRegex(KEY);

let commentedCount = 0;
let foundCount = 0;

let i = 0;

// ========================================
// ОБХОД ВТОРОГО ФАЙЛА
// ========================================

while (i < lines.length) {
  const line = lines[i];

  // ========================================
  // Ищем нужный KEY
  // ========================================

  const match = line.match(keyRegex);

  // Это обычная строка
  if (!match) {
    result.push(line);
    i++;
    continue;
  }

  const blockName = match[1];

  foundCount++;

  // ========================================
  // Если имя найдено в MAIN
  // ========================================

  if (mainNames.has(blockName)) {
    const block = [];

    let braceLevel = 0;
    let opened = false;

    // ========================================
    // Забираем весь блок
    // ========================================

    while (i < lines.length) {
      const currentLine = lines[i];

      block.push(currentLine);

      // Считаем открывающие скобки
      const openBraces = (currentLine.match(/\{/g) || []).length;

      // Считаем закрывающие скобки
      const closeBraces = (currentLine.match(/\}/g) || []).length;

      braceLevel += openBraces;
      braceLevel -= closeBraces;

      // Запомнили, что встретили {
      if (openBraces > 0) {
        opened = true;
      }

      i++;

      // ====================================
      // Блок полностью закрыт
      // ====================================

      if (opened && braceLevel === 0) {
        break;
      }
    }

    // ========================================
    // Комментируем весь блок
    // ========================================

    for (const blockLine of block) {
      // Пустые строки оставляем пустыми
      if (blockLine.trim() === "") {
        result.push(blockLine);
      } else {
        // Если строка уже закомментирована,
        // второй # не добавляем
        if (blockLine.trimStart().startsWith("#")) {
          result.push(blockLine);
        } else {
          result.push("# " + blockLine);
        }
      }
    }

    commentedCount++;

    console.log(`Закомментирован: ${KEY} : ${blockName}`);
  } else {
    // ========================================
    // В MAIN такого имени нет
    // ========================================

    result.push(line);
    i++;
  }
}

// ========================================
// СОХРАНЕНИЕ
// ========================================

fs.writeFileSync(OUTPUT_FILE, result.join("\n"), "utf8");

// ========================================
// РЕЗУЛЬТАТ
// ========================================

console.log("");
console.log("========================================");
console.log("ГОТОВО");
console.log("========================================");
console.log(`Ключ:              ${KEY}`);
console.log(`Блоков в MAIN:     ${mainNames.size}`);
console.log(`Блоков во втором:  ${foundCount}`);
console.log(`Закомментировано:  ${commentedCount}`);
console.log(`Результат:         ${OUTPUT_FILE}`);
console.log("========================================");
