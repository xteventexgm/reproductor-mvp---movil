import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  buscarMusica: (query) => ipcRenderer.invoke('youtube:buscar', query),
  obtenerAudio: (url) => ipcRenderer.invoke('youtube:audio', url),
  descargarMusica: (datos) => ipcRenderer.invoke('youtube:descargar', datos),
  verificarDescarga: (titulo) => ipcRenderer.invoke('archivo:verificar', titulo),
  obtenerMusicaLocal: () => ipcRenderer.invoke('archivo:leerLocal'),
  eliminarArchivo: (titulo) => ipcRenderer.invoke('archivo:eliminar', titulo),
  mostrarConfirmacion: (mensaje) => ipcRenderer.invoke('ui:confirmar', mensaje),
  seleccionarCarpeta: () => ipcRenderer.invoke('archivo:seleccionarCarpeta'),
  obtenerCarpeta: () => ipcRenderer.invoke('archivo:obtenerCarpeta'),
  // NUEVAS RUTAS: Para la memoria persistente
  cargarDatosLocales: () => ipcRenderer.invoke('datos:cargar'),
  guardarDatosLocales: (datos) => ipcRenderer.invoke('datos:guardar', datos)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
