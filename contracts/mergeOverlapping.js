/*
Merge Overlapping Intervals
Given the following array of array of numbers representing a list of intervals, merge all overlapping intervals.

[[16,26],[7,12],[16,20],[4,11],[1,3],[22,26],[3,13],[21,23],[8,14],[1,8],[7,14],[8,10],[7,8],[5,7],[1,5],[19,25],[20,22]]

Example:

[[1, 3], [8, 10], [2, 6], [10, 16]]

would merge into [[1, 6], [8, 16]].

The intervals must be returned in ASCENDING order. You can assume that in an interval, the first number will always be smaller than the second.
*/

// INPUT
let intervals = 
[[9,15],[15,24],[22,27],[25,31],[17,20],[19,27],[17,26],[15,20],[21,28],[7,17],[4,7],[5,14],[21,22],[21,31],[20,30],[3,10],[20,24],[13,23],[12,13],[7,15]]

// OUTPUT
let merged = MergeOverlappingIntervals(intervals);
console.log(`Merged Intervals:`);
console.log(merged);

// FUNCTIONS
function MergeOverlappingIntervals(arr) {
  let overlapFound = false;
  let sorted = arr.sort((a, b) => a[0] > b[0] ? 1 : -1);
  console.log("Sorted array: ");
  console.log(sorted);
  let merged = [];
  while (sorted.length > 0) {
    let a = sorted.shift();
    if (sorted.length != 0) {
      let b = sorted.shift();
      if (Overlaps(a,b)) {
        overlapFound = true;
        let c = Merge(a,b);
        merged.push(c);
      }
      else {
        merged.push(a);
        merged.push(b);
      }
    }
    else {  // reached end, 
      merged.push(a);
    }
  }
  // recursively run this function until no overlaps found
  if (overlapFound) {
    console.log(`Running merge function again until no overlaps found...`)
    merged = MergeOverlappingIntervals(merged);
  }
  return merged;
}

function Overlaps(a, b) {
  if (b[0] >= a[0] && b[0] <= a[1])
    return true;
  else if (b[1] >= a[0] && b[1] <= a[1])
    return true;
  else
    return false;
}

function Merge(a, b) {
  let start = Math.min(a[0], b[0]);
  let end = Math.max(a[1], b[1]);
  console.log(`Merging ${a} and ${b} into ${[start, end]}`)
  return [start, end];
}