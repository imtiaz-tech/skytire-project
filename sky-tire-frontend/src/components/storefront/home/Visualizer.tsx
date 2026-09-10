import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/lib/storefront/content";

const finishes = [
  { name: "Chrome", color: "#F3F4F6", selected: true },
  { name: "Gold", color: "#C6A15B" },
  { name: "Black", color: "#000000" },
  { name: "Silver", color: "#9CA3AF" },
] as const;

export default function Visualizer() {
  return (
    <section className="bg-[#0B0B0C] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-0">
          <h2 className="font-display text-[48px] uppercase leading-[1.25] tracking-[-0.025em] text-white lg:hidden">
            See it on
            <br />
            your ride.
          </h2>

          <div className="relative lg:w-[749px] lg:shrink-0">
            <span
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 hidden h-40 w-40 border-l border-t border-[#C6A15B]/30 lg:block"
            />
            <div className="relative aspect-[346/259] overflow-hidden lg:aspect-auto lg:h-[520px]">
              <Image
                src={`${IMG}/visualizer-car.png`}
                alt="Red classic convertible with chrome wire wheels"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 749px, 100vw"
              />
              <div className="absolute bottom-4 right-4 flex items-center bg-[#0B0B0C]/80 px-4 py-4 backdrop-blur-[12px] lg:bottom-6 lg:right-6">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#9CA3AF]">
                    Model
                  </span>
                  <span className="font-body text-[14px] font-bold uppercase leading-[1.43] text-white">
                    64 Impala
                  </span>
                </div>
                <span aria-hidden className="mx-4 h-8 w-px bg-white/20" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#9CA3AF]">
                    Wheel
                  </span>
                  <span className="font-body text-[14px] font-bold uppercase leading-[1.43] text-[#C6A15B]">
                    13&quot; Chrome
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-[499px] lg:shrink-0 lg:pl-20">
            <h2 className="hidden font-display text-[60px] uppercase leading-[1.25] text-white lg:block">
              See it on
              <br />
              your ride.
            </h2>
            <p className="mt-4 font-body text-[16px] leading-[1.5] text-[#C9CDD1] lg:mt-4 lg:text-[18px] lg:leading-[1.56]">
              Use our visualization tool to see exactly how different setups transform your
              vehicle&apos;s stance.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:mt-6">
              <div className="border border-white/5 bg-[#202124] px-4 pb-[17.5px] pt-4">
                <p className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#6B7280]">
                  Vehicle
                </p>
                <p className="mt-1 font-body text-[14px] font-bold leading-[1.43] text-white">
                  Select
                </p>
                <p className="font-body text-[14px] font-bold leading-[1.43] text-white">
                  Year/Make/Model
                </p>
              </div>
              <div className="border border-white/5 bg-[#202124] px-4 pt-4 pb-4">
                <p className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#6B7280]">
                  Wheel
                </p>
                <p className="mt-1.5 font-body text-[14px] font-bold leading-[1.43] text-white">
                  13&quot; Rev-Master
                </p>
              </div>
              <div className="border border-white/5 bg-[#202124] px-4 py-4">
                <p className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#6B7280]">
                  Tire
                </p>
                <p className="mt-1.5 font-body text-[14px] font-bold leading-[1.43] tracking-[-0.01em] text-white">
                  155/80R13 Whitewall
                </p>
              </div>
              <div className="border border-white/5 bg-[#202124] px-4 py-4">
                <p className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#6B7280]">
                  Finish
                </p>
                <div className="mt-1 flex items-center">
                  {finishes.map((finish, index) => (
                    <span
                      key={finish.name}
                      className={`inline-flex h-5 w-5 rounded-full ${index === 0 ? "" : "ml-3"} ${
                        finish.selected
                          ? "shadow-[0_0_0_2px_#202124,0_0_0_4px_#C6A15B]"
                          : ""
                      }`}
                      style={{ backgroundColor: finish.color }}
                      aria-label={finish.selected ? `${finish.name}, selected` : finish.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/#vehicle-finder"
              className="mt-4 flex h-[52px] w-full items-center justify-center bg-white font-body text-[14px] font-bold uppercase leading-[1.43] tracking-[0.1em] text-[#0B0B0C]"
            >
              Launch Visualizer
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
