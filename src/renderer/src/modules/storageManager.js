// src/renderer/src/modules/storageManager.js

export function initStorageManager(callbacks) {
  const lblSize = document.getElementById('lblStorageSize')
  const btnClean = document.getElementById('btnLimpiarStorage')
  
  if (!lblSize || !btnClean) return {}
  
  async function updateSize() {
    if (window.api && window.api.obtenerTamanioCarpeta) {
      const size = await window.api.obtenerTamanioCarpeta()
      lblSize.innerText = size.formateado
    }
  }
  
  btnClean.addEventListener('click', async () => {
    if (!window.api) return
    const sure = await window.api.mostrarConfirmacion('¿Deseas buscar y borrar archivos de canciones descargadas que ya no estén en ninguna de tus playlists?')
    if (!sure) return
    
    btnClean.innerHTML = '<i class="ph-bold ph-spinner"></i> Limpiando...'
    
    try {
      const allLocal = await window.api.obtenerMusicaLocal() 
      const playlists = callbacks.getPlaylists()
      
      const inUse = new Set()
      for (const key in playlists) {
        for (const track of playlists[key]) {
          inUse.add(track.titulo.replace(/[\\/:*?"<>|]/g, '')) 
        }
      }
      
      let deletedCount = 0
      for (const localTrack of allLocal) {
        if (!inUse.has(localTrack.titulo)) {
          await window.api.eliminarArchivo(localTrack.titulo)
          deletedCount++
        }
      }
      
      callbacks.onSpaceFreed(`Se liberó espacio eliminando ${deletedCount} canciones sin uso. 🧹`)
      await updateSize()
    } catch(e) {
      console.error(e)
    } finally {
      btnClean.innerHTML = '<i class="ph-bold ph-broom"></i> Borrar Canciones sin Uso'
    }
  })
  
  return { updateSize }
}
