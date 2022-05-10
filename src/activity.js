class Moment {
    constructor(day, timestamp, rawState, assumedState, active, significant) {
        this.day = day
        this.timestamp = timestamp
        this.rawState = rawState
        this.assumedState = assumedState
        this.active = active
        this.significant = significant
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
        const isSignificant = rawState == assumedState
        const moment = new Moment(day, datetime, rawState, assumedState, isActive, isSignificant)
        this.push(moment)
    }

    push(moment) {
        console.log(moment)
        let idx = this.getIndexOfLatest(false)
        if (idx == null) {
            moment.significant = true
        } else {
            let latest = this.log[idx]
            if (!latest.significant && latest.rawState != moment.rawState) {
                idx = this.getIndexOfLatest(true)
                latest = this.log[idx]
            }
            moment.significant = latest.significant && latest.rawState == moment.rawState
        }
        this.log.push(moment)
    }

    getIndexOfLatest(significantOnly) {
        for (let i = this.log.length - 1; i >= 0; i--) {
            if (!significantOnly || this.log[i].significant)
                return i
        }
        return null
    }

    getStartIndexOf(idx) {
        if (idx == null)
            return null
        const from = this.log[idx]
        const significantOnly = from.significant
        for (let i = idx; i >= 0; i--) {
            const moment = this.log[i]
            if (moment.rawState != from.rawState)
                if (!significantOnly || moment.significant)
                    return i + 1
        }
        return 0
    }
}