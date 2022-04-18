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
let matrix =     
[
  [22,41,45,27,25,30,23,21,24, 2,15],
  [14,36,41,39, 1,35,48,16,21,19, 2],
  [ 3,36,20, 9,29,23, 5,49,25,21,40],
  [10, 4,25, 3,26,42,15,30, 5,12,44],
  [14,42, 4, 9, 1,33, 8,50,18,31,39],
  [20,31,35, 9, 9,34,17,15, 8,31,17],
  [50, 6,46,33,33,31, 5,35,25,30, 5],
  [50, 8,15, 3,44, 4,35,16,20,29,22],
  [45, 8,23,30,22,14,43,23,31,19, 4],
  [10, 3,35,40,10,45,47,33,37,11,34],
  [ 2,10, 9, 9,23,26,50,41,41,33,13],
  [ 9, 4,35,16, 1,14,26,29,11,20,41],
  [48,44,49,18,47,25,23,40, 3,35,42],
  [32,40,47,13,12,49,25, 8,36,19,16]
]

// OUTPUT
let spiralized = SpiralizeMatrix(matrix);
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
        spiralized.push(last);
      }
    }

    // 3) pop each item from the last row
    if (matrix.length > 0 && matrix[matrix.length-1].length > 0) {
      let bottom = matrix.pop();
      while(bottom.length > 0) {
        spiralized.push(bottom.pop());
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