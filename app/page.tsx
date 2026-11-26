import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { FeaturedProducts } from "@/components/featured-products";
import { LifestyleCollections } from "@/components/lifestyle-collections";
import { CategoryStrip } from "@/components/category-strip";
import { ShopSection } from "@/components/shop-section";
import { BrandStrip } from "@/components/brand-strip";
import { Footer } from "@/components/footer";
import { PromoPopup } from "@/components/promo-popup";
export default function HomePage() {
  
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={null}>
          <CategoryStrip />
        </Suspense>

        <Hero />
        <LifestyleCollections />

        <Suspense fallback={null}>
          <FeaturedProducts />
        </Suspense>

        <Suspense fallback={null}>
          <ShopSection />
        </Suspense>
        <BrandStrip />
      </main>
      <Footer />
      <PromoPopup />
    </>
  );
}

// import Image from "next/image";

// export default function HomePage() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5F8F3] px-6 text-center">
//       <Image
//         src="/logo.png"
//         alt="Quanta Paper Corporation"
//         width={220}
//         height={64}
//         priority
//         className="h-14 w-auto"
//       />

//       <h1 className="mt-8 font-display text-3xl font-medium text-moss-900 sm:text-4xl">
//         We&apos;ll be right back
//       </h1>
//       <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
//         We&apos;re doing a bit of maintenance to make things better. Please
//         check back shortly — thanks for your patience.
//       </p>
//     </main>
//   );
// }
