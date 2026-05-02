/// <reference types="chrome"/>

const STORAGE_KEY = "SAIKYOU-PRIP";

let cached: string | null = null;

async function getOrCreatePrinciple(): Promise<string> {
  if (cached) return cached;

  const stored: {
    [STORAGE_KEY]: string
  } = await chrome.storage.sync.get(STORAGE_KEY);

  if (stored[STORAGE_KEY]) {
    cached = stored[STORAGE_KEY] as string;
    return cached!;
  }

  const uuid = crypto.randomUUID();
  await chrome.storage.sync.set({[STORAGE_KEY]: uuid});
  cached = uuid;
  return uuid;
}

function getPrinciple(): string | null {
  return cached;
}

export {getOrCreatePrinciple, getPrinciple};
