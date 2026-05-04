import {useEffect, useState} from "react";

function PrincipalViewer() {
  const [principle, setPrinciple] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [hovered, setHovered] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.sync.get("SAIKYOU-PRIP", (result: {"SAIKYOU-PRIP": string}) => {
      setPrinciple(result["SAIKYOU-PRIP"] ?? "");
    });
  }, []);

  function copyPrinciple() {
    if (!principle) return;
    navigator.clipboard.writeText(principle).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={"flex items-center gap-2"}>
      <span className={"text-gray-400 shrink-0"}>식별자:</span>
      <span
        className={"transition-all duration-200 cursor-default select-none " + (hovered ? "" : "blur-sm")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {principle || "—"}
      </span>
      <button
        onClick={copyPrinciple}
        className={"shrink-0 cursor-pointer text-gray-400 hover:text-white transition-colors"}
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

export default PrincipalViewer;
