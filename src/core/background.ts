/// <reference types="chrome"/>

import setChromeComPort from "./clock/clock";

const Opcodes = {
  // general response/request opcodes
  OK: 0x000,
  ERROR: 0x001,
  RESET: 0x002,

  // ping=port channel
  START_CLOCK: 0x100,
  STOP_CLOCK: 0x101,
  CLOCK: 0x102,
}

// 전역 메시지 핸들러
function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  switch (message.opcode) {
    default:
      console.error(message.opcode + " is not a valid opcode.");
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

// ping port 초기화
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "ping-port") setChromeComPort(port);
});

//

export default Opcodes;
