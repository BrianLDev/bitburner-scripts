/*
FIND LARGEST PRIME FACTOR
A prime factor is a factor that is a prime number. What is the largest prime factor of x?
*/

// INPUT
let x = 961057682;

// OUTPUT
let lpf = LargestPrimeFactor(x);
console.log(`Largest Prime Factor: ${lpf}`);


// FUNCTIONS
function Factors(num) {
  let factors = [];
  for (let i=1; i<=num; i++) {
    if (num % i === 0)
      factors.push(i);
  }
  return factors;
}

function IsPrime(num) {
  let factors = Factors(num);
  return (factors[0] == 1 && factors[1] == num) ? true : false
}

function PrimeFactors(num) {
  let factors = Factors(num);
  console.log(`Factors: ${factors}`)
  let primeFactors = [];
  factors.forEach(factor => {
    if (IsPrime(factor)) {
      console.log(`...found a prime: ${factor}`)
      primeFactors.push(factor);
    }
  });
  return primeFactors;
}

function LargestPrimeFactor(num) {
  let primeFactors = PrimeFactors(num);
  console.log(`Prime factors: ${primeFactors}`)
  primeFactors = primeFactors.filter(factor => factor != num);
  let lpf = Math.max(...primeFactors);
  return lpf;
}