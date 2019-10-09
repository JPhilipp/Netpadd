Netpadd B Alpha (v0.5) by Philipp Lenssen 2009
- Use freely and completely at your own risk -
Feedback to philipp.lenssen@gmail.com
More at Netpadd.com + Blogoscoped.com


-------------- What's Netpadd B? -----------------------

Netpadd B is a text editor in particularly useful for plain non-cluttered and fast code editing, but also useful for all other text editing needs. Netpadd B is created in the form of a free browser-based application running as a Google Chrome "Application Shortcut" (it also works in some other browsers like Firefox/ Prism). You can install it locally or on your server; the HTML/JS/CSS front-end communicates via Ajax with the PHP5 back-end. On your server, Netpadd lets you manage text files (and upload other types of files) without FTP. Netpadd B is the cousin of older Netpadd, which was a compiled desktop app. Not needed for Netpadd B are MySQL, Flash, or Java.


-------------- Setup -----------------------------------

Setup steps on the Windows desktop:
1. Install WAMP (a Windows Apache/ MySQL/ PHP installation: http://www.wampserver.com/en/
2. If you haven't already, install Chrome: http://www.google.com/chrome
3. Drop the "netpadd" folder in your localhost directory and make sure it can be run at http://localhost/netpadd/
4. In Netpadd's "tools" folder, connect your preferred text/ code file extensions using the .reg (regedit) routines
5. You should now be able to double-click your text files, and see them being opened automatically with Netpadd B (if not, please drop me an email). Note some parts of the program may need web access (like the syntax lookup feature, which uses Google).

Setup when using the program on your server:
1. Create a password-protected sub-directory on your server, drop the Netpadd files into it; careful, anyone with access to that directory can edit your server's file, upload programs, etc. -- it's similar to giving someone full access to your FTP credentials. Note that Netpadd will check for the availability of an .htaccess file in its folder via the "usesCorrectAuthentication()" function in site.php5
2. If you haven't already, install Chrome: http://www.google.com/chrome (Firefox should also do, but is not as speedy at times; other browsers are untested)
3. Access that folder via https, e.g. https://example.com/administration-with-netpadd/ -- if you wish to not use https (with is not suggested for security reasons), edit the line "$mustUseSSL = true" in site.php5


-------------- Program features explained ---------

To open Netpadd's menu, hit Ctrl + X or hover your mouse over the wrench icon in the top right. Other shortcuts will be listed in a tooltip when you hover over the toolbox items.

- New, Open, Save and Save As should be kind of self-explanatory. It's worth noting that Open will launch the file explorer which lets you do more than just opening a file: you can also click the icons in its top right to create a directory, or upload a new file into the currently shown folder.

- Revert: This will restore the last saved version of your file, i.e. make undone all changes you did since you last saved.

- Save backup, Load backup: This will save (and restore, respectively) a redundant copy of whichever text you're working on, without changing your current working copy's file name/ path/ saving status. This comes in handy if e.g. you briefly want to explore a new direction for your code but you are aware that you may need to roll-back your changes if that route turns out to be unsuccessful. Note that there will be only one shared backup file for all your Netpadd app windows, so you'll overwrite your last backup if you create a new backup. (The file is backed up into data/backup.netpadd, make sure you don't share that folder with anyone if your backups contain sensitive data.)

- Escape HTML: this will turn e.g. "<p>hello world</p>" into "&lt;p&gt;hello world&lt;/p&gt;".

- Wrap with tag: This will put a custom opening and ending tag around your selection, e.g. if your selected text reads "foo" and you choose to wrap it with "blockquote", the result will be "<blockquote>foo</blockquote>".

- Syntax help: Just hit F1 immediately after a word you typed, and a special Google search for that word will be launched. "Special" because the search may be restricted to e.g. just php.net (among other query details) if you're editing a PHP file. The result will then be printed as a yellow alert at the bottom of the window. For instance, when editing a PHP file -- as PHP does not have a consolidated syntax when it comes to things like parameter order or function names -- you could type "strpos", hit F1. and the help will read something along the lines of "int strpos ( string $haystack , mixed $needle [, int $offset = 0 ] )" to assit you.

- Count letters: This will count how many letters (any letter, number etc.) your select string contains. For "foo", it would result in 3.

- Select part: Depending on where your text cursor is currently positioned, this will select some of the stuff surrounding it. For instance, if your cursor is the pipe in "<p>hello| world</p>", then "hello world" would be selected. This feature allows you to quickly mark and then replace or copy element contents, tags, tag attributes, or double or single quoted content.

- Find, Replace: These should be self explanatory except for one thing: To replace or search for line breaks, enter "^r". Enter "^t" for tabs. Also, note that hitting F3 will continue your current search.

- Jump to row: Hit F2 and you will be asked which row (of your programming code I presume) you want to jump to.

- Delete lines: This allows you various methods to automatically convert certain text files, often useful for casually editing larger portions of HTML, CSV etc. data (for instance, you may want to remove all lines in a given copied HTML file which contain the tag "<blockquote>"...).

- Open browser, Open Google: This opens a new browser window, or a new window with Google.com loaded, respectively.

- About: Here you can find out more about the version of the program as well as the current URL your browser is using, in case you're working on an Application Shortcut or Prism app which doesn't contain an address bar.


-------------- Want to add features to Netpadd? ---------

This section isn't a tutorial but simply a tip to get you started on your own: If you know JavaScript and want to add your own menu entry to the program, open the file "default.js". Search for the string "handleReplace" and follow the calls from there to get an idea of how the program works. If you have questions or cool additions, please email me.


-------------- Further credits --------------------------

Some icons are Creative Commons licensed by http://www.famfamfam.com/ and http://www.fatcow.com/free-icons/index.bml
The Doid font is based on Google Android's Droid font, with some readability optimizations made in regard to programming characters like semicolon, comma etc. (optimizations on my specific system at least, using a laptop with ClearType disabled). I originally wanted to use Fixedsys but Chrome doesn't recognize that system font at the moment, and the TrueType replacements didn't have the same effect.
Thanks to everyone who gives feedback on the program.