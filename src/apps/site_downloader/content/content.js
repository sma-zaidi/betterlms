'use strict';

function get_site_id() {
    var url = $('.xs-visible.Mrphs-skipNav--toolName').attr('href')
    var site_id = url.split('/')[5]
    return site_id
}

$(() => {

    var site_title = document.title
    site_title = site_title.split(':')[1].trim()
    var site_id = get_site_id()

    $('div.col-lg-6.col-md-8.col-sm-8.col-xs-12').prepend(`
    <button id='blms_downloadsite' type='button'>
        Download Site
    </button>
    `)

    $('#blms_downloadsite').click(() => {
        var proceed = confirm('Download ' + site_title + '?')

        if (proceed) {
            $('#blms_downloadsite').attr('disabled', true);
            chrome.runtime.sendMessage({message: 'downloadsite', site_id: site_id, site_title: site_title}, (response) => {
                console.log(response)
                $('#blms_downloadsite').attr('disabled', false);
            })
        }
    })
})