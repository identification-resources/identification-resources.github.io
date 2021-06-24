(async function () {
    const tableHeaders = document.getElementById('catalog_headers')
    const tableRows = document.getElementById('catalog_data')
    const inputField = document.getElementById('catalog_select')
    const inputQuery = document.getElementById('catalog_search')
    const resultCount = document.getElementById('catalog_results')

    const headersLabels = {
        title: 'Title',
        author: 'Authors',
        url: 'URL',
        archive_url: 'Archived URL',
        entry_type: 'Entry type',
        date: 'Year/date',
        publisher: 'Publisher',
        series: 'Series/periodical',
        ISSN: 'ISSN',
        ISBN: 'ISBN',
        DOI: 'DOI',
        volume: 'Volume',
        issue: 'Issue',
        pages: 'Pages',
        edition: 'Edition',
        language: 'Language',
        license: 'License',
        key_type: 'Resource type',
        taxon: 'Taxon',
        region: 'Region',
        complete: 'Completeness',
        target_taxa: 'Taxon. level'
    }

    // primer/octicons is licensed under the MIT License
    // https://github.com/primer/octicons/blob/main/LICENSE
    const octicons = {
        key: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M3.604 3.089A.75.75 0 014 3.75V8.5h.75a.75.75 0 010 1.5h-3a.75.75 0 110-1.5h.75V5.151l-.334.223a.75.75 0 01-.832-1.248l1.5-1a.75.75 0 01.77-.037zM8.75 5.5a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H8.75zm0 6a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H8.75zm0 6a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H8.75zM5.5 15.75c0-.704-.271-1.286-.72-1.686a2.302 2.302 0 00-1.53-.564c-.535 0-1.094.178-1.53.565-.449.399-.72.982-.72 1.685a.75.75 0 001.5 0c0-.296.104-.464.217-.564A.805.805 0 013.25 15c.215 0 .406.072.533.185.113.101.217.268.217.565 0 .332-.069.48-.21.657-.092.113-.216.24-.403.419l-.147.14c-.152.144-.33.313-.52.504l-1.5 1.5a.75.75 0 00-.22.53v.25c0 .414.336.75.75.75H5A.75.75 0 005 19H3.31l.47-.47c.176-.176.333-.324.48-.465l.165-.156a5.98 5.98 0 00.536-.566c.358-.447.539-.925.539-1.593z"></path></svg>`,
        matrix: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M2 3.75C2 2.784 2.784 2 3.75 2h16.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0120.25 22H3.75A1.75 1.75 0 012 20.25V3.75zM3.5 9v11.25c0 .138.112.25.25.25H7.5V9h-4zm4-1.5h-4V3.75a.25.25 0 01.25-.25H7.5v4zM9 9v11.5h11.25a.25.25 0 00.25-.25V9H9zm11.5-1.5H9v-4h11.25a.25.25 0 01.25.25V7.5z"></path></svg>`,
        reference: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M0 4.75C0 3.784.784 3 1.75 3h20.5c.966 0 1.75.784 1.75 1.75v14.5A1.75 1.75 0 0122.25 21H1.75A1.75 1.75 0 010 19.25V4.75zm1.75-.25a.25.25 0 00-.25.25v14.5c0 .138.112.25.25.25h20.5a.25.25 0 00.25-.25V4.75a.25.25 0 00-.25-.25H1.75z"></path><path fill-rule="evenodd" d="M5 8.75A.75.75 0 015.75 8h11.5a.75.75 0 010 1.5H5.75A.75.75 0 015 8.75zm0 4a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z"></path></svg>`,
        gallery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M2.25 4a.25.25 0 00-.25.25v15.5c0 .138.112.25.25.25h3.178L14 10.977a1.75 1.75 0 012.506-.032L22 16.44V4.25a.25.25 0 00-.25-.25H2.25zm3.496 17.5H21.75a1.75 1.75 0 001.75-1.75V4.25a1.75 1.75 0 00-1.75-1.75H2.25A1.75 1.75 0 00.5 4.25v15.5c0 .966.784 1.75 1.75 1.75h3.496zM22 19.75v-1.19l-6.555-6.554a.25.25 0 00-.358.004L7.497 20H21.75a.25.25 0 00.25-.25zM9 9.25a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0zm1.5 0a3.25 3.25 0 11-6.5 0 3.25 3.25 0 016.5 0z"></path></svg>`,
        collection: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill-rule="evenodd" d="M4.801 3.57A1.75 1.75 0 016.414 2.5h11.174c.702 0 1.337.42 1.611 1.067l3.741 8.828c.04.092.06.192.06.293v7.562A1.75 1.75 0 0121.25 22H2.75A1.75 1.75 0 011 20.25v-7.5c0-.1.02-.199.059-.291L4.8 3.571zM6.414 4a.25.25 0 00-.23.153L2.88 12H8a.75.75 0 01.648.372L10.18 15h3.638l1.533-2.628a.75.75 0 01.64-.372l5.13-.051-3.304-7.797a.25.25 0 00-.23-.152H6.414zM21.5 13.445l-5.067.05-1.535 2.633a.75.75 0 01-.648.372h-4.5a.75.75 0 01-.648-.372L7.57 13.5H2.5v6.75c0 .138.112.25.25.25h18.5a.25.25 0 00.25-.25v-6.805z"></path></svg>`
    }

    const url = 'https://cdn.jsdelivr.net/gh/identification-resources/catalog@main/catalog.csv'
    const request = await fetch(url)
    const file = await request.text()

    const [headers, ...rows] = file.trim().split('\n').map(row => row
        .match(/("([^"]|"")*?"|[^,]*)(,|$)/g)
        .map(value => {
            value = value.replace(/,$/, '')
            return value.startsWith('"') ? value.replace(/""/g, '"').slice(1, -1) : value
        })
        .slice(0, -1)
    )

    for (const header of headers) {
        const tableHeader = document.createElement('th')
        tableHeader.textContent = headersLabels[header]
        tableHeaders.appendChild(tableHeader)

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

    const data = []

    for (const row of rows) {
        if (searchField && !row[searchFieldIndex].toLowerCase().includes(searchQuery.toLowerCase())) continue

        const tableRow = document.createElement('tr')
        const rowData = {}

        for (const [index, value] of Object.entries(row)) {
            const tableCell = document.createElement('td')

            if (headers[index].endsWith('url') && value) {
                const a = document.createElement('a')
                a.setAttribute('href', value)
                a.textContent = 'link'
                tableCell.appendChild(a)
            } else {
                tableCell.textContent = value
            }

            tableRow.appendChild(tableCell)

            rowData[headers[index]] = value
        }

        tableRows.appendChild(tableRow)
        data.push(rowData)
    }

    resultCount.textContent = `Displaying ${data.length} result${data.length !== 1 ? 's' : ''}.`

})().catch(console.error)
