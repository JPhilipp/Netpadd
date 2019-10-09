<?
class Site {

var $fileDialogsAtStart = 6;
var $maxFileSizeMegabytes = 100;

public function run() {
    error_reporting(E_ALL);

    $errorMessage = null;
    if ( !Site::usesCorrectAuthentication(&$errorMessage) ) { die($errorMessage); }

    // ob_start('ob_gzhandler');
    $page = new Page();
    $page->title = 'Netpadd B';
    $page->addStylesheet('default.css');
    $page->addScript('misc.js');
    $page->addScript('default.js');

    switch ( Misc::getParam('mode') ) {
        case '':
            $initialPath = Misc::getParam('path');
            $initialText = $this->getInitialTextareaContent(&$initialPath);
            $page->onload = "g_init('')";
            // $page->addScript('http://www.google.com/jsapi');
            $page->additionalBodyAttributes = 'oncontextmenu="return false"';
            if ($initialPath) {
                $hash = md5($initialText);
                $page->title = Misc::getFilename($page->title) . ' - ' . $page->title;
                $page->onload = "g_init('" . Misc::toJSParam($initialPath) . "','" . Misc::toJSParam($hash) . "')";
            }

            $page->sendHttpHeader();
            echo $page->getHeader();
            echo $this->getMenu() .
                    '<textarea id="textfield" spellcheck="false" onmouseover="app.textfieldOver()" wrap="off">' .
                    Misc::toXml($initialText) .
                    '</textarea>';
            echo $page->getFooter();
            break;

        case 'upload':
            $path = Misc::getParam('path');
            $page->mode = 'upload';
            $page->title .= ' upload';
            $page->sendHttpHeader();
            echo $page->getHeader();
            echo $this->getUploadPage($path);
            echo $page->getFooter();
            break;

        case 'doUpload':
            $path = Misc::getParam('path');
            $overwriteExisting = Misc::paramToBool( Misc::getParam('overwriteExisting') );
            $page->mode = 'upload';
            $page->title .= ' uploading...';
            $page->sendHttpHeader();
            echo $page->getHeader();
            echo $this->doUpload($path, $overwriteExisting);
            echo $page->getFooter();
            break;

        default:
            $page->mode = 'notFound';
            $page->httpHeader = 'HTTP/1.0 404 Not Found; Content-type: text/html; charset=UTF-8';
            $page->sendHttpHeader();
            echo $page->getHeader();
            echo '<p class="warning">Ooops, file not found. &nbsp; <a href="/">home</a></p>';
            echo $page->getFooter();
            break; 
    }
}

private function getInitialTextareaContent(&$path) {
    $s = '';
    if ( isSet($path) && $path ) {
        $api = new Api();
        $array = $api->getFileTextArray($path);
        if ( isSet($array['text']) ) {
            $s = $array['text'];
            $s = str_replace("\r\n", "\n", $s);
            $path = $array['path'];
        }
    }
    return $s;
}

private function getUploadPage($path) {
    $s = '';

    $s .= '<div class="contentPage uploadPage">';
    $s .= '<h1>Upload files to ' . Misc::toXml($path) . ' ...</h1>';
    $s .= '<form action="./" method="post" enctype="multipart/form-data">';
    $s .= '<input type="hidden" name="MAX_FILE_SIZE" value="' . $this->megabytesToBytes($this->maxFileSizeMegabytes) . '" />';
    for ($i = 1; $i <= $this->fileDialogsAtStart; $i++) {
        $s .= '<div class="fileItem"><strong>File:</strong> <input type="file" name="file' . $i . '" /></div>';
    }

    $s .= '<div id="additionalFormChoices"><input type="checkbox" name="overwriteExisting" id="overwriteExisting" checked="checked" /> ' .
            '<label for="overwriteExisting">Overwrite existing files</label></div>';
    $s .= '<p class="formButtons"><input type="submit" value="&#9654; Submit" /></p>';
    $s .= '<input type="hidden" name="mode" value="doUpload" />';
    $s .= '<input type="hidden" name="path" value="' . Misc::toAttribute($path) . '" />';
    $s .= '</form>';
    $s .= '</div>';

    return $s;
}

private function doUpload($baseTargetPath, $overwriteExisting, $debug = false) {
    $s = '';
    $s .= '<div class="contentPage uploadPage">';
    $s .= '<h1>Uploading to ' . Misc::toXml($baseTargetPath) . ' ...</h1>';
    if ( is_dir($baseTargetPath) ) {
        $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif', 'ico', 'wmv', 'mov', 'zip', 'txt', 'dat', 'ttf');
        foreach ($_FILES as $file) {
            extract($file);
    
            if ( $name != '' && $size > 0 && is_uploaded_file($tmp_name) ) {
                $s .= '<p class="uploadItem"><strong>Uploading ' . Misc::toXml( Misc::cutLength($name, 18) ) . ' ...</strong><br />';
    
                if ($debug) {
                    $s .= 'Type = ' . Misc::toXml($type) . '<br />';
                    $s .= 'Size = ' . Misc::toXml($size) . '<br />';
                    $s .= 'Temp name = ' . Misc::toXml($tmp_name) . '<br />';
                }
    
                if ( $size <= $this->megabytesToBytes($this->maxFileSizeMegabytes) ) {
    
                    $extension = Misc::getFileExtension($name);
                    if ( in_array( strToLower($extension), $allowedExtensions ) ) {
                        $guid = Misc::getGuid();
                        $targetPath = $baseTargetPath . $name;
                        $exists = file_exists($targetPath);
                        if (!$exists || $overwriteExisting) {
                            if ( move_uploaded_file($tmp_name, $targetPath) ) {
                                $s .= '<em class="success">Success, uploaded.</em> ';
                                $s .= '<em>' . $this->bytesToKiloBytes($size) . ' KB.</em> ';
                                if ($exists) { $s .= '<em>Existing file was overwritten.</em> '; }
                            }
                            else {
                                $s .= '<strong class="error">Something went wrong with this upload...</strong>';
                            }
                        }
                        else {
                            $s .= '<strong class="error">Cancelled, file exists.</strong>';
                        }
                    }
                    else {
                        $s .= '<strong class="error">Uploading ' . Misc::toXml($extension) . ' files is not allowed ' .
                            '(allowed extensions are ' . Misc::toXml( implode(', ', $allowedExtensions) ) . ')</strong>';
                    }
                }
                else {
                    $s .= '<strong class="error">This file is too large, ' .
                            'maximum file size allowed is ' . $this->maxFileSizeMegabytes . 'MB</strong>';
                }
    
                $s .= '</p>';
            }
    
        }
    }
    else {
        $s .= '<p><strong class="error">Cancelled, base path missing...</strong></p>';
    }

    $s .= '<p><em>Done.</em></p>';

    $s .= '</div>';
    return $s;
}

private function megabytesToBytes($megabytes) {
    $bytesInMegabytes = 1048576;
    return $megabytes * $bytesInMegabytes;
}

private function bytesToKiloBytes($bytes) {
    return number_format( ceil($bytes / 1024) );
}

private function getMenu() {
    $spacer = ' ';
    $group = '-';
    $break = '...';
    $actions = array(
        'File' => $group,
        'New' => 'handleNewFile',
        'Open - Ctrl + O' => 'handleOpenFile',
        '' => $break,
        'Save - Ctrl + S' => 'saveFile',
        'Save as... - F12' => 'handleSaveFileAs',
        'Revert' => 'revertFileToSaved',
        'Save backup - Alt + B' => 'saveBackup',
        'Load backup - Alt + Shift + B' => 'loadBackup',

        'Selection' => $group,
        'Escape HTML - Ctrl + H' => 'convertSelectionToHtml',
        'Wrap with tag - Ctrl + Q' => 'wrapSelectionWithTag',
        'Syntax help - F1' => 'handleShowSyntaxHelp',
        'Count letters' => 'countLetters',
        'Select part - Ctrl + W;' => 'selectWithinAllLimits',
        'Transform' => 'handleTransformSelection',

        'Tools' => $group,
        'Find - Ctrl + F' => 'handleSearch',
        'Replace' => 'handleReplace',
        'Jump to row - F2' => 'handleJumpToRow',
        'Delete lines' => 'handleDeleteLines',
        'Open browser - Ctrl + N' => 'openNewBrowserWindow',
        'Open Google - Ctrl + G' => 'openGoogle',
        'Insert character - Ctrl + I' => 'openUnicodeTable',
        'Toggle line wrap - Ctrl + P' => 'toggleLineWrapping',
        'About... - F1' => 'showAbout'
        );

    $menuEntries = array();
    foreach ($actions as $label => $call) {
        if ($call == $group) {
            $menuEntries[] = '<div class="groupHeader" id="groupHeader' . ucFirst( Misc::toName($label) ) . '">' .
                    $label . '</div>';
        }
        else if ($call == $break) {
            $menuEntries[] = '<div class="breaker"></div>';
        }
        else {
            $quotedCall = "'" . $call . "'";
            $shortcut = '';
            if ( strPos($label, ' - ') !== false ) {
                list($label, $shortcut) = explode(' - ', $label);
            }
            $label = Misc::toXml($label);
            $menuEntries[] = '<a href="javascript:Misc.hideElm(' . "'toolbox'" . ');app.' . $call . '();Misc.focusElm(' .  "'textfield'" . ')" ' .
                    'class="toolboxItem" id="toolboxItem' . ucFirst($call) . '" title="' . $shortcut . '">' . $label . '</a> ';
        }
    }
    return '<div id="toolboxOpener" onmouseover="app.toolboxOpenerOver()" title="Open toolbox (Alt + X)">&nbsp;</div>' .
            '<div id="toolbox" onmouseover="app.toolboxOver()">' .
            implode($spacer, $menuEntries) . '</div>';
}


public static function usesCorrectAuthentication(&$errorMessage) {
    // didn't work: || !isset($_SERVER['PHP_AUTH_USER'])
    $ok = false;

    $mustUseSSL = true;

    $errorMessage = '';
    if ( Misc::isLocal() ) { 
        $ok = true;
    }
    else {
        $usesSSL = intval($_SERVER["SERVER_PORT"]) == 443;
        if ($usesSSL || !$mustUseSSL) {
            $htaccessPath = '.htaccess';
            if ( !file_exists($htaccessPath) ) { $htaccessPath = '../' . $htaccessPath; }
    
            if ( file_exists($htaccessPath) ) {
                $text = Misc::getFileText($htaccessPath);
                $text = str_replace("\r\n", "\r", $text);
                $text = str_replace("\n", "\r", $text);
                if ( strpos($text, "\rrequire user ") !== false ) {
                    $ok = true;
                }
                else {
                    $errorMessage = 'Cancelled, no authentication found';
                }
            }
        }
        else {
            $errorMessage = 'Cancelled, must use https';
        }
    }
    return $ok;
}

}
?>