"use strict";

module.exports.tryCallAsync = async function (fn) {

    let args = Array.prototype.slice.call(arguments, 1);

    return new Promise((r, j) => {

        setImmediate(() => {

            try {

                r(fn(...args))
            }
            catch (e) {

                j(e);
            }
        })
    })
}

// module.exports.wrapAsync = function (fn) {

//     return async function (...args) {

//         return Promise.all(fn.call(this, async (...irgs) => {

//             return await new Promise((r, j) => {

//                 setImmediate(() => {

//                     try {

//                         r(args[0].call(args[1], ...irgs));
//                     }
//                     catch (e) {

//                         j(e);
//                     }
//                 });
//             });
//         }));
//     }
// }

// let arr = [{ a: 1 }, { a: 2 }, { a: 3 }];

// (async function () {
//     try {
//         await module.exports.wrapAsync(arr.map).call(arr, function (x) { x.a = x.a + 1 });
//         console.log(arr);
//     } catch (e) { console.log(e) }
// }())

// function decompose(o) {

//     let result = [o];

//     let i = 0
//     while(o = result[i]) {
//         let keys = Object.getOwnPropertyNames(o);
//         let values = keys.map((k) => o[k]);
//         let ovalues = values.filter((v) => typeof v == 'object' && v);
//         let pvalues = values.filter((v) => typeof v != 'object' || v === null);
//         result[i] = [...keys, ...pvalues];
//         result = [...result, ...ovalues];
//         i = i + 1;
//     }

//     return result;
// }


// async tryCallAsync(fn) {
//     let args = Array.prototype.slice.call(arguments, 1);
//     return new Promise((resolve, reject) => {
//       setImmediate(() => {
//         try {
//           resolve(fn(...args))
//         }
//         catch (e) {
//           reject(e);
//         }
//       })
//     })
//   }