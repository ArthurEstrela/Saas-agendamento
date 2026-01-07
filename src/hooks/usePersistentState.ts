import { useState, useEffect } from 'react';

// Função para obter o valor do localStorage de forma segura
function getStoredValue<T>(key: string, initialValue: T): T {
  // Roda apenas no cliente, para evitar erros no SSR (Server-Side Rendering)
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return initialValue;
  }
}

export function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getStoredValue(key, initialValue);
  });

  useEffect(() => {
      setStoredValue(getStoredValue(key, initialValue));
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}