import {getTimeFromTimeNow} from "../core/clock/server_time";
import {useEffect, useState} from "react";
import {ArrowClockwise} from "../assets/symbol/svg";
import {reset} from "../core/ping/kalman-filter";

function dateToTimeString(date: Date | null): string {
  if(!date) return "--:--:--.---";

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function Clocks() {
  const [localTime, setLocalTime] = useState<Date | null>(null);
  const [timeNowTime, setTimeNowTime] = useState<Date | null>(null);
  const [timeNowRTT, setTimeNowRTT] = useState<number>(0);

  const [resetting, setResetting] = useState<boolean>(false);

  useEffect(() => {
    resetClocks();
  }, []);

  function resetClocks() {
    setResetting(true);

    setTimeNowTime(null);
    setTimeNowRTT(0);

    setLocalTime(new Date());

    getTimeFromTimeNow()
      .then(res => {
        setTimeNowTime(res.datetime);
        setTimeNowRTT(res.RTT2);

        setResetting(false);
      });
  }

  const timeNowDelta = (
    (timeNowTime && localTime) ? Math.abs(timeNowTime.getTime() - localTime.getTime()) : null
  );

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex gap-x-3 items-center">
        <p className={"text-lg font-medium"}>시각 동기화</p>
        <button className={"cursor-pointer"} onClick={resetClocks} disabled={resetting}>
          <ArrowClockwise className={"w-5 h-5 " + (resetting ? "fill-gray-400" : "fill-gray-100")} />
        </button>
      </div>
      <div className={"grid grid-cols-[max-content_max-content_max-content_auto] gap-x-3"}>
        <p>내 컴퓨터</p>
        <p>{dateToTimeString(localTime)}</p>
        <p>Δ = 0</p>
        <div>

        </div>

        <p>TimeNow 서버</p>
        <p>{dateToTimeString(timeNowTime)} (RTT={timeNowRTT})</p>
        <p>Δ = {timeNowDelta} ms</p>
        <div>

        </div>

        <p>서울대 서버</p>
        <p>--:--:--.---</p>
        <p>Δ = ?</p>
      </div>

      <div className={"flex gap-x-2"}>
        { (timeNowDelta && timeNowDelta > 500) &&
          <p className={"text-rose-300"}>컴퓨터 시각을 동기화하세요</p>
        }
      </div>
    </div>
  );
}

export default Clocks;
