import {useEffect, useRef, useState} from "react";
import Opcodes from "../core/background";
import QuartileChart from "./elements/charts/QuartileChart";
import Alert from "./elements/Alert";

function PingCounter() {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [RTTs, setRTTs] = useState<number[]>([]);
  const [expectedRTT, setExpectedRTT] = useState<number>(0);
  const [rttDev, setRttDev] = useState<number>(-1);
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
      <div className="flex gap-2 items-center">
        <p>RTT [ms]</p>
        { rttDev > 2 && <p className={"text-amber-200"}>초기화중</p> }
        { (rttDev > 0 && rttDev < 2) && <p className={"text-emerald-200"}>초기화 완료</p> }
      </div>
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
    </div>
  )
}

export default PingCounter;
