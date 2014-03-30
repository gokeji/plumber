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

function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
{
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer')
    {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            rv = parseFloat( RegExp.$1 );
    }
    return rv;
}
function checkVersion()
{
    var msg = "You're not using Internet Explorer.";
    var ver = getInternetExplorerVersion();

    if ( ver > -1 )
    {
        if ( ver >= 8.0 )
            msg = "You're using a recent copy of Internet Explorer."
        else
            msg = "You should upgrade your copy of Internet Explorer.";
    }
    alert( msg );
}
