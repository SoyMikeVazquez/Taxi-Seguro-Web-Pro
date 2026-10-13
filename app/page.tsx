"use client";

import { useEffect } from "react";
import Header from "@/components/Header"; // Import newly created Header
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import WhyChooseUs from "@/components/Services"; // Renamed import to match logic
import About from "@/components/About";
import ActionCard from "@/components/ActionCard";
import Footer from "@/components/Footer";
import { trackEvent } from "@/lib/analytics";

export default function Home() {
  useEffect(() => {
    trackEvent("visita");
    // Also track initial visitor if API exists
    fetch('/api/track-visitor', { method: 'POST' }).catch(() => { });
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      {/* <TrustBar /> */}
      <WhyChooseUs />
      <About />
      <ActionCard />
      <Footer />
    </main>
  );
}
