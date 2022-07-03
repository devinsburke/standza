const vizRenderClass = 'rendered'
const vizError = 'hsl(0deg 91% 63%)'
const vizPalette = [
	'var(--accent-dark)',
	'transparent',
	'hsl(216deg 63% 85%)', 
	'hsl(216deg 83% 47%)',
	'hsl(216deg 7% 46%)'
]

const formatters = {
	toHM: (ms) => new Date(ms).toISOString().substring(11, 16),
	toHMS: (ms) => new Date(ms).toISOString().substring(11, 19),
	toLocalHMTT: (ms) => new Date(ms).toLocaleTimeString('en-us', {hour: '2-digit', minute: '2-digit'}),
	toUnit: (ms, unit) => unit == 'Hours' ? ms / 360000 : ms / 60000
}

class BAN
{
	constructor(domContainer, {name, valueKey, formatter}) 
	{
		this.Name = name
		this.ValueKey = valueKey
		this.Element = domContainer
		this.formatFn = formatters[formatter]
	}
	
	redraw(data) {
		this.Element.setAttribute('data-name', this.Name)
		this.Element.setAttribute('data-value', this.formatFn(data[this.ValueKey]))
	}
}

class Donut 
{
	constructor(container, [name, unit, valueKeys])
	{
		this.Name = name
		this.Unit = unit
		this.ValueKeys = valueKeys
		this.elements = jor(container, el => [
			el('donut').children(
				el('svg').attr('viewBox', '0 0 1 0.5').children(
					el('text').class('actual').refer('actual'),
					el('text').class('unit').refer('unit'),
					el('text').class('target-label').text('of'),
					el('text').class('target').refer('target'),
					el('circle'),
					el('circle')
				)
			)
		], {container})
	}
	
	redraw(data) {
		const [current, total] = this.ValueKeys.map(k => data[k])
		const style = this.elements.container.style
		this.elements.actual.textContent = formatters.toHM(current)//.toFixed(2)
		this.elements.target.textContent = 'target: ' + formatters.toHM(total)//.toFixed(2)
		this.elements.unit.textContent = ''//this.Unit.toLowerCase()
		style.setProperty('--data-name', "'" + this.Name + "'")
		style.setProperty('--data-current-int', current)
		style.setProperty('--data-total-int', total)
	}
}

class Gantt {
	constructor(container, {tasks, dataKey}) {
		this.tasks = tasks
		this.dataKey = dataKey

		this.elements = jor(container, el => [
			el('svg').attr('viewBox', '0 0 600 150').refer('svg')
		], {container})

		this.xScale = d3.scaleTime()
		this.yScale = d3.scaleBand().domain(['Standing','Absent','Sitting'])
		this.xAxis = d3.axisBottom().scale(this.xScale).ticks(d3.timeHour)		
		this.yAxis = d3.axisLeft().scale(this.yScale).tickSize(0)

		const svg = d3.select(this.elements.svg)
		svg.append('g').attr('class', 'xaxis')
		svg.append('g').attr('class', 'yaxis')
		svg.append('g').attr('class', 'data')
	}

	redraw(data) {
		const svg = d3.select(this.elements.svg)
		const activity = data[this.dataKey]
		
		const xMargin = 50
		const yMargin = 20
		const width = 600
		const height = 150

		const startTime = Math.min(activity[0].start, data['schedule.day.start'])
		const endTime = Math.max(activity[activity.length-1].end, data['schedule.day.end'])

		this.xScale.domain([startTime, endTime + 1000 * 60 * 30])
		this.xScale.range([xMargin, width])
		svg.select('.xaxis')
			.attr('transform', `translate(0,${height - yMargin})`)
			.transition().call(this.xAxis)
		
		this.yScale.range([0, height - yMargin])
		svg.select('.yaxis')
			.attr('transform', `translate(${xMargin},0)`)
			.transition().call(this.yAxis)
 
		svg.select('.data').selectAll('rect').remove()
		svg.select('.data').selectAll('rect').data(activity).enter()
			.append('rect')
			.attr('transform', d => `translate(${this.xScale(d.start)},${this.yScale(d.state)})`)
			.attr('class', d => d.state)
			.attr('height', this.yScale.bandwidth())
			.attr('width', d => this.xScale(d.end) - this.xScale(d.start))
	}
}

class State 
{
	constructor(domContainer, {valueKey, compareToKey, subtitleKey, formatter})
	{
		this.Element = domContainer
		this.valueKey = valueKey
		this.compareToKey = compareToKey
		this.subtitleKey = subtitleKey
		this.formatFn = formatters[formatter]
	}
	
	redraw(data) {
		this.Element.classList.toggle('mismatch', data[this.valueKey] != data[this.compareToKey])
		this.Element.setAttribute('data-value', data[this.valueKey])
		this.Element.setAttribute('data-subtitle', this.formatFn(data[this.subtitleKey]))
	}
}

class Clock
{
	constructor(domContainer, {valueKey, formatter}) {
		this.Element = domContainer
		this.valueKey = valueKey
		this.formatFn = formatters[formatter]
	}
	
	redraw(data) {
		this.Element.setAttribute('data-time', this.formatFn(data[this.valueKey]))
	}
}

class VisualizationManager
{
	#vizClasses = {BAN, Donut, Gantt, State, Clock}

	constructor(container, vizConfig) 
	{
		this.visualizations = []
		for (const group in vizConfig) {
			const div = document.createElement('div')
			div.classList.add(group)
			container.appendChild(div)

			for (const v of vizConfig[group]) {
				const el = document.createElement('viz')
				el.classList.add(v.Type.toLowerCase())
				div.appendChild(el)
				this.visualizations.push(new this.#vizClasses[v.Type](el, v.Params))
			}
		}
	}

	setData(data) {
		this.visualizations.forEach(v => v.redraw(data))
	}
}
