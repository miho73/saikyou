import {useState} from "react";
import PingStatistics from "./menu/PingStatistics";
import TimeClock from "./TimeClock";
import Header from "./elements/layout/Header";
import Footer from "./elements/layout/Footer";
import Clocks from "./menu/Clocks";
import RTTDistributionVisualizer from "./menu/RTTDistributionVisualizer";
import TargetTimeSelector from "./menu/TargetTimeSelector";
import CaptchaSolver from "./menu/CaptchaSolver";

function App() {
  const [showConfig, setShowConfig] = useState<boolean>(false);

  return (
    <div
      className={"fixed left-4 bottom-4 min-w-1/3 bg-gray-900 p-4 rounded-lg z-9999 overflow-hidden"}
    >
      <Header/>
      <hr className="my-1 border-gray-500"/>

      <TimeClock/>

      <button
        className={"font-medium text-lg my-0.5 mt-2 py-1 cursor-pointer w-full text-left"}
        onClick={() => setShowConfig(s => !s)}
      >{showConfig ? "설정 ▾" : "설정 ▸"}</button>
      <main className={"flex flex-col gap-2 mb-1 pl-1.5"}>
        <Clocks show={showConfig}/>
        <CaptchaSolver show={showConfig}/>
        <PingStatistics show={showConfig}/>
        <RTTDistributionVisualizer show={showConfig}/>
        <div className="flex gap-2 pl-1.5">
          {showConfig && <a href="https://idol.ionya.ooo/usage" target="_blank" rel="noreferrer" className={"cursor-pointer w-fit text-left hover:underline"}>취급 설명서 &gt;</a>}
          {showConfig && <a href="https://idol.ionya.ooo/privacy" target="_blank" rel="noreferrer" className={"cursor-pointer w-fit text-left hover:underline"}>개인정보처리방침 &gt;</a>}
        </div>
      </main>

      <TargetTimeSelector/>
      <hr className="my-1 border-gray-500"/>
      <Footer/>
    </div>
  );
}

export default App;
