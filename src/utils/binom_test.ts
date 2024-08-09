import { factorial }  from 'mathjs';
import { p_dict } from './binom_prop_pval_lookup';
// const core = require('mathjs');
// const math = core.create();

// math.import(require('mathjs/lib/cjs/function/probability/factorial'));

export function binom_test(actual_k: number, n: number, p: number): number {
  const fact = factorial;
  let pval: number;

  function binom_dist(k: number, n: number, p: number): number {
    const bin_coeff = fact(n) / (fact(k) * fact(n - k));
    p = bin_coeff * (Math.pow(p, k) * Math.pow((1 - p), (n - k)));
    return p;
  }

  function my_binom_test_2(k: number, n: number, p: number): number {
    let cp = 0;
    let dp: number;
    for (let inst_k = k; inst_k < n + 1; inst_k++) {
      dp = binom_dist(inst_k, n, p);
      cp += dp;
    }

    return cp;
  }

  function binom_prop_table(k: number, n: number, p: number): number {
    const mu = n * p;
    const sigma = Math.sqrt(n * p * (1 - p));
    const z = (k - mu) / sigma;

    const z_vals = p_dict.z;
    const p_vals = p_dict.p;

    let found_index = -1;
    let found = false;

    for (let index = 0; index < z_vals.length; index++) {
      const inst_z = z_vals[index];

      if (z < inst_z && !found) {
        found_index = index;
        found = true;
      }
    }

    if (found_index === -1) {
      found_index = z_vals.length - 1;
    }
    pval = p_vals[found_index];

    return pval;
  }

  pval = my_binom_test_2(actual_k, n, p);
  if (isNaN(pval)) {
    pval = binom_prop_table(actual_k, n, p);
  }

  return pval;
}
