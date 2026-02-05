import * as XLSX from 'xlsx';

export interface SpreadsheetRow {
  term: string;
  definition: string;
}

export interface ParseResult {
  success: boolean;
  data: SpreadsheetRow[];
  error?: string;
}

/**
 * Supported file extensions for spreadsheet import
 */
export const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.ods', '.xlsm'];

/**
 * MIME types for supported spreadsheet formats
 */
export const SUPPORTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
  'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
];

/**
 * Get accept string for file input
 */
export function getAcceptString(): string {
  return [...SUPPORTED_EXTENSIONS, ...SUPPORTED_MIME_TYPES].join(',');
}

/**
 * Parse a spreadsheet file and extract term-definition pairs.
 * Expects the spreadsheet to have:
 * - Column A (or first column): Term
 * - Column B (or second column): Definition
 * 
 * The first row can be a header (will be skipped if it contains "termo", "term", "definição", "definition")
 */
export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ success: false, data: [], error: 'O arquivo está vazio ou não contém planilhas.' });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON (array of arrays)
        const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          resolve({ success: false, data: [], error: 'A planilha está vazia.' });
          return;
        }

        // Check if first row is a header
        const firstRow = jsonData[0];
        const headerKeywords = ['termo', 'term', 'definição', 'definition', 'pergunta', 'resposta', 'question', 'answer'];
        const isHeader = firstRow.some(cell => 
          typeof cell === 'string' && headerKeywords.includes(cell.toLowerCase().trim())
        );

        const startIndex = isHeader ? 1 : 0;
        const rows: SpreadsheetRow[] = [];

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          const term = row[0]?.toString().trim() || '';
          const definition = row[1]?.toString().trim() || '';

          // Only add rows where both term and definition are present
          if (term && definition) {
            rows.push({ term, definition });
          }
        }

        if (rows.length === 0) {
          resolve({ 
            success: false, 
            data: [], 
            error: 'Nenhum par válido encontrado. Certifique-se de que a planilha tem duas colunas (Termo e Definição).' 
          });
          return;
        }

        resolve({ success: true, data: rows });
      } catch (error) {
        console.error('Error parsing spreadsheet:', error);
        resolve({ 
          success: false, 
          data: [], 
          error: 'Erro ao ler o arquivo. Verifique se o formato é válido.' 
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, data: [], error: 'Erro ao ler o arquivo.' });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate file extension
 */
export function isValidSpreadsheetFile(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension);
}
