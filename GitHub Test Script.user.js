// ==UserScript==
// @name         GitHub TestScript
// @version      0.1
// @include      *
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @run-at       document-end
// ==/UserScript==


//'use strict';
const constant = 'test constant';
console.log('This is the GitHub Test Script existing.');

function test(){
  console.log('Test function');
  alert('test function from GitHub test script.');
}
