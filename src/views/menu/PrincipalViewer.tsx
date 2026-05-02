import {useEffect, useState} from "react";

function PrincipalViewer() {
  const [principle, setPrinciple] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.sync.get("SAIKYOU-PRIP", (result) => {
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
    <button
      onClick={copyPrinciple}
      className={"cursor-pointer w-full text-left"}
    >
      {copied ? "식별자 복사됨" : "식별자 복사 >"}
    </button>
  );
}

export default PrincipalViewer;
