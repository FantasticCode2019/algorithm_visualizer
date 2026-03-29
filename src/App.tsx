import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './components/Home/HomePage'
import AlgorithmPage from './components/AlgorithmPage/AlgorithmPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/algorithm/:id" element={<AlgorithmPage />} />
      </Routes>
    </BrowserRouter>
  )
}