(async function () {
    const [headers, ...rows] = await loadCatalog()
    const authors = await indexCsv('/assets/data/authors.csv', 'name')
    const search = new URLSearchParams(window.location.search)
    const name = search.get('name')

    const all = {}
    const parts = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        if (data.author.split('; ').includes(name)) {
            parts.push(data)
        }

        all[data.id] = data
    }

    parts.sort((a, b) => a.date ? b.date ? b.date.split('-')[0] - a.date.split('-')[0] : -1 : 0)

    const languages = parts
        .flatMap(part => part.language.split('; '))
        .filter((v, i, a) => a.indexOf(v) === i)

    document.querySelector('head title').textContent = (authors[name].main_full_name || name) + ' — Library of Identification Resources'
    document.getElementById('mainTitle').textContent = authors[name].main_full_name || name

    if (authors[name].full_names) {
        const element = document.getElementById('title')
        for (const longName of authors[name].full_names.split('; ')) {
            const p = document.createElement('p')
            p.textContent = longName
            element.appendChild(p)
        }
    }

    if (authors[name].qid) {
        const qid = authors[name].qid

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

    {
        const a = document.createElement('a')
        const url = `/catalog/?field=author&query=${name}`
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
