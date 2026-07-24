/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import '../../../src/styles.css'
import { Preferences } from '@capacitor/preferences'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { MediaSession } from '@capgo/capacitor-media-session'
import { App } from '@capacitor/app'
import { initCarMode } from './modules/carMode.js'
import { initStorageManager } from './modules/storageManager.js'
import { initRecommendations } from './modules/recommendations.js'

// --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
const vistaBusqueda = document.getElementById('vista-busqueda')
const vistaBiblioteca = document.getElementById('vista-biblioteca')
const vistaPerfil = document.getElementById('vista-perfil')
const btnCrearBackup = document.getElementById('btnCrearBackup')
const inputRestaurarBackup = document.getElementById('inputRestaurarBackup')
const btnRestaurarBackupUI = document.getElementById('btnRestaurarBackupUI')
const btnTabBuscar = document.getElementById('btn-tab-buscar')
const btnTabBiblioteca = document.getElementById('btn-tab-biblioteca')
const btnTabPerfil = document.getElementById('btn-tab-perfil')

const inputLinkCancion = document.getElementById('inputLinkCancion')
const btnImportarCancion = document.getElementById('btnImportarCancion')
const inputLinkPlaylist = document.getElementById('inputLinkPlaylist')
const btnImportarMix = document.getElementById('btnImportarMix')

const inputBusqueda = document.getElementById('inputBusqueda')
const btnBuscar = document.getElementById('btnBuscar')
const listaBusqueda = document.getElementById('listaBusqueda')

const reproductor = document.getElementById('reproductor')
const textoReproductor = document.getElementById('textoReproductor')
const btnPlayPause = document.getElementById('btnPlayPause')
const btnAnterior = document.getElementById('btnAnterior')
const btnSiguiente = document.getElementById('btnSiguiente')
const btnAleatorio = document.getElementById('btnAleatorio')
const barraProgreso = document.getElementById('barraProgreso')
const tiempoActual = document.getElementById('tiempoActual')
const tiempoTotal = document.getElementById('tiempoTotal')

const inputNuevaPlaylist = document.getElementById('inputNuevaPlaylist')
const btnCrearPlaylist = document.getElementById('btnCrearPlaylist')
const contenedorPlaylists = document.getElementById('contenedorPlaylists')

// Elementos de la Nueva Vista (Master-Detail)
const vistaPlaylistDetalle = document.getElementById('vista-playlist-detalle')
const btnVolverBiblioteca = document.getElementById('btnVolverBiblioteca')
const tituloPlaylistDetalle = document.getElementById('tituloPlaylistDetalle')
const controlesPlaylistDetalle = document.getElementById('controlesPlaylistDetalle')
const listaPlaylistDetalle = document.getElementById('listaPlaylistDetalle')

// Elementos del Reproductor Fullscreen
const vistaReproductorFull = document.getElementById('vista-reproductor')
const btnCerrarReproductor = document.getElementById('btnCerrarReproductor')
const imgDiscoFull = document.getElementById('imgDiscoFull')
const tituloFull = document.getElementById('tituloFull')
const artistaFull = document.getElementById('artistaFull')
const tiempoActualFull = document.getElementById('tiempoActualFull')
const tiempoTotalFull = document.getElementById('tiempoTotalFull')
const barraProgresoFull = document.getElementById('barraProgresoFull')
const btnPlayPauseFull = document.getElementById('btnPlayPauseFull')
const btnAnteriorFull = document.getElementById('btnAnteriorFull')
const btnSiguienteFull = document.getElementById('btnSiguienteFull')
const opcionesFullContainer = document.getElementById('opcionesFullContainer')
const btnAleatorioFull = document.getElementById('btnAleatorioFull')

const inicioBusqueda = document.getElementById('inicioBusqueda')
const contenedorRecientes = document.getElementById('contenedorRecientes')
const btnLimpiarRecientes = document.getElementById('btnLimpiarRecientes')

const btnVerColaFull = document.getElementById('btnVerColaFull')
const panelColaFull = document.getElementById('panelColaFull')
const btnCerrarColaFull = document.getElementById('btnCerrarColaFull')
const listaColaFull = document.getElementById('listaColaFull')

const getNombreSeguroThumb = (titulo) => titulo.replace(/[\\/:*?"<>|]/g, '') + '_thumb.jpg'

// 1. Tu arsenal de llaves de RapidAPI
const rapidApiKeys = [
  '2dd1b04385msh1bc56d17543f5e5p1b84a0jsn4fc3c347c60c',
  '6c86310b16mshb70def43c1f5742p1e208fjsn44350803e21',
  '38922b1fcbmshf564bafab7c7fe3p1c0b5djsn8053c1f76a5',
  'edc0e2b0e3msha7e6d26938d2acfp10432cjsn78b51c5f8b30',
  '9f85584960msha701e1cedb5919cp1622acjsn80c0f3ccc86e',
  '63a6a44f0dmshc719d6f250cee76p1a1d68jsn36406a186236'
]

// 2. El rastreador de la llave actual
let indiceLlaveActual = 0

// --- 2. ESTADO GLOBAL ---
let colaDeReproduccion = []
let indiceCancionActual = 0
let misPlaylists = {}
let carpetaGuardada = ''
let modoAleatorio = false
let poolAleatorio = []
let cursorAleatorio = 0
let listaGlobalActual = []
let appYaInicializada = false
let descargasActivas = {}

// --- 3. CEREBRO MÓVIL (API y Archivos) ---
const getNombreSeguro = (titulo) => titulo.replace(/[\\/:*?"<>|]/g, '') + '.mp3'

const apiMovil = {
  obtenerMusicaLocal: async () => {
    try {
      const result = await Filesystem.readdir({ path: 'MiMusicaMVP', directory: Directory.Data })
      return result.files
        .filter((f) => f.name.endsWith('.mp3'))
        .map((f) => ({
          titulo: f.name.replace('.mp3', ''),
          rutaAbsoluta: f.name
        }))
    } catch (error) {
      return []
    }
  },

  obtenerTamanioCarpeta: async () => {
    try {
      const result = await Filesystem.readdir({ path: 'MiMusicaMVP', directory: Directory.Data })
      let totalBytes = 0
      for (const file of result.files) {
        if (file.name.endsWith('.mp3') && file.size) {
          totalBytes += file.size
        }
      }
      const mb = (totalBytes / (1024 * 1024)).toFixed(2)
      return { bytes: totalBytes, formateado: `${mb} MB` }
    } catch (e) {
      return { bytes: 0, formateado: '0 MB' }
    }
  },

  verificarThumbnail: async (titulo) => {
    try {
      const thumbName = getNombreSeguroThumb(titulo)
      await Filesystem.stat({ path: `MiMusicaMVP/${thumbName}`, directory: Directory.Data })
      const fileUri = await Filesystem.getUri({
        path: `MiMusicaMVP/${thumbName}`,
        directory: Directory.Data
      })
      return window.Capacitor ? window.Capacitor.convertFileSrc(fileUri.uri) : fileUri.uri
    } catch (error) {
      return null // No hay miniatura guardada localmente
    }
  },

  verificarDescarga: async (titulo) => {
    try {
      const fileName = getNombreSeguro(titulo)
      await Filesystem.stat({ path: `MiMusicaMVP/${fileName}`, directory: Directory.Data })
      const fileUri = await Filesystem.getUri({
        path: `MiMusicaMVP/${fileName}`,
        directory: Directory.Data
      })
      return window.Capacitor ? window.Capacitor.convertFileSrc(fileUri.uri) : fileUri.uri
    } catch (error) {
      return null
    }
  },

  eliminarArchivo: async (titulo) => {
    try {
      const fileName = getNombreSeguro(titulo)
      const thumbName = getNombreSeguroThumb(titulo)

      // Borramos el audio
      await Filesystem.deleteFile({ path: `MiMusicaMVP/${fileName}`, directory: Directory.Data })

      // Borramos la miniatura si existe (en bloque try interno para evitar caídas si no tiene)
      try {
        await Filesystem.deleteFile({ path: `MiMusicaMVP/${thumbName}`, directory: Directory.Data })
      } catch (e) {
        console.log('No había miniatura física que borrar.')
      }

      return true
    } catch (error) {
      return false
    }
  },

  buscarMusica: async (query) => {
    try {
      const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U'
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
      const searchRes = await fetch(searchUrl)
      if (!searchRes.ok) throw new Error('Error en búsqueda')
      const searchData = await searchRes.json()

      if (searchData.items.length === 0) return []

      const videoIds = searchData.items.map((item) => item.id.videoId).join(',')
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
      const detailsRes = await fetch(detailsUrl)
      const detailsData = await detailsRes.json()

      const mapaDuraciones = {}
      if (detailsData.items) {
        detailsData.items.forEach((video) => {
          mapaDuraciones[video.id] = convertirDuracionYouTube(video.contentDetails.duration)
        })
      }

      return searchData.items.map((video) => ({
        id: video.id.videoId,
        title: video.snippet.title
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&'),
        duration: mapaDuraciones[video.id.videoId] || '0:00',
        url: `https://youtube.com/watch?v=${video.id.videoId}`,
        thumbnail: video.snippet.thumbnails.high.url
      }))
    } catch (error) {
      console.error(error)
      return []
    }
  },

  // 3. La función de extracción
  obtenerAudio: async (urlYoutube) => {
    try {
      // Extracción limpia del ID del video
      let videoId = ''
      const u = new URL(urlYoutube)
      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1)
      } else {
        videoId = u.searchParams.get('v')
      }

      if (!videoId) throw new Error('URL inválida')

      // Bucle de Supervivencia (Rotación Automática)
      for (let i = 0; i < rapidApiKeys.length; i++) {
        const llaveActiva = rapidApiKeys[indiceLlaveActual]

        try {
          // Usamos fetch() que es el estándar de navegadores/frontend
          const res = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': llaveActiva,
              'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
          })

          // Si el límite se alcanzó (429) o la llave está bloqueada (403)
          if (res.status === 429 || res.status === 403) {
            console.warn(
              `[Rotación] Llave ${indiceLlaveActual + 1} agotada. Saltando a la siguiente...`
            )
            indiceLlaveActual = (indiceLlaveActual + 1) % rapidApiKeys.length // Cambia a la siguiente llave
            continue // Vuelve a iniciar el bucle con la llave nueva
          }

          if (!res.ok) throw new Error(`Error HTTP: ${res.status}`)

          const data = await res.json()

          // OJO: La mayoría de APIs de RapidAPI devuelven la URL en una propiedad llamada 'link' o 'url'.
          // Validamos cuál de las dos viene en la respuesta.
          const enlaceAudio = data.link || data.url || (data.data ? data.data.url : null)

          if (enlaceAudio) {
            console.log('¡Audio obtenido con éxito de RapidAPI!')
            return enlaceAudio
          } else {
            throw new Error('La API respondió pero no se encontró la propiedad del enlace.')
          }
        } catch (error) {
          console.error(
            `[Intento Fallido] Error con la llave ${indiceLlaveActual + 1}:`,
            error.message
          )
          // Cambiamos de llave en caso de que el fallo sea culpa de la API
          indiceLlaveActual = (indiceLlaveActual + 1) % rapidApiKeys.length
        }
      }

      console.error('Todas las API Keys se han agotado o están fallando.')
      return null
    } catch (error) {
      console.error('Error al formatear el enlace:', error)
      return null
    }
  },

  descargarMusica: async ({ url, titulo, thumbnail }) => {
    try {
      const urlDirecta = await apiMovil.obtenerAudio(url)
      if (!urlDirecta) throw new Error('Sin enlace')

      // 1. Descargamos el archivo MP3
      const fileName = getNombreSeguro(titulo)
      await Filesystem.downloadFile({
        url: urlDirecta,
        path: `MiMusicaMVP/${fileName}`,
        directory: Directory.Data
      })

      // 2. NUEVO: Si tiene URL de imagen, la guardamos en local
      if (thumbnail && thumbnail.startsWith('http')) {
        const thumbName = getNombreSeguroThumb(titulo)
        try {
          await Filesystem.downloadFile({
            url: thumbnail,
            path: `MiMusicaMVP/${thumbName}`,
            directory: Directory.Data
          })
          console.log('Miniatura guardada localmente de forma segura.')
        } catch (errThumb) {
          console.error('No se pudo cachear la miniatura:', errThumb.message)
        }
      }

      return { exito: true, ruta: `MiMusicaMVP/${fileName}` }
    } catch (error) {
      return { exito: false, error: error.message }
    }
  },

  mostrarConfirmacion: async (mensaje) => confirm(mensaje),

  // --- NUEVO: Descarga una miniatura suelta para canciones viejas ---
  descargarThumbnailSuelto: async (titulo, urlThumbnail) => {
    if (!urlThumbnail || !urlThumbnail.startsWith('http')) return null
    try {
      const thumbName = getNombreSeguroThumb(titulo)
      await Filesystem.downloadFile({
        url: urlThumbnail,
        path: `MiMusicaMVP/${thumbName}`,
        directory: Directory.Data
      })
      const fileUri = await Filesystem.getUri({
        path: `MiMusicaMVP/${thumbName}`,
        directory: Directory.Data
      })
      return window.Capacitor ? window.Capacitor.convertFileSrc(fileUri.uri) : fileUri.uri
    } catch (e) {
      console.error('Error en auto-recuperación de miniatura:', e.message)
      return null
    }
  },

  // --- NUEVO: Obtener detalles de un video específico por su ID ---
  obtenerDetallesVideoPorId: async (videoId) => {
    try {
      const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U'
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
      const res = await fetch(url)
      const data = await res.json()

      if (!data.items || data.items.length === 0) return null

      const video = data.items[0]
      return {
        id: video.id,
        title: video.snippet.title
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&'),
        duration: convertirDuracionYouTube(video.contentDetails.duration),
        url: `https://youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url
      }
    } catch (e) {
      console.error(e)
      return null
    }
  },

  // --- NUEVO: Obtener el título oficial de una Playlist de YouTube ---
  obtenerNombrePlaylistYouTube: async (playlistId) => {
    try {
      const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U'
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      return data.items?.[0]?.snippet?.title || 'Mix Importado'
    } catch (e) {
      return 'Mix Importado'
    }
  },

  // --- NUEVO: Traer todas las canciones de una Playlist de YouTube ---
  obtenerVideosDePlaylist: async (playlistId) => {
    try {
      const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U'
      // Traemos las primeras 50 canciones (límite de la API por petición)
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`
      const res = await fetch(url)
      const data = await res.json()

      if (!data.items || data.items.length === 0) return []

      // Mapeamos los IDs de los videos para consultar sus duraciones en lote
      const videoIds = data.items.map((item) => item.contentDetails.videoId).join(',')
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
      const detailsRes = await fetch(detailsUrl)
      const detailsData = await detailsRes.json()

      const mapaDuraciones = {}
      if (detailsData.items) {
        detailsData.items.forEach((v) => {
          mapaDuraciones[v.id] = convertirDuracionYouTube(v.contentDetails.duration)
        })
      }

      return data.items.map((item) => {
        const vId = item.contentDetails.videoId
        return {
          tipo: 'online',
          titulo: item.snippet.title
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&'),
          urlYoutube: `https://youtube.com/watch?v=${vId}`,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          duracion: mapaDuraciones[vId] || '0:00'
        }
      })
    } catch (e) {
      console.error(e)
      return []
    }
  },

  // --- NUEVO: Traer detalles de múltiples videos a la vez (Para el Lector QR) ---
  obtenerDetallesVideosEnLote: async (ids) => {
    try {
      const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U'
      // La API de YouTube permite pedir hasta 50 videos a la vez separados por comas
      const loteIds = ids.slice(0, 50).join(',')
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${loteIds}&key=${API_KEY}`
      const res = await fetch(url)
      const data = await res.json()

      if (!data.items) return []

      return data.items.map((video) => ({
        tipo: 'online',
        titulo: video.snippet.title
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&'),
        duracion: convertirDuracionYouTube(video.contentDetails.duration),
        urlYoutube: `https://youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url
      }))
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

if (typeof window.api === 'undefined') window.api = apiMovil

// --- LÓGICA DEL BOTÓN FÍSICO ATRÁS (CON SEGURO DE DESCARGAS) ---
let tiempoUltimoBack = 0
App.addListener('backButton', async () => {
  // 1. Cerrar reproductor fullscreen
  if (!vistaReproductorFull.classList.contains('cerrado')) {
    vistaReproductorFull.classList.add('cerrado')
    return
  }
  // 2. Volver de los detalles de la playlist a la biblioteca
  if (vistaPlaylistDetalle && !vistaPlaylistDetalle.classList.contains('vista-oculta')) {
    btnVolverBiblioteca.click()
    return
  }
  // 3. Volver de la biblioteca a la búsqueda
  if (!vistaBiblioteca.classList.contains('vista-oculta')) {
    vistaBiblioteca.classList.replace('vista-activa', 'vista-oculta')
    vistaBusqueda.classList.replace('vista-oculta', 'vista-activa')
    document.getElementById('btn-tab-biblioteca').classList.remove('tab-activo')
    document.getElementById('btn-tab-buscar').classList.add('tab-activo')
    return
  }

  // --- 4. INTENTO DE SALIDA DE LA APP ---
  const hayDescargasActivas = Object.keys(descargasActivas).length > 0
  const tiempoActual = new Date().getTime()

  if (tiempoActual - tiempoUltimoBack < 2000) {
    // Si presiona 2 veces rápido y hay descargas, frenamos en seco
    if (hayDescargasActivas) {
      const salir = await window.api.mostrarConfirmacion(
        '⚠️ Tienes descargas en progreso. Si sales de la aplicación se cancelarán. ¿Estás seguro de que deseas salir?'
      )
      if (salir) {
        App.exitApp()
      }
    } else {
      // Si no hay descargas, salimos normal
      App.exitApp()
    }
  } else {
    // Primer toque del botón atrás
    tiempoUltimoBack = tiempoActual
    if (hayDescargasActivas) {
      mostrarToast('⚠️ Descargando... Presiona ATRÁS de nuevo para forzar salida')
    } else {
      mostrarToast('Presiona ATRÁS de nuevo para salir')
    }
  }
})

// --- SISTEMA DE TOAST ---
function mostrarToast(mensaje) {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
  }
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.innerText = mensaje
  container.appendChild(toast)
  setTimeout(() => toast.classList.add('show'), 10)
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}

let busquedasRecientes = []

function guardarBusquedaReciente(texto) {
  if (!texto) return

  busquedasRecientes = busquedasRecientes.filter((b) => b.toLowerCase() !== texto.toLowerCase())

  busquedasRecientes.unshift(texto)

  if (busquedasRecientes.length > 8) {
    busquedasRecientes.pop()
  }

  renderizarRecientes()

  /* ===== VOLVER A PANTALLA INICIAL ===== */

  inputBusqueda.addEventListener('input', () => {
    const texto = inputBusqueda.value.trim()

    if (texto === '') {
      inicioBusqueda.style.display = 'block'
      listaBusqueda.innerHTML = ''
    }
  })

  guardarProgreso()
}

function renderizarRecientes() {
  contenedorRecientes.innerHTML = ''

  if (busquedasRecientes.length === 0) {
    contenedorRecientes.innerHTML = `
      <p style="color:#777; padding-left:5px;">
        No hay búsquedas recientes
      </p>
    `
    return
  }

  busquedasRecientes.forEach((texto) => {
    const btn = document.createElement('div')

    btn.className = 'reciente-item'
    btn.innerHTML = `
  <span><i class="ph ph-magnifying-glass"></i> ${texto}</span>
  <span class="eliminar-reciente"><i class="ph-bold ph-x"></i></span>
`
    btn.addEventListener('click', () => {
      inputBusqueda.value = texto
      btnBuscar.click()
    })

    const btnEliminar = btn.querySelector('.eliminar-reciente')

    btnEliminar.addEventListener('click', async (e) => {
      e.stopPropagation()

      busquedasRecientes = busquedasRecientes.filter((b) => b !== texto)

      await guardarProgreso()

      renderizarRecientes()

      mostrarToast('Eliminado del historial')
    })

    contenedorRecientes.appendChild(btn)
  })
}

// --- 4. FUNCIONES AUXILIARES ---
function duracionASegundos(str) {
  if (!str) return 0
  const partes = str.split(':').map(Number)
  if (partes.length === 2) return partes[0] * 60 + partes[1]
  if (partes.length === 3) return partes[0] * 3600 + partes[1] * 60 + partes[2]
  return 0
}

function formatearTiempoTotal(segundos) {
  const hrs = Math.floor(segundos / 3600)
  const mins = Math.floor((segundos % 3600) / 60)
  const secs = segundos % 60
  if (hrs > 0) return `${hrs} h ${mins} min`
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function formatearTiempo(segundos) {
  if (isNaN(segundos)) return '0:00'
  const min = Math.floor(segundos / 60)
  const sec = Math.floor(segundos % 60)
  return `${min}:${sec < 10 ? '0' : ''}${sec}`
}

function convertirDuracionYouTube(isoDuration) {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  const horas = parseInt(match[1]) || 0
  const minutos = parseInt(match[2]) || 0
  const segundos = parseInt(match[3]) || 0
  if (horas > 0)
    return `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
}

// Botón de Volver de la Pestaña de Playlist
btnVolverBiblioteca.addEventListener('click', () => {
  vistaPlaylistDetalle.classList.replace('vista-activa', 'vista-oculta')
  vistaBiblioteca.classList.replace('vista-oculta', 'vista-activa')
})

// --- 5. CONTROLES DEL REPRODUCTOR MAESTRO ---
async function conmutarReproduccion() {
  const srcActual = reproductor.getAttribute('src')
  if (!srcActual || srcActual === '') {
    if (colaDeReproduccion.length > 0) {
      textoReproductor.innerText = 'Cargando sesión... ⏳'
      btnPlayPause.innerText = '⏳'
      if (btnPlayPauseFull) btnPlayPauseFull.innerText = '⏳'
      await reproductorCentralControl()
    } else {
      mostrarToast('No hay música en memoria.')
    }
    return
  }
  if (reproductor.paused) reproductor.play().catch((err) => console.error(err))
  else reproductor.pause()
}

btnPlayPause.addEventListener('click', conmutarReproduccion)
btnPlayPauseFull.addEventListener('click', conmutarReproduccion)

reproductor.addEventListener('play', () => {
  btnPlayPause.innerHTML = '<i class="ph-fill ph-pause"></i>'
  btnPlayPauseFull.innerHTML = '<i class="ph-fill ph-pause"></i>'
  imgDiscoFull.style.animationPlayState = 'running'
  if (colaDeReproduccion.length > 0) {
    const cancion = colaDeReproduccion[indiceCancionActual]
    MediaSession.setMetadata({
      title: cancion.titulo || 'Reproductor MVP',
      artist: cancion.tipo === 'online' ? 'Transmisión' : 'Local',
      artwork: [
        {
          src: cancion.thumbnail || 'https://cdn-icons-png.flaticon.com/512/26/26307.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    })
    MediaSession.setPlaybackState({ playbackState: 'playing' })
  }
  setTimeout(sincronizarTiempoNotificacion, 500)
})

reproductor.addEventListener('pause', () => {
  btnPlayPause.innerHTML = '<i class="ph-fill ph-play"></i>'
  btnPlayPauseFull.innerHTML = '<i class="ph-fill ph-play"></i>'
  imgDiscoFull.style.animationPlayState = 'paused'
  MediaSession.setPlaybackState({ playbackState: 'paused' })
})

function actualizarTiempos() {
  if (reproductor.duration) {
    const porcentaje = (reproductor.currentTime / reproductor.duration) * 100

    barraProgreso.style.setProperty('--progress', `${porcentaje}%`)
    barraProgresoFull.style.setProperty('--progress', `${porcentaje}%`)

    barraProgreso.value = porcentaje
    barraProgresoFull.value = porcentaje
    const actual = formatearTiempo(reproductor.currentTime)
    const total = formatearTiempo(reproductor.duration)
    tiempoActual.innerText = actual
    tiempoActualFull.innerText = actual
    tiempoTotal.innerText = total
    tiempoTotalFull.innerText = total
  }
}

// Este evento es el que hace que se mueva la barra de tu diseño
reproductor.addEventListener('timeupdate', actualizarTiempos)

// --- NUEVO: Sincronizar tiempo con el celular ---
async function sincronizarTiempoNotificacion() {
  if (!isNaN(reproductor.duration)) {
    try {
      await MediaSession.setPositionState({
        duration: reproductor.duration,
        playbackRate: reproductor.playbackRate || 1.0,
        position: reproductor.currentTime
      })
    } catch (e) {
      console.log('Error sincronizando tiempo nativo:', e)
    }
  }
}

// Aseguramos que el tiempo se envíe apenas la canción sepa cuánto dura
reproductor.addEventListener('loadedmetadata', sincronizarTiempoNotificacion)

barraProgreso.addEventListener('input', (e) => {
  if (reproductor.duration) reproductor.currentTime = (e.target.value / 100) * reproductor.duration
  sincronizarTiempoNotificacion()
})
barraProgresoFull.addEventListener('input', (e) => {
  if (reproductor.duration) reproductor.currentTime = (e.target.value / 100) * reproductor.duration
  sincronizarTiempoNotificacion()
})

// --- GENERADOR DE COLA ALEATORIA (Fisher-Yates) ---
function generarOrdenAleatorio(indiceFijo) {
  poolAleatorio = []

  // 1. Llenamos el arreglo con todas las posiciones disponibles, excepto la que ya está sonando
  for (let i = 0; i < colaDeReproduccion.length; i++) {
    if (i !== indiceFijo) poolAleatorio.push(i)
  }

  // 2. Mezclamos los índices de forma aleatoria
  for (let i = poolAleatorio.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[poolAleatorio[i], poolAleatorio[j]] = [poolAleatorio[j], poolAleatorio[i]]
  }

  // 3. Ponemos la canción actual al principio para que el reproductor no salte
  poolAleatorio.unshift(indiceFijo)
  cursorAleatorio = 0 // Empezamos a leer desde el inicio de esta nueva lista
}

// --- LÓGICA DE COLA ---
function avanzarSiguiente() {
  if (colaDeReproduccion.length === 0) return

  if (modoAleatorio) {
    cursorAleatorio++
    if (cursorAleatorio >= poolAleatorio.length) {
      detenerReproductor() // Fin de la lista aleatoria
      return
    }
    indiceCancionActual = poolAleatorio[cursorAleatorio]
  } else {
    indiceCancionActual++
    if (indiceCancionActual >= colaDeReproduccion.length) {
      detenerReproductor() // Fin de la lista normal
      return
    }
  }
  reproductorCentralControl()
}

function retrocederAnterior() {
  if (colaDeReproduccion.length === 0) return

  // Si la canción lleva más de 3 segundos, retroceder la reinicia (Comportamiento estándar UX)
  if (reproductor.currentTime > 3) {
    reproductor.currentTime = 0
  } else {
    if (modoAleatorio) {
      cursorAleatorio = cursorAleatorio > 0 ? cursorAleatorio - 1 : 0
      indiceCancionActual = poolAleatorio[cursorAleatorio]
    } else {
      indiceCancionActual = indiceCancionActual > 0 ? indiceCancionActual - 1 : 0
    }
    reproductorCentralControl()
  }
}

btnSiguiente.addEventListener('click', avanzarSiguiente)
btnSiguienteFull.addEventListener('click', avanzarSiguiente)
btnAnterior.addEventListener('click', retrocederAnterior)
btnAnteriorFull.addEventListener('click', retrocederAnterior)
reproductor.addEventListener('ended', avanzarSiguiente)

MediaSession.setActionHandler({ action: 'play' }, () => reproductor.play())
MediaSession.setActionHandler({ action: 'pause' }, () => reproductor.pause())
MediaSession.setActionHandler({ action: 'nexttrack' }, avanzarSiguiente)
MediaSession.setActionHandler({ action: 'previoustrack' }, retrocederAnterior)

// Habilitar el arrastre en la notificación ---
MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
  // seekTime viene en los detalles del evento nativo
  if (details && details.seekTime !== undefined && reproductor.duration) {
    reproductor.currentTime = details.seekTime

    // Actualizamos visualmente tus barras internas también
    const porcentaje = (details.seekTime / reproductor.duration) * 100
    barraProgreso.style.setProperty('--progress', `${porcentaje}%`)
    barraProgresoFull.style.setProperty('--progress', `${porcentaje}%`)
    barraProgreso.value = porcentaje
    barraProgresoFull.value = porcentaje

    // Volvemos a sincronizar el tiempo real con el celular
    sincronizarTiempoNotificacion()
  }
})

async function guardarProgreso() {
  await Preferences.set({
    key: 'misDatosReproductor',
    value: JSON.stringify({
      carpeta: carpetaGuardada,
      playlists: misPlaylists,
      ultimaCola: colaDeReproduccion,
      ultimoIndice: indiceCancionActual,
      ultimoModoAleatorio: modoAleatorio,
      busquedasRecientes,
      ultimoPool: poolAleatorio,
      ultimoCursor: cursorAleatorio
    })
  })
}

async function reproductorCentralControl() {
  if (colaDeReproduccion.length === 0) return
  if (modoAleatorio && poolAleatorio.length !== colaDeReproduccion.length) {
    generarOrdenAleatorio(indiceCancionActual)
  }

  const cancion = colaDeReproduccion[indiceCancionActual]
  const rutaLocal = await window.api.verificarDescarga(cancion.titulo)

  if (rutaLocal) {
    // 1. Prioridad máxima: Reproducir desde el almacenamiento físico
    textoReproductor.innerText = `[${indiceCancionActual + 1}/${colaDeReproduccion.length}] ${cancion.titulo}`
    reproductor.src = rutaLocal
  } else if (cancion.urlYoutube) {
    // 2. Plan B Inteligente: No hay MP3, pero SÍ tenemos el enlace de internet
    if (cancion.tipo === 'offline') {
      // Le avisamos al usuario que estamos usando sus datos
      mostrarToast(`Sin archivo local. Reproduciendo "${cancion.titulo}" desde la nube ☁️`)
      cancion.tipo = 'online' // La convertimos a online para que el vinilo diga "Nube ☁️"
    }

    textoReproductor.innerText = `Conectando... ⏳`
    const urlAudio = await window.api.obtenerAudio(cancion.urlYoutube)
    if (urlAudio) {
      textoReproductor.innerText = `[${indiceCancionActual + 1}/${colaDeReproduccion.length}] ${cancion.titulo}`
      reproductor.src = urlAudio
    } else {
      textoReproductor.innerText = `❌ Error de red. Saltando...`
      avanzarSiguiente()
      return
    }
  } else {
    // 3. Plan C (Escudo): No hay MP3 y tampoco hay enlace (Canción irremediablemente perdida)
    mostrarToast(`⚠️ "${cancion.titulo}" ya no existe y no tiene enlace online.`)

    colaDeReproduccion.splice(indiceCancionActual, 1)

    if (colaDeReproduccion.length > 0) {
      if (indiceCancionActual >= colaDeReproduccion.length) {
        indiceCancionActual = 0
      }
      poolAleatorio = []
      await guardarProgreso()
      await reproductorCentralControl()
    } else {
      detenerReproductor()
      await guardarProgreso()
    }
    return
  }

  // --- NUEVO: Inteligencia Offline para Notificaciones ---
  let caratulaFinal = cancion.thumbnail || 'https://cdn-icons-png.flaticon.com/512/26/26307.png'
  try {
    const rutaImgLocal = await window.api.verificarThumbnail(cancion.titulo)
    if (rutaImgLocal) {
      caratulaFinal = rutaImgLocal
    }

  } catch (e) { }

  // Sincronización de metadatos nativos (Capacitor)
  MediaSession.setMetadata({
    title: cancion.titulo,
    artist: cancion.tipo === 'online' ? 'YouTube' : 'Descargado',
    artwork: [
      {
        src: caratulaFinal,
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  })

  reproductor.play().catch((err) => console.error(err))
  await actualizarUIFullscreen()
  await guardarProgreso()
}

function detenerReproductor() {
  reproductor.pause()
  reproductor.src = ''
  colaDeReproduccion = []
  poolAleatorio = []
  indiceCancionActual = 0
  barraProgreso.value = 0
  barraProgresoFull.value = 0
  tiempoActual.innerText = '0:00'
  tiempoActualFull.innerText = '0:00'
  btnPlayPause.innerHTML = '<i class="ph-fill ph-play"></i>'
  btnPlayPauseFull.innerHTML = '<i class="ph-fill ph-play"></i>'
  textoReproductor.innerText = 'No hay música sonando'
  tituloFull.innerText = 'No hay música sonando'
  artistaFull.innerText = '--'
  imgDiscoFull.src = 'https://cdn-icons-png.flaticon.com/512/26/26307.png'
}

// --- CONTROL UNIFICADO Y VISUAL DEL MODO ALEATORIO ---
function sincronizarBotonesAleatorio() {
  if (modoAleatorio) {
    // --- REPRODUCTOR PEQUEÑO (Isla Inferior) ---
    btnAleatorio.classList.add('active')
    btnAleatorio.style.color = 'var(--accent)' // Cambia el icono al color verde acento
    btnAleatorio.style.textShadow = '0 0 8px var(--accent)' // Le da un sutil brillo neón

    // --- REPRODUCTOR FULLSCREEN (Vinilo) ---
    if (btnAleatorioFull) {
      btnAleatorioFull.classList.remove('desactivado')
      btnAleatorioFull.classList.add('activado')
      btnAleatorioFull.style.backgroundColor = 'var(--accent)' // Fondo completamente verde
      btnAleatorioFull.style.color = '#000000' // Icono negro para alto contraste
      btnAleatorioFull.style.boxShadow = '0 0 15px var(--accent)' // Brillo exterior
    }
  } else {
    // --- ESTADO APAGADO (Valores por defecto del tema) ---
    btnAleatorio.classList.remove('active')
    btnAleatorio.style.color = ''
    btnAleatorio.style.textShadow = ''

    if (btnAleatorioFull) {
      btnAleatorioFull.classList.remove('activado')
      btnAleatorioFull.classList.add('desactivado')
      btnAleatorioFull.style.backgroundColor = '' // Restaura el fondo oscuro original
      btnAleatorioFull.style.color = ''
      btnAleatorioFull.style.boxShadow = ''
    }
  }
}

btnAleatorio.addEventListener('click', async () => {
  modoAleatorio = !modoAleatorio

  if (modoAleatorio) {
    generarOrdenAleatorio(indiceCancionActual)
  } else {
    poolAleatorio = []
    cursorAleatorio = 0
  }

  sincronizarBotonesAleatorio()
  mostrarToast(modoAleatorio ? 'Modo aleatorio encendido 🔀' : 'Modo aleatorio apagado ➡️')
  await guardarProgreso()
})
btnAleatorioFull.addEventListener('click', () => btnAleatorio.click())

// --- 6. NAVEGACIÓN INFERIOR ---
function cambiarPestaña(vistaAActivar, botonAActivar) {
  // 1. Ocultamos TODAS las vistas principales
  vistaBusqueda.classList.replace('vista-activa', 'vista-oculta')
  vistaBiblioteca.classList.replace('vista-activa', 'vista-oculta')
  vistaPerfil.classList.replace('vista-activa', 'vista-oculta')

  // También ocultamos la vista de detalles de la playlist por si el usuario estaba ahí adentro
  if (vistaPlaylistDetalle && !vistaPlaylistDetalle.classList.contains('vista-oculta')) {
    vistaPlaylistDetalle.classList.replace('vista-activa', 'vista-oculta')
  }

  // 2. Le quitamos el color/brillo a TODOS los botones
  btnTabBuscar.classList.remove('tab-activo')
  btnTabBiblioteca.classList.remove('tab-activo')
  btnTabPerfil.classList.remove('tab-activo')

  // 3. Activamos SOLO la vista y el botón que el usuario tocó
  vistaAActivar.classList.replace('vista-oculta', 'vista-activa')
  botonAActivar.classList.add('tab-activo')
}

// 4. Conectamos los clics de tu HTML con la función maestra
btnTabBuscar.addEventListener('click', () => cambiarPestaña(vistaBusqueda, btnTabBuscar))
btnTabBiblioteca.addEventListener('click', () => cambiarPestaña(vistaBiblioteca, btnTabBiblioteca))
btnTabPerfil.addEventListener('click', () => {
  cambiarPestaña(vistaPerfil, btnTabPerfil)
  if (storageManager) storageManager.updateSize()
})

// --- 7. RENDERIZADO MAESTRO DE PLAYLISTS (MÁXIMO RENDIMIENTO Y OFFLINE) ---

// Mini-motor para leer el disco duro de 1 solo golpe y no saturar el celular
async function obtenerCacheLocal() {
  try {
    const result = await Filesystem.readdir({ path: 'MiMusicaMVP', directory: Directory.Data })
    const uriRes = await Filesystem.getUri({ path: 'MiMusicaMVP', directory: Directory.Data })
    const baseUrl = window.Capacitor ? window.Capacitor.convertFileSrc(uriRes.uri) : uriRes.uri

    const mp3 = new Set()
    const thumbs = new Set()

    result.files.forEach((f) => {
      const name = f.name || f
      if (name.endsWith('.mp3')) mp3.add(name.replace('.mp3', ''))
      if (name.endsWith('_thumb.jpg')) thumbs.add(name.replace('_thumb.jpg', ''))
    })
    return { mp3, thumbs, baseUrl }

  } catch (e) {
    return { mp3: new Set(), thumbs: new Set(), baseUrl: '' }
  }
}

async function actualizarInterfazPlaylists() {
  contenedorPlaylists.innerHTML = ''

  const tracksLocales = await window.api.obtenerMusicaLocal()
  const limpiarTitulo = (txt = '') =>
    txt
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/official/gi, '')
      .replace(/video/gi, '')
      .replace(/lyrics?/gi, '')
      .replace(/audio/gi, '')
      .replace(/\.mp3/gi, '')
      .replace(/[\\/:*?"<>|]/g, '')
      .trim()

  const mapaCanciones = new Map()
  tracksLocales.forEach((t) => {
    if (!t.titulo) return
    const key = limpiarTitulo(t.titulo)
    mapaCanciones.set(key, {
      tipo: 'offline',
      titulo: t.titulo,
      ruta: t.rutaAbsoluta,
      thumbnail: '',
      duracion: '0:00'
    })
  })

  Object.values(misPlaylists).forEach((playlist) => {
    playlist.forEach((cancion) => {
      if (!cancion.titulo) return
      const key = limpiarTitulo(cancion.titulo)
      if (!mapaCanciones.has(key)) {
        mapaCanciones.set(key, cancion)
      } else {
        const existente = mapaCanciones.get(key)
        if (!existente.thumbnail && cancion.thumbnail) existente.thumbnail = cancion.thumbnail
        if ((!existente.duracion || existente.duracion === '0:00') && cancion.duracion)
          existente.duracion = cancion.duracion
        mapaCanciones.set(key, existente)
      }
    })
  })

  listaGlobalActual = Array.from(mapaCanciones.values())

  // --- BOTÓN "TODAS LAS CANCIONES" ---
  const btnTodas = document.createElement('button')
  btnTodas.innerText = `🌟 Todas las canciones (${listaGlobalActual.length})`
  btnTodas.style.color = 'var(--accent)'
  btnTodas.style.fontWeight = 'bold'

  btnTodas.addEventListener('click', async () => {
    vistaBiblioteca.classList.replace('vista-activa', 'vista-oculta')
    vistaPlaylistDetalle.classList.replace('vista-oculta', 'vista-activa')

    // 1. Cargamos el Caché (1 sola lectura rápida al disco)
    const cacheLocal = await obtenerCacheLocal()

    let segundosTotales = 0
    listaGlobalActual.forEach((track) => {
      segundosTotales += duracionASegundos(track.duracion)
    })

    tituloPlaylistDetalle.innerText = `Todas las canciones`
    listaPlaylistDetalle.innerHTML = ''
    controlesPlaylistDetalle.innerHTML = ''

    const metaDatosPl = document.createElement('p')
    metaDatosPl.style.color = 'var(--text-muted)'
    metaDatosPl.style.fontSize = '0.85rem'
    metaDatosPl.innerHTML = `📋 ${listaGlobalActual.length} canciones • ⏱️ ${formatearTiempoTotal(segundosTotales)}`
    controlesPlaylistDetalle.appendChild(metaDatosPl)

    const btnPlayPl = document.createElement('button')
    btnPlayPl.innerText = '▶'
    btnPlayPl.className = 'btn-reproducir-playlist'
    btnPlayPl.style.padding = '10px 20px'
    btnPlayPl.style.marginTop = '10px'
    btnPlayPl.addEventListener('click', () => {
      colaDeReproduccion = [...listaGlobalActual]
      indiceCancionActual = modoAleatorio
        ? Math.floor(Math.random() * colaDeReproduccion.length)
        : 0
      poolAleatorio = []
      reproductorCentralControl()
    })
    controlesPlaylistDetalle.appendChild(btnPlayPl)

    // OPTIMIZACIÓN DE RENDERIZADO: DocumentFragment
    const fragmento = document.createDocumentFragment()

    for (let i = 0; i < listaGlobalActual.length; i++) {
      const track = listaGlobalActual[i]
      const li = document.createElement('li')
      li.className = 'song-item'

      // Lectura instantánea desde memoria (Sin lag y 100% Offline)
      const nombreLimpio = track.titulo.replace(/[\\/:*?"<>|]/g, '')
      const descargada = cacheLocal.mp3.has(nombreLimpio)
      const tieneThumb = cacheLocal.thumbs.has(nombreLimpio)
      const thumbFinal = tieneThumb
        ? `${cacheLocal.baseUrl}/${nombreLimpio}_thumb.jpg`
        : track.thumbnail

      // 1. Extraemos el ID del video mágicamente (si es que existe)
      let videoId = ''
      if (track.urlYoutube) {
        try {
          const u = new URL(track.urlYoutube)
          videoId = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v')
        } catch (e) { }
      }

      // 2. El Doble Escudo (Original -> Servidor Anti-Bloqueos -> Icono Genérico)
      const miniaturaHTML = thumbFinal
        ? `<img src="${thumbFinal}" class="song-thumbnail" alt="Cover" referrerpolicy="no-referrer" 
              onerror="
                if (!this.dataset.tried) { 
                  this.dataset.tried = true; 
                  this.src='https://img.youtube.com/vi/${videoId}/mqdefault.jpg'; 
                } else { 
                  this.src='https://cdn-icons-png.flaticon.com/512/26/26307.png'; 
                }
              ">`
        : `<div class="song-thumbnail" style="display:flex; justify-content:center; align-items:center; background:#333; font-size:1.5rem;">🎵</div>`

      const badge = descargada ? '💾' : '☁️'
      li.innerHTML = `
        <div class="song-info-wrapper">
          ${miniaturaHTML}
          <div class="song-details">
          <span class="song-title">${badge} ${track.titulo}</span>
          <span class="song-meta">${track.duracion || 'Local'}</span>
          </div>
          <button class="btn-play-mini btn-reproducir-global-todas" data-index="${i}">▶</button>
          <button class="btn-opciones">☰</button>
        </div>
        <div class="menu-opciones">
          ${renderOpcionesCombo(track.titulo, track.tipo === 'online' ? track.urlYoutube : track.ruta, track.tipo, '', track.thumbnail, track.duracion)}
        </div>
      `
      fragmento.appendChild(li)
    }
    listaPlaylistDetalle.appendChild(fragmento) // Dibujamos de un solo trazo
  })

  contenedorPlaylists.appendChild(btnTodas)

  // --- PLAYLISTS PERSONALIZADAS ---
  Object.keys(misPlaylists).forEach((nombre) => {
    const btn = document.createElement('button')
    btn.innerText = `📁 ${nombre} (${misPlaylists[nombre].length})`

    btn.addEventListener('click', async () => {
      vistaBiblioteca.classList.replace('vista-activa', 'vista-oculta')
      vistaPlaylistDetalle.classList.replace('vista-oculta', 'vista-activa')

      // 1. Cargamos el Caché
      const cacheLocal = await obtenerCacheLocal()

      let segundosTotales = 0
      misPlaylists[nombre].forEach((track) => {
        segundosTotales += duracionASegundos(track.duracion)
      })

      tituloPlaylistDetalle.innerText = `Playlist: ${nombre}`
      listaPlaylistDetalle.innerHTML = ''
      controlesPlaylistDetalle.innerHTML = ''

      const metaDatosPl = document.createElement('p')
      metaDatosPl.style.color = 'var(--text-muted)'
      metaDatosPl.style.margin = '0 0 15px 0'
      metaDatosPl.style.fontSize = '0.85rem'
      metaDatosPl.innerHTML = `📋 ${misPlaylists[nombre].length} canciones ${segundosTotales > 0 ? `• ⏱️ Tiempo total: ${formatearTiempoTotal(segundosTotales)}` : ''}`
      controlesPlaylistDetalle.appendChild(metaDatosPl)

      const divAccionesPl = document.createElement('div')
      divAccionesPl.style.display = 'flex'
      divAccionesPl.style.gap = '12px'
      divAccionesPl.style.marginBottom = '20px'
      divAccionesPl.style.alignItems = 'center'

      const estiloBotonUniforme = `width: 42px; height: 42px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer; flex-shrink: 0;`

      const btnPlayPl = document.createElement('button')
      btnPlayPl.innerHTML = '▶'
      btnPlayPl.className = 'btn-reproducir-playlist'
      btnPlayPl.style.cssText =
        estiloBotonUniforme + 'background-color: var(--accent); color: black;'

      btnPlayPl.addEventListener('click', () => {
        if (misPlaylists[nombre].length === 0) return mostrarToast('⚠️ La playlist está vacía.')
        colaDeReproduccion = misPlaylists[nombre].map((c) => ({
          tipo: c.tipo,
          titulo: c.titulo,
          urlYoutube: c.urlYoutube || null,
          ruta: c.ruta || null,
          thumbnail: c.thumbnail || null
        }))
        indiceCancionActual = modoAleatorio
          ? Math.floor(Math.random() * colaDeReproduccion.length)
          : 0
        poolAleatorio = []
        reproductorCentralControl()
      })
      divAccionesPl.appendChild(btnPlayPl)

      // --- NUEVO: Botón de Compartir por QR ---
      const btnCompartirQR = document.createElement('button')
      btnCompartirQR.innerHTML = '<i class="ph-bold ph-link"></i>'
      btnCompartirQR.className = 'btn-compartir-playlist'
      btnCompartirQR.style.cssText =
        estiloBotonUniforme + 'background-color: #00bcd4; color: black;'
      btnCompartirQR.title = 'Compartir por QR'
      btnCompartirQR.addEventListener('click', () => {
        generarQR(nombre, misPlaylists[nombre])
      })
      divAccionesPl.appendChild(btnCompartirQR)
      // ----------------------------------------

      const cancionesOnline = misPlaylists[nombre].filter((c) => c.tipo === 'online')

      if (cancionesOnline.length > 0) {
        // Verificación instantánea con caché
        let faltanPorDescargar = false
        for (const track of cancionesOnline) {
          const nombreLimpio = track.titulo.replace(/[\\/:*?"<>|]/g, '')
          if (!cacheLocal.mp3.has(nombreLimpio)) {
            faltanPorDescargar = true
            break
          }
        }

        const btnLote = document.createElement('button')
        btnLote.className = 'btn-descargar-toda-playlist'
        const estadoDescarga = descargasActivas[nombre]

        if (estadoDescarga) {
          btnLote.innerHTML = `⏳ ${estadoDescarga.actual}/${estadoDescarga.total}`
          btnLote.style.cssText =
            estiloBotonUniforme +
            'background-color: #333; color: white; width: auto; padding: 0 15px; border-radius: 20px;'
          btnLote.disabled = true
        } else if (faltanPorDescargar) {
          btnLote.innerHTML = '<i class="ph-bold ph-download-simple"></i>'
          btnLote.style.cssText = estiloBotonUniforme + 'background-color: #333; color: white;'
          btnLote.disabled = false
        } else {
          btnLote.innerHTML = '<i class="ph-bold ph-check-circle"></i>'
          btnLote.style.cssText = estiloBotonUniforme + 'background-color: #4CAF50; color: white;'
          btnLote.disabled = true
        }
        btnLote.addEventListener('click', () => descargarPlaylistPorLotes(nombre))
        divAccionesPl.appendChild(btnLote)

        const btnLimpiarDescargas = document.createElement('button')
        btnLimpiarDescargas.innerHTML = '<i class="ph-bold ph-broom"></i>'
        btnLimpiarDescargas.style.cssText =
          estiloBotonUniforme + 'background-color: #ff9800; color: black;'
        btnLimpiarDescargas.addEventListener('click', async () => {
          const seguro = await window.api.mostrarConfirmacion(
            `¿Deseas borrar los MP3 descargados de "${nombre}" para liberar espacio?`
          )
          if (seguro) {
            btnLimpiarDescargas.innerHTML = '<i class="ph-bold ph-hourglass"></i>'
            let borrados = 0
            for (const track of misPlaylists[nombre]) {
              const nombreLimpio = track.titulo.replace(/[\\/:*?"<>|]/g, '')
              if (cacheLocal.mp3.has(nombreLimpio)) {
                await window.api.eliminarArchivo(track.titulo)
                borrados++
              }
            }
            mostrarToast(`Se liberó el espacio de ${borrados} canciones 🧹`)
            await actualizarInterfazPlaylists()
            refrescarPlaylistActiva()
          }
        })
        divAccionesPl.appendChild(btnLimpiarDescargas)
      }

      const btnEliminarPl = document.createElement('button')
      btnEliminarPl.innerHTML = '<i class="ph-bold ph-trash"></i>'
      btnEliminarPl.className = 'btn-eliminar-playlist'
      btnEliminarPl.style.cssText = estiloBotonUniforme + 'background-color: #d32f2f; color: white;'
      btnEliminarPl.addEventListener('click', async () => {
        const seguro = await window.api.mostrarConfirmacion(
          `¿Seguro que deseas borrar la playlist "${nombre}"?`
        )
        if (seguro) {
          const borrarArchivosFisicos = await window.api.mostrarConfirmacion(
            '¿Deseas eliminar también los MP3 descargados?'
          )
          if (borrarArchivosFisicos) {
            for (const track of misPlaylists[nombre]) await window.api.eliminarArchivo(track.titulo)
          }
          delete misPlaylists[nombre]
          await guardarProgreso()
          await detenerReproductor()
          btnVolverBiblioteca.click()
          await actualizarInterfazPlaylists()
        }
      })
      divAccionesPl.appendChild(btnEliminarPl)
      controlesPlaylistDetalle.appendChild(divAccionesPl)

      if (misPlaylists[nombre].length === 0) {
        listaPlaylistDetalle.innerHTML =
          '<li style="padding:20px; color:var(--text-muted);">Esta lista está vacía.</li>'
        return
      }

      // OPTIMIZACIÓN DE RENDERIZADO: DocumentFragment
      const fragmento = document.createDocumentFragment()

      for (let i = 0; i < misPlaylists[nombre].length; i++) {
        const track = misPlaylists[nombre][i]
        const li = document.createElement('li')
        li.className = 'song-item'

        // Lectura instantánea desde memoria
        const nombreLimpio = track.titulo.replace(/[\\/:*?"<>|]/g, '')
        const descargada = cacheLocal.mp3.has(nombreLimpio)
        const tieneThumb = cacheLocal.thumbs.has(nombreLimpio)
        const thumbFinal = tieneThumb
          ? `${cacheLocal.baseUrl}/${nombreLimpio}_thumb.jpg`
          : track.thumbnail

        let btnBajarHTML = ''
        if (track.tipo === 'online') {
          const titSeguro = track.titulo.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
          const estiloItemOpcion =
            'width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border:none; border-radius:6px; font-weight:bold; font-size:1.1rem; flex-shrink: 0;'

          btnBajarHTML = descargada
            ? `<button class="btn-borrar-descarga" data-titulo="${titSeguro}" style="${estiloItemOpcion} background-color:#ff9800; color:black;"><i class="ph-bold ph-trash"></i></button>`
            : `<button class="btn-descargar" data-url="${track.urlYoutube}" data-titulo="${titSeguro}" style="${estiloItemOpcion} background-color:var(--accent); color:black;"><i class="ph-bold ph-download-simple"></i></button>`
        }

        const comboMover = renderOpcionesCombo(
          track.titulo,
          track.tipo === 'online' ? track.urlYoutube : track.ruta,
          track.tipo,
          nombre,
          track.thumbnail,
          track.duracion
        )

        // 1. Extraemos el ID del video mágicamente (si es que existe)
        let videoId = ''
        if (track.urlYoutube) {
          try {
            const u = new URL(track.urlYoutube)
            videoId = u.hostname.includes('youtu.be')
              ? u.pathname.slice(1)
              : u.searchParams.get('v')

          } catch (e) { }
        }

        // 2. El Doble Escudo (Original -> Servidor Anti-Bloqueos -> Icono Genérico)
        const miniaturaHTML = thumbFinal
          ? `<img src="${thumbFinal}" class="song-thumbnail" alt="Cover" referrerpolicy="no-referrer" 
              onerror="
                if (!this.dataset.tried) { 
                  this.dataset.tried = true; 
                  this.src='https://img.youtube.com/vi/${videoId}/mqdefault.jpg'; 
                } else { 
                  this.src='https://cdn-icons-png.flaticon.com/512/26/26307.png'; 
                }
              ">`
          : `<div class="song-thumbnail" style="display:flex; justify-content:center; align-items:center; background:#333; font-size:1.5rem;">🎵</div>`
        const badge = descargada ? '💾' : '☁️'

        li.innerHTML = `
          <div class="song-info-wrapper">
            ${miniaturaHTML}
            <div class="song-details">
              <span class="song-title">${badge} ${track.titulo}</span>
              <span class="song-meta">${track.duracion || 'Local'}</span>
            </div>
            <button class="btn-play-mini btn-reproducir-playlist" data-playlist="${nombre}" data-index="${i}">▶</button>
            <button class="btn-opciones">☰</button>
          </div>
          <div class="menu-opciones">
            ${btnBajarHTML}
            ${comboMover}
            
            <button class="btn-compartir-cancion" data-titulo="${track.titulo.replace(/"/g, '&quot;')}" data-url="${track.urlYoutube}" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border:none; border-radius:6px; background-color:#00bcd4; color:black; font-weight:bold; font-size:1.1rem; flex-shrink: 0;" title="Compartir canción">🔗</button>
            
            <button class="btn-quitar-cancion" data-playlist="${nombre}" data-index="${i}" data-titulo="${track.titulo.replace(/"/g, '&quot;')}" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; border:none; border-radius:6px; background-color:#d32f2f; color:white; font-size:1.1rem; flex-shrink: 0;" title="Quitar de playlist">❌</button>
          </div>
        `
        fragmento.appendChild(li)
      }
      listaPlaylistDetalle.appendChild(fragmento) // Dibujamos de un solo trazo
    })
    contenedorPlaylists.appendChild(btn)
  })
}
// --- NUEVO: AUTO-REFRESCO DE PANTALLA ---
function refrescarPlaylistActiva() {
  if (vistaPlaylistDetalle.classList.contains('vista-activa')) {
    const tituloActual = tituloPlaylistDetalle.innerText

    // Si estamos viendo la lista global
    if (tituloActual === 'Todas las canciones') {
      const btnTodas = Array.from(contenedorPlaylists.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Todas las canciones')
      )
      if (btnTodas) btnTodas.click()
    }
    // Si estamos viendo una playlist personalizada
    else if (tituloActual.startsWith('Playlist: ')) {
      const nombrePl = tituloActual.replace('Playlist: ', '').trim()
      const btnPl = Array.from(contenedorPlaylists.querySelectorAll('button')).find((b) =>
        b.innerText.includes(`📁 ${nombrePl}`)
      )
      if (btnPl) btnPl.click()
    }
  }
}

// --- DESCARGA EN LOTE ---
async function descargarPlaylistPorLotes(nombrePlaylist) {
  // Evitar doble clic si ya se está descargando esta playlist
  if (descargasActivas[nombrePlaylist]) return

  const pendientes = misPlaylists[nombrePlaylist].filter((c) => c.tipo === 'online')
  if (pendientes.length === 0) return

  let aDescargar = []
  for (const cancion of pendientes) {
    const descargada = await window.api.verificarDescarga(cancion.titulo)
    if (!descargada) aDescargar.push(cancion)
  }

  if (aDescargar.length === 0) {
    mostrarToast('Todo ya estaba descargado.')
    await actualizarInterfazPlaylists()
    refrescarPlaylistActiva()
    return
  }

  // 1. Registramos el inicio en el Monitor Global
  descargasActivas[nombrePlaylist] = { actual: 0, total: aDescargar.length }
  mostrarToast(`Descargando ${aDescargar.length} canciones de "${nombrePlaylist}"... 🚀`)

  // Función interna para buscar el botón y actualizarlo solo si el usuario lo está mirando
  const actualizarBotonDescargaUI = () => {
    if (
      vistaPlaylistDetalle.classList.contains('vista-activa') &&
      tituloPlaylistDetalle.innerText === `Playlist: ${nombrePlaylist}`
    ) {
      const btnLote = controlesPlaylistDetalle.querySelector('.btn-descargar-toda-playlist')
      if (btnLote && descargasActivas[nombrePlaylist]) {
        const info = descargasActivas[nombrePlaylist]
        btnLote.disabled = true
        btnLote.style.width = 'auto'
        btnLote.style.padding = '0 15px'
        btnLote.style.borderRadius = '20px'
        btnLote.innerHTML = `⏳ ${info.actual}/${info.total}`
      }
    }
  }

  actualizarBotonDescargaUI() // Dibuja el 0/X inicial

  // 2. Bucle de descarga
  for (let i = 0; i < aDescargar.length; i++) {
    const cancion = aDescargar[i]

    // Sumamos 1 al progreso global
    descargasActivas[nombrePlaylist].actual = i + 1
    actualizarBotonDescargaUI() // Refresca el botón visualmente

    await window.api.descargarMusica({
      url: cancion.urlYoutube,
      titulo: cancion.titulo,
      thumbnail: cancion.thumbnail
    })
  }

  // 3. Limpiamos el monitor al terminar
  delete descargasActivas[nombrePlaylist]

  mostrarToast(`✓ Descarga de "${nombrePlaylist}" completada.`)
  await actualizarInterfazPlaylists()
  refrescarPlaylistActiva()
}
// --- GESTIÓN DE PLAYLIST Y COMBOBOX ---
btnCrearPlaylist.addEventListener('click', async () => {
  const nombre = inputNuevaPlaylist.value.trim()
  if (!nombre) return
  if (!misPlaylists[nombre]) {
    misPlaylists[nombre] = []
    inputNuevaPlaylist.value = ''
    await guardarProgreso()
    await actualizarInterfazPlaylists()
    actualizarTodosLosCombobox()
  }
})

function renderOpcionesCombo(
  tit,
  ident,
  origen,
  playlistActual = '',
  thumbnail = '',
  duracion = ''
) {
  const safeTit = tit.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  const safeId = ident ? ident.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : ''

  const textoBoton = playlistActual ? '⚙️ Opciones' : '➕ Guardar'

  // CORRECCIÓN: Cambiamos data-id por data-url para unificar criterios en toda la app
  return `<button class="btn-gestionar-cancion" 
            data-origen="${playlistActual}" 
            data-titulo="${safeTit}" 
            data-url="${safeId}" 
            data-tipo="${origen}" 
            data-thumbnail="${thumbnail}" 
            data-duracion="${duracion}"
            style="padding: 8px 12px; background: #222; border: 1px solid #444; border-radius: 6px; color: white; cursor: pointer; font-size: 0.9rem;">
            ${textoBoton}
          </button>`
}

function actualizarTodosLosCombobox() {
  document.querySelectorAll('.select-agregar-playlist').forEach((sel) => {
    const playlistActual = sel.getAttribute('data-origen-playlist') || ''
    let opcionesHTML = ''

    if (!playlistActual) {
      opcionesHTML += `<option value="">➕ Guardar en...</option>`
      Object.keys(misPlaylists).forEach((n) => {
        opcionesHTML += `<option value="copiar|${n}">${n}</option>`
      })
    } else {
      opcionesHTML += `<option value="">⚙️ Acción...</option>`
      opcionesHTML += `<optgroup label="Copiar a...">`
      Object.keys(misPlaylists).forEach((n) => {
        if (n !== playlistActual) opcionesHTML += `<option value="copiar|${n}">${n}</option>`
      })
      opcionesHTML += `</optgroup>`
      opcionesHTML += `<optgroup label="Mover a...">`
      Object.keys(misPlaylists).forEach((n) => {
        if (n !== playlistActual) opcionesHTML += `<option value="mover|${n}">${n}</option>`
      })
      opcionesHTML += `</optgroup>`
    }
    sel.innerHTML = opcionesHTML
  })
}

// --- BÚSQUEDA Y MANEJADORES DE CLICS (Funciones Tradicionales a prueba de errores) ---
btnBuscar.addEventListener('click', async () => {
  const query = inputBusqueda.value.trim()

  if (!navigator.onLine) {
    mostrarToast('No puedes buscar sin internet 📡, conectate a una red, o busca en tu biblioteca.')
    return
  }

  if (!query) return
  guardarBusquedaReciente(query)
  inicioBusqueda.style.display = 'none'
  listaBusqueda.innerHTML =
    '<li style="padding:20px; color:var(--text-muted);">Consultando servidores...</li>'

  const data = await window.api.buscarMusica(query)
  listaBusqueda.innerHTML = ''

  if (data.length === 0) {
    listaBusqueda.innerHTML = '<li style="padding:20px;">No se encontraron resultados.</li>'
    return
  }

  for (const video of data) {
    const enDisco = await window.api.verificarDescarga(video.title)
    const safeTitle = video.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;')

    let actionBtn = enDisco
      ? `<button disabled style="background-color:#1e3c20; color:#4CAF50; border:none; padding:8px 12px; border-radius:4px;">[✓]</button>`
      : `<button class="btn-descargar" data-url="${video.url}" data-titulo="${safeTitle}" data-thumbnail="${video.thumbnail}" style="background-color:var(--accent); color:black; border:none; padding:8px 12px; border-radius:4px; font-weight:bold;">⬇️</button>`

    // Pasamos de forma consistente url, thumbnail y duracion
    const combo = renderOpcionesCombo(
      video.title,
      video.url,
      'online',
      '',
      video.thumbnail,
      video.duration
    )
    const badge = enDisco ? '💾' : '☁️'
    const miniaturaHTML = video.thumbnail
      ? `<img src="${video.thumbnail}" class="song-thumbnail" alt="Cover" referrerpolicy="no-referrer" onerror="this.src='https://cdn-icons-png.flaticon.com/512/26/26307.png'">`
      : `<div class="song-thumbnail" style="display:flex; justify-content:center; align-items:center; background:#333; font-size:1.5rem;">🎵</div>`

    const li = document.createElement('li')
    li.className = 'song-item'
    li.innerHTML = `
      <div class="song-info-wrapper">
        ${miniaturaHTML}
        <div class="song-details">
          <span class="song-title">${badge} ${video.title}</span>
          <span class="song-meta">${video.duration}</span>
        </div>
        <button class="btn-play-mini btn-reproducir" data-url="${video.url}" data-titulo="${safeTitle}" data-thumbnail="${video.thumbnail}">▶</button>
        <button class="btn-opciones">☰</button>
      </div> 
      <div class="menu-opciones">
        ${actionBtn}
        ${combo}
      </div>
    `
    listaBusqueda.appendChild(li)
  }
})

document.addEventListener('click', (e) => {
  const tocoBotonOpciones = e.target.closest('.btn-opciones')
  const tocoMenuAdentro = e.target.closest('.menu-opciones')
  if (!tocoBotonOpciones && !tocoMenuAdentro) {
    document
      .querySelectorAll('.menu-opciones.mostrar')
      .forEach((menu) => menu.classList.remove('mostrar'))
  }
})

async function controladoresManejador(e) {
  const target = e.target
  if (target.closest('button')) {
    document.activeElement.blur()
  }
  if (target.classList.contains('btn-opciones')) {
    const menuActual = target.closest('.song-item').querySelector('.menu-opciones')
    document.querySelectorAll('.menu-opciones.mostrar').forEach((menu) => {
      if (menu !== menuActual) menu.classList.remove('mostrar')
    })
    menuActual.classList.toggle('mostrar')
    return
  }

  // REPRODUCIR CANCIÓN INDIVIDUAL
  if (target.classList.contains('btn-reproducir')) {
    colaDeReproduccion = [
      {
        tipo: 'online',
        titulo: target.getAttribute('data-titulo'),
        urlYoutube: target.getAttribute('data-url'),
        thumbnail: target.getAttribute('data-thumbnail')
      }
    ]
    indiceCancionActual = 0
    poolAleatorio = []
    await reproductorCentralControl()
    return
  }

  // DESCARGAR CANCIÓN INDIVIDUAL
  if (target.classList.contains('btn-descargar')) {
    target.innerHTML = '⏳'
    target.disabled = true
    const res = await window.api.descargarMusica({
      url: target.getAttribute('data-url'),
      titulo: target.getAttribute('data-titulo'),
      thumbnail: target.getAttribute('data-thumbnail')
    })

    if (res.exito) {
      mostrarToast('Archivo descargado 💾')
      await actualizarInterfazPlaylists()
      refrescarPlaylistActiva()
      await actualizarUIFullscreen()
      if (panelColaFull.classList.contains('panel-cola-visible')) {
        renderizarColaFull()
      }
    } else {
      target.innerText = 'Error'
      target.disabled = false
    }
    return
  }

  // COMPARTIR CANCIÓN INDIVIDUAL
  if (target.classList.contains('btn-compartir-cancion')) {
    const url = target.getAttribute('data-url')
    const tituloRaw = target.getAttribute('data-titulo')

    if (!url || url === 'null' || url === 'undefined') {
      mostrarToast(
        '❌ Esta canción es puramente local, no tiene enlace de internet para compartir.'
      )
      return
    }

    const tituloLimpio = tituloRaw.replace(/"/g, '"')

    generarQR(tituloLimpio, [
      {
        tipo: 'online',
        urlYoutube: url
      }
    ])
    return
  }

  // --- CONTROLADOR: GESTIONAR CANCIÓN (CORREGIDO PARA LEER DATA-URL Y TRABAJAR ONLINE) ---
  if (target.classList.contains('btn-gestionar-cancion')) {
    const pOrigen = target.getAttribute('data-origen')
    const tit = target.getAttribute('data-titulo').replace(/"/g, '"')
    const iden = target.getAttribute('data-url') // <-- CORRECCIÓN CLAVE: Lee data-url de forma uniforme
    const tipo = target.getAttribute('data-tipo')
    const thumb = target.getAttribute('data-thumbnail') || ''
    const dur = target.getAttribute('data-duracion') || '0:00'

    const resultado = await abrirModalGestionCancion(pOrigen, tit)

    if (!resultado) return

    const { accion, destino } = resultado

    if (!misPlaylists[destino]) {
      misPlaylists[destino] = []
    }

    if (
      !misPlaylists[destino].some(
        (c) =>
          (tipo === 'online' && c.urlYoutube === iden) || (tipo === 'offline' && c.ruta === iden)
      )
    ) {
      if (tipo === 'online') {
        misPlaylists[destino].push({
          tipo: 'online',
          titulo: tit,
          urlYoutube: iden,
          thumbnail: thumb,
          duracion: dur
        })
      } else {
        misPlaylists[destino].push({
          tipo: 'offline',
          titulo: tit,
          ruta: iden,
          thumbnail: thumb,
          duracion: dur
        })
      }

      if (accion === 'mover' && pOrigen) {
        const idx = misPlaylists[pOrigen].findIndex(
          (c) =>
            (tipo === 'online' && c.urlYoutube === iden) || (tipo === 'offline' && c.ruta === iden)
        )
        if (idx !== -1) misPlaylists[pOrigen].splice(idx, 1)
      }

      await guardarProgreso()

      let textoAccion = ''
      if (accion === 'mover') {
        textoAccion = 'Movida'
      } else if (!pOrigen) {
        textoAccion = 'Agregada'
      } else {
        textoAccion = 'Copiada'
      }
      mostrarToast(`✓ ${textoAccion} a ${destino}`)

      await actualizarInterfazPlaylists()

      if (pOrigen) {
        const btnPl = Array.from(contenedorPlaylists.querySelectorAll('button')).find((b) =>
          b.innerText.includes(`📁 ${pOrigen}`)
        )
        if (btnPl) btnPl.click()
      }
    } else {
      mostrarToast(`⚠️ Esta canción ya existe en ${destino}`)
    }
    return
  }

  // ELIMINAR MP3 LOCAL
  if (target.classList.contains('btn-borrar-descarga')) {
    const titulo = target.getAttribute('data-titulo')
    const seguro = await window.api.mostrarConfirmacion(
      `¿Borrar el MP3 de "${titulo.replace(/"/g, '"')}" para liberar espacio? (Seguirá en tu lista)`
    )

    if (seguro) {
      target.innerHTML = '⏳'
      await window.api.eliminarArchivo(titulo)
      mostrarToast('Archivo eliminado 🗑️')
      await actualizarInterfazPlaylists()
      refrescarPlaylistActiva()
      await actualizarUIFullscreen()
      if (panelColaFull.classList.contains('panel-cola-visible')) {
        renderizarColaFull()
      }
    }
    return
  }

  if (target.classList.contains('btn-reproducir-local')) {
    const path = target.getAttribute('data-ruta')
    colaDeReproduccion = Array.from(document.querySelectorAll('.btn-reproducir-local')).map(
      (b) => ({
        tipo: 'offline',
        titulo: b.getAttribute('data-titulo'),
        ruta: b.getAttribute('data-ruta')
      })
    )
    indiceCancionActual = colaDeReproduccion.findIndex((c) => c.ruta === path)
    poolAleatorio = modoAleatorio ? [indiceCancionActual] : []
    await reproductorCentralControl()
    return
  }

  if (target.classList.contains('btn-reproducir-playlist')) {
    const pName = target.getAttribute('data-playlist')
    if (pName) {
      colaDeReproduccion = misPlaylists[pName].map((c) => ({
        tipo: c.tipo,
        titulo: c.titulo,
        urlYoutube: c.urlYoutube || null,
        ruta: c.ruta || null,
        thumbnail: c.thumbnail || null
      }))
      indiceCancionActual = parseInt(target.getAttribute('data-index'))
      poolAleatorio = modoAleatorio ? [indiceCancionActual] : []
      await reproductorCentralControl()
    }
    return
  }

  if (target.classList.contains('btn-reproducir-global-todas')) {
    colaDeReproduccion = [...listaGlobalActual]
    indiceCancionActual = parseInt(target.getAttribute('data-index'))
    poolAleatorio = modoAleatorio ? [indiceCancionActual] : []
    await reproductorCentralControl()
    return
  }

  if (target.classList.contains('btn-quitar-cancion')) {
    const pName = target.getAttribute('data-playlist')
    const trackTitulo = target.getAttribute('data-titulo').replace(/"/g, '"')
    const index = parseInt(target.getAttribute('data-index'))

    const confirmarQuitar = await window.api.mostrarConfirmacion(
      `¿Quitar "${trackTitulo}" de la playlist?`
    )

    if (!confirmarQuitar) return

    const existeEnDisco = await window.api.verificarDescarga(trackTitulo)

    if (existeEnDisco) {
      const borrarArchivo = await window.api.mostrarConfirmacion(
        `Esta canción está descargada. ¿Deseas eliminar también el MP3 para liberar espacio?`
      )
      if (borrarArchivo) {
        await window.api.eliminarArchivo(trackTitulo)
        mostrarToast('Archivo eliminado 🗑️')
      }
    }

    misPlaylists[pName].splice(index, 1)
    await guardarProgreso()

    if (
      colaDeReproduccion[indiceCancionActual] &&
      colaDeReproduccion[indiceCancionActual].titulo === trackTitulo
    ) {
      detenerReproductor()
    }

    await actualizarInterfazPlaylists()
    refrescarPlaylistActiva()
  }
}

// --- MANEJADORES DE CLICS (ASEGÚRATE DE QUE SOLO ESTÉN ESTOS) ---
listaBusqueda.addEventListener('click', controladoresManejador)
listaPlaylistDetalle.addEventListener('click', controladoresManejador) // Esta sí existe
opcionesFullContainer.addEventListener('click', controladoresManejador)

// --- SCRIPT DE MIGRACIÓN Y ARRANQUE ---
async function repararDuracionesAntiguas() {
  let idsParaArreglar = []
  let cancionesReferencia = []
  Object.keys(misPlaylists).forEach((nombrePl) => {
    misPlaylists[nombrePl].forEach((cancion) => {
      if (
        cancion.tipo === 'online' &&
        (!cancion.duracion || cancion.duracion.includes('YouTube') || cancion.duracion === '0:00')
      ) {
        const videoId = cancion.urlYoutube.split('v=')[1]?.split('&')[0]
        if (videoId) {
          idsParaArreglar.push(videoId)
          cancionesReferencia.push(cancion)
        }
      }
    })
  })

  if (idsParaArreglar.length === 0) return
  try {
    const API_KEY = 'AIzaSyCg19z6JcQGpRHAXkIv65pHKT5dZfwFX4U'
    for (let i = 0; i < idsParaArreglar.length; i += 50) {
      const loteIds = idsParaArreglar.slice(i, i + 50).join(',')
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${loteIds}&key=${API_KEY}`
      )
      const data = await res.json()
      const mapaDuraciones = {}
      if (data.items)
        data.items.forEach((v) => {
          mapaDuraciones[v.id] = convertirDuracionYouTube(v.contentDetails.duration)
        })
      cancionesReferencia.forEach((c) => {
        const vId = c.urlYoutube.split('v=')[1]?.split('&')[0]
        if (mapaDuraciones[vId]) c.duracion = mapaDuraciones[vId]
      })
    }
    await guardarProgreso()
    await actualizarInterfazPlaylists()
  } catch (error) {
    console.error('Error reparando duraciones:', error)
  }
}

async function inicializarApp() {
  if (appYaInicializada) return
  appYaInicializada = true

  try {
    const { value } = await Preferences.get({ key: 'misDatosReproductor' })
    if (value) {
      const datosGuardados = JSON.parse(value)
      carpetaGuardada = datosGuardados.carpeta || ''
      misPlaylists = datosGuardados.playlists || {}

      if (datosGuardados.ultimaCola && datosGuardados.ultimaCola.length > 0) {
        colaDeReproduccion = datosGuardados.ultimaCola
        indiceCancionActual = datosGuardados.ultimoIndice || 0
        modoAleatorio = datosGuardados.ultimoModoAleatorio || false
        busquedasRecientes = datosGuardados.busquedasRecientes || []

        poolAleatorio = datosGuardados.ultimoPool || []
        cursorAleatorio = datosGuardados.ultimoCursor || 0

        const cancion = colaDeReproduccion[indiceCancionActual]
        if (cancion) {
          textoReproductor.innerText = `Pausado: ${cancion.titulo}`
          tituloFull.innerText = cancion.titulo
          artistaFull.innerText = cancion.tipo === 'online' ? 'Nube ☁️' : 'Local 💾'
          imgDiscoFull.src =
            cancion.thumbnail || 'https://cdn-icons-png.flaticon.com/512/26/26307.png'
        }
        if (modoAleatorio) sincronizarBotonesAleatorio()
      }
    }
    await actualizarInterfazPlaylists()
    await repararDuracionesAntiguas()
    await renderizarRecientes()
  } catch (error) {
    console.error('Error de inicio:', error)
  }
}

inicializarApp()

// --- REPRODUCTOR FULLSCREEN ---
textoReproductor.parentElement.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON' && colaDeReproduccion.length > 0) {
    vistaReproductorFull.classList.remove('cerrado')
  }
})

btnCerrarReproductor.addEventListener('click', () => vistaReproductorFull.classList.add('cerrado'))

async function actualizarUIFullscreen() {
  if (colaDeReproduccion.length === 0) return
  const cancion = colaDeReproduccion[indiceCancionActual]

  // 1. Verificación física real
  const enDisco = await window.api.verificarDescarga(cancion.titulo)

  tituloFull.innerText = cancion.titulo
  // Inteligencia: Si está en el disco o era offline desde el inicio, es Local
  artistaFull.innerText = enDisco || cancion.tipo === 'offline' ? 'Local 💾' : 'Nube ☁️'

  // 2. Motor de Miniatura Local
  let rutaImagenLocal = await window.api.verificarThumbnail(cancion.titulo)
  if (!rutaImagenLocal && navigator.onLine && cancion.thumbnail) {
    const nuevaRuta = await window.api.descargarThumbnailSuelto(cancion.titulo, cancion.thumbnail)
    if (nuevaRuta) rutaImagenLocal = nuevaRuta
  }
  const caratulaFinal =
    rutaImagenLocal || cancion.thumbnail || 'https://cdn-icons-png.flaticon.com/512/26/26307.png'
  imgDiscoFull.src = caratulaFinal

  // 3. Diseño Uniforme de Botones (Círculos perfectos)
  const safeTitle = cancion.titulo.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  const estiloBtnRound =
    'width: 48px; height: 48px; padding: 0; display: flex; align-items: center; justify-content: center; border: none; border-radius: 50%; font-size: 1.4rem; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.4); flex-shrink:0; transition: transform 0.2s;'

  let actionBtn = ''
  if (cancion.tipo === 'online') {
    actionBtn = enDisco
      ? `<button class="btn-borrar-descarga" data-titulo="${safeTitle}" style="${estiloBtnRound} background-color: #ff9800; color: black;" title="Borrar MP3">🗑️</button>`
      : `<button class="btn-descargar" data-url="${cancion.urlYoutube || ''}" data-titulo="${safeTitle}" data-thumbnail="${cancion.thumbnail || ''}" style="${estiloBtnRound} background-color: var(--accent); color: black;">⬇️</button>`
  }

  // 4. Renderizamos el combo nativo
  const combo = renderOpcionesCombo(
    cancion.titulo,
    cancion.tipo === 'online' ? cancion.urlYoutube : cancion.ruta,
    cancion.tipo,
    '',
    cancion.thumbnail,
    cancion.duracion
  )

  // 5. Inyección con layout moderno y limpio
  opcionesFullContainer.innerHTML = `
    <div style="display: flex; gap: 15px; width: 100%; align-items: center; justify-content: center; margin-top: 15px; padding: 0 10px;">
      ${actionBtn}
      <div style="flex: 1; max-width: 250px;">
        ${combo}
      </div>
    </div>
  `

  // Magia CSS para que el selector de listas se vea premium en pantalla completa
  const selectElement = opcionesFullContainer.querySelector('select')
  if (selectElement) {
    selectElement.style.width = '100%'
    selectElement.style.padding = '12px 15px'
    selectElement.style.borderRadius = '25px'
    selectElement.style.backgroundColor = '#1a1a1a'
    selectElement.style.color = 'var(--text)'
    selectElement.style.border = '2px solid #333'
    selectElement.style.outline = 'none'
    selectElement.style.fontSize = '0.95rem'
    selectElement.style.fontWeight = 'bold'
    selectElement.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)'
  }
}
/* ===== CHIPS RAPIDAS ===== */

document.querySelectorAll('.chip-busqueda').forEach((chip) => {
  chip.addEventListener('click', () => {
    inputBusqueda.value = chip.innerText
    btnBuscar.click()
  })
})

renderizarRecientes()

btnLimpiarRecientes.addEventListener('click', async () => {
  busquedasRecientes = []

  await guardarProgreso()

  renderizarRecientes()

  mostrarToast('Historial eliminado')
})

// ENTER para buscar
inputBusqueda.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    btnBuscar.click()
  }
})

// ENTER para crear playlist
inputNuevaPlaylist.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    btnCrearPlaylist.click()
  }
})

// --- LÓGICA DE LA COLA VISUAL ---
btnVerColaFull.addEventListener('click', () => {
  panelColaFull.classList.add('panel-cola-visible')
  renderizarColaFull()
})

btnCerrarColaFull.addEventListener('click', () => {
  panelColaFull.classList.remove('panel-cola-visible')
})

// Cerramos la cola si cierras el reproductor gigante
btnCerrarReproductor.addEventListener('click', () => {
  vistaReproductorFull.classList.add('cerrado')
  panelColaFull.classList.remove('panel-cola-visible') // Se oculta también
})

// --- CERRAR COLA AL TOCAR FUERA ---
vistaReproductorFull.addEventListener('click', (e) => {
  if (panelColaFull.classList.contains('panel-cola-visible')) {
    // Si el clic NO fue dentro del panel de la cola, y NO fue en el botón de abrir
    if (!e.target.closest('#panelColaFull') && !e.target.closest('#btnVerColaFull')) {
      panelColaFull.classList.remove('panel-cola-visible')
    }
  }
})

// --- LÓGICA PARA REORDENAR LA COLA (MATEMÁTICA MEJORADA) ---
function moverCancionCola(indiceOrigen, indiceDestino) {
  if (indiceOrigen === indiceDestino) return // Si lo soltaste en el mismo sitio, no hacemos nada

  // Cuando movemos un elemento hacia abajo, al quitar el original de arriba,
  // todos los demás suben un puesto. Ajustamos el destino para que caiga perfecto.
  let destinoReal = indiceDestino
  if (indiceOrigen < destinoReal) {
    destinoReal--
  }

  if (modoAleatorio) {
    const itemMovido = poolAleatorio.splice(indiceOrigen, 1)[0]
    poolAleatorio.splice(destinoReal, 0, itemMovido)

    // Actualizamos el puntero para no cortar la música
    if (cursorAleatorio === indiceOrigen) {
      cursorAleatorio = destinoReal
    } else if (indiceOrigen < cursorAleatorio && destinoReal >= cursorAleatorio) {
      cursorAleatorio--
    } else if (indiceOrigen > cursorAleatorio && destinoReal <= cursorAleatorio) {
      cursorAleatorio++
    }
  } else {
    const itemMovido = colaDeReproduccion.splice(indiceOrigen, 1)[0]
    colaDeReproduccion.splice(destinoReal, 0, itemMovido)

    if (indiceCancionActual === indiceOrigen) {
      indiceCancionActual = destinoReal
    } else if (indiceOrigen < indiceCancionActual && destinoReal >= indiceCancionActual) {
      indiceCancionActual--
    } else if (indiceOrigen > indiceCancionActual && destinoReal <= indiceCancionActual) {
      indiceCancionActual++
    }
  }

  guardarProgreso()
  renderizarColaFull()
}

async function renderizarColaFull() {
  listaColaFull.innerHTML = ''

  if (colaDeReproduccion.length === 0) {
    listaColaFull.innerHTML =
      '<li style="padding:20px; color:#aaa; text-align:center;">No hay música en la cola</li>'
    return
  }

  let cancionesAMostrar = []

  if (modoAleatorio) {
    cancionesAMostrar = poolAleatorio.map((indiceOriginal, indexCola) => {
      return {
        ...colaDeReproduccion[indiceOriginal],
        indiceReal: indiceOriginal,
        esActiva: indexCola === cursorAleatorio
      }
    })
  } else {
    cancionesAMostrar = colaDeReproduccion.map((cancion, index) => {
      return { ...cancion, indiceReal: index, esActiva: index === indiceCancionActual }
    })
  }

  // --- OPTIMIZACIÓN 1: Lectura en Paralelo (Elimina el Lag) ---
  // Hacemos todas las lecturas al disco duro al mismo tiempo, no una por una
  const datosListos = await Promise.all(
    cancionesAMostrar.map(async (track) => {
      const enDisco = await window.api.verificarDescarga(track.titulo)
      const rutaImgLocal = await window.api.verificarThumbnail(track.titulo)
      return {
        ...track,
        enDisco,
        thumbFinal: rutaImgLocal || track.thumbnail
      }
    })
  )

  // --- OPTIMIZACIÓN 2: Fragmento DOM (Dibuja la pantalla 1 sola vez) ---
  const fragmento = document.createDocumentFragment()

  datosListos.forEach((track, i) => {
    const li = document.createElement('li')
    li.className = 'song-item song-item-cola'
    li.style.borderBottom = '1px solid #222'
    li.style.padding = '10px 0'

    const badge = track.enDisco || track.tipo === 'offline' ? '💾' : '☁️'
    const tituloClase = track.esActiva ? 'cancion-activa-cola' : ''
    const icono = track.esActiva ? '🔊' : ''

    // 1. Extraemos el ID del video mágicamente (si es que existe)
    let videoId = ''
    if (track.urlYoutube) {
      try {
        const u = new URL(track.urlYoutube)
        videoId = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v')

      } catch (e) { }
    }

    // 2. El Doble Escudo (Original -> Servidor Anti-Bloqueos -> Icono Genérico)
    const miniaturaHTML = track.thumbFinal
      ? `<img src="${track.thumbFinal}" class="song-thumbnail" alt="Cover" referrerpolicy="no-referrer" 
              onerror="
                if (!this.dataset.tried) { 
                  this.dataset.tried = true; 
                  this.src='https://img.youtube.com/vi/${videoId}/mqdefault.jpg'; 
                } else { 
                  this.src='https://cdn-icons-png.flaticon.com/512/26/26307.png'; 
                }
              ">`
      : `<div class="song-thumbnail" style="display:flex; justify-content:center; align-items:center; background:#333; font-size:1.5rem;">🎵</div>`
    li.innerHTML = `
      <div style="display:flex; align-items:center; gap: 12px; width: 100%;">
        <div class="drag-handle">☰</div>
        ${miniaturaHTML}
        <div style="flex:1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span class="${tituloClase}" style="font-size: 0.95rem;">${badge} ${track.titulo}</span>
        </div>
        <span style="color: var(--accent); font-size: 1rem; padding-left: 5px;">${icono}</span>
      </div>
    `

    const handle = li.querySelector('.drag-handle')

    handle.addEventListener('touchstart', () => (li.draggable = true), { passive: true })
    handle.addEventListener('touchend', () => (li.draggable = false), { passive: true })
    handle.addEventListener('mousedown', () => (li.draggable = true))
    handle.addEventListener('mouseup', () => (li.draggable = false))

    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', i)
      li.style.opacity = '0.4'
    })

    li.addEventListener('dragend', () => (li.style.opacity = '1'))

    li.addEventListener('dragover', (e) => {
      e.preventDefault()

      const rect = li.getBoundingClientRect()
      const relativoY = e.clientY - rect.top

      if (relativoY < rect.height / 2) {
        li.classList.add('drag-over-top')
        li.classList.remove('drag-over-bottom')
      } else {
        li.classList.add('drag-over-bottom')
        li.classList.remove('drag-over-top')
      }

      // --- SOLUCIÓN: MOTOR DE AUTO-SCROLL ---
      const contenedorCola = listaColaFull
      const bordesContenedor = contenedorCola.getBoundingClientRect()
      const zonaActivable = 60 // Píxeles desde el borde para activar el scroll

      // Si el dedo está en la parte superior del contenedor
      if (e.clientY < bordesContenedor.top + zonaActivable) {
        contenedorCola.scrollTop -= 15 // Sube
      }
      // Si el dedo está en la parte inferior
      else if (e.clientY > bordesContenedor.bottom - zonaActivable) {
        contenedorCola.scrollTop += 15 // Baja
      }
      // --------------------------------------
    })

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over-top', 'drag-over-bottom')
    })

    li.addEventListener('drop', (e) => {
      e.preventDefault()
      const insertarAbajo = li.classList.contains('drag-over-bottom')
      li.classList.remove('drag-over-top', 'drag-over-bottom')
      const indiceOrigen = parseInt(e.dataTransfer.getData('text/plain'))
      const indiceDestino = insertarAbajo ? i + 1 : i
      moverCancionCola(indiceOrigen, indiceDestino)
    })

    const zonaClick = li.querySelector('div[style*="flex:1"]')
    zonaClick.addEventListener('click', async () => {
      if (modoAleatorio) {
        cursorAleatorio = i
        indiceCancionActual = track.indiceReal
      } else {
        indiceCancionActual = track.indiceReal
      }
      await reproductorCentralControl()
      renderizarColaFull()
    })

    fragmento.appendChild(li)
  })

  // Insertamos las 100 canciones de un solo golpe al DOM
  listaColaFull.appendChild(fragmento)

  setTimeout(() => {
    const elementoActivo = listaColaFull.querySelector('.cancion-activa-cola')
    if (elementoActivo) {
      elementoActivo.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

// Evita el bug del WebView haciendo una petición ultra ligera real

let estadoRedAnterior = true // Asumimos que inicia conectado

async function comprobarInternetReal() {
  try {
    // Intentamos cargar un archivo minúsculo sin caché y sin bloqueos de seguridad (no-cors)
    await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' })
    return true // Si no hay error, hay internet real

  } catch (error) {
    return false // Si falla el fetch, estamos desconectados
  }
}

// 1. Revisión inicial al abrir la app
setTimeout(async () => {
  const hayInternet = await comprobarInternetReal()
  if (!hayInternet) {
    mostrarToast('Iniciaste sin conexión a Internet 📡')
    estadoRedAnterior = false
  }
}, 1500)

// 2. El Monitor Activo (Revisa cada 3 segundos en segundo plano)
setInterval(async () => {
  // Primero hacemos la validación rápida
  let estadoRedActual = navigator.onLine

  // Si el teléfono dice que SÍ hay internet, hacemos la prueba de fuego para desmentirlo
  if (estadoRedActual) {
    estadoRedActual = await comprobarInternetReal()
  }

  // Si detecta un cambio real en el estado
  if (estadoRedActual !== estadoRedAnterior) {
    if (estadoRedActual) {
      mostrarToast('Conexión restaurada 🌐')
    } else {
      mostrarToast('Sin conexión a Internet 📡')
    }
    // Guardamos el nuevo estado para no repetir el mensaje
    estadoRedAnterior = estadoRedActual
  }
}, 3000)

// --- 8. SISTEMA DE COPIA DE SEGURIDAD (JSON) ---
const NOMBRE_ARCHIVO_BACKUP = 'MyPlayer_Backup.json'

// EXPORTAR
if (btnCrearBackup) {
  btnCrearBackup.addEventListener('click', async () => {
    try {
      btnCrearBackup.innerText = 'Guardando... ⏳'

      const payload = {
        fecha: new Date().toISOString(),
        playlists: misPlaylists
      }

      await Filesystem.writeFile({
        path: NOMBRE_ARCHIVO_BACKUP,
        data: JSON.stringify(payload, null, 2),
        directory: Directory.Documents,
        encoding: 'utf8' // Si usaste el import usa Encoding.UTF8
      })

      mostrarToast(`✓ Backup guardado en Documentos/${NOMBRE_ARCHIVO_BACKUP}`)
    } catch (error) {
      console.error('Error al crear backup:', error)
      mostrarToast('❌ Error al guardar el archivo.')
    } finally {
      btnCrearBackup.innerText = 'Exportar Playlists (JSON)'
    }
  })
}

// --- RESTAURAR DESDE EXPLORADOR DE ARCHIVOS ---
if (btnRestaurarBackupUI && inputRestaurarBackup) {
  // 1. El botón visual hace clic en el input oculto
  btnRestaurarBackupUI.addEventListener('click', () => {
    inputRestaurarBackup.click()
  })

  // 2. Cuando el usuario selecciona un archivo en el explorador
  inputRestaurarBackup.addEventListener('change', async (event) => {
    const file = event.target.files[0]
    if (!file) return

    btnRestaurarBackupUI.innerText = 'Analizando... ⏳'

    // Leemos el archivo PRIMERO para saber qué tiene adentro
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const datosRecuperados = JSON.parse(e.target.result)

        if (!datosRecuperados.playlists) {
          throw new Error('Formato de archivo inválido')
        }

        const nombresListas = Object.keys(datosRecuperados.playlists)
        const cantidadListas = nombresListas.length

        // --- EL IF INTELIGENTE QUE PEDÍSTE ---
        let mensajeConfirmacion = ''
        if (cantidadListas === 1) {
          // Es una playlist individual compartida
          mensajeConfirmacion = `¿Deseas importar la playlist "${nombresListas[0]}" compartida contigo?`
        } else {
          // Es un backup completo
          mensajeConfirmacion = `¿Deseas restaurar la copia de seguridad (${cantidadListas} listas) desde "${file.name}"?`
        }

        // Mostramos el mensaje exacto
        const confirmar = await window.api.mostrarConfirmacion(
          `${mensajeConfirmacion}\n\nSe combinará con tu biblioteca actual sin borrar lo que ya tienes.`
        )

        if (!confirmar) {
          inputRestaurarBackup.value = '' // Limpiamos si cancela
          btnRestaurarBackupUI.innerText = 'Restaurar desde archivo...'
          return
        }
        // -------------------------------------

        btnRestaurarBackupUI.innerText = 'Guardando... ⏳'

        // Fusión inteligente
        let listasRecuperadas = 0
        nombresListas.forEach((nombreLista) => {
          if (!misPlaylists[nombreLista]) {
            misPlaylists[nombreLista] = datosRecuperados.playlists[nombreLista]
            listasRecuperadas++
          } else {
            const cancionesActuales = misPlaylists[nombreLista].map((c) => c.titulo)
            let agregadas = 0
            datosRecuperados.playlists[nombreLista].forEach((cancionBackup) => {
              if (!cancionesActuales.includes(cancionBackup.titulo)) {
                misPlaylists[nombreLista].push(cancionBackup)
                agregadas++
              }
            })
            if (agregadas > 0) listasRecuperadas++
          }
        })

        await guardarProgreso()
        await actualizarInterfazPlaylists()
        actualizarTodosLosCombobox()

        mostrarToast(`✓ Sincronización exitosa (${listasRecuperadas} listas actualizadas)`)
      } catch (error) {
        console.error('Error al parsear archivo:', error)
        mostrarToast('❌ El archivo seleccionado no es válido o está corrupto.')
      } finally {
        btnRestaurarBackupUI.innerText = 'Restaurar desde archivo...'
        inputRestaurarBackup.value = ''
      }
    }

    reader.onerror = () => {
      mostrarToast('❌ Error al leer el archivo desde el almacenamiento.')
      btnRestaurarBackupUI.innerText = 'Restaurar desde archivo...'
      inputRestaurarBackup.value = ''
    }

    // Iniciamos la lectura
    reader.readAsText(file)
  })
}

// --- 9. IMPORTADORES DIRECTOS DE ENLACES DE YOUTUBE ---

// CANCIÓN INDIVIDUAL
if (btnImportarCancion) {
  btnImportarCancion.addEventListener('click', async () => {
    const urlText = inputLinkCancion.value.trim()
    if (!urlText) return

    if (!navigator.onLine) {
      mostrarToast('Necesitas conexión a internet 📡')
      return
    }

    // EXTRAER ID USANDO LA API URL NATIVA
    let videoId = null
    try {
      const url = new URL(urlText)

      if (url.hostname.includes('youtu.be')) {
        // Enlaces compartidos tipo: https://youtu.be/abc123xyz00
        videoId = url.pathname.slice(1)
      } else if (url.hostname.includes('youtube.com')) {
        if (url.pathname.startsWith('/shorts/')) {
          // Enlaces de Shorts tipo: https://youtube.com/shorts/abc123xyz00
          videoId = url.pathname.split('/')[2]
        } else {
          // Enlaces estándar tipo: https://youtube.com/watch?v=abc123xyz00
          videoId = url.searchParams.get('v')
        }
      }

    } catch (e) {
      // Plan B: Si pegan solo el ID de 11 caracteres en vez de un enlace completo
      if (urlText.length === 11) videoId = urlText
    }

    // Validación final del ID extraído
    if (!videoId || videoId.length !== 11) {
      mostrarToast('❌ Enlace de canción inválido o no soportado.')
      return
    }
    const videoDetails = await window.api.obtenerDetallesVideoPorId(videoId)

    // Preguntamos al usuario a qué playlist añadirla
    const nombrePl = await pedirNombrePlaylist(
      `Canción encontrada: "${videoDetails.title}"\n\nElige una playlist existente o crea una nueva:`
    )

    if (nombrePl) {
      const plFinal = nombrePl.trim()

      // Si la playlist no existe, la fundamos
      if (!misPlaylists[plFinal]) misPlaylists[plFinal] = []

      // Evitamos duplicados en esa playlist
      const yaExiste = misPlaylists[plFinal].some((c) => c.urlYoutube === videoDetails.url)

      if (!yaExiste) {
        misPlaylists[plFinal].push({
          tipo: 'online',
          titulo: videoDetails.title,
          urlYoutube: videoDetails.url,
          thumbnail: videoDetails.thumbnail,
          duracion: videoDetails.duration
        })

        await guardarProgreso()
        await actualizarInterfazPlaylists()
        actualizarTodosLosCombobox()
        mostrarToast(`✓ Añadida a la playlist "${plFinal}"`)
        inputLinkCancion.value = ''
      } else {
        mostrarToast('⚠️ Esta canción ya existe en esa playlist.')
      }
    }

    btnImportarCancion.innerText = 'Añadir Canción'
  })
}

// PLAYLIST / MIX COMPLETO
if (btnImportarMix) {
  btnImportarMix.addEventListener('click', async () => {
    const urlText = inputLinkPlaylist.value.trim()
    if (!urlText) return

    if (!navigator.onLine) {
      mostrarToast('Necesitas conexión a internet 📡')
      return
    }

    // Regex para extraer el ID de la lista de reproducción
    const playlistRegex = /[?&]list=([a-zA-Z0-9_-]+)/
    const match = urlText.match(playlistRegex)

    if (!match) {
      mostrarToast('❌ Enlace de Mix/Playlist inválido.')
      return
    }

    const playlistId = match[1]
    btnImportarMix.innerText = 'Escaneando... ⏳'
    btnImportarMix.style.backgroundColor = '#333'

    // 1. Buscamos el nombre oficial de la lista
    const nombreOficial = await window.api.obtenerNombrePlaylistYouTube(playlistId)

    // 2. Traemos las canciones
    const cancionesEncontradas = await window.api.obtenerVideosDePlaylist(playlistId)

    if (cancionesEncontradas.length === 0) {
      mostrarToast('❌ No se pudieron extraer canciones de este enlace.')
      btnImportarMix.innerText = 'Escanear Playlist Completa'
      btnImportarMix.style.backgroundColor = '#ff0000'
      return
    }

    // Preguntamos confirmación al usuario sugiriendo el nombre oficial
    const nombreConfirmado = await pedirNombrePlaylist(
      `Se encontraron ${cancionesEncontradas.length} canciones.\n\nGuarda en una playlist existente o acepta el nombre sugerido:`,
      nombreOficial
    )

    if (nombreConfirmado) {
      const plFinal = nombreConfirmado.trim()

      if (!misPlaylists[plFinal]) misPlaylists[plFinal] = []

      let agregadas = 0
      cancionesEncontradas.forEach((nuevaCancion) => {
        const existe = misPlaylists[plFinal].some((c) => c.urlYoutube === nuevaCancion.urlYoutube)
        if (!existe) {
          misPlaylists[plFinal].push(nuevaCancion)
          agregadas++
        }
      })

      await guardarProgreso()
      await actualizarInterfazPlaylists()
      actualizarTodosLosCombobox()

      mostrarToast(`✓ Creada: "${plFinal}" con ${agregadas} canciones nuevas.`)
      inputLinkPlaylist.value = ''
    }

    btnImportarMix.innerText = 'Escanear Playlist Completa'
    btnImportarMix.style.backgroundColor = '#ff0000'
  })
}

function pedirNombrePlaylist(mensaje, sugerencia = '') {
  return new Promise((resolve) => {
    // 1. Crear el fondo oscuro
    const overlay = document.createElement('div')
    overlay.style.cssText =
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;'

    // 2. Crear la caja del modal
    const modal = document.createElement('div')
    modal.style.cssText =
      'background: #1e1e1e; padding: 20px; border-radius: 12px; width: 100%; max-width: 400px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);'

    const tituloObj = document.createElement('h3')
    tituloObj.innerText = '💾 Guardar en...'
    tituloObj.style.marginBottom = '10px'
    tituloObj.style.color = 'var(--accent)'

    const texto = document.createElement('p')
    texto.innerText = mensaje
    texto.style.fontSize = '0.9rem'
    texto.style.marginBottom = '15px'
    texto.style.color = '#ccc'

    // 3. Dibujar las playlists existentes
    const divPlaylists = document.createElement('div')
    divPlaylists.style.cssText =
      'max-height: 160px; overflow-y: auto; margin-bottom: 15px; border: 1px solid #333; border-radius: 8px; padding: 5px;'

    const nombresPlaylists = Object.keys(misPlaylists)
    if (nombresPlaylists.length === 0) {
      divPlaylists.innerHTML =
        '<p style="padding:10px; text-align:center; color:#777; font-size:0.85rem;">No tienes playlists todavía</p>'
    } else {
      nombresPlaylists.forEach((pl) => {
        const btn = document.createElement('button')
        btn.innerText = `📁 ${pl}`
        btn.style.cssText =
          'width: 100%; text-align: left; padding: 12px; background: transparent; border: none; color: white; border-bottom: 1px solid #333; font-size: 0.95rem; cursor: pointer;'

        // Al hacer clic en una existente, se resuelve la promesa y se cierra
        btn.onclick = () => {
          document.body.removeChild(overlay)
          resolve(pl)
        }
        divPlaylists.appendChild(btn)
      })
    }

    // 4. Input para crear una nueva
    const inputNueva = document.createElement('input')
    inputNueva.type = 'text'
    inputNueva.placeholder = 'O escribe una nueva...'
    inputNueva.value = sugerencia
    inputNueva.style.cssText =
      'width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #444; background: #222; color: white; outline: none;'

    // 5. Botones de acción
    const divBotones = document.createElement('div')
    divBotones.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;'

    const btnCancelar = document.createElement('button')
    btnCancelar.innerText = 'Cancelar'
    btnCancelar.style.cssText =
      'padding: 10px 15px; background: transparent; border: none; color: #aaa; font-weight: bold; cursor: pointer;'
    btnCancelar.onclick = () => {
      document.body.removeChild(overlay)
      resolve(null) // Devuelve null si el usuario cancela
    }

    const btnGuardar = document.createElement('button')
    btnGuardar.innerText = 'Guardar'
    btnGuardar.style.cssText =
      'padding: 10px 15px; background: var(--accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;'
    btnGuardar.onclick = () => {
      const val = inputNueva.value.trim()
      if (!val) {
        mostrarToast('Escribe un nombre para la playlist')
        return
      }
      document.body.removeChild(overlay)
      resolve(val) // Devuelve el texto escrito
    }

    modal.appendChild(tituloObj)
    modal.appendChild(texto)
    modal.appendChild(divPlaylists)
    modal.appendChild(inputNueva)

    divBotones.appendChild(btnCancelar)
    divBotones.appendChild(btnGuardar)
    modal.appendChild(divBotones)
    overlay.appendChild(modal)
    document.body.appendChild(overlay)
  })
}

// --- 10. COMPARTIR POR QR (MÁXIMA COMPRESIÓN) ---
const modalQR = document.getElementById('modal-qr')
const btnCerrarModalQR = document.getElementById('btnCerrarModalQR')

const btnAbrirEscaner = document.getElementById('btnAbrirEscaner')
const lectorQrContainer = document.getElementById('lector-qr-container')
const btnCerrarEscaner = document.getElementById('btnCerrarEscaner')
//let html5QrcodeScanner = null

// A. Función para GENERAR el QR (Con Inteligencia de Límite y Auto-JSON)
async function generarQR(nombrePlaylist, canciones) {
  // 1. Verificación de seguridad de la librería
  if (typeof window.QRious === 'undefined') {
    mostrarToast('❌ La librería del QR no ha cargado. Verifica tu conexión.')
    return
  }

  // 2. Filtro de canciones válidas (Solo de la nube)
  const cancionesOnline = canciones.filter((c) => c.tipo === 'online' || c.urlYoutube)

  if (cancionesOnline.length === 0) {
    mostrarToast('❌ Solo se pueden compartir canciones de la nube ☁️')
    return
  }

  // --- 3. NUEVA INTELIGENCIA: ESCUDO DE TAMAÑO Y EXPORTACIÓN JSON ---
  if (cancionesOnline.length > 30) {
    const confirmarJson = await window.api.mostrarConfirmacion(
      `⚠️ Esta playlist tiene ${cancionesOnline.length} canciones.\nEs demasiado grande para un QR (Máximo 30).\n\n¿Deseas exportarla como un archivo para compartirla?`
    )

    if (confirmarJson) {
      try {
        mostrarToast('Exportando playlist... ⏳')

        // Armamos el archivo con la MISMA estructura de un Backup
        const payload = {
          fecha: new Date().toISOString(),
          playlists: {
            [nombrePlaylist]: canciones // Exportamos SOLO esta playlist
          }
        }

        const nombreSeguro = nombrePlaylist.replace(/[\\/:*?"<>|]/g, '_')
        const fileName = `Playlist_${nombreSeguro}.json`

        await Filesystem.writeFile({
          path: fileName,
          data: JSON.stringify(payload, null, 2),
          directory: Directory.Documents,
          encoding: 'utf8'
        })

        mostrarToast(`✓ Guardado en Documentos como "${fileName}"`)
      } catch (error) {
        console.error('Error exportando JSON de playlist:', error)
        mostrarToast('❌ Error al guardar el archivo.')
      }
    }
    // Frenamos la ejecución para no dibujar el QR ilegible
    return
  }
  // -----------------------------------------------------------------

  // 4. Si tiene 30 o menos, continuamos con el QR normal
  const ids = cancionesOnline
    .map((c) => {
      try {
        const url = new URL(c.urlYoutube)
        if (url.hostname.includes('youtu.be')) return url.pathname.slice(1)
        return url.searchParams.get('v')

      } catch (e) {
        return null
      }
    })
    .filter((id) => id && id.length === 11)

  if (ids.length === 0) {
    mostrarToast('❌ No se encontraron enlaces válidos.')
    return
  }

  // 5. Compresión y dibujo
  const nombreCorto =
    nombrePlaylist.length > 20 ? nombrePlaylist.substring(0, 20) + '...' : nombrePlaylist
  const payload = `MVP|${nombreCorto}|${ids.join(',')}`

  const modalViejo = document.getElementById('modal-qr-dinamico')
  if (modalViejo) modalViejo.remove()

  const modalQR = document.createElement('div')
  modalQR.id = 'modal-qr-dinamico'
  modalQR.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;'

  const tituloQR = document.createElement('h2')
  tituloQR.style.cssText =
    'color: var(--accent); margin-bottom: 10px; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.8);'
  tituloQR.innerText = `Compartir: ${nombreCorto}`

  const subtitulo = document.createElement('p')
  subtitulo.style.cssText =
    'color: #ccc; margin-bottom: 25px; text-align: center; font-size: 0.95rem; max-width: 80%;'
  subtitulo.innerText =
    'Pídele a un amigo que escanee este código desde la sección "Perfil" de su aplicación.'

  const canvasContenedor = document.createElement('div')
  canvasContenedor.style.cssText =
    'background: white; padding: 20px; border-radius: 16px; margin-bottom: 30px; box-shadow: 0 0 30px rgba(0,0,0,0.8);'

  const lienzoQR = document.createElement('canvas')
  canvasContenedor.appendChild(lienzoQR)

  const btnCerrar = document.createElement('button')
  btnCerrar.innerText = 'Cerrar'
  btnCerrar.style.cssText =
    'padding: 12px 35px; background: #d32f2f; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);'
  btnCerrar.onclick = () => modalQR.remove()

  modalQR.appendChild(tituloQR)
  modalQR.appendChild(subtitulo)
  modalQR.appendChild(canvasContenedor)
  modalQR.appendChild(btnCerrar)

  document.body.appendChild(modalQR)

  new window.QRious({
    element: lienzoQR,
    value: payload,
    size: 280, // Tamaño cómodo y seguro para <= 30 items
    background: 'white',
    foreground: 'black'
  })
}

if (btnCerrarModalQR) {
  btnCerrarModalQR.addEventListener('click', () => (modalQR.style.display = 'none'))
}

// B. Función para LEER el QR de forma Nativa, Automática y Directa
const inputQrImagen = document.getElementById('inputQrImagen')
const btnEscanearImagen = document.getElementById('btnEscanearImagen')
let html5QrCode = null

// --- FUNCIÓN MAESTRA: Procesa el texto extraído (sea de cámara o imagen) ---
async function procesarTextoQR(decodedText) {
  if (!decodedText.startsWith('MVP|')) {
    mostrarToast('❌ Código QR no válido para esta aplicación.')
    return
  }

  const partes = decodedText.split('|')
  const nombreSugerido = partes[1]
  const idsArray = partes[2].split(',')

  mostrarToast(`Reconstruyendo ${idsArray.length} canciones... ⏳`)

  const cancionesRecuperadas = await window.api.obtenerDetallesVideosEnLote(idsArray)

  if (cancionesRecuperadas.length === 0) {
    mostrarToast('❌ Error de red al reconstruir la playlist.')
    return
  }

  const nombreFinal = await pedirNombrePlaylist(
    `Se reconstruyeron ${cancionesRecuperadas.length} canciones.\n\nGuarda en una playlist existente o acepta el nombre sugerido:`,
    nombreSugerido
  )

  if (nombreFinal) {
    const plFinal = nombreFinal.trim()
    if (!misPlaylists[plFinal]) misPlaylists[plFinal] = []

    let agregadas = 0
    cancionesRecuperadas.forEach((nuevaCancion) => {
      const existe = misPlaylists[plFinal].some((c) => c.urlYoutube === nuevaCancion.urlYoutube)
      if (!existe) {
        misPlaylists[plFinal].push(nuevaCancion)
        agregadas++
      }
    })

    await guardarProgreso()
    await actualizarInterfazPlaylists()
    actualizarTodosLosCombobox()
    mostrarToast(`✓ ¡Recibida! ${agregadas} canciones guardadas en "${plFinal}"`)
  }
}

// --- 1. LÓGICA DE LA CÁMARA ---
if (btnAbrirEscaner) {
  btnAbrirEscaner.addEventListener('click', async () => {
    btnAbrirEscaner.style.display = 'none'
    if (btnEscanearImagen) btnEscanearImagen.style.display = 'none' // Ocultamos el otro botón
    lectorQrContainer.style.display = 'block'

    html5QrCode = new window.Html5Qrcode('lector-qr')

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (html5QrCode.isScanning) await html5QrCode.stop()
          html5QrCode.clear()
          lectorQrContainer.style.display = 'none'
          btnAbrirEscaner.style.display = 'block'
          if (btnEscanearImagen) btnEscanearImagen.style.display = 'block'

          await procesarTextoQR(decodedText) // Llamamos a la función maestra
        },

        (errorMessage) => { } // Ignoramos errores de enfoque
      )
    } catch (err) {
      console.error(err)
      mostrarToast('❌ Error: No se pudo abrir la cámara.')
      lectorQrContainer.style.display = 'none'
      btnAbrirEscaner.style.display = 'block'
      if (btnEscanearImagen) btnEscanearImagen.style.display = 'block'
    }
  })

  btnCerrarEscaner.addEventListener('click', async () => {
    try {
      if (html5QrCode && html5QrCode.isScanning) await html5QrCode.stop()
      if (html5QrCode) html5QrCode.clear()
    } catch (err) {
      console.error('Error cerrando cámara:', err)
    }
    lectorQrContainer.style.display = 'none'
    btnAbrirEscaner.style.display = 'block'
    if (btnEscanearImagen) btnEscanearImagen.style.display = 'block'
  })
}

// --- 2. LÓGICA DE ESCANEAR DESDE GALERÍA (WhatsApp, Capturas, etc) ---
if (btnEscanearImagen && inputQrImagen) {
  btnEscanearImagen.addEventListener('click', () => {
    inputQrImagen.click() // Abre la galería nativa del teléfono
  })

  inputQrImagen.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return
    const imageFile = e.target.files[0]

    // Necesitamos instanciar la clase si no se había usado la cámara antes
    if (!html5QrCode) {
      html5QrCode = new window.Html5Qrcode('lector-qr')
    }

    try {
      mostrarToast('Analizando imagen... ⏳')
      // Usamos el método nativo para escanear archivos
      const decodedText = await html5QrCode.scanFile(imageFile, true)

      inputQrImagen.value = '' // Limpiamos el input por si quiere subir la misma foto luego
      await procesarTextoQR(decodedText) // Llamamos a la función maestra


    } catch (err) {
      mostrarToast('❌ No se detectó ningún código QR en la imagen seleccionada.')
      inputQrImagen.value = ''
    }
  })
}

// --- MODAL INTELIGENTE DE GESTIÓN CON CREACIÓN DE PLAYLIST ---
async function abrirModalGestionCancion(pOrigen, titulo) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.id = 'modal-gestion-overlay'
    overlay.style.cssText =
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;'

    const modal = document.createElement('div')
    modal.style.cssText =
      'background: #1e1e1e; padding: 20px; border-radius: 12px; width: 100%; max-width: 400px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 15px;'

    const limpiarModal = () => {
      modal.innerHTML = ''
    }

    // --- CORRECCIÓN MÁGICA: Separamos la destrucción visual del resolve ---
    const destruirModal = () => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay)
      window.cerrarModalGestionActivo = null
    }

    const cancelarYSalir = () => {
      destruirModal()
      resolve(null)
    }

    window.cerrarModalGestionActivo = cancelarYSalir

    // VISTA 2: ELEGIR PLAYLIST DESTINO (O CREAR UNA NUEVA)
    const mostrarPlaylists = (accionSeleccionada) => {
      limpiarModal()

      const tituloModal = document.createElement('h3')

      if (!pOrigen) {
        tituloModal.innerText = '➕ Agregar a...'
      } else {
        tituloModal.innerText = accionSeleccionada === 'mover' ? '🚚 Mover a...' : '📋 Copiar a...'
      }

      tituloModal.style.color = 'var(--accent)'
      modal.appendChild(tituloModal)

      const contenedorPl = document.createElement('div')
      contenedorPl.style.cssText =
        'max-height: 160px; overflow-y: auto; border: 1px solid #333; border-radius: 8px; padding: 5px; margin-bottom: 5px;'

      const nombres = Object.keys(misPlaylists).filter((n) => n !== pOrigen)

      if (nombres.length === 0) {
        contenedorPl.innerHTML =
          '<p style="padding:10px; text-align:center; color:#777; font-size:0.85rem;">No hay otras playlists creadas</p>'
      } else {
        nombres.forEach((pl) => {
          const btn = document.createElement('button')
          btn.innerText = `📁 ${pl}`
          btn.style.cssText =
            'width: 100%; text-align: left; padding: 12px; background: transparent; border: none; color: white; border-bottom: 1px solid #333; font-size: 0.95rem; cursor: pointer;'

          btn.onclick = () => {
            destruirModal() // <-- Usamos la nueva función segura
            resolve({ accion: accionSeleccionada, destino: pl })
          }

          contenedorPl.appendChild(btn)
        })
      }
      modal.appendChild(contenedorPl)

      const divNueva = document.createElement('div')
      divNueva.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-top: 5px;'

      const inputNueva = document.createElement('input')
      inputNueva.type = 'text'
      inputNueva.placeholder = 'O crea una nueva playlist...'
      inputNueva.style.cssText =
        'flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #444; background: #222; color: white; outline: none; font-size: 0.9rem;'

      const btnCrear = document.createElement('button')
      btnCrear.innerText = '➕'
      btnCrear.title = 'Crear playlist y guardar canción'
      btnCrear.style.cssText =
        'padding: 10px 14px; background: var(--accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 0.9rem;'

      btnCrear.onclick = () => {
        const nuevoNombre = inputNueva.value.trim()
        if (!nuevoNombre) {
          mostrarToast('❌ Escribe un nombre para la nueva lista.')
          return
        }
        destruirModal() // <-- Usamos la nueva función segura
        resolve({ accion: accionSeleccionada, destino: nuevoNombre })
      }

      divNueva.appendChild(inputNueva)
      divNueva.appendChild(btnCrear)
      modal.appendChild(divNueva)

      const divBotonesAccion = document.createElement('div')
      divBotonesAccion.style.cssText = 'display: flex; justify-content: flex-end; margin-top: 5px;'

      const btnCancelar = document.createElement('button')
      btnCancelar.innerText = 'Cancelar'
      btnCancelar.style.cssText =
        'padding: 10px; background: transparent; border: none; color: #aaa; font-weight: bold; cursor: pointer; font-size: 0.9rem;'

      btnCancelar.onclick = cancelarYSalir // <-- Función exclusiva de cancelación

      divBotonesAccion.appendChild(btnCancelar)
      modal.appendChild(divBotonesAccion)
    }

    // VISTA 1: PREGUNTAR QUÉ HACER
    const mostrarAcciones = () => {
      limpiarModal()

      const tituloModal = document.createElement('h3')
      tituloModal.innerText = '⚙️ Opciones'
      tituloModal.style.color = 'var(--accent)'
      modal.appendChild(tituloModal)

      const sub = document.createElement('p')
      sub.innerText = `¿Qué deseas hacer con "${titulo.length > 25 ? titulo.substring(0, 25) + '...' : titulo}"?`
      sub.style.cssText = 'color: #ccc; font-size: 0.9rem; margin-bottom: 10px;'
      modal.appendChild(sub)

      const btnCopiar = document.createElement('button')
      btnCopiar.innerText = '📋 Copiar a otra playlist'
      btnCopiar.style.cssText =
        'width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; color: white; margin-bottom: 10px; font-weight: bold; cursor: pointer;'
      btnCopiar.onclick = () => mostrarPlaylists('copiar')
      modal.appendChild(btnCopiar)

      const btnMover = document.createElement('button')
      btnMover.innerText = '🚚 Mover a otra playlist'
      btnMover.style.cssText =
        'width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; border-radius: 8px; color: white; margin-bottom: 10px; font-weight: bold; cursor: pointer;'
      btnMover.onclick = () => mostrarPlaylists('mover')
      modal.appendChild(btnMover)

      const btnCancelar = document.createElement('button')
      btnCancelar.innerText = 'Cancelar'
      btnCancelar.style.cssText =
        'padding: 10px; background: transparent; border: none; color: #aaa; font-weight: bold; cursor: pointer; margin-top: 5px; align-self: flex-end;'

      btnCancelar.onclick = cancelarYSalir // <-- Función exclusiva de cancelación

      modal.appendChild(btnCancelar)
    }

    if (!pOrigen) mostrarPlaylists('copiar')
    else mostrarAcciones()

    overlay.appendChild(modal)
    document.body.appendChild(overlay)
  })
}

// ==========================================
//   NUEVO: ONBOARDING Y ECUALIZADOR (NEÓN)
// ==========================================

// --- ONBOARDING LOGIC ---
const onboardingOverlay = document.getElementById('onboarding-overlay')
const btnEmpezarOnboarding = document.getElementById('btnEmpezarOnboarding')

if (onboardingOverlay && btnEmpezarOnboarding) {
  const hasSeenOnboarding = localStorage.getItem('myplayer_onboarding_done')
  if (!hasSeenOnboarding) {
    onboardingOverlay.classList.remove('vista-oculta')
    btnEmpezarOnboarding.addEventListener('click', () => {
      onboardingOverlay.classList.add('fade-out')
      localStorage.setItem('myplayer_onboarding_done', 'true')
      setTimeout(() => {
        onboardingOverlay.classList.add('vista-oculta')
      }, 500)
    })
  }
}

// --- ECUALIZADOR VISUAL (WEB AUDIO API) ---
const canvasEcualizador = document.getElementById('ecualizadorVisual')
if (canvasEcualizador && reproductor) {
  const ctx = canvasEcualizador.getContext('2d')
  canvasEcualizador.width = 320
  canvasEcualizador.height = 320

  let audioContext = null
  let analyser = null
  let dataArray = null
  let source = null

  const initAudio = () => {
    if (!audioContext) {
      try {
        reproductor.crossOrigin = 'anonymous'
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        source = audioContext.createMediaElementSource(reproductor)

        source.connect(analyser)
        analyser.connect(audioContext.destination)

        analyser.fftSize = 128
        const bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)

        dibujarEcualizador()
      } catch (e) {
        console.warn('Ecualizador no disponible por políticas de CORS en esta fuente de audio.', e)
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }

  reproductor.addEventListener('play', initAudio)

  function dibujarEcualizador() {
    requestAnimationFrame(dibujarEcualizador)
    if (!analyser) return

    analyser.getByteFrequencyData(dataArray)
    ctx.clearRect(0, 0, canvasEcualizador.width, canvasEcualizador.height)

    const centerX = canvasEcualizador.width / 2
    const centerY = canvasEcualizador.height / 2
    const radius = 140

    const bars = dataArray.length
    const barWidth = (2 * Math.PI) / bars

    for (let i = 0; i < bars; i++) {
      const barHeight = (dataArray[i] / 255) * 35
      const angle = i * barWidth

      const x1 = centerX + Math.cos(angle) * radius
      const y1 = centerY + Math.sin(angle) * radius
      const x2 = centerX + Math.cos(angle) * (radius + barHeight)
      const y2 = centerY + Math.sin(angle) * (radius + barHeight)

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineWidth = 4
      ctx.strokeStyle = `rgba(0, 240, 255, ${Math.max(0.2, dataArray[i] / 255)})`
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }
}

// --- MINI-PLAYER (PICTURE IN PICTURE) ---
const btnMiniPlayer = document.getElementById('btnMiniPlayer')
let isMiniPlayerActive = false

if (btnMiniPlayer) {
  btnMiniPlayer.addEventListener('click', async () => {
    if (window.api && window.api.toggleMiniPlayer) {
      isMiniPlayerActive = !isMiniPlayerActive
      await window.api.toggleMiniPlayer(isMiniPlayerActive)
      if (isMiniPlayerActive) {
        btnMiniPlayer.innerHTML = '<i class="ph-fill ph-picture-in-picture"></i>'
        btnMiniPlayer.style.color = 'var(--accent)'
      } else {
        btnMiniPlayer.innerHTML = '<i class="ph-bold ph-picture-in-picture"></i>'
        btnMiniPlayer.style.color = 'inherit'
      }
    } else {
      mostrarToast('Modo Mini-Player no disponible (solo en PC)')
    }
  })
}

// --- INIT CAR MODE ---
initCarMode({
  onPlayPause: () => btnPlayPauseFull.click(),
  onPrev: () => btnAnteriorFull.click(),
  onNext: () => btnSiguienteFull.click()
})

// --- INIT STORAGE MANAGER ---
const storageManager = initStorageManager({
  getPlaylists: () => misPlaylists,
  onSpaceFreed: (msg) => mostrarToast(msg)
})

// --- INIT RECOMENDACIONES LOCALES ---
setTimeout(() => {
  initRecommendations({
    getRecientes: () => busquedasRecientes,
    onPlaySuggested: async (cancionObj) => {
      // Agregar a la cola y reproducir inmediatamente
      colaDeReproduccion = [cancionObj]
      indiceCancionActual = 0
      poolAleatorio = [0]
      cursorAleatorio = 0
      btnPlayPauseFull.click() // Simula el click para abrir el modal si es necesario, 
      // o llama a reproductorCentralControl directamente
      await reproductorCentralControl()

      // Abrir fullscreen player automáticamente para mayor inmersión
      document.getElementById('vista-reproductor').classList.replace('cerrado', 'abierto')
    }
  })
}, 1000) // Cargar despues del render inicial para no bloquear
