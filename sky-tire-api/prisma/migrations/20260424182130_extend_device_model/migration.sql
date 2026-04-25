-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "botDetected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "browserName" TEXT,
ADD COLUMN     "browserVersion" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device" TEXT,
ADD COLUMN     "firstSeenAt" TIMESTAMP(3),
ADD COLUMN     "incognito" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "os" TEXT,
ADD COLUMN     "proxyDetected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vpnDetected" BOOLEAN NOT NULL DEFAULT false;
