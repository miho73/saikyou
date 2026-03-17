import {useEffect, useState} from "react";

function TimeClock() {
  const [time, setTime] = useState<string>("--:--:--.---");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      const ms = String(now.getMilliseconds()).padStart(3, "0");
      setTime(`${h}:${m}:${s}.${ms}`);

      return () => {
        clearInterval(timer);
      }
    }, 30);
  }, []);

  return (
    <div className={"flex items-center gap-3 px-3"}>
      <p className={"font-bold text-7xl"}>{time}</p>
    </div>
  );
}

export default TimeClock;
