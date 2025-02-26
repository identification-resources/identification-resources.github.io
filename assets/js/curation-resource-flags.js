(async function () {
  const tableRows = document.getElementById('curation_tasks')
  const pagination = document.getElementById('curation_pagination')

  const keys = await loadKeys()
  const problems = []

  for (const id in keys) {
    if (keys[id].flags) {
      problems.push(keys[id])
    }
  }

  const params = new URLSearchParams(window.location.search)
  const { searchPage: page, searchLimit: limit } = formatPagination(pagination, params, problems)

  for (const problem of problems.slice((page - 1) * limit, page * limit)) {
    const $tr = document.createElement('tr')

    {
      const $td = document.createElement('td')
      const $a = document.createElement('a')
      $a.setAttribute('href', `/catalog/resource/?id=${problem.id}`)
      $a.textContent = problem.id
      $td.appendChild($a)
      $tr.appendChild($td)
    }

    {
      const $td = document.createElement('td')

      for (const flag of problem.flags) {
        const $p = document.createElement('p')
        $p.textContent = flagLabels[flag]
        const $span = document.createElement('span')
        $span.textContent = `(${flag})`
        $span.setAttribute('style', 'color: grey;')
        $p.append('. ', $span)
        $td.append($p)
      }

      $tr.appendChild($td)
    }

    tableRows.appendChild($tr)
  }
})()
