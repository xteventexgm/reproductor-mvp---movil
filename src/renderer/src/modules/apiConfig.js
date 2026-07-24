import { Preferences } from '@capacitor/preferences'

export async function initApiConfig() {
  const apiKeysList = document.getElementById('apiKeysList')
  const apiKeysCount = document.getElementById('apiKeysCount')
  const inputNewApiKey = document.getElementById('inputNewApiKey')
  const btnAddApiKey = document.getElementById('btnAddApiKey')
  const btnResetApiKeys = document.getElementById('btnResetApiKeys')

  if (!apiKeysList) return // Falla segura si no existe el HTML

  // 1. Cargar las llaves guardadas en el dispositivo (si existen)
  let misLlaves = []
  try {
    const data = await Preferences.get({ key: 'misApiKeysCustom' })
    if (data.value) {
      misLlaves = JSON.parse(data.value)
      // Sobrescribir las de renderer.js
      if (window.actualizarLlavesExternas && misLlaves.length > 0) {
        window.actualizarLlavesExternas(misLlaves)
      }
    } else {
      // Si no hay nada guardado, tomamos las que están por defecto en renderer.js
      misLlaves = window.llavesPorDefecto ? [...window.llavesPorDefecto] : []
    }
  } catch (e) {
    console.error('Error al cargar API Keys', e)
    misLlaves = window.llavesPorDefecto ? [...window.llavesPorDefecto] : []
  }

  // 2. Función para pintar la lista
  const renderizarLista = () => {
    apiKeysList.innerHTML = ''
    apiKeysCount.innerText = `${misLlaves.length} llave${misLlaves.length === 1 ? '' : 's'}`
    
    if (misLlaves.length === 0) {
      apiKeysList.innerHTML = '<li style="color: #ff5252; text-align: center; padding: 10px;">⚠️ No hay llaves. Las descargas fallarán.</li>'
      return
    }

    misLlaves.forEach((llave, index) => {
      const li = document.createElement('li')
      li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #333;'
      
      const texto = document.createElement('span')
      // Ocultar parte de la llave para no hacer spam visual
      const llaveVisible = llave.length > 20 ? llave.substring(0, 10) + '...' + llave.substring(llave.length - 4) : llave
      texto.innerText = `${index + 1}. ${llaveVisible}`
      texto.style.color = '#ccc'
      texto.style.fontSize = '0.85rem'
      texto.style.fontFamily = 'monospace'

      const btnEliminar = document.createElement('button')
      btnEliminar.innerHTML = '<i class="ph-bold ph-trash"></i>'
      btnEliminar.style.cssText = 'background: transparent; border: none; color: #ff5252; font-size: 1.1rem; cursor: pointer;'
      btnEliminar.onclick = async () => {
        misLlaves.splice(index, 1)
        await guardarYRefrescar()
      }

      li.appendChild(texto)
      li.appendChild(btnEliminar)
      apiKeysList.appendChild(li)
    })
  }

  // 3. Función para guardar y actualizar el estado global
  const guardarYRefrescar = async () => {
    try {
      await Preferences.set({ key: 'misApiKeysCustom', value: JSON.stringify(misLlaves) })
      if (window.actualizarLlavesExternas) {
        window.actualizarLlavesExternas(misLlaves.length > 0 ? misLlaves : [])
      }
      renderizarLista()
    } catch (e) {
      console.error('Error al guardar llaves', e)
    }
  }

  // 4. Lógica de los botones
  btnAddApiKey.addEventListener('click', async () => {
    const nuevaLlave = inputNewApiKey.value.trim()
    if (!nuevaLlave) return
    if (misLlaves.includes(nuevaLlave)) {
      alert('Esta llave ya está en la lista.')
      return
    }
    
    misLlaves.push(nuevaLlave)
    inputNewApiKey.value = ''
    await guardarYRefrescar()
  })

  btnResetApiKeys.addEventListener('click', async () => {
    const confirmar = confirm('¿Seguro que deseas restaurar las llaves por defecto? Se borrarán tus llaves personalizadas.')
    if (confirmar) {
      misLlaves = window.llavesPorDefecto ? [...window.llavesPorDefecto] : []
      await guardarYRefrescar()
    }
  })

  // Render inicial
  renderizarLista()
}
