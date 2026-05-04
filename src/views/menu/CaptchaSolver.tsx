/// <reference types="chrome"/>
import {type ReactElement, useEffect, useRef, useState} from "react";
import Opcodes from "../../core/background";
import PrincipalViewer from "./PrincipalViewer";

enum ProcessState {
  READY,
  PREPROCESSING,
  DUPLICATED,
  HTML_NOT_READY,
  IMAGE_NOT_READY,
  IMAGE_LOADING_FAULT,
  CANVAS_NOT_READY,
  SUBMITTED,
  DONE,
  SERVER_ERROR
}


function CaptchaSolver({show}: { show: boolean }) {
  const [isFolding, setIsFolding] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef1 = useRef<HTMLInputElement | null>(null);
  const inputRef2 = useRef<HTMLInputElement | null>(null);
  const inputRef3 = useRef<HTMLInputElement | null>(null);
  const inputRef4 = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processResult, setProcessResult] = useState<ProcessState>();

  const [solution, setSolution] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0.00);

  function waitImageLoading(img: HTMLImageElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (img.complete && img.naturalHeight > 0) {
        resolve(img);
        return;
      }

      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  }

  function grapImage(imgElement: HTMLImageElement, at: number) {
    const canvasElement = canvasRef.current;

    if (!imgElement || !canvasElement) {
      setProcessResult(ProcessState.HTML_NOT_READY);
      return;
    }

    if (!imgElement.complete || imgElement.naturalHeight === 0) {
      setProcessResult(ProcessState.IMAGE_NOT_READY);
      return;
    }

    if (isProcessing) {
      setProcessResult(ProcessState.DUPLICATED);
      return;
    }

    setIsProcessing(true);
    setProcessResult(ProcessState.PREPROCESSING);

    try {
      const ctx = canvasElement.getContext("2d", {
        willReadFrequently: true
      });
      if (!ctx) {
        setProcessResult(ProcessState.CANVAS_NOT_READY);
        return;
      }

      canvasElement.width = imgElement.width;
      canvasElement.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const rgbaData = imgData.data;

      const rgbArray: [number, number, number][] = [];
      for (let i = 0; i < rgbaData.length; i += 4) {
        rgbArray.push([
          rgbaData[i]!,
          rgbaData[i + 1]!,
          rgbaData[i + 2]!
        ]);
      }

      setProcessResult(ProcessState.SUBMITTED);
      chrome.runtime.sendMessage(
        {opcode: Opcodes.SOLVE_CAPTCHA, image: rgbArray},
        (response) => {
          if (response && response.opcode === Opcodes.CAPTCHA_SOLVED) {
            setSolution(response.solution);
            setConfidence(response.confidence);
            if (at === 1 && inputRef1.current) inputRef1.current.value = response.solution;
            if (at === 2 && inputRef2.current) inputRef2.current.value = response.solution;
            if (at === 3 && inputRef3.current) inputRef3.current.value = response.solution;
            if (at === 4 && inputRef4.current) inputRef4.current.value = response.solution;
            setProcessResult(ProcessState.DONE);
          } else {
            console.error(response);
            setProcessResult(ProcessState.SERVER_ERROR);
          }
        }
      );
    } catch (e) {

    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        // @ts-ignore: id 있음
        if (mutation.target.id === "imageText_01") {
          waitImageLoading(mutation.target as HTMLImageElement)
            .then(img => grapImage(img, 1))
            .catch(e => {
              console.error(e);
              setProcessResult(ProcessState.IMAGE_LOADING_FAULT);
            });
        }
        // @ts-ignore: id 있음
        if (mutation.target.id === "imageText_02") {
          waitImageLoading(mutation.target as HTMLImageElement)
            .then(img => grapImage(img, 2))
            .catch(e => {
              console.error(e);
              setProcessResult(ProcessState.IMAGE_LOADING_FAULT);
            });
        }
        // @ts-ignore: id 있음
        if (mutation.target.id === "imageText_03") {
          waitImageLoading(mutation.target as HTMLImageElement)
            .then(img => grapImage(img, 3))
            .catch(e => {
              console.error(e);
              setProcessResult(ProcessState.IMAGE_LOADING_FAULT);
            });
        }
        // @ts-ignore: id 있음
        if (mutation.target.id === "imageText_04") {
          waitImageLoading(mutation.target as HTMLImageElement)
            .then(img => grapImage(img, 4))
            .catch(e => {
              console.error(e);
              setProcessResult(ProcessState.IMAGE_LOADING_FAULT);
            });
        }
      });
    });

    function getInputField() {
      const input1 = document.getElementById("inputTextView_01");
      const input2 = document.getElementById("inputTextView_02");
      const input3 = document.getElementById("inputTextView_03");
      const input4 = document.getElementById("inputTextView_04");
      if (input1 && input1 instanceof HTMLInputElement) inputRef1.current = input1;
      if (input2 && input2 instanceof HTMLInputElement) inputRef2.current = input2;
      if (input3 && input3 instanceof HTMLInputElement) inputRef3.current = input3;
      if (input4 && input4 instanceof HTMLInputElement) inputRef4.current = input4;
    }

    observer.observe(
      document.body, {
        childList: false,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
      }
    );

    if (document.readyState === "complete") getInputField();
    else {
      window.addEventListener("load", getInputField);
      return () => window.removeEventListener("load", getInputField);
    }

    setProcessResult(ProcessState.READY);

    return () => {
      observer.disconnect();
    }
  }, []);

  let state: ReactElement | null;
  switch (processResult) {
    case ProcessState.READY:
      state = <p>ARM</p>
      break;
    case ProcessState.PREPROCESSING:
      state = <p>전처리중</p>;
      break;
    case ProcessState.DUPLICATED:
      state = <p>중복 전송 차단</p>;
      break;
    case ProcessState.CANVAS_NOT_READY:
      state = <p>준비되지 않음: 캔버스</p>;
      break;
    case ProcessState.IMAGE_NOT_READY:
      state = <p>준비되지 않음: 이미지</p>;
      break;
    case ProcessState.HTML_NOT_READY:
      state = <p>준비되지 않음: HTML</p>;
      break;
    case ProcessState.IMAGE_LOADING_FAULT:
      state = <p>캡챠 로딩이 중단됨</p>;
      break;
    case ProcessState.SUBMITTED:
      state = <p>제출됨</p>;
      break;
    case ProcessState.SERVER_ERROR:
      state = <p>해결할 수 없음</p>
      break;
    case ProcessState.DONE:
      state = <p>해결</p>
      break;
    default:
      state = <p>FAULT</p>;
  }

  return (
    <div>
      {show &&
        <>
          {isFolding &&
            <button className={"font-medium w-full text-left cursor-pointer"} onClick={() => setIsFolding(false)}>캡챠 풀이
              ▸</button>}
          {!isFolding &&
            <button className={"font-medium w-full text-left cursor-pointer"} onClick={() => setIsFolding(true)}>캡챠 풀이
              ▾</button>}
        </>
      }
      <canvas ref={canvasRef} style={{display: "none"}}/>
      {(!isFolding && show) &&
        <>
          {processResult === ProcessState.DONE &&
            <p>예측: {solution} / 정확도: {Math.round(confidence * 10000) / 100} / 해결</p>}
          {processResult !== ProcessState.DONE && state}
          <PrincipalViewer/>
        </>
      }
    </div>
  )
}

export default CaptchaSolver;
