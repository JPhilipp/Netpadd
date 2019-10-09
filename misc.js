/*** Array object ***/

Array.prototype.toUnique = function() {
    var r = new Array();
    o:for (var i = 0, n = this.length; i < n; i++) {
        for (var x = 0, y = r.length; x < y; x++) {
            if (r[x] == this[i] || r[x] + ' ' == this[i] + ' ') {
                continue o;
            }
        }
        r[r.length] = this[i];
    }
    return r;
}

Array.prototype.inArray = function(v) {
    var isIt = false;
    for (var i = 0; i < this.length; i++) {
        if (this[i] == v) {
            isIt = true;
            break;
        }
    }
    return isIt;
}

Array.prototype.removeItem = function(toRemove) {
    // or use splice... http://codepunk.hardwar.org.uk/ajs44.htm
    var r = new Array();
    var max = this.length;
    for (var i = 0; i < max; i++) {
        if (this[i] != toRemove) {
            r[r.length] = this[i];
        }
    }
    return r;
}

/*** String object ***/

String.prototype.ucFirst = function() {
    var f = this.charAt(0).toUpperCase();
    return f + this.substr(1, this.length - 1);
}

String.prototype.toXml = function() {
    return Misc.toXml(this);
}

String.prototype.toName = function(allowUpperCase) {
    return Misc.toName(this, allowUpperCase);
}

String.prototype.toAttribute = function() {
    return Misc.toAttribute(this);
}

String.prototype.trim = function() {
    var s = this;
    if (s) {
        s = s.replace(new RegExp("^[ ]+", "g"), "");
        s = s.replace(new RegExp("[ ]+$", "g"), "");
    }
    return s;
}

String.prototype.cutLength = function(maxLength) {
    if (!maxLength) { maxLength = 20; }
    var value = this;
    var ender = '...';
    if (this.length - ender.length > maxLength) {
        value = this.substr(0, maxLength - ender.length) + ender;
    }
    return value;
}

String.prototype.ucWords = function() {
    if (this) {
        var str = this;
        return (str+'').replace(/^(.)|\s(.)/g, function ( $1 ) { return $1.toUpperCase( ); } );
    }
}

String.prototype.getTextBetween = function(sFrom, sTo) {
    var sPart = '';
    var iFrom = this.indexOf(sFrom);
    var iTo = this.indexOf(sTo, iFrom);
    iFrom += sFrom.length;
    if (iTo > iFrom) { sPart = this.substring(iFrom, iTo); }
    return sPart;
}

String.prototype.replaceAsteriskWithItalics = function() {
    return this.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g, "<em>$2</em>");
}

String.prototype.insertAt = function(pos, s){ 
   return ( this.valueOf().substr(0, pos) ) + s + ( this.valueOf().substr(pos) );
} 

String.prototype.replaceAll = function(sFind, sReplace) {
    var s = this;
    var sOld = null;
    while (sOld != s) {
        sOld = s;
        s = s.replace(sFind, sReplace);
    }
    return s;
}

/*** Browser detection ***/

var g_browserDetect = null;

function g_doDetectBrowser() {
    // http://quirksmode.org/js/detect.html
    g_browserDetect = {
        init: function () {
            this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
            this.version = this.searchVersion(navigator.userAgent)
                || this.searchVersion(navigator.appVersion)
                || "an unknown version";
            this.OS = this.searchString(this.dataOS) || "an unknown OS";
        },
        searchString: function (data) {
            for (var i=0;i<data.length;i++)    {
                var dataString = data[i].string;
                var dataProp = data[i].prop;
                this.versionSearchString = data[i].versionSearch || data[i].identity;
                if (dataString) {
                    if (dataString.indexOf(data[i].subString) != -1)
                        return data[i].identity;
                }
                else if (dataProp)
                    return data[i].identity;
            }
        },
        searchVersion: function (dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index == -1) return;
            return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
        },
        dataBrowser: [
            { string: navigator.userAgent, subString: "Chrome", identity: "Chrome" },
            { string: navigator.userAgent, subString: "OmniWeb", versionSearch: "OmniWeb/", identity: "OmniWeb" },
            { string: navigator.vendor, subString: "Apple", identity: "Safari", versionSearch: "Version" },
            { prop: window.opera, identity: "Opera" },
            { string: navigator.vendor, subString: "iCab", identity: "iCab" },
            { string: navigator.vendor, subString: "KDE", identity: "Konqueror" },
            { string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
            { string: navigator.vendor, subString: "Camino", identity: "Camino" },
            {        // for newer Netscapes (6+) string: navigator.userAgent, subString: "Netscape", identity: "Netscape"
            },
            { string: navigator.userAgent, subString: "MSIE", identity: "Explorer", versionSearch: "MSIE" },
            { string: navigator.userAgent, subString: "Gecko", identity: "Mozilla", versionSearch: "rv" },
            {         // for older Netscapes (4-) string: navigator.userAgent, subString: "Mozilla", identity: "Netscape", versionSearch: "Mozilla"
            }
        ],
        dataOS : [
            { string: navigator.platform, subString: "Win", identity: "Windows" },
            { string: navigator.platform, subString: "Mac", identity: "Mac" },
            { string: navigator.platform, subString: "Linux", identity: "Linux" }
        ]
    };
    g_browserDetect.init();
}

/*** Font detector ***/

// font detector by Lalit Patel
// info: http://www.lalit.org/wordpress/wp-content/uploads/2008/05/fontdetect.js?ver=1.5
// Usage: d = new g_fontDetector();
//        d.test('font_name');

var g_fontDetector = function(){
    var h = document.getElementsByTagName("BODY")[0];
    var d = document.createElement("DIV");
    var s = document.createElement("SPAN");
    d.appendChild(s);
    d.style.fontFamily = "sans";            //font for the parent element DIV.
    s.style.fontFamily = "sans";            //serif font used as a comparator.
    s.style.fontSize   = "72px";            //we test using 72px font size, we may use any size. I guess larger the better.
    s.innerHTML        = "mmmmmmmmmmlil";        //we use m or w because these two characters take up the maximum width. And we use a L so that the same matching fonts can get separated
    h.appendChild(d);
    var defaultWidth   = s.offsetWidth;        //now we have the defaultWidth
    var defaultHeight  = s.offsetHeight;    //and the defaultHeight, we compare other fonts with these.
    h.removeChild(d);
    /* test
     * params:
     * font - name of the font you wish to detect
     * return: 
     * f[0] - Input font name.
     * f[1] - Computed width.
     * f[2] - Computed height.
     * f[3] - Detected? (true/false).
     */
    function debug(font) {
        h.appendChild(d);
        var f = [];
        f[0] = s.style.fontFamily = font;    // Name of the font
        f[1] = s.offsetWidth;                // Width
        f[2] = s.offsetHeight;                // Height
        h.removeChild(d);
        font = font.toLowerCase();
        if (font == "serif") {
            f[3] = true;    // to set arial and sans-serif true
        } else {
            f[3] = (f[1] != defaultWidth || f[2] != defaultHeight);    // Detected?
        }
        return f;
    }
    function test(font){
        f = debug(font);
        return f[3];
    }
    this.detailedTest = debug;
    this.test = test;    
}

/*** Misc object ***/

function Misc() {
}

Misc.viewportGetHeight = function() {
    var retval = 0;
    if (window.innerHeight) {
        retval = window.innerHeight - 18;
    }
    else if (document.documentElement && document.documentElement.clientHeight)  {
        retval = document.documentElement.clientHeight;
    }
    else if (document.body && document.body.clientHeight)  {
        retval = document.body.clientHeight;
    }
    return retval;    
}

Misc.viewportGetWidth = function() {
    var retval = 0;
    if (window.innerWidth) {
        retval = window.innerWidth - 18;
    }
    else if (document.documentElement && document.documentElement.clientWidth) {
        retval = document.documentElement.clientWidth;
    }
    else if (document.body && document.body.clientWidth) {
        retval = document.body.clientWidth;
    }
    return retval;
}

Misc.getElm = function(id) {
    return document.getElementById(id);
}

Misc.getCreateElement = function(id) {
    var elm = document.getElementById(id);
    if (!elm) {
        elm = document.createElement('div');
        elm.setAttribute('id', id);
        document.body.appendChild(elm);
    }
    return elm;
}

Misc.toggleElm = function(id) {
    var elm = document.getElementById(id);
    if (elm) {
        if (elm.style.display == 'none') {
            elm.style.display = 'block';
        }
        else {
            elm.style.display = 'none';
        }
    }
}

Misc.isShowing = function(id) {
    var isShowing = false;
    var elm = document.getElementById(id);
    if (elm) { isShowing = elm.style.display == 'block'; }
    return isShowing;
}

Misc.showElm = function(id) {
    var elm = document.getElementById(id);
    if (elm) { elm.style.display = 'block'; }
}

Misc.hideElm = function(id) {
    var elm = document.getElementById(id);
    if (elm) { elm.style.display = 'none'; }
}

Misc.getHtml = function(id) {
    var html;
    var elm = document.getElementById(id);
    if (elm) {
        html = elm.innerHTML;
    }
    else {
        // alert('Element ' + id + ' not found.');
    }
    return html;
}

Misc.setHtml = function(id, html) {
    var elm = document.getElementById(id);
    if (elm) {
        elm.innerHTML = html;
    }
    else {
        // alert('Element ' + id + ' not found.');
    }
}

Misc.getRandomString = function() {
    var chars = '0123456789abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var stringLength = 64;
    var randomString = '';
    for (var i=0; i < stringLength; ++i) {
        var rnum = Math.floor( Math.random() * chars.length );
        randomString += chars.substring(rnum, rnum + 1);
    }
    return randomString;
}

Misc.toXml = function(s) {
    if (s || s == 0) {
        s = s.toString();
        s = s.replace(/&/g, '&amp;');
        s = s.replace(/</g, '&lt;');
        s = s.replace(/>/g, '&gt;');
    }
    else {
        s = '';
    }
    return s;
}

Misc.toJavaScriptParam = function(s, escapeXml, useQuotesIfNeeded) {
    if (typeof s == 'boolean') {
        s = !!s ? 'true' : 'false';
    } else if (s) {
        var sOld = null;
        while (sOld != s) {
            s = s.replace(/\"/g, "\\\"");
            s = s.replace(/\'/g, "\\'");
            s = s.replace(/\r\n/g, ' ');
            s = s.replace(/\r/g, ' ');
            s = s.replace(/\n/g, ' ');
            s = s.replace('  ', ' ');
            sOld = s;
        }
        if (escapeXml) {
            s = Misc.toAttribute(s);
        }
        if (useQuotesIfNeeded) {
            s = "'" + s + "'";
        }
    }
    else if (useQuotesIfNeeded) {
        s = "'" + s + "'";
    }
    return s;
}

Misc.toAttribute = function(s) {
    if (s) {
        s = s.toString();
        s = Misc.toXml(s);
        s = s.replace(/"/g, '&quot;');
        // todo: s = s.replace(/'/g, '&#145;');
    }
    else {
        s = '';
    }
    return s;
}

Misc.toName = function(s, allowUpperCase) {
    var name = '';
    if (!allowUpperCase) { s = s.toLowerCase(); }
    var allowed = [
            'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
            '0','1','2','3','4','5','6','7','8','9', '_'];
    if (allowUpperCase) {
        var max = allowed.length;
        for (var i = 0; i < max; ++i) {
            var allowedUpper = allowed[i].toUpperCase();
            if (allowedUpper != allowed[i]) {
                allowed[allowed.length] = allowedUpper;
            }
        }
    }
    for (var i = 0; i < s.length; ++i) {
        var letter = s.substring(i, i + 1);
        if ( allowed.inArray(letter) ) { name += letter; }
    }
    return name;
}

Misc.getChars = function(char, numberOfChars) {
    var s = '';
    for (var i = 1; i <= numberOfChars; i++) {
        s += char;
    }
    return s;
}

Misc.forceMinMax = function(v, min, max) {
    if (v < min) {
        v = min;
    }
    else if (v > max) {
        v = max;
    }
    return v;
}

Misc.getRandomInt = function(min, max) {
    return Math.floor( ( (max + 1 - min) * Math.random() ) + min );
}

Misc.getFormattedJson = function(arr, level) {
    var dumped_text = '';
    if (!level) level = 0;

    var level_padding = "";
    for(var j = 1; j < level + 1; j++) level_padding += '  ';

    if ( typeof(arr) == 'object' ) {
        for(var item in arr) {
            var value = arr[item];

            if ( typeof(value) == 'object' ) {
                dumped_text += level_padding + "" + Misc.toXml(item) + " ...\r\n";
                dumped_text += Misc.getFormattedJson(value, level + 1);
            }
            else if ( typeof(value) == 'function' ) {
            }
            else if ( typeof(value) == 'string' ) {
                dumped_text += level_padding + "" + Misc.toXml(item) + " = \"" + Misc.toXml(value) + "\"\r\n";
            }
            else {
                dumped_text += level_padding + "" + Misc.toXml(item) + " = " + value + "\r\n";
            }
        }
    }
    else {
        dumped_text = "===>" + arr + "<===(" + typeof(arr) + ")";
    }
    return dumped_text;
}

Misc.getParam = function(id) {
    var thisValue = null;
    var hash = parent.location.hash;
    if (hash != '') {
        var params = hash.substring(1);
        if ( params.indexOf('=') >= 0) {
            var nameValues = params.split('&');
            for (var i = 0; i < nameValues.length; ++i) {
                var nameValue = nameValues[i].split('=');
                if (id == nameValue[0]) {
                    thisValue = nameValue[1];
                    break;
                }
            }
        }
        else {
            var parts = params.split('/');
            if (parts.length == 2) {
                if (id == 'mode') {
                    thisValue = parts[0];
                }
                else if (id == 'id') {
                    thisValue = parts[1];
                }
            }
            else if (parts.length == 1 && id == 'mode') {
                thisValue = params;
            }
        }
    }

    if (thisValue && thisValue != '') {
        var thisValueOld = thisValue;
        thisValue = thisValue.replace('<', '');
        thisValue = thisValue.replace('>', '');
        thisValue = thisValue.replace('&', '');
        thisValue = thisValue.replace('"', '');
        thisValue = thisValue.replace("'", '');
        thisValue = thisValue.replace(" ", '');
        thisValue = thisValue.replace('%', '');
        thisValue = thisValue.replace('#', '');
        if (thisValue != thisValueOld) { thisValue = ''; }
    }

    return thisValue;
}

Misc.getFormValue = function(id) {
    var v = '';
    var elm = document.getElementById(id);
    if (elm) { v = Misc.getElmFormValue(elm); }
    return v;
}

Misc.getElmFormValue = function(elm) {
    var v = '';
    switch (elm.type) {
        case 'checkbox':
            v = elm.checked;
            break;
        default:
            v = elm.value;
    }
    return v;
}

Misc.setFormValue = function(id, v) {
    var elm = document.getElementById(id);
    if (elm) {
        elm.value = v;
    }
}

Misc.preloadImage = function(url) {
    var img =  new Image();
    img.src = url;
}

Misc.pad = function(v) {
    if ( (v+'').length == 1) { v = '0' + v; }
    return v;
}

Misc.focusElm = function(id) {
    var elm = document.getElementById(id);
    if (elm) { elm.focus(); }
}

Misc.elmSelectAll = function(id) {
    // if (browserDetect) {
    //    if ( !(browserDetect.browser == 'Explorer' && browserDetect.version <= 6) ) {
            var elm = document.getElementById(id);
            if (elm) { elm.select(); }
    //    }
    // }
}

Misc.setOpacity = function(elm, opacityFloat) {
    elm.style.MozOpacity = opacityFloat;
    elm.style.opacity = opacityFloat;
    // elm.style.MsFilter = "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + parseInt(opacityFloat * 100) + ")";
    // elm.filters.item('DXImageTransform.Microsoft.Alpha').opacity = parseInt(opacityFloat * 100);
    // elm.style.filter = 'alpha(opacity=' + parseInt(opacityFloat * 100) + ')';
}

Misc.isEmailAddress = function(s) {
    var isIt = false;
    if (s && s != '') {
        isIt = s.indexOf('@') >= 1 && s.indexOf('.') >= 1 && s.length >= 5
    }
    return isIt;
}

Misc.toBool = function(v) {
    return v && ( v == 1 || v.toLowerCase() == 'true' );
}

Misc.getElmCursorPos = function(id) {
    var pos = null;
    var elm = document.getElementById(id);
    if (elm) { pos = Misc.getCursorPos(elm); }
    return pos;
}

Misc.getCursorPos = function(elm) {
    return elm.selectionStart;
}

Misc.setCursorPos = function(elm, pos) {
    elm.selectionStart = pos;
    elm.selectionEnd = pos;
}

Misc.isSet = function(v) {
    return v != null; // undefined === v ? // todo
    // or perhaps: return ! ( ((s == null) || (s.length == 0)) );
}

// MD5 (Message-Digest Algorithm)
// http://www.webtoolkit.info/javascript-md5.html

Misc.md5 = function(string) {
 
    function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }
 
    function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
     }
 
     function F(x,y,z) { return (x & y) | ((~x) & z); }
     function G(x,y,z) { return (x & z) | (y & (~z)); }
     function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }
 
    function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
 
    function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
 
    function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
 
    function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };
 
    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };
 
    function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    };
 
    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
 
        for (var n = 0; n < string.length; n++) {
 
            var c = string.charCodeAt(n);
 
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
 
        }
 
        return utftext;
    };
 
    var x=Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;
 
    string = Utf8Encode(string);
 
    x = ConvertToWordArray(string);
 
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
 
    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }
 
    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);
 
    return temp.toLowerCase();
}

Misc.getCookie = function(name) {
    var start = document.cookie.indexOf( name + '=' );
    var len = start + name.length + 1;
    if ( ( !start ) && ( name != document.cookie.substring( 0, name.length ) ) ) {
        return null;
    }
    if ( start == -1 ) return null;
    var end = document.cookie.indexOf(';', len);
    if ( end == -1 ) end = document.cookie.length;
    return unescape( document.cookie.substring(len, end) );
}

Misc.setCookie = function(name, value, expiresDays, path, domain, secure) {
    var today = new Date();
    today.setTime( today.getTime() );
    if (expiresDays) {
        expiresDays = expiresDays * 1000 * 60 * 60 * 24;
    }
    if (!path) { path = '/'; }
    var expires_date = new Date( today.getTime() + (expiresDays) );
    document.cookie = name + '=' + escape( value ) +
        ( (expiresDays) ? ';expires=' + expires_date.toGMTString() : '' ) + // expires.toGMTString()
        ( (path) ? ';path=' + path : '' ) +
        ( (domain) ? ';domain=' + domain : '' ) +
        ( (secure) ? ';secure' : '' );
}

Misc.deleteCookie = function(name, path, domain) {
    if ( Misc.getCookie(name) ) document.cookie = name + '=' +
            ( (path) ? ';path=' + path : '') +
            ( (domain) ? ';domain=' + domain : '' ) +
            ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
}

Misc.formatNumber = function(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

Misc.getFilenameOfPath = function(path) {
    return path.split('\\').pop().split('/').pop();
}

Misc.getExtensionOfPath = function(path) {
    return path ? path.split('\\').pop().split('/').pop().split('.').pop() : null;
}

Misc.jsonToUrlParams = function(json) {
    var url = '';
    for (var name in json) {
        if ( Misc.isSet(json[name]) ) {
            var value = json[name];
            if ( typeof(value) == 'object') {
                for (var i = 0; i < value.length; ++i) {
                    var thisValue = value[i];
                    url += '&' + encodeURIComponent(name + '[]') + '=' +  encodeURIComponent(thisValue);
                }
            }
            else {
                url += '&' + encodeURIComponent(name) + '=' +  encodeURIComponent(value);
            }
        }
    }
    return url;
}

Misc.elmExists = function(id) {
    return !!document.getElementById(id);
}

Misc.getHash = function(s) {
    return Misc.md5(s);
}

Misc.getStringUntilOrAll = function(s, endAt) {
    var endAtPos = s.indexOf(endAt);
    if (endAtPos >= 1) {
        s = s.substr(0, endAtPos + endAt.length);
    }
    return s;
}

Misc.getStringFromOrAll = function(s, startAt) {
    var startAtPos = s.indexOf(startAt);
    if (startAtPos >= 1) {
        s = s.substr(startAtPos);
    }
    return s;
}

Misc.isInteger = function(s) {
    var isIt = true;
    for (var i = 0; i < s.length && isIt; i++) {
        var c = s.charAt(i);
        var isDigit = s >= '0' && s <= '9';
        if (!isDigit) { isIt = false; }
    }
    return isIt;
}

Misc.escapeRegex = function(s) {
    return s.replace(/([\\\^\$>*+[\]?{}.=!:(|)])/g, '\\$1');
}

Misc.doReplace = function(sAll, sFind, sReplace, caseSensitive) {
    var sFind = Misc.escapeRegex(sFind);
    var regexFind = new RegExp( sFind, (caseSensitive ? 'g' : 'gi') );
    return sAll.replace(regexFind, sReplace);
}

Misc.isUrl = function(s) {
    var isIt = false;
    if (s && typeof s == 'string') {
        isIt = s.indexOf('://') >= 0 || ( s.indexOf('/') >= 0 && s.indexOf('.html') >= 0 );
    }
    return isIt;
}

Misc.isImagePath = function(s) {
    var imageExtensions = new Array('.png', '.jpg', '.gif');
    return Misc.stringContainsOneOf(s, imageExtensions) && s.indexOf(' ') == -1;
}

Misc.stringContainsOneOf = function(sourceString, findArray) {
    var does = false;
    for (var i = 0; i < findArray.length && !does; i++) {
        does = sourceString.indexOf(findArray[i]) >= 0;
    }
    return does;
}

Misc.ucWords = function(s) {
    return (typeof s == 'string') ? s.ucWords() : null;
}

Misc.getTitleCase = function(sInput) {
    var s = null;
    if (sInput) {
        s = sInput.toLowerCase().ucWords();

        var smallWords = new Array('the', 'a', 'an', 'and', 'or', 'at', 'of', 'an', 'for');
        for (smallWord in smallWords) {
            s = Misc.doReplace( s, ' ' + smallWord.ucFirst() + ' ', ' ' + smallWord + ' ' );
        }
        for (smallWord in smallWords) {
            s = Misc.doReplace( s,  ': ' + smallWord + ' ', ': ' + smallWord.ucFirst() + ' ' );
            s = Misc.doReplace( s, '- ' + smallWord + ' ', ': ' + smallWord.ucFirst() + ' ' );
        }

        var letters = new Array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t',
                'u','v','w','x','y','z');
        for (letter in letters) {
            s = Misc.doReplace( s, '"' + letter, '"' + letter.ucFirst() );
        }
    }
    return s;
}

Misc.getFlippedString = function(s) {
    s = s.toLowerCase();
    var last = s.length - 1;
    var sNew = '';
    for (var i = last; i >= 0; --i) {
        sNew += Misc.getFlippedChar( s.charAt(i) );
    }
    return sNew;
}

Misc.getFlippedChar = function(c) {
    var convert = {
            'a' : '\u0250',
            'b' : 'q',
            'c' : '\u0254',
            'd' : 'p',
            'e' : '\u01DD',
            'f' : '\u025F' ,
            'g' : 'b',
            'h' : '\u0265',
            'i' : '\u0131',
            'j' : '\u0638',
            'k' : '\u029E',
            'l' : '1',
            'm' : '\u026F',
            'n' : 'u',
            'o' : 'o',
            'p' : 'd',
            'q' : 'b',
            'r' : '\u0279',
            's' : 's',
            't' : '\u0287',
            'u' : 'n',
            'v' : '\u028C',
            'w' : '\u028D',
            'x' : 'x',
            'y' : '\u028E',
            'z' : 'z',
            '[' : ']',
            ']' : '[',
            '(' : ')',
            ')' : '(',
            '{' : '}',
            '}' : '{',
            '?' : '\u00BF',
            '\u00BF' : '?',
            '!' : '\u00A1',
            "'" : ',',
            ',' : "\'"
            };
    return convert[c] && typeof convert[c] == 'string' ? convert[c] : c;
}

Misc.decimalToHex = function(d) {
    d = parseInt(d);
    return d.toString(16).toUpperCase();
}

Misc.hexToDecimal = function(h) {
    return parseInt(h,16);
}
