import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<string> | null = null;

export async function getVisitorId(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
      .then((fp) => fp.get())
      .then((res) => res.visitorId);
  }
  return fpPromise;
}
