import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import { HomeHero, FeatureStrip, ProductsSection, BuyerBanners, InfoRow } from './components/Home'
import Contact from './components/Contact'
import Faq from './components/Faq'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import { useReveal } from './lib'
import { ScrollProgress } from './components/Motion'

// Home page. Buying happens on the separate /shop page.
export default function App() {
  useReveal()
  const { hash, search } = useLocation()
  // arriving with a section link, e.g. /#contact or /?quote=export#contact
  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 120)
    return () => clearTimeout(t)
  }, [hash, search])
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main>
        <HomeHero />
        <FeatureStrip />
        <ProductsSection />
        <BuyerBanners />
        <InfoRow />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
