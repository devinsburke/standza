class Condition {
    static operators = {
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
		const op = Condition.operators[this.Operator]
		return op(summary.seek(this.Arguments), summary.seek(this.Comparison))
	}
}

class Trigger {
	constructor({Alert, AlertText, Conditions}) {
		this.Alert = Alert
        this.AlertText = AlertText
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

class RuleEngine {
    #triggerHolds = {}

    constructor(goals, goalDefinitions, triggerDefinitions, audioComponent) {
        this.goals = goals
        this.goalDefinitions = goalDefinitions
        this.triggerDefinitions = triggerDefinitions
        this.audioComponent = audioComponent
    }

    run(summary) {
        for (const g of this.goals) {
            for (const t of this.goalDefinitions[g].Triggers) {
                const trigger = this.triggerDefinitions[t]
                const successes = trigger.Conditions.reduce((i, c) => i + c.evaluate(summary), 0)

                if (t in this.#triggerHolds) {
                    if (successes)
                        break
                    delete this.#triggerHolds[t]
                } else if (successes == trigger.Conditions.length) {
                    this.audioComponent.play(trigger.Alert)
                    // TODO: Alerts.
                    this.#triggerHolds[t] = true
                    break
                }
            }
        }
    }
}
