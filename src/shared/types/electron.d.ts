export {}

declare global {
    interface Window {
        clinfy: {
            app: {
                ping: () => Promise<{
                    success: boolean
                    message: string
                }>
            }
        }
    }
}