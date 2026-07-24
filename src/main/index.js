/* eslint-disable no-unused-vars */
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ytSearch from 'yt-search'
import youtubedl from 'youtube-dl-exec'
import fs from 'fs'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // --- CONFIGURACIÓN DE LA BASE DE DATOS LOCAL (JSON) ---
  const archivoDatosPath = join(app.getPath('userData'), 'mis_datos_reproductor.json')
  let carpetaDescargasActual = app.getPath('downloads') // Valor por defecto inicial

  // Lógica para cargar el archivo al arrancar
  ipcMain.handle('datos:cargar', () => {
    try {
      if (fs.existsSync(archivoDatosPath)) {
        const datosCrudos = fs.readFileSync(archivoDatosPath, 'utf-8')
        const datosParseados = JSON.parse(datosCrudos)

        // Sincronizamos la variable del backend con la carpeta guardada
        if (datosParseados.carpeta) {
          carpetaDescargasActual = datosParseados.carpeta
        }
        return datosParseados
      }
    } catch (error) {
      console.error('Error leyendo datos:', error)
    }

    // Si no existe el archivo (primera vez que abre la app), devolvemos valores por defecto
    return {
      carpeta: app.getPath('downloads'),
      playlists: { Favoritas: [] }
    }
  })

  // Lógica para guardar/sobrescribir el archivo
  ipcMain.handle('datos:guardar', (event, nuevosDatos) => {
    try {
      fs.writeFileSync(archivoDatosPath, JSON.stringify(nuevosDatos, null, 2))
      carpetaDescargasActual = nuevosDatos.carpeta // Actualizamos el motor de descargas interno
      return true
    } catch (error) {
      console.error('Error guardando datos:', error)
      return false
    }
  })
  // ------------------------------------------------------

  ipcMain.handle('archivo:seleccionarCarpeta', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecciona la carpeta para tu música',
      properties: ['openDirectory']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      carpetaDescargasActual = result.filePaths[0]
    }
    return carpetaDescargasActual
  })

  ipcMain.handle('archivo:obtenerCarpeta', () => {
    return carpetaDescargasActual
  })

  ipcMain.handle('youtube:buscar', async (event, query) => {
    try {
      const resultados = await ytSearch(query)
      const videos = resultados.videos.slice(0, 50)
      return videos.map((video) => ({
        id: video.videoId,
        title: video.title,
        duration: video.timestamp,
        url: video.url,
        thumbnail: video.image
      }))
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return []
    }
  })

  ipcMain.handle('youtube:audio', async (event, url) => {
    try {
      const info = await youtubedl(url, {
        dumpJson: true,
        format: 'bestaudio',
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true
      })
      return info.url
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return null
    }
  })

  ipcMain.handle('youtube:descargar', async (event, { url, titulo }) => {
    try {
      const nombreLimpio = titulo.replace(/[\\/:*?"<>|]/g, '')
      const rutaFinal = join(carpetaDescargasActual, `${nombreLimpio}.mp3`)

      await youtubedl(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: `"${rutaFinal}"`,
        noWarnings: true,
        noCheckCertificate: true,
        noPlaylist: true
      })
      return { exito: true, ruta: rutaFinal }
    } catch (error) {
      return { exito: false, error: error.message }
    }
  })

  ipcMain.handle('archivo:verificar', (event, titulo) => {
    try {
      const nombreLimpio = titulo.replace(/[\\/:*?"<>|]/g, '')
      const rutaFinal = join(carpetaDescargasActual, `${nombreLimpio}.mp3`)
      if (fs.existsSync(rutaFinal)) return rutaFinal
      return null
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return null
    }
  })

  ipcMain.handle('archivo:leerLocal', () => {
    try {
      if (!fs.existsSync(carpetaDescargasActual)) return []
      const archivos = fs.readdirSync(carpetaDescargasActual)
      return archivos
        .filter((archivo) => archivo.endsWith('.mp3'))
        .map((archivo) => {
          return {
            titulo: archivo.replace('.mp3', ''),
            rutaAbsoluta: join(carpetaDescargasActual, archivo)
          }
        })
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return []
    }
  })

  ipcMain.handle('archivo:obtenerTamanioCarpeta', () => {
    try {
      if (!fs.existsSync(carpetaDescargasActual)) return { bytes: 0, formateado: '0 MB' }
      let totalBytes = 0
      const archivos = fs.readdirSync(carpetaDescargasActual)
      for (const archivo of archivos) {
        if (archivo.endsWith('.mp3')) {
          const stats = fs.statSync(join(carpetaDescargasActual, archivo))
          totalBytes += stats.size
        }
      }
      const mb = (totalBytes / (1024 * 1024)).toFixed(2)
      return { bytes: totalBytes, formateado: `${mb} MB` }
    } catch (error) {
      return { bytes: 0, formateado: '0 MB' }
    }
  })

  ipcMain.handle('archivo:eliminar', (event, titulo) => {
    try {
      const nombreLimpio = titulo.replace(/[\\/:*?"<>|]/g, '')
      const rutaFinal = join(carpetaDescargasActual, `${nombreLimpio}.mp3`)
      if (fs.existsSync(rutaFinal)) {
        fs.unlinkSync(rutaFinal)
        return true
      }
      return false
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return false
    }
  })

  ipcMain.handle('ui:confirmar', async (event, mensaje) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Confirmación del Sistema',
      message: mensaje,
      buttons: ['Sí, continuar', 'Cancelar'],
      defaultId: 0,
      cancelId: 1
    })
    return result.response === 0
  })

  // --- NUEVO: MINI-PLAYER FLOTANTE ---
  ipcMain.handle('ui:toggleMiniPlayer', (event, activar) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    if (!mainWindow) return false

    if (activar) {
      mainWindow.setAlwaysOnTop(true, 'floating')
      mainWindow.setSize(350, 600)
      mainWindow.setResizable(false)
    } else {
      mainWindow.setAlwaysOnTop(false)
      mainWindow.setSize(900, 670)
      mainWindow.setResizable(true)
    }
    return true
  })

  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
