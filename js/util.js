/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * <pre>
 * (x * 255).clamp(0, 255)
 * </pre>
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

// Return arr[idx] if idx is within the bounds of the array, otherwise return the last element in arr
var getVal = function(arr, idx){
    if(idx < arr.length)
        return arr[idx];
    else
        return arr[arr.length - 1]; // return hardest difficulty settings
}
