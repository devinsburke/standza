class StateManager {
    constructor(activityLog, camera, ruleEngine, processFrequency) {
        this.enabled = false
        this.currentState = null
        this.activity = activityLog
        this.camera = camera
        this.processFrequency = processFrequency
        this.ruleEngine = ruleEngine
        this.ruleEngine.assignArgumentFunctions(this.functionFactory())
    }

    async start() {
        if (!this.enabled) {
            this.enabled = true
            await this.run()
        }
    }

    stop() {
        this.enabled = false
    }

    async run() {
        if (this.enabled) {
            // Construct and store current moment.
            const rawState = await this.camera.getCurrentPersonState()
            console.log(`run(): rawState = ${rawState}`)
            if (!this.currentState)
                this.currentState = rawState
            this.activity.addMoment(new Date(Date.now()), rawState, this.currentState)

            if (this.currentState != rawState) {
                // Update significance of near-latest entries if appropriate.
                const endIdx = this.activity.getIndexOfLatest(false)
                const startIdx = this.activity.getStartIndexOf(endIdx)
                if (this.activity.isMeetSignificance(startIdx)) {
                    this.activity.updateSignificance(startIdx, endIdx, true)
                    this.currentState = rawState
                    this.ruleEngine.removeTriggerHolds(this.currentState)
                }
            }

            if (this.activity.schedule.isScheduledOn(new Date(Date.now())))
                this.ruleEngine.run()
            
            setTimeout((async() => await this.run()), this.processFrequency)
        }
    }

    functionFactory() {
        return {
            is_state: (arg) => arg.includes(this.currentState),
            from_schedule: (arg) => this.activity.schedule.toMap(new Date(Date.now()))[arg[0]],
            daily_time: (arg) => this.activity.getMinutesInState(arg),
            maximum_daily_time: (arg) => this.activity.getMaximumPossibleMinutesInState(arg),
            time_since: (arg) => this.activity.getMinutesSinceState(arg)
        }
    }
}
