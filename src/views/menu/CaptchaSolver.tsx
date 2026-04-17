import {type ReactElement, useEffect, useRef, useState} from "react";
import Alert from "../elements/Alert";
import axios from "axios";
import api from "../../core/axios";

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

interface Solution {
  solution: string;
  confidence: number;
}

function CaptchaSolver() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processResult, setProcessResult] = useState<ProcessState>();

  const [solution, setSolution] = useState<string>("")
  const [confidence, setConfidence] = useState<number>(0.00);

  function waitImageLoading(img: HTMLImageElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if(img.complete && img.naturalHeight > 0) {
        resolve(img);
        return;
      }

      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  }

  function grapImage(imgElement: HTMLImageElement) {
    const canvasElement = canvasRef.current;

    if(!imgElement || !canvasElement) {
      setProcessResult(ProcessState.HTML_NOT_READY);
      return;
    }

    if(!imgElement.complete || imgElement.naturalHeight === 0) {
      setProcessResult(ProcessState.IMAGE_NOT_READY);
      return;
    }

    if(isProcessing) {
      setProcessResult(ProcessState.DUPLICATED);
      return;
    }

    setIsProcessing(true);
    setProcessResult(ProcessState.PREPROCESSING);

    try {
      const ctx = canvasElement.getContext("2d");
      if(!ctx) {
        setProcessResult(ProcessState.CANVAS_NOT_READY);
        return;
      }

      canvasElement.width = imgElement.width;
      canvasElement.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const rgbaData = imgData.data;

      const rgbArray: [number, number, number][] = [];
      for(let i = 0; i < rgbaData.length; i += 4) {
        rgbArray.push([
          rgbaData[i]!,
          rgbaData[i+1]!,
          rgbaData[i+2]!
        ]);
      }

      setProcessResult(ProcessState.SUBMITTED);
      api.post<Solution>(
        "/captcha/solve",
        {
          image: rgbArray
        }
      ).then(res => {
        setSolution(res.data.solution);
        setConfidence(res.data.confidence);

        if(inputRef.current)
          inputRef.current.value = res.data.solution;
        setProcessResult(ProcessState.DONE);
      }).catch(e => {
        console.error(e);
        setProcessResult(ProcessState.SERVER_ERROR);
      });
    } catch (e) {

    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        // @ts-ignore: id 있음
        if(mutation.target.id === "imageText_01") {
          waitImageLoading(mutation.target as HTMLImageElement)
            .then(img => grapImage(img))
            .catch(e => {
              console.error(e);
              setProcessResult(ProcessState.IMAGE_LOADING_FAULT);
            });
        }
      });
    });

    function getInputField() {
      const input = document.getElementById("inputTextView_01");
      if(input && input instanceof HTMLInputElement) inputRef.current = input;
    }

    observer.observe(
      document.body, {
        childList: false,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
      }
    );

    if(document.readyState === "complete") getInputField();
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
      <p className={"text-lg font-medium"}>캡챠 풀이</p>
      <canvas ref={canvasRef} style={{display: "none"}}/>
      <p className={"py-2"}>예측: {solution} / 정확도: {Math.round(confidence*10000)/100}</p>
      {state}
    </div>
  )
}

export default CaptchaSolver;
