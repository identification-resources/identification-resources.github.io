(async function () {
    const [headers, ...rows] = await loadCatalog()
    const search = new URLSearchParams(window.location.search)
    const id = search.get('id')

    const all = {}
    const allVersions = {}
    const parts = []
    const references = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        if (data.listed_in && data.listed_in.split('; ').includes(id)) {
            references.push(data.id)
        }

        if (data.part_of && data.part_of.split('; ').includes(id)) {
            parts.push(data.id)
        }

        all[data.id] = data

        if (data.version_of) {
            for (const version of data.version_of.split('; ')) {
                if (!allVersions[version]) {
                    allVersions[version] = [data]
                } else {
                    allVersions[version].push(data)
                }
            }
        }
    }

    const data = all[id]
    const versions = allVersions[data.version_of]

    document.querySelector('head title').textContent = data.title + ' — Library of Identification Resources'
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
    document.getElementById('region').append(...formatLinkedList(
        data.region,
        author => `/catalog/place/?name=${author}`
    ))
    document.getElementById('complete').textContent = data.complete ? data.complete === 'TRUE' ? 'Yes' : 'No' : ''

    // Bibliographical info
    if (data.entry_type) {
        if (octicons[data.entry_type]) {
            document.getElementById('entry_type').innerHTML = octicons[data.entry_type]
        }
        document.getElementById('entry_type').append(' ' + data.entry_type)
    }

    document.getElementById('author').append(...formatAuthors(data.author))
    document.getElementById('publisher').append(...formatLinkedList(
        data.publisher,
        publisher => `/catalog/publisher/?name=${publisher}`
    ))

    if (data.ISSN) {
        const series = document.createElement('a')
        series.setAttribute('href', `/catalog/series/?issn=${data.ISSN}`)
        series.textContent = data.series

        const issn = document.createElement('a')
        issn.setAttribute('href', `https://portal.issn.org/resource/ISSN/${data.ISSN}`)
        issn.innerHTML = octicons.external_url
        issn.prepend(data.ISSN + ' ')
        document.getElementById('series').append(series, ' (', issn, ')')
    } else {
        document.getElementById('series').textContent = data.series
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

    if ((!data.url || !data.archive_url.endsWith(data.url)) && !data.fulltext_url && data.archive_url) {
        const a = document.createElement('a')
        a.setAttribute('href', data.archive_url)
        a.innerHTML = octicons.external_url
        a.prepend(data.archive_url + ' ')
        document.getElementById('fulltext_url').append(a)
    }

    if (data.language) {
        for (const language of data.language.split('; ')) {
            const p = document.createElement('p')

            const a = document.createElement('a')
            a.setAttribute('href', `https://hub.toolforge.org/P218:${language.split('-')[0]}?site=wikidata`)
            a.innerHTML = octicons.external_url
            a.prepend(language + ' ')

            p.appendChild(a)
            document.getElementById('language').appendChild(p)
        }
    }

    if (/^[^<]/.test(data.license)) {
        const a = document.createElement('a')
        a.setAttribute('href', `https://spdx.org/licenses/${data.license.replace(/ /g, '-')}.html`)
        a.innerHTML = octicons.external_url
        a.prepend(data.license + ' ')
        document.getElementById('license').appendChild(a)
    } else {
        document.getElementById('license').textContent = data.license
    }

    if (data.QID) {
        const wikidata = document.createElement('a')
        wikidata.setAttribute('href', `http://www.wikidata.org/entity/${data.QID}`)
        wikidata.innerHTML = octicons.external_url
        wikidata.prepend(data.QID + ' ')
        document.getElementById('wikidata').append(wikidata)

        const scholia = document.createElement('a')
        scholia.setAttribute('href', `https://scholia.toolforge.org/${data.QID}`)
        scholia.innerHTML = octicons.external_url
        scholia.prepend('Scholia ')
        document.getElementById('wikidata').append(' (', scholia, ')')
    }

    {
        const purl = `https://purl.org/identification-resources/catalog/${data.id}`
        const a = document.createElement('a')
        a.setAttribute('href', `https://purl.org/identification-resources/catalog/${data.id}`)
        a.innerHTML = octicons.persistent_url
        a.append(' ' + purl)
        document.getElementById('permalink').append(a)
    }

    // Parts
    function renderTable (ids, elementId) {
        const table = document.getElementById(elementId)
        for (const id of ids) {
            const row = document.createElement('tr')

            const idCell = document.createElement('td')
            const idLink = document.createElement('a')
            idLink.setAttribute('href', `/catalog/detail/?id=${id}`)
            idLink.textContent = id
            idCell.appendChild(idLink)
            row.appendChild(idCell)

            const titleCell = document.createElement('td')
            const titleLink = document.createElement('a')
            titleLink.setAttribute('href', `/catalog/detail/?id=${id}`)
            titleLink.textContent = all[id].title
            titleCell.appendChild(titleLink)
            row.appendChild(titleCell)

            table.appendChild(row)
        }
    }

    if (data.listed_in) {
        renderTable(data.listed_in.split('; '), 'listed_in')
    } else {
        document.getElementById('listed_in_section').remove()
    }

    if (references.length) {
        renderTable(references, 'references')
    } else {
        document.getElementById('references_section').remove()
    }

    if (data.part_of) {
        renderTable(data.part_of.split('; '), 'part_of')
    } else {
        document.getElementById('part_of_section').remove()
    }

    if (parts.length) {
        renderTable(parts, 'parts')
    } else {
        document.getElementById('parts_section').remove()
    }

    if (versions) {
        const table = document.getElementById('versions')
        for (const data of versions) {
            const row = document.createElement('tr')

            const idCell = document.createElement('td')
            const idLink = document.createElement('a')
            idLink.setAttribute('href', `/catalog/detail/?id=${data.id}`)
            idLink.textContent = data.id
            idCell.appendChild(idLink)
            row.appendChild(idCell)

            const titleCell = document.createElement('td')
            const titleLink = document.createElement('a')
            titleLink.setAttribute('href', `/catalog/detail/?id=${data.id}`)
            titleLink.textContent = data.title
            titleCell.appendChild(titleLink)
            row.appendChild(titleCell)

            const authorCell = document.createElement('td')
            authorCell.textContent = data.author
            row.appendChild(authorCell)

            const dateCell = document.createElement('td')
            dateCell.textContent = data.date
            row.appendChild(dateCell)

            const editionCell = document.createElement('td')
            editionCell.textContent = data.edition
            row.appendChild(editionCell)

            const languageCell = document.createElement('td')
            languageCell.setAttribute('href', `/catalog/detail/?id=${data.id}`)
            languageCell.textContent = data.language
            row.appendChild(languageCell)

            table.appendChild(row)
        }
    } else {
        document.getElementById('versions_section').remove()
    }

    function getEntryType (data) {
        if (data.pages && data.pages.includes('-')) {
            return 'article-journal'
        } else if (data.entry_type === 'online') {
            return 'webpage'
        } else {
            return 'book'
        }
    }

    const Cite = require('citation-js')
    const citation = new Cite({
        type: getEntryType(data),
        title: data.title,
        author: data.author && data.author.split('; ').map(Cite.parse.name),
        publisher: data.publisher,
        'container-title': data.series,
        volume: data.volume,
        issue: data.issue,
        ...(data.pages && data.pages.includes('-')
            ? { page: data.pages }
            : { 'number-of-pages': data.pages }),
        edition: data.edition,
        ISBN: data.ISBN,
        DOI: data.DOI,
        ISSN: data.ISSN,
        URL: data.url || data.fulltext_url || data.archive_url,
        ...(data.date
            ? { issued: { 'date-parts': [data.date.split('-').map(parseFloat)] } }
            : undefined),
        language: data.language
    })

    console.log('Access and format citation data with the "citation" variable')
    window.citation = citation
    window.Cite = Cite

    document.getElementById('citation').innerHTML = citation.format('bibliography', {
        format: 'html'
    })

    // Meta tags
    const metaTags = {
        citation_title: data => data.title,
        citation_author: data => data.author && data.author.map(name => Cite.get.name(name, false)),
        citation_publication_date: data => data.issued && data.issued['date-parts'] && data.issued['date-parts'][0].join('/'),
        citation_issn: data => data.ISSN,
        citation_isbn: data => data.ISBN,
        citation_volume: data => data.volume,
        citation_issue: data => data.issue,
        citation_firstpage: data => data.page && data.page.split('-')[0],
        citation_lastpage: data => data.page && data.page.split('-')[1],
        citation_pdf_url: () => data.fulltext_url,
        citation_publisher: data => data.publisher,
        citation_pmid: data => data.PMID,
        citation_doi: data => data.DOI,
        citation_language: data => data.language,
        citation_keywords: data => data.keywords && data.keywords.split(','),

        ...(citation.data[0].type === 'article-journal' ? {
            citation_journal_title: data => data['container-title'],
            citation_journal_abbrev: data => data['container-title-short']
        } : undefined),
        ...(citation.data[0].type === 'thesis' ? {
            citation_dissertation_institution: data => data.publisher
        } : undefined),
        ...(citation.data[0].type === 'report' ? {
            citation_technical_report_institution: data => data.publisher,
            citation_technical_report_number: data => data.number
        } : undefined)
    }

    for (const metaTag in metaTags) {
        const contents = metaTags[metaTag](citation.format('data', { format: 'object' })[0])
        if (!contents) { continue }

        for (const content of [].concat(contents)) {
            const meta = document.createElement('meta')
            meta.setAttribute('name', metaTag)
            meta.setAttribute('content', content)
            document.querySelector('head').appendChild(meta)
        }
    }
})().catch(console.error)
