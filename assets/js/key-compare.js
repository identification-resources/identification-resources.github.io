(async function () {
  const search = new URLSearchParams(window.location.search)

  const [catalog, a, b] = await Promise.all([
    indexCsv('/assets/data/catalog.csv', 'id'),
    loadKey(search.get('a')),
    loadKey(search.get('b'))
  ])
  const comparison = { a, b }

  const metadataTable = document.getElementById('metadata')
  const fieldRows = {}
  for (const letter in comparison) {
    const key = comparison[letter].metadata
    const catalogId = key.id.split(':')[0]

    {
      const a = document.createElement('a')
      a.setAttribute('href', `/catalog/detail/?id=${catalogId}`)
      a.textContent = `${catalog[catalogId].title}`
      document.getElementById(`${letter}_work`).appendChild(a)
    }

    {
      const a = document.createElement('a')
      a.setAttribute('href', `/catalog/resource/?id=${key.id}`)
      a.textContent = key.catalog?.title ? `${key.catalog.title} (${key.id})` : key.id
      document.getElementById(`${letter}_resource`).appendChild(a)
    }

    if (key.catalog) {
      for (const field in key.catalog) {
        if (field === 'title') {
          continue
        }

        if (!fieldRows[field]) {
          fieldRows[field] = {}

          const tr = document.createElement('tr')
          const th = document.createElement('th')
          th.textContent = fieldLabels[field]
          tr.appendChild(th)

          for (const letter in comparison) {
            const td = document.createElement('td')
            fieldRows[field][letter] = td
            tr.appendChild(td)
          }

          metadataTable.appendChild(tr)
        }

        fieldRows[field][letter].textContent = Array.isArray(key.catalog[field]) ? key.catalog[field].join(', ') : key.catalog[field] ?? '&mdash;'
      }
    }
  }

  // Taxa
  function processTaxonomy (key) {
    const roots = []
    const gbifIndex = {}

    for (const id in key.taxa) {
      const taxon = key.taxa[id]

      if (taxon.gbifAcceptedTaxonID) {
        gbifIndex[taxon.gbifAcceptedTaxonID] = true
      }

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

    const leafs = []

    for (const id in key.taxa) {
      const taxon = key.taxa[id]

      if (!taxon.children) {
        leafs.push(taxon)
      }

      if (taxon.scientificNameAuthorship) {
        taxon.scientificNameOnly = taxon.scientificName.slice(0, -taxon.scientificNameAuthorship.length - 1)
      }

      if (taxon.gbifAcceptedTaxonID) {
        taxon.gbifClusterTaxonID = parseInt(taxon.gbifAcceptedTaxonID)
      } else if (taxon.synonyms) {
        taxon.gbifClusterTaxonID = taxon.synonyms.map(taxon => parseInt(taxon.gbifAcceptedTaxonID)).find(Boolean)
      } else {
        taxon.gbifClusterTaxonID = Infinity
      }
    }

    return {
      roots,
      gbifIndex,
      leafs
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

    return fragment
  }

  function renderTaxon (aTaxon, bTaxon) {
    const li = document.createElement('li')

    let fragment
    if (!bTaxon) {
      fragment = document.createElement('del')
      fragment.appendChild(renderName(aTaxon))
    } else if (!aTaxon) {
      fragment = document.createElement('ins')
      fragment.appendChild(renderName(bTaxon))
    } else if (aTaxon.scientificName !== bTaxon.scientificName) {
      fragment = document.createDocumentFragment()

      const ins = document.createElement('ins')
      ins.appendChild(renderName(bTaxon))
      fragment.appendChild(ins)

      const del = document.createElement('del')
      del.appendChild(renderName(aTaxon))
      fragment.appendChild(del)
    } else {
      fragment = document.createDocumentFragment()
      fragment.appendChild(renderName(aTaxon))
    }

    if ((aTaxon && aTaxon.children) || (bTaxon && bTaxon.children)) {
      const details = document.createElement('details')
      details.setAttribute('open', '')

      const summary = document.createElement('summary')
      summary.appendChild(fragment)

      const ul = document.createElement('ul')
      renderTaxa((aTaxon && aTaxon.children) || [], (bTaxon && bTaxon.children) || []).forEach(taxon => ul.appendChild(taxon))
      details.appendChild(ul)

      details.appendChild(summary)
      li.appendChild(details)
    } else {
      li.appendChild(fragment)
    }

    return li
  }

  function sortTaxa (taxa) {
    return taxa.sort((a, b) => (a.gbifClusterTaxonID - b.gbifClusterTaxonID) || (a.scientificName > b.scientificName ? 1 : a.scientificName < b.scientificName ? -1 : 0))
  }

  function renderTaxa (aTaxa, bTaxa) {
    const aSorted = sortTaxa(aTaxa)
    const bSorted = sortTaxa(bTaxa)

    const taxa = []

    let ai = 0
    let bi = 0
    while (ai < aSorted.length || bi < bSorted.length) {
      if (!bSorted[bi]) {
        taxa.push(renderTaxon(aSorted[ai], null))
        ai++
      } else if (!aSorted[ai]) {
        taxa.push(renderTaxon(null, bSorted[bi]))
        bi++
      } else if (aSorted[ai].gbifClusterTaxonID < bSorted[bi].gbifClusterTaxonID && Number.isFinite(bSorted[bi].gbifClusterTaxonID)) {
        taxa.push(renderTaxon(aSorted[ai], null))
        ai++
      } else if (aSorted[ai].gbifClusterTaxonID > bSorted[bi].gbifClusterTaxonID && Number.isFinite(aSorted[ai].gbifClusterTaxonID)) {
        taxa.push(renderTaxon(null, bSorted[bi]))
        bi++
      } else if (aSorted[ai].scientificNameOnly < bSorted[bi].scientificNameOnly) {
        taxa.push(renderTaxon(aSorted[ai], null))
        ai++
      } else if (aSorted[ai].scientificNameOnly > bSorted[bi].scientificNameOnly) {
        taxa.push(renderTaxon(null, bSorted[bi]))
        bi++
      } else {
        taxa.push(renderTaxon(aSorted[ai], bSorted[bi]))
        ai++
        bi++
      }
    }

    return taxa
  }

  {
    const aroots = processTaxonomy(a).roots
    const broots = processTaxonomy(b).roots

    const section = document.getElementById('taxa_section')
    for (const taxon of renderTaxa(aroots, broots)) {
      section.appendChild(taxon)
    }
  }
})().catch(console.error)
