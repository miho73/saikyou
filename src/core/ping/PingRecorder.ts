let mean = 0, sq_mean = 0;

const variables: number[] = [];

function stat() {
  return {
    mean: mean,
    stddev: Math.sqrt(sq_mean - mean * mean),
  }
}

function next(rtt: number) {
  const variable = Math.log(rtt);
  const len = variables.length;

  // update mean
  mean *= len;
  sq_mean *= len;
  mean += variable;
  sq_mean += variable * variable;

  // max 60 variables
  if (len >= 60) {
    const head = variables.shift();
    if (head) {
      mean -= head;
      sq_mean -= head * head;
    }
  }
  variables.push(variable);

  mean /= variables.length;
  sq_mean /= variables.length;
}

function reset() {
  mean = 0;
  sq_mean = 0;
  variables.length = 0;
}

export {
  stat, next, reset
}
