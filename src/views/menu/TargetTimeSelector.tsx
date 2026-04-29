import {useAppDispatch, useAppSelector} from "../../core/hook/ReduxHooks";
import {useEffect, useState} from "react";
import {sharedMemoryAction} from "../../core/redux/SharedMemoryReducer";

function TargetTimeSelector() {
  const meanRTT = useAppSelector(state => state.PingStatisticsReducer.mean);
  const stddev = useAppSelector(state => state.PingStatisticsReducer.stddev);
  const z = useAppSelector(state => state.PingStatisticsReducer.z);
  const targetTime = useAppSelector(state => state.SharedMemoryReducer.target_time);
  const arm = useAppSelector(state => state.SharedMemoryReducer.arm);

  const dispatch = useAppDispatch();

  let ok = true;
  if(
    meanRTT == 0 ||
    stddev == 0 ||
    z == 0 ||
    !/\d{2}:\d{2}/.test(targetTime)
  ) ok = false;

  function toggleReady() {
    dispatch(sharedMemoryAction.updateArmState(!arm));
  }

  useEffect(() => {
    if(!ok) dispatch(sharedMemoryAction.updateArmState(false));
  }, [ok]);

  return (
    <>
      <div className="flex flex-col mb-1">
        <p className={"text-lg font-medium"}>목표 시각</p>
        <input
          type="time"
          value={targetTime}
          onChange={(e) => dispatch(sharedMemoryAction.updateTargetTime(e.target.value))}
          className={"px-2 py-1.5 my-1 outline-none text-lg font-semibold w-fit"}
        />
      </div>

      <button
        className={"text-xl font-bold px-4 py-2 w-full rounded cursor-pointer disabled:cursor-not-allowed transition-opacity duration-200 " + (arm ? "bg-emerald-600 disabled:bg-emerald-300 text-emerald-100" : "bg-rose-600 disabled:bg-rose-300 text-rose-100")}
        disabled={!ok}
        onClick={toggleReady}
      >
        READY
      </button>
    </>
  );
}

export default TargetTimeSelector;
