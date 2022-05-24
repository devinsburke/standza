const vizRenderClass = 'rendered'
const vizError = 'hsl(0deg 91% 63%)'
const vizPalette = [
	'hsl(216deg 49% 45%)',
	'transparent',
	'hsl(216deg 63% 85%)', 
	'hsl(216deg 83% 47%)',
	'hsl(216deg 7% 46%)'
]

class BAN 
{
	constructor(domContainer, name, valueKey) 
	{
		this.Type = 'BAN'
		this.Name = name
		this.ValueKey = valueKey
		this.ValueElement = document.createElement('h3')
		this.NameElement = document.createElement('span')
		domContainer.appendChild(this.ValueElement)
		domContainer.appendChild(this.NameElement)
		domContainer.classList.add(vizRenderClass)
	}
	
	redraw(data) {
		this.NameElement.textContent = this.Name
		this.ValueElement.textContent = data[this.ValueKey].toFixed(2)
	}
}

class Donut 
{	
	constructor(domContainer, name, unit, valueKeys, values)
	{
		this.Type = 'Donut'
		this.Name = name
		this.Unit = unit
		this.ValueKeys = valueKeys ?? []
		
		this.LabelElement = document.createElement('label')
		this.NameElement = document.createElement('span')
		this.DonutElement = document.createElement('donut')
		this.DonutElement.appendChild(this.LabelElement)
		domContainer.appendChild(this.NameElement)
		domContainer.appendChild(this.DonutElement)
		domContainer.classList.add(vizRenderClass)
		d3.select(this.DonutElement).append('svg').append('g')
	}
	
	redraw(data) {
		const values = this.ValueKeys.map(k => data[k])
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
			.data(d3.pie()(values))
			.join('path')
				.attr('d', d3.arc().innerRadius(70).outerRadius(size/2))
				.attr('fill', (_, i) => vizPalette[i])

		this.NameElement.textContent = this.Name
		this.LabelElement.setAttribute('data-current', values[0].toFixed(2))
		this.LabelElement.setAttribute('data-total', (values[0] + values[1]).toFixed(2))
		this.LabelElement.setAttribute('data-unit', this.Unit)
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
			Type: {
				get: function() {
					return 'Bar';
				}
			},
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

		var s = this.Element.querySelectorAll('svg')[0];
		if (Object.entries(this.Values).length != 0)
			s.classList.remove('hidden');
	}
	
	#draw() {
		var nameElement = document.createElement('span');
		nameElement.textContent = this.Name;
		this.Element.appendChild(nameElement);
		var containerElement = document.createElement('bar');
		containerElement.id = this.Element.id + '-bar';
		this.Element.appendChild(containerElement);
		this.#createBar(containerElement);
	}
	
	#createBar(containerElement) {
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

		this.Element.classList.add(vizRenderClass);
		var s = this.Element.querySelectorAll('svg')[0];
		if (Object.entries(this.Values).length == 0)
			s.classList.add('hidden');
	}
}

class State 
{
	#element;
	#state;
	#stateKey;
	#matchState;
	#matchStateKey;
	#stateSeconds = 0;
	
	constructor(domContainer, stateKey, matchStateKey, data)
	{
		Object.defineProperties(this, {
			Type: {
				get: function() {
					return 'State';
				}
			},
			Element: {
				get: function() {
					return this.#element;
				}
			},
			StateKey: {
				get: function() {
					return this.#stateKey;
				},
				set: function(value) {
					this.#stateKey = value;
				}
			},
			MatchStateKey: {
				get: function() {
					return this.#matchStateKey;
				},
				set: function(value) {
					this.#matchStateKey = value;
				}
			},
			State: {
				get: function() {
					return this.#state;
				},
				set: function(value) {
					this.#state = value;
				}
			},
			MatchState: {
				get: function() {
					return this.#matchState;
				},
				set: function(value) {
					this.#matchState = value;
				}
			},
			StateSeconds: {
				get: function() {
					return this.#stateSeconds;
				},
				set: function(value) {
					this.#stateSeconds = value;
				}
			}
		});
		
		this.#stateKey = stateKey;
		this.#matchStateKey = matchStateKey;
		this.#state = data[stateKey];
		if (this.#matchStateKey != null)
			this.#matchState = data[this.#matchStateKey];
		this.#element = domContainer;	
		this.#draw();
	}
	
	async updateState() {
		this.StateSeconds++;
		this.Element.querySelectorAll('span.state')[0].textContent = this.State;
		if (this.State != this.MatchState)
			this.Element.classList.add('state-changed');
		else 
			this.Element.classList.remove('state-changed');
		var minutes = Math.floor(this.StateSeconds / 60);
		var seconds = this.StateSeconds - (minutes * 60);
		if (minutes == 0)
			this.Element.querySelectorAll('timer')[0].textContent = String(this.StateSeconds) + ' second(s)';
		else 
			this.Element.querySelectorAll('timer')[0].textContent = String(minutes) + ' minute(s) ' + String(seconds) + ' second(s)';
	}
	
	async #resetState() {
		setInterval(function() {
			window.visualizationManager.updateStates();
		}, 1000);
	}
	
	redraw(visualizationData) {
		if (this.MatchStateKey != null)
			this.MatchState = visualizationData[this.MatchStateKey];
		if (this.State == visualizationData[this.StateKey])
			return;
		this.State = visualizationData[this.StateKey];
		this.StateSeconds = 0;
	}
	
	#draw() {
		var stateElement = document.createElement('span');
		stateElement.textContent = this.State;
		stateElement.classList.add('state');
		this.Element.appendChild(stateElement);
		var timerElement = document.createElement('timer');
		timerElement.id = this.Element.id + '-timer';
		timerElement.textContent = '0 second(s)';
		this.Element.appendChild(timerElement);
		this.Element.classList.add(vizRenderClass);
	}
}

class Clock
{
	#element;
	
	constructor(domContainer) {
		Object.defineProperties(this, {		
			Type: {
				get: function() {
					return 'Clock';
				}
			},
			Element: {
				get: function() {
					return this.#element;
				}
			}
		});
		
		this.#element = domContainer;
		this.#draw();
	}
	
	updateState() {
		var clockElement = this.Element.querySelectorAll('span')[0];
		clockElement.textContent = getNow().toLocaleTimeString();
	}
	
	async #resetState() {
		setInterval(function() {
			window.visualizationManager.updateStates();
		}, 1000);
	}
	
	#draw() {
		var clockElement = document.createElement('span');
		clockElement.textContent = new Date().toLocaleTimeString();
		this.Element.appendChild(clockElement);
		this.Element.classList.add(vizRenderClass);
		this.#resetState();
	}

	redraw(visualizationData) {}
}

class VisualizationManager
{
	#data;
	#visuals = [];
	#configPath;
	
	constructor(configPath) 
	{		
		Object.defineProperties(this, {
			Visuals: {
				get: function() {
					return this.#visuals;
				}
			},
			Data: {
				set: function(value) {
					if (this.#data == null && value != null)
					{
						this.#data = value;
						if (configPath != null)
							this.#fromJson(this.#configPath);
					}
					this.#data = value;					
					this.Visuals.forEach(v => {
						v.redraw(this.#data['Data Points']);
					});
					this.#updateGoalProgress();
				}
			}
		});

		this.#configPath = configPath;
	}
	
	async #fromJson(jsonPath) {
		var response = await fetch(jsonPath)
		var jsn = await response.json();			
		(jsn['Visualizations'] ?? []).forEach(v => {
			this.#initViz(v);
		});
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
	
	#initViz(config) {
		if (config.Type == 'BAN')
			this.#visuals.push(new BAN(document.getElementById(config.ContainerId), config.Params[0], config.Params[1], this.#data['Data Points']));
		if (config.Type == 'Donut')
			this.#visuals.push(new Donut(document.getElementById(config.ContainerId), config.Params[0], config.Params[1], config.Params[2], this.#data['Data Points']));
		if (config.Type == 'Bar')
			this.#visuals.push(new Bar(document.getElementById(config.ContainerId), config.Params[0], config.Params[1], config.Params[2], this.#data['Data Points']));
		if (config.Type == 'State')
			this.#visuals.push(new State(document.getElementById(config.ContainerId), config.Params[0], config.Params[1], this.#data['Data Points']));
		if (config.Type == 'Clock')
			this.#visuals.push(new Clock(document.getElementById(config.ContainerId)));
	}
	
	createBAN(domContainerId, name, valueKey) {		
		this.#visuals.push(new BAN(document.getElementById(domContainerId), name, valueKey, this.#data['Data Points']));
	}
	
	createDonut(domContainerId, name, unit, valueKeys) {
		this.#visuals.push(new Donut(document.getElementById(domContainerId), name, unit, valueKeys, this.#data['Data Points']));
	}
	
	createBarChart(domContainerId, name, valueKey, errorThresholdKey) {
		this.#visuals.push(new Bar(document.getElementById(domContainerId), name, valueKey, errorThresholdKey, this.#data['Data Points']));
	}
	
	async createState(domContainerId, stateKey) {
		this.#visuals.push(new State(document.getElementById(domContainerId), stateKey, this.#data['Data Points']));
	}
	
	async createClock(domContainerId) {
		this.#visuals.push(new Clock(document.getElementById(domContainerId)));
	}
	
	async updateStates() {
		this.#visuals.forEach(v => {
			if (v.Type == 'State' || v.Type == 'Clock')
				v.updateState();
		});
	}
}
