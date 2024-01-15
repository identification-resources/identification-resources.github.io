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

    // Taxa
    {
        // 0,scientificNameID
        // 1,scientificName
        // 2,scientificNameAuthorship
        // 3,genericName
        // 4,infragenericEpithet
        // 5,specificEpithet
        // 6,infraspecificEpithet
        // 7,taxonRank
        // 8,taxonRemarks
        // 9,collectionCode
        // 10,taxonomicStatus
        // 11,acceptedNameUsageID
        // 12,acceptedNameUsage
        // 13,parentNameUsageID
        // 14,parentNameUsage
        // 15,kingdom
        // 16,phylum
        // 17,class
        // 18,order
        // 19,family
        // 20,subfamily
        // 21,genus
        // 22,subgenus
        // 23,higherClassification
        // 24,verbatimIdentification
        // 25,colTaxonID
        // 26,gbifTaxonID
        // 27,colAcceptedTaxonID
        // 28,gbifAcceptedTaxonID

        const roots = []

        for (const id in key.taxa) {
            const taxon = key.taxa[id]
            if (taxon.data[13]) {
                const parent = key.taxa[taxon.data[13]]
                if (!parent.children) { parent.children = [] }
                parent.children.push(taxon)
            } else if (taxon.data[11]) {
                const parent = key.taxa[taxon.data[11]]
                if (!parent.synonyms) { parent.synonyms = [] }
                parent.synonyms.push(taxon)
            } else {
                roots.push(taxon)
            }
        }

        function renderName (taxon) {
            const fragment = document.createDocumentFragment()

            {
                let authorship = taxon.data[2]
                let name = authorship ? taxon.data[1].slice(0, -(1 + authorship.length)) : taxon.data[1]

                if (['genus', 'subgenus', 'species'].includes(taxon.data[7])) {
                    const i = document.createElement('i')
                    i.textContent = name
                    fragment.append(i)
                } else if ('group' === taxon.data[7]) {
                    const parts = name.match(/^(.+?)((-group)?)$/)
                    const i = document.createElement('i')
                    i.textContent = parts[1]
                    fragment.append(i)
                    fragment.append(parts[2])
                } else if (['subspecies', 'variety', 'form', 'race', 'stirps', 'aberration'].includes(taxon.data[7])) {
                    const parts = name.match(new RegExp(`^(${taxon.data[3]} ${taxon.data[5]})(.+)(${taxon.data[6]})$`))
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
                span.textContent = taxon.data[7]
                fragment.append(span)
            }

            {
                const a = document.createElement('a')
                a.setAttribute('href', `/catalog/resource/?id=${id}#${taxon.data[0]}`)
                a.setAttribute('name', taxon.data[0])
                a.innerHTML = octicons.persistent_url
                fragment.append(' ')
                fragment.appendChild(a)
            }

            // Taxon info page
            if (taxon.data[26]) {
                const a = document.createElement('a')
                a.setAttribute('href', `/taxonomy/taxon/?gbif=${taxon.data[26]}`)
                a.innerHTML = octicons.info
                fragment.append(' ')
                fragment.appendChild(a)
            }

            // gbif id
            if (taxon.data[26]) {
                const a = document.createElement('a')
                a.setAttribute('href', `https://gbif.org/species/${taxon.data[26]}`)
                const img = document.createElement('img')
                img.setAttribute('src', '/assets/img/gbif-mark-green-logo.png')
                img.setAttribute('width', 16)
                img.setAttribute('style', 'vertical-align: bottom;')
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
        console.log(roots)

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
