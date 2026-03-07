function F1Light(
  { on }: F1LightProps
) {
  return (
    <div className={"flex flex-col gap-2"}>
      {/* FIXME: 그림자 왜 안들어감? */}
      <div className={"w-6 h-6 rounded-full " + (on ? "bg-red-500 shadow-lg shadow-red-400" : "bg-gray-600")}/>
      <div className={"w-6 h-6 rounded-full " + (on ? "bg-red-500 shadow-lg shadow-red-400" : "bg-gray-600")}/>
    </div>
);
}

interface F1LightProps {
  on: boolean;
}

function Signal() {
  return (
    <div className={"flex justify-center items-center gap-3"}>
      <F1Light on={true}/>
      <F1Light on={true}/>
      <F1Light on={false}/>
      <F1Light on={false}/>
      <F1Light on={false}/>
    </div>
  );
}

export default Signal;
