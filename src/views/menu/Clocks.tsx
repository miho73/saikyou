import {getTimeFromIdol} from "../../core/clock/ServerTime";
import {useEffect, useState} from "react";
import {ArrowClockwise} from "../../assets/symbol/svg";
import Opcodes from "../../core/background";

function dateToTimeString(date: Date | null): string {
  if(!date) return "--:--:--.---";

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function Clocks({show}: {show: boolean}) {
  const [isFolding, setIsFolding] = useState<boolean>(true);

  const [localTime, setLocalTime] = useState<Date | null>(null);
  const [idolTime, setIdolTime] = useState<Date | null>(null);
  const [googleTime, setGoogleTime] = useState<Date | null>(null);
  const [krissTime, setKrissTime] = useState<Date | null>(null);
  const [nistTime, setNistTime] = useState<Date | null>(null);
  const [ntpRTT, setNtpRTT] = useState<number>(0);

  const [resetting, setResetting] = useState<number>(0);

  useEffect(() => {
    resetClocks();
  }, []);

  function reduceResetting() {
    setResetting(v => Math.max(0, v-1));
  }

  function resetClocks() {
    setResetting(1);

    setIdolTime(null);
    setGoogleTime(null);
    setKrissTime(null);
    setNistTime(null);
    setNtpRTT(0);

    setLocalTime(new Date());

    getTimeFromIdol()
      .then(res => {
        setIdolTime(new Date(res.time.server.getTime() - res.RTT2));
        setGoogleTime(new Date(res.time.google.getTime() - res.RTT2));
        setKrissTime(new Date(res.time.kriss.getTime() - res.RTT2));
        setNistTime(new Date(res.time.nist.getTime() - res.RTT2));
        setNtpRTT(res.RTT2);
      }).finally(() => {
        reduceResetting();
      });
/*
    chrome.runtime.sendMessage({
      opcode: Opcodes.ESTIMATE_MS
    }).finally(() => {
      reduceResetting();
    });
 */
  }

  const idolDelta = (
    (idolTime && localTime) ? Math.abs(idolTime.getTime() - localTime.getTime()) : null
  );
  const googleDelta = (
    (googleTime && localTime) ? Math.abs(googleTime.getTime() - localTime.getTime()) : null
  );
  const krissDelta = (
    (krissTime && localTime) ? Math.abs(krissTime.getTime() - localTime.getTime()) : null
  );
  const nistDelta = (
    (nistTime && localTime) ? Math.abs(nistTime.getTime() - localTime.getTime()) : null
  );

  if(!show) return;
  if(isFolding) {
    return (
      <div className="flex flex-col gap-y-2">
        <div className="flex gap-x-3 items-center">
          <button
            className={"font-medium cursor-pointer w-full text-left"}
            onClick={() => setIsFolding(false)}
          >시각 동기화 ▸</button>
          <button className={"cursor-pointer"} onClick={resetClocks} disabled={resetting != 0}>
            <ArrowClockwise className={"w-5 h-5 " + (resetting ? "fill-gray-400" : "fill-gray-100")} />
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
        >시각 동기화 ▾</button>
        <button className={"cursor-pointer"} onClick={resetClocks} disabled={resetting != 0}>
          <ArrowClockwise className={"w-5 h-5 " + (resetting ? "fill-gray-400" : "fill-gray-100")} />
        </button>
      </div>
      <div className={"grid grid-cols-[max-content_max-content_auto] gap-x-3"}>
        <p>내 컴퓨터</p>
        <p>{dateToTimeString(localTime)}</p>
        <p>Δ = 0</p>

        <p>IDOL 서버</p>
        <p>{dateToTimeString(idolTime)} (RTT={ntpRTT})</p>
        <p>Δ = {idolDelta} ms</p>

        <p>Google 서버</p>
        <p>{dateToTimeString(googleTime)} (RTT={ntpRTT})</p>
        <p>Δ = {googleDelta} ms</p>

        <p>KRISS 서버</p>
        <p>{dateToTimeString(krissTime)} (RTT={ntpRTT})</p>
        <p>Δ = {krissDelta} ms</p>

        <p>NIST 서버</p>
        <p>{dateToTimeString(nistTime)} (RTT={ntpRTT})</p>
        <p>Δ = {nistDelta} ms</p>

        <p>서울대 서버</p>
        <p>--:--:--.---</p>
        <p>Δ = ?</p>
      </div>

      <div className={"flex gap-x-2"}>
        { (idolDelta && idolDelta > 500) &&
          <p className={"text-rose-300"}>컴퓨터 시각을 동기화하세요</p>
        }
      </div>
    </div>
  );
}

export default Clocks;
