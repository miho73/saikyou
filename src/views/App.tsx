import {useState} from "react";
import PingCounter from "./PingCounter";
import ServerClock from "./ServerClock";
import Header from "./Header";
import Footer from "./Footer";
import Signal from "./Signal";
import Clocks from "./Clocks";
import RequestCanon from "./Canon";

function App() {
  const [targetTime, setTargetTime] = useState<string>("12:00:00.000");

  return (
    <div
      className={"fixed left-4 bottom-4 min-w-1/3 bg-gray-900 p-4 rounded-lg z-9999"}
    >
      <Header/>
      <hr className="my-1 border-gray-500"/>
      <main className={"flex flex-col gap-4 mb-3"}>
        <ServerClock/>
        <Signal/>
        <Clocks/>
        <PingCounter/>
        <RequestCanon/>
      </main>
      <hr className="my-1 border-gray-500"/>
      <Footer/>
    </div>
  );
}

export default App;
