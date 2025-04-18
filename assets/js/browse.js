(async function () {
    const categories = {
        authors: async function () {
            const authors = await indexCsv('/assets/data/authors.csv', 'id')
            const authorNames = {}
            for (const id in authors) {
                for (const name of authors[id].name.split('; ')) {
                    authorNames[name] = id
                }
            }

            for (const id in catalog) {
                if (catalog[id].author) {
                    for (const name of catalog[id].author.split('; ')) {
                        const author = authorNames[name]
                        authors[author].works = authors[author].works || []
                        authors[author].works.push(catalog[id])
                    }
                }
            }

            return Object.values(authors).map(author => {
                const entry = {}

                entry._name = author.display_name.split(/[ -]/g).pop().toUpperCase()

                {
                    const a = document.createElement('a')
                    a.textContent = author.display_name
                    a.setAttribute('href', `/catalog/author/?id=${author.id}`)
                    entry['Author'] = a
                }

                {
                    entry['Other names'] = author.full_names.split('; ').join(', ')
                }

                {
                    entry['ID'] = author.id
                }

                if (author.qid) {
                    const a = document.createElement('a')
                    a.setAttribute('href', `http://www.wikidata.org/entity/${author.qid}`)
                    a.innerHTML = octicons.external_url
                    a.prepend(author.qid, '\xA0')
                    entry['Wikidata'] = a
                } else {
                    entry['Wikidata'] = ''
                }

                {
                    entry['Works'] = author.works.length
                }

                return entry
            })
        },
        places: async function () {
            const places = await indexCsv('/assets/data/places.csv', 'id')
            const placeNames = {}
            for (const id in places) {
                for (const name of places[id].name.split('; ')) {
                    placeNames[name] = id
                }
            }

            for (const id in catalog) {
                if (catalog[id].region) {
                    for (const name of catalog[id].region.split('; ')) {
                        const place = placeNames[name]
                        places[place].works = places[place].works || []
                        places[place].works.push(catalog[id])
                    }
                }
            }

            return Object.values(places)
                .filter(place => !['G1', 'G2'].includes(place.id))
                .map(place => {
                    const entry = {}

                    entry._name = place.display_name.toUpperCase()

                    {
                        const a = document.createElement('a')
                        a.textContent = place.display_name
                        a.setAttribute('href', `/catalog/place/?id=${place.id}`)
                        entry['Place'] = a
                    }

                    {
                        entry['Located in'] = place.name.split(', ').slice(0, -1).join(' > ')
                    }

                    {
                        entry['ID'] = place.id
                    }

                    if (place.qid) {
                        const a = document.createElement('a')
                        a.setAttribute('href', `http://www.wikidata.org/entity/${place.qid}`)
                        a.innerHTML = octicons.external_url
                        a.prepend(place.qid, '\xA0')
                        entry['Wikidata'] = a
                    } else {
                        entry['Wikidata'] = ''
                    }

                    {
                        entry['Works'] = place.works.length
                    }

                    return entry
                })
        },
        publishers: async function () {
            const publishers = await indexCsv('/assets/data/publishers.csv', 'id')
            const publisherNames = {}
            for (const id in publishers) {
                for (const name of publishers[id].name.split('; ')) {
                    publisherNames[name] = id
                }
            }

            for (const id in catalog) {
                if (catalog[id].publisher) {
                    for (const name of catalog[id].publisher.split('; ')) {
                        const publisher = publisherNames[name] ?? 'P1'
                        publishers[publisher].works = publishers[publisher].works || []
                        publishers[publisher].works.push(catalog[id])
                    }
                }
            }

            return Object.values(publishers)
                .map(publisher => {
                    const entry = {}

                    entry._name = publisher.display_name.toUpperCase()

                    {
                        const a = document.createElement('a')
                        a.textContent = publisher.display_name
                        a.setAttribute('href', `/catalog/publisher/?id=${publisher.id}`)
                        entry['Publisher'] = a
                    }

                    {
                        entry['Other names'] = publisher.full_names.split('; ').join(', ')
                    }

                    {
                        entry['ID'] = publisher.id
                    }

                    if (publisher.qid) {
                        const a = document.createElement('a')
                        a.setAttribute('href', `http://www.wikidata.org/entity/${publisher.qid}`)
                        a.innerHTML = octicons.external_url
                        a.prepend(publisher.qid, '\xA0')
                        entry['Wikidata'] = a
                    } else {
                        entry['Wikidata'] = ''
                    }

                    {
                        entry['Works'] = (publisher.works||[]).length
                    }

                    return entry
                })
        },
        series: async function () {
            const series = {}
            for (const id in catalog) {
                if (catalog[id].series) {
                    if (!series[catalog[id].series]) {
                        series[catalog[id].series] = {
                            name: catalog[id].series,
                            ISSN: catalog[id].ISSN,
                            works: []
                        }
                    }
                    series[catalog[id].series].ISSN = (series[catalog[id].series].ISSN || catalog[id].ISSN)
                    series[catalog[id].series].works.push(catalog[id])
                }
            }

            return Object.values(series)
                .map(series => {
                    const entry = {}

                    entry._name = series.name.toUpperCase()

                    if (series.ISSN) {
                        const a = document.createElement('a')
                        a.textContent = series.name
                        a.setAttribute('href', `/catalog/series/?issn=${series.ISSN}`)
                        entry['Series'] = a
                    } else {
                        entry['Series'] = series.name
                    }

                    {
                        entry['ISSN'] = series.ISSN
                    }

                    {
                        const a = document.createElement('a')
                        a.textContent = series.works.length
                        a.setAttribute('href', `/catalog/?field=series&query=${series.name}`)
                        a.setAttribute('style', 'text-align: right;')
                        entry['Works'] = a
                    }

                    return entry
                })
        }
    }

    const search = new URLSearchParams(window.location.search)
    const category = search.get('category')

    if (!(category in categories)) {
        window.location.replace('/')
    }

    const tableTitle = document.getElementById('browse_title')
    const tableLetters = document.getElementById('browse_letters')
    const tableHeaders = document.getElementById('browse_headers')
    const tableRows = document.getElementById('browse_data')

    tableTitle.textContent = category

    const catalog = await indexCsv('/assets/data/catalog.csv', 'id')

    const entries = await categories[category].call()
    entries.forEach(entry => { entry._letter = entry._name[0] })
    entries.sort(({ _name: a }, { _name: b }) => a === b ? 0 : a > b ? 1 : -1)

    // Letters
    {
        const letters = entries
            .map(entry => entry._letter)
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort()
        for (let i = 0; i < letters.length; i++) {
            if (i > 0) {
                tableLetters.append(' · ')
            }
            const a = document.createElement('a')
            a.textContent = letters[i]
            a.setAttribute('href', '#' + letters[i])
            tableLetters.append(a)
        }
    }

    // Headers
    const columns = Object.keys(entries[0]).filter(key => key[0] !== '_')
    {
        for (const column of columns) {
            const th = document.createElement('th')
            th.textContent = column
            tableHeaders.appendChild(th)
        }
    }

    // Entries
    {
        let letter
        for (const entry of entries) {
            if (entry._letter !== letter) {
                const tr = document.createElement('tr')
                tr.setAttribute('id', entry._letter)
                const th = document.createElement('th')
                th.textContent = entry._letter
                th.setAttribute('colspan', columns.length)
                const a = document.createElement('a')
                a.textContent = ' ↑'
                a.setAttribute('href', '#')
                th.append(a)
                tr.appendChild(th)
                tableRows.appendChild(tr)
                letter = entry._letter
            }

            const tr = document.createElement('tr')
            for (const column of columns) {
                const td = document.createElement('td')
                td.append(entry[column])
                tr.appendChild(td)
            }
            tableRows.appendChild(tr)
        }
    }
})()
