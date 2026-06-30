const ACCOUNT_IMPORT_ALIASES = {
  id: ["id", "account_id", "gift_account_id"],
  username: ["username", "user", "tai_khoan", "account", "ten_tai_khoan"],
  password: ["password", "pass", "mat_khau"],
  status: ["status", "trang_thai"],
  tier: ["tier", "egg_tier", "hang_qua"],
  platform: ["platform", "nen_tang"],
  token: ["token", "access_token"],
  pool_id: ["pool_id", "gift_pool_id", "kho_qua"],
  assigned_at: ["assigned_at", "ngay_gan"],
};

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function makeClientId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseDelimitedText(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim());
  const firstLine = lines[0] || "";
  const delimiter = firstLine.includes("\t")
    ? "\t"
    : firstLine.includes(";")
      ? ";"
      : ",";

  return lines.map((line) => splitDelimitedLine(line, delimiter));
}

function readUInt16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUInt32(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

async function inflateRaw(data) {
  if (!globalThis.DecompressionStream) {
    throw new Error("Trình duyệt hiện tại chưa hỗ trợ đọc file XLSX trực tiếp.");
  }

  const stream = new Blob([data]).stream().pipeThrough(
    new DecompressionStream("deflate-raw")
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function getZipEntryText(entries, name) {
  const entry = entries.get(name);

  if (!entry) {
    return "";
  }

  if (entry.method === 0) {
    return new TextDecoder("utf-8").decode(entry.data);
  }

  if (entry.method === 8) {
    return new TextDecoder("utf-8").decode(await inflateRaw(entry.data));
  }

  throw new Error("File XLSX dùng định dạng nén chưa được hỗ trợ.");
}

function readZipEntries(buffer) {
  const bytes = new Uint8Array(buffer);
  let endOffset = -1;

  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (readUInt32(bytes, index) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }

  if (endOffset === -1) {
    throw new Error("File Excel không hợp lệ.");
  }

  const entryCount = readUInt16(bytes, endOffset + 10);
  let cursor = readUInt32(bytes, endOffset + 16);
  const entries = new Map();
  const decoder = new TextDecoder("utf-8");

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32(bytes, cursor) !== 0x02014b50) {
      throw new Error("File Excel bị lỗi cấu trúc.");
    }

    const method = readUInt16(bytes, cursor + 10);
    const compressedSize = readUInt32(bytes, cursor + 20);
    const nameLength = readUInt16(bytes, cursor + 28);
    const extraLength = readUInt16(bytes, cursor + 30);
    const commentLength = readUInt16(bytes, cursor + 32);
    const localHeaderOffset = readUInt32(bytes, cursor + 42);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));

    if (readUInt32(bytes, localHeaderOffset) !== 0x04034b50) {
      throw new Error("File Excel bị lỗi header.");
    }

    const localNameLength = readUInt16(bytes, localHeaderOffset + 26);
    const localExtraLength = readUInt16(bytes, localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    entries.set(name, {
      method,
      data: bytes.slice(dataStart, dataStart + compressedSize),
    });

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function getCellColumnIndex(cellRef) {
  const letters = String(cellRef || "").match(/[A-Z]+/i)?.[0] || "";

  return letters
    .toUpperCase()
    .split("")
    .reduce((result, letter) => result * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function getCellValue(cell, sharedStrings) {
  const type = cell.getAttribute("t");

  if (type === "inlineStr") {
    return [...cell.getElementsByTagName("t")]
      .map((node) => node.textContent || "")
      .join("");
  }

  const value = cell.getElementsByTagName("v")[0]?.textContent || "";

  if (type === "s") {
    return sharedStrings[Number(value)] || "";
  }

  return value;
}

async function parseXlsx(buffer) {
  const entries = readZipEntries(buffer);
  const sharedStringXml = await getZipEntryText(entries, "xl/sharedStrings.xml");
  const sheetName =
    [...entries.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)) ||
    "xl/worksheets/sheet1.xml";
  const sheetXml = await getZipEntryText(entries, sheetName);

  if (!sheetXml) {
    throw new Error("File Excel chưa có sheet dữ liệu.");
  }

  const parser = new DOMParser();
  const sharedDoc = sharedStringXml
    ? parser.parseFromString(sharedStringXml, "application/xml")
    : null;
  const sharedStrings = sharedDoc
    ? [...sharedDoc.getElementsByTagName("si")].map((item) =>
        [...item.getElementsByTagName("t")]
          .map((node) => node.textContent || "")
          .join("")
      )
    : [];
  const sheetDoc = parser.parseFromString(sheetXml, "application/xml");

  return [...sheetDoc.getElementsByTagName("row")]
    .map((row) => {
      const values = [];

      [...row.getElementsByTagName("c")].forEach((cell) => {
        values[getCellColumnIndex(cell.getAttribute("r"))] = getCellValue(
          cell,
          sharedStrings
        );
      });

      return values.map((value) => String(value || "").trim());
    })
    .filter((row) => row.some(Boolean));
}

function getHeaderIndexMap(headers) {
  return Object.fromEntries(
    Object.entries(ACCOUNT_IMPORT_ALIASES).map(([key, aliases]) => [
      key,
      headers.findIndex((header) => aliases.includes(header)),
    ])
  );
}

function getCell(row, index) {
  return index >= 0 ? String(row[index] || "").trim() : "";
}

function normalizeTier(value) {
  const tier = String(value || "A").trim().toUpperCase();
  return ["A", "B", "C", "D"].includes(tier) ? tier : "";
}

export function mapAccountImportRows(rows) {
  if (rows.length < 2) {
    throw new Error("File cần có dòng tiêu đề và ít nhất một account.");
  }

  const headers = rows[0].map(normalizeHeader);
  const indexMap = getHeaderIndexMap(headers);

  if (indexMap.username === -1 || indexMap.password === -1) {
    throw new Error("File cần có cột username và password.");
  }

  const timestamp = new Date().toISOString();
  const accounts = [];
  const mappings = [];

  rows.slice(1).forEach((row) => {
    const username = getCell(row, indexMap.username);
    const password = getCell(row, indexMap.password);

    if (!username || !password) {
      return;
    }

    const id = getCell(row, indexMap.id) || makeClientId();
    const poolId = getCell(row, indexMap.pool_id);

    const tier = normalizeTier(getCell(row, indexMap.tier));

    if (!tier) {
      throw new Error("Tier trong file chỉ được dùng A, B, C hoặc D.");
    }

    accounts.push({
      id,
      username,
      password,
      tier,
      status: getCell(row, indexMap.status) || "available",
      platform: getCell(row, indexMap.platform) || "blox-fruit",
      token: getCell(row, indexMap.token) || "",
      created_at: timestamp,
      assigned_at: getCell(row, indexMap.assigned_at) || null,
    });

    if (poolId) {
      mappings.push({
        id: makeClientId(),
        pool_id: poolId,
        account_id: id,
      });
    }
  });

  if (!accounts.length) {
    throw new Error("Không tìm thấy account hợp lệ trong file.");
  }

  return { accounts, mappings };
}

// Đọc file Excel/CSV và chuẩn hóa thành gift_accounts cùng pool_account_mappings.
export async function parseAccountImportFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "xlsx") {
    return mapAccountImportRows(await parseXlsx(await file.arrayBuffer()));
  }

  if (["csv", "tsv", "txt"].includes(extension)) {
    return mapAccountImportRows(parseDelimitedText(await file.text()));
  }

  throw new Error("Vui lòng chọn file .xlsx, .csv hoặc .tsv.");
}
