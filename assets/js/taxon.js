(async function () {
  const taxa = await indexCsv('/assets/data/taxa.csv', 'name')

  async function fetchJson (url) {
    const response = await fetch(url)

    if (response.status >= 400) {
      throw new Error(await response.text().then(text => text.slice(0, 100)))
    }

    return response.json()
  }

  async function fetchTaxon (id) {
    if (typeof id !== 'number' && (typeof id !== 'string' || !id.match(/^[1-9]\d*$/))) {
      throw new Error(`Invalid GBIF id "${id}"`)
    }

    return fetchJson(`https://api.gbif.org/v1/species/${id}`)
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

  function getAncestors (data) {
    const ancestors = [{ name: 'Biota' }]

    for (const rank in gbifRanks) {
      if (gbifRanks[rank] && data[rank]) {
        ancestors.push({
          gbif: data[rank + 'Key'],
          name: data[rank],
          rank
        })
      }

      if (data.rank && rank === data.rank.toLowerCase()) {
        break
      }
    }

    return ancestors
  }

  async function getTaxonFromGbif (id) {
    const data = await fetchTaxon(id)

    return {
      source: 'gbif',
      gbif: data.key.toString(),
      qid: `P846:${data.key}`,
      name: data.scientificName,
      canonicalName: data.canonicalName,
      authorship: data.authorship,
      rank: data.rank.toLowerCase(),
      taxonomicStatus: data.taxonomicStatus.toLowerCase(),
      acceptedGbif: data.acceptedKey ? data.acceptedKey.toString() : undefined,
      acceptedTaxon: data.accepted,
      ancestors: getAncestors(data),
      children: []
    }
  }

  function parseTaxonName (taxon) {
    const [name, citation] = taxon.match(/^([A-Z]\S*(?: [a-z]\S*){0,2})(?: (.+))?$/).slice(1)
    return { name, citation }
  }

  async function getTaxonFromLoir (taxonName) {
    const data = taxa[taxonName]

    if (!data) {
      throw new Error(`Taxon "${taxonName}" not found`)
    }

    const parsedName = parseTaxonName(taxonName)
    const taxon = {
      source: 'loir',
      gbif: data.gbif,
      qid: data.qid,
      name: taxonName,
      canonicalName: parsedName.name,
      authorship: parsedName.citation,
      rank: data.rank
      // taxonomicStatus: no
      // acceptedGbif: no
      // acceptedTaxon: no
      // ancestors: see below
      // children: see below
    }

    if (data.gbif) {
      const gbifData = await fetchTaxon(data.gbif)
      taxon.ancestors = getAncestors(gbifData)
    } else if (data.ancestors_gbif) {
      const parent = data.ancestors_gbif.split('; ').pop()
      const gbifData = await fetchTaxon(parent)
      taxon.ancestors = getAncestors(gbifData)
    } else {
      taxon.ancestors = getAncestors({})
    }

    if (data.children_gbif) {
      taxon.children = data.children_gbif.split('; ')
    } else {
      taxon.children = []
    }

    return taxon
  }

  async function getTaxon () {
    const search = new URLSearchParams(window.location.search)
    let taxon

    if (search.has('gbif')) {
      taxon = await getTaxonFromGbif(search.get('gbif'))
      document.getElementById('data-source').innerHTML = `
        Above data from the <a href="https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c">GBIF Backbone Taxonomy</a>,
        licensed under <a href="http://creativecommons.org/licenses/by/4.0/legalcode">CC BY 4.0</a>.`
    } else {
      taxon = await getTaxonFromLoir(search.get('name'))
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
    const gbifIndexCatalog = {}
    const gbifChildren = new Set()

    for (const taxonName in taxa) {
      const taxon = taxa[taxonName]
      const ancestors = taxon.ancestors_gbif ? taxon.ancestors_gbif.split('; ') : []

      const parentIndex = ancestors.indexOf(parentTaxon.gbif)
      if ((ancestors.length && parentIndex === ancestors.length - 1) || parentTaxon.children.includes(taxon.gbif)) {
        const key = taxon.gbif ?? taxonName
        if (!children[key]) {
          children[key] = taxon
        }
      } else if (parentIndex > -1) {
        gbifChildren.add(ancestors[parentIndex + 1])
      }

      if (taxon.gbif) {
        ancestors.push(taxon.gbif)
      }

      for (const ancestor of ancestors) {
        const works = taxonIndexCatalog[taxonName] ?? []
        addToIndex(gbifIndexCatalog, ancestor, ...works)
      }
    }

    for (const data of await Promise.all(Array.from(gbifChildren).map(fetchTaxon))) {
      children[data.key] = {
        name: data.scientificName,
        rank: data.rank.toLowerCase(),
        gbif: data.key
      }
    }

    for (const child in children) {
      const taxon = children[child]
      taxon.works = []

      if (taxon.children_gbif) {
        for (const descendant of taxon.children_gbif.split('; ')) {
          for (const work of gbifIndexCatalog[descendant] ?? []) {
            if (!taxon.works.includes(work)) {
              taxon.works.push(work)
            }
          }
        }
      }

      if (taxon.gbif) {
        for (const work of gbifIndexCatalog[taxon.gbif]) {
          if (!taxon.works.includes(work)) {
            taxon.works.push(work)
          }
        }
      }
    }

    return Object.values(children).sort((a, b) => b.works.length - a.works.length)
  }

  function getResources (taxon) {
    if (taxon.source === 'gbif') {
      const names = Object.values(taxa).filter(localTaxon => localTaxon.gbif === taxon.gbif)
      return names.flatMap(taxon => taxonIndexCatalog[taxon.name] ?? [])
    } else {
      return taxonIndexCatalog[taxon.name] ?? []
    }
  }

  function makeTaxonLink (taxon) {
    if (taxon.gbif && !taxon.children_gbif) {
      return `/taxonomy/taxon/?gbif=${taxon.gbif}`
    } else {
      return `/taxonomy/taxon/?name=${taxon.name}`
    }
  }

  const taxon = await getTaxon()

  document.querySelector('head title').textContent = taxon.name + ' — Library of Identification Resources'
  document.getElementById('mainTitle').append(formatTaxonName(taxon.canonicalName, taxon.authorship, taxon.rank))
  document.getElementById('date').textContent = taxon.rank
  document.getElementById('date').setAttribute('style', 'color: grey;')

  if (taxon.taxonomicStatus) {
    const element = document.getElementById('status')
    const a = document.createElement('a')
    a.setAttribute('href', `http://rs.gbif.org/vocabulary/gbif/taxonomicStatus/${taxon.taxonomicStatus.replace(/_(.)/g, (_, l) => l.toUpperCase())}`)
    a.textContent = taxon.taxonomicStatus.replace(/_/g, ' ')
    element.appendChild(a)
    if (taxon.acceptedTaxon) {
      const [name, authorship] = parseTaxonName(taxon.acceptedTaxon)
      const a = document.createElement('a')
      a.setAttribute('href', `/taxonomy/taxon/?gbif=${taxon.gbifAccepted}`)
      a.append(formatTaxonName(name, authorship, taxon.rank))
      element.append(' of ', a)
    }
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
      if (ancestor !== taxon.ancestors[0]) {
        element.append(' > ')
      }

      const a = document.createElement('a')
      a.setAttribute('href', makeTaxonLink(ancestor))
      a.append(formatTaxonName(ancestor.name, '', ancestor.rank))
      element.append(a)
    }
  }

  const [catalog, gbifIndex] = await Promise.all([
    fetchIndexedCatalog(),
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
      nameLink.append(taxon.name)
      nameCell.append(nameLink)
      row.append(nameCell)

      const countCell = document.createElement('td')
      countCell.textContent = taxon.works.length
      row.appendChild(countCell)

      table.appendChild(row)
    }

    // Pie chart
    {
      const sliceCount = 11

      const chartData = topChildren/*.filter(child => gbifRanks[child.rank])*/.slice(0, sliceCount)

      const color = d3.scaleOrdinal()
        .domain(chartData.map(d => d.name))
        .range(d3.schemePaired)
        .unknown('#aaaaaa')

      if (topChildren.length > sliceCount) {
        chartData.push({
          name: 'Other',
          works: topChildren.slice(5).flatMap(taxon => taxon.works).filter((v, i, a) => a.indexOf(v) === i)
        })
      }

      const HEIGHT = 220
      const GAP_SIZE = 50
      const LEGEND_SIZE = 20
      const LEGEND_COLUMN = 60 + 10 * Math.max(...chartData.map(d => d.name.length))
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
          .attr('href', d => d.data.name === 'Other' ? null : makeTaxonLink(d.data))
        .append('path')
          .attr('d', d => arc(d))
          .attr('fill', d => color(d.data.name))
        .append('title')
          .text(d => d.data.works.length)

      const legend = svg
        .append('g')
        .attr('font-size', 14)

      const labels = legend
        .selectAll('g')
        .data(chartData)
        .join('a')
          .attr('href', d => d.name === 'Other' ? null : makeTaxonLink(d))
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
          .attr('fill', d => color(d.name))

      labels
        .append('text')
          .attr('x', LEGEND_SIZE * 1.5)
          .attr('y', LEGEND_SIZE * 0.75)
          .text(d => d.name)

      const legendBBox = legend.node().getBBox()
      legend.attr('transform', `translate(${HEIGHT + GAP_SIZE},${(HEIGHT - legendBBox.height) / 2})`)
      svg.attr('width', HEIGHT + GAP_SIZE + legendBBox.width)
    }
  } else {
    document.getElementById('children').closest('section').remove()
  }

  // References
  if (gbifIndex[taxon.acceptedGbif ?? taxon.gbif]) {
    const mentions = gbifIndex[taxon.acceptedGbif ?? taxon.gbif]
    const keyIds = mentions.map(mention => mention.replace(/:\d+$/, ''))
    const keys = (await Promise.all(
      keyIds.filter((v, i, a) => a.indexOf(v) === i).map(id => loadKey(id))
    )).reduce((index, key) => (index[key.metadata.id] = key, index), {})

    const table = document.getElementById('refs')
    for (let i = 0; i < mentions.length; i++) {
      const row = document.createElement('tr')

      const mention = mentions[i]
      const key = keys[keyIds[i]]
      const taxon = key.taxa[mention]
      const work = catalog[mention.split(':')[0]]

      const authorship = taxon.data[2]
      const name = authorship ? taxon.data[1].slice(0, -(1 + authorship.length)) : taxon.data[1]

      const nameCell = document.createElement('td')
      const nameLink = document.createElement('a')
      nameLink.setAttribute('href', `/catalog/resource/?id=${key.metadata.id}#${mention}`)
      nameLink.setAttribute('style', 'white-space: pre;')
      nameLink.append(formatTaxonName(name, authorship, taxon.data[7]))
      nameCell.append(nameLink)
      row.append(nameCell)

      const status = document.createElement('td')
      status.textContent = taxon.data[10]
      row.append(status)

      const resourceCell = document.createElement('td')
      const resourceLink = document.createElement('a')
      resourceLink.setAttribute('href', `/catalog/resource/?id=${key.metadata.id}`)
      resourceLink.textContent = key.metadata.id
      resourceCell.appendChild(resourceLink)
      row.appendChild(resourceCell)

      const titleCell = document.createElement('td')
      const titleLink = document.createElement('a')
      titleLink.setAttribute('href', `/catalog/detail/?id=${work.id}`)
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
      idLink.setAttribute('href', `/catalog/detail/?id=${id}`)
      idLink.textContent = id
      idCell.append(idLink)
      row.append(idCell)

      const titleCell = document.createElement('td')
      const titleLink = document.createElement('a')
      titleLink.setAttribute('href', `/catalog/detail/?id=${id}`)
      titleLink.textContent = work.title
      titleCell.append(titleLink)
      row.append(titleCell)

      const regionCell = document.createElement('td')
      regionCell.append(...formatLinkedList(
        work.region,
        region => `/catalog/place/?name=${region}`
      ))
      row.appendChild(regionCell)

      table.appendChild(row)
    }
  }

  const schemas = document.getElementById('schemas-org')
  schemas.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TaxonName',
    'http://purl.org/dc/terms/conformsTo': {
      '@type': 'CreativeWork',
      '@id': 'https://bioschemas.org/profiles/TaxonName/1.0-RELEASE'
    },
    name: taxon.name,
    url: location.origin + makeTaxonLink(taxon),
    identifier: taxon.gbif,
    sameAs: taxon.gbif ? `https://www.gbif.org/species/${taxon.gbif}` : undefined
  }, null, 2)
})().catch(console.error)
