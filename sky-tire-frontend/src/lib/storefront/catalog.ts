import { prisma } from "@/lib/prisma";
import { getUploadImageUrl } from "@/lib/uploadImageUrl";
import {
  DEFAULT_BANNER,
  getOrCreateBannerSettings,
  serializeBanner,
  type BannerData,
} from "@/lib/bannerValidation";
import { IMG } from "@/lib/storefront/content";

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  href: string;
  image: string;
  price: number;
  stock: number;
  size?: string;
  loadIndex?: string;
  speedRating?: string;
  rating: number;
  reviewCount: number;
  fallbackImage: string;
};

export type CatalogBrand = {
  id: string;
  name: string;
  logo: string;
  category: string;
  count: number;
};

function firstImage(images: string[] | undefined, fallback: string) {
  const src = images?.find(Boolean);
  return src ? getUploadImageUrl(src) : fallback;
}

function ratingFromId(id: string) {
  let hash = 0;
  for (const character of id) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const ratings = [5, 5, 5, 4.5, 4];
  return {
    rating: ratings[hash % ratings.length],
    reviewCount: 56 + (hash % 290),
  };
}

export async function getHomeCatalog(): Promise<{
  whitewalls: CatalogProduct[];
  blackwalls: CatalogProduct[];
  featuredWheel: CatalogProduct | null;
  brands: CatalogBrand[];
  banner: BannerData;
}> {
  try {
    const [whitewallRows, blackwallRows, featuredWheelRow, brandRows, bannerSettings] =
      await Promise.all([
        prisma.tire.findMany({
          where: {
            publishStatus: "PUBLISHED",
            isActive: true,
            sidewallCategory: "WHITE_WALL",
          },
          include: { model: { include: { brand: true } } },
          orderBy: { updatedAt: "desc" },
          take: 4,
        }),
        prisma.tire.findMany({
          where: {
            publishStatus: "PUBLISHED",
            isActive: true,
            sidewallCategory: "BLACK_WALL",
          },
          include: { model: { include: { brand: true } } },
          orderBy: { updatedAt: "desc" },
          take: 4,
        }),
        prisma.wireWheel.findFirst({
          where: { status: "published", isVisible: true, isActive: true },
          include: { brand: true },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.brand.findMany({
          orderBy: { brandName: "asc" },
          include: {
            _count: {
              select: {
                models: true,
                wheels: true,
                wireWheels: true,
                boltOnWireWheels: true,
                accessories: true,
              },
            },
          },
        }),
        getOrCreateBannerSettings(prisma as never),
      ]);

    const mapTire = (tire: (typeof whitewallRows)[number], fallback: string): CatalogProduct => {
      const { rating, reviewCount } = ratingFromId(tire.id);
      const loadSpeed = [tire.loadIndex, tire.speedRating].filter(Boolean).join("");

      return {
        id: tire.id,
        name: [tire.model.brand.brandName, tire.model.modelName, tire.tireSize, loadSpeed, tire.sidewallDetail]
          .filter(Boolean)
          .join(" "),
        brand: tire.model.brand.brandName,
        href: `/products/${tire.id}`,
        image: fallback,
        price: tire.salePrice || tire.regularPrice,
        stock: tire.stock,
        size: tire.tireSize || undefined,
        loadIndex: tire.loadIndex || undefined,
        speedRating: tire.speedRating || undefined,
        rating,
        reviewCount,
        fallbackImage: fallback,
      };
    };

    const serialized = serializeBanner(bannerSettings);
    const bannerData: BannerData = {
      backgroundImage: serialized.backgroundImage,
      countdownEndDate: serialized.countdownEndDate,
      countdownText: serialized.countdownText,
      headlineSegments: serialized.headlineSegments,
      subheadlineSegments: serialized.subheadlineSegments,
      buttonColor: serialized.buttonColor,
      buttonText: serialized.buttonText,
      ratingValue: serialized.ratingValue,
      ratingText: serialized.ratingText,
      ratingTextColor: serialized.ratingTextColor,
      ratingBgColor: serialized.ratingBgColor,
    };

    return {
      whitewalls: whitewallRows.map((tire, i) =>
        mapTire(tire, `${IMG}/tire-white-${(i % 4) + 1}.png`)
      ),
      blackwalls: blackwallRows.map((tire, i) =>
        mapTire(tire, `${IMG}/tire-black-${(i % 4) + 1}.png`)
      ),
      featuredWheel: featuredWheelRow
        ? {
            id: featuredWheelRow.id,
            name: featuredWheelRow.name,
            brand: featuredWheelRow.brand?.brandName || "Sky Tire",
            href: `/wire-wheels/${featuredWheelRow.slug}`,
            image: firstImage(featuredWheelRow.images, `${IMG}/featured-wheel.png`),
            price: featuredWheelRow.salePrice || featuredWheelRow.regularPrice,
            stock: featuredWheelRow.stock,
            size: featuredWheelRow.size,
            fallbackImage: `${IMG}/featured-wheel.png`,
            ...ratingFromId(featuredWheelRow.id),
          }
        : null,
      brands: brandRows
        .map((brand) => ({
          id: brand.id,
          name: brand.brandName,
          logo: getUploadImageUrl(brand.brandLogo),
          category: brand.category,
          count:
            brand._count.models +
            brand._count.wheels +
            brand._count.wireWheels +
            brand._count.boltOnWireWheels +
            brand._count.accessories,
        }))
        .filter((brand) => brand.count > 0),
      banner: bannerData,
    };
  } catch (error) {
    console.error("Error loading storefront catalog:", error);
    return {
      whitewalls: [],
      blackwalls: [],
      featuredWheel: null,
      brands: [],
      banner: DEFAULT_BANNER,
    };
  }
}
