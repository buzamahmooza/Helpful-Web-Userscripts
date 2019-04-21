
#SingleInstance, force


postToPastebin(content) {
    api_dev_key := "d3781464364144344bcaf980e1cd5fe7"
    api_user_key := ""
    api_paste_code := "Check it out this is an autohotkey test!"
    api_user_password := "12121212"
    api_paste_name := "AHK test"
    api_user_name := "bkfst"

    param := ("api_dev_key=" . api_dev_key . "&api_paste_code=" . api_paste_code . "&api_paste_private=1&api_paste_name=" . api_paste_name . "&api_paste_expire_date=N&api_option=paste&api_user_name=" . api_user_name . "&api_user_password=" . api_user_password . "&api_user_key=" . api_user_key . "")
    str := "https://pastebin.com/api/api_post.php"    
    return url_tovar(str, param)
}

url_tovar(URL, param) {
    WebRequest := ComObjCreate("WinHttp.WinHttpRequest.5.1")
    WebRequest.Open("POST", URL)
    WebRequest.SetRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    WebRequest.Send(param)
    res := WebRequest.ResponseText
    return res
}

