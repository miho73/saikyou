import {getTimeFromTimeNow} from "../core/clock/server_time";
import {useEffect, useState} from "react";

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

  useEffect(() => {
    setLocalTime(new Date());

    getTimeFromTimeNow()
      .then(res => {
        setTimeNowTime(res.datetime);
        setTimeNowRTT(res.RTT2);
      });
  }, []);

  const timeNowDelta = (
    (timeNowTime && localTime) ? Math.abs(timeNowTime.getTime() - localTime.getTime()) : null
  );

  return (
    <div>
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

      { (timeNowDelta && timeNowDelta > 500) &&
        <p>시간을 동기화하십시오.</p>
      }
    </div>
  );
}

export default Clocks;
