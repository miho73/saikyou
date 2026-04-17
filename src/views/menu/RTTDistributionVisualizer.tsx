import {useMemo, useState} from "react";
import {
  Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip,
  type TooltipContentProps, XAxis, YAxis
} from "recharts";
import {useAppDispatch, useAppSelector} from "../../core/hook/ReduxHooks";
import {pingStatisticsAction} from "../../core/redux/PingStatisticsReducer";
import Alert from "../elements/Alert";

function erf(x: number) {
  const sign = x < 0 ? -1 : 1;

  const x2 = x * sign;
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const t = 1.0 / (1.0 + p * x2);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x2 * x2);

  return y * sign;
}

function CDF(x: number) {
  return erf(x / 1.41421356237) / 2 + 0.5
}

const generateLogNormalData = (mu: number, sigma: number, n: number) => {
  if(mu == 0 || sigma == 0) return [];

  const points = [];
  const start = Math.max(0, Math.exp(mu - 4 * sigma));
  const end = Math.exp(mu + 4 * sigma);
  const step = (end - start) / 200;

  const ttime = Math.exp(mu - sigma * n);
  const sqrtTau = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  const twoSigmaSq = 2 * sigma * sigma

  for (let x = start; x <= end; x += step) {
    const pdf = sqrtTau / x * Math.exp(-Math.pow(Math.log(x) - mu, 2) / twoSigmaSq);
    points.push({
      x: Number(x.toFixed(2)),
      y: pdf,
      yLeft: x <= ttime ? pdf : null,
      yRight: x >= ttime ? pdf : null,
    });
  }
  return points;
};

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  const meanRTT = useAppSelector(state => state.PingStatisticsReducer.mean);
  const stddevRTT = useAppSelector(state => state.PingStatisticsReducer.stddev);

  if (active && payload && payload.length && label) {
    const prob = CDF((Math.log(+label) - meanRTT) / stddevRTT);

    return (
      <div className={"px-2.5 py-1.5 " + (payload[0]!.dataKey == "yRight" ? "bg-emerald-800 border-emerald-900" : "bg-rose-800 border-rose-900")}>
        <p>{label} ms</p>
        <p>{Math.round(prob * 10000)/100}</p>
      </div>
    );
  }

  return null;
}

function RTTDistributionVisualizer() {
  const [isFolding, setIsFolding] = useState<boolean>(true);

  const meanRTT = useAppSelector(state => state.PingStatisticsReducer.mean);
  const stddevRTT = useAppSelector(state => state.PingStatisticsReducer.stddev);
  const sigmaN = useAppSelector(state => state.PingStatisticsReducer.z);
  const ttime = useMemo(() => Math.exp(meanRTT - sigmaN * stddevRTT), [meanRTT, stddevRTT, sigmaN]);
  const probabilities = useMemo(() => CDF(sigmaN), [sigmaN]);

  const dispatch  = useAppDispatch();

  const data = useMemo(() => generateLogNormalData(meanRTT, stddevRTT, sigmaN), [meanRTT, stddevRTT, sigmaN]);

  if(meanRTT == 0 && stddevRTT == 0) {
    return (
      <div className="flex flex-col gap-y-2">
        <p className={"text-lg font-medium"}>지연시간 분포</p>
        <div className={"w-full h-10 p-1 flex flex-col items-center"}>
          <p className={"mx-auto text-lg"}>데이터가 없습니다</p>
        </div>
      </div>
    )
  }

  if(isFolding) {
    return (
      <div className="flex flex-col gap-y-2">
        <button
          className={"text-lg font-medium"}
          onClick={() => setIsFolding(false)}
        >지연시간 분포 ▶</button>
      </div>
    );
  }

  // @ts-ignore
  return (
    <div className="flex flex-col gap-y-2">
      <button
        className={"text-lg font-medium"}
        onClick={() => setIsFolding(true)}
      >지연시간 분포 ▼</button>

      <div className={"outline-none"}>
        <ResponsiveContainer
          style={{
            //@ts-ignore ㅈ까
            width: "100%",
            aspectRatio: 1.618,
          }}
          className="outline-none"
        >
          <AreaChart
            responsive
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
          >
            <CartesianGrid
              strokeDasharray={"3 3"}
              stroke={"var(--color-gray-500)"}
            />
            <XAxis
              dataKey="x"
              type="number"
              domain={["auto", "auto"]}
              label={{
                value: "지연시간 (ms)",
                fill: "var(--color-gray-100)",
                position: "insideBottom",
                offset: -10
              }}
              tickFormatter={(value) => `${Math.round(value)} ms`}
              interval={"preserveStartEnd"}
              tick={{
                fill: "var(--color-gray-100)",
              }}
            />
            <YAxis hide/>
            <Tooltip
              //@ts-ignore ㅈ까
              content={<CustomTooltip/>}
              allowEscapeViewBox={{
                x: false,
                y: false,
              }}
              animationDuration={0}
              cursor={false}
            />
            <ReferenceLine
              className={"text-gray-100"}
              x={ttime}
              stroke="var(--color-red-300)"
              strokeDasharray="3 3"
              label={{
                value: Math.round(ttime) + " ms",
                fill: "var(--color-gray-100)",
                position: "center",
              }}
            />

            <Area
              type="monotone"
              dataKey="yLeft"
              stroke="var(--color-red-300)"
              fill="var(--color-red-300)"
              fillOpacity={0.6}
              connectNulls={false}
              animationDuration={0}
            />
            <Area
              type="monotone"
              dataKey="yRight"
              stroke="var(--color-green-300)"
              fill="var(--color-green-300)"
              fillOpacity={0.6}
              connectNulls={false}
              animationDuration={0}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p>정시 전 도착 가능성: {Math.round((1-probabilities) * 1000)/10}%</p>
      </div>

      <div className={"flex gap-2 items-center relative"}>
        <input
          type={"range"}
          min={0} max={3} step={0.05}
          value={sigmaN}
          onChange={e => dispatch(
            pingStatisticsAction.setZ(Number(e.target.value))
          )}
          className={"w-full h-5 outline-none rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-gray-100/90 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full"}
          style={{
            background: "linear-gradient(to left in oklch, var(--color-emerald-600) 0%, var(--color-amber-500) 85%, var(--color-rose-600) 100%)",
          }}
        />
        <input
          type={"number"}
          min={0}
          max={3}
          step={0.1}
          value={sigmaN}
          onChange={e => dispatch(
            pingStatisticsAction.setZ(Number(e.target.value))
          )}
          className={"w-16 bg-gray-800 text-gray-100 px-1 py-0.5 outline-none hover:bg-gray-700 focus:bg-gray-700 transition-all duration-150"}
        />
      </div>
      {sigmaN < 1.5 &&
        <Alert variant={"warning"}>
          수강신청이 정시보다 일찍 시작될 수 있습니다.
        </Alert>
      }
    </div>
  );
}

export default RTTDistributionVisualizer;
