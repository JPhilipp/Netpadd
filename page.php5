<?
class Page {

public $title = '';
public $description = null;
public $httpHeader = 'Content-type: text/html; charset=UTF-8';
public $onload = '';
public $version = '';
public $includes = '';
public $mode = '';
public $baseUrl = '/';
public $additionalBodyAttributes = '';

public function Page($version = '1.0') {
    $this->version = $version;
}

public function sendHttpHeader() {
    header($this->httpHeader);
}

public function getHeader() {
    global $text;
    $s = '';
    $s .= '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">' . "\r\n";
    $s .= '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">' . "\r\n";
    $s .= '<head>' . "\r\n";
    $s .= '<title>' . Misc::toXml($this->title) . '</title>' . "\r\n";
    $s .= $this->includes;
    if ($this->description) {
        $s .= '<meta name="description" content="' . Misc::toXml($this->description) . '" />' . "\r\n";
    }
    $s .= '</head>' . "\r\n";
    if ($this->additionalBodyAttributes != '') {
        $this->additionalBodyAttributes = ' ' . trim($this->additionalBodyAttributes);
    }
    $s .= '<body';
    if ($this->onload != '') { $s .= ' onload="' . $this->onload . '"'; }
    $s .= ' id="body" class="mode' . ucFirst( Misc::toName($this->mode != '' ? $this->mode : 'home') ) . '"' .
            $this->additionalBodyAttributes . '>' . "\r\n\r\n";
    return $s;
}

public function getFooter($extra = '') {
    $s = '';
    $s .= "\r\n\r\n" . '</body>' . "\r\n" . '</html>';
    return $s;
}

public function addStylesheet($url) {
    $version = strPos($url, '://') === false ? $this->getVersionString() : '';
    $this->includes .= '<link rel="stylesheet" href="' . Misc::toAttribute($url) . $version . '" ' .
            'type="text/css" media="screen,print,projection" />' . "\r\n";
}

public function addScript($url) {
    $version = strPos($url, '://') === false ? $this->getVersionString() : '';
    $this->includes .= '<script type="text/javascript" src="' . Misc::toAttribute($url) . $version .
            '"></script>' . "\r\n";
}

private function getVersionString() {
    return '?v=' . str_replace('.', '_', $this->version);
}

}
?>