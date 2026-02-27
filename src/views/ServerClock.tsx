function ServerClock() {
  return (
    <div className={"flex items-center gap-3"}>
      <p className={"font-bold text-7xl"}>08:00:00.000</p>
      <p className={"font-semibold text-green-400"}>± 32 ms</p>
    </div>
  );
}

export default ServerClock;
