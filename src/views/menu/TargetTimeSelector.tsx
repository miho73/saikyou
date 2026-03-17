import {useAppSelector} from "../../core/hook/ReduxHooks";
import {useState} from "react";

function TargetTimeSelector() {
  const meanRTT = useAppSelector(state => state.PingStatisticsReducer.mean);
  const stddev = useAppSelector(state => state.PingStatisticsReducer.stddev);
  const z = useAppSelector(state => state.PingStatisticsReducer.z);

  const [targetTime, setTargetTime] = useState<string>("");
  const [arm, setArm] = useState<boolean>(false);

  let ok = true;
  if(
    meanRTT == 0 ||
    stddev == 0 ||
    z == 0 ||
    !/\d{2}:\d{2}/.test(targetTime)
  ) ok = false;

  function toggleReady() {
    setArm(now => !now);
  }

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <p className={"text-lg font-medium"}>자동 시작</p>
        <input
          type="time"
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          className={"px-2 py-1.5 outline-none text-lg font-semibold w-fit"}
        />
      </div>

      <button
        className={"text-xl font-bold px-4 py-2 rounded cursor-pointer disabled:cursor-not-allowed transition-opacity duration-200 " + (arm ? "bg-emerald-600 disabled:bg-emerald-300 text-emerald-100" : "bg-rose-600 disabled:bg-rose-300 text-rose-100")}
        disabled={!ok}
        onClick={toggleReady}
      >
        READY
      </button>
    </>
  );
}

export default TargetTimeSelector;
