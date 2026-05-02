import {getPrinciple} from "../principle";

async function getTimeFromIdol() {
  const sentAt = performance.now();

  const principle = getPrinciple();
  const response = await fetch("https://idol.ionya.ooo/time", {
    method: "GET",
    cache: "no-store",
    headers: principle ? {"X-Principle": principle} : undefined
  });

  if (!response.ok) {
    console.error("Failed to fetch time from NTP server.");
    throw new Error("Failed to fetch time from NTP server.");
  }

  const data = await response.json();

  const receivedAt = performance.now();

  const rtt2 = Math.round((receivedAt - sentAt) / 2);

  const serverTime = new Date(data["time"]);
  const krissTime = new Date(data["kriss"]);

  return {
    time: {
      server: serverTime,
      kriss: krissTime,
    },
    RTT2: rtt2
  }
}

const TARGET_URL = import.meta.env.VITE_TARGET_URL;

async function getDateHeader() {
  const beginMark = performance.now();
  const controller = new AbortController();

  const res = await fetch(
    TARGET_URL,
    {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    }
  );
  const endMark = performance.now();
  const rtt = endMark - beginMark;
  controller.abort();

  const dateHeader = res.headers.get("Date");
  if (dateHeader) return dateHeader;
  else throw new Error("No header");
}

export {
  getTimeFromIdol,
}
