import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/storefront/Icon";
import { IMG } from "@/lib/storefront/content";

const visualizerFinishes = [
  {
    name: "Chrome",
    selected: true,
    className: "bg-gradient-to-br from-[#F3F4F6] to-[#9CA3AF] border-2 border-[#C6A15B]",
  },
  {
    name: "Gold",
    className: "bg-gradient-to-br from-[#D4AF37] to-[#8B7322]",
  },
  {
    name: "Rose Gold",
    className: "bg-gradient-to-br from-[#E0BFB8] to-[#B76E79]",
  },
  {
    name: "Neon",
    className: "bg-[#39FF14] shadow-[0px_0px_8px_0px_rgba(57,255,20,0.5)]",
  },
] as const;

const visualizerSelects = [
  { label: "Vehicle", value: "’64 Impala" },
  { label: "Wheel", value: "Zenith 72" },
  { label: "Tire", value: "Vogue White" },
  { label: "Finish", value: "Chrome" },
] as const;

function VisualizerControls() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {visualizerSelects.map((item) => (
          <div
            key={item.label}
            className="rounded-[2px] border border-white/10 bg-white/5 p-4"
          >
            <p className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-[#6B7280]">
              {item.label}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="font-body text-[14px] font-semibold uppercase leading-[1.43] text-white">
                {item.value}
              </p>
              <Icon name="chevron-down" alt="" size={10} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-4 py-2">
        {visualizerFinishes.map((finish) => (
          <div
            key={finish.name}
            className={`flex flex-col items-center gap-2 ${finish.selected ? "" : "opacity-50"}`}
          >
            <span
              className={`h-10 w-10 rounded-full ${finish.className}`}
              aria-label={finish.selected ? `${finish.name}, selected` : finish.name}
            />
            <span className="font-body text-[9px] uppercase leading-[1.5] tracking-[-0.05em] text-white">
              {finish.name}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/#vehicle-finder"
        className="inline-flex h-[60px] w-full items-center justify-center gap-3 bg-white font-display text-[20px] uppercase leading-[1.4] text-[#0B0B0C]"
      >
        Visualize Your Ride
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}

export default function Visualizer() {
  return (
    <section className="bg-[#0B0B0C] py-16 lg:py-24">
      <div className="px-5 lg:hidden">
        <h2 className="font-display text-[48px] uppercase leading-[1.25] tracking-[-0.025em] text-white">
          See it on
          <br />
          your ride.
        </h2>

        <div className="relative mt-8 aspect-[346/259] w-full overflow-hidden rounded">
          <Image
            src={`${IMG}/visualizer-car.png`}
            alt="Red classic convertible with chrome wire wheels"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <div className="mt-8">
          <VisualizerControls />
        </div>
      </div>

      <div className="mx-auto hidden w-full max-w-[1280px] px-5 lg:block lg:px-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-0">
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

            <div className="mt-6">
              <VisualizerControls />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
