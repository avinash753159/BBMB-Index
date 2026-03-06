import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const dataDir = path.join(root, 'data');

const latestPdfPath = 'C:\\Users\\avina\\Downloads\\l_010126.pdf';
const sourcePdfs = [
  'C:\\Users\\avina\\Downloads\\l_100125.pdf',
  latestPdfPath,
  'C:\\Users\\avina\\Downloads\\07768b49-0833-4f80-86c2-8095e79e6d95.pdf',
];

function extractStreams(buffer) {
  const text = buffer.toString('latin1');
  const streams = [];
  let position = 0;

  while (true) {
    const streamIndex = text.indexOf('stream', position);
    if (streamIndex === -1) break;

    let dataStart = streamIndex + 6;
    if (text[dataStart] === '\r' && text[dataStart + 1] === '\n') dataStart += 2;
    else if (text[dataStart] === '\n') dataStart += 1;

    const endIndex = text.indexOf('endstream', dataStart);
    if (endIndex === -1) break;

    streams.push(buffer.subarray(dataStart, endIndex));
    position = endIndex + 9;
  }

  return streams;
}

function decodePdfString(input) {
  let output = '';

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char !== '\\') {
      output += char;
      continue;
    }

    index += 1;
    const next = input[index];
    if (next === 'n') output += '\n';
    else if (next === 'r') output += '\r';
    else if (next === 't') output += '\t';
    else if (next === 'b') output += '\b';
    else if (next === 'f') output += '\f';
    else if (next === '(' || next === ')' || next === '\\') output += next;
    else if (/[0-7]/.test(next ?? '')) {
      let octal = next;
      for (let count = 0; count < 2 && /[0-7]/.test(input[index + 1] ?? ''); count += 1) {
        index += 1;
        octal += input[index];
      }
      output += String.fromCharCode(parseInt(octal, 8));
    } else {
      output += next ?? '';
    }
  }

  return output;
}

function extractStrings(content) {
  const strings = [];
  const pattern = /\[((?:.|\n|\r)*?)\]\s*TJ|\(((?:\\.|[^\\)])*)\)\s*Tj|\(((?:\\.|[^\\)])*)\)\s*'/g;
  let match;

  while ((match = pattern.exec(content))) {
    if (match[1] !== undefined) {
      const chunks = [];
      const stringPattern = /\(((?:\\.|[^\\)])*)\)/g;
      let innerMatch;
      while ((innerMatch = stringPattern.exec(match[1]))) {
        chunks.push(decodePdfString(innerMatch[1]));
      }
      if (chunks.length) strings.push(chunks.join(''));
      continue;
    }

    if (match[2] !== undefined) strings.push(decodePdfString(match[2]));
    else if (match[3] !== undefined) strings.push(decodePdfString(match[3]));
  }

  return strings.map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function normalizeDate(raw) {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function mergeDateTokens(tokens) {
  const merged = [];

  for (let index = 0; index < tokens.length; index += 1) {
    let replacement = null;
    let consumed = 0;

    for (let span = 4; span >= 1; span -= 1) {
      const candidate = tokens.slice(index, index + span).join('').replace(/\s+/g, '');
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(candidate)) {
        replacement = candidate;
        consumed = span;
        break;
      }
    }

    if (replacement) {
      merged.push(replacement);
      index += consumed - 1;
    } else {
      merged.push(tokens[index]);
    }
  }

  return merged;
}

function extractFundRows(tokens, label) {
  const startIndex = tokens.indexOf(`${label} NAV`);
  if (startIndex === -1) return [];

  const mergedTokens = mergeDateTokens(tokens.slice(startIndex + 1));
  const rows = [];

  for (let index = 0; index < mergedTokens.length; index += 1) {
    const date = normalizeDate(mergedTokens[index]);
    if (!date) continue;

    let amount = '';
    let started = false;

    for (let nextIndex = index + 1; nextIndex < mergedTokens.length; nextIndex += 1) {
      const token = mergedTokens[nextIndex].replace(/\s+/g, '');
      if (normalizeDate(token)) break;

      if (!started) {
        if (token.includes('$')) {
          started = true;
          amount += token.replace(/\$/g, '');
          if (/^\d+(?:\.\d{2})$/.test(amount.replace(/,/g, ''))) break;
        }
        continue;
      }

      if (!/^[0-9.,]+$/.test(token)) break;
      amount += token;
      if (/^\d+(?:\.\d{2})$/.test(amount.replace(/,/g, ''))) break;
    }

    const nav = Number(amount.replace(/,/g, ''));
    if (Number.isFinite(nav)) rows.push({ date, nav });
  }

  return rows;
}

async function main() {
  const pdfBuffer = await fs.readFile(latestPdfPath);
  const streams = extractStreams(pdfBuffer).map((stream) => {
    try {
      return extractStrings(zlib.inflateSync(stream).toString('latin1'));
    } catch {
      return [];
    }
  });

  const funds = {};
  for (const label of ['PIF2', 'PIF3', 'PIF4']) {
    let bestRows = [];
    for (const tokens of streams) {
      const rows = extractFundRows(tokens, label);
      if (rows.length > bestRows.length) bestRows = rows;
    }
    if (!bestRows.length) {
      throw new Error(`Could not extract ${label} NAV rows from ${latestPdfPath}`);
    }
    funds[label] = bestRows;
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sourcePdfs,
    extractedFrom: latestPdfPath,
    watchlistTickers: ['WAGN'],
    funds,
  };

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, 'pabrai_nav.json'), JSON.stringify(output, null, 2));
  console.log('Wrote data/pabrai_nav.json');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
