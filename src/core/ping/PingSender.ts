import Opcodes from "../background";
import {next, reset, stat} from "./PingRecorder";

interface PingResult {
  rtt: number;
  success: boolean;
}

const TARGET_URL = "https://google.com";
let pingInterval: (ReturnType<typeof setInterval> | null) = null;
let pingPort: chrome.runtime.Port;

const RTTs: number[] = [];
const pings: PingResult[] = [];
let failedPings = 0;

// 연락 채널 설정
function setChromeComPort(port: chrome.runtime.Port) {
  pingPort = port;

  pingPort.onMessage.addListener(handlePingMessage);
  pingPort.onDisconnect.addListener(() => {
    stopPing();
  });
}

// 시작 / 중단 / 리셋 메시지 핸들러
function handlePingMessage(msg: any) {
  switch (msg.opcode) {
    case Opcodes.START_CLOCK: {
      const ok = pingSender();
      pingPort.postMessage({
        opcode: ok ? Opcodes.OK : Opcodes.ERROR,
        for: msg.opcode
      });
      break
    }
    case Opcodes.STOP_CLOCK: {
      const ok = stopPing();
      pingPort.postMessage({
        opcode: ok ? Opcodes.OK : Opcodes.ERROR,
        for: msg.opcode
      });
      break;
    }
    case Opcodes.RESET: {
      RTTs.length = 0;
      pings.length = 0;
      failedPings = 0;
      reset();

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

// 핑 전송
function pingSender(): boolean {
  if (pingInterval) return false;

  pingInterval = setInterval(async () => {
    const beginMark = performance.now();
    const controller = new AbortController();

    if(pings.length > 60) {
      const oldest_ping = pings.shift()!;
      if(oldest_ping.success) {
        const idx = RTTs.indexOf(oldest_ping.rtt);
        if(idx > -1) RTTs.splice(idx, 1);
      }
      else {
        failedPings--;
      }
    }

    try {
      // 핑 전송 & RTT 측정
      await fetch(
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

      // 성공 기록 추가
      pings.push({
        rtt: rtt,
        success: true
      });

      // RTTs 배열에 RTT 삽입(분할정복 정렬)
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

      // 통계처리
      next(rtt);
      const s = stat();

      // 결과 전송
      pingPort.postMessage({
        opcode: Opcodes.PING,
        data: {
          rtt: RTTs,
          stat: {
            mean: s.mean,
            stddev: s.stddev,
          },
          fail: failedPings
        }
      });
    } catch (e) {
      console.error("Ping failed: ", e);

      // 실패 기록 추가
      pings.push({
        rtt: -1,
        success: false
      });
      failedPings++;

      // 이전 추정 기록 전송
      const s = stat();

      pingPort.postMessage({
        opcode: Opcodes.PING,
        data: {
          rtt: RTTs,
          stat: {
            mean: s.mean,
            stddev: s.stddev,
          },
          fail: failedPings
        }
      });
    }
  }, 1000);
  return true;
}

// 핑 전송 중단
function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    return true;
  }
  return false;
}

export default setChromeComPort;
export {
  RTTs
}
