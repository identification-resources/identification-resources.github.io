const continents = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']

function getContinent (place) {
    const [continent] = place.split(', ')
    return continents.includes(continent) ? continent : null
}

function getPlaceCategory (entry) {
    let all = null
    for (const place of entry.region.split('; ')) {
        const [continent] = place.split(', ')
        if (!continents.includes(continent)) { return 'Other' }
        if (all !== null && all !== continent) { return 'Other' }
        all = continent
    }
    return all
}

function getTaxonCategory (entry, taxa) {
    const commonAncestors = entry.taxon
        .split('; ')
        .map(taxon => taxa[taxon])
        .map(taxon => (taxon.ancestors_gbif ? taxon.ancestors_gbif.split('; ') : []).concat(taxon.gbif ? taxon.gbif : []))
        .reduce((a, b) => {
            let i = 0
            while (true) {
                if (!a[i] || !b[i] || a[i] !== b[i]) {
                    return i > 0 ? a.slice(0, i) : []
                }
                i++
            }
        })

    if (commonAncestors.includes('212')) {
        return 'Aves'
    } else if (commonAncestors.includes('131')) {
        return 'Amphibia'
    } else if (commonAncestors.includes('358')) {
        return 'Reptilia'
    } else if (commonAncestors.includes('359')) {
        return 'Mammalia'
    } else if (commonAncestors.includes('44')) {
        return 'Other Chordata'
    } else if (commonAncestors.includes('52')) {
        return 'Mollusca'
    } else if (commonAncestors.includes('216')) {
        return 'Insecta'
    } else if (commonAncestors.includes('54')) {
        return 'Other Arthropods'
    } else if (commonAncestors.includes('1')) {
        return 'Other Animals'
    } else if (commonAncestors.includes('6')) {
        return 'Plantae'
    } else if (commonAncestors.includes('5')) {
        return 'Fungi'
    } else {
        return 'Other'
    }
}

async function main () {
    const catalog = await loadCatalog().then(([headers, ...rows]) => rows.reduce((index, row) => {
        const entry = row.reduce((object, value, index) => {
            object[headers[index]] = value
            return object
        }, {})
        index[entry.id] = entry
        return index
    }, {}))
    const taxa = await indexCsv('/assets/data/taxa.csv', 'name')

    const breakdown = {}
    const taxonCategoryTotals = {}
    const placeCategoryTotals = {}
    let total = 0

    for (const id in catalog) {
        const entry = catalog[id]
        const taxonCategory = getTaxonCategory(entry, taxa)
        const placeCategory = getPlaceCategory(entry)

        if (!breakdown[taxonCategory]) { breakdown[taxonCategory] = {} }
        if (!breakdown[taxonCategory][placeCategory]) { breakdown[taxonCategory][placeCategory] = 0 }
        breakdown[taxonCategory][placeCategory]++

        if (!taxonCategoryTotals[taxonCategory]) { taxonCategoryTotals[taxonCategory] = 0 }
        taxonCategoryTotals[taxonCategory]++

        if (!placeCategoryTotals[placeCategory]) { placeCategoryTotals[placeCategory] = 0 }
        placeCategoryTotals[placeCategory]++

        total++
    }

    const taxonCategories = Object.keys(taxonCategoryTotals).sort((a, b) => taxonCategoryTotals[b] - taxonCategoryTotals[a])
    const placeCategories = Object.keys(placeCategoryTotals).sort((a, b) => placeCategoryTotals[b] - placeCategoryTotals[a])

    const $header = document.querySelector('#table thead tr')
    const $table = document.querySelector('#table tbody')

    for (const taxonCategory of taxonCategories) {
        const $tr = document.createElement('tr')

        {
            const $th = document.createElement('th')
            $th.textContent = taxonCategory
            $tr.appendChild($th)
        }

        for (const placeCategory of placeCategories) {
            const $td = document.createElement('td')
            $td.textContent = breakdown[taxonCategory][placeCategory] ?? 0
            $tr.appendChild($td)
        }

        {
            const $td = document.createElement('td')
            $td.textContent = taxonCategoryTotals[taxonCategory]
            $tr.appendChild($td)
        }

        $table.appendChild($tr)
    }

    const $placeTotals = document.createElement('tr')
    $table.appendChild($placeTotals)
    {
        const $th = document.createElement('th')
        $th.textContent = 'Total'
        $placeTotals.append($th)
    }

    for (const placeCategory of placeCategories) {
        const $th = document.createElement('th')
        $th.textContent = placeCategory
        $header.append($th)

        const $td = document.createElement('td')
        $td.textContent = placeCategoryTotals[placeCategory]
        $placeTotals.append($td)
    }

    {
        const $td = document.createElement('td')
        $td.textContent = total
        $placeTotals.append($td)
    }

    {
        const $th = document.createElement('th')
        $th.textContent = 'Total'
        $header.append($th)
    }
}

main().catch(console.error)
