import {useEffect, useState} from "react";
import PingStatistics from "./menu/PingStatistics";
import TimeClock from "./TimeClock";
import Header from "./elements/layout/Header";
import Footer from "./elements/layout/Footer";
import Clocks from "./menu/Clocks";
import RTTDistributionVisualizer from "./menu/RTTDistributionVisualizer";
import TargetTimeSelector from "./menu/TargetTimeSelector";
import CaptchaSolver from "./menu/CaptchaSolver";

function App() {
  const [targetTime, setTargetTime] = useState<string>("12:00:00.000");

  return (
    <div
      className={"fixed left-4 bottom-4 min-w-1/3 bg-gray-900 p-4 rounded-lg z-9999 overflow-hidden"}
    >
      <Header/>
      <hr className="my-1 border-gray-500"/>
      <main className={"flex flex-col gap-4 mb-3"}>
        <TimeClock/>
        <Clocks/>
        <CaptchaSolver/>
        <PingStatistics/>
        <RTTDistributionVisualizer/>
        <TargetTimeSelector/>
      </main>
      <hr className="my-1 border-gray-500"/>
      <Footer/>
    </div>
  );
}

export default App;
