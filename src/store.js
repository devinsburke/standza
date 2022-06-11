class Day {
	constructor({Name, StartTime, EndTime, Enabled}) {
		this.Name = Name
		this.StartTime = StartTime
		this.EndTime = EndTime
		this.Enabled = Enabled || false
	}

	toDatetimeRange(datetime) {
		const prefix = datetime.toLocaleDateString('en-US')
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

class Schedule {
	constructor({Days}) {
		this.Days = Days ? Days.map(d => new Day(d)) : []
	}

	resolveDayFromDate(datetime) {
		const dayName = datetime.toLocaleDateString('en-US', { weekday: 'long' })
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
}

class Condition {
    #operators = {
        "equal": (a, b) => a == b,
        "notEqual": (a, b) => a != b,
        "greaterThanOrEqual": (a, b) => a >= b,
        "lessThanOrEqual": (a, b) => a <= b
    }

	constructor({Arguments, Operator, Comparison}) { 
		this.Arguments = Arguments
		this.Operator = Operator
		this.Comparison = Comparison
	}

	evaluate(summary) {
		const op = this.#operators[this.Operator]
		return op(summary.seek(this.Arguments), summary.seek(this.Comparison))
	}
}

class Trigger {
	constructor({Alert, Targets, Achieves, Conditions}) {
		this.Alert = Alert
		this.Targets = Targets || []
		this.Achieves = Achieves || []
		this.Conditions = Conditions ? Conditions.map(c => new Condition(c)) : []
	}
}

class Goal {
	constructor({Label, Description, Sort, Triggers}) { 
		this.Label = Label
		this.Description = Description
		this.Sort = Sort
		this.Triggers = Triggers || []
	}
}

class Parameter {
	constructor({Label, DefaultValue, DefaultInterval}) { 
		this.Label = Label
		this.DefaultValue = DefaultValue
		this.DefaultInterval = DefaultInterval
	}
}

class AppConfiguration {
	Visualizations = []
	Parameters = {}
	Triggers = {}
	Goals = {}

	constructor(data) {
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

class UserConfiguration {
	#path

	constructor({refreshInterval, stateChangeTolerance, schedule, goals, parameters}) {
		this.refreshInterval = refreshInterval || 0
		this.stateChangeTolerance = stateChangeTolerance || 0
		this.schedule = new Schedule(schedule)
		this.goals = goals || []
		this.parameters = parameters || []
	}

	static async fromJson(jsonPath) {
		const response = await fetch(jsonPath)
		const jsn = await response.json()
		const output = new UserConfiguration(jsn)
		output.#path = jsonPath
		return output
	}

	async save() {
		var event = new CustomEvent('PutFile',
		{
			detail: {
				path: this.#path,
				content: JSON.stringify(this)
			}
		})
		document.dispatchEvent(event)
	}
	
	async changeGoal(goalId, value) {
		if (value)
			this.goals.push(goalId)
		else
			this.goals.splice(this.goals.indexOf(goalId), 1)
		await this.save()
	}
	
	async changeParameter(parameterId, value) {
		this.parameters[parameterId] = value
		await this.save()
	}
}
