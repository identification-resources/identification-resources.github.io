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

    document.querySelector('head title').textContent = data.title + ' — Library of Identification Resources'
    document.getElementById('title').textContent = data.title

    if (data.key_type) {
        const element = document.getElementById('resource_type')
        for (const type of data.key_type.split('; ')) {
            const p = document.createElement('p')
            if (octicons[type]) {
                p.innerHTML = octicons[type]
            }
            p.append(' ' + type)
            element.appendChild(p)
        }
    }

    document.getElementById('scope').textContent = key.metadata.scope.join(', ')
    document.getElementById('region').append(...formatLinkedList(
        data.region,
        place => `/catalog/place/?name=${place}`
    ))
    document.getElementById('taxon_count').textContent = key.metadata.taxonCount

    // Bibliographical info
    document.getElementById('author').append(...formatAuthors(data.author))
    document.getElementById('pages').textContent = data.pages

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
        // 4,intragenericEpithet
        // 5,specificEpithet
        // 6,intraspecificEpithet
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
        // 24,colTaxonID
        // 25,gbifTaxonID

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

                if (['genus', 'subgenus', 'group', 'species', 'subspecies', 'variety', 'form'].includes(taxon.data[7])) {
                    const i = document.createElement('i')
                    i.textContent = name
                    fragment.append(i)
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

            // gbif id
            if (taxon.data[25]) {
                const a = document.createElement('a')
                a.setAttribute('href', `https://gbif.org/species/${taxon.data[25]}`)
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
        for (const taxon of roots) {
            section.appendChild(renderTaxon(taxon))
        }
    }
})().catch(console.error)
