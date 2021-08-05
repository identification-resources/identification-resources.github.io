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

    // LANGUAGES
    {
        const data = Array.from(d3.rollup(
            Object.values(all).reduce((v, d) => v.concat(d.language.split('; ')), []),
            v => v.length,
            d => d.split('-')[0]
        ))

        const HEIGHT = 420
        const GAP_SIZE = 50
        const LEGEND_SIZE = 20
        const LEGEND_ITEMS = 10

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

        const svg = d3
            .select('#by_language .table')
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
                .attr('href', d => `/catalog/?field=language&query=${d.data[0]}`)
            .append('path')
                .attr('d', d => arc(d))
                .attr('fill', d => color(d.data[0]))

        const legend = svg
            .append('g')
            .attr('font-size', 14)

        const labels = legend
            .selectAll('g')
            .data(levels)
            .join('g')
            .attr('transform', (_, i) => `translate(${
                4 * LEGEND_SIZE * Math.floor(i / LEGEND_ITEMS)
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
