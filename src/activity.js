class Moment {
    constructor(day, timestamp, rawState, assumedState, active) {
        this.day = day
        this.timestamp = timestamp
        this.rawState = rawState
        this.assumedState = assumedState
        this.active = active
    }
}

class ActivityLog {
    constructor(schedule, significanceThreshold) {
        this.log = []
        this.schedule = schedule
        this.significanceThreshold = significanceThreshold
        this.addMoment(getNow(), 'startup', 'startup')
    }

    addMoment(datetime, rawState, assumedState) {
        const day = this.schedule.resolveDayFromDate(datetime)
        const isActive = day.isScheduledAt(datetime)
        const moment = new Moment(day, datetime, rawState, assumedState, isActive)
        console.log(moment)
        this.log.push(moment)
        return moment
    }

    isMeetSignificance(idx) {
        return getNow() - this.log[idx].timestamp >= this.significanceThreshold
    }

    updateAssumedState(startIdx, endIdx, state) {
        for (let i = startIdx; i <= endIdx; i++)
            this.log[i].assumedState = state
    }

    getIndexOfLatest() {
        return this.log.length - 1
    }

    getStartIndexOf(idx) {
        const from = this.log[idx]
        for (let i = idx; i >= 0; --i)
            if (this.log[i].rawState != from.rawState)
                return i + 1
        return 0
    }

    getActivitySummary() {
        const activity = []
        const states = {}
        let f = this.log[0]

        const submitChange = (timestamp) => {
            const duration = timestamp - f.timestamp
            if (!(f.assumedState in states))
                states[f.assumedState] = {total: 0}

            const state = states[f.assumedState]
            state.total += duration
            state.last = timestamp
            activity.push({ state: f.assumedState, start: f.timestamp, end: timestamp, duration: duration })
        }

        for (const m of this.log)
            if (f.assumedState != m.assumedState) {
                submitChange(m.timestamp)
                f = m
            }
        submitChange(getNow())
        return {states, activity}
    }
}
