(async function () {
  const [catalog, taxa] = await Promise.all([
    await loadCatalog(),
    indexCsv('/assets/data/taxa.csv', 'id')
  ])

  function formatColTaxonName (taxon) {
    return formatTaxonName(taxon.scientificName, taxon.scientificNameAuthorship, taxon.taxonRank.toLowerCase())
  }

  function collectWorks () {
    const catalogByTaxon = {}
    const [headers, ...rows] = catalog
    const header = headers.indexOf('taxon')
    for (const row of rows) {
      for (const taxon of row[header].split('; ')) {
        if (!(taxon in catalogByTaxon)) {
          catalogByTaxon[taxon] = new Set()
        }

        catalogByTaxon[taxon].add(row[0])
      }
    }

    const counts = {}

    for (const taxonId in taxa) {
      const taxon = taxa[taxonId]
      const ids = [taxon.col, taxon.accepted_col, taxon.children_col].join('; ').split('; ').filter(Boolean)
      for (const id of ids) {
        if (!(id in counts)) {
          counts[id] = new Set()
        }

        if (catalogByTaxon[taxon.name]) {
          for (const work of catalogByTaxon[taxon.name]) {
            counts[id].add(work)
          }
        }
      }
    }
    window.a = counts

    return counts
  }

  const LINNEAN_RANKS = [
    'KINGDOM',
    'PHYLUM',
    'CLASS',
    'ORDER',
    'FAMILY',
    'GENUS',
    'SPECIES'
  ]

  const search = new URLSearchParams(window.location.search)
  const query = search.get('query') ?? ''
  document.getElementById('catalog_search_query').value = query
  document.getElementById('data-source').innerHTML = LABELS.col_license2

  const { searchPage: page, searchLimit: limit } = getPaginationState(search, 20)

  const apiQuery = new URLSearchParams([
    ['q', query],
    ['limit', limit],
    ['offset', (page - 1) * limit],
    ['searchContent', 'SCIENTIFIC'],
    ['searchContent', 'AUTHORSHIP'],
    ['searchContent', 'VERNACULAR']
  ])

  if (!query) {
    apiQuery.append('sortBy',  'TAXONOMIC')
  }

  const url = `https://api.gbif.org/v2/experimental/taxon/search/7ddf754f-d193-4cc9-b351-99906754a03b?${apiQuery}`
  const { count, results } = await fetch(url).then(response => response.json())

  formatPagination(document.getElementById('catalog_pagination'), page, limit, count)

  const catalogIndex = collectWorks()

  const $tbody = document.getElementById('catalog_data')
  for (const result of results) {

    if (result.acceptedNameUsageID) {
      result.acceptedNameUsage = result.classification.pop()
    }

    const $tr = document.createElement('tr')

    // id
    {
      const $td = document.createElement('td')

      const $a = document.createElement('a')
      $a.setAttribute('class', 'row-link')
      $a.setAttribute('href', `${URL_PREFIX}/taxonomy/taxon?col=${result.taxonID}`)
      $a.textContent = result.taxonID

      $td.appendChild($a)
      $tr.appendChild($td)
    }

    // name
    {
      const $td = document.createElement('td')
      $td.append(formatColTaxonName(result))
      $tr.appendChild($td)
    }

    // rank
    {
      const $td = document.createElement('td')
      const rank = result.taxonRank.toLowerCase()
      $td.textContent = LABELS.taxon_rank[rank] || rank
      $tr.appendChild($td)
    }

    // status
    {
      const $td = document.createElement('td')

      $td.append(LABELS.taxon_status.get(result.taxonomicStatus.toLowerCase().replace(/_/g, ' ')))

      if (result.acceptedNameUsage) {
        $td.append(' ' + LABELS.synonym_of + ' ', formatColTaxonName(result.acceptedNameUsage))
      }

      $tr.appendChild($td)
    }

    // classification
    {
      const $td = document.createElement('td')

      const ancestors = result.classification.filter(taxon => LINNEAN_RANKS.includes(taxon.taxonRank))

      for (const ancestor of ancestors) {
        if (ancestor !== ancestors[0]) {
          $td.append(' > ')
        }

        const $span = document.createElement('span')
        $span.setAttribute('style', 'color: #484b3e;')
        $span.append(formatColTaxonName({ ...ancestor, scientificNameAuthorship: undefined }))

        $td.append($span)
      }

      $tr.appendChild($td)
    }

    // works
    {
      const $td = document.createElement('td')
      $td.setAttribute('style', 'text-align: end;')
      const id = result.acceptedNameUsageID || result.taxonID
      $td.textContent = catalogIndex[id] ? catalogIndex[id].size : ''
      $tr.appendChild($td)
    }

    $tbody.appendChild($tr)
  }

  document.getElementById('catalog_results').textContent = LABELS.functions.search_result_count(results.length, count)
})()