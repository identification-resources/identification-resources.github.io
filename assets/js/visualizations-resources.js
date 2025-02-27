async function main () {
    const keys = await loadKeys()
    const gbifIndex = await fetch('/assets/data/resources/gbif.index.json').then(response => response.json())
    const colIndex = await fetch('/assets/data/resources/col.index.json').then(response => response.json())

    function reverseIndex (index) {
        const reverse = {}
        for (const key in index) {
            for (const value of index[key]) {
                if (value in reverse) {
                    reverse[value].push(key)
                } else {
                    reverse[value] = [key]
                }
            }
        }
        return reverse
    }

    // COUNTS
    {
        const BASE = 2

        const taxonCounts = Array.from(d3.rollup(
            d3.sort(Object.values(keys), d => d.taxonCount),
            v => v.length,
            d => Math.round(Math.log(d.taxonCount) / Math.log(BASE))
        ))
        console.log(taxonCounts)

        const HEIGHT = 420
        const AXIS_SIZE = 20
        const BAR_SIZE = 55
        const TICKS = [1, 3, 10, 30, 100, 300, 1000, 3000]

        const x = d3.scaleLinear()
            .domain([0, d3.max(taxonCounts, ([_, count]) => count)])
            .range([0, HEIGHT])

        const y = d3.scaleBand()
            .domain(d3.sort(taxonCounts.map(([bin, _]) => bin)))
            .range([0, BAR_SIZE * taxonCounts.length])

        const yLinear = d3.scaleLinear()
            .domain([0, Math.max(...taxonCounts.map(([bin, _]) => bin))])
            .range([0, BAR_SIZE * taxonCounts.length])

        const svg = d3
            .select('#by_count .table')
            .append('svg')
                .attr('width', BAR_SIZE * taxonCounts.length)
                .attr('height', HEIGHT + AXIS_SIZE)
                .attr('font-family', 'sans-serif')

        svg
            .selectAll('g')
            .data(taxonCounts)
            .join('g')
                .attr('transform', ([bin, _]) => `translate(${y(bin)},0)`)
            .append('rect')
                .attr('fill', '#989d89')
                .attr('y', ([_, count]) => HEIGHT - x(count))
                .attr('width', y.bandwidth() - 1)
                .attr('height', ([_, count]) => x(count))
            .append('title')
                .text(([_, count]) => count)

        svg
            .append('g')
                .attr('transform', `translate(0,${HEIGHT})`)
                .call(d3.axisBottom(yLinear)
                    .tickValues(TICKS.map(d => Math.log(d) / Math.log(BASE)))
                    .tickFormat(d => Math.round(Math.pow(BASE, d)))
                )
                .attr('font-size', 14)
    }

    // IDENTIFIER
    {
        const total = Object.values(keys).reduce((sum, key) => sum + key.taxonCount, 0)
        const data = [
            ['GBIF', Object.keys(reverseIndex(gbifIndex)).length],
            ['Catalogue of Life', Object.keys(reverseIndex(colIndex)).length],
        ]
        const identifiers = data.map(([key, _]) => key)

        const WIDTH = 420
        const BAR_SIZE = 60
        const GAP_SIZE = 50
        const HEIGHT = BAR_SIZE * identifiers.length

        const TO_PERCENTAGE = count => (100 * count / total).toFixed(1) + '%'

        const svg = d3
            .select('#by_identifier .table')
            .append('svg')
                .attr('height', HEIGHT)
                .attr('font-family', 'sans-serif')

        const x = d3.scaleLinear().domain([0, total]).range([0, WIDTH])
        const y = d3.scaleBand().domain(identifiers).range([0, BAR_SIZE * identifiers.length])
        const color = d3.scaleOrdinal()
              .domain(identifiers)
              .range(['#989d89', '#000000', '#c4202a'])

        const g = svg
            .selectAll('g')
            .data(data)
            .join('g')
                .attr('transform', ([key, _]) => `translate(0,${y(key)})`)

        g.append('rect')
            .attr('fill', ([key, _]) => color(key))
            .attr('height', y.bandwidth() - 1)
            .attr('width', ([_, count]) => x(count))
            .append('title')
                .text(([_, count]) => TO_PERCENTAGE(count))

        g.append('line')
            .attr('stroke', '#989d89')
            .attr('x1', ([_, count]) => x(count))
            .attr('x2', WIDTH)
            .attr('y1', BAR_SIZE / 2)
            .attr('y2', BAR_SIZE / 2)

        const legend = g.append('text')
            .attr('x', WIDTH + GAP_SIZE)
            .attr('y', BAR_SIZE / 2)
            .text(([key, count]) => `${key} (${TO_PERCENTAGE(count)})`)

        svg.append('g').call(d3.axisLeft(y))

        const legendWidth = d3.max(legend.nodes().map(node => node.getBBox().width))
        svg.attr('width', WIDTH + GAP_SIZE + legendWidth)
    }
}

main().catch(console.error)
