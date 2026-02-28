/// <reference types="chrome"/>

import setChromeComPort from "./ping";

const Opcodes = {
  // general response/request opcodes
  OK: 0x000,
  ERROR: 0x001,
  RESET: 0x002,

  // ping=port channel
  START_PING: 0x100,
  STOP_PING: 0x101,
  PING_RESULT: 0x102,
}

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

chrome.runtime.onConnect.addListener(port => {
  if (port.name === "ping-port") setChromeComPort(port);
});

export default Opcodes;
