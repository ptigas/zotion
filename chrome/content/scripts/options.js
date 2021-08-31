

var saveSettings = function() {
    var notion_key = document.getElementById("notion_key").value;
    var notion_database = document.getElementById("notion_database").value;

    var url = 'https://api.notion.com/v1/databases/' + notion_database;

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';

    xhr.open("GET", url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + notion_key)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Notion-Version', '2021-05-13')

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                if (xhr.response.code == 'unauthorized') {
                    alert('API key seem wrong.')
                } else if (xhr.response.code == 'object_not_found') {
                    alert('Cannot find database. Check if the key is correct and it is shared with the integration account.')
                }
                else {
                    alert(xhr.response.message)
                }
            } else {
                alert('Key and database seem correct.')
                Zotero.Prefs.set('extensions.zotion.notion_key', notion_key, true)
                Zotero.Prefs.set('extensions.zotion.notion_database', notion_database, true)
            }
        }
    }
    xhr.send();
}

var loadSettings = function() {
    const notion_key = Zotero.Prefs.get('extensions.zotion.notion_key', true) || '<notion key>'
    const notion_database = Zotero.Prefs.get('extensions.zotion.notion_database', true) || '<notion database>'

    document.getElementById("notion_key").value = notion_key
    document.getElementById("notion_database").value = notion_database
}