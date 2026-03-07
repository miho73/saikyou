import {useEffect, useRef, useState} from "react";
import Opcodes from "../core/background";
import QuartileChart from "./elements/charts/QuartileChart";
import Alert from "./elements/Alert";

function PingCounter() {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [RTTs, setRTTs] = useState<number[]>([]);
  const [expectedRTT, setExpectedRTT] = useState<number>(0);
  const [rttDev, setRttDev] = useState<number>(0);
  const [isReasonable, setIsReasonable] = useState<boolean>(true);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // client측 메세지 핸들러
  function handleMessage(message: any) {
    switch (message.opcode) {
      case Opcodes.OK: {
        if (message.for === Opcodes.START_CLOCK) setIsPinging(true);
        else if (message.for === Opcodes.STOP_CLOCK) setIsPinging(false);
        else if(message.for === Opcodes.RESET) {
          setRTTs([]);
          setExpectedRTT(0);
          setSuccessRate(null);
        }
        break;
      }
      case Opcodes.ERROR: {
        console.error("[CLOCK] instruction " + message.for + " has failed");
        break;
      }
      case Opcodes.PING: {
        setRTTs(message.data.rtt);
        setSuccessRate(Math.round(message.data.success * 1000 / (message.data.success + message.data.fail))/10);

        const estimate: {
          rtt: number;
          dev: number;
          ok: boolean;
        } | null = message.data.estimate;

        if(estimate) {
          setExpectedRTT(estimate.rtt);
          setRttDev(estimate.dev);
          setIsReasonable(estimate.ok);
        }
      }
    }
  }

  function resetMeasurement() {
    if(!portRef.current) return;

    setRTTs([]);
    setExpectedRTT(0);
    setRttDev(0);
    setSuccessRate(null);

    portRef.current.postMessage({
      opcode: Opcodes.RESET
    });
  }

  function stopMeasurement() {
    if(!portRef.current) return;

    portRef.current.postMessage({
      opcode: Opcodes.STOP_CLOCK
    });
  }

  function beginMeasurement() {
    if(!portRef.current) return;

    portRef.current.postMessage({
      opcode: Opcodes.START_CLOCK
    });
  }

  useEffect(() => {
    const port = chrome.runtime.connect({name: "ping-port"});
    portRef.current = port;

    port.onMessage.addListener(handleMessage);
    /* TODO: REMOVE BEFORE PRODUCTION
    port.postMessage({
      opcode: Opcodes.START_PING
    });
     */

    return () => {
      port.postMessage({
        opcode: Opcodes.STOP_CLOCK
      });
      port.disconnect();
    }
  }, []);

  return (
    <div>
      <p>RTT [ms]</p>
      <QuartileChart
        data={RTTs}
        marker={[expectedRTT]}
        className={"my-2"}
      />
      <div className={"flex items-center justify-between"}>
        {successRate && <p>예상: {expectedRTT} ms (σ = {rttDev}) / 성공률 {successRate}%</p>}
        {!successRate && <p>데이터가 없음</p>}
        <div className={"flex items-center justify-between gap-2"}>
          {isPinging && <button className={"px-2 py-0.5 cursor-pointer"} onClick={stopMeasurement}>측정 중단</button>}
          {!isPinging && <button className={"px-2 py-0.5 cursor-pointer"} onClick={beginMeasurement}>측정 시작</button>}
          <button className={"px-2 py-0.5 cursor-pointer"} onClick={resetMeasurement}>측정 리셋</button>
        </div>
      </div>
      <div className={"flex gap-2 mt-2"}>
        { !isReasonable &&
          <Alert variant={"warning"} detail={"데이터가 충분히 모일떄까지 기다려주세요.\n이 경고가 지속되면 측정 리셋을 해주세요."}>예측 경고</Alert>
        }
        { (RTTs.length != 0 && RTTs[RTTs.length - 1]! > 1000) &&
          <Alert variant={"error"} detail={"인터넷 여건을 개선하세요."}>속도 경고</Alert>
        }
        { (RTTs.length != 0 && (RTTs[length - 1]! - RTTs[0]!) > 1000) &&
          <Alert variant={"error"} detail={"지연시간이 너무 가변적입니다.\n네트워크 여견이 바뀌였을 수 있으니 측정 리셋을 권장합니다."}>변동성 경고</Alert>
        }
      </div>
    </div>
  )
}

export default PingCounter;
