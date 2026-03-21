/// <reference types="chrome"/>

import setChromeComPort from "./ping/PingSender";
import {estimateServerMilliseconds} from "./clock/ServerTime";

const Opcodes = {
  // general response/request opcodes
  OK: 0x000,
  ERROR: 0x001,
  RESET: 0x002,

  // ping=port channel
  START_PING: 0x100,
  STOP_PING: 0x101,
  PING_RESULT: 0x102,

  // ms_estimation
  ESTIMATE_MS: 0x110,
  MS_ESTIMATED: 0x111,
}

let estimationInProgress = false;

// 전역 메시지 핸들러
function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  switch (message.opcode) {
    case Opcodes.ESTIMATE_MS:
      sendResponse({
        opcode: Opcodes.OK,
        for: message.opcode
      });
      if(!estimationInProgress) {
        estimationInProgress = true;
        estimateServerMilliseconds();
      }
      break;
    default:
      console.error(message.opcode + " is not a valid opcode.");
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

// ping port 초기화
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "ping-port") setChromeComPort(port);
});

export default Opcodes;
