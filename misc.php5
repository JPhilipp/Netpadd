<?
class Misc  {

    public static function getFolderName($path) {
        return basename( rtrim($path, '/') );
    }

    public static function getFileExtension($filename) {
        $path_info = pathinfo($filename);
        return isSet($path_info['extension']) ? $path_info['extension'] : null;
    }

    public static function getFilename($path) {
        $path_info = pathinfo($path);
        return isSet($path_info['filename']) ? $path_info['filename'] : null;
    }

    public static function isLocal() {
        return strPos($_SERVER['HTTP_HOST'], '.') === false;
    }

    public static function paramToBool($s) {
        return !!$s || $s == '1' || $s == 'true' || $s == 'on';
    }

    public static function getFileOfPath($path) {
        $lastSlash = strrPos($path, '/');
        return subStr($path, $lastSlash + 1);
    }

    public static function getFolderOfPath($path) {
        $lastSlash = strrPos($path, '/');
        return subStr($path, 0, $lastSlash);
    }

    public static function createFolderIf($path) {
        if ( !file_exists($path) ) { mkDir($path); }
    }

    public static function getNodesOfHtml($url, $xpath, $showWarnings = false, &$dom = null) {
        $dom = new domdocument;
        if ($showWarnings) {
            $dom->loadHtml( Misc::getFileText($url) );
        }
        else {
            @$dom->loadHtml( Misc::getFileText($url) );
        }
        $oXpath = new domXpath($dom);
        $nodes = $oXpath->query($xpath);
        return $nodes;
    }

    public static function getNodesOfHtmlString($htmlString, $xpath, $showWarnings = false) {
        $dom = new domdocument;
        if ($showWarnings) {
            $dom->loadHtml($htmlString);
        }
        else {
            @$dom->loadHtml($htmlString);
        }
        $oXpath = new domXpath($dom);
        $nodes = $oXpath->query($xpath);
        return $nodes;
    }


    public static function fileCopy($fromUrl, $toUrl) {
        if ( strpos($fromUrl, '://') >= 1 ) {
            $binary = Misc::getFileText($fromUrl);
            file_put_contents($toUrl, $binary);
        }
        else {
            copy($fromUrl, $toUrl);
        }
    }

    public static function setFileText($filePath, $s) {
        file_put_contents($filePath, $s);
    }

    public static function getFileText($filePath) {
        $filetext = '';
        if ( strpos($filePath, '://') >= 1 ) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $filePath);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_POST, false);
            $filetext = curl_exec($ch);
            curl_close($ch);
        }
        else {
            $filetext = file_get_contents($filePath);
        }
        return $filetext;
    }

    public static function getFileArray($filepath) {
        $text = file_get_contents($filepath);
        $arr = explode("\r\n", $text);
        if ( count($arr) <= 1 ) {
            $arr = explode("\n", $text);
        }
        return $arr;
    }

    public static function boolToNumber($v) {
        return $v ? 1 : 0;
    }

    public static function getGuid($length = 64) {
        $s = '';
        $simple = $length <= 16;
        for ($i = 1; $i <= $length; $i++) {
            $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
            if ($simple) {
                if ($i == 1) {
                    $chars = 'abcdefghijklmnopqrstuvwxyz';
                }
                else {
                    $chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                }
            }
            $pos = rand( 0, strLen($chars) - 1 );
            $letter = subStr($chars, $pos, 1);
            $s .= $letter;
        }
        return $s;
    }

    public static function cutLength($s, $max = 100) {
        $append = '...';
        if ( strlen($s . $append) > $max ) {
            $s = substr( $s, 0, $max - strlen($append) ) . $append;
        }
        return $s;
    }

    public static function getReferrer() {
        global $_SERVER;
        return $_SERVER['HTTP_REFERER'];
    }

    public static function echoNow($s) {
        echo($s);
        flush();
        ob_flush();
    }

    public static function randFloat($min, $max) {
       return ( $min+lcg_value() * ( abs($max-$min) ) );
    }

    public static function getDomain() {
        return $_SERVER['HTTP_HOST']; // e.g. sketchory.com
    }

    public static function getIp() {
        $ip = null;
        if ($_SERVER['HTTP_X_FORWARDED_FOR']) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return $ip;
    }

    public static function getParam($name, $allow = '', $defaultValue = '') {
        $v = '';
        if ( isset($_GET[$name]) && ($allow == '' || $allow == 'get')  ) {
            $v = $_GET[$name];
        }
        else if ( isset($_POST[$name]) && ($allow == '' || $allow == 'post') ) {
            $v = $_POST[$name];
        }
        if ($v == '' && $defaultValue != '') { $v = $defaultValue; }
        if ( get_magic_quotes_gpc() == 1 ) { $v = stripSlashes($v); }
        return $v;
    }

    public static function getTextBetweenLast($sAll, $sFrom, $sTo) {
        $s = null;
        $posFrom = strrPos($sAll, $sFrom);
        if ($posFrom !== false) {
            $posTo = strPos($sAll, $sTo, $posFrom + 1);
            if ($posTo !== false) {
                $s = subStr( $sAll, $posFrom + 1, $posTo - ($posFrom + 1) );
            }
        }
        return $s;
    }

    public static function getTextBetween($textPar, $startText, $endText, $offset = 0) {
        $text = "--" . $textPar . "--";
        $textBetween = "";
        $i = 0;
        $startPosition = 0;
    
        for ($i = 0; $i <= $offset; $i++)
        {
            $startPosition = strPos($text, $startText, $startPosition);
    
            if ($startPosition >= 1)
            {
                $startPosition += strLen($startText);
                $textFromHere = subStr($text, $startPosition);
                $endPosition = strPos($textFromHere, $endText);
        
                if ($endPosition >= 1 && $i == $offset)
                {
                    $textBetween = subStr($textFromHere, 0, $endPosition);
                }
            }
        }
    
        return $textBetween;
    }

    public static function getIsoDate() {
        $today = getdate();
        $year = $today['year'];
        $mon = Misc::pad($today['mon']);
        $mday = Misc::pad($today['mday']);
        $hours = Misc::pad($today['hours']);
        $minutes = Misc::pad($today['minutes']);
        $seconds = Misc::pad($today['seconds']);
        return "$year-$mon-$mday $hours:$minutes:$seconds";
    }

    public static function pad($thisValue) {
        $newValue = $thisValue;
        if ( strlen($thisValue) == 1 )
        {
            $newValue = "0" . $newValue;
        }
        return $newValue;
    }

    public static function toXml($s) {
        $s = str_replace('&', '&amp;', $s);
        $s = str_replace('<', '&lt;', $s);
        $s = str_replace('>', '&gt;', $s);
        return $s;
    }

    public static function toAttribute($s) {
        $s = Misc::toXml($s);
        $s = str_replace('"', '&quot;', $s);
        return $s;
    }

    public static function toJSParam($s) {
        $s = Misc::toXml($s);
        $s = str_replace('"', '&quot;', $s);
        $s = str_replace("'", "\'", $s);
        return $s;
    }

    public static function toName($s, $abc = 'abcdefghijklmnopqrstuvwxyz', $toLowerCase = true) {
        if ($toLowerCase) { $s = strToLower($s); }
        $sNew = '';
        for ($i = 0; $i < strlen($s); $i++) {
            $letter = substr($s, $i, 1);
            if ( strpos($abc, $letter) === false ) {
                $letter = '';
            }
            $sNew .= $letter;
        }
        return $sNew;
    }

    public static function getProperTitleCase($s) {
        $smallWords = array('the', 'a', 'an', 'and', 'or', 'at', 'of', 'an', 'for');
        $s = strToLower($s);
        $s = ucWords($s);
        foreach ($smallWords as $smallWord) {
            $s = str_replace( ' ' . ucFirst($smallWord) . ' ', ' ' . $smallWord . ' ', $s );
        }
        foreach ($smallWords as $smallWord) {
            $s = str_replace( ': ' . $smallWord . ' ', ': ' . ucFirst($smallWord) . ' ', $s );
            $s = str_replace( '- ' . $smallWord . ' ', ': ' . ucFirst($smallWord) . ' ', $s );
        }
    
        $letters = array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z');
        foreach ($letters as $letter) {
            $s = str_replace( '"' . $letter, '"' . ucFirst($letter), $s );
        }
    
        return $s;
    }

    public static function getFilesInFolder($fullPath) {
        if ( subStr( $fullPath, strLen($fullPath) - 1 ) != '/' ) { $fullPath .= '/'; }
        $dh = opendir($fullPath);  
        while ( false !== ($filename = readdir($dh)) ) {
            if( !is_dir($fullPath . $filename) ) {
                $files[] = $fullPath . $filename;  
            }  
        }  
        return $files;  
    }
    
    public static function getFoldersInFolder($fullPath) {
        if ( subStr( $fullPath, strLen($fullPath) - 1 ) != '/' ) { $fullPath .= '/'; }
        $dh  = opendir($fullPath);  
        while ( false !== ($filename = readdir($dh)) ) {
            if( is_dir($fullPath . $filename) && $filename != '.' && $filename != '..' ) {
                $files[] = $fullPath . $filename;  
            }  
        }  
        return $files;
    }

    public static function str_replaceAtEnd($sFind, $sReplace, $s) {
        // mimicking PHP's inconsistent naming and param order for consistency's sake
        $pos = strRPos($s, $sFind);
        if ( $pos !== false && $pos == ( strLen($s) - strLen($sFind) ) ) {
            $s = substr_replace($s, $sReplace, $pos);
        }
        return $s;
    }

}
?>