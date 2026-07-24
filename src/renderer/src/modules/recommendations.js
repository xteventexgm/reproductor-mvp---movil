// src/renderer/src/modules/recommendations.js

export async function initRecommendations(callbacks) {
  const contenedor = document.getElementById('contenedorRecomendaciones')
  if (!contenedor) return
  
  if (!window.api) return
  
  const recientes = callbacks.getRecientes()
  
  let keyword = 'Top hits 2024' // Default
  if (recientes && recientes.length > 0) {
    // Escoger una búsqueda aleatoria del historial
    const randomIndex = Math.floor(Math.random() * recientes.length)
    keyword = recientes[randomIndex] + ' mix' // añadir "mix" para variedad
  }
  
  try {
    const resultados = await window.api.buscarMusica(keyword)
    if (!resultados || resultados.length === 0) return
    
    contenedor.innerHTML = ''
    
    // Mostrar hasta 20 recomendaciones
    const sugeridos = resultados.slice(0, 20)
    
    sugeridos.forEach((track) => {
      const card = document.createElement('div')
      card.style.cssText = `
        min-width: 140px; 
        max-width: 140px;
        background: #1a1a24; 
        border-radius: 12px; 
        overflow: hidden; 
        scroll-snap-align: start;
        cursor: pointer;
        border: 1px solid #333;
        transition: transform 0.2s, border-color 0.2s;
      `
      
      const thumb = track.thumbnail || 'https://cdn-icons-png.flaticon.com/512/26/26307.png'
      
      card.innerHTML = `
        <div style="position: relative; padding-top: 100%;">
          <img src="${thumb}" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover;">
          <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.8); padding: 2px 5px; border-radius: 4px; font-size: 0.7rem; color: #fff;">${track.duration || '0:00'}</div>
        </div>
        <div style="padding: 10px;">
          <h4 style="font-size: 0.85rem; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${track.title}">${track.title}</h4>
        </div>
      `
      
      card.addEventListener('click', () => {
        callbacks.onPlaySuggested({
          tipo: 'online',
          titulo: track.title,
          urlYoutube: track.url,
          thumbnail: thumb,
          duracion: track.duration
        })
      })
      
      card.addEventListener('mouseover', () => { card.style.borderColor = 'var(--accent-cyan)'; card.style.transform = 'translateY(-3px)' })
      card.addEventListener('mouseout', () => { card.style.borderColor = '#333'; card.style.transform = 'translateY(0)' })
      
      contenedor.appendChild(card)
    })
    
  } catch(e) {
    console.error('Error cargando recomendaciones', e)
  }
}
