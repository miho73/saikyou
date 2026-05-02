/// <reference types="chrome"/>

import setChromeComPort from "./ping/PingSender";
import {solveCaptcha} from "./captcha/CaptchaSolver";
import {getTimeFromIdol} from "./clock/ServerTime";

const Opcodes = {
  // general response/request opcodes
  OK: 0x000,
  ERROR: 0x001,
  RESET: 0x002,

  // ping=port channel
  START_PING: 0x100,
  STOP_PING: 0x101,
  PING_RESULT: 0x102,

  // captcha
  SOLVE_CAPTCHA: 0x120,
  CAPTCHA_SOLVED: 0x121,

  // time sync
  GET_TIME: 0x130,
  TIME_RESULT: 0x131,
}

// 전역 메시지 핸들러
function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  switch (message.opcode) {
    case Opcodes.GET_TIME:
      getTimeFromIdol()
        .then(result => {
          sendResponse({
            opcode: Opcodes.TIME_RESULT,
            time: {
              server: result.time.server.toISOString(),
              google: result.time.google.toISOString(),
              kriss: result.time.kriss.toISOString(),
              nist: result.time.nist.toISOString(),
            },
            RTT2: result.RTT2,
          });
        })
        .catch(e => {
          console.error(e);
          sendResponse({ opcode: Opcodes.ERROR, for: message.opcode });
        });
      return true;
    case Opcodes.SOLVE_CAPTCHA:
      solveCaptcha(message.image)
        .then(solution => {
          sendResponse({ opcode: Opcodes.CAPTCHA_SOLVED, solution: solution.solution, confidence: solution.confidence });
        })
        .catch(e => {
          console.error(e);
          sendResponse({ opcode: Opcodes.ERROR, for: message.opcode });
        });
      return true;
    default:
      console.error(message.opcode + " is not a valid opcode.");
      sendResponse({ opcode: Opcodes.ERROR, for: message.opcode });
      return true;
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

// ping port 초기화
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "ping-port") setChromeComPort(port);
});

export default Opcodes;
