(async function () {
    const search = new URLSearchParams(window.location.search)
    const id = search.get('id')
    const key = await loadKey(id)
    const catalogId = id.split(':')[0]
    const catalog = await indexCsv('/assets/data/catalog.csv', 'id')

    const data = Object.assign(
        {},
        catalog[catalogId],
        {
            title: `Identification resource ${id}`
        },
        key.metadata.catalog || {}
    )

    if (typeof data.key_type === 'string') { data.key_type = data.key_type.split('; ') }
    if (typeof data.scope === 'string') { data.scope = data.scope.split('; ') }

    document.querySelector('head title').textContent = data.title + ' — Library of Identification Resources'
    document.getElementById('title').textContent = data.title

    if (data.key_type) {
        const element = document.getElementById('resource_type')
        for (const type of data.key_type) {
            const p = document.createElement('p')
            if (octicons[type]) {
                p.innerHTML = octicons[type]
            }
            p.append(' ' + type)
            element.appendChild(p)
        }
    }

    document.getElementById('scope').textContent = data.scope && data.scope.join(', ')
    document.getElementById('region').append(...formatLinkedList(
        data.region,
        place => `/catalog/place/?name=${place}`
    ))
    document.getElementById('taxon_count').textContent = key.metadata.taxonCount

    // Bibliographical info
    for (const field in key.metadata.catalog) {
        if (['key_type', 'scope', 'region'].includes(field)) {
            continue
        }

        const tr = document.createElement('tr')
        const th = document.createElement('th')
        th.textContent = fieldLabels[field]
        const td = document.createElement('td')

        if (field === 'author') {
            td.append(...formatAuthors(data.author))
        } else {
            td.textContent = data[field]
        }

        tr.append(th, td)
        document.getElementById('metadata').append(tr)
    }

    {
        const a = document.createElement('a')
        a.setAttribute('href', `/catalog/detail/?id=${catalogId}`)
        a.textContent = `${catalog[catalogId].title} (${catalogId})`
        document.getElementById('part_of').append(a)
    }

    // Flags
    if (key.metadata.flags) {
        const flags = document.getElementById('flags')
        for (const flag of key.metadata.flags) {
            const p = document.createElement('p')
            p.classList.add('alert')
            p.textContent = flagLabels[flag]
            const span = document.createElement('span')
            span.textContent = `(${flag})`
            span.setAttribute('style', 'color: grey;')
            p.append('. ', span)
            flags.append(p)
        }
    }

    // Taxa
    {
        const roots = []

        for (const id in key.taxa) {
            const taxon = key.taxa[id]
            if (taxon.parentNameUsageID) {
                const parent = key.taxa[taxon.parentNameUsageID]
                if (!parent.children) { parent.children = [] }
                parent.children.push(taxon)
            } else if (taxon.acceptedNameUsageID) {
                const parent = key.taxa[taxon.acceptedNameUsageID]
                if (!parent.synonyms) { parent.synonyms = [] }
                parent.synonyms.push(taxon)
            } else {
                roots.push(taxon)
            }
        }

        function renderName (taxon) {
            const fragment = document.createDocumentFragment()

            {
                const { name, authorship } = parseResourceTaxonName(taxon)

                if (['genus', 'subgenus', 'species'].includes(taxon.taxonRank)) {
                    const i = document.createElement('i')
                    i.textContent = name
                    fragment.append(i)
                } else if ('group' === taxon.taxonRank) {
                    const parts = name.match(/^(.+?)((-group)?)$/)
                    const i = document.createElement('i')
                    i.textContent = parts[1]
                    fragment.append(i)
                    fragment.append(parts[2])
                } else if (['subspecies', 'variety', 'form', 'race', 'stirps', 'aberration'].includes(taxon.taxonRank)) {
                    const parts = name.match(new RegExp(`^(${taxon.genericName} ${taxon.specificEpithet})(.+)(${taxon.infraspecificEpithet})$`))
                    const start = document.createElement('i')
                    start.textContent = parts[1]
                    fragment.append(start)
                    fragment.append(parts[2])
                    const end = document.createElement('i')
                    end.textContent = parts[3]
                    fragment.append(end)
                } else {
                    fragment.append(name)
                }

                fragment.append(' ' + authorship + ' ')

                const span = document.createElement('span')
                span.setAttribute('style', 'color: grey;')
                span.textContent = taxon.taxonRank
                fragment.append(span)
            }

            {
                const a = document.createElement('a')
                a.setAttribute('href', `/catalog/resource/?id=${id}#${taxon.scientificNameID}`)
                a.setAttribute('name', taxon.scientificNameID)
                a.innerHTML = octicons.persistent_url
                fragment.append(' ')
                fragment.appendChild(a)
            }

            // Taxon info page
            if (taxon.gbifTaxonID) {
                const a = document.createElement('a')
                a.setAttribute('href', `/taxonomy/taxon/?gbif=${taxon.gbifTaxonID}`)
                a.innerHTML = octicons.info
                fragment.append(' ')
                fragment.appendChild(a)
            }

            // GBIF link
            if (taxon.gbifTaxonID) {
                const a = document.createElement('a')
                a.setAttribute('href', `https://gbif.org/species/${taxon.gbifTaxonID}`)
                const img = document.createElement('img')
                img.setAttribute('src', '/assets/img/gbif-mark-green-logo.png')
                img.setAttribute('width', 16)
                img.setAttribute('style', 'vertical-align: middle;')
                a.appendChild(img)
                fragment.append(' ')
                fragment.appendChild(a)
            }

            return fragment
        }

        function renderTaxon (taxon) {
            const li = document.createElement('li')
            const fragment = renderName(taxon)

            if (taxon.synonyms || taxon.children) {
                const details = document.createElement('details')
                const summary = document.createElement('summary')
                summary.appendChild(fragment)
                details.appendChild(summary)

                if (taxon.synonyms) {
                    const ul = document.createElement('ul')
                    taxon.synonyms.forEach(taxon => {
                        const li = document.createElement('li')
                        const fragment = renderName(taxon)
                        fragment.prepend('= ')
                        li.appendChild(fragment)
                        ul.appendChild(li)
                    })
                    details.appendChild(ul)
                }
                if (taxon.children) {
                    details.setAttribute('open', '')
                    const ul = document.createElement('ul')
                    taxon.children.forEach(taxon => ul.appendChild(renderTaxon(taxon)))
                    details.appendChild(ul)
                }

                li.appendChild(details)
            } else {
                li.appendChild(fragment)
            }

            return li
        }

        const section = document.getElementById('taxa_section')
        {
            const p = document.createElement('p')
            const a = document.createElement('a')
            a.setAttribute('download', '')
            a.setAttribute('href', `/assets/data/resources/dwc/${id.split(':').join('-')}.csv`)
            a.textContent =  'Download as Darwin Core'
            p.appendChild(a)
            section.appendChild(p)
        }

        for (const taxon of roots) {
            section.appendChild(renderTaxon(taxon))
        }
    }
})().catch(console.error)
