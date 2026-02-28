import Opcodes from "./background";

let pingInterval: (ReturnType<typeof setInterval> | null) = null;

const TARGET_URL = "https://google.com";

interface PingResult {
  timestamp: number;
  rtt: number;
}

const EWMA_ALPHA = 0.1;
const MAX_RTT_HISTORY = 30;

const pingResults: PingResult[] = [];
const failedPings: PingResult[] = [];
let RTTs: number[] = [];
let expectedRTT: number = -1;

let pingPort: chrome.runtime.Port;

function setChromeComPort(port: chrome.runtime.Port) {
  pingPort = port;

  pingPort.onMessage.addListener(handlePingMessage);
  pingPort.onDisconnect.addListener(() => {
    stopPing();
  });
}

function handlePingMessage(msg: any) {
  switch (msg.opcode) {
    case Opcodes.START_PING: {
      const ok = ping();
      pingPort.postMessage({
        opcode: ok ? Opcodes.OK : Opcodes.ERROR,
        for: msg.opcode
      });
      break
    }
    case Opcodes.STOP_PING: {
      const ok = stopPing();
      pingPort.postMessage({
        opcode: ok ? Opcodes.OK : Opcodes.ERROR,
        for: msg.opcode
      });
      break;
    }
    case Opcodes.RESET: {
      pingResults.length = 0;
      failedPings.length = 0;
      RTTs.length = 0;
      expectedRTT = -1;

      pingPort.postMessage({
        opcode: Opcodes.OK,
        for: msg.opcode
      });
      break;
    }
    default: {
      console.error("[PING] " + msg + " is not a valid opcode.");
    }
  }
}

function ping(): boolean {
  if (pingInterval) return false;

  pingInterval = setInterval(async () => {
    const beginMark = performance.now();
    const controller = new AbortController();

    try {
      // ping 전송
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
      const serverTime = res.headers.get("Date");
      controller.abort();

      if(pingResults.length > MAX_RTT_HISTORY) {
        const removed = pingResults.shift()!;
        const removedRTT = removed.rtt;
        const idx = RTTs.findIndex(rtt => rtt === removedRTT);
        if(idx !== -1) RTTs.splice(idx, 1);
      }

      pingResults.push({
        timestamp: Date.now(),
        rtt: rtt,
      });

      // RTT 배열에 RTT 삽입(분할정복 정렬)
      let left = 0, right = RTTs.length - 1;
      while(left <= right) {
        const mid = Math.floor((left + right) / 2);

        if(RTTs[mid]! == rtt) {
          left = mid;
          break;
        }
        else if(RTTs[mid]! < rtt) left = mid + 1;
        else right = mid - 1;
      }
      RTTs.splice(left, 0, rtt);

      // 예상 RTT 계산
      if(expectedRTT == -1) expectedRTT = rtt;
      else {
        const q1 = RTTs[Math.floor(RTTs.length * 0.25)]!;
        const q3 = RTTs[Math.floor(RTTs.length * 0.75)]!;
        const IQR = q3 - q1;
        if(rtt >= q1 - 1.5 * IQR && rtt <= q3 + 1.5 * IQR)
          expectedRTT = EWMA_ALPHA * rtt + (1 - EWMA_ALPHA) * expectedRTT;
      }

    } catch (e) {
      console.error("Ping failed: ", e);
      failedPings.push({
        timestamp: Date.now(),
        rtt: -1,
      });
    }

    pingPort.postMessage({
      opcode: Opcodes.PING_RESULT,
      data: {
        expectedRTT: Math.round(expectedRTT),
        rtt: RTTs,
        success: pingResults.length,
        fail: failedPings.length
      }
    });
  }, 1000);
  return true;
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    return true;
  }
  return false;
}

export default setChromeComPort;
