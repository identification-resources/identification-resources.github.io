(async function () {
    const authors = await indexCsv('/assets/data/authors.csv', 'id')

    const search = new URLSearchParams(window.location.search)
    if (search.has('name')) {
        const name = search.get('name')
        const author = Object.values(authors).find(author => author.name.split('; ').includes(name))
        if (author) {
            search.delete('name')
            search.set('id', author.id)
            window.location.replace(window.location.pathname + '?' + search.toString() + window.location.hash)
        }
    }

    const id = search.get('id')
    const names = authors[id].name.split('; ')

    const [headers, ...rows] = await loadCatalog()

    const all = {}
    const parts = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        const authors = data.author.split('; ')
        for (const author of authors) {
            if (names.includes(author)) {
                parts.push(data)
            }
        }

        all[data.id] = data
    }

    parts.sort((a, b) => a.date ? b.date ? parseInt(b.date) - parseInt(a.date) : -1 : 0)

    const languages = parts
        .flatMap(part => part.language.split('; '))
        .filter((v, i, a) => a.indexOf(v) === i)

    document.querySelector('head title').textContent = authors[id].display_name + ' — Library of Identification Resources'
    document.getElementById('mainTitle').textContent = authors[id].display_name

    if (authors[id].full_names) {
        const element = document.getElementById('title')
        for (const longName of authors[id].full_names.split('; ')) {
            const p = document.createElement('p')
            p.textContent = longName
            element.appendChild(p)
        }
    }

    {
        const purl = `https://purl.org/identification-resources/author/${id}`
        const permalink = document.createElement('a')
        permalink.setAttribute('href', purl)
        permalink.innerHTML = octicons.persistent_url
        permalink.append(' ' + purl)
        document.getElementById('permalink').append(permalink)
    }

    if (authors[id].qid) {
        const qid = authors[id].qid

        const wikidata = document.createElement('a')
        wikidata.setAttribute('href', `http://www.wikidata.org/entity/${qid}`)
        wikidata.innerHTML = octicons.external_url
        wikidata.prepend(qid + ' ')
        document.getElementById('wikidata').append(wikidata)

        const scholia = document.createElement('a')
        scholia.setAttribute('href', `https://scholia.toolforge.org/author/${qid}`)
        scholia.innerHTML = octicons.external_url
        scholia.prepend(`author/${qid} `)
        document.getElementById('scholia').append(scholia)
    }

    {
        const element = document.getElementById('language')
        for (const language of languages) {
            const p = document.createElement('p')
            p.textContent = language
            element.appendChild(p)
        }
    }

    // TODO improve search
    if (names.length === 1) {
        const a = document.createElement('a')
        const url = `/catalog/?field=author&query=${names[0]}`
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
