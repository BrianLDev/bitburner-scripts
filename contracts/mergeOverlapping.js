/*
Merge Overlapping Intervals
Given the following array of array of numbers representing a list of intervals, merge all overlapping intervals.

[[25,28],[12,20],[5,10],[15,19],[7,15],[18,23],[23,29],[3,11],[22,31],[5,7],[10,11],[25,32],[3,10],[17,26],[6,11],[20,26],[17,22],[22,29]]

Example:

[[1, 3], [8, 10], [2, 6], [10, 16]]

would merge into [[1, 6], [8, 16]].

The intervals must be returned in ASCENDING order. You can assume that in an interval, the first number will always be smaller than the second.
*/

// INPUT
let intervals = 
[[25,28],[12,20],[5,10],[15,19],[7,15],[18,23],[23,29],[3,11],[22,31],[5,7],[10,11],[25,32],[3,10],[17,26],[6,11],[20,26],[17,22],[22,29]]

// OUTPUT
let merged = MergeOverlappingIntervals(intervals);
console.log(`Merged Intervals:`);
console.log(merged);

// FUNCTIONS
function MergeOverlappingIntervals(arr) {
  let sorted = arr.sort((a, b) => a[0] > b[0] ? 1 : -1);
  console.log("Sorted array: ");
  console.log(sorted);
  let merged = [];
  let arr1 = sorted.shift();
  while (sorted.length > 0) {
    let arr2 = sorted.shift();
    if (Overlaps(arr1, arr2)) {
      arr1 = Merge(arr1, arr2);
      if (sorted.length == 0)
        merged.push(arr1);
    }
    else {
      merged.push(arr1);
      if (sorted.length == 0)
        merged.push(arr2);
      else
        arr1 = [arr2[0], arr2[1]];
    }
  }
  return merged;
}

function Overlaps(arr1, arr2) {
  if (arr1[0] < arr2[0]) {
    // console.log(`1. Checking ${arr1} overlaps ${arr2}? ${(arr1[1] >= arr2[0])}`)
    return (arr1[1] >= arr2[0]);
  }
  else {
    // console.log(`2. Checking ${arr1} overlaps ${arr2}? ${(arr1[0] <= arr2[1])}`)
    return (arr1[0] <= arr2[1]);
  }
}

function Merge(arr1, arr2) {
  let start = (arr1[0] <= arr2[0]) ? arr1[0] : arr2[0];
  let end = (arr1[1] >= arr2[1]) ? arr1[1] : arr2[1];
  // console.log(`Merging ${arr1} and ${arr2} into ${[start, end]}`)
  return [start, end];
}