import api from "@/lib/api";
import { Tire } from "@/features/tires/types";
import Image from "next/image";
import Link from "next/link";

// Mandatory rule: ISR on product pages
// For the catalog page, 60 seconds is a good balance
export const revalidate = 60;

async function getAllTires(): Promise<Tire[]> {
  try {
    const { data } = await api.get("/tires", {
      next: { revalidate: 60 }
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching tires:", error);
    return [];
  }
}

export default async function ProductsListPage() {
  const tires = await getAllTires();

  return (
    <div className="bg-zinc-50 dark:bg-black min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-10 text-balance">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-zinc-50 sm:text-4xl">
              All Tires
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Explore our full collection of high-performance tires for every vehicle type.
            </p>
          </div>
        </div>

        {/* Filters Placeholder - In a real app, these would be Server Components with Search Params */}
        <div className="mb-8 flex flex-wrap gap-4">
           {['All', 'Summer', 'Winter', 'All-Season', 'Off-Road'].map((category) => (
             <button key={category} className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
               {category}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {tires.length > 0 ? (
            tires.map((tire) => (
              <Link key={tire._id} href={`/products/${tire._id}`} className="group">
                <div className="w-full aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                  {tire.imageUrl ? (
                    <Image
                      src={tire.imageUrl}
                      alt={tire.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-center object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                      Tire Image
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {tire.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4">{tire.brand}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-black text-black dark:text-zinc-100">
                      ${tire.price.toFixed(2)}
                    </p>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {tire.size}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <p className="text-xl text-zinc-500">No tires available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
