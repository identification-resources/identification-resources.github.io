async function main () {
    const [headers, ...rows] = await loadCatalog()
    const id = headers.indexOf('id')
    const all = {}

    for (const row of rows) {
        const data = all[row[id]] = {}
        for (const [index, value] of Object.entries(row)) {
            data[headers[index]] = value
        }
        data.year = data.date ? parseInt(data.date.split('-')[0]) : null
        data.decade = data.year ? data.year - 1 - ((data.year - 1) % 10) : null

        data.access = data.license && !data.license.endsWith('?>')
            ? 'Open license'
            : data.fulltext_url || (data.archive_url && (!data.url || !data.archive_url.endsWith(data.url) || data.url === data.fulltext_url))
                ? 'Full text available, no license'
                : 'No full text available'
    }

    // DECADES
    {
        const decadeCounts = Array.from(d3.rollup(
            d3.sort(Object.values(all), d => d.year),
            v => v.length,
            d => d.decade
        )).filter(([decade, count]) => decade !== null)

        const HEIGHT = 420
        const AXIS_SIZE = 20
        const BAR_SIZE = 60

        const x = d3.scaleLinear()
            .domain([0, d3.max(decadeCounts, ([_, count]) => count)])
            .range([0, HEIGHT])

        const y = d3.scaleBand()
            .domain(d3.sort(decadeCounts.map(([decade, _]) => decade)))
            .range([0, BAR_SIZE * decadeCounts.length])

        const svg = d3
            .select('#by_year .table')
            .append('svg')
                .attr('width', BAR_SIZE * decadeCounts.length)
                .attr('height', HEIGHT + AXIS_SIZE)
                .attr('font-family', 'sans-serif')

        svg
            .selectAll('a')
            .data(decadeCounts)
            .join('a')
                .attr('href', ([decade, _]) => `/catalog/?field=date&query=${decade.toString().slice(0, 3)}`)
                .attr('transform', ([decade, _]) => `translate(${y(decade)},0)`)
            .append('rect')
                .attr('fill', '#989d89')
                .attr('y', ([_, count]) => HEIGHT - x(count))
                .attr('width', y.bandwidth() - 1)
                .attr('height', ([_, count]) => x(count))
                .exit()

        svg
            .append('g')
                .attr('transform', `translate(0,${HEIGHT})`)
                .call(d3.axisBottom(y))
                .attr('font-size', 14)
    }

    // ACCESS
    {
        const accessCounts = Array.from(d3.rollup(
            Object.values(all),
            v => v.length,
            d => d.access
        ))

        const HEIGHT = 420
        const GAP_SIZE = 50
        const LEGEND_SIZE = 20

        const accessLevels = [
            'Open license',
            'Full text available, no license',
            'No full text available'
        ]

        const color = d3.scaleOrdinal()
              .domain(accessLevels)
              .range(["#000000", "#c4202a", "#989d89"])

        const pie = d3.pie().value(([_, count]) => count)
        const arc = d3.arc()
            .innerRadius(HEIGHT / 3)
            .outerRadius(HEIGHT / 2)

        const svg = d3
            .select('#by_access .table')
            .append('svg')
                .attr('width', HEIGHT)
                .attr('height', HEIGHT)
                .attr('font-family', 'sans-serif')

        svg
            .append('g')
            .attr('transform', `translate(${HEIGHT / 2}, ${HEIGHT / 2})`)
            .selectAll('path')
            .data(pie(accessCounts))
            .join('path')
                .attr('d', d => arc(d))
                .attr('fill', d => color(d.data[0]))

        const legend = svg
            .append('g')
            .attr('font-size', 14)

        const labels = legend
            .selectAll('g')
            .data(accessLevels)
            .join('g')
            .attr('transform', (_, i) => `translate(0,${2 * i * LEGEND_SIZE})`)

        labels
            .append('rect')
            .attr('width', LEGEND_SIZE)
            .attr('height', LEGEND_SIZE)
            .attr('fill', d => color(d))

        labels
            .append('text')
            .attr('x', LEGEND_SIZE * 1.5)
            .attr('y', LEGEND_SIZE * 0.75)
            .text(d => d)

        const legendBBox = legend.node().getBBox()
        legend.attr('transform', `translate(${HEIGHT + GAP_SIZE},${(HEIGHT - legendBBox.height) / 2})`)
        svg.attr('width', HEIGHT + GAP_SIZE + legendBBox.width)
    }

    // IDENNTIFIER
    {
        const queries = { ISBN: 9, DOI: '10.', QID: 'Q' }
        const identifiers = ['ISBN', 'DOI', 'QID']
        const data = identifiers.map(key => [key, d3.sum(Object.values(all).map(d => !!d[key]))])
        console.log(data)

        const WIDTH = 420
        const BAR_SIZE = 60
        const GAP_SIZE = 50
        const HEIGHT = BAR_SIZE * identifiers.length

        const svg = d3
            .select('#by_identifier .table')
            .append('svg')
                .attr('height', HEIGHT)
                .attr('font-family', 'sans-serif')

        const x = d3.scaleLinear().domain([0, Object.values(all).length]).range([0, WIDTH])
        const y = d3.scaleBand().domain(identifiers).range([0, BAR_SIZE * identifiers.length])
        const color = d3.scaleOrdinal()
              .domain(identifiers)
              .range(["#000000", "#c4202a", "#989d89"])

        const a = svg
            .selectAll('a')
            .data(data)
            .join('a')
                .attr('href', ([key, _]) => `/catalog/?field=${key}&query=${queries[key]}`)
                .attr('transform', ([key, _]) => `translate(0,${y(key)})`)

        a.append('rect')
            .attr('fill', ([key, _]) => color(key))
            .attr('height', y.bandwidth() - 1)
            .attr('width', ([_, count]) => x(count))
            .exit()

        a.append('line')
            .attr('stroke', '#989d89')
            .attr('x1', ([_, count]) => x(count))
            .attr('x2', WIDTH)
            .attr('y1', BAR_SIZE / 2)
            .attr('y2', BAR_SIZE / 2)
            .exit()

        const legend = a.append('text')
            .attr('x', WIDTH + GAP_SIZE)
            .attr('y', BAR_SIZE / 2)
            .text(([key, _]) => fieldLabels[key])

        svg.append('g').call(d3.axisLeft(y))

        const legendWidth = d3.max(legend.nodes().map(node => node.getBBox().width))
        svg.attr('width', WIDTH + GAP_SIZE + legendWidth)
    }

    // BY COLUMN
    {
        const _select = document.querySelector('#by_column select')
        const options = ['language', 'license', 'key_type', 'entry_type', 'target_taxa', 'complete']
        for (const key of options) {
            const _option = document.createElement('option')
            _option.setAttribute('value', key)
            _option.textContent = fieldLabels[key]
            _select.appendChild(_option)
        }
        _select.addEventListener('change', displayPieChart)
        displayPieChart()
    }

    function displayPieChart () {
        const key = document.querySelector('#by_column select').value
        const parse = {
            language: d => d.split('-')[0],
            // license: d => d.endsWith('?>') ? 'unclear' : d,
        }

        const data = Array.from(d3.rollup(
            Object.values(all).reduce((v, d) => v.concat(d[key].split('; ')), []),
            v => v.length,
            parse[key] || (d => d)
        ))

        const HEIGHT = 420
        const GAP_SIZE = 50
        const LEGEND_SIZE = 20
        const LEGEND_COLUMN = 60 + 10 * Math.max(...data.map(d => d[0].length))
        const LEGEND_ITEMS = 10

        console.log(LEGEND_COLUMN)

        const levels = d3
            .sort(data, ([_, a], [__, b]) => d3.descending(a, b))
            .map(([level, _]) => level)

        const color = d3.scaleOrdinal()
              .domain(levels)
              .range(d3.schemePaired)

        const pie = d3.pie().value(([_, count]) => count)
        const arc = d3.arc()
            .innerRadius(HEIGHT / 3)
            .outerRadius(HEIGHT / 2)

        const container = d3
            .select('#by_column .table')

        container.select('svg').remove()

        const svg = container
            .append('svg')
                .attr('width', HEIGHT)
                .attr('height', HEIGHT)
                .attr('font-family', 'sans-serif')

        svg
            .append('g')
            .attr('transform', `translate(${HEIGHT / 2}, ${HEIGHT / 2})`)
            .selectAll('a')
            .data(pie(data))
            .join('a')
                .attr('href', d => `/catalog/?field=${key}&query=${d.data[0]}`)
            .append('path')
                .attr('d', d => arc(d))
                .attr('fill', d => color(d.data[0]))

        const legend = svg
            .append('g')
            .attr('font-size', 14)

        const labels = legend
            .selectAll('g')
            .data(levels)
            .join('a')
            .attr('href', d => `/catalog/?field=${key}&query=${d}`)
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
            .attr('fill', d => color(d))

        labels
            .append('text')
            .attr('x', LEGEND_SIZE * 1.5)
            .attr('y', LEGEND_SIZE * 0.75)
            .text(d => d)

        const legendBBox = legend.node().getBBox()
        legend.attr('transform', `translate(${HEIGHT + GAP_SIZE},${(HEIGHT - legendBBox.height) / 2})`)
        svg.attr('width', HEIGHT + GAP_SIZE + legendBBox.width)
    }
}

main().catch(console.error)
