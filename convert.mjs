/*
 * SCRIPT DE CONVERSIÓN DE EXCEL A JSON (Versión Robusta Multi-Pestaña)
 *
 * CÓMO USAR:
 * 1. (Hecho) Instala 'xlsx' con 'npm install xlsx'.
 * 2. (Hecho) Coloca 'ListaDeProductos.xlsx' en 'public'.
 * 3. (Ajustado) Revisa el array 'SHEET_NAMES_TO_READ' abajo.
 * 4. (Ajustado) Revisa 'COLUMN_MAP' abajo.
 * 5. Ejecuta: node convert.mjs
 */

import { read, utils } from 'xlsx';
// (MODIFICADO) Importamos 'readFile' además de 'writeFile'
import { writeFile, readFile } from 'fs/promises'; 
import { fileURLToPath } from 'url';
import path from 'path';

// Configura las rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_FILE_PATH = path.join(__dirname, 'public', 'ListaDeProductos.xlsx');
const JSON_OUTPUT_PATH = path.join(__dirname, 'public', 'products.json');

// --- (MODIFICADO) Pestañas a leer ---
// Agrega o quita los nombres exactos de las pestañas que quieres leer.
// ¡Respeta mayúsculas, minúsculas, espacios y comas!
const SHEET_NAMES_TO_READ = [
  'DA1'
];

// --- Mapeo de columnas ---
// Asegúrate de que estas columnas existan en TODAS las pestañas que lees.
const COLUMN_MAP = {
  id: 'Producto',       // Usaremos 'Producto' (Código) como ID
  code: 'Producto',
  description: 'Descripcion',
  stock: 'Saldo Actual',
  price: 'P.SUG'
  // Si tienes columnas para Marca o Capacidad, añádelas aquí:
  // brand: 'NombreDeTuColumnaMarca',
  // capacity_desc: 'NombreDeTuColumnaCapacidad',
};

// --- Función de ayuda para encontrar el índice de columna (Sin cambios) ---
function findHeaderIndex(headers, colName) {
  if (!colName) return -1;
  const trimmedColName = colName.trim().toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i] || ''; // Maneja celdas vacías
    if (header.trim().toLowerCase() === trimmedColName) {
      return i; // ¡Encontrado! Retorna el índice (0, 1, 2...)
    }
  }
  return -1; // No encontrado
}


async function convertExcelToJson() {
  try {
    
    // --- (NUEVO) Cargar productos existentes ---
    let existingProducts = [];
    // (MOVIDO) Inicializamos el Map aquí para cargarlo con datos existentes
    const productMap = new Map(); 

    try {
      console.log(`Leyendo JSON existente desde: ${JSON_OUTPUT_PATH}`);
      const existingData = await readFile(JSON_OUTPUT_PATH, 'utf-8');
      existingProducts = JSON.parse(existingData);
      
      if (Array.isArray(existingProducts)) {
        console.log(`Se encontraron ${existingProducts.length} productos existentes.`);
        // (NUEVO) Cargar productos existentes en el Map
        for (const product of existingProducts) {
          if (product.code) {
            productMap.set(product.code, product);
          }
        }
        console.log(`Cargados ${productMap.size} productos existentes en el mapa.`);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('No se encontró "products.json" existente. Se creará uno nuevo.');
      } else {
        console.warn(`Advertencia: No se pudo leer "products.json". ${err.message}`);
      }
    }
    // --- Fin de carga de productos existentes ---


    console.log(`Leyendo archivo Excel desde: ${EXCEL_FILE_PATH}`);
    const workbook = read(EXCEL_FILE_PATH, { type: 'file' });
    console.log('Pestañas disponibles en el archivo:', workbook.SheetNames);

    // Array para guardar solo los productos NUEVOS leídos del excel
    let allMappedData = [];

    // --- (MODIFICADO) Bucle principal ---
    // Itera sobre cada nombre de pestaña que especificaste
    for (const sheetName of SHEET_NAMES_TO_READ) {
      console.log(`\n--- Procesando pestaña: '${sheetName}' ---`);

      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        console.warn(`  -> Advertencia: No se encontró la pestaña '${sheetName}'. Saltando...`);
        continue; // Salta a la siguiente pestaña
      }

      // 1. Convierte la hoja a un arreglo de arreglos
      const dataAsArray = utils.sheet_to_json(worksheet, { header: 1 });

      if (dataAsArray.length < 2) {
        console.warn('  -> Advertencia: La pestaña está vacía o solo tiene encabezados. Saltando...');
        continue;
      }

      // 2. Extrae los encabezados (la primera fila)
      const headers = dataAsArray[0];
      
      // 3. Mapea nuestras columnas a los índices del Excel
      const headerIndexMap = {};
      let foundHeadersCount = 0;
      
      for (const appKey in COLUMN_MAP) {
        const excelColName = COLUMN_MAP[appKey];
        const index = findHeaderIndex(headers, excelColName);
        
        if (index !== -1) {
          headerIndexMap[appKey] = index;
          foundHeadersCount++;
        } else {
          console.warn(`  -> Advertencia: No se encontró la columna '${excelColName}' (para '${appKey}') en esta pestaña.`);
        }
      }

      if (foundHeadersCount === 0) {
        console.error(`  -> Error: No se encontró ninguna columna útil en la pestaña '${sheetName}'. Saltando...`);
        continue;
      }

      // 4. Extrae las filas de datos
      const dataRows = dataAsArray.slice(1);

      // 5. Mapea y limpia los datos
      const mappedData = dataRows.map((row, index) => {
        const newRow = {};
        
        for (const appKey in headerIndexMap) {
          const excelIndex = headerIndexMap[appKey];
          newRow[appKey] = row[excelIndex];
        }

        // Limpieza de precio
        let price = newRow.price || 0;
        if (typeof price === 'string') {
          price = parseFloat(price.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim());
        }
        newRow.price = isNaN(price) ? 0 : price;
        
        // Asigna un ID
        newRow.id = newRow.id || newRow.code || `idx-${sheetName}-${index + 1}`;
        
        // Solo incluye filas que tengan un código y una descripción
        if (!newRow.code || !newRow.description) {
          return null;
        }

        return newRow;
      }).filter(row => row !== null); // Filtra filas nulas

      console.log(`  -> Se encontraron ${mappedData.length} productos válidos.`);
      
      // (NUEVO) Agrega los productos de esta pestaña a la lista total
      allMappedData.push(...mappedData);
    }
    // --- Fin del bucle ---

    console.log(`\n--- Proceso completado ---`);
    console.log(`Total de productos nuevos/actualizados leídos del Excel: ${allMappedData.length}`);

    // --- (MODIFICADO) Deduplicación y Fusión ---
    console.log('Fusionando y deduplicando productos por código...');
    // 'productMap' ya tiene los productos viejos.
    // Ahora agregamos/sobreescribimos con los nuevos.
    for (const product of allMappedData) {
      if (product.code) {
        productMap.set(product.code, product);
      }
    }

    const finalProductList = Array.from(productMap.values());
    console.log(`Total de productos únicos (final): ${finalProductList.length}`);
    
    // Escribe el archivo JSON final
    await writeFile(JSON_OUTPUT_PATH, JSON.stringify(finalProductList, null, 2));

    console.log(`¡Éxito! Archivo JSON actualizado en: ${JSON_OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error durante la conversión:');
    if (error.code === 'ENOENT' && error.path.includes('ListaDeProductos.xlsx')) {
      console.error(`No se pudo encontrar el archivo: ${EXCEL_FILE_PATH}`);
      console.error("Asegúrate de que 'ListaDeProductos.xlsx' esté en la carpeta 'public'.");
    } else {
      console.error(error);
    }
  }
}

convertExcelToJson();