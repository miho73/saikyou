import {type ReactElement, useEffect, useRef, useState} from "react";
import Opcodes from "../core/background";
import Alert from "./elements/Alert";
import QuartileChart from "./elements/charts/QuartileChart";

function PingCounter() {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [RTTs, setRTTs] = useState<number[]>([]);
  const [expectedRTT, setExpectedRTT] = useState<number>(0);
  const [succeedPings, setSucceedPings] = useState<number>(0);
  const [failedPing, setFailedPing] = useState<number>(0);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  function handleMessage(message: any) {
    switch (message.opcode) {
      case Opcodes.OK: {
        if (message.for === Opcodes.START_PING) setIsPinging(true);
        else if (message.for === Opcodes.STOP_PING) setIsPinging(false);
        else if(message.for === Opcodes.RESET_MEASUREMENT) {
          setRTTs([]);
          setExpectedRTT(0);
          setSucceedPings(0);
          setFailedPing(0);
        }
        break;
      }
      case Opcodes.ERROR: {
        console.error("[PING] instruction " + message.for + " failed");
        break;
      }
      case Opcodes.PING_RESULT: {
        setRTTs(message.data.rtt);
        setExpectedRTT(message.data.expectedRTT);
        setSucceedPings(message.data.success);
        setFailedPing(message.data.fail);
      }
    }
  }
  function resetMeasurement() {
    if(!portRef.current) return;

    portRef.current.postMessage({
      opcode: Opcodes.RESET_MEASUREMENT
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
          {succeedPings + failedPing > 0 && <p>예상: {expectedRTT} ms / 성공률 {Math.round(succeedPings * 1000 / (succeedPings + failedPing)) / 10}%</p>}
          {succeedPings + failedPing == 0 && <p>데이터가 없습니다.</p>}
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
