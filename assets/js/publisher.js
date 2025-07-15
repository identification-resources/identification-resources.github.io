(async function () {
    const publishers = await indexCsv('/assets/data/publishers.csv', 'id')

    const search = new URLSearchParams(window.location.search)
    if (search.has('name')) {
        const name = search.get('name')
        const publisher = Object.values(publishers).find(publisher => publisher.name.split('; ').includes(name))
        if (publisher) {
            search.delete('name')
            search.set('id', publisher.id)
            window.location.replace(window.location.pathname + '?' + search.toString() + window.location.hash)
        }
    }

    const id = search.get('id')
    const names = publishers[id].name.split('; ')

    if (publishers[id].duplicate_of) {
        window.location.href = '/catalog/publisher/?id=' + publishers[id].duplicate_of
    }

    const [headers, ...rows] = await loadCatalog()

    const all = {}
    const parts = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        const publishers = data.publisher.split('; ')
        for (const publisher of publishers) {
            if (names.includes(publisher)) {
                parts.push(data)
            }
        }

        all[data.id] = data
    }

    parts.sort((a, b) => a.date ? b.date ? parseInt(b.date) - parseInt(a.date) : -1 : 0)

    document.querySelector('head title').textContent = publishers[id].display_name + ' — Library of Identification Resources'
    document.getElementById('mainTitle').textContent = publishers[id].display_name

    {
        const element = document.getElementById('title')
        for (const name of publishers[id].full_names.split('; ')) {
            const p = document.createElement('p')
            p.textContent = name
            element.appendChild(p)
        }
    }

    {
        const purl = `https://purl.org/identification-resources/publisher/${id}`
        const permalink = document.createElement('a')
        permalink.setAttribute('href', purl)
        permalink.innerHTML = octicons.persistent_url
        permalink.append(' ' + purl)
        document.getElementById('permalink').append(permalink)
    }

    if (publishers[id].qid) {
        const qid = publishers[id].qid

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

    // TODO improve search
    if (names.length === 1) {
        const a = document.createElement('a')
        const url = `/catalog/?field=publisher&query=${names[0]}`
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
            year.textContent = part.date ? part.date.replace(/-\d+/g, '') : ''
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
