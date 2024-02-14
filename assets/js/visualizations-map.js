async function getPlaces (places) {
    const values = Object.values(places)
        .filter(place => place.qid)
        .map(place => `(wd:${place.qid} "${place.name}")`)
        .join(' ')

    const query = `SELECT ?name ?id WHERE {
    VALUES (?qid ?name) { ${values} }
    ?qid wdt:P7471 ?id .
}`
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (response.status >= 400) {
        throw new Error(`Fetching iNaturalist IDs for places: ${response.status}`)
    }
    const data = await response.json()

    return data.results.bindings
}

function makePopup (place) {
    return `<a href="/catalog/place/?name=${place.name}">${place.display_name
 || place.name}</a><br>
${place.count} resource${place.count > 1 ? 's' : ''}`
}

async function getShapes (places) {
    const values = Object.keys(places).join(',')
    const url = `https://api.inaturalist.org/v1/places/${values}`
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (response.status >= 400) {
        throw new Error(`Fetching iNaturalist data for places: ${response.status}`)
    }
    const data = await response.json()
    return data.results
}

async function main () {
    var map = L.map('map')
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
    map.setView([20, 0], 2)

    const [headers, ...rows] = await loadCatalog()
    const places = await indexCsv('/assets/data/places.csv', 'name')
    const placeColumn = headers.indexOf('region')

    for (const row of rows) {
        for (const place of row[placeColumn].split('; ')) {
            if (!places[place]) {
                continue
            }
            if (!places[place].count) {
                places[place].count = 0
            }
            places[place].count++
        }
    }

    const inatMap = {}
    for (const { name, id } of await getPlaces(places)) {
        places[name.value].inatid = id.value
        inatMap[id.value] = places[name.value]
    }

    let maxCount = -Infinity

    for (const { id, ancestor_place_ids, geometry_geojson } of await getShapes(inatMap)) {
        inatMap[id].geojson = geometry_geojson
        inatMap[id].totalCount = inatMap[id].count

        if (Array.isArray(ancestor_place_ids)) {
            for (const parentId of ancestor_place_ids) {
                if (parentId === id) {
                    continue
                } else if (parentId in inatMap) {
                    inatMap[id].totalCount += inatMap[parentId].count
                }
            }
        }
        maxCount = Math.max(maxCount, inatMap[id].totalCount)
    }

    // Visualizations
    const colorScale = d3.scaleLinear([0, maxCount], [d3.interpolateRgb('#f2efe9', '#c4202a')(0.1), '#c4202a'])

    const rest = document.getElementById('rest')
    const layer = L.geoJSON(undefined, {
        style: function (feature) {
            return {
                fillOpacity: 1,
                fillColor: colorScale(feature.properties.totalCount),
                color: '#000000',
                weight: 1
            }
        }
    }).addTo(map)

    for (const name in places) {
        const place = places[name]
        const popup = makePopup(place)

        if (place.geojson) {
            layer.addData({
                type: 'Feature',
                properties: { name, count: place.count, totalCount: place.totalCount, popup },
                geometry: place.geojson
            })
        } else {
            const li = document.createElement('li')
            li.innerHTML = popup
            rest.append(li)
        }
    }

    // Popups
    map.on('click', function (e) {
        const features = leafletPip.pointInLayer(e.latlng, layer).reverse()
        if (features.length) {
            const popup = features.map(({ feature }) => feature.properties.popup).join('<hr>')
            map.openPopup(popup, e.latlng)
        }
    })

    // Legend
    {
        const BIN_WIDTH = 50
        const BIN_HEIGHT = 20
        const BIN_SIZE = 50

        const n = Math.ceil(maxCount / BIN_SIZE)
        const bins = Array(n).fill().map((_, i) => [i, Math.min(i * BIN_SIZE, maxCount)])

        const svg = d3
            .select('#legend')
            .append('svg')
                .attr('width', BIN_WIDTH * n + 2)
                .attr('height', BIN_HEIGHT * 2 + 1)
                .attr('viewBox', `0 0 ${BIN_WIDTH * n + 2} ${BIN_HEIGHT * 2 + 1}`)
                .attr('style', 'max-width: 100%')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 14)

        const bin = d3.scaleLinear([0, n], [1, BIN_WIDTH * n])
        const g = svg
            .selectAll('g')
            .data(bins)
            .join('g')
                .attr('transform', ([i, _]) => `translate(${bin(i)},1)`)

        g.append('rect')
            .attr('fill', ([_, count]) => colorScale(count))
            .attr('stroke', '#000000')
            .attr('stroke-width', 2)
            .attr('height', BIN_HEIGHT)
            .attr('width', BIN_WIDTH)
            .exit()

        g.append('rect')
            .attr('transform', `translate(-1,${BIN_HEIGHT})`)
            .attr('fill', '#000000')
            .attr('height', 5)
            .attr('width', 2)

        g.append('text')
            .attr('transform', `translate(5,${BIN_HEIGHT + 5})`)
            .attr('alignment-baseline', 'hanging')
            .text(([_, count]) => count)
    }
}

main().catch(console.error)
