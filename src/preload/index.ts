import { contextBridge, ipcRenderer } from 'electron'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      // 以下是提供的接口
      billboard: () => ipcRenderer.invoke('billboard'),
      vocadbSearch: (keyword, page) => ipcRenderer.invoke('vocadb-search', {
        keyword: keyword,
        page: page
      }),
      vocadbGet: (id) => ipcRenderer.invoke('vocadb-get' ,{
        id: id
      })
      // 以上是提供的接口
    })
  } catch (error) {
    console.error(error)
  }
} else {
  console.log('Context must be isolated.')
}
