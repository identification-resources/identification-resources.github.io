(async function () {
    const tableHeaders = document.getElementById('catalog_headers')
    const tableRows = document.getElementById('catalog_data')
    const inputField = document.getElementById('catalog_search_field')
    const inputQuery = document.getElementById('catalog_search_query')
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
    const searchFields = search.getAll('field')
    const searchQueries = search.getAll('query')

    if (searchFields.length) { inputField.value = searchFields[0] }
    if (searchQueries.length) { inputQuery.value = searchQueries[0] }

    {
        const fieldsetTemplate = document.querySelector('.catalog_search')

        {
            const button = document.createElement('button')
            button.setAttribute('type', 'button')
            button.textContent = LABELS.button_add_field
            button.addEventListener('click', addFieldset)
            fieldsetTemplate.parentElement.append(button)
        }

        let fieldsetCount = 1

        function addFieldset (field = '*', query = '') {
            const fieldset = fieldsetTemplate.cloneNode(true)
            const fieldInput = fieldset.querySelector('select')
            const queryInput = fieldset.querySelector('input')
            const [fieldLabel, queryLabel] = fieldset.querySelectorAll('label')

            const button = document.createElement('button')
            button.setAttribute('type', 'button')
            button.textContent = '×'
            button.addEventListener('click', function () { this.parentNode.remove() })
            fieldset.append(button)

            const idSuffix = '_' + fieldsetCount++

            fieldLabel.setAttribute('for', fieldInput.id + idSuffix)
            fieldInput.id = fieldInput.id + idSuffix
            fieldInput.value = field

            queryLabel.setAttribute('for', queryInput.id + idSuffix)
            queryInput.id = queryInput.id + idSuffix
            queryInput.value = query

            fieldsetTemplate.parentElement.append(fieldset)

            return fieldset
        }

        for (let i = 1; i < searchFields.length; i++) {
            addFieldset(searchFields[i], searchQueries[i])
        }
    }

    const searchRows = searchFields.reduce((rows, field, i) => filterCatalog(headers, rows, field, searchQueries[i] || ''), rows)

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
                    a.setAttribute('href', `${URL_PREFIX}/catalog/detail?id=${row[headers.indexOf('id')]}`)
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

    resultCount.textContent = LABELS.functions.search_result_count(data.length, searchRows.length)

    if (searchQueries.join('')) {
        const params = new URLSearchParams(search.entries().filter(([key]) => key === 'field' || key === 'query'))
        const a = document.createElement('a')
        a.setAttribute('href', `${URL_PREFIX}/catalog/visualizations/?${params}`)
        a.textContent = LABELS.url_statistics
        resultCount.append(' ', a, '.')
    }

})().catch(console.error)
