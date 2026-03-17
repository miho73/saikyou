import {useEffect, useRef, useState} from "react";
import Opcodes from "../../core/background";
import QuartileChart from "../elements/charts/QuartileChart";
import Alert from "../elements/Alert";
import {useAppDispatch, useAppSelector} from "../../core/hook/ReduxHooks";
import {pingStatisticsAction} from "../../core/redux/PingStatisticsReducer";

function PingStatistics() {
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [RTTs, setRTTs] = useState<number[]>([]);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  const meanRTT = useAppSelector(state => state.PingStatisticsReducer.mean);
  const stddevRTT = useAppSelector(state => state.PingStatisticsReducer.stddev);

  const dispatch = useAppDispatch();

  // client측 메세지 핸들러
  function handleMessage(message: any) {
    switch (message.opcode) {
      case Opcodes.OK: {
        if (message.for === Opcodes.START_CLOCK) setIsPinging(true);
        else if (message.for === Opcodes.STOP_CLOCK) setIsPinging(false);
        else if(message.for === Opcodes.RESET) {
          setRTTs([]);
          dispatch(pingStatisticsAction.update({
            mean: 0,
            stddev: 0,
          }));
          setSuccessRate(null);
        }
        break;
      }
      case Opcodes.ERROR: {
        console.error("[CLOCK] instruction " + message.for + " has failed");
        break;
      }
      case Opcodes.PING: {
        const success = message.data.rtt.length;
        const fails = message.data.fail;

        setRTTs(message.data.rtt);
        setSuccessRate(Math.round(success * 1000 / (fails + success))/10);

        const stat: {
          mean: number;
          stddev: number;
        } = message.data.stat;

        if(stat) {
          dispatch(pingStatisticsAction.update({
            mean: stat.mean,
            stddev: stat.stddev,
          }));
        }
      }
    }
  }

  function resetMeasurement() {
    if(!portRef.current) return;

    setRTTs([]);
    dispatch(pingStatisticsAction.update({
      mean: 0,
      stddev: 0,
    }));
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
    port.postMessage({
      opcode: Opcodes.START_CLOCK
    });

    return () => {
      port.postMessage({
        opcode: Opcodes.STOP_CLOCK
      });
      port.disconnect();
    }
  }, []);

  const mu  = Math.exp(meanRTT);
  const upper95 = Math.exp(meanRTT + 1.96 * stddevRTT);
  const lower95 = Math.exp(meanRTT - 1.96 * stddevRTT);

  return (
    <div>
      <p className={"text-lg font-medium"}>지연시간 통계</p>
      <QuartileChart
        data={RTTs}
        marker={[mu]}
        className={"my-2"}
      />
      <div className={"flex items-center justify-between"}>
        {successRate && <p>평균: {Math.round(mu * 100) / 100} ms, 95%: {Math.round(lower95*100)/100} / 성공률 {successRate}%</p>}
        {!successRate && <p>데이터 없음</p>}
        <div className={"flex items-center justify-between gap-2"}>
          {isPinging && <button className={"px-2 py-0.5 cursor-pointer"} onClick={stopMeasurement}>측정 중단</button>}
          {!isPinging && <button className={"px-2 py-0.5 cursor-pointer"} onClick={beginMeasurement}>측정 시작</button>}
          <button className={"px-2 py-0.5 cursor-pointer"} onClick={resetMeasurement}>측정 리셋</button>
        </div>
      </div>
    </div>
  )
}

export default PingStatistics;
