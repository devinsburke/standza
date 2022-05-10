class RuleEngine {
    constructor(goals, goalDefinitions, triggerDefinitions, parameters, parameterDefinitions, audioPlayer) {
        this.goals = goals
        this.goalDefinitions = goalDefinitions
        this.triggerDefinitions = triggerDefinitions
        this.parameters = parameters
        this.parameterDefinitions = parameterDefinitions
        this.triggerHolds = {}
        this.argumentFunctions = {}
        this.compareFunctions = {
            "equal": (a, b) => a == b,
            "greaterThanOrEqual": (a, b) => a >= b,
            "lessThanOrEqual": (a, b) => a <= b
        }
        this.audioPlayer = audioPlayer
        for (const k in this.triggerDefinitions)
            this.audioPlayer.buildElement(k)
    }

    assignArgumentFunctions(functionContainer) {
        this.argumentFunctions = functionContainer
    }

    run() {
        for (const g of this.goals) {
            const goal = this.goalDefinitions[g]

            for (const t of goal.Triggers) {
                // If (in order) any trigger for this goal is still satisfied
                // (meaning targeted states have not yet been reached),
                // then escape processing the remaining triggers in this goal.
                if (t in this.triggerHolds)
                    break

                const trigger = this.triggerDefinitions[t]
                if (this.#evaluateTrigger(trigger)) {
                    this.audioPlayer.play(t)
                    // TODO: Alerts.
                    this.triggerHolds[t] = trigger.Targets
                    break
                }
            }
        }
    }

    // Called by a stateManager to signal a state change.
    removeTriggerHolds(state) {
        for (const [k, v] of Object.entries(this.triggerHolds))
            if (v.includes(state))
                delete this.triggerHolds[k]
    }

    #evaluateParameter(comparison) {
        if (comparison == "now")
            return new Date(Date.now())
        if (comparison in this.parameterDefinitions) {
            const {Value, Interval} = this.parameters[comparison]
            return Interval.toLowerCase() == "minute" ? Value : Value / 60.0
        }
        return comparison
    }

    #evaluateTrigger(trigger) {
        for (const c of trigger.Conditions) {
            const compareFn = this.compareFunctions[c.Operator]
            const argumentFn = this.argumentFunctions[c.Function]
            const success = compareFn(
                argumentFn(c.Arguments),
                this.#evaluateParameter(c.Comparison)
            )
            if (!success)
                return false
        }
        return true
    }
}
