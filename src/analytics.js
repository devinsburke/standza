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
	constructor(domContainer, [name, unit, valueKeys])
	{
		this.Name = name
		this.Unit = unit
		this.ValueKeys = valueKeys
		this.Element = domContainer
		
		this.LabelElement = document.createElement('span')
		this.DonutElement = document.createElement('donut')
		this.DonutElement.appendChild(this.LabelElement)
		this.Element.appendChild(this.DonutElement)
		d3.select(this.DonutElement).append('svg').append('g')
	}
	
	redraw(data) {
		const [current, total] = this.ValueKeys.map(k => data[k])
		const size = Math.min(
			this.DonutElement.offsetHeight,
			this.DonutElement.offsetWidth
		)

		d3.select(this.DonutElement)
			.select('svg')
				.attr('width', size)
				.attr('height', size)
			.select('g')
			.selectAll('path')
			.data(d3.pie()([current, total - current]))
			.join('path')
				.attr('d', d3.arc().innerRadius(size/4).outerRadius(size/2))
				.attr('fill', (_, i) => vizPalette[i])

		this.Element.setAttribute('data-name', this.Name)
		this.LabelElement.setAttribute('data-current', formatters.toUnit(current, this.Unit).toFixed(2))
		this.LabelElement.setAttribute('data-total', formatters.toUnit(total, this.Unit).toFixed(2))
		this.LabelElement.setAttribute('data-unit', this.Unit)
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
	#vizClasses = {BAN, Donut, Bar, State, Clock}

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
