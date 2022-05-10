/*
SPIRALIZE MATRIX
Given the following array of arrays of numbers representing a 2D matrix, return the elements of the matrix as an array in spiral order:

    [
        [ 7, 9,24, 5]
        [ 6,32,31,15]
        [24,11,50,30]
        [32,32,32,29]
        [45,16,20,11]
        [30,16,11,38]
        [44, 8,40,31]
    ]

Here is an example of what spiral order should be:

    [
        [1, 2, 3]
        [4, 5, 6]
        [7, 8, 9]
    ]

Answer: [1, 2, 3, 6, 9, 8 ,7, 4, 5]

Note that the matrix will not always be square:

    [
        [1,  2,  3,  4]
        [5,  6,  7,  8]
        [9, 10, 11, 12]
    ]

Answer: [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
*/

// INPUT
input = 
[
  [ 1, 2,24,24,28,36,43],
  [13,10,43,37,19,45,10],
  [23, 5,40,36,47,44,21],
  [ 7,29,30,26, 1, 2,35],
  [31,31,23,30,50,27,29],
  [45, 5,10,39,22,41, 8],
  [ 6, 7, 7, 3,16,40,41],
  [ 4,20,34,44,15,42,25],
  [39, 1,44,49,47,32, 1],
  [ 3,34, 5, 3,40,19,44],
  [43,10,26,27,36,33,19]
]

// OUTPUT
let spiralized = SpiralizeMatrix(input);
let output = JSON.stringify(spiralized);  // need to do this so the full array is printed out
console.log(output);

// FUNCTIONS
function SpiralizeMatrix(matrix) {
  let spiralized = [];
  while (matrix.length > 0) {
    // 1) concat the top row
    let top = matrix.shift();
    spiralized = spiralized.concat(top);

    // 2) pop the last item from all rows except bottom
    if (matrix.length > 0) {
      for (let i=0; i<matrix.length-1; i++) {
        let last = matrix[i].pop();
        if (last != null)
          spiralized.push(last);
      }
    }

    // 3) pop each item from the last row
    if (matrix.length > 0 && matrix[matrix.length-1].length > 0) {
      let bottom = matrix.pop();
      while(bottom.length > 0) {
        let item = bottom.pop();
        if (item != null)
          spiralized.push(item);
      }
    }

    // 4) shift the first item from all rows except top
    if (matrix.length > 0) {
      for (let i=matrix.length-1; i>0; i--) {
        if (matrix[i].length > 0) {
          let first = matrix[i].shift();
          spiralized.push(first);
        }
      }
    }
  }
  return spiralized;
}