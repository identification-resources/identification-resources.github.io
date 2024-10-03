(async function () {
    const tableHeaders = document.getElementById('catalog_headers')
    const tableRows = document.getElementById('catalog_data')
    const inputField = document.getElementById('catalog_select')
    const inputQuery = document.getElementById('catalog_search')
    const resultCount = document.getElementById('catalog_results')
    const pagination = document.getElementById('catalog_pagination')

    const headersLabels = fieldLabels
    const fieldsToDisplay = new Set([
        'id',
        'title',
        'entry_type',
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

    const { searchPage, searchLimit } = formatPagination(pagination, search, searchRows)

    const data = []

    for (const row of searchRows.slice((searchPage - 1) * searchLimit, searchPage * searchLimit)) {
        const tableRow = document.createElement('tr')
        const rowData = {}

        for (const [index, value] of Object.entries(row)) {
            const header = headers[index]
            rowData[header] = value

            if (fieldsToDisplay.has(header)) {
                const tableCell = document.createElement('td')

                if (headers[index].endsWith('url')) {
                    tableCell.innerHTML = value ? octicons.available : octicons.not_available
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

    resultCount.textContent = `Displaying ${data.length} result${data.length !== 1 ? 's' : ''} of ${searchRows.length} total.`

})().catch(console.error)
