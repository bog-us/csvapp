// src/services/googleSheetsService.ts
import axios from 'axios';
import { 
  CasaSchimbType, 
  PunctSchimbType, 
  DateFinanciareType, 
  DateAngajatiType 
} from '../types';

// Configurare pentru API
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;
const SHEET_ID = '12eokegJ46GM9nF86wtCgHu2wDSn9OS0GY_qBWeIUekI';

// Cache pentru date
interface CacheItem<T> {
  data: T[];
  timestamp: number;
  version: string; // Pentru a gestiona versiuni ale datelor
}

// Cache pentru a stoca datele
const dataCache: {
  caseSchimb?: CacheItem<CasaSchimbType>;
  puncteSchimb?: CacheItem<PunctSchimbType>;
  dateFinanciare?: CacheItem<DateFinanciareType>;
  dateAngajati?: CacheItem<DateAngajatiType>;
} = {};

// Durata valabilitate cache (în milisecunde) - 5 minute
const CACHE_TTL = 5 * 60 * 1000;

// Structură pentru gestionarea versiunilor și diffsync
interface SyncMetadata {
  sheetId: string;
  lastSyncTimestamp: number;
  etag: string;
  rowCount: number;
  columnCount: number;
}

// Cache pentru a stoca metadatele de sincronizare
const syncMetadata: Record<string, SyncMetadata> = {};

// Functie pentru a verifica dacă cache-ul este valid
const isCacheValid = <T>(cache?: CacheItem<T>): boolean => {
  if (!cache) return false;
  
  const now = Date.now();
  return now - cache.timestamp < CACHE_TTL;
};

// Implementăm un mecanism de retry pentru a gestiona erorile API
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error: any) {
      lastError = error;
      
      // Verifică dacă eroarea este cauzată de rate limiting (429)
      if (error.response && error.response.status === 429) {
        // Așteptăm mai mult timp pentru rate limiting
        await new Promise(resolve => setTimeout(resolve, delay * 2));
      } else {
        // Pentru alte erori, așteptăm doar intervalul standard
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Crescăm timpul de așteptare exponențial
      delay *= 2;
    }
  }
  
  throw lastError;
}

// Funcția de fetch pentru o foaie specifică
async function fetchSheetData<T>(sheetName: string, range: string): Promise<T[]> {
  try {
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!${range}`,
      {
        params: {
          key: API_KEY,
          valueRenderOption: 'UNFORMATTED_VALUE',
          dateTimeRenderOption: 'FORMATTED_STRING'
        }
      }
    );

    // Extrage headerele (prima linie)
    const headers = response.data.values[0];
    
    // Transformă datele în obiecte
    const data = response.data.values.slice(1).map((row: any[]) => {
      const item: Record<string, any> = {};
      
      // Asociază fiecare valoare cu headerul corespunzător
      headers.forEach((header: string, index: number) => {
        item[header] = row[index];
      });
      
      return item as T;
    });

    return data;
  } catch (error) {
    console.error(`Eroare la încărcarea datelor din sheet-ul ${sheetName}:`, error);
    throw error;
  }
}

// Funcție pentru a obține ultima modificare a sheet-ului
async function getSheetLastModified(sheetName: string): Promise<string> {
  try {
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`,
      {
        params: {
          key: API_KEY,
          fields: 'sheets.properties'
        }
      }
    );

    const sheets = response.data.sheets;
    const targetSheet = sheets.find((sheet: any) => 
      sheet.properties.title === sheetName
    );
    
    if (targetSheet) {
      return targetSheet.properties.updated || '';
    }
    
    return '';
  } catch (error) {
    console.error('Eroare la obținerea informațiilor despre ultima modificare:', error);
    return '';
  }
}

// Funcție pentru a obține diferențele între actualizări
function getDiff<T>(oldData: T[], newData: T[], idField: keyof T): {
  added: T[],
  updated: T[],
  removed: T[]
} {
  const oldMap = new Map(oldData.map(item => [item[idField], item]));
  const newMap = new Map(newData.map(item => [item[idField], item]));
  
  const added: T[] = [];
  const updated: T[] = [];
  const removed: T[] = [];
  
  // Identifică elementele adăugate și actualizate
  newData.forEach(item => {
    const id = item[idField];
    if (!oldMap.has(id)) {
      added.push(item);
    } else {
      // Verifică dacă a fost actualizat
      const oldItem = oldMap.get(id);
      if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
        updated.push(item);
      }
    }
  });
  
  // Identifică elementele eliminate
  oldData.forEach(item => {
    const id = item[idField];
    if (!newMap.has(id)) {
      removed.push(item);
    }
  });
  
  return { added, updated, removed };
}

// Funcție pentru a obține doar rândurile modificate
async function getModifiedRows<T>(
  sheetName: string, 
  range: string,
  lastSync?: SyncMetadata
): Promise<{data: T[], metadata: SyncMetadata}> {
  try {
    // Obține metadatele curente ale sheet-ului
    const metadataResponse = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`,
      {
        params: {
          key: API_KEY,
          fields: 'sheets.properties,etag'
        }
      }
    );
    
    const sheetInfo = metadataResponse.data.sheets.find(
      (sheet: any) => sheet.properties.title === sheetName
    );
    
    const currentMetadata: SyncMetadata = {
      sheetId: sheetInfo.properties.sheetId,
      lastSyncTimestamp: Date.now(),
      etag: metadataResponse.data.etag,
      rowCount: sheetInfo.properties.gridProperties.rowCount,
      columnCount: sheetInfo.properties.gridProperties.columnCount
    };
    
    // Verifică dacă au existat modificări bazate pe etag
    if (lastSync && lastSync.etag === currentMetadata.etag) {
      // Nu au existat modificări, returnează un rezultat gol
      return {
        data: [] as T[],
        metadata: currentMetadata
      };
    }
    
    // Obține toate datele pentru a compara
    const newData = await fetchSheetData<T>(sheetName, range);
    
    // Dacă nu există un sync anterior, returnează toate datele
    if (!lastSync) {
      return {
        data: newData,
        metadata: currentMetadata
      };
    }
    
    // Dacă numărul de rânduri s-a modificat semnificativ sau avem un etag nou,
    // este mai eficient să returnăm toate datele noi
    const rowCountDiff = Math.abs(currentMetadata.rowCount - lastSync.rowCount);
    if (rowCountDiff > 10 || currentMetadata.etag !== lastSync.etag) {
      return {
        data: newData,
        metadata: currentMetadata
      };
    }
    
    // Altfel, încercăm să obținem doar rândurile modificate
    // Implementare mai complexă, care ar necesita accesul la datele anterioare
    // Pentru simplicitate, returnăm toate datele
    return {
      data: newData,
      metadata: currentMetadata
    };
  } catch (error) {
    console.error(`Eroare la obținerea rândurilor modificate pentru ${sheetName}:`, error);
    throw error;
  }
}

// Funcțiile pentru a obține date din fiecare sheet
async function getCaseSchimb(): Promise<CasaSchimbType[]> {
  // Verifică dacă există date valide în cache
  if (isCacheValid(dataCache.caseSchimb)) {
    return dataCache.caseSchimb!.data;
  }
  
  try {
    const data = await fetchWithRetry(() => 
      fetchSheetData<CasaSchimbType>('CaseSchimb', 'A1:Z1000')
    );
    
    // Actualizează cache-ul
    dataCache.caseSchimb = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    return data;
  } catch (error) {
    console.error('Eroare la obținerea datelor despre case de schimb:', error);
    // Returnează cache-ul expirat dacă există, altfel un array gol
    return dataCache.caseSchimb?.data || [];
  }
}

async function getPuncteSchimb(): Promise<PunctSchimbType[]> {
  // Verifică dacă există date valide în cache
  if (isCacheValid(dataCache.puncteSchimb)) {
    return dataCache.puncteSchimb!.data;
  }
  
  try {
    const data = await fetchWithRetry(() => 
      fetchSheetData<PunctSchimbType>('PuncteSchimb', 'A1:Z5000')
    );
    
    // Actualizează cache-ul
    dataCache.puncteSchimb = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    return data;
  } catch (error) {
    console.error('Eroare la obținerea datelor despre puncte de schimb:', error);
    // Returnează cache-ul expirat dacă există, altfel un array gol
    return dataCache.puncteSchimb?.data || [];
  }
}

async function getDateFinanciare(): Promise<DateFinanciareType[]> {
  // Verifică dacă există date valide în cache
  if (isCacheValid(dataCache.dateFinanciare)) {
    return dataCache.dateFinanciare!.data;
  }
  
  try {
    const data = await fetchWithRetry(() => 
      fetchSheetData<DateFinanciareType>('DateFinanciare', 'A1:Z3000')
    );
    
    // Actualizează cache-ul
    dataCache.dateFinanciare = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    return data;
  } catch (error) {
    console.error('Eroare la obținerea datelor financiare:', error);
    // Returnează cache-ul expirat dacă există, altfel un array gol
    return dataCache.dateFinanciare?.data || [];
  }
}

async function getDateAngajati(): Promise<DateAngajatiType[]> {
  // Verifică dacă există date valide în cache
  if (isCacheValid(dataCache.dateAngajati)) {
    return dataCache.dateAngajati!.data;
  }
  
  try {
    const data = await fetchWithRetry(() => 
      fetchSheetData<DateAngajatiType>('DateAngajati', 'A1:Z2000')
    );
    
    // Actualizează cache-ul
    dataCache.dateAngajati = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    return data;
  } catch (error) {
    console.error('Eroare la obținerea datelor despre angajați:', error);
    // Returnează cache-ul expirat dacă există, altfel un array gol
    return dataCache.dateAngajati?.data || [];
  }
}

// Funcție pentru a invalida cache-ul și a forța reîmprospătarea datelor
function invalidateCache(sheetType?: keyof typeof dataCache): void {
  if (sheetType) {
    // Invalidează doar cache-ul pentru tipul specificat
    if (dataCache[sheetType]) {
      delete dataCache[sheetType];
    }
  } else {
    // Invalidează tot cache-ul
    Object.keys(dataCache).forEach(key => {
      delete dataCache[key as keyof typeof dataCache];
    });
  }
}

// Funcție pentru a configura polling pentru actualizări
function setupPolling(
  intervalMinutes: number = 5,
  onDataUpdated?: () => void
): () => void {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Funcție pentru a verifica actualizări
  const checkForUpdates = async () => {
    try {
      // Verifică modificări pentru fiecare sheet
      const sheets = ['CaseSchimb', 'PuncteSchimb', 'DateFinanciare', 'DateAngajati'];
      let hasUpdates = false;
      
      for (const sheet of sheets) {
        const lastModified = await getSheetLastModified(sheet);
        const cacheKey = sheet.toLowerCase() as keyof typeof dataCache;
        
        if (dataCache[cacheKey]?.version !== lastModified) {
          // Marchează că există actualizări
          hasUpdates = true;
          break;
        }
      }
      
      if (hasUpdates && onDataUpdated) {
        // Invalidează cache-ul și notifică despre actualizări
        invalidateCache();
        onDataUpdated();
      }
    } catch (error) {
      console.error('Eroare în timpul verificării actualizărilor:', error);
    }
  };
  
  // Configurează interval pentru verificare
  const intervalId = setInterval(checkForUpdates, intervalMs);
  
  // Returnează o funcție pentru a opri polling-ul
  return () => clearInterval(intervalId);
}

// Exportă interfața serviciului
const GoogleSheetsService = {
  getCaseSchimb,
  getPuncteSchimb,
  getDateFinanciare,
  getDateAngajati,
  invalidateCache,
  setupPolling
};

export default GoogleSheetsService;
