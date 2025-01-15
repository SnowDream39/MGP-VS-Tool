import { contextBridge, ipcRenderer } from 'electron'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      // 以下是提供的接口
      billboard: () => ipcRenderer.invoke('billboard'),
      vocadbGet: (type: string, data) => ipcRenderer.invoke('vocadb', { type:type, data:data }),
      toEntry: (content) => ipcRenderer.invoke('to-entry', content),
      openExternal: (url: string) => ipcRenderer.send('open-external', url)
      // 以上是提供的接口
    })
  } catch (error) {
    console.error(error)
  }
} else {
  console.log('Context must be isolated.')
}
