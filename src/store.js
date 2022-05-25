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
		const prefix = datetime.toLocaleDateString('en-CA')
		const start = new Date(`${prefix} ${this.StartTime}`)
		const end = new Date(`${prefix} ${this.EndTime}`)
		return [start, end]
	}

	isScheduledAt(datetime) {
		if (!this.Enabled || !this.StartTime || !this.EndTime)
			return false
		const [start, end] = this.toDatetimeRange(datetime)
		return datetime >= start && datetime <= end
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
		const dayName = datetime.toLocaleDateString('en-CA', { weekday: 'long' })
		return this.Days.find(d => d.Name == dayName)
	}

	isScheduledAt(datetime) {
		const day = this.resolveDayFromDate(datetime)
		return day && day.isScheduledAt(date)
	}

	isScheduledOn(date) {
		const day = this.resolveDayFromDate(date)
		return day && day.Enabled
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
	Function
	Arguments
	Operator
	Comparison

	constructor(data) { Object.assign(this, data) }
}

class Trigger
{
	Alert
	Targets
	Achieves
	Conditions

	constructor(data)
	{
		Object.assign(this, data)
		this.Conditions = this.Conditions.map(c => new Condition(c))
	}
}

class Goal
{
	Label
	Description
	Sort
	Triggers

	constructor(data) { Object.assign(this, data) }
}

class Parameter
{
	Label
	DefaultValue
	DefaultInterval

	constructor(data) { Object.assign(this, data) }
}

class AppConfiguration
{
	Visualizations = []
	Parameters = {}
	Triggers = {}
	Goals = {}

	constructor(data)
	{
		Object.assign(this, data)
		Object.entries(this.Parameters).forEach(([k, v]) => this.Parameters[k] = new Parameter(v))
		Object.entries(this.Triggers).forEach(([k, v]) => this.Triggers[k] = new Trigger(v))
		Object.entries(this.Goals).forEach(([k, v]) => this.Goals[k] = new Goal(v))
	}

	static async fromJson(jsonPath) {
		const response = await fetch(jsonPath)
		const jsn = await response.json()
		return new AppConfiguration(jsn)
	}
}

class UserConfiguration
{
	#refreshInterval;
	#stateChangeTolerance;
	#schedule;
	#goals;
	#parameters;
	#path;

	constructor(data)
	{
		Object.defineProperties(this, {
			RefreshInterval: {
				get: () => this.#refreshInterval,
				set: (value) => this.#refreshInterval = value
			},
			StateChangeTolerance: {
				get: () => this.#stateChangeTolerance,
				set: (value) => this.#stateChangeTolerance = value
			},
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
			RefreshInterval: this.RefreshInterval,
			StateChangeTolerance: this.StateChangeTolerance,
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
