(async function () {
  const search = new URLSearchParams(window.location.search)
  const gbif = search.get('gbif')

  const [gbifData, gbifIndex] = await Promise.all([
    `https://api.gbif.org/v1/species/${gbif}`,
    '/assets/data/resources/gbif.index.json'
  ].map(url => fetch(url).then(response => response.json())))

  document.querySelector('head title').textContent = gbifData.scientificName + ' — Library of Identification Resources'
  document.getElementById('mainTitle').append(formatTaxonName(gbifData.canonicalName, gbifData.authorship, gbifData.rank.toLowerCase()))
  document.getElementById('date').textContent = gbifData.rank.toLowerCase()
  document.getElementById('date').setAttribute('style', 'color: grey;')

  const gbifRanks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'subspecies', 'variety']

  {
    const element = document.getElementById('status')
    const a = document.createElement('a')
    a.setAttribute('href', `http://rs.gbif.org/vocabulary/gbif/taxonomicStatus/${gbifData.taxonomicStatus.toLowerCase().replace(/_(.)/g, (_, l) => l.toUpperCase())}`)
    a.textContent = gbifData.taxonomicStatus.toLowerCase().replace(/_/g, ' ')
    element.appendChild(a)
    if (gbifData.accepted) {
      const [name, author] = gbifData.accepted.split(/ (?=\S+ \S+$)/)
      const a = document.createElement('a')
      a.setAttribute('href', `/taxonomy/taxon/?gbif=${gbifData.acceptedKey}`)
      a.append(formatTaxonName(name, author, gbifData.rank.toLowerCase()))
      element.append(' of ', a)
    }
  }

  {
    const a = document.createElement('a')
    a.setAttribute('href', `https://www.gbif.org/species/${gbif}`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend(gbif + ' ')
    document.getElementById('gbif').append(a)
  }

  {
    const a = document.getElementById('wikidata')
    a.setAttribute('href', `https://hub.toolforge.org/P846:${gbif}`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend('Wikidata ')
  }

  {
    const a = document.getElementById('scholia')
    a.setAttribute('href', `https://hub.toolforge.org/P846:${gbif}?site=scholia`)
    a.setAttribute('target', '_blank')
    a.innerHTML = octicons.external_url
    a.prepend('Scholia ')
  }

  {
    const element = document.getElementById('classification')
    for (const rank of gbifRanks) {
      if (rank === gbifData.rank.toLowerCase()) {
        break
      }

      if (rank !== gbifRanks[0]) {
        element.append(' > ')
      }

      const a = document.createElement('a')
      a.setAttribute('href', `/taxonomy/taxon/?gbif=${gbifData[rank + 'Key']}`)
      a.append(formatTaxonName(gbifData[rank], '', rank))
      element.append(a)
    }
  }

  // References
  if (gbifIndex[gbifData.acceptedKey || gbif]) {
    const [headers, ...rest] = await loadCatalog()
    const catalog = rest.reduce((index, row) => {
      const entry = row.reduce((entry, v, i) => (entry[headers[i]] = v, entry), {})
      index[entry.id] = entry
      return index
    }, {})

    const mentions = gbifIndex[gbifData.acceptedKey || gbif]
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
  }

  const schemas = document.getElementById('schemas-org')
  schemas.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TaxonName',
    'http://purl.org/dc/terms/conformsTo': {
      '@type': 'CreativeWork',
      '@id': 'https://bioschemas.org/profiles/TaxonName/1.0-RELEASE'
    },
    name: gbifData.scientificName,
    url: `${location.origin}/taxonomy/taxon/?gbif=${gbif}`,
    identifier: gbif,
    sameAs: `https://www.gbif.org/species/${gbif}`
  }, null, 2)
})().catch(console.error)
