import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { HomePage } from '@/pages/home/HomePage'

function App() {
  return (
    <ThemeProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  )
}

export default App
