(async function () {
    const [headers, ...rows] = await loadCatalog()
    const search = new URLSearchParams(window.location.search)
    const issn = search.get('issn').toUpperCase()

    const all = {}
    const parts = []

    for (const row of rows) {
        const data = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }

        if (data.ISSN === issn) {
            parts.push(data)
        }

        all[data.id] = data
    }

    function sortNumbers (callback) {
        return (a, b) => {
            const as = callback(a)
            const bs = callback(b)
            for (let i = 0; i < as.length; i++) {
                if (as[i] > bs[i]) return -1
                if (as[i] < bs[i]) return 1
            }
            return 0
        }
    }

    parts.sort(sortNumbers(part => [
        part.volume,
        part.issue,
        part.pages
    ].map(parseFloat)))

    const titles = parts
        .map(part => part.series)
        .filter((v, i, a) => a.indexOf(v) === i)
    const publishers = parts
        .flatMap(part => part.publisher.split('; '))
        .filter((v, i, a) => a.indexOf(v) === i)

    document.getElementById('mainTitle').textContent = titles[0]

    {
        const element = document.getElementById('title')
        for (const title of titles) {
            const p = document.createElement('p')
            p.textContent = title
            element.appendChild(p)
        }
    }

    {
        const a = document.createElement('a')
        a.setAttribute('href', `https://portal.issn.org/resource/ISSN/${issn}`)
        a.innerHTML = octicons.external_url
        a.prepend(issn + ' ')
        document.getElementById('issn').appendChild(a)
    }

    {
        const element = document.getElementById('publisher')
        for (const publisher of publishers) {
            const p = document.createElement('p')
            const a = document.createElement('a')
            a.setAttribute('href', `/catalog/publisher/?name=${publisher}`)
            a.textContent = publisher
            p.appendChild(a)
            element.appendChild(p)
        }
    }

    {
        const a = document.createElement('a')
        const url = `/catalog/?field=ISSN&query=${issn}`
        a.setAttribute('href', url)
        a.textContent = 'View all'
        document.getElementById('search').append(a)
    }

    // Parts
    {
        const table = document.getElementById('parts')
        for (const part of parts) {
            const row = document.createElement('tr')

            const volume = document.createElement('td')
            volume.textContent = part.volume
            row.appendChild(volume)

            const issue = document.createElement('td')
            issue.textContent = part.issue
            row.appendChild(issue)

            const pages = document.createElement('td')
            pages.textContent = part.pages
            row.appendChild(pages)

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
