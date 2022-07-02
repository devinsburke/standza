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
		this.statuses = {
			'success': 'success',
			'failure': 'failure',
			'inprocess': 'inprocess',
			'neutral': 'neutral'
		}
		this.dataKey = dataKey

		this.elements = jor(container, el => [
			el('gantt').children(
				el('svg').refer('svg')
			)
		], {container})
	}

	redraw(data) {
		data = data[this.dataKey]
		const timeRange = [new Date(data[0].start.getTime() - 30 * 60 * 1000), new Date(data[data.length-1].end.getTime() + 30 * 60 * 1000)]

		const svg = d3.select(this.elements.svg)
		
		const xMargin = 50
		const yMargin = 20
		
		const width = 600
		const height = 150
		const xScale = d3.scaleTime().domain(timeRange).range([xMargin, width])
		const xAxis = d3.axisBottom().scale(xScale).ticks(d3.timeHour)
		svg.append('g')
			.attr('transform', `translate(0,${height - yMargin})`)
			.transition().call(xAxis)
		
		const yScale = d3.scaleBand().domain(['Standing','Absent','Sitting']).range([0, height - yMargin])
		const yAxis = d3.axisLeft().scale(yScale).tickSize(0)
		svg.append('g')
			.attr('transform', `translate(${xMargin},0)`)
			.transition().call(yAxis)

		svg.selectAll('x').data(data).enter()
			.append('g')
			.attr('transform', d => `translate(${xScale(d.start)},${yScale(d.assumedState)})`)
			.append('rect')
			.attr('class', d => d.assumedState)
			.attr('height', yScale.bandwidth())
			.attr('width', d => xScale(d.end) - xScale(d.start))
	}
}

class Bar 
{
	constructor(domContainer, [name, valueKey, errorKey])
	{
		this.Element = domContainer
		this.Name = name
		this.ValueKey = valueKey
		this.ErrorKey = errorKey
		this.Values = {}
		
		var nameElement = document.createElement('span');
		nameElement.textContent = this.Name;
		this.Element.appendChild(nameElement);
		var containerElement = document.createElement('bar');
		containerElement.id = this.Element.id + '-bar';
		this.Element.appendChild(containerElement);
		this.#createBar();
	}
	
	redraw(visualizationData) {
		return // TODO: Fix.
		this.Values = visualizationData[this.ValueKey];
		this.ErrorValue = visualizationData[this.ErrorKey];
	
		var bar = this.Element.querySelectorAll('bar')[0];
		var svg = bar.querySelectorAll('svg')[0];
		svg.remove();
		this.#createBar();

		var s = this.Element.querySelectorAll('svg')[0];
		if (this.Values)
			s.classList.remove('hidden');
	}
	
	#createBar() {
		return // TODO: Fix.
		var bar = this.Element.querySelectorAll('bar')[0];
		var height = bar.offsetHeight - 50;
		var width = bar.offsetWidth;
		var margin = {top: 10, right: 10, bottom: 40, left: 30};
		
		var svg = d3.select('#' + this.Element.id + '-bar')
			.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
		var x = d3.scaleBand()
			.range([ 0, width ])
			.domain(Object.values(this.Values).map(y => {return Object.keys(y)[0]}))
			.padding(0.2);
		
		svg.append("g")
			.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))
				.selectAll("text")
			.attr("transform", "translate(-10,0)rotate(-45)")
				.style("text-anchor", "end")
				.style("fill", "white");
				
		var max = Object.values(this.Values).map(y => {return Object.values(y)[0]}).sort((a,b)=>a-b).reverse()[0];
		var thresholdValue = this.ErrorValue ?? max + 1;
		
		var y = d3.scaleLinear()
			.domain([0, max])
			.range([ height, 0]);
		svg.append("g")
			.call(d3.axisLeft(y));
					
		var parsedValues = [];
		for (var v in this.Values) {
			var output = {};
			output['time'] = Object.keys(this.Values[v])[0];
			output['value'] = Object.values(this.Values[v])[0];
			if (output['value'] > thresholdValue)
				output['color'] = vizError;
			else 
				output['color'] = vizPalette[0];
			parsedValues.push(output);
		};
							
		svg.selectAll("x")
			.data(parsedValues)
			.enter()
			.append("rect")
				.attr("x", function(d) { return x(d['time']); })
				.attr("y", function(d) { return y(d['value']); })
				.attr("width", x.bandwidth())
				.attr("height", function(d) { return height - y(d['value']); })
				.attr("fill", function(d) { return d['color']; });

		this.Element.classList.add(vizRenderClass);
		var s = this.Element.querySelectorAll('svg')[0];
		if (Object.entries(this.Values).length == 0)
			s.classList.add('hidden');
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
