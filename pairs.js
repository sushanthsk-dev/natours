// function pairList(n, ar) {
//   let res = 0;
//   ar.sort();
//   for (let i = 0; i < n; i++) {
//     if (ar[i] === ar[i + 1]) {
//       i++;
//       res++;
//     }
//   }
//   return res;
// }

// const data = pairList(8, [20, 20, 20, 50, 50, 20, 30, 40, 40]);
// console.log(data);

const data1 = secondLarge([10, 20, 30, 40, 50, 55]);
console.log(data1);
function secondLarge(arr) {
  let first, second;
  first = arr[0];
  second = arr[0];
  console.log(arr.length);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > first) {
      second = first;
      first = arr[i];
    } else if (second != first && arr[i] > second) {
      second = arr[i];
    }

  }
  return second;
}
