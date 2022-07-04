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
	constructor({alert, alertText, conditions}) {
		this.alert = alert
        this.alertText = alertText
		this.conditions = conditions ? conditions.map(c => new Condition(c)) : []
	}
}

class Goal {
	constructor({label, description, sort, triggers}) { 
		this.label = label
		this.description = description
		this.sort = sort
		this.triggers = triggers || []
	}
}

class Parameter {
	constructor({label, defaultValue, defaultInterval}) { 
		this.label = label
		this.defaultValue = defaultValue
		this.defaultInterval = defaultInterval
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
            for (const t of this.goalDefinitions[g].triggers) {
                const trigger = this.triggerDefinitions[t]
                const successes = trigger.conditions.reduce((i, c) => i + c.evaluate(summary), 0)

                if (t in this.#triggerHolds) {
                    if (successes)
                        break
                    delete this.#triggerHolds[t]
                } else if (successes == trigger.conditions.length) {
                    this.audioComponent.play(trigger.alert)
                    // TODO: Alerts.
                    this.#triggerHolds[t] = true
                    break
                }
            }
        }
    }
}
