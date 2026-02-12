export function loadFromLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveToLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn('Failed to save to localStorage');
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch {
    console.warn('Failed to remove from localStorage');
  }
}