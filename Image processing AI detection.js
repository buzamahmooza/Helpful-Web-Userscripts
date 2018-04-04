

// Example posting an image URL:


var imageUrl = "https://i.pinimg.com/originals/3a/54/83/3a5483f60bd7aa4d356f10273478e8ab.gif";


var request = require('request');
request.post({
  url: 'https://api.deepai.org/api/nsfw-detector',
  headers: {
      'Api-Key': '81ceb564-b29e-4891-a230-c38df3c54869'
  },
  formData: {
      'image': imageUrl,
  }
}, function callback(err, httpResponse, body) {
  if (err) {
      console.error('request failed:', err);
      return;
  }
  var response = JSON.parse(body);
  console.log(response);
});




var imageUrl = "https://i.pinimg.com/originals/3a/54/83/3a5483f60bd7aa4d356f10273478e8ab.gif";
GM_xmlhttpRequest({
    method:"POST",
    url: 'https://api.deepai.org/api/nsfw-detector',
	responseType: 'json',
    headers: {
      'Api-Key': '81ceb564-b29e-4891-a230-c38df3c54869'
    },
    formData: {
      'image': imageUrl,
    },
    onload: function callback(resp) {
        console.log(resp.responseText);
    }
});

