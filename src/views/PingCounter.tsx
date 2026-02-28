import {type ReactElement, useEffect, useRef, useState} from "react";
import Opcodes from "../core/background";
import Alert from "./elements/Alert";
import QuartileChart from "./elements/charts/QuartileChart";

function PingCounter() {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [RTTs, setRTTs] = useState<number[]>([]);
  const [expectedRTT, setExpectedRTT] = useState<number>(0);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  function handleMessage(message: any) {
    switch (message.opcode) {
      case Opcodes.OK: {
        if (message.for === Opcodes.START_PING) setIsPinging(true);
        else if (message.for === Opcodes.STOP_PING) setIsPinging(false);
        else if(message.for === Opcodes.RESET) {
          setRTTs([]);
          setExpectedRTT(0);
          setSuccessRate(null);
        }
        break;
      }
      case Opcodes.ERROR: {
        console.error("[PING] instruction " + message.for + " has failed");
        break;
      }
      case Opcodes.PING_RESULT: {
        setRTTs(message.data.rtt);
        setExpectedRTT(message.data.expectedRTT);
        setSuccessRate(Math.round(message.data.success * 1000 / (message.data.success + message.data.fail))/10);
      }
    }
  }
  function resetMeasurement() {
    if(!portRef.current) return;

    portRef.current.postMessage({
      opcode: Opcodes.RESET
    });
  }
  function stopMeasurement() {
    if(!portRef.current) return;

    portRef.current.postMessage({
      opcode: Opcodes.STOP_PING
    });
  }
  function beginMeasurement() {
    if(!portRef.current) return;

    portRef.current.postMessage({
      opcode: Opcodes.START_PING
    });
  }

  useEffect(() => {
    const port = chrome.runtime.connect({name: "ping-port"});
    portRef.current = port;

    port.onMessage.addListener(handleMessage);
    port.postMessage({
      opcode: Opcodes.START_PING
    });

    return () => {
      port.postMessage({
        opcode: Opcodes.STOP_PING
      });
      port.disconnect();
    }
  }, []);

  return (
    <div>
      <button className={"flex items-center gap-3"}>측정 통계 보기</button>
      <div>
        <p>RTT [ms]</p>
        <QuartileChart
          data={RTTs}
          className={"my-2"}
        />
        <div className={"flex items-center justify-between"}>
          {successRate && <p>예상: {expectedRTT} ms / 성공률 {successRate}%</p>}
          {!successRate && <p>데이터가 없습니다.</p>}
          <div className={"flex items-center justify-between gap-2"}>
            {isPinging && <button className={"px-2 py-0.5 cursor-pointer"} onClick={stopMeasurement}>측정 중단</button>}
            {!isPinging && <button className={"px-2 py-0.5 cursor-pointer"} onClick={beginMeasurement}>측정 시작</button>}
            <button className={"px-2 py-0.5 cursor-pointer"} onClick={resetMeasurement}>측정 리셋</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PingCounter;
