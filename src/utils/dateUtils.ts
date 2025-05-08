/**
 * Formatează o dată în format românesc (ZZ.LL.AAAA)
 */
export function formatDateRo(date: Date | string | null): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verifică dacă data este validă
  if (isNaN(dateObj.getTime())) return '-';
  
  return `${dateObj.getDate().toString().padStart(2, '0')}.${
    (dateObj.getMonth() + 1).toString().padStart(2, '0')}.${
    dateObj.getFullYear()}`;
}

/**
 * Formatează o dată pentru input type="date" (AAAA-LL-ZZ)
 */
export function formatDateForInput(date: Date | string | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verifică dacă data este validă
  if (isNaN(dateObj.getTime())) return '';
  
  return `${dateObj.getFullYear()}-${
    (dateObj.getMonth() + 1).toString().padStart(2, '0')}-${
    dateObj.getDate().toString().padStart(2, '0')}`;
}

/**
 * Calculează diferența în zile între două date
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const date1Obj = typeof date1 === 'string' ? new Date(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? new Date(date2) : date2;
  
  // Verifică dacă ambele date sunt valide
  if (isNaN(date1Obj.getTime()) || isNaN(date2Obj.getTime())) {
    throw new Error('Date invalide');
  }
  
  // Elimină componenta de timp pentru a calcula doar diferența în zile
  const utc1 = Date.UTC(date1Obj.getFullYear(), date1Obj.getMonth(), date1Obj.getDate());
  const utc2 = Date.UTC(date2Obj.getFullYear(), date2Obj.getMonth(), date2Obj.getDate());
  
  // Convertește milisecunde în zile
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Verifică dacă o dată este între două date
 */
export function isDateBetween(
  date: Date | string, 
  startDate: Date | string, 
  endDate: Date | string
): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endDateObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Verifică dacă toate datele sunt valide
  if (
    isNaN(dateObj.getTime()) || 
    isNaN(startDateObj.getTime()) || 
    isNaN(endDateObj.getTime())
  ) {
    return false;
  }
  
  // Elimină componenta de timp
  const utcDate = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const utcStart = Date.UTC(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
  const utcEnd = Date.UTC(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
  
  return utcDate >= utcStart && utcDate <= utcEnd;
}

/**
 * Adaugă un număr de zile la o dată
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  
  dateObj.setDate(dateObj.getDate() + days);
  
  return dateObj;
}

/**
 * Obține anul curent
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Obține prima zi din luna curentă
 */
export function getFirstDayOfCurrentMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Obține ultima zi din luna curentă
 */
export function getLastDayOfCurrentMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}