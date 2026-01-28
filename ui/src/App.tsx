import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Provider as AppProvider, useAppContext } from "./contexts/App"
import { Provider as WindowSizeProvider } from "./contexts/WindowSize"
import HomePage from "./pages/HomePage"
import TxPage from "./pages/TxPage"
import "./files"

function App() {
  const app = useAppContext()

  useEffect(() => {
    app.init()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="tx/:txHash" element={<TxPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default () => {
  return (
    <WindowSizeProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </WindowSizeProvider>
  )
}
