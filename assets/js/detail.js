(async function () {
    const [headers, ...rows] = await loadCatalog()
    const idIndex = headers.indexOf('id')
    const search = new URLSearchParams(window.location.search)
    const id = search.get('id')

    const data = {}

    for (const row of rows) {
        if (row[idIndex] === id) {
            for (const [index, value] of Object.entries(row)) {
                data[headers[index]] = value
            }

            break
        }
    }

    function formatAuthors (value) {
        if (value.length === 0) return value

        const list = value.split('; ')

        if (list.length === 1) return value

        const last = list.pop()
        return list.join(', ') + ' & ' + last
    }

    document.getElementById('title').textContent = data.title
    document.getElementById('date').textContent = data.date

    if (data.key_type) {
        const element = document.getElementById('resource_type')
        for (const type of data.key_type.split('; ')) {
            const p = document.createElement('p')
            if (octicons[type]) {
                p.innerHTML = octicons[type]
            }
            p.append(' ' + type)
            element.appendChild(p)
        }
    }

    document.getElementById('taxon_scope').textContent = data.taxon ? data.scope ? `${data.taxon} (${data.scope})` : data.taxon : data.scope
    document.getElementById('target_taxa').textContent = data.target_taxa
    document.getElementById('region').textContent = data.region
    document.getElementById('complete').textContent = data.complete ? data.complete === 'TRUE' ? 'Yes' : 'No' : ''

    // Bibliographical info
    if (data.entry_type) {
        if (octicons[data.entry_type]) {
            document.getElementById('entry_type').innerHTML = octicons[data.entry_type]
        }
        document.getElementById('entry_type').append(' ' + data.entry_type)
    }

    document.getElementById('author').textContent = formatAuthors(data.author)
    document.getElementById('publisher').textContent = data.publisher
    document.getElementById('series').textContent = data.series

    if (data.ISSN) {
        const a = document.createElement('a')
        a.setAttribute('href', `https://portal.issn.org/resource/ISSN/${data.ISSN}`)
        a.innerHTML = octicons.external_url
        a.prepend(data.ISSN + ' ')
        document.getElementById('series').append(' (', a, ')')
    }

    document.getElementById('volume').textContent = data.volume
    document.getElementById('issue').textContent = data.issue
    document.getElementById('pages').textContent = data.pages
    document.getElementById('edition').textContent = data.edition
    document.getElementById('isbn').textContent = data.ISBN

    if (data.DOI) {
        const a = document.createElement('a')
        a.setAttribute('href', `https://doi.org/${data.DOI}`)
        a.innerHTML = octicons.external_url
        a.prepend(data.DOI + ' ')
        document.getElementById('doi').appendChild(a)
    }

    // Access
    if (data.url) {
        const a = document.createElement('a')
        a.setAttribute('href', data.url)
        a.innerHTML = octicons.external_url
        a.prepend(data.url + ' ')
        document.getElementById('info_url').append(a)

        if (data.archive_url.endsWith(data.url)) {
            const a = document.createElement('a')
            a.setAttribute('href', data.url)
            a.innerHTML = octicons.external_url
            a.prepend('Archived ')
            document.getElementById('info_url').append(' (', a, ')')
        }
    }

    if (data.fulltext_url) {
        const a = document.createElement('a')
        a.setAttribute('href', data.fulltext_url)
        a.innerHTML = octicons.external_url
        a.prepend(data.fulltext_url + ' ')
        document.getElementById('fulltext_url').append(a)

        if (data.archive_url.endsWith(data.fulltext_url)) {
            const a = document.createElement('a')
            a.setAttribute('href', data.url)
            a.innerHTML = octicons.external_url
            a.prepend('Archived ')
            document.getElementById('fulltext_url').append(' (', a, ')')
        }
    }

    if (!data.url && !data.fulltext_url && data.archive_url) {
        const a = document.createElement('a')
        a.setAttribute('href', data.archive_url)
        a.innerHTML = octicons.external_url
        a.prepend(data.archive_url + ' ')
        document.getElementById('fulltext_url').append(a)
    }

    document.getElementById('language').textContent = data.language

    if (/^[^<]/.test(data.license)) {
        const a = document.createElement('a')
        a.setAttribute('href', `https://spdx.org/licenses/${data.license.replace(/ /g, '-')}.html`)
        a.innerHTML = octicons.external_url
        a.prepend(data.license + ' ')
        document.getElementById('license').appendChild(a)
    } else {
        document.getElementById('license').textContent = data.license
    }

    function getEntryType (data) {
        if (data.entry_type === 'online') {
            return 'webpage'
        } else if (data.pages && data.pages.includes('-')) {
            return 'article-journal'
        } else {
            return 'book'
        }
    }

    const Cite = require('citation-js')
    const citation = new Cite({
        type: getEntryType(data),
        title: data.title,
        author: data.author.split('; ').map(Cite.parse.name),
        publisher: data.publisher,
        'container-title': data.series,
        volume: data.volume,
        issue: data.issue,
        page: data.pages,
        ISBN: data.ISBN,
        DOI: data.DOI,
        ISSN: data.ISSN,
        issued: { 'date-parts': [data.date.split('-').map(parseFloat)] },
        language: data.language
    })

    window.tmp = citation

    document.getElementById('citation').innerHTML = citation.format('bibliography', {
        format: 'html'
    })
})().catch(console.error)
