var app = new App();

window.onresize = g_resize;
window.onbeforeunload = g_onbeforeunload;

function g_init(initialPath, initialHash) {
    app.init(initialPath, initialHash);
}

function g_onbeforeunload(evt) {
    var message = null;
    var alertWhenUnsaved = false;
    if ( alertWhenUnsaved && app.relevantUnsavedChanges() ) {
        var message = 'You got unsaved changes, close anyway?';
        if (typeof evt == 'undefined') { evt = window.event; }
        if (evt) { evt.returnValue = message; }
    }
    return message;
}

function g_keypress(evt) {
    return app.handleKeypress(evt);
}

function g_keypressTextfield(evt) {
    return app.handleKeypress(evt, 'textfield');
}

App.prototype.handleKeypress = function(evt, sType) {
    var returnValue = true;
    var key = window.event ? event.keyCode : evt.keyCode;
    var sKey = String.fromCharCode(key).toLowerCase();
    var doBubble = false;
    if (sType == 'textfield') {
        doBubble = this.keypressTextfield(evt, key, sKey);
    }
    else {
        doBubble = this.keypress(evt, key, sKey);
    }
    if (!doBubble) {
        returnValue = false;
        if (evt.preventDefault) evt.preventDefault();
        if (evt.stopPropagation) evt.stopPropagation();
        evt.cancelBubble = true;
    }
    evt.returnValue = returnValue;
    return returnValue;
}

function g_resize() {
    if (app.inited) {
        app.adjustTextfieldHeight();
        var elm = Misc.getElm('alert');
        if (elm) { app.positionAlert(elm); }
    }
}

App.prototype.test = function() {
    var cursorPos = this.getCursorPos();
    var row = this.getRowNumberFromPos( this.getText(), cursorPos );
    this.alert('Row = ' + row + ' (based on cursor pos = ' + cursorPos + ')');
}

App.prototype.init = function(initialPath, initialHash) {
    this.textfield = Misc.getElm('textfield');
    this.adjustTextfieldHeight();
    this.loadAutoCompleteData();
    if (initialPath != '') { this.filepath = initialPath; }
    this.updateTitle();
    // this.adjustFont();
    this.addKeyListeners();
    this.lastSavedTextHash = initialHash;
    this.turnCursorNormal();
    this.textfield.focus();
    this.inited = true;
}

App.prototype.adjustFont = function() {
    var fontDetector = new g_fontDetector();
    if ( !fontDetector.test('fixedsys') ) {
        if ( fontDetector.test('consolas') ) {
            this.textfield.style.lineHeight = '1.1em';
        }
    }
}

App.prototype.receiveJsonResponse = function() {
    if ( app.requestOk() ) {
        var data = '';
        eval('data = ' + app.request.responseText + ';');
        app.callbackFunction(data);
    }
}

App.prototype.relevantUnsavedChanges = function() {
    return !this.textSameAsSavedOrEmptyAndNew();
}

App.prototype.textSameAsSavedOrEmptyAndNew = function() {
    var text = this.getText();
    var isIt = (text == '' && !this.filepath) || Misc.getHash(text) == this.lastSavedTextHash;
    return isIt;
}

App.prototype.requestOk = function() {
    return app.request.readyState == 4 && app.request.status == 200;
}

App.prototype.updateTitle = function(s) {
    var s = this.name;
    if (this.filepath) {
        s = Misc.getFilenameOfPath(this.filepath) + ' - ' + s;
    }
    document.title = s;
}

App.prototype.recordTyping = function(s) {
    var didComplete = false;
    var isLetter = s >= 'a' && s <= 'z';
    if (!isLetter) {
        if (s == ' ') {
            didComplete = this.handleAutoCompletion(this.previouslyTyped);
        }
        this.previouslyTyped = '';
    }
    else {
        this.previouslyTyped += s + '';
    }
    return didComplete;
}

App.prototype.handleAutoCompletion = function(sTyped) {
    var didComplete = false;
    var filetype = this.getFiletype();
    var sComplete = null;
    if (this.autoComplete[sTyped] &&
            (typeof this.autoComplete[sTyped] == 'string') ) {
        sComplete = this.autoComplete[sTyped];
    }
    else if ( this.autoComplete[filetype + ':' + sTyped] &&
            (typeof this.autoComplete[filetype + ':' + sTyped] == 'string') ) {
        sComplete = this.autoComplete[filetype + ':' + sTyped];
    }
    if (sComplete) {
        var cursorPos = this.getCursorPos();
        this.insertAtCursorPos(' ' + sComplete);
        this.select( cursorPos + 1, this.getCursorPos() );
        didComplete = true;
    }
    return didComplete;
}

App.prototype.getFiletype = function() {
    var filetype = null;
    if (this.filepath) {
        filetype = Misc.getExtensionOfPath(this.filepath).toLowerCase();
        var mapTo = {
                'chrome-php' : 'php',
                'chrome-js' : 'javascript',
                'chrome-css' : 'css',
                'php5' : 'php',
                'htm' : 'html',
                'py' : 'python',
                'js' : 'javascript'
                };
        if (mapTo[filetype]) { filetype = mapTo[filetype]; }
    }
    return filetype;
}

App.prototype.keypress = function(evt, key, sKey) {
    var doBubble = true;
    if (key == this.keyEsc) {
        Misc.hideElm('alert');
        Misc.hideElm('toolbox');
        this.hideDialog();
        this.textfield.focus();
    }
    return doBubble;
}

App.prototype.keypressTextfield = function(evt, key, sKey) {
    var doBubble = true;
    var didComplete = this.recordTyping(sKey);

    if (didComplete) {
        doBubble = false;
    }
    else if (evt.altKey && sKey == 'x') {
        if ( Misc.isShowing('toolbox') ) {
            Misc.hideElm('toolbox');
            this.textfield.focus();
        }
        else {
            Misc.showElm('toolbox');
            Misc.focusElm('toolboxItemConvertSelectionToHtml');
        }
        doBubble = false;
    }
    else if ( !(evt.altKey || evt.metaKey) ) {
        doBubble = false;

        if (evt.shiftKey && key == this.keyTab) {
            this.removeTab();
        }
        else if (key == this.keyTab) {
            this.insertTab();
        }
        else if (evt.ctrlKey && sKey == 'f') {
            this.handleSearch();
        }
        else if (evt.ctrlKey && sKey == 'g') {
            this.openGoogle();
        }
        else if (evt.ctrlKey && sKey == 'h') {
            this.convertSelectionToHtml();
        }
        else if (evt.ctrlKey && sKey == 'i') {
            this.openUnicodeTable();
        }
        else if (evt.ctrlKey && sKey == 'j') {
            this.handleTransformSelection();
        }
        else if (evt.ctrlKey && evt.shiftKey && sKey == 'k') {
            this.translateSelection('zh');
        }
        else if (evt.ctrlKey && sKey == 'k') {
            this.translateSelection('en');
        }
        else if (evt.ctrlKey && sKey == 'm') {
            this.test();
        }
        else if (evt.ctrlKey && sKey == 'n') {
            this.openNewBrowserWindow();
        }
        else if (evt.ctrlKey && sKey == 'o') {
            this.handleOpenFile();
        }
        else if (evt.ctrlKey && sKey == 'p') {
            this.toggleLineWrapping();
        }
        else if (evt.ctrlKey && sKey == 'q') {
            this.wrapSelectionWithTag();
        }
        else if (evt.ctrlKey && sKey == 'r') {
            this.handleReplace();
        }
        else if (evt.ctrlKey && sKey == 's') {
            this.saveFile();
        }
        else if (evt.ctrlKey && sKey == 'w') {
            this.selectWithinAllLimits();
        }
        else if (evt.ctrlKey && sKey == 'w') {
            this.selectWithinAllLimits();
        }
        else if (key == this.keyF1) {
            this.handleShowSyntaxHelp();
        }
        else if (key == this.keyF2) {
            this.handleJumpToRow();
        }
        else if (evt.shiftKey && key == this.keyF3) {
            this.findPrevious();
        }
        else if (key == this.keyF3) {
            this.findNext();
        }
        else if (key == this.keyF12) {
            this.handleSaveFileAs();
        }
        else {
            // this.alert(key);
            doBubble = true;
        }

    }
    return doBubble;
}

App.prototype.alertError = function(message, enumTime) {
    if (!enumTime) { enumTime = this.enumTimeNormal; }
    this.alert('<img src="image/bad.png" alt="" /> <em>' + message + '</em>', enumTime, 'alertError');
}

App.prototype.alertSuccess = function(message, enumTime) {
    if (!enumTime) { enumTime = this.enumTimeNormal; }
    this.alert('<img src="image/good.png" alt="" /> <em>' + message + '</em>', enumTime);
}

App.prototype.convertSelectionToHtml = function() {
    this.applyToSelection(Misc.toXml, true);
}

App.prototype.handleSearch = function() {
    var selectedText = this.getSelectedText();
    var defaultString = selectedText ? selectedText : this.searchString;
    var sDialog = this.getInputRow('Find', null, true, defaultString );
    this.receiveDialogValue( sDialog, function(sFind) {
        this.searchString = sFind;
        this.findNext();
    });
}

App.prototype.translateSelection = function(targetLang) {
    var selection = this.getSelectedText();
    this.lastTargetLang = targetLang;
    var params = {
            'q' : selection,
            'v' : '1.0',
            'langpair' : '|' + targetLang,
            'callback' : 'app.callbackByTranslation'
            };
    this.callApiExternal('http://ajax.googleapis.com/ajax/services/language/translate', params);
}

App.prototype.callbackByTranslation = function(data) {
    if (data.responseData && data.responseData.translatedText) {
        var langNames = {'en' : 'English', 'zh' : 'Chinese'};
        var translation = data.responseData.translatedText;
        app.showDialog('<img src="image/translate.png" alt="" /> ' +
                'Translation into ' + Misc.toXml(langNames[this.lastTargetLang]) + ' &nbsp; ' +
                '<span class="poweredBy">(powered by Google)</span>', translation);
    }
}

App.prototype.handleTransformSelection = function() {
    var options = [
            "UPPER CASE",
            "Mixed Case",
            "Mixed Case for Titles",
            "lower case",
            'Flipped'
            ];
    var s = '';
    s += '<div class="transformText">';
    s += 'Transform text to &nbsp;' + this.getSelectBox(options, 'transformType', true);
    s += '</div>';

    this.receiveDialogValue( s, function(transformType) {
        var functions = {
                'UpperCase' : String.toUpperCase,
                'MixedCase' : Misc.ucWords,
                'MixedCaseForTitles' : Misc.getTitleCase,
                'LowerCase' : String.toLowerCase,
                'Flipped' : Misc.getFlippedString
                };
        this.applyToSelection(functions[transformType], true);
    });
}

App.prototype.getTitleCase = function(s) {
    return s;
}

App.prototype.findPrevious = function() {
    if (this.searchString) {
        this.hideAlert();
        var sFind = this.searchString;
        var text = this.getText();
        if (!this.searchCaseSensitive) {
            text = text.toLowerCase();
            sFind = sFind.toLowerCase();
        }
        var startPos = this.getCursorPos() - 1;
        var occurrence = text.lastIndexOf(sFind, startPos);
        if (occurrence >= 0) {
            this.select(occurrence, occurrence + sFind.length);
            this.scrollToNewPosIfNeeded( this.getRowNumberFromPos(text, occurrence), false );
        }
        else {
            this.alertError('Nothing found above...');
        }
    }
}

App.prototype.findNext = function() {
    if (this.searchString) {
        this.hideAlert();
        var sFind = this.searchString;
        var text = this.getText();
        if (!this.searchCaseSensitive) {
            text = text.toLowerCase();
            sFind = sFind.toLowerCase();
        }
        var startPos = this.getCursorPos() + 1;
        var occurrence = text.indexOf(sFind, startPos);
        if (occurrence >= 0) {
            this.select(occurrence, occurrence + sFind.length);
            this.scrollToNewPosIfNeeded( this.getRowNumberFromPos(text, occurrence), true );
        }
        else {
            this.alertError('Nothing found below...');
        }
    }
    else {
        this.alertError('No search defined...');
    }
}

App.prototype.scrollToNewPosIfNeeded = function(rowPos, doAlignAtBottom) {
    var viewHeight = Misc.viewportGetHeight();
    var oldScrollTop = this.textfield.scrollTop;
    var oldScrollBottom = oldScrollTop + viewHeight * 1;
    var markerY = this.lineHeight * rowPos;
    var newScrolltop = doAlignAtBottom ?
            markerY - viewHeight + this.scrollPadding * 1 : markerY - this.scrollPadding * 1;
    var necessaryToScroll = markerY < oldScrollTop + this.scrollPadding || markerY > oldScrollBottom - this.scrollPadding;
    if (necessaryToScroll) { this.textfield.scrollTop = newScrolltop; }
}

App.prototype.showMarker = function(y) {
    var elm = Misc.getCreateElement('marker');
    elm.style.top = Math.floor(y - 10 - this.textfield.scrollTop) + 'px'; // - 10
}

App.prototype.getRowNumberFromPos = function(text, occurrence) {
    var textBefore = text.substr(0, occurrence);
    var breakCount = textBefore.split("\n").length;
    return breakCount;
}

App.prototype.toggleLineWrapping = function() {
    var value = this.textfield.getAttribute('wrap');
    var doesWrap = value == 'soft';
    doesWrap = !doesWrap;
    this.textfield.setAttribute('wrap', (doesWrap ? 'soft' : 'off' ) );
    this.alert( 'Line wrapping turned ' + (doesWrap ? 'on' : 'off') , this.enumTimeBrief);
}

App.prototype.receiveDialogValue = function(sDialogInner, thisFunction) {
    var sDialog = '';
    action = "";
    sDialog += '<form onsubmit="javascript:app.performReceiveFunction();return false">';
    sDialog += sDialogInner;
    if ( sDialogInner.indexOf('formButtons') == -1 ) {
        sDialog += '<div class="formButtons"><input type="submit" value="OK" id="okButton" /></div>';
    }
    sDialog += '</form>';

    this.receiveFunction = thisFunction;
    this.showDialog(null, sDialog);

    var elmsToCheck = ['input', 'select'];

    for (var n = 0; n < elmsToCheck.length && !elmToFocusFound; n++) {
        var elms = document.getElementsByTagName(elmsToCheck[n]);
        var elmToFocusFound = false;
        for (var i = 0; i < elms.length && !elmToFocusFound; i++) {
            var elm = elms[i];
            if ( elm.getAttribute('type') == 'text' ) {
                elmToFocusFound = true;
                elm.selectionStart = 0;
                elm.selectionEnd = elm.value.length;
                elm.focus();
            }
            else if (elm.nodeName.toLowerCase() == 'select') {
                elmToFocusFound = true;
                elm.focus();
            }
        }
    }

    if (!elmToFocusFound) {
        Misc.focusElm('okButton');
    }
}

App.prototype.performReceiveFunction = function() {
    this.hideDialog();

    var params = new Array();
    var elms = document.getElementsByTagName('input');
    var inputTypesToPass = new Array('text', 'checkbox', 'radio');
    for (var typesI = 0; typesI < inputTypesToPass.length; typesI++) {
        for (var i = 0; i < elms.length; i++) {
            var elm = elms[i];
            var inputType = elm.getAttribute('type');
            if (inputType == inputTypesToPass[typesI]) {
                params[params.length] = Misc.toJavaScriptParam( v = Misc.getElmFormValue(elm), false, true );
            }
        }
    }

    var elms = document.getElementsByTagName('select');
        for (var i = 0; i < elms.length; i++) {
            var elm = elms[i];
            params[params.length] = Misc.toJavaScriptParam( Misc.getElmFormValue(elm) , false, true);
        }

    var sScript = 'this.receiveFunction(' + params.join(', ') + ');';
    eval(sScript);
}

App.prototype.openGoogle = function() {
    this.openNewBrowserWindow('http://www.google.com');
}

App.prototype.openNewBrowserWindow = function(url) {
    if (!url) { url = ''; }
    setTimeout("app.doOpenNewBrowserWindow('" + url + "')", 10);
}

App.prototype.doOpenNewBrowserWindow = function(url) {
    window.open( url, 'win' + Misc.getRandomString(), 'status=1,menubar=1,location=1,resizable=1,toolbar=1' );
}

App.prototype.handleDeleteLines = function() {
    var s = '';

    var options = [
            'Delete lines which include',
            "Delete lines which don't include",
            'Delete within lines to',
            'Delete within lines from'
            ];
    s += '<div class="deleteLines">';
    s += this.getSelectBox(options, 'deleteType', true);
    s += this.getInputRow( '', 'textToHandle', true, this.getSelectedText() );
    s += '</div>';

    this.receiveDialogValue( s, function(s, deleteType) {
        var text = this.getText();

        var lines = text.split("\n");
        var linesNew = new Array();
        s = s.toLowerCase();

        var functions = new Object();
        functions['DeleteLinesWhichInclude'] = function(s, line) {
            if ( line.toLowerCase().indexOf(s) != -1 ) { line = ''; }
            return line;
        };
        functions['DeleteLinesWhichDontInclude'] = function(s, line) {
            if ( line.toLowerCase().indexOf(s) == -1 ) { line = ''; }
            return line;
        };
        functions['DeleteWithinLinesTo'] = function(s, line) {
            var pos = line.toLowerCase().indexOf(s);
            if (pos != -1) { line = line.substr(pos + s.length); }
            return line;
        };
        functions['DeleteWithinLinesFrom'] = function(s, line) {
            var pos = line.toLowerCase().indexOf(s);
            if (pos != -1) { line = line.substr(0, pos); }
            return line;
        };

        for (var i = 0; i < lines.length; i++) {
            var line = functions[deleteType](s, lines[i]);
            if (line && line != '') { linesNew[linesNew.length] = line; }
        }

        this.setText( linesNew.join("\n") );
        this.selectionStart = 0;
        this.alertSuccess('OK, deleted.', this.enumTimeBrief);

    });
}

App.prototype.getSelectBox = function(labels, id, useSmartValues, selectedValue) {
    var s = '';
    if (labels.length >= 1) {
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i];
            var v = useSmartValues ? label.toLowerCase().ucWords().toName(true) : label;
            var sSelected = selectedValue && selectedValue == v ? ' selected="selected"' : '';
            s += '<option value="' + Misc.toAttribute(v) + '"' + sSelected + '>' + label.toXml() + '</option>';
        }
        s = '<select id="' + id.toAttribute() + '">' + s + '</select>';
    }
    return s;
}

App.prototype.openUnicodeTable = function(filter) {
    var s = '';
    var ranges = this.getUnicodeRanges();

    if (!filter && this.lastUnicodeSearch) { filter = this.lastUnicodeSearch; }
    if (filter) { filter = filter.toLowerCase(); }
    var doExort = false;
    var sExport = '';

    this.callApi('getUnicodeNames', null, function(data) {
        if (!data.error) {
            for (var rangesI = 0; rangesI < ranges.length; rangesI++) {
                var min = ranges[rangesI][0];
                var max = ranges[rangesI][1] ? ranges[rangesI][1] : min;
                for (var i = min; i <= max; i++) {
                    // if (i == testIfExists) { this.alert('Found ' + testIfExists) + '(&#' + testIfExists + ';)'; }
                    var hex = i.toString(16).toLowerCase();
                    var name = data[hex] ? data[hex] : '';
                    var doShow = true;
                    if (filter) {
                        doShow = name.toLowerCase().indexOf(filter) != -1;
                    }
                    if (doShow) {
                        s += '<div class="char" ' +
                                'onmouseover="app.zoomUnicodeCharacter(' + i + ',' + "'" + name + "'" + ')" ' +
                                'onmouseout="Misc.hideElm(' + "'charZoom'" + ')" ' +
                                'onclick="app.insertUnicodeCharacter(' + "'&#" + i + ";'" + ')">&#' + i + ';</div>';
                    }
                    if (doExort) { sExport += hex + "\r"; }
                }
            }

            if (s == '') {
                s = '<p><em class="noCharMatch">Nothing matched your filter.</em></p>';
                this.lastUnicodeSearch = false;
            }

            s = '<div class="characterMap">' + s + '</div>';

            var sClearSearch = filter ?
                    ' : ' + filter.toXml() + '&nbsp; <a href="javascript:app.clearUnicodeSearch()" class="clearSearch" ' +
                    'title="Clear search">&nbsp;x&nbsp;</a>' : '';

            if (doExort) {
                this.showDialog('Export...', '<pre>' + sExport + '</pre>');
            }
            else {
                this.showDialog('Unicode characters &nbsp; ' +
                        '<span class="unicodeSearchLink"><a href="javascript:app.handleUnicodeSearch()">' +
                        '<img src="image/toolbox/search.png" alt="" />&nbsp;Find</a>' + sClearSearch + '</span>', s);
                var headerHeight = 29;
                var charZoomBoxWidth = 95;
                this.positionRelativeToDialogTopLeft('charZoom', -charZoomBoxWidth, headerHeight);
            }
        }
    });
}

App.prototype.clearUnicodeSearch = function() {
    this.lastUnicodeSearch = '';
    this.openUnicodeTable();
}

App.prototype.handleUnicodeSearch = function() {
    var sDialog = this.getInputRow('Find character', null, true);
    this.receiveDialogValue( sDialog, function(sFind) {
        this.lastUnicodeSearch = sFind;
        this.openUnicodeTable(sFind);
    });
}

App.prototype.getUnicodeRanges = function() {
    var v = [
            [171],
            [187], 
            [182], 
            [8776], 
            [9166], 
            [10140], 
            [9654], 
            [9728, 9839], 
            [9985, 9993], 
            [9996, 10023], 
            [10025, 10087], 
            [10132], 
            [10136, 10174], 
            [8592, 8682], 
            [8730, 8734], 
            [10102, 10131], 
            [9632, 9711], 
            [128], 
            [131], 
            [145, 151], 
            [153], 
            [162, 167], 
            [169], 
            [174], 
            [178, 180], 
            [188, 382], 
            [8308, 8319], 
            [664], 
            [9000, 9072], 
            [9150, 9158], 
            [9216, 9229], 
            [9312, 9331], 
            [9393, 9470], 
            [8704, 8945], 
            [8962, 8945], 
            [9472, 9621], 
            [4030, 4044]
            ];
    // v[v.length] = [119860, 120067];
    return v;
}

App.prototype.positionRelativeToDialogTopLeft = function(id, offsetX, offsetY) {
    var elm = Misc.getCreateElement(id);
    var elmDialog = Misc.getElm('dialog');
    if (elm && elmDialog) {
        var dialogX = elmDialog.style.left.replace('px', '');
        var dialogY = elmDialog.style.top.replace('px', '');
        elm.style.left = Number(dialogX) + Number(offsetX) + 'px';
        elm.style.top = Number(dialogY) + Number(offsetY) + 'px';
    }
}

App.prototype.insertUnicodeCharacter = function(s) {
    this.hideDialog();
    this.insertAtCursorPos(s);
}

App.prototype.zoomUnicodeCharacter = function(i, escapedCharacterName) {
    var entity = '&#' + i + ';';
    var elm = Misc.getCreateElement('charZoom');
    elm.style.display = 'block';
    var s = '';
    s += '<div class="charItself">' + entity + '</div>';
    s += '<div class="charName">' + escapedCharacterName + '</div>';
    s += '<div class="charEntity">(' + Misc.toXml(entity) + ')</div>';
    elm.innerHTML = s;
}

App.prototype.handleReplace = function() {
    var s = '';

    s += '<table>';
    s += this.getInputRow( 'Find', 'toFind', false, this.getSelectedText());
    s += this.getInputRow('Replace', 'toReplace');
    s += '<div class="replaceCheckboxes">';
    s += this.getCheckbox('Case sensitive');
    s += this.getCheckbox('Only in selected');
    s += '</div>';
    s += '</table>';

    this.receiveDialogValue( s, function(sFind, sReplace, caseSensitive, onlyInSelected) {
        if (onlyInSelected) {
            var params = {
                    'find' : sFind,
                    'replace' : sReplace,
                    'caseSensitive' : caseSensitive
                    };
            this.applyToSelection( function(s, params) {
                s = this.doReplace(s, params['find'], params['replace'], params['caseSensitive']);
                return s;
            }, false, params);
        }
        else {
            var text = this.getText();
            text = this.doReplace(text, sFind, sReplace, caseSensitive);
            this.setText(text);
        }
        this.alertSuccess('OK, replaced.', this.enumTimeBrief); // ' + sFind + ' with ' + sReplace + '...

    });
}

App.prototype.getCheckbox = function(label, id) {
    if (!id) { id = 'input' + label.ucWords().toName(true); }
    var s = '';
    s += '<div class="checkboxLine">';
    s += '<input type="checkbox" id="' + id.toAttribute() + '" />';
    s += '<label for="' + id.toAttribute() + '">' + label.toXml() + '</label> ';
    s += '</div>';
    return s;
}

App.prototype.getInputRow = function(label, id, wrapWithTable, value, readOnly) {
    if (!id) { id = 'input' + label.ucWords().toName(true); }
    var valueEscaped = value;
    if (valueEscaped) {
        valueEscaped = valueEscaped.replace(/\r\n/g, this.inputCharReturn);
        valueEscaped = valueEscaped.replace(/\n/g, this.inputCharReturn);
        valueEscaped = valueEscaped.replace(/\t/g, this.inputCharTab);
    }
    var sReadOnly = readOnly ? ' readonly="readonly"' : '';
    if (label) { label += ':'; }
    var sValue = value ? ' value="' + Misc.toAttribute(valueEscaped) + '"' : '';
    var s = '<tr><th>' + Misc.toXml(label) + '</th>' +
            '<td><input type="text" id="' + id + '" class="textInput"' + sValue + ' spellcheck="false"' + sReadOnly + ' /></td></tr>';
    if (wrapWithTable) { s = '<table>' + s + '</table>'; }
    return s;
}

App.prototype.countLetters = function() {
    var posFrom = this.textfield.selectionStart;
    var posTo = this.textfield.selectionEnd;
    if (posFrom >= 0 && posTo > posFrom) {
        letterCount = posTo - posFrom;
        var easterEgg = letterCount == 42 ? '. May 25th is Towel Day.' : '';
        this.alert(letterCount + ' letters' + easterEgg);
        this.textfield.focus();
    }
    else {
        this.alertError('Select something first...', this.enumTimeVeryBrief);
    }
}

App.prototype.handleJumpToRow = function() {
    var sDialog = this.getInputRow('Row number', true, true, this.lastRowJumpedTo);
    this.receiveDialogValue( sDialog, function(row) {
        if ( Misc.isInteger(row) ) {
            this.hideAlert();

            var stringToPassByRef = new StringToPassByRef();
            stringToPassByRef.s = this.getText();

            this.lastRowJumpedTo = row;

            var posStartEnd = this.getPosArrayByRowNumber(stringToPassByRef, row);
            var pos = posStartEnd[0];
            var posEnd = posStartEnd[1];
            if (pos >= 0) {
                this.textfield.focus();
                this.textfield.selectionStart = pos;
                this.textfield.selectionEnd = posEnd;
                this.textfield.scrollTop = this.lineHeight * row - 40;
            }
            else {
                this.alertError('Row not found...', this. enumTimeBrief);
            }
        }
        else {
            this.alertError('Cancelled, not a number...', this.enumTimeBrief);
        }
    });
}

App.prototype.getPosArrayByRowNumber = function(stringToPassByRef, row) {
    var pos = -1;
    var posEnd = -1;
    var lines = stringToPassByRef.s.split("\n");
    if (lines.length >= row) {
        for (var i = 0; i < row - 1; i++) {
            pos += lines[i].length + 1;
            if (i == row - 2) {
                posEnd = pos + lines[i + 1].length + 1;
                break;
            }
        }
    }
    return new Array(pos, posEnd);
}

App.prototype.wrapSelectionWithTag = function() {
    var defaultTag = this.lastWrapTag;
    var selection = this.getSelectedText();
    if ( ( Misc.isUrl(selection) || Misc.isEmailAddress(selection) ) && selection.indexOf(' ') == -1 ) {
        defaultTag = 'a';
    }
    else if ( Misc.isImagePath(selection) ) {
        defaultTag = 'img';
    }
    var sDialog = this.getInputRow('Tag', true, true, defaultTag);
    this.receiveDialogValue( sDialog, function(sTag) {
        this.lastWrapTag = sTag;

        this.applyToSelection( function(selection) {
            var sWrapped = '';
            if (sTag == 'img') {
                sWrapped = '<img src="' + Misc.toAttribute(selection) + '" alt="" />';
            }
            else {
                var attributeName = sTag == 'a' ? 'href' : null;
                var attributeValue = Misc.isUrl(selection) ? selection : '';
                if ( sTag == 'a' && Misc.isEmailAddress(selection) ) { attributeValue = 'mailto:' + selection; }
                var sAttribute = attributeName ?
                        ' ' + attributeName + '="' + Misc.toAttribute(attributeValue) + '"' : '';
                sWrapped = '<' + sTag + sAttribute + '>' + selection + '</' + sTag + '>';
            }
            return sWrapped;
        });
    
    });
}

App.prototype.applyToSelection = function(thisFunction, verboseSuccess, optionalParams) {
    var posFrom = this.textfield.selectionStart;
    var posTo = this.textfield.selectionEnd;
    if (posFrom >= 0 && posTo > posFrom) {
        var text = this.getText();
        text = this.getText();
        var selection = text.substr(posFrom, posTo - posFrom);
        var selectionNew = optionalParams ? thisFunction(selection, optionalParams) : thisFunction(selection);
        if (selectionNew != selection) {
            text = text.substr(0, posFrom) + selectionNew + text.substr(posTo);
            this.setText(text);
            this.textfield.selectionStart = posFrom;
            this.textfield.selectionEnd = posFrom + selectionNew.length;
        }
        if (verboseSuccess) { this.alert('OK, done', this.enumTimeVeryBrief); }
    }
    else {
        this.alertError('Select something first...', this.enumTimeVeryBrief);
    }
}

App.prototype.selectWithinAllLimits = function() {
    var text = this.getText();
    var cursorPos = this.getCursorPos();
    var chars = [
            ['"', '"', false],
            ["'", "'", false],
            ['<', '>', true],
            ['>', '<', false]
            ];
    var enumIncludeLimits = 2;

    var lastPos = text.lastIndexOf("\n", cursorPos);
    var nextPos = text.indexOf("\n", cursorPos);
    if (lastPos > 1 && nextPos > lastPos) {
        var part = text.substr( lastPos + 1, nextPos - (lastPos + 1) );
        var startPos = cursorPos - lastPos;
        var selectionLength = this.textfield.selectionEnd - this.textfield.selectionStart;
        var endPos = cursorPos + selectionLength  - lastPos;

        var didSelect = false;
        for (var i = 0; i < chars.length && !didSelect; i++) {
            var limits = this.findLimits(part, startPos, endPos,
                    chars[i][0], chars[i][1], chars[i][enumIncludeLimits]);
            if (limits) {
                var padding = chars[i][enumIncludeLimits] ? 2 : 1;
                var thisPart = part.substr( limits[0] + padding, limits[1] - limits[0] - (1 + padding) );
                if ( thisPart.indexOf('>') == -1 && thisPart.indexOf('<') == -1 ) {
                    this.select(lastPos + limits[0] + 2, lastPos + limits[1] + 1);
                    didSelect = true;
                }
            }
        }
    }
}

App.prototype.findLimits = function(text, startPos, endPos, lastChar, nextChar, includeLimits) {
    var limits = null;
    var lastPos = text.lastIndexOf(lastChar, startPos - 1);
    var nextPos = text.indexOf(nextChar, endPos + 1);
    if (lastPos > 1 && nextPos > lastPos) {
        if (includeLimits) {
            lastPos--;
            nextPos++;
        }
        limits = new Array(lastPos, nextPos);
    }
    return limits;
}

App.prototype.handleOpenFile = function() {
    if ( this.relevantUnsavedChanges() ) {
        var sDialog = this.getOkCancelForm('You got unsaved changes, continue opening file?');
        this.receiveDialogValue( sDialog, function() {
            this.showFilesAndFoldersDialog(this.lastPath, 'open');
        });
    }
    else {
        this.showFilesAndFoldersDialog(this.lastPath, 'open');
    }
}

App.prototype.getOkCancelForm = function(question) {
    var s = '';
    s += '<div class="questionDialog">';
    s += '<p class="question">' + Misc.toXml(question) + '</p>';
    s += '<p class="formButtons">' +
            '<input type="submit" value="OK" id="okButton" /> ' +
            '<input type="button" value="Cancel" class="lessImportantButton" onclick="app.hideDialog()" /> ' +
            '</p>';
    s += '</div>';
    return s;
}

App.prototype.openFile = function(path) {
    this.showFilesAndFoldersDialog(path, 'open');
}

App.prototype.showFilesAndFoldersDialog = function(path, sType) {
    this.alertLoading();
    this.callApi('getFilesAndFoldersList', {'path' : path}, function(data) {
        if (data.error) {
            this.alertError(data.error);
        }
        else {
            if (data.someFilesOmitted) {
                this.alertError("Some files or folders aren't showing because this folder contains so much.");
            }

            if (!path && this.lastPath) { path = this.lastPath; }

            var imageExtensions = new Array('jpg', 'jpeg', 'gif', 'png', 'bmp', 'ico');
            var s = '';
            var upIndicator = '/..';
            path = data.path;
            var editableExtensions = data.editableExtensions;
        
            var dialogTitle = '';
            var fileAction = '';
            var filename = '';
            var selectedExtension = '';
            if (sType == 'open') {
                dialogTitle = 'Open File';
                fileAction = 'loadFile';
            }
            else if (sType == 'saveAs') {
                dialogTitle = 'Save File';
                fileAction = 'handleSaveAsThisFile';
                filename = Misc.getFormValue('filename');
                selectedExtension = Misc.getFormValue('extension');
            }
        
            for (var i = 0; i < data.folders.length; i++) {
                var folder = data.folders[i].path;
                var escapedFolder = "'" + Misc.toJavaScriptParam(folder) + "'";
                var isUpFolder = folder.length - folder.lastIndexOf(upIndicator) - upIndicator.length == 0;
                var sId = isUpFolder ? ' id="folderItemUp"' : '';
                var sStyle = '';
                var sIcon = data.folders[i].icon ? '<img src="' + data.folders[i].icon + '" class="icon" alt="" /> ' : '';
                s += '<a href="javascript:app.showFilesAndFoldersDialog(' + escapedFolder + ', ' + "'" + sType + "'" + ')" ' +
                        'class="folderItem"' + sId + sStyle + '>' +
                        sIcon +
                        Misc.getFilenameOfPath(folder) + '</a>';
            }

            for (var i = 0; i < data.files.length; i++) {
                var file = data.files[i].path;
                var sizeKb = data.files[i].sizeKb;
                var filedate = data.files[i].date;
                var isNewest = data.files[i].isNewest;
                var escapedFile = "'" + Misc.toJavaScriptParam(file) + "'";
                var extension = Misc.getExtensionOfPath(file).toLowerCase();
                var isEditable = editableExtensions.inArray(extension);
                var sClass = '';
                var sNewIcon = isNewest ? ' <img src="image/newest.png" alt="[newest]" />' : '';
                if (isEditable) {
                    sClass = 'fileItem';
                    s += '<a href="javascript:app.' + fileAction + '(' + escapedFile + ')" class="' + sClass + '" title="' +
                            Misc.formatNumber( Math.ceil(sizeKb) ) + ' KB - ' + filedate + '">' +
                            Misc.getFilenameOfPath(file) + sNewIcon + '</a>';
                }
                else {
                    sClass = imageExtensions.inArray(extension) ? 'imageItemNonEditable' : 'fileItemNonEditable';
                    s += '<span class="' + sClass + '" title="' + Misc.formatNumber( Math.ceil(sizeKb) ) + ' KB - ' + filedate + '">' +
                            Misc.getFilenameOfPath(file) + sNewIcon + '</span>';
                }
            }
        
            var sMainIcons = '<img src="image/folder-default-in-header.png" alt="" class="icon" />&nbsp; ';
            if (data.icon) {
                sMainIcons = ' <img src="' + data.icon + '" alt="" class="icon" />&nbsp; ';
            }
        
            var sFooter = '';
            if (sType == 'saveAs') {
                sFooter = this.getSaveAsDialogFooter(path, filename, editableExtensions, selectedExtension);
            }

            this.showDialog(dialogTitle + ' &nbsp; <span class="dialogHeaderPath">' +
                    sMainIcons + path + this.getFolderTools(path) + '</span>', s, sFooter);

            if (sType == 'saveAs') {
                Misc.focusElm('filename');
            }
            else {
                Misc.focusElm('folderItemUp');
            }

            this.lastPath = path;

            if (!data.someFilesOmitted) { this.hideAlert(); }
        }
    });
}

App.prototype.getSaveAsDialogFooter = function(path, filename, editableExtensions, selectedExtension) {
    var s = '';
    s += '<form class="filename" onsubmit="javascript:app.handleSaveAsNewFile(' + "'" + path + "'" + ');return false">';
    s += '<strong class="filenameLabel">File name:</strong> &nbsp;' +
            '<input type="text" class="textInput" name="filename" id="filename" value="' + filename.toAttribute() +'" /> <strong>.</strong> ' +
            this.getSelectBox(editableExtensions, 'extension', false, selectedExtension) +
            '&nbsp; <input type="submit" value="Save" />';
    s += '</form>';
    return s;
}

App.prototype.getFolderTools = function(path) {
    var escapedPath = Misc.toJavaScriptParam(path, false, true);
    s = '<div id="folderTools">';
    s += '<img src="image/create-folder.png" alt="Create folder" title="Create folder" ' +
            'onclick="app.handleCreateFolder(' + escapedPath + ')" /> &nbsp; ';
    s += '<img src="image/upload-files.png" alt="Upload files" title="Upload files" ' +
            'onclick="app.handleUploadFiles(' + escapedPath + ')" /> ';
    s += '</div>';
    return s;
}

App.prototype.handleCreateFolder = function(path) {
    var sDialog = this.getInputRow('Folder name', true, true);
    this.receiveDialogValue( sDialog, function(folderName) {
        if ( folderName.indexOf('/') == -1 ) {
            var folderPath = this.lastPath + folderName;
            this.callApi('createFolder', {'path' : folderPath}, function(data) {
                if (data.error) {
                    this.alertError(data.error);
                }
                else {
                    var newPath = data.path;
                    this.showFilesAndFoldersDialog(newPath, 'open');
                }
            });
        }
        else {
            this.alertError('Cancelled, folder names may not contain slashes');
        }
    });
}

App.prototype.handleUploadFiles = function(path) {
    window.open('./?mode=upload&path=' + path, 'win' + Misc.getRandomString(), 'width=600,height=300');
    this.hideDialog();
}

App.prototype.handleSaveAsThisFile = function(path) {
    this.receiveDialogValue( this.getOkCancelForm('Overwrite existing file?'), function() {
        this.filepath = path;
        this.saveFile();
        this.updateTitle();
    });
}

App.prototype.handleSaveAsNewFile = function(basePath) {
    var filename = Misc.getFormValue('filename');
    if (filename != '') {
        var extension = Misc.getFormValue('extension');
        this.filepath = basePath + filename + '.' + extension;
        this.callApi('fileExists', {'path' : this.filepath}, function(data) {
            if (data.error) {
                this.alertError(data.error);
            }
            else {
                if (data.exists) {
                    this.handleSaveAsThisFile(this.filepath);
                }
                else {
                    this.saveFile();
                    this.updateTitle();
                }
            }
        });
    }
    else {
        this.alertError('Cancelled, no file name provided.');
        Misc.focusElm('filename');
    }
}

App.prototype.loadFile = function(path) {
    this.turnCursorLoading();
    this.hideDialog();
    this.alertLoading();
    this.callApi('getFileText', {'path' : path}, function(data) {

        if (data.error) {
            this.alertError(data.error);
        }
        else {
            this.filepath = path;
            this.updateTitle();
            this.setText(data.text);
            this.turnCursorNormal();
            this.lastSavedTextHash = Misc.getHash( this.getText() );
            this.textfield.focus();
            this.textfield.selectionStart = 0;
            this.textfield.selectionEnd = 0;
            this.hideAlert();
        }

    });
}

App.prototype.loadBackup = function(path) {
    this.callApi('getBackupText', null, function(data) {
        if (data.error) {
            this.alertError(data.error);
        }
        else {
            this.setText(data.text);
        }
    });
}

App.prototype.revertFileToSaved = function() {
    if (this.filepath) {
        if ( this.relevantUnsavedChanges() ) {
            var sDialog = this.getOkCancelForm('You got unsaved changes, continue reverting file?');
            this.receiveDialogValue( sDialog, function() {
                this.callApi('getFileText', {'path' : this.filepath}, function(data) {
                    if (data.error) {
                        this.alertError(data.error);
                    }
                    else {
                        this.alertSuccess('OK, reverted.');
                        this.updateTitle();
                        this.setText(data.text);
                        this.textfield.selectionStart = 0;
                        this.textfield.selectionEnd = 0;
                    }
                });
            });
        }
        else {
            this.alertSuccess('File is already as saved');
        }
    }
    else {
        this.alertError('Cannot revert as file is not saved...');
    }
}

App.prototype.handleShowSyntaxHelp = function() {
    var selection = this.getSelectedText();
    var rgb = this.getCSSColorRGBArray(selection);
    if (rgb) {
        this.showColorInfo(rgb);
    }
    else {
        this.didTryFallback = false;
        this.showSyntaxHelp(selection);
    }
}

App.prototype.showColorInfo = function(rgb) {
    // xxx
    // App.prototype.getInputRow = function(label, id, wrapWithTable, value) {

    var s = '';
    var hex = this.getHexArray(rgb);
    s += '<table>';
    s += this.getInputRow( 'RGB', null, false, 'rgb(' + rgb.join(',') + ')', true );
    s += this.getInputRow( 'Hex', null, false, '#' + hex.join(''), true );
    s += '</table>';
    s += '<div id="colorPreview" style="background-color: rgb(' + rgb.join(',') + ')"></div>';

    this.showDialog(null, s);
}

App.prototype.getHexArray = function(rgbArray) {
    var hex = new Array();
    for (var i = 0; i < rgbArray.length; i++) {
        var thisHex = Misc.decimalToHex(rgbArray[i]);
        thisHex = Misc.pad(thisHex);
        hex[hex.length] = thisHex;
    }
    return hex;
}

App.prototype.getCSSColorRGBArray = function(s) {
    var rgb = null;
    s = s.toLowerCase();
    if ( s.indexOf('rgb(') == 0 ) {
        s = Misc.doReplace(s, 'rgb(', '');
        s = Misc.doReplace(s, ')', '');
        rgb = new Array();
        rgb = s.split(',');
        if (rgb.length == 3) {
            for (var i = 0; i < rgb.length; i++) {
                var color = rgb[i];
                color = color.trim();
                if ( color.indexOf('%') >= 0 ) {
                    color = this.getPercentageValue(color, 255);
                    alert('after: ' + color);
                }
                rgb[i] = color;
            }
        }
        else {
            rgb = null;
        }
    }
    else if ( s.indexOf('#') == 0 ) {
        s = Misc.doReplace(s, '#', '');
        var hexShortLength = 3;
        var hexNormalLength = 6;
        if (s.length == hexShortLength) {
            var sNormal = '';
            for (var i = 0; i < hexShortLength; i++) {
                var v = s.substr(i, 1);
                sNormal += v + '' + v;
            }
            s = sNormal;
        }
        if (s.length == 6) {
            var hexPartSize = 2;
            rgb = new Array();
            for (var i = 0; i < s.length; i += hexPartSize) {
                var hex = s.substr(i, hexPartSize);
                var decimal = parseInt(hex, 16);
                rgb[rgb.length] = decimal;
            }
        }
    }
    
    return rgb;
}

App.prototype.getPercentageValue = function(percent, max) {
    var v = 0;
    percent = parseInt(percent);
    if (percent >= 0 && percent <= max) {
        v = parseInt(percent / 100 * max);
    }
    return v;
}

App.prototype.showSyntaxHelp = function(selection) {
    var filetype = this.getFiletype();

    this.syntaxBit = selection ? selection : this.getSelectedText();
    if (!this.syntaxBit || this.syntaxBit == '') { this.syntaxBit = this.getPrecedingTextBit(); }
    this.syntaxBit.trim();
    if (this.syntaxBit != '') {
        var queries = {
                'php' : 'site:php.net "description * ' + this.syntaxBit + '" intitle:"' + this.syntaxBit +' manual"',
                'javascript' : 'site:developer.mozilla.org/en/Core_JavaScript_1.5_Reference/ "syntax * ' + this.syntaxBit + '" parameter',
                'python' : filetype + this.syntaxBit,
                'css' : 'site:www.w3.org/TR/CSS2/ "' + this.syntaxBit + ' value"',
                };
        var query = queries[filetype] ? queries[filetype] : this.syntaxBit;
        this.callApiSyntaxHelp(query);
    }
}

App.prototype.getSelectedText = function() {
    var text = null;
    var posFrom = this.textfield.selectionStart;
    var posTo = this.textfield.selectionEnd;
    if (posFrom >= 0 && posTo > posFrom) {
        text = this.getText().substr(posFrom, posTo - posFrom);
    }
    return text;
}

App.prototype.select = function(posFrom, posTo) {
    this.textfield.selectionStart = posFrom;
    this.textfield.selectionEnd = posTo;
}

App.prototype.getPrecedingTextBit = function() {
    var text = this.getText();
    var cursorPos = this.getCursorPos();
    var maxLength = 100;
    var allowed = new Array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p',
            'q','r','s','t','u','v','w','x','y','z', '_', '-');
    for (var i = cursorPos - 1; i >= cursorPos - maxLength && i >= 0; i--) {
        var letter = text.substr(i, 1).toLowerCase();
        if ( !allowed.inArray(letter) ) { i++; break; }
    }
    var textBit = text.substr(i, cursorPos - i);
    this.lastPrecedingTextBit = textBit;
    return textBit;
}

App.prototype.callbackBySyntaxHelp = function(data) {
    if (data.responseData.results && data.responseData.results.length >= 1) {
        var result = data.responseData.results[0];
        var info = result.content;
        var visibleUrl = result.visibleUrl.replace('www.', '');
        info = info.replace('</b>', '');
        info = info.replace('<b>', '');
        info = info.trim();

        switch ( this.getFiletype() ) {
            case 'php':
                info = info.replace('Description', '');
                info = Misc.getStringUntilOrAll(info, ')');
                break;

            case 'css':
                info = this.lastPrecedingTextBit + ': ' + Misc.getStringAfterOrAll(info, 'Value:');
                break;
        }

        info += ' &nbsp; <span class="alertMore">(<a href="' + Misc.toAttribute(result.url) + '" target="_blank">' +
                visibleUrl + '</a>)</span>';
        app.alert(info);
        this.syntaxBit = null;
    }
    else if (!app.didTryFallback) {
        app.didTryFallback = true;
        this.callApiSyntaxHelp(this.syntaxBit);
    }
    else {
        app.didTryFallback = false;
        app.alert('<em>No info found for ' + this.syntaxBit + '...</em>', this.enumTimeBrief);
        this.syntaxBit = null;
    }
}

App.prototype.alertLoading = function() {
    this.alert('<em><img src="image/hourglass.png" alt="loading..." /></em>', this.enumTimeNormal, 'alertLoading');
}

App.prototype.alert = function(s, enumTime, sClass) {
    if (this.alertTimeout) { clearTimeout(this.alertTimeout); }
    if (!sClass) { sClass = 'alertDefault'; }
    var elm = Misc.getCreateElement('alert');
    elm.setAttribute('class', sClass);
    elm.innerHTML = s;
    elm.style.display = 'block';
    this.positionAlert(elm);

    var seconds = 8;
    if (enumTime == this.enumTimeBrief) {
        seconds = 2.5;
    }
    else if (enumTime == this.enumTimeVeryBrief) {
        seconds = .8;
    }

    this.alertTimeout = setTimeout('app.hideAlert()', seconds * 1000);
}

App.prototype.positionAlert = function(alertElm) {
    alertElm.style.top = ( Misc.viewportGetHeight() - 9 ) + 'px';
}

App.prototype.hideAlert = function() {
    Misc.hideElm('alert');
    this.alertTimeout = null;
}

App.prototype.callApiSyntaxHelp = function(query) {
    var params = {
            'q' : query,
            'v' : '1.0',
            'callback' : 'app.callbackBySyntaxHelp'
            };
    this.callApiExternal('http://ajax.googleapis.com/ajax/services/search/web', params);
}

App.prototype.callApiExternal = function(url, paramsData) {
    id = 'id' + Misc.getRandomString();
    var dataString = Misc.jsonToUrlParams(paramsData);
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.id = id;
    script.src = url + '?' + dataString;
    document.body.appendChild(script);
    setTimeout('app.removeElement("' + id + '")', 10000);
}

App.prototype.removeElement = function(id) {
    var elm = Misc.getElm(id);
    if (elm) { document.body.removeChild(elm); }
}

App.prototype.showDialog = function(titleHtml, contentHtml, footerHtml, optionalId) {
    var id = optionalId ? optionalId : 'dialog';
    var elm = Misc.getCreateElement(id);
    elm.setAttribute( 'class', (footerHtml ? 'includesFooter' : '') );
    var s = '';
    var isFullDialog = !!titleHtml;

    if (titleHtml) {
        s += '<div class="dialogHeader">' + titleHtml + '</div>';
    }

    s += '<img src="image/close-x.png" alt="Close (ESC)" class="closeButton" onclick="app.hideDialog()" />';
    s += '<div class="dialogContent">' + contentHtml + '</div>';
    if (footerHtml) { s += '<div class="dialogFooter">' + footerHtml + '</div>'; }
    
    elm.innerHTML = s;
    elm.style.width = this.dialogWidth + 'px';
    elm.style.left = Math.floor(Misc.viewportGetWidth() / 2 - this.dialogWidth / 2) + 'px';

    if (isFullDialog) {
        elm.style.height = this.dialogHeight + 'px';
        elm.style.top = Math.floor(Misc.viewportGetHeight() / 2 - this.dialogHeight / 2) + 'px';
    }
    else {
        elm.style.height = 'auto';
        elm.style.top = '150px';
    }

    elm.style.display = 'block';
}

App.prototype.hideDialog = function() {
    Misc.hideElm('dialog');
    Misc.hideElm('dialogAbout');
    Misc.setFormValue('filename', '');
    this.textfield.focus();
}

App.prototype.saveFile = function() {
    if (this.filepath) {
        this.alertLoading();
        var text = this.getText();
        var params = {'path' : this.filepath, 'text' : text};
        this.callApi('setFileText', params, function(data) {

            if (data.error) {
                this.alertError(data.error);
            }
            else {
                this.lastSavedTextHash = Misc.getHash(text);
                this.alertSuccess('OK, saved.', this.enumTimeVeryBrief);
            }

        });
        this.hideDialog();
    }
    else {
        this.handleSaveFileAs();
    }
}

App.prototype.saveBackup = function() {
    this.hideAlert();
    var params = {'text' : this.getText()};
    this.callApi('setBackupText', params, function(data) {
        if (data.error) {
            this.alertError(data.error);
        }
        else {
            this.alertSuccess('<em>OK, file backed up.</em>', this.enumTimeBrief);
        }
    });
}

App.prototype.handleSaveFileAs = function() {
    this.showFilesAndFoldersDialog(this.lastPath, 'saveAs');
}

App.prototype.handleNewFile = function() {
    if ( this.relevantUnsavedChanges() ) {
        var sDialog = this.getOkCancelForm('You got unsaved changes, continue creating new file?');
        this.receiveDialogValue( sDialog, function() {
            this.newFile();
        });
    }
    else {
        this.newFile();
    }
}

App.prototype.newFile = function() {
    this.filepath = null;
    this.setText('');
    this.updateTitle();
    this.lastSavedTextHash = null;
}

App.prototype.getText = function() {
    s = this.textfield.value;
    return s;
}

App.prototype.setText = function(s) {
    var scrollPos = this.textfield.scrollTop;
    this.textfield.value = s;
    this.textfield.scrollTop = scrollPos;
}

App.prototype.adjustTextfieldHeight = function() {
    this.textfield.style.height = ( Misc.viewportGetHeight() * 1 + 12 ) + 'px';
}

App.prototype.insertTab = function() {
    this.insertAtCursorPos(this.tabString);
}

App.prototype.removeTab = function() {
    var text = this.getText();
    var pos = this.getCursorPos();
    var tabLength = this.tabString.length;
    var isPrecededByTab = text.substr(pos - tabLength, tabLength) == this.tabString;
    if (isPrecededByTab) {
        text = text.substr(0, pos - tabLength) + text.substr(pos, text.length - tabLength);
        this.setText(text);
        this.setCursorPos(pos - tabLength);
    }
}

App.prototype.insertAtCursorPos = function(s) {
    var cursorPos = this.getCursorPos();
    this.insertAt(cursorPos, s);
    this.setCursorPos(cursorPos + s.length);
}

App.prototype.insertAt = function(pos, s) {
    this.setText( this.getText().insertAt(pos, s) );
}

App.prototype.getCursorPos = function() {
    return Misc.getCursorPos(this.textfield);
}

App.prototype.setCursorPos = function(pos) {
    Misc.setCursorPos(this.textfield, pos);
}

App.prototype.showAbout = function() {
    var s = '';
    var url = document.location + '';
    s += '<p>Netpadd B v0.4 2009 by Philipp Lenssen. For more see <a href="http://www.netpadd.com" target="_blank">Netpadd.com</a>. ' +
            'Email <a href="mailto:philipp.lenssen@gmail.com">philipp.lenssen@gmail.com</a> for feedback.</p>';
    s += '<p>Some icons by <a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">FamFam</a> and ' +
            '<a href="http://www.fatcow.com/free-icons/index.bml" target="_blank">FatCow</a>, ' +
            '<a href="http://creativecommons.org/licenses/by/2.5/" target="_blank">CC</a>-' +
            '<a href="http://creativecommons.org/licenses/by/3.0/us/" target="_blank">licensed</a>.</p>';
    s += '<p class="aboutDetails">';
    s += 'App path: <a href="' + Misc.toAttribute(url) + '" target="_blank">' +
            Misc.toXml( url.cutLength(30) ) + '</a><br />';
    s += 'File path: ' + Misc.toXml( Misc.doReplace(this.filepath, "\\", "\\ ") ) + '<br />';
    s += '</p>';
    this.showDialog('About Netpadd', s, null, 'dialogAbout');
}

App.prototype.callApi = function(operation, paramsData, callbackFunction) {
    app.request = false;
    if (!paramsData) { paramsData = new Array(); }
    paramsData['operation'] = operation;
    var dataString = Misc.jsonToUrlParams(paramsData);

    if (window.XMLHttpRequest) {
        app.request = new XMLHttpRequest();
        if (app.request.overrideMimeType) {
            app.request.overrideMimeType('text/html');
        }
    }
    else if (window.ActiveXObject) {
        try {
            app.request = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (e) {
            try {
                app.request = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (e) {
            }
        }
    }

    this.callbackFunction = callbackFunction;
    app.request.onreadystatechange = app.receiveJsonResponse;
    app.request.open('POST', 'api/', true);
    app.request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    app.request.setRequestHeader('Content-length', dataString.length);
    app.request.setRequestHeader('Connection', 'close');
    app.request.send(dataString);
    // app.alert('Debug info: <a href="api/?' + dataString + '" target="_blank">Calling API ' +
    //     Misc.toXml( dataString.cutLength(30) ) + '</a>...', this.enumTimeNormal);
}

App.prototype.toolboxOpenerOver = function() {
    if (app.inited) {
        if (this.toolboxTimer) {
            clearTimeout(this.toolboxTimer);
            this.toolboxTimer = null;
        }
        Misc.showElm('toolbox');
    }
}

App.prototype.textfieldOver = function() {
    if (app.inited) {
        this.toolboxTimer = setTimeout('Misc.hideElm("toolbox")', 200);
    }
}

App.prototype.toolboxOver = function() {
    if (this.toolboxTimer) {
        clearTimeout(this.toolboxTimer);
        this.toolboxTimer = null;
    }
}

App.prototype.toolboxOut = function() {
    Misc.hideElm('toolbox');
}

App.prototype.addKeyListeners = function() {
    if (this.textfield.addEventListener) {
        this.textfield.addEventListener('keydown', g_keypressTextfield, false);
        document.addEventListener('keydown', g_keypress, false);
    }
    else if (this.textfield.attachEvent) {
        this.textfield.attachEvent('onkeydown', g_keypressTextfield);
        document.attachEvent('onkeydown', g_keypress);
    }
    else {
        this.textfield.onkeypress = g_keypressTextfield;
        document.onkeypress = g_keypress;
    }
}

App.prototype.loadAutoCompleteData = function() {
    this.autoComplete['html:doctype'] = "html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" " +
            "\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\r<html xmlns=\"http://www.w3.org/1999/xhtml\" " +
            "xml:lang=\"en\" lang=\"en\">\r<head>\r" +
            "<meta http-equiv=\"Content-Type\" content=\"text/html; CHARSET=UTF-8\" />\r" +
            "<title>Unnamed</title>\r</head>\r<body>\r\r</body>\r</html>";
    this.autoComplete['php:doctype'] = this.autoComplete['html:doctype'];
    this.autoComplete['php:for'] = "($i = 1; $i < count($items); $i++) {";
}

App.prototype.turnCursorNormal = function() {
    // this.textfield.style.cursor = 'inherit';
    // document.body.cursor = 'normal';
}

App.prototype.turnCursorLoading = function() {
    // this.textfield.style.cursor = 'progress';
    // document.body.cursor = 'progress';
}

App.prototype.doReplace = function(sAll, sFind, sReplace, caseSensitive) {
    sFind = Misc.escapeRegex(sFind);

    sFind = sFind.replace(/\\\^r/g, "\\n");
    sReplace = sReplace.replace(/\^r/g, "\n");

    sFind = sFind.replace(/\\\^t/g, "\\t");
    sReplace = sReplace.replace(/\^t/g, "\t");

    var regexFind = new RegExp( sFind, (caseSensitive ? 'g' : 'gi') );
    return sAll.replace(regexFind, sReplace);
}

function App() {
    this.name = 'Netpadd B';
    this.filepath = null;
    this.tabString = '    ';
    this.textfield = null;
    this.inited = false;
    this.request = null;
    this.callbackFunction = null;
    this.alertTimeout = null;
    this.didTryFallback = true;
    this.syntaxBit = null;
    this.toolboxTimer = null;
    this.lastSavedTextHash = null;
    this.previouslyTyped = '';
    this.lastPrecedingTextBit = '';
    this.autoComplete = new Object();
    this.lastWrapTag = '';
    this.receiveFunction = null;
    this.lineHeight = 16;
    this.lastRowJumpedTo = null;
    this.lastPath = null;
    this.scrollPadding = 40;
    this.lastUnicodeSearch = null;
    this.lastTargetLang = null;

    this.dialogWidth = 520;
    this.dialogHeight = 320;

    this.inputCharReturn = '^r';
    this.inputCharTab = '^t';

    this.searchString = '';
    this.searchCaseSensitive = '';

    this.enumTimeNormal = 1;
    this.enumTimeBrief = 2;
    this.enumTimeVeryBrief = 3;

    this.keyTab = 9;
    this.keyEsc = 27;
    this.keyF1 = 112;
    this.keyF2 = 113;
    this.keyF3 = 114;
    this.keyF12 = 123;
}
