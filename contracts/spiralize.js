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
  [ 7, 9,24, 5],
  [ 6,32,31,15],
  [24,11,50,30],
  [32,32,32,29],
  [45,16,20,11],
  [30,16,11,38],
  [44, 8,40,31],
]

// OUTPUT
let spiralized = SpiralizeMatrix(matrix);

// FUNCTIONS

// NOTE: HAVE OTHER PRIORITIES CALLING, COME BACK TO THIS LATER

// function SpiralizeMatrix(matrix) {
//   let rows = matrix.length;
//   let columns = matrix[0].length;
//   let r1 = 0;
//   let r2 = rows-1;
//   let c1 = 0;
//   let c2 = columns-1;

//   let newMatrix = matrix[0];  // always start with 1st row
//   for (let c = )
// }