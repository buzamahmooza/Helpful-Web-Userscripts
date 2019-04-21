## Description

`GM_xmlhttpRequest` is a cross-origin version of [XMLHttpRequest](https://developer.mozilla.org/en/XMLHttpRequest).  The beauty of this function is that a user script can make requests that *do not* use the same-origin policy, creating opportunities for powerful mashups.


## Restrictions

`GM_xmlhttpRequest` restricts access to the `http`, `https`, `ftp`, `data`, `blob`, and `moz-blob` protocols.

If a script uses one or more `@domain`s then the `GM_xmlhttpRequest` api will be restricted to those domains.

If the url provided does not pass the above criteria then a error will be thrown when calling `GM_xmlhttpRequest`

## Arguments

### `Object` details

A single object with properties defining the request behavior.

* `String` **method:** _Optional._ The HTTP method to utilize.  Currently only "GET" and "POST" are supported.  Defaults to "GET".
* `String` **url:** The URL to which the request will be sent.  This value may be relative to the page the user script is running on.
* `Function` **onload:** _Optional._  A function called if the request finishes successfully.  Passed a Scriptish response object (see below).
* `Function` **onerror:** _Optional._  A function called if the request fails.  Passed a Scriptish response object (see below).
* `Function` **onreadystatechange:** _Optional._  A function called whenever the request's `readyState` changes.  Passed a Scriptish response object (see below).
* `String` **data:** _Optional._  Content to send as the body of the request.
* `Object` **headers:** _Optional._  An object containing headers to be sent as part of the request.
* `Boolean` **binary:** _Optional._  Forces the request to send `data` as binary.  Defaults to `false`.
* `Boolean` **makePrivate:** _Optional._  Forces the request to be a private request (same as initiated from a private window). **(0.1.9+)**
* `Boolean` **mozBackgroundRequest:** _Optional._  If `true` security dialogs will not be shown, and the request will fail.  Defaults to `true`.
* `String` **user:** _Optional._  The user name to use for authentication purposes.  Defaults to the empty string `""`.
* `String` **password:** _Optional._  The password to use for authentication purposes.  Defaults to the empty string `""`.
* `String` **overrideMimeType:** _Optional._  Overrides the MIME type returned by the server.
* `Boolean` **ignoreCache:** _Optional._  Forces a request to the server, bypassing the cache.  Defaults to `false`.
* `Boolean` **ignoreRedirect:** _Optional._  Forces the request to ignore both temporary and permanent redirects.
* `Boolean` **ignoreTempRedirect:** _Optional._  Forces the request to ignore only temporary redirects.
* `Boolean` **ignorePermanentRedirect:** _Optional._  Forces the request to ignore only permanent redirects.
* `Boolean` **failOnRedirect:** _Optional._  Forces the request to fail if a redirect occurs.
* `Integer` **redirectionLimit:** _Optional._  Range allowed: 0-10.  Forces the request to fail if a certain number of redirects occur.
  * <small>Note:  A `redirectionLimit` of `0` is equivalent to setting `failOnRedirect` to `true`.</small>

**Note:**  If both are set, `redirectionLimit` will take priority over `failOnRedirect`.

**Note:**  When `ignore*Redirect` is set and a redirect is encountered the request will still succeed, and subsequently call `onload`.  `failOnRedirect` or `redirectionLimit` exhaustion, however, will produce an error when encountering a redirect, and subsequently call `onerror`.

### Response Object

This is the response object passed to the `onload`, `onerror`, and `onreadystatechange` callbacks described for the `details` object above.

* `String` **responseText:** The response to the request in text form.
* `String` **responseJSON:** If the content type is JSON (example: `application/json`, `text/x-json`, and more..) then `responseJSON` will be available. 
* `Integer` **readyState:** The state of the request.  Refer to https://developer.mozilla.org/en/XMLHttpRequest#Properties
* `String` **responseHeaders:** The string value of all response headers.  `null` if no response has been received.
* `Integer` **status:** The HTTP status code from the server.  `null` if the request hasn't yet completed, or resulted in an error.
* `String` **statusText:** The entire HTTP status response string from the server.  `null` if the request hasn't yet completed, or resulted in an error.
* `String` **finalUrl:** The final URL used for the request.  Takes redirects into account.  `null` if the request hasn't yet completed, or resulted in an error.

**For "onprogress" only:**
* `Boolean` **lengthComputable:** Whether it is currently possible to know the total size of the response.
* `Integer` **loaded:** The number of bytes loaded thus far.
* `Integer` **total:** The total size of the response.


## Returns

### `Object` obj

* `Function` abort

Aborts the associated request if it has already been sent.

## Examples

```javascript
// Logs the contents of http://www.google.com
var ret = GM_xmlhttpRequest({
  method: "GET",
  url: "http://www.google.com",
  onload: function(res) {
    GM_log(res.responseText);
  }
});
```

```javascript
// Create a request, and then abort it.
var ret = GM_xmlhttpRequest({
  method: "GET",
  url: "http://www.google.com",
  onload: function(res) {
    GM_log(res.responseText);
  }
});

ret.abort();
```

```javascript
// POST some data to a site
// Uses `FormData` introduced in Gecko 2.0
// See https://developer.mozilla.org/en/XMLHttpRequest/FormData
var myData = new FormData();
myData.append("foo", "bar");
myData.append("baz", 12345);

var ret = GM_xmlhttpRequest({
  method: "POST",
  data: myData,
  url: "http://www.someinvalidsite.com/acceptsPOSTreqs.php",
  onload: function(res) {
    GM_log(res.responseText);
  }
});
```

```javascript
// Create a request, asking the server for a JSON response via the Accept header
// Also logging whenever the state of the request changes
var ret = GM_xmlhttpRequest({
  method: "GET",
  headers: {"Accept": "application/json"},
  url: "http://www.somejsonfriendlysite.com",
  onreadystatechange: function(res) {
    GM_log("Request state changed to: " + res.readyState);
  },
  onload: function(res) {
    // Lets assume we get JSON back...
    var myJSON = res.responseJSON;

    // Profit!
  }
});
```

```javascript
// onerror will be called if the request fails
var ret = GM_xmlhttpRequest({
  method: "GET",
  url: "http://www.someinvalidsite.com",
  onload: function(res) {
    GM_log(res.responseText);
  },
  onerror: function(res) {
    var msg = "An error occurred."
        + "\nresponseText: " + res.responseText
        + "\nreadyState: " + res.readyState
        + "\nresponseHeaders: " + res.responseHeaders
        + "\nstatus: " + res.status
        + "\nstatusText: " + res.statusText
        + "\nfinalUrl: " + res.finalUrl;
    GM_log(msg);
  }
});
```

```javascript
// Bypasses the cache and fails if we get redirected
// This request will fail, since http://www.github.com redirects to https://www.github.com
var ret = GM_xmlhttpRequest({
  method: "GET",
  url: "http://www.github.com",
  ignoreCache: true,
  redirectionLimit: 0, // this is equivalent to 'failOnRedirect: true'
  onload: function(res) {
    GM_log(res.responseText);
  },
  onerror: function(res) {
    GM_log("Error!");
  }
});
```


## Related Pages

[[Manual: API|Manual:-API]]