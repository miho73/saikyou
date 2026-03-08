import {RTTNormalDistEqn} from "../assets/symbol/svg";
import {useState} from "react";

function RequestCanon() {
  const [sigmaN, setSigmaN] = useState<number>(1.5)

  return (
    <div className="flex flex-col gap-y-2">
      <p className={"text-lg font-medium"}>자동 개시</p>
      <div className={"flex gap-2 items-center"}>
        <RTTNormalDistEqn className={"fill-gray-100 h-6 pl-2"} />
        <input
          type={"number"}
          min={0}
          max={3}
          step={0.1}
          value={sigmaN}
          onChange={e => setSigmaN(Number(e.target.value))}
          className={"w-16 bg-gray-800 text-gray-100 px-1 py-0.5 outline-none hover:bg-gray-700 focus:bg-gray-700 transition-all duration-150"}
        />
      </div>
    </div>
  );
}

export default RequestCanon;
