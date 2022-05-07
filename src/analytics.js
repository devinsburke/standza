const vizRenderClass = 'rendered';
const vizPalette = [
	'hsl(216deg 49% 45%)', 
	'hsl(216deg 63% 85%)', 
	'hsl(216deg 83% 47%)',
	'hsl(216deg 7% 46%)'
];
const vizError = 'hsl(0deg 91% 63%)';

class BAN 
{
	#value;
	#name;
	#element;
	#valueKey;
	
	constructor(domContainer, name, valueKey, values) 
	{		
		Object.defineProperties(this, {
			Element: {
				get: function() {
					return this.#element;
				}
			},
			Name: {
				get: function() {
					return this.#name;
				},
				set: function(value) {
					this.#name = value;
				}
			},
			Value: {
				get: function() {
					return this.#value;
				},
				set: function(value) {
					this.#value = value ?? 0;
				}
			},
			ValueKey: {
				get: function() {
					return this.#valueKey;
				},
				set: function(value) {
					this.#valueKey = value;
				}
			}
		});
		
		this.#element = domContainer;
		this.#name = name;
		this.#valueKey = valueKey;
		this.#value = values[valueKey];
		
		this.#draw();
	}
	
	redraw(visualizationData) {
		this.Value = visualizationData[this.ValueKey];
		var valueElement = this.Element.querySelectorAll('h3')[0];
		valueElement.textContent = this.Value;
	}
	
	#draw() {
		var valueElement = document.createElement('h3');
		valueElement.textContent = this.Value ?? 0;
		this.Element.appendChild(valueElement);
		var nameElement = document.createElement('span');
		nameElement.textContent = this.Name;
		this.Element.appendChild(nameElement);
		this.Element.classList.add(vizRenderClass);
	}
}

class Donut 
{
	#values = {};
	#name;
	#element;
	#valueKeys;
	
	constructor(domContainer, name, valueKeys, values)
	{
		Object.defineProperties(this, {
			Element: {
				get: function() {
					return this.#element;
				}
			},
			Name: {
				get: function() {
					return this.#name;
				},
				set: function(value) {
					this.#name = value;
				}
			},
			Values: {
				get: function() {
					return this.#values;
				},
				set: function(value) {
					this.#values = value ?? {};
				}
			},
			ValueKeys: {
				get: function() {
					return this.#valueKeys;
				},
				set: function(value) {
					this.#valueKeys = value;
				}
			}
		});
		
		this.#element = domContainer;
		this.#name = name;
		this.#valueKeys = valueKeys ?? [];
		this.#valueKeys.forEach(k => {
			this.#values[k] = values[k];
		});
		
		this.#draw();
	}
	
	redraw(visualizationData) {
		this.ValueKeys.forEach(k => {
			this.Values[k] = visualizationData[k];
		});
		var donut = this.Element.querySelectorAll('donut')[0];
		var svg = donut.querySelectorAll('svg')[0];
		svg.remove();
		this.#createDonut(donut);
	}
	
	#draw() {
		var nameElement = document.createElement('span');
		nameElement.textContent = this.Name;
		this.Element.appendChild(nameElement);
		var containerElement = document.createElement('donut');
		containerElement.id = this.Element.id + '-donut';
		this.Element.appendChild(containerElement);
		this.#createDonut(containerElement);		
		this.Element.classList.add(vizRenderClass);
	}
	
	#createDonut(containerElement) {
		var donut = this.Element.querySelectorAll('donut')[0];
		var height = donut.offsetHeight;
		var width = height;	
		var color = d3.scaleOrdinal()
			.domain(this.Values)
			.range(Object.entries(this.Values).map((x, y) => {return vizPalette[y]}));
		var pie = d3.pie().value(function(d) { return d.value; });
		
		d3.select('#' + this.Element.id + '-donut')
			.append("svg")
				.attr("width", width)
				.attr("height", height)
			.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")").selectAll('x')
			.data(pie(d3.entries(this.Values)))
			.enter()
			.append('path')
				.attr('d', d3.arc()
					.innerRadius(50)
					.outerRadius(height / 2)
				)
				.attr('fill', function(d) { return( color(d.data.key)) })
				.attr("stroke", "#00000087")
				.style("stroke-width", "1px")
				.style("opacity", 0.7);
	}
}

class Bar 
{
	#name;
	#element;
	#valueKey;
	#values;
	#errorKey;
	#errorValue;
	
	constructor(domContainer, name, valueKey, errorThresholdKey, data)
	{
		Object.defineProperties(this, {
			Element: {
				get: function() {
					return this.#element;
				}
			},
			Name: {
				get: function() {
					return this.#name;
				},
				set: function(value) {
					this.#name = value;
				}
			},
			ValueKey: {
				get: function() {
					return this.#valueKey;
				},
				set: function(value) {
					this.#valueKey = value;
				}
			},
			Values: {
				get: function() {
					return this.#values;
				},
				set: function(value) {
					this.#values = value;
				}
			},
			ErrorKey: {
				get: function() {
					return this.#errorKey;
				},
				set: function(value) {
					this.#errorKey = value;
				}
			},
			ErrorValue: {
				get: function() {
					return this.#errorValue;
				},
				set: function(value) {
					this.#errorValue = value;
				}
			}
		});
		
		this.#element = domContainer;
		this.#name = name;
		this.#valueKey = valueKey;
		this.#values = data[this.#valueKey];
		this.#errorKey = errorThresholdKey;
		if (errorThresholdKey != null)
			this.#errorValue = data[this.#errorKey];
		
		this.#draw();
	}
	
	redraw(visualizationData) {
		this.Values = visualizationData[this.ValueKey];
		if (this.ErrorKey != null)
			this.ErrorValue = visualizationData[this.ErrorKey];
	
		var bar = this.Element.querySelectorAll('bar')[0];
		var svg = bar.querySelectorAll('svg')[0];
		svg.remove();
		this.#createBar(bar);
	}
	
	#draw() {
		var nameElement = document.createElement('span');
		nameElement.textContent = this.Name;
		this.Element.appendChild(nameElement);
		var containerElement = document.createElement('bar');
		containerElement.id = this.Element.id + '-bar';
		this.Element.appendChild(containerElement);
		this.#createBar(containerElement);
		this.Element.classList.add(vizRenderClass);
	}
	
	#createBar(containerElement) {
		var bar = this.Element.querySelectorAll('bar')[0];
		var height = bar.offsetHeight - 50;
		var width = bar.offsetWidth;
		var margin = {top: 10, right: 10, bottom: 40, left: 20};
		
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
		window.Values = this.Values;
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
	}
}

class VisualizationManager
{
	#data = {};
	#visuals = [];
	
	constructor(data) 
	{		
		Object.defineProperties(this, {
			Visuals: {
				get: function() {
					return this.#visuals;
				}
			},
			Data: {
				set: function(value) {
					this.#data = value;
					this.#redraw();
					this.#updateGoalProgress();
				}
			}
		});
		
		this.#data = data;
		this.#updateGoalProgress();
	}
	
	#redraw() {
		this.Visuals.forEach(v => {
			v.redraw(this.#data['Data Points']);
		});
		this.#updateGoalProgress();
	}
	
	#updateGoalProgress() {
		var container = document.getElementById('goal-progress-container');
		Object.entries(this.#data['Goal Progress']).forEach(x => {
			var goalElement = document.getElementById(x[0]);
			if (goalElement == null) {
				goalElement = document.createElement('viz');
				goalElement.classList.add('metric');
				var icon = document.createElement('i');
				icon.classList.add('material-icons');
				goalElement.appendChild(icon);
				var description = document.createElement('span');
				description.textContent = x[0];
				goalElement.appendChild(description);
				container.appendChild(goalElement);
			}
			var goalIcon = goalElement.querySelectorAll('i')[0];
			if (x[1] == 'In Progress') {
				goalIcon.textContent = 'label_important';
				goalElement.classList.remove('failure');
				goalElement.classList.remove('success');
			}
			else if (x[1] == 'Completed') {
				goalIcon.textContent = 'done';
				goalElement.classList.remove('failure');
				goalElement.classList.add('success');
			}
			else if (x[1] == 'Failed') {
				goalIcon.textContent = 'dangerous';
				goalElement.classList.add('failure');
				goalElement.classList.remove('success');
			}
			if (x[1] == 'Disabled') {
				goalIcon.textContent = 'unpublished';
				goalElement.classList.add('disabled');
				goalElement.classList.remove('failure');
				goalElement.classList.remove('success');	
			}
			goalElement.classList.add('rendered');
		});
	}
	
	createBAN(domContainerId, name, valueKey) {		
		this.#visuals.push(new BAN(document.getElementById(domContainerId), name, valueKey, this.#data['Data Points']));
	}
	
	createDonut(domContainerId, name, valueKeys) {
		this.#visuals.push(new Donut(document.getElementById(domContainerId), name, valueKeys, this.#data['Data Points']));
	}
	
	createBarChart(domContainerId, name, valueKey, errorThresholdKey) {
		this.#visuals.push(new Bar(document.getElementById(domContainerId), name, valueKey, errorThresholdKey, this.#data['Data Points']));
	}	
}
