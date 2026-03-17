interface RTTLogKalmanFilterResult {
  rtt: number;
  dev: number;
}

let x_hat: number = -1;
let P: number = -1;

const Q = 1;
const R = 4.7;

function next(rttExp: number): RTTLogKalmanFilterResult {
  const rtt = Math.log(rttExp); // 로그칼만필터

  if(x_hat == -1) {
    x_hat = rtt;
    P = 6;
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
    rtt: x_hat,
    dev: Math.sqrt(P)
  };
}

function currentEstimate(): RTTLogKalmanFilterResult | null {
  if(x_hat == -1) return null;

  return {
    rtt: x_hat,
    dev: Math.sqrt(P)
  };
}

function reset() {
  x_hat = -1;
  P = -1;
}

export type KalmanFilterResult = RTTLogKalmanFilterResult;

export {
  next, reset,
  currentEstimate
};
