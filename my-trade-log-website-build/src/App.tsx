import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ScrollToTop } from "@/components/scroll-to-top"
import HomePage from "./pages/HomePage"
import TermsPage from "./pages/TermsPage"

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
