import {useEffect, useMemo, useRef, useState} from "react";
import {useAppDispatch, useAppSelector} from "../core/hook/ReduxHooks";
import SharedMemoryReducer, {sharedMemoryAction} from "../core/redux/SharedMemoryReducer";

function TimeClock() {
  const meanRTT = useAppSelector(state => state.PingStatisticsReducer.mean);
  const stddevRTT = useAppSelector(state => state.PingStatisticsReducer.stddev);
  const sigmaN = useAppSelector(state => state.PingStatisticsReducer.z);
  const ttime = useMemo(() => Math.exp(meanRTT - sigmaN * stddevRTT), [meanRTT, stddevRTT, sigmaN]);
  const targetTime = useAppSelector(state => state.SharedMemoryReducer.target_time);
  const targetTimeUNIX = useMemo(() => {
    return +targetTime.replace(":", '');
  }, [targetTime]);
  const isArm = useAppSelector(state => state.SharedMemoryReducer.arm);

  const [h, setH] = useState<string>("--");
  const [m, setM] = useState<string>("--");
  const [s, setS] = useState<string>("--");
  const [ms, setMs] = useState<string>("--");
  const [useCorr, setUseCorr] = useState<boolean>(false);

  const ttimeHistoryRef = useRef<number[]>([]);
  const autoEnabledRef = useRef<boolean>(false);

  const dispatch = useAppDispatch();

  // ttime이 안정화되면 자동으로 보정 활성화
  useEffect(() => {
    if (useCorr || autoEnabledRef.current || meanRTT === 0) return;

    const history = ttimeHistoryRef.current;

    // 새로고침 후 백그라운드에 이미 데이터가 있는 경우:
    // 히스토리가 비어있고 meanRTT가 non-zero이면 현재 ttime으로 9개 미리 채워서
    // 다음 ping 1개로 안정성 확인이 가능하게 함
    if (history.length === 0) {
      for (let i = 0; i < 9; i++) history.push(ttime);
    }

    history.push(ttime);
    if (history.length > 10) history.shift();

    if (history.length >= 10) {
      const range = Math.max(...history) - Math.min(...history);
      if (range < 5) {
        setUseCorr(true);
        autoEnabledRef.current = true;
      }
    }
  }, [ttime]);

  function autostart() {
    if(!isArm) return;
    dispatch(sharedMemoryAction.updateArmState(false));
    document.getElementById("listtab_button_01")?.click(); //TODO: DO WHATEVER AUTOMATIC STUFF
  }

  useEffect(() => {
    const timer = setInterval(() => {
      let now = new Date();

      if(useCorr) {
        now = new Date(now.getTime() + ttime);
      }

      setH(String(now.getHours()).padStart(2, "0"));
      setM(String(now.getMinutes()).padStart(2, "0"));
      setS(String(now.getSeconds()).padStart(2, "0"));
      setMs(String(now.getMilliseconds()).padStart(3, "0"));

      if(now.getHours() * 100 + now.getMinutes() === targetTimeUNIX) autostart();
    }, 30);

    return () => {
      clearInterval(timer);
    }
  }, [useCorr, targetTimeUNIX, isArm]);

  return (
    <div className={"flex items-center gap-3 px-3"}>
      <p className={"font-bold text-7xl"}>{h}:{m}:{s}.{ms}</p>
      <div className={"flex flex-col gap-1.5"}>
        <p className={"font-medium text-lg"}>+{Math.round(ttime)} ms</p>
        <button
          className={
            "px-2 py-1 border rounded text-center cursor-pointer w-full " +
            (useCorr ? "bg-emerald-600 disabled:bg-emerald-300 text-emerald-100" : "bg-rose-600 disabled:bg-rose-300 text-rose-100")
          }
          onClick={() => setUseCorr(prev => !prev)}
        >보정</button>
      </div>
    </div>
  );
}

export default TimeClock;
