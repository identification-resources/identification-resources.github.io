(async function () {
    const [headers, ...rows] = await loadCatalog()
    const publishers = await indexCsv('/assets/data/publishers.csv', 'name')
    const search = new URLSearchParams(window.location.search)
    const name = search.get('name')

    const all = {}
    const parts = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        if (data.publisher.split('; ').includes(name)) {
            parts.push(data)
        }

        all[data.id] = data
    }

    parts.sort((a, b) => a.date ? b.date ? b.date.split('-')[0] - a.date.split('-')[0] : -1 : 0)

    document.getElementById('mainTitle').textContent = publishers[name].full_name || name

    {
        const element = document.getElementById('title')
        for (const longName of publishers[name].long_name.split('; ')) {
            const p = document.createElement('p')
            p.textContent = longName
            element.appendChild(p)
        }
    }

    if (publishers[name].qid) {
        const qid = publishers[name].qid

        const wikidata = document.createElement('a')
        wikidata.setAttribute('href', `http://www.wikidata.org/entity/${qid}`)
        wikidata.innerHTML = octicons.external_url
        wikidata.prepend(qid + ' ')
        document.getElementById('wikidata').append(wikidata)

        const scholia = document.createElement('a')
        scholia.setAttribute('href', `https://scholia.toolforge.org/publisher/${qid}`)
        scholia.innerHTML = octicons.external_url
        scholia.prepend(`publisher/${qid} `)
        document.getElementById('scholia').append(scholia)
    }

    {
        const a = document.createElement('a')
        const url = `/catalog/?field=publisher&query=${name}`
        a.setAttribute('href', url)
        a.textContent = 'View all'
        document.getElementById('search').append(a)
    }

    // Parts
    {
        const table = document.getElementById('parts')
        for (const part of parts) {
            const row = document.createElement('tr')

            const year = document.createElement('td')
            year.textContent = part.date ? part.date.split('-')[0] : ''
            row.appendChild(year)

            const author = document.createElement('td')
            author.append(...formatAuthors(part.author))
            row.appendChild(author)

            const titleCell = document.createElement('td')
            const titleLink = document.createElement('a')
            titleLink.setAttribute('href', `/catalog/detail/?id=${part.id}`)
            titleLink.textContent = part.title
            titleCell.appendChild(titleLink)
            row.appendChild(titleCell)

            table.appendChild(row)
        }
    }
})().catch(console.error)
