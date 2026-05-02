import { contextBridge, ipcRenderer } from 'electron'

console.log('[preload] loaded')

contextBridge.exposeInMainWorld('clinfy', {
    app: {
        ping: () => {
            console.log('[preload] app.ping called')
            return ipcRenderer.invoke('app:ping')
        },
    },
})