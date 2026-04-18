import api from "@/lib/api";
import { Tire } from "@/features/tires/types";
import Image from "next/image";
import { notFound } from "next/navigation";

// Mandatory rule: ISR on product pages
export const revalidate = 60;

/**
 * Data fetching in Server Component using native fetch (via api utility)
 * Native fetch enables ISR and caching as requested.
 */
async function getProduct(id: string): Promise<Tire> {
  try {
    const { data } = await api.get(`/tires/${id}`, {
      next: { revalidate: 60 },
    });
    return data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return notFound();
  }
}

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse">
            <div className="w-full aspect-w-1 aspect-h-1 bg-white rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-center object-cover"
                />
              ) : (
                <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 h-full">
                  <span className="text-zinc-400">No Image Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-zinc-50">
              {product.name}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-zinc-900 dark:text-zinc-100 font-bold">
                ${product.price ? product.price.toFixed(2) : "0.00"}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Brand</h3>
              <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">{product.brand}</p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Size</h3>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{product.size}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-zinc-700 dark:text-zinc-300 space-y-6">
                {product.description || "No description available for this high-performance tire."}
              </div>
            </div>

            <div className="mt-10 flex">
              <button
                type="button"
                className="max-w-xs flex-1 bg-black dark:bg-zinc-100 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 sm:w-full"
              >
                Add to Cart
              </button>
            </div>
            
            <div className="mt-4">
               <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                 Stock: {product.stock} units available
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
