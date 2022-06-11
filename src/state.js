class StateManager {
    constructor(activityLog, camera, ruleEngine, visualizationManager, goalParameters, refreshInterval) {
        this.enabled = false
        this.currentState = null
        this.activity = activityLog
        this.camera = camera
        this.ruleEngine = ruleEngine
        this.visualizationManager = visualizationManager
        this.goalParameters = goalParameters
        this.refreshInterval = refreshInterval
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
            const moment = this.activity.addMoment(getNow(), rawState, this.currentState)

            if (this.currentState != rawState) {
                // Update significance of near-latest entries if appropriate.
                const endIdx = this.activity.getIndexOfLatest()
                const startIdx = this.activity.getStartIndexOf(endIdx)
                if (this.activity.isMeetSignificance(startIdx)) {
                    this.activity.updateAssumedState(startIdx, endIdx, rawState)
                    this.currentState = rawState
                }
            }

            const summary = new Summary(
                moment,
                this.goalParameters,
                this.activity.getActivitySummary()
            )

            // TODO: Handle how rules usually should not run past work time.
            if (this.activity.schedule.isScheduledOn(getNow()))
                this.ruleEngine.run(summary)

            this.visualizationManager.setData(summary)
            
            setTimeout((async() => await this.run()), this.refreshInterval)
        }
    }
}

class Summary {
    constructor(moment, parameters, {states, activity}) {
        const [dayStart, dayEnd] = moment.day.toDatetimeRange(moment.timestamp)
        const dayBalance = dayEnd - moment.timestamp
        this['timestamp'] = moment.timestamp
        this['activity'] = activity

        this['schedule.day.start'] = dayStart
        this['schedule.day.end'] = dayEnd
        this['schedule.day.duration'] = dayEnd - dayStart
        this['schedule.day.elapsed'] = moment.timestamp - dayStart
        this['schedule.day.balance'] = dayBalance
        this['schedule.day.enabled'] = moment.day.Enabled

        for (const s in PersonState) {
            const info = s in states ? states[s] : {total: 0, last: 0}
            this[`states.${s.toLowerCase()}.total`] = info.total
            this[`states.${s.toLowerCase()}.last`] = info.last
            this[`states.${s.toLowerCase()}.since`] = moment.timestamp - info.last
            this[`states.${s.toLowerCase()}.potential`] = dayBalance + info.total

            let notTotal = 0
            let notLast = 0
            for (const ns in states) {
                if (ns != s) {
                    notTotal += states[ns].total
                    if (notLast < states[ns].last)
                        notLast = states[ns].last
                }
            }
            
            this[`states.not${s}.total`] = notTotal
            this[`states.not${s}.last`] = notLast
            this[`states.not${s}.since`] = moment.timestamp - notLast
            this[`states.not${s}.potential`] = dayBalance + notTotal
        }

        this['state.assumed'] = moment.assumedState
        this['state.raw'] = moment.rawState
        this['state.active'] = moment.active
        this['state.duration'] = this[`states.not${moment.assumedState}.since`]

        for (const p in parameters) {
            const param = parameters[p]
            const intValue = parseInt(param.Value)
            this[`parameters.${p}.value`] = intValue
            this[`parameters.${p}.unit`] = param.Interval // TODO: Rename.
            switch (param.Interval.toLowerCase()) {
                case 'hour':
                    this[`parameters.${p}.timespan`] = intValue * 60 * 60 * 1000
                default:
                    this[`parameters.${p}.timespan`] = intValue * 60 * 1000
            }
        }
    }

    seek(key) {
        return key in this ? this[key] : key
    }
}
