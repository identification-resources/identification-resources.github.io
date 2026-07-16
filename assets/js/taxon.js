(async function () {
  const taxa = await indexCsv('/assets/data/taxa.csv', 'id')

  async function fetchJson (url) {
    const response = await fetch(url)

    if (response.status >= 400) {
      throw new Error(await response.text().then(text => text.slice(0, 100)))
    }

    return response.json()
  }

  async function fetchGbif (id) {
    return fetchJson(`https://api.gbif.org/v1/species/${id}`)
  }

  async function fetchCol (id) {
    return fetchJson(`https://api.checklistbank.org/dataset/3LXR/nameusage/${id}`)
  }

  const gbifRanks = {
    root: false,
    superdomain: false,
    domain: false,
    kingdom: true,
    phylum: true,
    division: false,
    subphylum: false,
    subdivison: false,
    superclass: false,
    class: true,
    subclass: false,
    infraclass: false,
    superorder: false,
    order: true,
    suborder: false,
    infraorder: false,
    parvorder: false,
    superfamily: false,
    Anthophila: false,
    family: true,
    subfamily: false,
    tribe: false,
    subtribe: false,
    section: false,
    genus: true,
    subgenus: false,
    group: false,
    aggregate: false,
    species: true,
    subspecies: true,
    variety: true
  }

  const ANCESTOR = getTaxonBaseFromLoir('T141')

  function getAncestors (data) {
    const ancestors = [ANCESTOR]

    for (const rank in gbifRanks) {
      if (data.rank && rank === data.rank.toLowerCase()) {
        break
      }

      if (gbifRanks[rank] && data[rank]) {
        ancestors.push({
          source: 'gbif',
          gbif: data[rank + 'Key'],
          name: data[rank],
          canonicalName: data[rank],
          rank
        })
      }
    }

    return ancestors
  }

  async function getTaxonFromGbif (id) {
    if (typeof id !== 'number' && (typeof id !== 'string' || !id.match(/^[1-9]\d*$/))) {
      throw new Error(`Invalid GBIF id "${id}"`)
    }

    const data = await fetchGbif(id)
    const colMatch = await fetchJson(`https://api.gbif.org/v2/species/match?checklistKey=xcol&taxonID=gbif:${id}`)
    const col = colMatch.usage ? colMatch.usage.key : undefined

    return {
      source: 'gbif',
      id: null,
      col: col,
      gbif: data.key.toString(),
      qid: `P846:${data.key}`,
      name: data.scientificName,
      canonicalName: data.canonicalName,
      authorship: data.authorship,
      rank: data.rank.toLowerCase(),
      taxonomicStatus: data.taxonomicStatus.toLowerCase(),
      acceptedGbif: data.acceptedKey ? data.acceptedKey.toString() : undefined,
      acceptedCol: col,
      acceptedTaxon: data.accepted,
      ancestors: getAncestors(data),
      children: []
    }
  }

  async function getTaxonFromCol (id) {
    if (typeof id !== 'number' && (typeof id !== 'string' || !id.match(/^[1-9A-Z][0-9A-Z]*$/))) {
      throw new Error(`Invalid CoL id "${id}"`)
    }

    const data = await fetchCol(id)
    const taxonId = data.accepted ? data.accepted.id : id
    const classification = await fetchJson(`https://api.checklistbank.org/dataset/3LXR/taxon/${taxonId}/classification`)

    return {
      source: 'col',
      id: null,
      col: id,
      gbif: null,
      qid: `P10585:${id}`,
      name: data.label,
      canonicalName: data.name.scientificName,
      authorship: data.name.authorship,
      rank: data.name.rank.toLowerCase(),
      taxonomicStatus: data.status.toLowerCase(),
      // acceptedGbif: no
      acceptedCol: data.accepted ? data.accepted.id : undefined,
      acceptedTaxon: data.accepted ? data.accepted.label : undefined,
      ancestors: [ANCESTOR].concat(classification.map(ancestor => ({
        source: 'col',
        col: ancestor.id,
        name: ancestor.authorship ? ancestor.name + ' ' + ancestor.authorship : ancestor.name,
        canonicalName: ancestor.name,
        authorship: ancestor.authorship,
        rank: ancestor.rank
      }))),
      children: []
    }
  }

  function getTaxonBaseFromLoir (id) {
    const data = taxa[id]

    if (!data) {
      throw new Error(`Taxon "${id}" not found`)
    }

    const { name, authorship } = parseTaxonName(data.name)
    const taxon = {
      source: 'loir',
      id: data.id,
      col: data.col,
      gbif: data.gbif,
      qid: data.qid,
      name: data.name,
      canonicalName: name,
      authorship: authorship,
      rank: data.rank,
      // taxonomicStatus: no
      // acceptedGbif: no
      acceptedCol: data.accepted_col || undefined,
      // acceptedTaxon: no
      // ancestors: see below
      // children: see below
    }

    if (data.children_col) {
      taxon.children = data.children_col.split('; ')
    } else {
      taxon.children = []
    }

    return taxon
  }

  async function getTaxonFromLoir (id) {
    const data = taxa[id]
    const taxon = getTaxonBaseFromLoir(id)

    if (data.ancestors_col) {
      const parentId = data.ancestors_col.split('; ').pop()
      const parent = await getTaxonFromCol(parentId)
      taxon.ancestors = parent.ancestors.concat(parent)
      delete parent.ancestors
    } else if (id !== ANCESTOR.id) {
      taxon.ancestors = getAncestors({})
    } else {
      taxon.ancestors = []
    }

    return taxon
  }

  function redirectToTaxon (id, field = 'id') {
    const search = new URLSearchParams(window.location.search)
    for (const param of ['col', 'gbif', 'name', 'id']) {
      if (param === field) {
        search.set(param, id)
      } else if (search.has(param)) {
        search.delete(param)
      }
    }
    window.location.replace(window.location.pathname + '?' + search.toString() + window.location.hash)
  }

  async function getTaxon () {
    const search = new URLSearchParams(window.location.search)

    let taxon

    if (search.has('name')) {
      const name = search.get('name')
      const localTaxon = Object.values(taxa).find(taxon => taxon.name === name)
      if (localTaxon) {
        redirectToTaxon(localTaxon.id)
      }
    } else if (search.has('gbif')) {
      const gbif = search.get('gbif')
      const localTaxon = Object.values(taxa).find(taxon => taxon.gbif === gbif)
      if (localTaxon) {
        redirectToTaxon(localTaxon.id)
      } else {
        taxon = await getTaxonFromGbif(gbif)
        document.getElementById('data-source').innerHTML = LABELS.gbif_license

        if (taxon.col) {
          redirectToTaxon(taxon.col, 'col')
        }
      }
    } else if (search.has('col')) {
      const col = search.get('col')
      const localTaxon = Object.values(taxa).find(taxon => taxon.col === col)
      if (localTaxon) {
        redirectToTaxon(localTaxon.id)
      } else {
        taxon = await getTaxonFromCol(col)
        document.getElementById('data-source').innerHTML = LABELS.col_license
      }
    } else {
      taxon = await getTaxonFromLoir(search.get('id'))
    }

    return taxon
  }

  async function fetchIndexedCatalog () {
    return loadCatalog().then(([headers, ...rows]) => {
      return rows.reduce((index, row) => {
        const entry = row.reduce((entry, value, index) => {
          entry[headers[index]] = value
          return entry
        }, {})
        index[entry.id] = entry
        return index
      }, {})
    })
  }

  function addToIndex (index, key, ...values) {
    if (!index[key]) {
      index[key] = []
    }
    index[key].push(...values)
  }

  async function getTopChildren (parentTaxon) {
    const children = {}
    const colIndexCatalog = {}
    const colChildren = new Set()

    // Create index of works and collect direct children
    for (const id in taxa) {
      const taxon = taxa[id]
      const col = taxon.accepted_col || taxon.col
      const ancestors = taxon.ancestors_col ? taxon.ancestors_col.split('; ') : []

      const parentIndex = ancestors.indexOf(parentTaxon.accepted_col || parentTaxon.col)
      if ((ancestors.length && parentIndex === ancestors.length - 1) || parentTaxon.children.includes(col)) {
        const key = col || taxon.name
        if (!children[key]) {
          children[key] = getTaxonBaseFromLoir(id)
        }
      } else if (parentIndex > -1) {
        colChildren.add(ancestors[parentIndex + 1])
      }

      if (col) {
        ancestors.push(col)
      }

      const works = taxonIndexCatalog[taxon.name] ?? []
      for (const ancestor of ancestors) {
        addToIndex(colIndexCatalog, ancestor, ...works)
      }
    }

    const colChildrenIds = Array.from(colChildren).filter(id => !(id in children))
    for (const data of await Promise.all(colChildrenIds.map(fetchCol))) {
      children[data.id] = {
        source: 'col',
        name: data.label,
        canonicalName: data.name.scientificName,
        rank: data.name.rank,
        col: data.id
      }
    }

    for (const child in children) {
      const taxon = children[child]
      const col = taxon.acceptedCol || taxon.col
      const works = new Set()

      if (taxon.children) {
        for (const descendant of taxon.children) {
          for (const work of colIndexCatalog[descendant] ?? []) {
            works.add(work)
          }
        }
      }

      if (col) {
        for (const work of colIndexCatalog[col]) {
          works.add(work)
        }
      }

      if (taxonIndexCatalog[taxon.name]) {
        for (const work of taxonIndexCatalog[taxon.name]) {
          works.add(work)
        }
      }

      taxon.works = Array.from(works)
    }

    return Object.values(children).sort((a, b) => b.works.length - a.works.length)
  }

  function getResources (taxon) {
    if (taxon.source === 'col') {
      const names = Object.values(taxa).filter(localTaxon => localTaxon.col === taxon.col || localTaxon.accepted_col === taxon.col)
      return names.flatMap(taxon => taxonIndexCatalog[taxon.name] ?? [])
    } else if (taxon.source === 'gbif') {
      const names = Object.values(taxa).filter(localTaxon => localTaxon.gbif === taxon.gbif)
      return names.flatMap(taxon => taxonIndexCatalog[taxon.name] ?? [])
    } else {
      return taxonIndexCatalog[taxon.name] ?? []
    }
  }

  function makeTaxonLink (taxon) {
    if (taxon.source === 'col') {
      return `${URL_PREFIX}/taxonomy/taxon/?col=${taxon.col}`
    } else if (taxon.source === 'gbif') {
      return `${URL_PREFIX}/taxonomy/taxon/?gbif=${taxon.gbif}`
    } else {
      return `${URL_PREFIX}/taxonomy/taxon/?id=${taxon.id}`
    }
  }

  const taxon = await getTaxon()

  document.querySelector('head title').textContent = taxon.name + ' — Library of Identification Resources'
  document.getElementById('mainTitle').append(formatTaxonName(taxon.canonicalName, taxon.authorship, taxon.rank))
  document.getElementById('date').textContent = LABELS.taxon_rank.get(taxon.rank)
  document.getElementById('date').setAttribute('style', 'color: grey;')

  if (taxon.taxonomicStatus) {
    const element = document.getElementById('status')

    if (taxon.source === 'gbif') {
      const a = document.createElement('a')
      a.setAttribute('href', `http://rs.gbif.org/vocabulary/gbif/taxonomicStatus/${taxon.taxonomicStatus.replace(/_(.)/g, (_, l) => l.toUpperCase())}`)
      a.textContent = LABELS.taxon_status.get(taxon.taxonomicStatus.replace(/_/g, ' '))
      element.appendChild(a)
    } else {
      element.append(LABELS.taxon_status.get(taxon.taxonomicStatus.replace(/_/g, ' ')))
    }

    if (taxon.acceptedTaxon) {
      const { name, authorship } = parseTaxonName(taxon.acceptedTaxon)
      const a = document.createElement('a')
      if (taxon.acceptedCol) {
        a.setAttribute('href', `${URL_PREFIX}/taxonomy/taxon/?col=${taxon.acceptedCol}`)
      } else {
        a.setAttribute('href', `${URL_PREFIX}/taxonomy/taxon/?gbif=${taxon.acceptedGbif}`)
      }
      a.append(formatTaxonName(name, authorship, taxon.rank))
      element.append(' ' + LABELS.synonym_of + ' ', a)
    }
  }

  if (taxon.id) {
    const purl = `https://purl.org/identification-resources/taxon/${taxon.id}`
    const permalink = document.createElement('a')
    permalink.setAttribute('href', purl)
    permalink.innerHTML = octicons.persistent_url
    permalink.append(' ' + purl)
    document.getElementById('permalink').append(permalink)
  }

  if (taxon.col) {
    const a = document.createElement('a')
    a.setAttribute('href', `https://www.catalogueoflife.org/data/taxon/${taxon.col}`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend(taxon.col + ' ')
    document.getElementById('col').append(a)
  }

  if (taxon.gbif) {
    const a = document.createElement('a')
    a.setAttribute('href', `https://www.gbif.org/species/${taxon.gbif}`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend(taxon.gbif + ' ')
    document.getElementById('gbif').append(a)
  }

  if (taxon.qid) {
    const a = document.getElementById('wikidata')
    a.setAttribute('href', `https://hub.toolforge.org/${taxon.qid}`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend('Wikidata ')
  }

  if (taxon.qid) {
    const a = document.getElementById('scholia')
    a.setAttribute('href', `https://hub.toolforge.org/${taxon.qid}?site=scholia`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend('Scholia ')
  }

  {
    const element = document.getElementById('classification')

    for (const ancestor of taxon.ancestors) {
      const a = document.createElement('a')
      a.setAttribute('href', makeTaxonLink(ancestor))
      a.append(formatTaxonName(ancestor.canonicalName, '', ancestor.rank))
      element.append(a)

      element.append(' > ')
    }
  }

  const [catalog, colIndex, gbifIndex] = await Promise.all([
    fetchIndexedCatalog(),
    fetchJson('/assets/data/resources/col.index.json'),
    fetchJson('/assets/data/resources/gbif.index.json'),
  ])

  const taxonIndexCatalog = {}
  for (const id in catalog) {
    for (const taxonName of catalog[id].taxon.split('; ')) {
      addToIndex(taxonIndexCatalog, taxonName, id)
    }
  }

  const topChildren = await getTopChildren(taxon)

  // Children
  if (topChildren.length) {
    const table = document.getElementById('children')

    for (const taxon of topChildren) {
      const row = document.createElement('tr')

      const nameCell = document.createElement('td')
      const nameLink = document.createElement('a')
      nameLink.setAttribute('href', makeTaxonLink(taxon))
      nameLink.setAttribute('style', 'white-space: pre;')
      nameLink.append(taxon.canonicalName)
      nameCell.append(nameLink)
      row.append(nameCell)

      const rankCell = document.createElement('td')
      rankCell.textContent = taxon.rank
      row.append(rankCell)

      const countCell = document.createElement('td')
      countCell.textContent = taxon.works.length
      row.appendChild(countCell)

      table.appendChild(row)
    }

    // Pie chart
    const strictChildren = topChildren.filter(child => child.source === 'col' || !taxa[child.id].children_col)
    if (strictChildren.length) {
      const sliceCount = 11

      const chartData = strictChildren.slice(0, sliceCount)

      const color = d3.scaleOrdinal()
        .domain(chartData.map(d => d.canonicalName))
        .range(d3.schemePaired)
        .unknown('#aaaaaa')

      if (topChildren.length > sliceCount) {
        chartData.push({
          canonicalName: 'Other',
          works: topChildren.slice(5).flatMap(taxon => taxon.works).filter((v, i, a) => a.indexOf(v) === i)
        })
      }

      const HEIGHT = 220
      const GAP_SIZE = 50
      const LEGEND_SIZE = 20
      const LEGEND_COLUMN = 60 + 10 * Math.max(...chartData.map(d => d.canonicalName.length))
      const LEGEND_ITEMS = 6

      const pie = d3.pie().value(d => d.works.length).sort(() => 0)
      const arc = d3.arc()
        .innerRadius(HEIGHT / 3)
        .outerRadius(HEIGHT / 2)

      const container = d3.select('#children-graph')

      container.select('svg').remove()

      const svg = container
        .append('svg')
          .attr('width', HEIGHT)
          .attr('height', HEIGHT)
          .attr('font-family', 'sans-serif')

      svg
        .append('g')
        .attr('transform', `translate(${HEIGHT / 2}, ${HEIGHT / 2})`)
        .selectAll()
        .data(pie(chartData))
        .join('a')
          .attr('href', d => d.data.canonicalName === 'Other' ? null : makeTaxonLink(d.data))
        .append('path')
          .attr('d', d => arc(d))
          .attr('fill', d => color(d.data.canonicalName))
        .append('title')
          .text(d => d.data.works.length)

      const legend = svg
        .append('g')
        .attr('font-size', 14)

      const labels = legend
        .selectAll('g')
        .data(chartData)
        .join('a')
          .attr('href', d => d.canonicalName === 'Other' ? null : makeTaxonLink(d))
        .append('g')
          .attr('transform', (_, i) => `translate(${
              LEGEND_COLUMN * Math.floor(i / LEGEND_ITEMS)
          },${
              2 * (i % LEGEND_ITEMS) * LEGEND_SIZE
          })`)

      labels
        .append('rect')
          .attr('width', LEGEND_SIZE)
          .attr('height', LEGEND_SIZE)
          .attr('fill', d => color(d.canonicalName))

      labels
        .append('text')
          .attr('x', LEGEND_SIZE * 1.5)
          .attr('y', LEGEND_SIZE * 0.75)
          .text(d => d.canonicalName)

      const legendBBox = legend.node().getBBox()
      legend.attr('transform', `translate(${HEIGHT + GAP_SIZE},${(HEIGHT - legendBBox.height) / 2})`)
      svg.attr('width', HEIGHT + GAP_SIZE + legendBBox.width)
    } else {
      document.getElementById('children-graph').remove()
      document.getElementById('children').closest('details').open = true
    }
  } else {
    document.getElementById('children').closest('section').remove()
  }

  // References
  const mentions = new Set([...(colIndex[taxon.acceptedCol || taxon.col] || []), ...(gbifIndex[taxon.gbif] || [])])
  if (mentions.size) {
    const ids = Array.from(mentions)
    const keyIds = ids.map(mention => mention.replace(/:\d+$/, ''))
    const keys = (await Promise.all(
      keyIds.filter((v, i, a) => a.indexOf(v) === i).map(id => loadKey(id))
    )).reduce((index, key) => (index[key.metadata.id] = key, index), {})

    const table = document.getElementById('refs')
    for (let i = 0; i < ids.length; i++) {
      const row = document.createElement('tr')

      const mention = ids[i]
      const key = keys[keyIds[i]]
      const taxon = key.taxa[mention]
      const work = catalog[mention.split(':')[0]]

      const { name, authorship } = parseResourceTaxonName(taxon)

      const nameCell = document.createElement('td')
      const nameLink = document.createElement('a')
      nameLink.setAttribute('href', `${URL_PREFIX}/catalog/resource/?id=${key.metadata.id}#${mention}`)
      nameLink.setAttribute('style', 'white-space: pre;')
      nameLink.append(formatTaxonName(name, authorship, taxon.taxonRank))
      nameCell.append(nameLink)
      row.append(nameCell)

      const status = document.createElement('td')
      status.textContent = LABELS.taxon_status.get(taxon.taxonomicStatus)
      row.append(status)

      const resourceCell = document.createElement('td')
      const resourceLink = document.createElement('a')
      resourceLink.setAttribute('href', `${URL_PREFIX}/catalog/resource/?id=${key.metadata.id}`)
      resourceLink.textContent = key.metadata.id
      resourceCell.appendChild(resourceLink)
      row.appendChild(resourceCell)

      const titleCell = document.createElement('td')
      const titleLink = document.createElement('a')
      titleLink.setAttribute('href', `${URL_PREFIX}/catalog/detail/?id=${work.id}`)
      titleLink.textContent = work.title
      titleCell.appendChild(titleLink)
      row.appendChild(titleCell)

      table.appendChild(row)
    }
  } else {
    document.getElementById('refs').closest('section').remove()
  }

  // Resources
  const resources = getResources(taxon)
  if (resources.length) {
    const table = document.getElementById('resources')
    for (const id of resources) {
      const row = document.createElement('tr')

      const work = catalog[id]

      const idCell = document.createElement('td')
      const idLink = document.createElement('a')
      idLink.setAttribute('href', `${URL_PREFIX}/catalog/detail/?id=${id}`)
      idLink.textContent = id
      idCell.append(idLink)
      row.append(idCell)

      const titleCell = document.createElement('td')
      const titleLink = document.createElement('a')
      titleLink.setAttribute('href', `${URL_PREFIX}/catalog/detail/?id=${id}`)
      titleLink.textContent = work.title
      titleCell.append(titleLink)
      row.append(titleCell)

      const regionCell = document.createElement('td')
      regionCell.append(...formatLinkedList(
        work.region,
        region => `${URL_PREFIX}/catalog/place/?name=${region}`
      ))
      row.appendChild(regionCell)

      table.appendChild(row)
    }
  }

  const schemas = document.getElementById('schemas-org')
  const schemasData = {
    '@context': 'https://schema.org',
    '@type': 'TaxonName',
    'http://purl.org/dc/terms/conformsTo': {
      '@type': 'CreativeWork',
      '@id': 'https://bioschemas.org/profiles/TaxonName/1.0-RELEASE'
    },
    name: taxon.name,
    url: location.origin + makeTaxonLink(taxon),
    identifier: []
  }
  if (taxon.id) {
    schemasData.identifier.push({ '@id': `https://purl.org/identification-resources/taxon/${taxon.id}` })
  }
  if (taxon.col) {
    schemasData.identifier.push({ '@id': `https://www.catalogueoflife.org/data/taxon/${taxon.col}` })
  }
  if (taxon.gbif) {
    schemasData.identifier.push({ '@id': `https://www.gbif.org/species/${taxon.gbif}` })
  }
  schemas.textContent = JSON.stringify(schemasData, null, 2)
})().catch(console.error)
