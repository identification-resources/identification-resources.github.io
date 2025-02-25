(async function () {
  const tableRows = document.getElementById('curation_tasks')
  const pagination = document.getElementById('curation_pagination')

  function naturalSort (a, b) {
    a = a.split(/(\d+)/)
    b = b.split(/(\d+)/)

    for (let i = 0; i < a.length && i < b.length; i++) {
      if (a[i] === b[i]) {
        continue
      }

      if (i % 2 === 1) {
        return a[i] - b[i]
      } else {
        return a > b ? 1 : a < b ? -1 : 0
      }
    }

    return a.length > b.length ? 1 : a.length < b.length ? -1 : 0
  }

  const problems = await indexCsv('/assets/data/resources/problems.csv', 'checklist_id')
  const problemRows = Object.keys(problems).sort(naturalSort).map(key => problems[key])

  const params = new URLSearchParams(window.location.search)
  const { searchPage: page, searchLimit: limit } = formatPagination(pagination, params, problemRows)

  const linneanRanks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'subspecies', 'variety', 'form']

  async function openDialog (id) {
    const $a = document.getElementById('curation_resource_link')
    $a.setAttribute('href', `/catalog/resource/?id=${id}`)
    $a.textContent = id

    const $table = document.getElementById('curation_resource_taxa')
    while ($table.firstChild) {
      $table.firstChild.remove()
    }

    const fileId = id.split(':').join('-')
    const taxa = await indexCsv(`/assets/data/resources/dwc/${fileId}.csv`, 'scientificNameID')

    for (const id in taxa) {
      const taxon = taxa[id]
      let name = taxon.scientificName
      if (name.endsWith(' ' + taxon.scientificNameAuthorship)) {
        name = name.slice(0, -taxon.scientificNameAuthorship.length - 1)
      }

      if (taxon.gbifTaxonID) {
        continue
      }

      if (!linneanRanks.includes(taxon.taxonRank)) {
        continue
      }

      if (taxon.taxonomicStatus !== 'accepted') {
        continue
      }

      const $tr = document.createElement('tr')

      {
        const $td = document.createElement('td')
        $td.textContent = id
        $tr.appendChild($td)
      }

      {
        const $td = document.createElement('td')
        $td.append(formatTaxonName(name, taxon.scientificNameAuthorship, taxon.taxonRank))
        $tr.appendChild($td)
      }

      {
        const $td = document.createElement('td')
        $td.textContent = taxon.taxonRank
        $tr.appendChild($td)
      }

      {
        const $td = document.createElement('td')
        const $a = document.createElement('a')
        $a.setAttribute('href', `https://www.gbif.org/species/search?q=${encodeURIComponent(name)}`)
        $a.textContent = 'Search'
        $td.appendChild($a)
        $tr.appendChild($td)
      }

      $table.appendChild($tr)
    }

    if (!$table.firstChild) {
      const $tr = document.createElement('tr')
      const $td = document.createElement('td')
      $td.setAttribute('colspan', '4')
      $td.textContent = 'None'
      $tr.appendChild($td)
      $table.appendChild($tr)
    }

    const $dialog = $table.closest('dialog')
    $dialog.showModal()
  }

  for (const problem of problemRows.slice((page - 1) * limit, page * limit)) {
    const $tr = document.createElement('tr')

    {
      const $td = document.createElement('td')
      const $a = document.createElement('a')
      $a.setAttribute('href', `/catalog/resource/?id=${problem.checklist_id}`)
      $a.textContent = problem.checklist_id
      $td.appendChild($a)
      $tr.appendChild($td)
    }

    {
      const $td = document.createElement('td')
      $td.textContent = problem.problem
      $tr.appendChild($td)
    }

    {
      const $td = document.createElement('td')
      const $a = document.createElement('a')
      $a.setAttribute('href', '#')
      $a.textContent = 'View'
      $a.addEventListener('click', function (event) {
        event.preventDefault()
        openDialog(problem.checklist_id)
      })
      $td.appendChild($a)
      $tr.appendChild($td)
    }

    tableRows.appendChild($tr)
  }
})()
