class StateManager {
    constructor(activityLog, camera, schedule, goalParameters, refreshRateFn) {
        this.currentState = null
        this.activity = activityLog
        this.camera = camera
        this.schedule = schedule
        this.goalParameters = goalParameters
        this.getRefreshRate = refreshRateFn
        this.hooks = []
    }

    callHooks(summary) {
        this.hooks.forEach(fn => fn(summary))
    }

    async run() {
        // Construct and store current moment.
        const now = getNow()
        const day = this.schedule.resolveDayFromDate(now)
        const rawState = await this.camera.getCurrentPersonState()
        this.currentState ??= rawState
        this.activity.addMoment(day, now, rawState, this.currentState)

        if (this.currentState != rawState) {
            // Update significance of near-latest entries if appropriate.
            const endIdx = this.activity.getIndexOfLatest()
            const startIdx = this.activity.getStartIndexOf(endIdx)
            if (this.activity.isMeetSignificance(startIdx)) {
                this.activity.updateAssumedState(startIdx, endIdx, rawState)
                this.currentState = rawState
            }
        }

        this.callHooks(new Summary(this.goalParameters, this.activity.log))
        setTimeout((async() => await this.run()), this.getRefreshRate())
    }
}
