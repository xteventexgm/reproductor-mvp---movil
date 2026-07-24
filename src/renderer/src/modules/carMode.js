// src/renderer/src/modules/carMode.js

export function initCarMode(callbacks) {
  const btnToggle = document.getElementById('btnCarModeToggle')
  const btnExit = document.getElementById('btnExitCarMode')
  const container = document.getElementById('vista-car-mode')
  
  const btnPlay = document.getElementById('carBtnPlay')
  const btnPrev = document.getElementById('carBtnPrev')
  const btnNext = document.getElementById('carBtnNext')
  
  const lblTitle = document.getElementById('carTitulo')
  const lblArtist = document.getElementById('carArtista')
  
  const tituloFull = document.getElementById('tituloFull')
  const artistaFull = document.getElementById('artistaFull')
  const reproductor = document.getElementById('reproductor')

  if (!btnToggle || !container) return

  // Alternar vista
  btnToggle.addEventListener('click', () => {
    container.classList.remove('vista-oculta')
    actualizarTextos()
  })

  btnExit.addEventListener('click', () => {
    container.classList.add('vista-oculta')
  })

  // Sincronizar textos periódicamente o al abrir
  function actualizarTextos() {
    lblTitle.innerText = tituloFull.innerText || 'Música'
    lblArtist.innerText = artistaFull.innerText || '--'
    
    if (reproductor.paused) {
      btnPlay.innerHTML = '<i class="ph-fill ph-play"></i>'
    } else {
      btnPlay.innerHTML = '<i class="ph-fill ph-pause"></i>'
    }
  }

  // Escuchar estado global de reproductor para actualizar ícono
  reproductor.addEventListener('play', actualizarTextos)
  reproductor.addEventListener('pause', actualizarTextos)
  
  // Observar mutaciones en el título de la canción para actualizar el modo coche automáticamente
  const observer = new MutationObserver(actualizarTextos)
  observer.observe(tituloFull, { childList: true, characterData: true, subtree: true })

  // Controles
  btnPlay.addEventListener('click', () => callbacks.onPlayPause())
  btnPrev.addEventListener('click', () => callbacks.onPrev())
  btnNext.addEventListener('click', () => callbacks.onNext())
}
