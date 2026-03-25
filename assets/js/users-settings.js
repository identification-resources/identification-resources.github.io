(async function () {
    const db = loadSettings()

    function promisify (request) {
        return new Promise(function (resolve, reject) {
            request.onsuccess = resolve
            request.onerror = reject
        })
    }

    async function fetchJson (...args) {
        return fetch(...args).then(response => response.json())
    }

    function clear ($element) {
        while ($element.firstChild) {
            $element.removeChild($element.firstChild)
        }
    }

    function mapInventaireItem (item) {
        if (item.entity.startsWith('isbn:')) {
            const isbn = item.entity.slice(5)
            const record = catalog.find(record => record.ISBN.split('; ').includes(isbn))
            return record ? record.id : null
        } else if (item.entity.startsWith('wd:')) {
            const qid = item.entity.slice(3)
            const record = catalog.find(record => record.QID === qid)
            return record ? record.id : null
        } else {
            return null
        }
    }

    async function showInventaireShelves (username) {
        const response = await fetchJson(`https://inventaire.io/api/users?action=by-usernames&usernames=${username}`)
        const id = response.users[username]._id
        const { shelves } = await fetchJson(`https://inventaire.io/api/shelves?action=by-owners&owners=${id}`)

        const $table = document.querySelector('#inventaire_shelves tbody')
        clear($table)
        for (const key in shelves) {
            inventaireShelves[key] = shelves[key].name

            const $tr = document.createElement('tr')

            {
                const $td = document.createElement('td')
                $td.textContent = shelves[key].name
                $tr.appendChild($td)
            }
            {
                const $td = document.createElement('td')
                const $button = document.createElement('button')
                $button.textContent = LABELS.button_add
                $button.setAttribute('value', key)
                $td.appendChild($button)
                $tr.appendChild($td)
            }

            $table.appendChild($tr)
        }
    }

    async function addInventaireShelfContents (shelf) {
        const libraryId = 'inventaire'
        const itemIds = await fetchJson(`https://inventaire.io/api/items?action=inventory-view&shelf=${shelf}`)
        const { items } = await fetchJson(`https://inventaire.io/api/items?action=by-ids&ids=${itemIds.itemsByDate.join('|')}`)

        const store = (await db).transaction(['libraries'], 'readwrite').objectStore('libraries')

        for (const item of items) {
            const record = await promisify(store.get([libraryId, item._id])).then(request => request.target.result)

            const data = {
                libraryId,
                library: {
                    url: `https://inventaire.io/shelves/${shelf}`,
                    label: inventaireShelves[shelf],
                    data: { shelf }
                },
                itemId: item._id,
                item: {
                    url: `https://inventaire.io/items/${item._id}`,
                    label: item.entity,
                    data: item,
                },
                catalogId: record?.catalogId ?? mapInventaireItem(item),
                comment: record?.comment ?? item.detail
            }
            await promisify(store.put(data))
        }
    }

    function showResource (record) {
        const $tr = document.createElement('tr')
        $tr.dataset.library = record.libraryId
        $tr.dataset.item = record.itemId

        {
            const $td = document.createElement('td')
            if (record.catalogId) {
                const $a = document.createElement('a')
                $a.setAttribute('href', `${URL_PREFIX}/catalog/detail/?id=${record.catalogId}`)
                $a.textContent = record.catalogId
                $td.appendChild($a)
            }

            const $button = document.createElement('button')
            $button.textContent = LABELS.button_edit
            $button.addEventListener('click', function () {
                document.querySelector('#mapping_link [name="library_id"]').value = record.libraryId
                document.querySelector('#mapping_link [name="item_id"]').value = record.itemId
                document.getElementById('mapping').showModal()
            })
            $td.appendChild($button)

            $tr.appendChild($td)
        }
        {
            const $td = document.createElement('td')
            if (record.libraryId === 'inventaire' && (record.item.data.snapshot['entity:image'] ?? false)) {
                const $img = document.createElement('img')
                $img.setAttribute('src', 'https://inventaire.io' + record.item.data.snapshot['entity:image'])
                $img.setAttribute('height', 64)
                $img.setAttribute('alt', 'Cover')
                $td.appendChild($img)
            }
            $tr.appendChild($td)
        }
        {
            const $td = document.createElement('td')

            if (record.catalogId) {
                $td.textContent = catalogIndex[record.catalogId].title
            } else {
                const $div = document.createElement('div')
                $div.classList.add('alert')
                $div.textContent = LABELS.functions.unknown_holding(record.item.data.snapshot['entity:title'])
                $td.appendChild($div)
            }

            $tr.appendChild($td)
        }
        {
            const $td = document.createElement('td')

            if (record.item.url) {
                const $a = document.createElement('a')
                $a.setAttribute('href', record.item.url)
                $a.textContent = record.item.label
                $td.appendChild($a)
            } else {
                $td.textContent = record.item.label
            }

            $tr.appendChild($td)
        }
        {
            const $td = document.createElement('td')
            if (record.library.url) {
                const $a = document.createElement('a')
                $a.setAttribute('href', record.library.url)
                $a.textContent = record.library.label
                $td.appendChild($a)
            } else {
                $td.textContent = record.library.label
            }
            $tr.appendChild($td)
        }
        {
            const $td = document.createElement('td')
            $td.textContent = record.comment ?? ''
            $tr.appendChild($td)
        }
        {
            const $td = document.createElement('td')
            const $button = document.createElement('button')
            $button.textContent = LABELS.button_remove
            $button.addEventListener('click', async function () {
                const store = (await db).transaction(['libraries'], 'readwrite').objectStore('libraries')
                await promisify(store.delete([record.libraryId, record.itemId])).then(function () {
                    $tr.remove()
                }).catch(function (error) {
                    console.error(error)
                })
            })
            $td.appendChild($button)
            $tr.appendChild($td)
        }

        return $tr
    }

    async function showResources () {
        const $resources = document.getElementById('resources')
        while ($resources.firstChild) {
            $resources.firstChild.remove()
        }

        const store = (await db).transaction(['libraries'], 'readonly').objectStore('libraries')
        const records = await promisify(store.getAll()).then(request => request.target.result)
        records.sort((a, b) => a.catalogId ? b.catalogId ? a.catalogId.slice(1) - b.catalogId.slice(1) : -1 : 1)

        for (const record of records) {
            const $tr = showResource(record)
            $resources.appendChild($tr)
        }
    }

    document.getElementById('inventaire_add').addEventListener('click', function () {
        document.getElementById('inventaire').showModal()
    })

    document.getElementById('inventaire_search').addEventListener('submit', async function (event) {
        event.preventDefault()
        const username = document.getElementById('inventaire_search_user').value
        if (username !== '') {
            const store = (await db).transaction(['settings'], 'readwrite').objectStore('settings')
            await promisify(store.put({ key: 'inventaire_username', value: username }))
            showInventaireShelves(username)
        }
    })

    document.getElementById('inventaire_shelves').addEventListener('submit', function (event) {
        event.preventDefault()
        const shelf = event.submitter.value
        addInventaireShelfContents(shelf).then(function () {
            document.getElementById('mapping').close()
            showResources()
        })
    })

    document.getElementById('mapping_link').addEventListener('submit', async function (event) {
        event.preventDefault()
        const store = (await db).transaction(['libraries'], 'readwrite').objectStore('libraries')

        const libraryId = event.target.library_id.value
        const itemId = event.target.item_id.value

        const record = await promisify(store.get([libraryId, itemId])).then(request => request.target.result)
        record.catalogId = event.target.catalog_id.value

        await promisify(store.put(record)).then(function () {
            const $tr = showResource(record)
            document.querySelector(`[data-library="${libraryId}"][data-item="${itemId}"]`).replaceWith($tr)
            document.getElementById('mapping').close()
        }).catch(function (error) {
            console.error(error)
        })
    })

    const catalog = await loadCatalog().then(([header, ...rows]) => rows.map(row => row.reduce((data, value, i) => (data[header[i]] = value, data), {})))
    const catalogIndex = catalog.reduce((index, record) => (index[record.id] = record, index), {})
    const inventaireShelves = {}

    await showResources()
})()
