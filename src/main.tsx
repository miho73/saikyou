import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from "./views/App";
import tailwindStyle from "./style/univ.css?inline";

// 폰트는 Shadow DOM에 상속되므로 document.head에 로드
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+JP+N&family=Noto+Sans+JP:wght@100..900&family=Noto+Sans+KR:wght@100..900&display=swap';
document.head.appendChild(fontLink);

const rootElement = document.createElement('div');
rootElement.id = 'saikyou-root';
document.body.appendChild(rootElement);

const shadowRoot = rootElement.attachShadow({mode: 'open'});

const styleElement = document.createElement('style');
styleElement.textContent = tailwindStyle;
shadowRoot.appendChild(styleElement);

const renderRoot = document.createElement('div');
renderRoot.id = 'saikyou-render-root';
shadowRoot.appendChild(renderRoot);

const root = createRoot(renderRoot);
root.render(
  <StrictMode>
    <App/>
  </StrictMode>
);
