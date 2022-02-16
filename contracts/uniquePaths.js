/*
UNIQUE PATHS IN A GRID I
You are in a grid with 6 rows and 8 columns, and you are positioned in the top-left corner of that grid. You are trying to reach the bottom-right corner of the grid, but you can only move down or right on each step. Determine how many unique paths there are from start to finish.

NOTE: The data returned for this contract is an array with the number of rows and columns:

[6, 8]
*/

// NOTE: NOT WORKING - DEBUG LATER

// INPUT
const grid = [6, 8];
const start = [0, 0];
const end = [6, 8];

// OUTPUT
let paths = PathWalker(grid, start, end)
console.log(`Paths found: ${paths}`);

// FUNCTIONS
function PathWalker(grid, start, end) {
  let paths = 0;
  let pos = start;
  if (ReachedEnd(pos, end)) {
    paths += 1;
    return paths;
  }
  console.log(`At pos: ${pos}, trying to move down...`)
  if (CanMoveDown(pos, grid))
    paths += PathWalker(grid, MoveDown(pos, grid), end);
  console.log(`At pos: ${pos}, trying to move right...`)
  if (CanMoveRight(pos, grid))
    paths += PathWalker(grid, MoveRight(pos, grid), end);
}

function CanMoveDown(p, grid) {
  return (p[0]+1 <= grid[0]);
}

function CanMoveRight(p, grid) {
  return (p[1]+1 <= grid[1]);
}

function MoveDown(p, grid) {
  if (CanMoveDown(p, grid)) {
    p[0] += 1;
    return p;
  }
  else {
    console.log(`Can't move down from ${p}`)
    return false;
  }
}

function MoveRight(p, grid) {
  if (CanMoveRight(p, grid)) {
    p[1] += 1;
    return p;
  }
  else {
    console.log(`Can't move right from ${p}`)
    return false;
  }
}

function ReachedEnd(p, end) {
  let endReached = (p[0] == end[0] && p[1] == end[1]);
  if (endReached)
    console.log(`!!! Reached the end! ${p} == ${end} !!!`)
  return endReached;
}