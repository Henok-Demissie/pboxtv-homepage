// Helper functions for localStorage operations

export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const saveToStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('storage', { detail: { key, value } }));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

export const removeFromStorage = (key) => {
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('storage', { detail: { key, value: null } }));
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};





