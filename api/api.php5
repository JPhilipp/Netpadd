<?
class Api {

var $editableExtensions = array('php', 'php5', 'py', 'js', 'txt', 'dat', 'htaccess', 'css', 'java', 'csv',
        'utf8', 'html', 'xml');
var $showOnlyEditable = false;
var $restrictToSampleEditing = false;
var $maxFilesToShow = 200;

public function run() {
    error_reporting(E_ALL);

    $errorMessage = null;
    if ( !Site::usesCorrectAuthentication(&$errorMessage) ) {
        $converter = new AssociativeArrayConverter();
        $array['error'] = $errorMessage;
        $converter->show($array, 'json');
        die();
    }

    $converter = new AssociativeArrayConverter();
    sort($this->editableExtensions);
    $this->editableExtensions[] = 'c';
    $this->editableExtensions[] = 'cpp';
    $this->editableExtensions[] = 'netpadd';
    $this->editableExtensions[] = 'chrome';
    $array = array();
    switch ( Misc::getParam('operation') ) {
        case 'getFilesAndFoldersList':
            $path = Misc::getParam('path');
            if ($path == '' || !$path) {
                $path = $this->changeToForwardSlashes( getCwd() ) . '/../..';
            }
            $path = $this->normalizePath($path . '/');
            $success = false;
            $someFilesOmitted = false;
            $array['folders'] = $this->getFolders($path, &$success, &$someFilesOmitted);
            $array['files'] = $this->getFiles($path, &$success, &$someFilesOmitted);
            $array['someFilesOmitted'] = $someFilesOmitted;
            if ($success) {
                if (!$this->showOnlyEditable) {
                    $array['editableExtensions'] = $this->editableExtensions;
                }
                $iconData = $this->getIconDataIncludingUpper($path);
                if ($iconData) { $array['icon'] = $iconData; }
                $array['path'] = $path;
            }
            else {
                $array['error'] = 'There were problems opening this path (' . $path . ')...';
            }
            break;

        case 'setFileText':
            $path = Misc::getParam('path');
            $extension = Misc::getFileExtension($path);
            $hasPermission = in_array($extension, $this->editableExtensions) && stripos($path, 'backup') === false;
            if ($hasPermission) {
                $path = $this->normalizePath($path);
                $text = Misc::getParam('text');

                if ( !$this->restrictToSampleEditing || strPos($path, 'sample') !== false ) {
                    $text = str_replace("\n", "\r\n", $text);
                    $text = str_replace("\r\n\n", "\r\n", $text);
                    Misc::setFileText($path, $text);
                    $array['message'] = 'success';
                    $array['path'] = $path;
                }
                else {
                    $array['error'] = 'Cancelled, can only save to samples during save mode.';
                }
            }
            else {
                $array['error'] = 'Cancelled, no permission to edit this folder or extension.';
            }
            break;

        case 'getFileText':
            $path = Misc::getParam('path');
            $array = $this->getFileTextArray($path);
            break;

        case 'createFolder':
            $path = Misc::getParam('path');
            if ( !file_exists($path) ) {
                $folderName = Misc::getFolderName($path);
                if ( striPos($folderName, '.') === false ) {
                    if ( mkDir($path) ) {
                        $array['path'] = $path;
                    }
                    else {
                        $array['error'] = 'Error creating directory';
                    }
                }
                else {
                    $array['error'] = 'Cancelled, no permission to create folder names with dots';
                }
            }
            else {
                $array['error'] = 'Cancelled, folder exists already';
            }
            break;

        case 'fileExists':
            $array['exists'] = file_exists( Misc::getParam('path') ) ? true : false;
            break;

        case 'setBackupText':
            $backupPath = $this->getBackupPath();
            $text = Misc::getParam('text');
            Misc::setFileText($backupPath, $text);
            $array['message'] = 'success';
            break;

        case 'getBackupText':
            $backupPath = $this->getBackupPath();
            $text = file_exists($backupPath) ? Misc::getFileText($backupPath) : '';
            $array['message'] = 'success';
            $array['text'] = $text;
            break;

        case 'getUnicodeNames':
            header('Content-type: text/plain; charset=UTF-8');
            echo Misc::getFileText('../data/unicode-names.json');
            die();
            break;

        default:
            header('HTTP/1.0 404 Not Found;');
            $array['error'] = 'Cancelled, operation not found.';
            $converter->show($array, 'json');
            die();
    }
    $converter->show($array, 'json');
}

public function getFileTextArray(&$path) {
    $array = array();
    $path = $this->normalizePath($path);
    $extension = Misc::getFileExtension($path);
    $hasPermission = in_array($extension, $this->editableExtensions);
    if ($hasPermission) {
        if ( file_exists($path) ) {
            $array['text'] = Misc::getFileText($path);
            $array['text'] = $this->encodeCorrectly($array['text']);
            $array['path'] = $path;
        }
        else {
            $array['error'] = 'File not found';
        }
    }
    else {
        $array['error'] = 'No permission to open ' . Misc::toName($extension) . ' files';
    }
    return $array;
}

public function encodeCorrectly($s) {
    if ( mb_detect_encoding($s, 'UTF-8, iso-8859-1') != 'UTF-8' ) {
        $s = utf8_encode($s);
    }
    return $s;
} 

public function getBackupPath() {
    return $this->changeToForwardSlashes( getCwd() . '/../data/backup.netpadd');
}

public function getIconDataIncludingUpper($path) {
    $maxLevelsToCheck = 10;
    $iconData = $this->getIconData($path);
    $pathUp = $path;
    for ($levelUp = 1; $levelUp <= $maxLevelsToCheck && !$iconData; $levelUp++) {
        $pathUp .= '..';
        $pathUp = $this->normalizePath($pathUp);
        if ( strLen($pathUp) > 1) {
            $iconData = $this->getIconData($pathUp);
        }
    }
    return $iconData;
}

public function normalizePath($path) {
    $path = realPath($path);
    $path = str_replace("\\", '/', $path);
    $path = Misc::str_replaceAtEnd('//', '/', $path);
    return $path;
}

private function getFiles($basepath, &$success, &$someFilesOmitted) {
    $items = array();
    $success = false;
    $newestIndex = -1;
    if ( is_dir($basepath) )  {
        @$dh = openDir($basepath);
        if ($dh) {
            $success = true;
            $counter = 0;
            while ( false !== ( $filename = readdir($dh) ) ) {
                $extension = Misc::getFileExtension($filename);
                if( !is_dir($basepath . $filename) && ( !$this->showOnlyEditable || in_array($extension, $this->editableExtensions) ) ) {
                    if (++$counter > $this->maxFilesToShow) {
                        $someFilesOmitted = true;
                        break;
                    }
                    else {
                        $fullpath = $basepath . $filename;
                        $i = count($items);
                        $items[$i] = array();
                        $items[$i]['path'] = $fullpath;
                        $items[$i]['sizeKb'] = filesize($fullpath) / 1000;
                        $items[$i]['date'] = date( 'Y-m-d H:i:s', filemtime($fullpath) );
                        if ($newestIndex == -1 || $items[$i]['date'] > $items[$newestIndex]['date']) {
                            $newestIndex = $i;
                        }
                        $items[$i]['isNewest'] = false;
                    }
                }
            }
            $items = $this->changeToForwardSlashes($items);
            sort($items);
            $items[$newestIndex]['isNewest'] = true;
        }
    }
    return $items;
}

private function getFolders($basepath, &$success, &$someFilesOmitted) {
    $items = array();
    $success = false;
    $maxIconDataCount = 30;
    $iconDataCount = 0;
    if ( is_dir($basepath) )  {
        @$dh = openDir($basepath);
        if ($dh) {
            $success = true;
            $counter = 0;
            while ( false !== ( $filename = readdir($dh) ) ) {
                if( is_dir($basepath . $filename) && $filename != '.' ) {
                    if (++$counter > $this->maxFilesToShow) {
                        $someFilesOmitted = true;
                        break;
                    }
                    else {
                        $i = count($items);
                        $items[$i] = array();
                        $items[$i] = $items[count($items) - 1];
                        $items[$i]['path'] = $basepath . $filename;
                        $items[$i]['icon'] = '';
                        if ($filename != '..' && $iconDataCount < $maxIconDataCount) {
                            $iconData = $this->getIconData($basepath . $filename);
                            if ($iconData) {
                                $iconDataCount++;
                                $items[$i]['icon'] = $iconData;
                            }
                        }
                    }
                }
            }
            $items = $this->changeToForwardSlashes($items);
            sort($items);
        }
    }
    return $items;
}

private function getIconData($path) {
    $iconData = null;
    $iconPath = $path . '/favicon.ico';
    if ( file_exists($iconPath) ) {
        $binary = Misc::getFileText($iconPath);
        $iconData = 'data:image/gif;base64,' . base64_encode($binary);
    }
    return $iconData;
}

private function changeArrayToForwardSlashes($items) {
    for ($i = 0; $i < count($items); $i++) {
        $items[$i] = $this->changeToForwardSlashes($items[$i]);
    }
    return $items;
}

private function changeToForwardSlashes($s) {
    return str_replace("\\", '/', $s);
}

}
?>