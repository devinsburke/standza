var container = document.getElementById('settings').querySelector('.sub-container');
var goalGroup;
var parameterGroup;

const ToggleType = 'Toggle';
const TimeSpanType = 'TimeSpan';
const GoalCategory = 'Goal';
const ParameterCategory = 'Parameter';

findSetting = function(id) {
	var output = goalGroup.Settings.find(s => s.Id == id);
	if (output != null) return output;
	return parameterGroup.Settings.find(s => s.Id == id);
}

class Setting
{
	#element

	constructor(id, name, description, value, category, type) 
	{
		this.Id = id
		this.Name = name
		this.description = description
		this.Value = value
		this.type = type
		this.Category = category
	}
	
	#generateToggle(container) {
		var setting = document.createElement('setting');
		setting.classList.add('setting-toggle');
		var name = document.createElement('setting-name');
		name.textContent = this.Name;
		var description = document.createElement('span');
		description.textContent = this.description;
		if (this.Value)
			setting.classList.add('enabled');
		setting.appendChild(name);
		setting.appendChild(description);
		setting.onclick = function(e) {
			var element = findSetting(this.id);
			if (element == null)
				return;				
			if (!element.Value)
				this.classList.add('enabled');
			else 
				this.classList.remove('enabled');
			element.Value = !element.Value;
			userConfig.changeGoal(element.Id, element.Value);
		};
		setting.id = this.Id;
		this.#element = setting;
		container.appendChild(setting);
	}
	
	#generateTimeSpan(container) {
		var setting = document.createElement('setting');
		setting.classList.add('setting-timespan');
		var name = document.createElement('setting-name');
		name.textContent = this.Name;
		var valueContainer = document.createElement('timespan');
		
		var down = document.createElement('interval-down');
		var downArrow = document.createElement('i');
		downArrow.classList.add('material-icons');
		downArrow.textContent = 'arrow_drop_down';
		down.appendChild(downArrow);
		down.id = this.Id + '-down';
		var up = document.createElement('interval-up');
		var upArrow = document.createElement('i');
		upArrow.classList.add('material-icons');
		upArrow.textContent = 'arrow_drop_up';
		up.appendChild(upArrow);
		up.id = this.Id + '-up';
		
		
		var value = document.createElement('span');
		value.textContent = this.Value.Value;
		value.id = this.Id + '-value';
		var interval = document.createElement('interval');
		interval.textContent = this.Value.Interval + '(s)';
		interval.id = this.Id + '-interval';
				
		down.onclick = function(e) {
			var element = findSetting(this.id.split('-')[0]);
			if (element == null)
				return;
			if (element.Value.Interval.toLowerCase() == 'hour')
				element.Value.Value = String(parseInt(element.Value.Value) - 1);
			else 
				element.Value.Value = String(parseInt(element.Value.Value) - 5);
			var valueElement = document.getElementById(element.Id + '-value');
			valueElement.textContent = element.Value.Value;
			userConfig.changeParameter(element.Id, element.Value);
		}
		
		up.onclick = function(e) {
			var element = findSetting(this.id.split('-')[0]);
			if (element == null)
				return;
			if (element.Value.Interval.toLowerCase() == 'hour') {
				element.Value.Value = String(parseInt(element.Value.Value) + 1);
			}
			else 
				element.Value.Value = String(parseInt(element.Value.Value) + 5);
			var valueElement = document.getElementById(element.Id + '-value');
			valueElement.textContent = element.Value.Value;
			userConfig.changeParameter(element.Id, element.Value);
		}
		
		interval.onclick = function(e) {
			// toggle minute/hour and save
			var element = findSetting(this.id.split('-')[0]);
			if (element == null)
				return;
			if (element.Value.Interval.toLowerCase() == 'hour')
				element.Value.Interval = 'Minute';
			else 
				element.Value.Interval = 'Hour';
			this.textContent = element.Value.Interval + '(s)';
			userConfig.changeParameter(element.Id, element.Value);
		};
		
		valueContainer.appendChild(down);
		valueContainer.appendChild(value);
		valueContainer.appendChild(up);
		valueContainer.appendChild(interval);
		setting.appendChild(name);
		setting.appendChild(valueContainer);
		setting.id = this.Id;
		this.#element = setting;
		container.appendChild(setting);
	}
	
	generate(container) {
		switch (this.type) {
			case ToggleType:
				this.#generateToggle(container);
				break;
			default:
				this.#generateTimeSpan(container);
				break;
		}
	}
}

class SettingGroup 
{
	#element;
		
	constructor(name) 
	{
		this.Name = name
	}
	
	generate() {
		var element = document.createElement('setting-group');
		var title = document.createElement('h2');
		title.textContent = this.Name;
		element.appendChild(title);
		this.#element = element;
		container.appendChild(element);
		
		this.Settings.forEach(s => s.generate(this.#element));
	}
}

setupSettings = function() {
	goalGroup = new SettingGroup('goals');
	goalGroup.Settings = Object.entries(appConfig.goals).sort(g => g.sort).map(g => {
		return new Setting(g[0], g[1].label, g[1].description, userConfig.goals.find(u => u == g[0]) != null, GoalCategory, ToggleType);
	});
	goalGroup.generate();
	
	parameterGroup = new SettingGroup('parameters');
	parameterGroup.Settings = Object.entries(appConfig.parameters).sort(p => p[0]).map(p => {
		return new Setting(
			p[0], 
			p[1].label, 
			p[1].description, 
			{
				Value: userConfig.parameters[p[0]] != null ? userConfig.parameters[p[0]].Value : p[1].defaultValue,
				Interval: userConfig.parameters[p[0]] != null ? userConfig.parameters[p[0]].Interval : p[1].defaultInterval
			}, 
			ParameterCategory, 
			TimeSpanType
		);
	});
	parameterGroup.generate();
}
