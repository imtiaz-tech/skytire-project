import api from "@/lib/api";
import { Tire } from "@/features/tires/types";
import Image from "next/image";
import Link from "next/link";


export const revalidate = 3600;

async function getFeaturedTires(): Promise<Tire[]> {
  try {
    const { data } = await api.get("/tires");
    return Array.isArray(data) ? data.slice(0, 4) : [];
  } catch (error) {
    console.error("Error fetching featured tires:", error);
    return [];
  }
}

export default async function Home() {
  const tires = await getFeaturedTires();

  return (
    <div className="bg-white dark:bg-black">
      {/* Hero Section */}
      <div className="relative bg-zinc-900 h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <div className="w-full h-full bg-gradient-to-br from-blue-700 to-black" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-2xl">
            Unleash Peak Performance with SkyTire
          </h1>
          <p className="mt-6 text-xl text-zinc-300 max-w-xl">
            Premium tires and custom wheels engineered for those who demand excellence on every road.
          </p>
          <div className="mt-10 flex gap-4 justify-center sm:justify-start">
            <Link
              href="/products"
              className="inline-block bg-white px-8 py-3 border border-transparent rounded-md text-base font-medium text-black hover:bg-zinc-100 transition-colors"
            >
              Shop All Tires
            </Link>
            <Link
              href="/wheels"
              className="inline-block bg-transparent px-8 py-3 border border-white rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              Custom Wheels
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Featured Products
          </h2>
          <Link href="/products" className="text-blue-600 hover:text-blue-500 font-medium">
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {tires.length > 0 ? (
            tires.map((tire) => (
              <Link key={tire._id} href={`/products/${tire._id}`} className="group relative">
                <div className="w-full aspect-w-1 aspect-h-1 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-transform duration-300 group-hover:scale-[1.02]">
                  {tire.imageUrl ? (
                    <Image
                      src={tire.imageUrl}
                      alt={tire.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-center object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400">
                      Tire Image
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {tire.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{tire.brand}</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    ${tire.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
               No products found. Start by adding some tires in the admin panel.
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-zinc-100 dark:bg-zinc-950 py-20 border-y border-zinc-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-balance">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Upgrade your ride today.
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Expert advice, fast shipping, and a massive selection of high-performance tires and wheels.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
