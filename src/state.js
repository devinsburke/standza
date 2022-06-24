class Moment {
    constructor(day, timestamp, rawState, assumedState) {
        this.day = day
        this.timestamp = timestamp
        this.rawState = rawState
        this.assumedState = assumedState
    }
}

class StateManager {
    #log = []
    #currentState = null

    constructor(camera, schedule, goalParameters, refreshRateFn, stateChangeToleranceFn) {
        this.camera = camera
        this.schedule = schedule
        this.goalParameters = goalParameters
        this.getRefreshRate = refreshRateFn
        this.getStateChangeTolerance = stateChangeToleranceFn
        this.hooks = []
    }

    log(timestamp, rawState) {
        const day = this.schedule.resolveDayFromDate(timestamp)
        this.#log.push(new Moment(day, timestamp, rawState, this.#currentState))

        if (this.#currentState != rawState) {
            const latestChange = this.#getRawStateTimestamp(rawState)
            if (timestamp - latestChange >= this.getStateChangeTolerance())
                this.#currentState = rawState
        }
    }

    #getRawStateTimestamp(state) {
        let i = this.#log.length
        while (i-- && this.#log[i].rawState == state) { }
        return this.#log[i+1].timestamp
    }

    async run() {
        const rawState = await this.camera.getCurrentPersonState()
        this.#currentState ??= rawState
        this.log(getNow(), rawState)

        const summary = new Summary(this.goalParameters, this.#log)
        this.hooks.forEach(fn => fn(summary))
        setTimeout((async() => await this.run()), this.getRefreshRate())
    }
}
