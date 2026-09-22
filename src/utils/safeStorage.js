export const safeStorage = {
    getItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (e) {
            console.warn(`[safeStorage] Error al leer de localStorage la key "${key}":`, e);
        }
        return null;
    },
    setItem: (key, value) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
            }
        } catch (e) {
            console.warn(`[safeStorage] Error al guardar en localStorage la key "${key}":`, e);
        }
    },
    removeItem: (key) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn(`[safeStorage] Error al eliminar de localStorage la key "${key}":`, e);
        }
    }
};
