import { contextBridge, ipcRenderer } from 'electron'
import type { LoginCredentials } from '../src/shared/types/auth'

console.log('[preload] loaded')

contextBridge.exposeInMainWorld('clinfy', {
    app: {
        ping: () => {
            console.log('[preload] app.ping called')
            return ipcRenderer.invoke('app:ping')
        },
    },
    auth: {
        login: (credentials: LoginCredentials) => {
            return ipcRenderer.invoke('auth:login', credentials)
        },
        getSessionStatus: () => {
            return ipcRenderer.invoke('auth:session-status')
        },
        getSessionContext: () => {
            return ipcRenderer.invoke('auth:session-context')
        },
        logout: () => {
            return ipcRenderer.invoke('auth:logout')
        },
    },
})
