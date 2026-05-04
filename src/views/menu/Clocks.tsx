/// <reference types="chrome"/>
import {useEffect, useState} from "react";
import {ArrowClockwise} from "../../assets/symbol/svg";
import Opcodes from "../../core/background";

function dateToTimeString(date: Date | null): string {
  if (!date) return "--:--:--.---";

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function Clocks({show}: { show: boolean }) {
  const [isFolding, setIsFolding] = useState<boolean>(true);

  const [localTime, setLocalTime] = useState<Date | null>(null);
  const [idolTime, setIdolTime] = useState<Date | null>(null);
  const [krissTime, setKrissTime] = useState<Date | null>(null);

  const [resetting, setResetting] = useState<number>(0);

  useEffect(() => {
    resetClocks();
  }, []);

  function reduceResetting() {
    setResetting(v => Math.max(0, v - 1));
  }

  function resetClocks() {
    setResetting(1);

    setIdolTime(null);
    setKrissTime(null);

    setLocalTime(new Date());

    chrome.runtime.sendMessage(
      {opcode: Opcodes.GET_TIME},
      (response) => {
        if (response && response.opcode === Opcodes.TIME_RESULT) {
          const rtt2: number = response.RTT2;
          setIdolTime(new Date(new Date(response.time.server).getTime() - rtt2));
          setKrissTime(new Date(new Date(response.time.kriss).getTime() - rtt2));
        }
        reduceResetting();
      }
    );
  }

  const idolDelta = (
    (idolTime && localTime) ? Math.abs(idolTime.getTime() - localTime.getTime()) : null
  );
  const krissDelta = (
    (krissTime && localTime) ? Math.abs(krissTime.getTime() - localTime.getTime()) : null
  );

  if (!show) return;
  if (isFolding) {
    return (
      <div className="flex flex-col gap-y-2">
        <div className="flex gap-x-3 items-center">
          <button
            className={"font-medium cursor-pointer w-full text-left"}
            onClick={() => setIsFolding(false)}
          >시각 동기화 ▸
          </button>
          <button className={"cursor-pointer"} onClick={resetClocks} disabled={resetting != 0}>
            <ArrowClockwise className={"w-5 h-5 " + (resetting ? "fill-gray-400" : "fill-gray-100")}/>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-x-3 items-center">
        <button
          className={"font-medium cursor-pointer w-full text-left"}
          onClick={() => setIsFolding(true)}
        >시각 동기화 ▾
        </button>
        <button className={"cursor-pointer"} onClick={resetClocks} disabled={resetting != 0}>
          <ArrowClockwise className={"w-5 h-5 " + (resetting ? "fill-gray-400" : "fill-gray-100")}/>
        </button>
      </div>
      <div className={"grid grid-cols-[max-content_max-content_auto] gap-x-3"}>
        <p>내 컴퓨터</p>
        <p>{dateToTimeString(localTime)}</p>
        <p>Δ = 0</p>

        <p>IDOL 서버</p>
        <p>{dateToTimeString(idolTime)}</p>
        <p>Δ = {idolDelta} ms</p>

        <p>KRISS 서버</p>
        <p>{dateToTimeString(krissTime)}</p>
        <p>Δ = {krissDelta} ms</p>
      </div>

      <div className={"flex gap-x-2"}>
        {(idolDelta && idolDelta > 500) &&
          <p className={"text-rose-300"}>컴퓨터 시각을 동기화하세요</p>
        }
      </div>
    </div>
  );
}

export default Clocks;
