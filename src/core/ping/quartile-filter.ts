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

export {
  isOutlier
}
