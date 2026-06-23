import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { SocialProof } from '../components/SocialProof';
import { Features } from '../components/Features';
import { HowItWorks } from '../components/HowItWorks';
import { DashboardShowcase } from '../components/DashboardShowcase';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { FAQ } from '../components/FAQ';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen selection:bg-brand-purple/30">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <DashboardShowcase />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
