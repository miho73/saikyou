interface RTTKalmanFilterResult {
  rtt: number;
  dev: number;
}

let x_hat: number = -1;
let P: number = -1;

const Q = 0.001; // 프로세스 노이즈 공분산
const R = 1000; // 측정 노이즈 공분산

function next(rtt: number): RTTKalmanFilterResult {
  if(x_hat == -1) {
    x_hat = rtt;
    P = 100;
  }

  // 예측
  const x_hat_minus = x_hat;
  const P_minus = P + Q;

  // 칼만이득
  const K = P_minus / (P_minus + R);

  // 업데이트
  x_hat = x_hat_minus + K * (rtt - x_hat_minus);
  P = (1 - K) * P_minus;

  return {
    rtt: Math.round(x_hat * 100) / 100,
    dev: Math.round(Math.sqrt(P) * 100) / 100
  };
}

function currentEstimate(): RTTKalmanFilterResult | null {
  if(x_hat == -1) return null;

  return {
    rtt: Math.round(x_hat * 100) / 100,
    dev: Math.round(Math.sqrt(P) * 100) / 100
  };
}

function reset() {
  x_hat = -1;
  P = -1;
}

export type KalmanFilterResult = RTTKalmanFilterResult;

export {
  next, reset,
  currentEstimate
};
