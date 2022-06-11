class RuleEngine {
    #triggerHolds = {}

    constructor(goals, goalDefinitions, triggerDefinitions, audioPlayer) {
        this.goals = goals
        this.goalDefinitions = goalDefinitions
        this.triggerDefinitions = triggerDefinitions
        this.audioPlayer = audioPlayer
        for (const k in this.triggerDefinitions)
            this.audioPlayer.buildElement(k)
    }

    run(summary) {
        for (const g of this.goals) {
            for (const t of this.goalDefinitions[g].Triggers) {
                const conditions = this.triggerDefinitions[t].Conditions
                const successes = conditions.reduce((i, c) => i + c.evaluate(summary), 0)

                if (t in this.#triggerHolds) {
                    if (successes)
                        break
                    delete this.#triggerHolds[t]
                } else if (successes == conditions.length) {
                    this.audioPlayer.play(t)
                    // TODO: Alerts.
                    this.#triggerHolds[t] = true
                    break
                }
            }
        }
    }
}
