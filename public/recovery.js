// Script de recuperación para chunks desactualizados tras un nuevo deploy
console.warn("[Deploy Recovery] Chunk desactualizado detectado tras despliegue. Recargando versión más reciente...");

if (typeof window !== 'undefined') {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (let r of regs) r.unregister();
      });
    }

    const lastRecovery = sessionStorage.getItem('last_chunk_recovery');
    const now = Date.now();
    if (!lastRecovery || (now - parseInt(lastRecovery, 10)) > 4000) {
      sessionStorage.setItem('last_chunk_recovery', String(now));
      const url = new URL(window.location.href);
      url.searchParams.set('v', String(now));
      window.location.replace(url.toString());
    }
  } catch (e) {
    window.location.reload();
  }
}

// Export default como componente React válido que retorna null
// Esto evita que React lance el error crítico "Element type is invalid: expected a component but got: undefined"
// permitiendo que la recarga automática ocurra de forma suave y transparente sin mostrar pantallas rojas de error.
export default function ChunkRecoveryPlaceholder() {
  return null;
}
