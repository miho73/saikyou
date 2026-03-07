interface QuartileChartProps {
  data: number[]; // MUST BE SORTED,
  marker?: number[];
  whisker?: number;
  rangeCutoff?: number;
  className?: string;
}

function QuartileChart(
  { data, marker, whisker = 1.5, rangeCutoff = 10, className }: QuartileChartProps
) {
  if(!data || data.length === 0) {
    return (
      <div className={"w-full h-10 p-1 flex flex-col items-center" + (className ? " " + className : "")}>
        <p className={"mx-auto text-lg"}>데이터가 없습니다</p>
      </div>
    );
  }

  const min = data[0]!;
  const max = data[data.length - 1]!;
  const q1 = data[Math.floor(data.length * 0.25)]!;
  const q2 = data[Math.floor(data.length * 0.5)]!;
  const q3 = data[Math.floor(data.length * 0.75)]!;

  const left_whisker = Math.max(min, q1 - (q3 - q1) * whisker);
  const right_whisker = Math.min(max, q3 + (q3 - q1) * whisker);

  const axisMax = Math.ceil(max / rangeCutoff) * rangeCutoff;
  const axisMin = Math.floor(min / rangeCutoff) * rangeCutoff;
  const tickStep = Math.ceil((axisMax - axisMin) / rangeCutoff / 10) * rangeCutoff;
  const axisRange = axisMax - axisMin;
  const axisRatio = axisRange / 100;
  const ticks = Array.from({
    length: 11,
  }, (_, i) => axisMin + i * tickStep);

  return (
    <div className={"w-full p-1 flex items-center gap-2" + (className ? " " + className : "")}>
      <svg className={"w-full h-10"}>
        <line x1={`${(left_whisker-axisMin) / axisRatio}%`} y1={1} x2={`${(left_whisker-axisMin) / axisRatio}%`} y2={13} strokeWidth={1} stroke={"orange"} /> {/* Left Whisker */}
        <line x1={`${(left_whisker-axisMin) / axisRatio}%`} y1={7} x2={`${(q1-axisMin) / axisRatio}%`} y2={7} strokeWidth={1} stroke={"orange"} /> {/* LW - Q1 */}
        <rect x={`${(q1-axisMin) / axisRatio}%`} y={1} width={`${(q3-q1) / axisRatio}%`} height={12} fill={"orange"} fillOpacity={0.5} stroke={"orange"} /> {/* IQR */}
        <line x1={`${(q2-axisMin) / axisRatio}%`} y1={1} x2={`${(q2-axisMin) / axisRatio}%`} y2={13} strokeWidth={1} stroke={"orange"} /> {/* Median */}
        <line x1={`${(q3-axisMin) / axisRatio}%`} y1={7} x2={`${(right_whisker-axisMin) / axisRatio}%`} y2={7} strokeWidth={1} stroke={"orange"} /> {/* Q3 - RW */}
        <line x1={`${(right_whisker-axisMin) / axisRatio}%`} y1={1} x2={`${(right_whisker-axisMin) / axisRatio}%`} y2={13} strokeWidth={1} stroke={"orange"} /> {/* Right Whisker */}
        { data.map((d, i) => {
          if (d > right_whisker) {
            return <circle key={`outlier-${i}`} cx={`${Math.min((d-axisMin) / axisRatio, 99)}%`} cy={20} r={2} className={"fill-red-300"}/>;
          }
          else if(d < left_whisker) {
            return <circle key={`outlier-${i}`} cx={`${Math.max((d-axisMin) / axisRatio, 1)}%`} cy={20} r={2} className={"fill-red-300"}/>;
          }
          else {
            return <circle key={`point-${i}`} cx={`${(d-axisMin) / axisRatio}%`} cy={20} r={2} className={"fill-green-300"}/>;
          }
        })}
        { marker && marker.map((d, i) => (
          <line x1={`${(d-axisMin) / axisRatio}%`} y1={1} x2={`${(d-axisMin) / axisRatio}%`} y2={13} strokeWidth={2} className={"stroke-blue-300"} strokeDasharray={"2 2"} />
        ))}
        { ticks.map((i: number, idx: number) => (
          <text key={`tick-${i}`} x={`${idx / 11 * 100}%`} y={40} className={"fill-gray-100"}>{i}</text>
        ))}
      </svg>
    </div>
  );
}

export default QuartileChart;
