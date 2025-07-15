(async function () {
    const places = await indexCsv('/assets/data/places.csv', 'id')

    const search = new URLSearchParams(window.location.search)
    if (search.has('name')) {
        const name = search.get('name')
        const place = Object.values(places).find(place => place.name.split('; ').includes(name))
        if (place) {
            search.delete('name')
            search.set('id', place.id)
            window.location.replace(window.location.pathname + '?' + search.toString() + window.location.hash)
        }
    }

    const id = search.get('id')

    if (places[id].duplicate_of) {
        window.location.href = '/catalog/place/?id=' + places[id].duplicate_of
    }

    const [headers, ...rows] = await loadCatalog()

    const all = {}
    const parts = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        if (data.region.split('; ').includes(places[id].name)) {
            parts.push(data)
        }

        all[data.id] = data
    }

    parts.sort((a, b) => a.date ? b.date ? parseInt(b.date) - parseInt(a.date) : -1 : 0)

    document.querySelector('head title').textContent = places[id].display_name + ' — Library of Identification Resources'
    document.getElementById('mainTitle').textContent = places[id].display_name

    {
        const purl = `https://purl.org/identification-resources/place/${id}`
        const permalink = document.createElement('a')
        permalink.setAttribute('href', purl)
        permalink.innerHTML = octicons.persistent_url
        permalink.append(' ' + purl)
        document.getElementById('permalink').append(permalink)
    }

    {
        const qid = places[id].qid

        const wikidata = document.createElement('a')
        wikidata.setAttribute('href', `http://www.wikidata.org/entity/${qid}`)
        wikidata.innerHTML = octicons.external_url
        wikidata.prepend(qid + ' ')
        document.getElementById('wikidata').append(wikidata)

        const scholia = document.createElement('a')
        scholia.setAttribute('href', `https://scholia.toolforge.org/location/${qid}`)
        scholia.innerHTML = octicons.external_url
        scholia.prepend(`location/${qid} `)
        document.getElementById('scholia').append(scholia)
    }

    {
        const a = document.createElement('a')
        const url = `/catalog/?field=region&query=${places[id].name}`
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

            const taxon = document.createElement('td')
            taxon.textContent = part.taxon
            row.appendChild(taxon)

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
