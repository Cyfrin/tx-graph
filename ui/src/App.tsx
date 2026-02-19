import { useLayoutEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import { Provider as AppProvider, useAppContext } from "./contexts/App"
import { Provider as WindowSizeProvider } from "./contexts/WindowSize"
import { Provider as FileWatchProvider } from "./contexts/FileWatch"
import HomePage from "./pages/HomePage"
import TxPage from "./pages/TxPage"

function App() {
  const app = useAppContext()

  useLayoutEffect(() => {
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
        <FileWatchProvider>
          <App />
          <ToastContainer theme="dark" />
        </FileWatchProvider>
      </AppProvider>
    </WindowSizeProvider>
  )
}
