# Helpful-Web-Userscripts

A bunch of UserScripts that make browsing the web easier.
These are scripts that have made my browsing easier and have been my personal project since 2016.

## Installing Userscripts

1. Make sure you have user scripts enabled in your browser (these instructions refer to the latest versions of the browser):

   - Firefox - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=firefox) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (GM v4+ is **not supported**!).
   - Chrome - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=chrome).
   - Opera - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=opera) or [Violent Monkey](https://addons.opera.com/en/extensions/details/violent-monkey/).
   - Safari - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=safari).
   - Dolphin - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=dolphin).
   - UC Browser - install [Tampermonkey](https://tampermonkey.net/?ext=dhdg&browser=ucweb).

2. Choose the script you want to install and press the `Raw` link on the GitHub page.

## How to use

You should read the scripts `@description` for a brief summray, or check the comments on the script page on GitHub.

## External libraries

- [Mousetrap.js](https://github.com/ccampbell/mousetrap) Shortcuts and hotkeys binding
- [JSZip](https://github.com/Stuk/jszip) Compressing files
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) Downloading and saving files
- [ocrad.js](https://github.com/antimatter15/ocrad.js/) JS text recognition library

## Ideas

- [ ] Make a wrapper for `GM_xmlhttprequest()` as `GM_fetch()`
- [x] [Highlighter script to highlight phrases on websites when redirected from a search engine](SearchResultsHighlighter.user.js)
- [ ] A userscript to add a scrollbar at the top of the view that shows you're scroll progress
(how far you are to reaching the end of the page)
- [ ] Script to highlight stuff and to remember them when visiting (like Instapaper)  
      Prerequisite: must be able to make databases (Google sheets, or firebase )
- [ ] Extension to manage tabs. Feature:
  - Save tabs, draw a navbar that includes which tabs opened which ones (hierarchial)
  - You can save a session (saving all the tab and window states)
  - You can also have checkboxes and make those as a checklist
  - Ability to sort tabs, criteria:
    - Sort to hostname
    - Last recently used (LRU)
  - Split tabs
  - You can have notificatoins and reminders to opena specific bookmark folder
- [ ] A hotkey to fix the zoom of the page so that text the screen (fill width)

## Updating

Userscripts are set up to automatically update. You can check for updates from within the Greasemonkey or Tampermonkey menu, or click on the install link again to get the update.
