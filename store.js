class Day
{
	#name;
	#startTime;
	#endTime;
	#enabled;

	constructor(data)
	{
		Object.defineProperties(this, {
			Name: {
				get: () => this.#name,
				set: (value) => this.#name = value
			},
			StartTime: {
				get: () => this.#startTime,
				set: (value) => this.#startTime = value
			},
			EndTime: {
				get: () => this.#endTime,
				set: (value) => this.#endTime = value
			},
			Enabled: {
				get: () => this.#enabled ?? false,
				set: (value) => this.#enabled = value ?? false
			}
		});

		Object.assign(this, data);
	}

	toStorageJson() {
		return {
			Name: this.Name,
			StartTime: this.StartTime,
			EndTime: this.EndTime,
			Enabled: this.Enabled
		};
	}

	toDatetimeRange(datetime) {
		const prefix = new Date(datetime).toLocaleDateString('en-CA')
		const start = `${prefix} ${this.StartTime}`
		const end = `${prefix} ${this.EndTime}`
		return [start, end]
	}

	isScheduledAt(datetime) {
		if (!this.Enabled || !this.StartTime || !this.EndTime)
			return false
		const [start, end] = this.toDatetimeRange(datetime)
		return new Date(datetime) >= start && new Date(datetime) <= end
	}
}

class Schedule
{
	#days;

	constructor(data)
	{
		Object.defineProperties(this, {
			Days: {
				get: () => this.#days,
				set: (value) => this.#days = value ? value.map(x => Object.assign(new Day(), x)) : []
			}
		});

		Object.assign(this, data);
	}

	toStorageJson() {
		return {
			Days: this.Days.map(d => d.toStorageJson())
		};
	}

	resolveDayFromDate(datetime) {
		const dayName = new Date(datetime).toLocaleDateString('en-CA', { weekday: 'long' })
		return this.Days.find(d => d.Name == dayName)
	}

	isScheduledAt(datetime) {
		const day = this.resolveDayFromDate(datetime)
		return day && day.isScheduledAt(date)
	}

	toDatetimeRange(datetime) {
		const day = this.resolveDayFromDate(datetime)
		return day.toDatetimeRange(datetime)
	}

	toMap(datetime) {
		const [dayStart, dayEnd] = this.toDatetimeRange(datetime)
		return {
			"day_start_time": dayStart,
			"day_end_time": dayEnd,
			"week_start_time": null,
			"week_end_time": null,
		}
	}
}

class Condition
{
	#function;
	#arguments;
	#operator;
	#comparison;

	constructor(data)
	{
		Object.defineProperties(this, {
			Function: {
				get: () => this.#function,
				set: (value) => this.#function = value
			},
			Arguments: {
				get: () => this.#arguments,
				set: (value) => this.#arguments = value
			},
			Operator: {
				get: () => this.#operator,
				set: (value) => this.#operator = value
			},
			Comparison: {
				get: () => this.#comparison,
				set: (value) => this.#comparison = value
			}
		});

		Object.assign(this, data);
	}

	run(functionContainer) {
		const fn = functionContainer[this.Function]
		const val = fn(this.Arguments)
		switch (this.Operator) {
			case "equal":
				return val == this.Comparison
			case "greaterThanOrEqual":
				return val >= this.Comparison
			case "greaterThanOrEqual":
				return val <= this.Comparison
		}
	}
}

class Trigger
{
	#alert;
	#targets;
	#achieves;
	#conditions;

	constructor(data)
	{
		Object.defineProperties(this, {
			Alert: {
				get: () => this.#alert,
				set: (value) => this.#alert = value
			},
			Targets: {
				get: () => this.#targets,
				set: (value) => this.#targets = value
			},
			Achieves: {
				get: () => this.#achieves,
				set: (value) => this.#achieves = value
			},
			Conditions: {
				get: () => this.#conditions,
				set: (value) => this.#conditions = value ? value.map(x => new Condition(x)) : []
			}
		});

		Object.assign(this, data);
	}

	run(functionContainer) {
		for (const c of this.Conditions) {
			if (!c.run(functionContainer))
				return false
		}
		// TODO: Alerts
		return true
	}
}

class Goal
{
	#label;
	#description;
	#sort;
	#triggers;

	constructor(data)
	{
		Object.defineProperties(this, {
			Label: {
				get: () => this.#label,
				set: (value) => this.#label = value
			},
			Description: {
				get: () => this.#description,
				set: (value) => this.#description = value
			},
			Sort: {
				get: () => this.#sort,
				set: (value) => this.#sort = value
			},
			Triggers: {
				get: () => this.#triggers,
				set: (value) => this.#triggers = value
			}
		});

		Object.assign(this, data);
	}

	run(triggerDefinitions, functionContainer, skipTriggers) {
		for (const [_, t] of Object.entries(this.Triggers)) {
			if (!skipTriggers.includes(t)) {
				const trigger = triggerDefinitions[t]
				if (trigger.run(functionContainer)) {
					skipTriggers.push(t)
					return [t, trigger]
				}
			}
		}
	}
}

class Parameter
{
	#label;
	#datatype;
	#default_value;
	#default_interval;
	#goals;

	constructor(data)
	{
		Object.defineProperties(this, {
			Label: {
				get: () => this.#label,
				set: (value) => this.#label = value
			},
			DataType: {
				get: () => this.#datatype,
				set: (value) => this.#datatype = value
			},
			DefaultValue: {
				get: () => this.#default_value,
				set: (value) => this.#default_value = value
			},
			DefaultInterval: {
				get: () => this.#default_interval,
				set: (value) => this.#default_interval = value
			},
			Goals: {
				get: () => this.#goals,
				set: (value) => this.#goals = value ? value.map(v => new Goal(v)) : []
			}
		});

		Object.assign(this, data);
	}
}

class AppConfiguration
{
	#parameters;
	#triggers;
	#goals;
	#path;

	constructor(data)
	{
		Object.defineProperties(this, {
			Parameters: {
				get: () => this.#parameters,
				set: (value) => {
					this.#parameters = {}
					Object.entries(value).forEach(([k,v]) => this.#parameters[k] = new Parameter(v))
				}
			},
			Triggers: {
				get: () => this.#triggers,
				set: (value) => {
					this.#triggers = {}
					Object.entries(value).forEach(([k,v]) => this.#triggers[k] = new Trigger(v))
				}
			},
			Goals: {
				get: () => this.#goals,
				set: (value) => {
					this.#goals = {}
					Object.entries(value).forEach(([k,v]) => this.#goals[k] = new Goal(v))
				}
			}
		});

		Object.assign(this, data);
	}

	static async fromJson(jsonPath) {
		return fetch(jsonPath).then(async response => {
			var jsn = await response.json();
			var output = new AppConfiguration(jsn);
			output.#path = jsonPath;
			return output;
		});
	}
}

class UserConfiguration
{
	#schedule;
	#goals;
	#parameters;
	#path;

	constructor(data)
	{
		Object.defineProperties(this, {
			Schedule: {
				get: () => this.#schedule,
				set: (value) => this.#schedule = new Schedule(value)
			},
			Goals: {
				get: () => this.#goals,
				set: (value) => this.#goals = value
			},
			Parameters: {
				get: () => this.#parameters,
				set: (value) => this.#parameters = value
			},
			Path: {
				get: () => this.#path
			}
		});

		Object.assign(this, data);
	}

	static async fromJson(jsonPath) {
		const response = await fetch(jsonPath)
		const jsn = await response.json()
		const output = new UserConfiguration(jsn)
		output.#path = jsonPath
		return output
	}
	
	#toStorageJson() {
		return JSON.stringify({
			Schedule: this.Schedule.toStorageJson(),
			Goals: this.Goals,
			Parameters: this.Parameters
		});
	}

	async save() {
		var event = new CustomEvent('PutFile',
		{
			detail: {
				path: this.Path,
				content: this.#toStorageJson()
			}
		});
		document.dispatchEvent(event);
	}
	
	async changeGoal(goalId, value) {
		if (value)
			this.Goals.push(goalId);
		else
			this.Goals.splice(this.Goals.indexOf(goalId), 1)
		await this.save();
	}
	
	async changeParameter(parameterId, value) {
		this.Parameters[parameterId] = value;
		await this.save();
	}
}
