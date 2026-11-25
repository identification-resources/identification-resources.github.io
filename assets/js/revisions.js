(async function () {
  const search = new URLSearchParams(window.location.search)
  const type = search.get('type')
  const id = search.get('id')

  document.getElementById('title').textContent = id

  const events = []

  const revisions = await fetch(`/assets/data/revisions/${type}.json`).then(response => response.json())
  if (revisions.entities[id]) {
    events.push(...revisions.entities[id].map(revision => {
      revision.commit = revisions.commits.find(commit => commit.hash === revision.commit)
      revision.timestamp = revision.commit.timestamp
      return revision
    }))
  }

  if (type === 'catalog') {
    const [header, ...rows] = await loadCsv('/assets/data/revisions/credits.csv')
    const credits = rows.map(row => {
      const entry = row.reduce((entry, value, index) => {
        entry[header[index]] = value
        return entry
      }, {})

      entry.timestamp = `${entry.date}T${entry.time}`
      entry.type = 'credit'

      return entry
    })

    events.push(...credits.filter(entry => entry.id === id))
  }

  events.sort((a, b) => a.timestamp > b.timestamp ? 1 : a.timestamp < b.timestamp ? -1 : 0)

  let oldFields = {}

  const $table = document.getElementById('revisions')
  for (const event of events) {
    const $tr = document.createElement('tr')
    const date = (new Date(event.timestamp).toLocaleString(PAGE_LANG))

    if (event.type === 'credit') {
      {
        const $td = document.createElement('td')
        $td.innerHTML = octicons.contribution
        $tr.appendChild($td)
      }

      {
        const $td = document.createElement('td')

        const $contributor = document.createElement('b')
        $contributor.textContent = event.contributor

        $td.append($contributor, ` ${LABELS.contribution_suggestion} ${LABELS.contribution_at} ${date}.`)
        $tr.appendChild($td)
      }
    } else {
      {
        const $td = document.createElement('td')
        const icons = {
          '+': octicons.addition,
          '~': octicons.modification,
          '-': octicons.deletion
        }
        $td.innerHTML = icons[event.type]
        $tr.appendChild($td)
      }

      {
        const $td = document.createElement('td')

        const $contributor = document.createElement('b')
        $contributor.textContent = event.commit.author
        const labels = {
          '+': LABELS.contribution_addition,
          '~': LABELS.contribution_modification,
          '-': LABELS.contribution_deletion
        }

        $td.append($contributor, ` ${labels[event.type]} ${LABELS.contribution_at} ${date}:`)

        const $diff = document.createElement('table')
        for (const field of revisions.fields) {
          if (!(field in event.fields)) {
            continue
          }

          const $fieldDiff = document.createElement('tr')
          const $field = document.createElement('th')
          $field.textContent = type === 'catalog' ? fieldLabels[field] : field

          // TODO array diffs
          const $valueDiff = document.createElement('td')
          if (field in event.fields) {
            if (field in oldFields) {
              const $del = document.createElement('del')
              $del.textContent = [].concat(oldFields[field]).join('; ')
              $valueDiff.append($del, ' ')

              if (!event.fields[field]) {
                delete oldFields[field]
              }
            }

            const $ins = document.createElement('ins')
            $ins.textContent = [].concat(event.fields[field]).join('; ')
            $valueDiff.append($ins)

            oldFields[field] = event.fields[field]
          }

          $fieldDiff.append($field, $valueDiff)
          $diff.appendChild($fieldDiff)
        }
        $td.appendChild($diff)

        const $footer = document.createElement('div')
        $footer.setAttribute('style', 'color: #666; font-size: 0.8em;')
        const $commit = document.createElement('a')
        $commit.setAttribute('href', `https://github.com/identification-resources/catalog/commit/${event.commit.hash}`)
        $commit.textContent = event.commit.hash.slice(0, 7)
        $footer.append(LABELS.contribution_commit, ' ', $commit, `: ${event.commit.message}`)

        $td.appendChild($footer)

        $tr.appendChild($td)
      }
    }

    $table.prepend($tr)
  }
})().catch(console.error)
