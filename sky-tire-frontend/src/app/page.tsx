import type { Metadata } from "next";
import Header from "@/components/storefront/Header";
import Footer from "@/components/storefront/Footer";
import Hero from "@/components/storefront/home/Hero";
import TrustBar from "@/components/storefront/home/TrustBar";
import VehicleFinder from "@/components/storefront/home/VehicleFinder";
import ShopByCategory from "@/components/storefront/home/ShopByCategory";
import SpokeSeries from "@/components/storefront/home/SpokeSeries";
import ShopByLook from "@/components/storefront/home/ShopByLook";
import LegacySeries from "@/components/storefront/home/LegacySeries";
import TireShowcase from "@/components/storefront/home/TireShowcase";
import Packages from "@/components/storefront/home/Packages";
import Visualizer from "@/components/storefront/home/Visualizer";
import CultureBanner from "@/components/storefront/home/CultureBanner";
import WhySkyTire from "@/components/storefront/home/WhySkyTire";
import Financing from "@/components/storefront/home/Financing";
import Brands from "@/components/storefront/home/Brands";
import FeaturedProduct from "@/components/storefront/home/FeaturedProduct";
import PremiumServices from "@/components/storefront/home/PremiumServices";
import WhyChoose from "@/components/storefront/home/WhyChoose";
import Testimonials from "@/components/storefront/home/Testimonials";
import FinalCta from "@/components/storefront/home/FinalCta";
import { getHomeCatalog } from "@/lib/storefront/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sky Tire | Wire Wheels, Whitewall Tires & Lowrider Culture",
  description:
    "Shop Sky Tire for wire wheels, original whitewall tires, bolt-on wire wheels, and lowrider accessories. Fitment confidence and complete packages ready for the boulevard.",
};

export default async function Home() {
  const catalog = await getHomeCatalog();

  return (
    <div className="storefront flex min-h-full flex-1 flex-col">
      <Header />
      <main>
        <div className="hidden lg:block">
          <TrustBar />
        </div>
        <Hero banner={catalog.banner} />
        <VehicleFinder />
        <ShopByCategory />
        <SpokeSeries />
        <ShopByLook />
        <LegacySeries />
        <TireShowcase />
        <Packages />
        <Visualizer />
        <CultureBanner />
        <WhySkyTire />
        <Financing />
        <Brands brands={catalog.brands} />
        <FeaturedProduct product={catalog.featuredWheel} />
        <PremiumServices />
        <WhyChoose />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
