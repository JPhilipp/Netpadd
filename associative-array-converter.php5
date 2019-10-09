<?
class AssociativeArrayConverter {

var $text = '';
var $depth = 0;

public function show($arr, $format) {
    switch ($format) {
        case 'json':
            header('Content-type: text/plain; charset=UTF-8');
            @header( 'Cache-Control: no-cache, must-revalidate');
            echo $this->getJson($arr);

            break;
        case 'xml':
            header('Content-type: text/xml; charset=UTF-8');
            @header( 'Cache-Control: no-cache, must-revalidate');
            echo $this->getXml($arr);
            break;

        default:
            die('Unknown converter format');
    }
}

public function getJson($data) {
    $s = '';
    $s = json_encode($data);
    return $s;
}

function getXml($array) {
    $this->text = '';
    $this->text .= '<' . '?xml version="1.0" encoding="UTF-8" ?' . '>' . "\r";
    $this->text .= '<data>' . "\r";
    $this->text .= $this->arrayTransform($array);
    $this->text .= '</data>';
    return $this->text;
}

function arrayTransform($array, $parentKey = '') {
    $this->depth++;
    foreach($array as $key => $value) {
        $key = Misc::toName($key, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-', false);
        if ($key == '') {
            $newKey = $this->str_replace_last('es', '', $parentKey);
            if ($newKey == $parentKey) {
                $newKey = $this->str_replace_last('s', '', $parentKey);
            }
            if ($newKey == '') { $newKey = 'item'; }
            $key = $newKey;
        }

        if( !is_array($value) ) {
            $value = Misc::toXml($value);
            $this->text .= $this->getIndent() . "<$key>$value</$key>\r";
        }
        else {
            $this->text .= $this->getIndent() . "<$key>" . "\r";
            $this->arrayTransform($value, $key);
            $this->depth--;
            $this->text .= $this->getIndent() . "</$key>\r";
       }
    }
    return $array_text;
}


private function str_replace_last($what, $with_what, $where) {
    $tmp_pos = strrpos($where, $what);
    if ($tmp_pos !== false) {
        $where = subStr($where, 0, $tmp_pos) . $with_what . subStr( $where, $tmp_pos + strLen($what) );
    }
    return $where;
}

private function getIndent() {
    $indents = '';
    $singleIndent = "\t";
    for ($i = 1; $i <= $this->depth; $i++) {
        $indents .= $singleIndent;
    }
    return $indents;
}

}
?>