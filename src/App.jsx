import './index.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Nav, SubNav } from './components/Nav'
import { Hero } from './components/Hero'
import { GallerySection } from './components/GallerySection'
import { PromptsSection } from './components/PromptsSection'
import { Footer } from './components/Footer'
import { FavoritesDrawer } from './components/FavoritesDrawer'
import Admin from './pages/Admin'

function Home() {
  const [favOpen, setFavOpen] = useState(false)

  return (
    <>
      <Nav onFavClick={() => setFavOpen(true)} />
      <div style={{ paddingTop: 'var(--nav-height)' }}>
        <SubNav />
        <Hero />
        <GallerySection />
        <PromptsSection />
        <Footer />
      </div>
      <FavoritesDrawer open={favOpen} onClose={() => setFavOpen(false)} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
