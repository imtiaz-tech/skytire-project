import Link from "next/link";
import Container from "@/components/storefront/Container";

const SELECT_CLASS =
  "h-[52px] w-full rounded border border-[#E6E7E9] bg-white px-4 text-[15px] text-[#0B0B0C] lg:h-12 lg:rounded-none lg:text-[14px]";

export default function VehicleFinder() {
  return (
    <section id="vehicle-finder" className="bg-white py-12 lg:py-16">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,485px)_minmax(0,699px)]">
          <div>
            <h2 className="font-display text-[32px] leading-none text-[#0B0B0C] lg:text-[64px] lg:leading-[1.15]">
              What fits
              <br />
              your ride?
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-[1.5] text-[#6B6B6E] lg:hidden">
              Tell us your vehicle and we&apos;ll show you only what fits.
            </p>
            <p className="mt-6 hidden max-w-md text-[16px] leading-[1.45] text-[#4B5563] lg:block">
              Our advanced fitment database ensures you get the perfect offset and tire width for
              your specific vehicle. No guesswork, just pure style.
            </p>
          </div>
          <form
            action="/products"
            method="get"
            className="lg:border lg:border-[#E6E7E9] lg:bg-white lg:p-10 lg:shadow-[0_12px_40px_rgba(11,11,12,0.06)]"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block text-[12px] font-medium text-[#6B6B6E]">
                <span className="mb-2 hidden lg:block">Select Year</span>
                <select name="year" defaultValue="" aria-label="Select Year" className={SELECT_CLASS}>
                  <option value="">Select Year</option>
                  <option value="2024">2024</option>
                  <option value="1964">1964</option>
                </select>
              </label>
              <label className="block text-[12px] font-medium text-[#6B6B6E]">
                <span className="mb-2 hidden lg:block">Select Make</span>
                <select name="make" defaultValue="" aria-label="Select Make" className={SELECT_CLASS}>
                  <option value="">Select Make</option>
                  <option value="Chevrolet">Chevrolet</option>
                </select>
              </label>
              <label className="block text-[12px] font-medium text-[#6B6B6E]">
                <span className="mb-2 hidden lg:block">Select Model</span>
                <select name="model" defaultValue="" aria-label="Select Model" className={SELECT_CLASS}>
                  <option value="">Select Model</option>
                  <option value="Impala">Impala</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-6 h-[52px] w-full rounded bg-[#0B0B0C] font-nav text-[14px] font-bold uppercase tracking-[0.1em] text-white lg:h-12 lg:rounded-none lg:text-[12px]"
            >
              Find My Fit
            </button>
            <div className="mt-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#E6E7E9]" aria-hidden />
              <span className="text-[12px] uppercase tracking-[0.16em] text-[#9CA3AF]">OR</span>
              <span className="h-px flex-1 bg-[#E6E7E9]" aria-hidden />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded border border-[#0B0B0C] text-[13px] font-medium text-[#0B0B0C] lg:rounded-none"
              >
                Shop By Size
              </Link>
              <Link
                href="/brands"
                className="inline-flex h-11 items-center justify-center rounded border border-[#0B0B0C] text-[13px] font-medium text-[#0B0B0C] lg:rounded-none"
              >
                Shop By Brand
              </Link>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}
