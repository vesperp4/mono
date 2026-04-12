import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Pillars from '@/components/Pillars'
import Founders from '@/components/Founders'
import MissionVision from '@/components/MissionVision'
import Join from '@/components/Join'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main style={{background: '#020304'}}>
      <Navbar />
      <Hero />
      <About />
      <Pillars />
      <Founders />
      <MissionVision />
      <Join />
      <Footer />
    </main>
  )
}
