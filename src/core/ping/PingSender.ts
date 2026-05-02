import Opcodes from "../background";
import {next, reset, stat} from "./PingRecorder";

interface PingResult {
  rtt: number;
  success: boolean;
}

const TARGET_URL = import.meta.env.VITE_TARGET_URL;
const FAST_INTERVAL = 1000;
const SLOW_INTERVAL = 5000;
const STABILITY_WINDOW = 10;
const STABILITY_THRESHOLD_MS = 1;

let pingInterval: (ReturnType<typeof setInterval> | null) = null;
let pingPort: chrome.runtime.Port;
let currentIntervalMs = FAST_INTERVAL;

const RTTs: number[] = [];
const pings: PingResult[] = [];
let failedPings = 0;
const meanHistoryMs: number[] = [];

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
    case Opcodes.START_PING: {
      const ok = pingSender();
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
      RTTs.length = 0;
      pings.length = 0;
      failedPings = 0;
      meanHistoryMs.length = 0;
      reset();

      // 진행 중인 경우 fast interval로 재시작
      if (pingInterval) {
        clearInterval(pingInterval);
        currentIntervalMs = FAST_INTERVAL;
        pingInterval = setInterval(doPing, FAST_INTERVAL);
      } else {
        currentIntervalMs = FAST_INTERVAL;
      }

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

// 전송 주기 전환
function switchInterval(ms: number) {
  if (currentIntervalMs === ms || !pingInterval) return;
  currentIntervalMs = ms;
  clearInterval(pingInterval);
  pingInterval = setInterval(doPing, ms);
}

// 단일 핑 전송 및 안정성 체크
async function doPing() {
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

    // 전송 주기 적응형 조절
    const meanMs = Math.exp(s.mean);
    meanHistoryMs.push(meanMs);
    if (meanHistoryMs.length > STABILITY_WINDOW) meanHistoryMs.shift();

    if (meanHistoryMs.length >= STABILITY_WINDOW) {
      const range = Math.max(...meanHistoryMs) - Math.min(...meanHistoryMs);
      if (currentIntervalMs === FAST_INTERVAL && range < STABILITY_THRESHOLD_MS) {
        switchInterval(SLOW_INTERVAL);
      } else if (currentIntervalMs === SLOW_INTERVAL && range >= STABILITY_THRESHOLD_MS) {
        meanHistoryMs.length = 0;
        switchInterval(FAST_INTERVAL);
      }
    }

    // 결과 전송
    pingPort.postMessage({
      opcode: Opcodes.PING_RESULT,
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
      opcode: Opcodes.PING_RESULT,
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
}

// 핑 전송 시작
function pingSender(): boolean {
  if (pingInterval) return false;

  currentIntervalMs = FAST_INTERVAL;
  pingInterval = setInterval(doPing, currentIntervalMs);
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
