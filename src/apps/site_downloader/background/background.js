sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

get = (url) => {
    return new Promise((resolve) => {
        $.get(url, (response) => {
            resolve(response)
        })
    })
}

clean_name = (name) => {

   return name.replace(/[^a-z0-9.\-_]/gi, '_'); // Strip any special charactere
}

function download_from_url(url, filename) {
    return new Promise((resolve) => {

        chrome.downloads.onChanged.addListener(onChanged)

        var current_download_id
    
        chrome.downloads.download({url: url, filename: filename}, (id) => {
            current_download_id = id
        })
    
        function onChanged({id, state}) {
            if (id == current_download_id) {
                if (state && state.current != 'in_progress') {
                    chrome.downloads.onChanged.removeListener(onChanged);
                    resolve()
                }
            }
        }

    })
}

function download_from_site_tree(site_tree, path) {
    return new Promise(async (resolve) => {

        for (var item of site_tree) {
            if(item.type == 'file') {
                await sleep(1000)
                console.log('DOWNLOADING' + item.name)
                await download_from_url(item.href, path + clean_name(item.name))
                console.log('DOWNLOADED!')
            }
        }

        for (var item of site_tree) {
            if(item.type == 'folder') {
                await sleep(1000)
                await download_from_site_tree(item.children, path + clean_name(item.name) + '/')
            }
        }

        resolve()

    })
}

function construct_site_tree(url) {
    return new Promise(async (resolve) => {
        await sleep(1000)

        console.log(url)

        var site_tree = []

        response = await $.get(url)

        var files = $(response).find('.file')
        for (var file of files) {
            
            var name = $(file).find('a').text()
            var href = $(file).find('a').attr('href')

            site_tree.push({type: 'file', name: name, href: url + href})
        }

        var folders = $(response).find('.folder')
        for (var folder of folders) {

            var name = $(folder).find('a').text()
            var href = $(folder).find('a').attr('href')
            var children = await construct_site_tree(url + href)

            site_tree.push({type: 'folder', name: name, href: url + href, children: children})
        }

        resolve(site_tree)
    })
}

async function download_site(site_id, site_title, sendResponse) {
    var site_tree = await construct_site_tree('https://lms.lums.edu.pk/access/content/group/' + site_id + '/')
    await download_from_site_tree(site_tree, 'BetterLMS Downloads/' + site_title + '/');

    sendResponse('DONE')
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.message == 'downloadsite') {
        download_site(request.site_id, request.site_title, sendResponse)
    }

    return true
})
