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
}

class Schedule {
	constructor({Days}) {
		this.Days = Days ? Days.map(d => new Day(d)) : []
	}

	resolveDayFromDate(datetime) {
		const dayName = datetime.toLocaleDateString('en-US', { weekday: 'long' })
		return this.Days.find(d => d.Name == dayName)
	}
}

class AppConfiguration {
	constructor({tabs, Visualizations, Parameters, Triggers, Goals}) {
		this.tabs = tabs || []
		this.Visualizations = Visualizations || []
		this.Parameters = {}
		this.Triggers = {}
		this.Goals = {}
		for (const k in Parameters) this.Parameters[k] = new Parameter(Parameters[k])
		for (const k in Triggers) this.Triggers[k] = new Trigger(Triggers[k])
		for (const k in Goals) this.Goals[k] = new Goal(Goals[k])
	}

	static async fromJson(jsonPath) {
		const response = await fetch(jsonPath)
		return new AppConfiguration(await response.json())
	}
}

class UserConfiguration {
	constructor(saveCallback, {refreshRate, stateChangeTolerance, schedule, goals, parameters}) {
		this.refreshRate = refreshRate || 1000
		this.stateChangeTolerance = stateChangeTolerance || 10000
		this.schedule = new Schedule(schedule)
		this.goals = goals || []
		this.parameters = parameters || {}
		this.save = () => saveCallback(this)
	}

	static async fromJson(path, writeFileFn) {
		const response = await fetch(path)
		const saveCallback = (c) => writeFileFn(path, JSON.stringify(c))
		return new UserConfiguration(saveCallback, await response.json())
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
