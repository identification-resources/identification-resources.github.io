(async function () {
    const tableHeaders = document.getElementById('catalog_headers')
    const tableRows = document.getElementById('catalog_data')
    const inputField = document.getElementById('catalog_select')
    const inputQuery = document.getElementById('catalog_search')
    const resultCount = document.getElementById('catalog_results')
    const pagination = document.getElementById('catalog_pagination')

    const headersLabels = {
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
        scope: 'Scope',
        region: 'Region',
        complete: 'Completeness',
        target_taxa: 'Taxon. level',
        part_of: 'Part of/Ref. in',
    }

    const fieldsToDisplay = new Set([
        'id',
        'title',
        'entry_type',
        'url',
        'fulltext_url',
        'archive_url',
        'date',
        'language',
        'key_type',
        'taxon',
        'scope',
        'region',
        'complete',
        'target_taxa'
    ])

    const [headers, ...rows] = await loadCatalog()

    for (const header of headers) {
        if (fieldsToDisplay.has(header)) {
            const tableHeader = document.createElement('th')
            tableHeader.textContent = headersLabels[header]
            tableHeaders.appendChild(tableHeader)
        }

        const selectOption = document.createElement('option')
        selectOption.textContent = headersLabels[header]
        selectOption.setAttribute('value', header)
        inputField.appendChild(selectOption)
    }

    const search = new URLSearchParams(window.location.search)
    const searchField = search.get('field')
    const searchQuery = search.get('query')
    const searchFieldIndex = headers.indexOf(searchField)

    inputField.value = searchField
    inputQuery.value = searchQuery

    let searchRows = !searchQuery ? rows : rows.filter(function (row) {
        const field = searchField ? row[searchFieldIndex] : row.join('\u001D')
        return field.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const searchPage = parseInt(search.get('page') || 1)
    const searchLimit = parseInt(search.get('limit') || 50)
    const searchPages = Math.ceil(searchRows.length / searchLimit)
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

    searchRows = searchRows.slice((searchPage - 1) * searchLimit, searchPage * searchLimit)

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

    const data = []

    for (const row of searchRows) {
        const tableRow = document.createElement('tr')
        const rowData = {}

        for (const [index, value] of Object.entries(row)) {
            const header = headers[index]
            rowData[header] = value

            if (fieldsToDisplay.has(header)) {
                const tableCell = document.createElement('td')

                if (headers[index].endsWith('url') && value) {
                    const a = document.createElement('a')
                    a.setAttribute('href', value)
                    a.innerHTML = 'link ' + octicons.external_url
                    tableCell.appendChild(a)
                } else if (headers[index].endsWith('_type') && value) {
                    tableCell.innerHTML = value.split('; ').map(value => octicons[value] || value).join(' ')
                } else if (headers[index] === 'id') {
                    const a = document.createElement('a')
                    a.setAttribute('class', 'row-link')
                    a.setAttribute('href', `/catalog/detail?id=${row[headers.indexOf('id')]}`)
                    a.textContent = value
                    tableCell.appendChild(a)
                } else {
                    tableCell.textContent = value
                }

                tableRow.appendChild(tableCell)
            }
        }

        tableRows.appendChild(tableRow)
        data.push(rowData)
    }

    resultCount.textContent = `Displaying ${data.length} result${data.length !== 1 ? 's' : ''} of ${rows.length} total.`

})().catch(console.error)
