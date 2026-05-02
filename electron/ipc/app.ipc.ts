import { ipcMain } from 'electron'

export function registerAppIpc() {
    ipcMain.handle('app:ping', async () => {
        console.log('[main] app:ping received')

        return {
            success: true,
            message: 'pong from Electron main process',
        }
    })
}