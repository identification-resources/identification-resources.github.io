// primer/octicons is licensed under the MIT License
// https://github.com/primer/octicons/blob/main/LICENSE
const octicons = {
    // resource types
    key: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Dichotomous key</title><path d="M3.604 3.089A.75.75 0 014 3.75V8.5h.75a.75.75 0 010 1.5h-3a.75.75 0 110-1.5h.75V5.151l-.334.223a.75.75 0 01-.832-1.248l1.5-1a.75.75 0 01.77-.037zM8.75 5.5a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H8.75zm0 6a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H8.75zm0 6a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H8.75zM5.5 15.75c0-.704-.271-1.286-.72-1.686a2.302 2.302 0 00-1.53-.564c-.535 0-1.094.178-1.53.565-.449.399-.72.982-.72 1.685a.75.75 0 001.5 0c0-.296.104-.464.217-.564A.805.805 0 013.25 15c.215 0 .406.072.533.185.113.101.217.268.217.565 0 .332-.069.48-.21.657-.092.113-.216.24-.403.419l-.147.14c-.152.144-.33.313-.52.504l-1.5 1.5a.75.75 0 00-.22.53v.25c0 .414.336.75.75.75H5A.75.75 0 005 19H3.31l.47-.47c.176-.176.333-.324.48-.465l.165-.156a5.98 5.98 0 00.536-.566c.358-.447.539-.925.539-1.593z"></path></svg>`,
    matrix: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Matrix key</title><path fill-rule="evenodd" d="M2 3.75C2 2.784 2.784 2 3.75 2h16.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0120.25 22H3.75A1.75 1.75 0 012 20.25V3.75zM3.5 9v11.25c0 .138.112.25.25.25H7.5V9h-4zm4-1.5h-4V3.75a.25.25 0 01.25-.25H7.5v4zM9 9v11.5h11.25a.25.25 0 00.25-.25V9H9zm11.5-1.5H9v-4h11.25a.25.25 0 01.25.25V7.5z"></path></svg>`,
    reference: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Reference</title><path fill-rule="evenodd" d="M0 4.75C0 3.784.784 3 1.75 3h20.5c.966 0 1.75.784 1.75 1.75v14.5A1.75 1.75 0 0122.25 21H1.75A1.75 1.75 0 010 19.25V4.75zm1.75-.25a.25.25 0 00-.25.25v14.5c0 .138.112.25.25.25h20.5a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H1.75z"></path><path fill-rule="evenodd" d="M5 8.75A.75.75 0 015.75 8h11.5a.75.75 0 010 1.5H5.75A.75.75 0 015 8.75zm0 4a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z"></path></svg>`,
    gallery: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Image gallery</title><path fill-rule="evenodd" d="M2.25 4a.25.25 0 00-.25.25v15.5c0 .138.112.25.25.25h3.178L14 10.977a1.75 1.75 0 012.506-.032L22 16.44V4.25a.25.25 0 00-.25-.25H2.25zm3.496 17.5H21.75a1.75 1.75 0 001.75-1.75V4.25a1.75 1.75 0 00-1.75-1.75H2.25A1.75 1.75 0 00.5 4.25v15.5c0 .966.784 1.75 1.75 1.75h3.496zM22 19.75v-1.19l-6.555-6.554a.25.25 0 00-.358.004L7.497 20H21.75a.25.25 0 00.25-.25zM9 9.25a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0zm1.5 0a3.25 3.25 0 11-6.5 0 3.25 3.25 0 016.5 0z"></path></svg>`,
    collection: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Collection of resources</title><path fill-rule="evenodd" d="M4.801 3.57A1.75 1.75 0 016.414 2.5h11.174c.702 0 1.337.42 1.611 1.067l3.741 8.828c.04.092.06.192.06.293v7.562A1.75 1.75 0 0121.25 22H2.75A1.75 1.75 0 011 20.25v-7.5c0-.1.02-.199.059-.291L4.8 3.571zM6.414 4a.25.25 0 00-.23.153L2.88 12H8a.75.75 0 01.648.372L10.18 15h3.638l1.533-2.628a.75.75 0 01.64-.372l5.13-.051-3.304-7.797a.25.25 0 00-.23-.152H6.414zM21.5 13.445l-5.067.05-1.535 2.633a.75.75 0 01-.648.372h-4.5a.75.75 0 01-.648-.372L7.57 13.5H2.5v6.75c0 .138.112.25.25.25h18.5a.25.25 0 00.25-.25v-6.805z"></path></svg>`,
    checklist: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Checklist</title><path d="M3.5 3.75a.25.25 0 01.25-.25h13.5a.25.25 0 01.25.25v10a.75.75 0 001.5 0v-10A1.75 1.75 0 0017.25 2H3.75A1.75 1.75 0 002 3.75v16.5c0 .966.784 1.75 1.75 1.75h7a.75.75 0 000-1.5h-7a.25.25 0 01-.25-.25V3.75z"></path><path d="M6.25 7a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm-.75 4.75a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm16.28 4.53a.75.75 0 10-1.06-1.06l-4.97 4.97-1.97-1.97a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l5.5-5.5z"></path></svg>`,
    supplement: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M12.75 7.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z"></path><path fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zM2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0z"></path></svg>`,

    // entry types
    print: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Print</title><path fill-rule="evenodd" d="M0 3.75A.75.75 0 01.75 3h7.497c1.566 0 2.945.8 3.751 2.014A4.496 4.496 0 0115.75 3h7.5a.75.75 0 01.75.75v15.063a.75.75 0 01-.755.75l-7.682-.052a3 3 0 00-2.142.878l-.89.891a.75.75 0 01-1.061 0l-.902-.901a3 3 0 00-2.121-.879H.75a.75.75 0 01-.75-.75v-15zm11.247 3.747a3 3 0 00-3-2.997H1.5V18h6.947a4.5 4.5 0 012.803.98l-.003-11.483zm1.503 11.485V7.5a3 3 0 013-3h6.75v13.558l-6.927-.047a4.5 4.5 0 00-2.823.971z"></path></svg>`,
    online: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Online</title><path fill-rule="evenodd" d="M3.5 3.75C3.5 2.784 4.284 2 5.25 2h13.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0118.75 13H5.25a1.75 1.75 0 01-1.75-1.75v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h13.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H5.25zM1.5 15.75c0-.966.784-1.75 1.75-1.75h17.5c.966 0 1.75.784 1.75 1.75v4a1.75 1.75 0 01-1.75 1.75H3.25a1.75 1.75 0 01-1.75-1.75v-4zm1.75-.25a.25.25 0 00-.25.25v4c0 .138.112.25.25.25h17.5a.25.25 0 00.25-.25v-4a.25.25 0 00-.25-.25H3.25z"></path><path fill-rule="evenodd" d="M10 17.75a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75zm-4 0a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z"></path></svg>`,
    cd: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>CD</title><path fill-rule="evenodd" d="M2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0zM12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 13a2 2 0 100-4 2 2 0 000 4z"></path></svg>`,

    // urls
    external_url: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><title>External link</title><path fill-rule="evenodd" d="M10.604 1h4.146a.25.25 0 01.25.25v4.146a.25.25 0 01-.427.177L13.03 4.03 9.28 7.78a.75.75 0 01-1.06-1.06l3.75-3.75-1.543-1.543A.25.25 0 0110.604 1zM3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-3.5a.75.75 0 00-1.5 0v3.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5h-3.5z"></path></svg>`,
    persistent_url: `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><title>Persistent URL</title><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg>`,

    // other
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 24 24" width="24" height="24"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>`,
    available: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12zm16.28-2.72a.75.75 0 00-1.06-1.06l-5.97 5.97-2.47-2.47a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l6.5-6.5z"></path></svg>`,
    not_available: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M9.036 7.976a.75.75 0 00-1.06 1.06L10.939 12l-2.963 2.963a.75.75 0 101.06 1.06L12 13.06l2.963 2.964a.75.75 0 001.061-1.06L13.061 12l2.963-2.964a.75.75 0 10-1.06-1.06L12 10.939 9.036 7.976z"></path><path fill-rule="evenodd" d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zM2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0z"></path></svg>`
}

const fieldLabels = {
    id: 'ID',
    title: 'Title',
    author: 'Authors',
    url: 'URL',
    fulltext_url: 'Full-text URL',
    archive_url: 'Archived URL',
    entry_type: 'Entry type',
    date: 'Year/date',
    publisher: 'Publisher',
    series: 'Series/periodical',
    ISSN: 'ISSN',
    ISBN: 'ISBN',
    DOI: 'DOI',
    QID: 'Wikidata ID',
    volume: 'Volume',
    issue: 'Issue',
    pages: 'Pages',
    edition: 'Edition',
    language: 'Language',
    license: 'License',
    key_type: 'Resource type',
    taxon: 'Taxon',
    taxon_scope: 'Taxon. scope',
    scope: 'Scope',
    region: 'Region',
    complete: 'Completeness',
    target_taxa: 'Taxon. level',
    listed_in: 'Referenced in',
    part_of: 'Part of',
    version_of: 'Version of',
    duplicate_of: 'Duplicate of',
    year: 'Year',
    decade: 'Decade',
    access: 'Access',
    taxa_data: 'Tax. data extr.'
}

const flagLabels = {
    MISSING_TAXA: 'Not all taxa named in the resource have yet been added to this list',
    MISSING_PARENT_TAXA: 'Not all parent taxa named in the resource have yet been added to this list',
    MISSING_SYNONYMS: 'Not all synonyms named in the resource have yet been added to this list'
}

async function loadCsv (url) {
    const request = await fetch(url)
    const file = await request.text()

    return (file.trim() + '\n')
        .match(/("([^"]|"")*?"|[^,\n]*)(,|\n)/g)
        .reduce((rows, value) => {
            const last = rows[rows.length - 1]
            if (value.endsWith('\n')) {
                rows.push([])
            }
            value = value.replace(/[,\n]$/, '')
            last.push(value.startsWith('"') ? value.replace(/""/g, '"').slice(1, -1) : value)
            return rows
        }, [[]])
        .slice(0, -1)
}

async function extendCatalog (rows) {
  const headers = rows[0].concat('year', 'decade', 'access', 'taxa_data')
  const i = {
    date: headers.indexOf('date'),
    license: headers.indexOf('license'),
    url: headers.indexOf('url'),
    fulltext_url: headers.indexOf('fulltext_url'),
    archive_url: headers.indexOf('archive_url')
  }
  const keys = await loadKeys()

  const rest = rows.slice(1).map(row => {
    const date = row[i.date]
    const year = date ? parseInt(date) : ''
    const decade = year ? year - (year % 10) : ''

    const license = row[i.license]
    const url = row[i.url]
    const fulltextUrl = row[i.fulltext_url]
    const archiveUrl = row[i.archive_url]
    const access = license && !license.endsWith('?>')
        ? 'Open license'
        : fulltextUrl || (archiveUrl && (!url || !archiveUrl.endsWith(url) || url === fulltextUrl))
            ? 'Full text available, no license'
            : 'No full text available'
    const taxaData = keys.hasOwnProperty(row[0] + ':1').toString()

    return row.concat(year.toString(), decade.toString(), access, taxaData)
  })

  return [headers, ...rest]
}

async function indexCsv (url, header) {
    const [headers, ...rows] = await loadCsv(url)

    return rows
        .map(row => row.reduce((object, value, index) => {
            object[headers[index]] = value
            return object
        }, {}))
        .reduce((index, row) => {
            index[row[header]] = row
            return index
        }, {})
}

async function loadCatalog () {
    return extendCatalog(await loadCsv('/assets/data/catalog.csv'))
}

const loadKeys = (function () {
    const url = '/assets/data/resources/index.json'
    let resources

    return async function loadKeys () {
        if (!resources) {
            resources = await fetch(url).then(response => response.json())
        }
        return resources
    }
})()

async function loadKey (id) {
    const metadata = (await loadKeys())[id]

    const fileId = id.split(':').join('-')
    const [header, ...rows] = await loadCsv(`/assets/data/resources/dwc/${fileId}.csv`, 'taxonID')
    const taxa = rows.reduce((taxa, row) => {
        taxa[row[0]] = { data: row }
        return taxa
    }, {})

    return { metadata, taxa }
}

function formatAuthors (value) {
    return formatLinkedList(value, author => `/catalog/author/?name=${author}`)
}

function formatLinkedList (list, makeUrl) {
    if (list.length === 0) { return list }
    const values = Array.isArray(list) ? list : list.split('; ')
    const nodes = []
    let i = values.length

    for (const value of values) {
        const a = document.createElement('a')
        a.setAttribute('href', makeUrl(value))
        a.textContent = value
        nodes.push(a)

        if (i > 2) {
            nodes.push(', ')
        } else if (i > 1) {
            nodes.push(' & ')
        }

        i--
    }

    return nodes
}

function parseTaxonName (taxon) {
    const [name, authorship] = taxon.match(/^([A-Z]\S*(?: [a-z]\S*){0,2})(?: (.+))?$/).slice(1)
    return { name, authorship }
}

function formatTaxonName (name, authorship, rank) {
    const fragment = document.createDocumentFragment()

    if (['genus', 'subgenus', 'species'].includes(rank)) {
        const i = document.createElement('i')
        i.textContent = name
        fragment.append(i)
    } else if ('group' === rank) {
        const parts = name.match(/^(.+?)((-group)?)$/)
        const i = document.createElement('i')
        i.textContent = parts[1]
        fragment.append(i)
        fragment.append(parts[2])
    } else if (['subspecies', 'variety', 'form', 'race', 'stirps', 'aberration'].includes(rank)) {
        const parts = name.match(/^(\S+ \S+)(.+?)(\S+)$/)
        const start = document.createElement('i')
        start.textContent = parts[1]
        fragment.append(start)
        fragment.append(parts[2])
        const end = document.createElement('i')
        end.textContent = parts[3]
        fragment.append(end)
    } else {
        fragment.append(name)
    }

    if (authorship) {
        fragment.append(' ' + authorship)
    }

    return fragment
}

function formatPagination (pagination, search, data) {
    const searchPage = parseInt(search.get('page') || 1)
    const searchLimit = parseInt(search.get('limit') || 50)
    const searchPages = Math.ceil(data.length / searchLimit)
    const paginationContext = 2

    function makePaginationLink (page, limit, text, label) {
        const navigationItem = document.createElement('li')
        const navigationLink = document.createElement('a')
        navigationLink.textContent = text || page

        const url = new URL(window.location)
        url.searchParams.set('page', page)
        url.searchParams.set('limit', limit)
        navigationLink.setAttribute('href', url.toString())
        navigationLink.setAttribute('aria-label', label || `Page ${page}`)
        if (page === searchPage) {
            navigationLink.setAttribute('aria-current', 'true')
        }

        navigationItem.appendChild(navigationLink)
        pagination.appendChild(navigationItem)
    }

    if (searchPage > 1) {
        makePaginationLink(searchPage - 1, searchLimit, '<', 'Previous page')
    }
    if (searchPage > 1 + paginationContext) {
        makePaginationLink(1, searchLimit)
    }
    if (searchPage > 2 + paginationContext) {
        const navigationItem = document.createElement('li')
        navigationItem.textContent = '...'
        pagination.appendChild(navigationItem)
    }
    for (let page = Math.max(1, searchPage - paginationContext); page <= Math.min(searchPages, searchPage + paginationContext); page++) {
        makePaginationLink(page, searchLimit)
    }
    if (searchPage < searchPages - paginationContext - 1) {
        const navigationItem = document.createElement('li')
        navigationItem.textContent = '...'
        pagination.appendChild(navigationItem)
    }
    if (searchPage < searchPages - paginationContext) {
        makePaginationLink(searchPages, searchLimit)
    }
    if (searchPage < searchPages) {
        makePaginationLink(searchPage + 1, searchLimit, '>', 'Next page')
    }

    return { searchPage, searchLimit }
}
