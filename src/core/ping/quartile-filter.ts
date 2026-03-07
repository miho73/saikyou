import {RTTs} from "./ping_sender";

const IQR_MULTIPLIER = 1.5;

function isOutlier(rtt: number) {
  const q1 = RTTs[Math.floor(RTTs.length * 0.25)]!;
  const q3 = RTTs[Math.floor(RTTs.length * 0.75)]!;
  const iqr = q3 - q1;
  const lowerBound = q1 - IQR_MULTIPLIER * iqr;
  const upperBound = q3 + IQR_MULTIPLIER * iqr;

  return rtt < lowerBound || rtt > upperBound;
}

function isReasonableEstimate(estimate: number, stdev: number) {
  const q2 = RTTs[Math.floor(RTTs.length * 0.5)]!;
  const q3 = RTTs[Math.floor(RTTs.length * 0.75)]!;

  return (
    estimate - q2 > 1.5 * stdev &&  // q2 + 1.5 sigma보다 작은 경우 과소추정
    q3 - estimate > 1.5 * stdev     // q3 - 1.5 sigma보다 큰 경우 과대추정
  );
}

export {
  isOutlier, isReasonableEstimate
}
