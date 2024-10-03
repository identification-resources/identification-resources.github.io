(async function () {
    const categories = {
        authors: async function () {
            const authors = await indexCsv('/assets/data/authors.csv', 'name')
            for (const id in catalog) {
                if (catalog[id].author) {
                    for (const author of catalog[id].author.split('; ')) {
                        authors[author].works = authors[author].works || []
                        authors[author].works.push(catalog[id])
                    }
                }
            }

            return Object.values(authors).map(author => {
                const entry = {}

                entry._letter = author.name.split(/[ -]/g).pop().slice(0, 1).toUpperCase()

                {
                    const a = document.createElement('a')
                    a.textContent = author.name
                    a.setAttribute('href', `/catalog/author/?name=${author.name}`)
                    entry['Author'] = a
                }

                {
                    entry['Name'] = author.main_full_name || author.name
                }

                {
                    entry['Other names'] = author.full_names
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
                    const a = document.createElement('a')
                    a.textContent = author.works.length
                    a.setAttribute('href', `/catalog/?field=author&query=${author.name}`)
                    a.setAttribute('style', 'text-align: right;')
                    entry['Works'] = a
                }

                return entry
            })
        },
        places: async function () {
            const places = await indexCsv('/assets/data/places.csv', 'name')
            for (const id in catalog) {
                if (catalog[id].region) {
                    for (const place of catalog[id].region.split('; ')) {
                        places[place].works = places[place].works || []
                        places[place].works.push(catalog[id])
                    }
                }
            }

            return Object.values(places)
                .filter(place => !['?', '-'].includes(place.name))
                .map(place => {
                    const entry = {}

                    entry._name = place.display_name || place.name
                    entry._letter = entry._name.slice(0, 1).toUpperCase()

                    {
                        const a = document.createElement('a')
                        a.textContent = entry._name
                        a.setAttribute('href', `/catalog/place/?name=${place.name}`)
                        entry['Place'] = a
                    }

                    {
                        entry['Located in'] = place.name.split(', ').slice(0, -1).join(' > ')
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
                        const a = document.createElement('a')
                        a.textContent = place.works.length
                        a.setAttribute('href', `/catalog/?field=place&query=${place.name}`)
                        a.setAttribute('style', 'text-align: right;')
                        entry['Works'] = a
                    }

                    return entry
                })
                .sort(({ _name: a }, { _name: b }) => a < b ? -1 : a > b ? 1 : 0)
        },
        publishers: async function () {
            const publishers = await indexCsv('/assets/data/publishers.csv', 'name')
            for (const id in catalog) {
                if (catalog[id].publisher) {
                    for (const publisher of catalog[id].publisher.split('; ')) {
                        publishers[publisher].works = publishers[publisher].works || []
                        publishers[publisher].works.push(catalog[id])
                    }
                }
            }

            return Object.values(publishers)
                .map(publisher => {
                    const entry = {}

                    entry._sortName = publisher.name.toUpperCase()
                    entry._letter = entry._sortName.slice(0, 1)

                    {
                        const a = document.createElement('a')
                        a.textContent = publisher.name
                        a.setAttribute('href', `/catalog/publisher/?name=${publisher.name}`)
                        entry['Publisher'] = a
                    }

                    {
                        entry['Name'] = publisher.full_name || publisher.name
                    }

                    {
                        entry['Other name'] = publisher.long_name
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
                        const a = document.createElement('a')
                        a.textContent = publisher.works.length
                        a.setAttribute('href', `/catalog/?field=publisher&query=${publisher.name}`)
                        a.setAttribute('style', 'text-align: right;')
                        entry['Works'] = a
                    }

                    return entry
                })
                .sort(({ _sortName: a }, { _sortName: b }) => a < b ? -1 : a > b ? 1 : 0)
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

                    entry._sortName = series.name.toUpperCase()
                    entry._letter = entry._sortName.slice(0, 1)

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
                .sort(({ _sortName: a }, { _sortName: b }) => a < b ? -1 : a > b ? 1 : 0)
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
