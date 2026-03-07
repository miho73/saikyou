async function getTimeFromTimeNow() {
  const sentAt = performance.now();

  const response = await fetch("https://time.now/developer/api/ip", {
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

  return {
    timezone: data["abbreviation"],
    datetime: new Date(new Date(data["datetime"]).getTime() - rtt2),
    RTT2: rtt2
  }
}

export {
  getTimeFromTimeNow
}
