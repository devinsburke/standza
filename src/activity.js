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
    }

    addMoment(datetime, rawState, assumedState) {
        const day = this.schedule.resolveDayFromDate(datetime)
        const isActive = day.isScheduledAt(datetime)
        const moment = new Moment(day, datetime, rawState, assumedState, isActive)
        console.log(moment)
        this.log.push(moment)
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

    getMinutesInState(stateList) {
        const startIdx = this.log.findIndex(m => m.active)
        if (startIdx == -1)
            return null

        let minutes = 0
        let last = this.log[startIdx].timestamp
        for (let i = startIdx; i < this.log.length; i++) {
            const item = this.log[i]
            if (stateList.includes(item.assumedState)) {
                minutes += (item.timestamp - last) / 60000
                last = item.timestamp
            }
        }
        return minutes
    }

    getMinutesSinceState(stateList) {
        for (let i = this.log.length-1; i >= 0; i--) {
            const item = this.log[i]
            if (stateList.includes(item.assumedState))
                return (getNow() - item.timestamp) / 60000
        }
        return null
    }

    getMinutesRemainingInDay() {
        const now = getNow()
        const [_, end] = this.schedule.toDatetimeRange(now)
        return (end - now.getTime()) / 60000
    }

    getMaximumPossibleMinutesInState(stateList) {
        return this.getMinutesInState(stateList) + this.getMinutesRemainingInDay()
    }

    #getStateChanges() {
        let f = this.log[0]
        const list = []
        for (const m of this.log)
            if (f.assumedState != m.assumedState) {
                list.push({ 'state': f.assumedState, 'start': f.timestamp, 'duration': m.timestamp - f.timestamp })
                f = m
            }
        list.push({ 'state': f.assumedState, 'start': f.timestamp, 'duration': m.timestamp - f.timestamp })
        return list
    }

    getActivitySummary() {
        if (!this.log)
            return {}
        const latest = this.log[this.log.length-1]
        const [dayStart, dayEnd] = latest.day.toDatetimeRange(latest.timestamp)

        const summary = {
            'timestamp': latest.timestamp,
            'rawState': latest.rawState,
            'assumedState': latest.assumedState,
            'scheduleStart': dayStart,
            'scheduleEnd': dayEnd,
            'scheduleBalance': dayEnd - latest.timestamp,
            'stateChanges': this.#getStateChanges(),
            'parameters': {}
        }
    }
}
