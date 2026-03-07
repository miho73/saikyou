import Opcodes from "../background";
import {next, currentEstimate, type KalmanFilterResult, reset} from "./kalman-filter";
import {isOutlier, isReasonableEstimate} from "./quartile-filter";

let pingInterval: (ReturnType<typeof setInterval> | null) = null;

const TARGET_URL = "https://google.com";

interface PingResult {
  rtt: number;
  success: boolean;
}

const MAX_RTT_HISTORY = 30;

const pingResults: PingResult[] = []; // 최근 30개의 모든 ping 기록
let RTTs: number[] = []; // 최근 30개 핑 중 성공한 RTT 시간을 정렬해서 저장
let failedPings: number = 0; // 최근 30번 ping 중 실패한 횟수

let pingPort: chrome.runtime.Port;

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
      const ok = ping_sender();
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
      pingResults.length = 0;
      failedPings = 0;
      RTTs.length = 0;

      pingPort.postMessage({
        opcode: Opcodes.OK,
        for: msg.opcode
      });
      reset();
      break;
    }
    default: {
      console.error("[PING] " + msg + " is not a valid opcode.");
    }
  }
}

// 핑 전송
function ping_sender(): boolean {
  if (pingInterval) return false;

  pingInterval = setInterval(async () => {
    const beginMark = performance.now();
    const controller = new AbortController();

    // 30개 이상 기록 있으면 pop
    if(pingResults.length > MAX_RTT_HISTORY) {
      const removed = pingResults.shift()!;
      if(removed.success) {
        const removedRTT = removed.rtt;
        const idx = RTTs.findIndex(rtt => rtt === removedRTT);
        if(idx !== -1) RTTs.splice(idx, 1);
      }
      else failedPings--;
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
      pingResults.push({
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

      let estimatedRTT: KalmanFilterResult | null;

      // 아웃라이어가 아니면 칼만필터에 삽입
      if(!isOutlier(rtt))
        estimatedRTT = next(rtt);
      else
        estimatedRTT = currentEstimate();

      const isThisOK: boolean | null = estimatedRTT ? isReasonableEstimate(estimatedRTT.rtt, estimatedRTT.dev) : null;

      // 결과 전송
      pingPort.postMessage({
        opcode: Opcodes.PING,
        data: {
          rtt: RTTs,
          estimate: (
            estimatedRTT ? {
              rtt: estimatedRTT.rtt,
              dev: estimatedRTT.dev,
              ok: isThisOK
            } : null
          ),
          success: RTTs.length,
          fail: failedPings
        }
      });
    } catch (e) {
      console.error("Ping failed: ", e);
      failedPings++;

      // 실패 기록 추가
      pingResults.push({
        rtt: -1,
        success: false
      });

      // 이전 추정 기록 전송
      const currentEstimateResult = currentEstimate();
      const isThisOK: boolean | null = currentEstimateResult ? isReasonableEstimate(currentEstimateResult.rtt, currentEstimateResult.dev) : null;

      pingPort.postMessage({
        opcode: Opcodes.PING,
        data: {
          rtt: RTTs,
          estimate: (
            currentEstimateResult ? {
              rtt: currentEstimateResult.rtt,
              dev: currentEstimateResult.dev,
              ok: isThisOK
            } : null
          ),
          success: RTTs.length,
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
