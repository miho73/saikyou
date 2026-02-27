function TimeProgressBar() {
  return (
    <svg className={"w-full h-10"}>
      <rect x={0} rx={3} y={3} height={3} className={"w-full fill-green-300"}/>
      <circle cx={5} cy={5} r={5} className={"fill-green-300"}/>
      <text x={0} y={30}>SYNC</text>
    </svg>
  );
}

export default TimeProgressBar;
