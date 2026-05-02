import Opcodes from "../background";

async function getTimeFromIdol() {
  const sentAt = performance.now();

  const response = await fetch("https://idol.ionya.ooo/time", {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    console.error("Failed to fetch time from NTP server.");
    throw new Error("Failed to fetch time from NTP server.");
  }

  const data = await response.json();

  const receivedAt = performance.now();

  const rtt2 = Math.round((receivedAt - sentAt) / 2);

  const serverTime = new Date(data["time"]);
  const googleTime = new Date(data["google"]);
  const krissTime = new Date(data["kriss"]);
  const nistTime = new Date(data["nist"]);

  return {
    time: {
      server: serverTime,
      google: googleTime,
      kriss: krissTime,
      nist: nistTime,
    },
    RTT2: rtt2
  }
}

const TARGET_URL = "https://google.com";

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
