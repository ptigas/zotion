// Startup -- load Zotero and constants
if (typeof Zotero === 'undefined') {
    Zotero = {};
}
Zotero.Zotion = {};

// Preference managers

Zotero.Zotion.getPref = function(pref) {
    return Zotero.Prefs.get('extensions.zotion.' + pref, true);
};

Zotero.Zotion.setPref = function(pref, value) {
    return Zotero.Prefs.set('extensions.zotion.' + pref, value, true);
};

// Startup - initialize plugin

Zotero.Zotion.init = function() {
    Zotero.Zotion.resetState("initial");

    // Register the callback in Zotero as an item observer
    var notifierID = Zotero.Notifier.registerObserver(
        Zotero.Zotion.notifierCallback, ['item']);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);

};

/**
 * Open Zotion preference window
 */
Zotero.Zotion.openPreferenceWindow = function(paneID, action) {
    var io = {pane: paneID, action: action};
    window.openDialog('chrome://zotion/content/options.xul',
        'zotion-pref',
        'chrome,titlebar,toolbar,centerscreen' + Zotero.Prefs.get('browser.preferences.instantApply', true) ? 'dialog=no' : 'modal', io
    );
};

Zotero.Zotion.createNote = function() {
    Zotero.Zotion.createNotionNote();
};


Zotero.Zotion.createNotionNote = function() {
    const zoteroPane = Zotero.getActiveZoteroPane()

    const notion_key = Zotero.Prefs.get('extensions.zotion.notion_key', true) || '<notion key>'
    const notion_database = Zotero.Prefs.get('extensions.zotion.notion_database', true) || '<notion database>'

    function add_extra(item, k, v) {
        const extras_ls = item.split('\n')
        var dict = extras_ls.reduce(function(obj, item) {
            obj[item.split(':')[0]] = item.split(':').slice(1).join(':')
            return obj;
        }, {})

        dict[k] = ' ' + v

        return Object.keys(dict).map(key => key + ':' + dict[key]).join('\n')
    }

    function get_extra(item, k) {
        const extras_ls = item.split('\n')
        var dict = extras_ls.reduce(function(obj, item) {
            obj[item.split(':')[0]] = item.split(':').slice(1).join(':')
            return obj;
        }, {})
        return (dict[k] || '').trim()
    }

    function authors(ls) {
        return ls.map(v => ({"name":v.firstName + ' ' + v.lastName}))
    }

    const item = ZoteroPane.getSelectedItems()[0]
    const extras = get_extra(item.getField('extra'), 'notion');

    if (extras != '') {
        zoteroPane.loadURI(extras);
    } else {
        var url = 'https://api.notion.com/v1/pages';

        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';

        xhr.open("POST", url, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + notion_key)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Notion-Version', '2021-05-13')

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status == 200) {
                    zoteroPane.loadURI(xhr.response.url)
                    var extras = add_extra(item.getField('extra'), 'notion', xhr.response.url)
                    item.setField('extra', extras);
                }

                if (xhr.status == 404) {
                    alert(xhr.response.message + ' Check if database is shared with integration account.')
                }
            }
        }

        data = {
            "parent": { "database_id": notion_database },
            "properties": {
                "Title": {"title": [{"text": {"content": item.getField('title')}}]},
                "Authors": {"multi_select": authors(item.getCreatorsJSON())}
            }
        }

        if (item.getField('url') != '') {
            data['properties']['URL'] = {"url": item.getField('url')}
        }

        xhr.send(JSON.stringify(data));
    }
};