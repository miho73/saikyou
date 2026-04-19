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

const tolerance = 200, vote = 7;
const TARGET_URL = "https://google.com";
let voteLeft = 0, voteRight = 0;

function estimateServerMilliseconds(left: number = 0, right: number = 1000) {
  if(right - left < tolerance) {
    chrome.runtime.sendMessage({
      opcode: Opcodes.MS_ESTIMATED,
      date: "",
      ms: 205
    });
    return;
  }

  const mid = Math.floor((left + right) / 2);
  let t1: string | null, t2: string | null, t3: string | null;
  let wasError = false;

  const now = new Date().getMilliseconds();
  setTimeout(() => {
    getDateHeader()
      .then(date => {
        t1 = date;
      }).catch(() => {
        wasError = true;
      });
  }, 999 + left - now);
  setTimeout(() => {
    getDateHeader()
      .then(date => {
        t2 = date;
      }).catch(() => {
        wasError = true;
      });
  }, 999 + mid - now);
  setTimeout(() => {
    getDateHeader()
      .then(date => {
        t3 = date;

        if(wasError)
          throw wasError;
        if(!t1 || !t2)
          throw new Error("Order fault");

        const s1 = +t1.substring(23, 25);
        const s2 = +t2.substring(23, 25);
        const s3 = +t3.substring(23, 25);

        if(s1 > s2 || s2 > s3 || s1 > s3)
          throw new Error("Order fault");
        else if(s1 !== s2 && s1 !== s3)
          throw new Error("Order fault");
        else if(s1 === s2 && s2 === s3)
          throw new Error("Undeterminable");

        if(s1 < s2 && s2 === s3)
          voteLeft++;
        else if(s1 === s2 && s2 < s3)
          voteRight++;
        console.log("iteration completed", voteLeft, voteRight, left, right);

        wasError = false;
        if(voteLeft + voteRight === 7) {
          voteLeft = 0;
          voteRight = 0;
          console.log("Session Completed");

          if(voteLeft > voteRight) {
            setTimeout(() => {
              estimateServerMilliseconds(mid, right);
            }, 1500);
          }
          else if(voteLeft <= voteRight) {
            setTimeout(() => {
              estimateServerMilliseconds(left, mid);
            }, 1500);
          }
        }
        else {
          setTimeout(() => {
            estimateServerMilliseconds(left, right);
          }, 1500);
        }
      }).catch(e => {
        console.error(e);
        wasError = false;
        setTimeout(() => {
          estimateServerMilliseconds(left, right);
        }, 1500);
      });
  }, 999 + right - now);
}

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
  estimateServerMilliseconds
}
