
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

// Return an integer num with at least 3 digits, ex. so that 3 will become 003
var numToDigits = function(num) {
    if(num < 10){
        return "00" + num;
    } else if (num < 100) {
        return "0" + num;
    } else {
        return num;
    }
}

//cookie handling code
function setCookie(cname,cvalue,exdays)
{
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname)
{
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++)
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return "";
}