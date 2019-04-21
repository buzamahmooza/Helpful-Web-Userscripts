

headers = {}
headers["api_dev_key"]= 'myDevKey...'; // your api_developer_key
headers["api_paste_code"]   = 'my edited text'; // your paste text
headers["api_paste_private"] = '0'; // 0=public 1=unlisted 2=private
headers["api_paste_name"] = 'justmyfilename.php'; // name or title of your paste
headers["api_paste_expire_date"] = '10M';
headers["api_paste_format"] = 'php';
headers["api_user_key"] = ''; // if an invalid or expired api_user_key is used, an error will spawn. If no api_user_key is used, a guest paste will be created
headers["api_paste_name"] = myPastebinName;
headers["api_paste_code"] = myPastebinPassword;
http.get("https://pastebin.com/edit/dQMDfbkM", headers)




