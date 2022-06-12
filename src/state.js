class StateManager {
    constructor(activityLog, camera, ruleEngine, visualizationManager, goalParameters, refreshRateFn) {
        this.currentState = null
        this.activity = activityLog
        this.camera = camera
        this.ruleEngine = ruleEngine
        this.visualizationManager = visualizationManager
        this.goalParameters = goalParameters
        this.getRefreshRate = refreshRateFn
    }

    async run() {
        // Construct and store current moment.
        const rawState = await this.camera.getCurrentPersonState()
        this.currentState ??= rawState
        this.activity.addMoment(getNow(), rawState, this.currentState)

        if (this.currentState != rawState) {
            // Update significance of near-latest entries if appropriate.
            const endIdx = this.activity.getIndexOfLatest()
            const startIdx = this.activity.getStartIndexOf(endIdx)
            if (this.activity.isMeetSignificance(startIdx)) {
                this.activity.updateAssumedState(startIdx, endIdx, rawState)
                this.currentState = rawState
            }
        }

        const summary = new Summary(this.goalParameters, this.activity.log)

        // TODO: Handle how rules usually should not run past work time.
        if (this.activity.schedule.isScheduledOn(getNow()))
            this.ruleEngine.run(summary)

        this.visualizationManager.setData(summary)
        setTimeout((async() => await this.run()), this.getRefreshRate())
    }
}
