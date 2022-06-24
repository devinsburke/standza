class Moment {
    constructor(day, timestamp, rawState, assumedState) {
        this.day = day
        this.timestamp = timestamp
        this.rawState = rawState
        this.assumedState = assumedState
    }
}

class ActivityLog {
    constructor(significanceThreshold) {
        this.log = []
        this.significanceThreshold = significanceThreshold
    }

    addMoment(day, datetime, rawState, assumedState) {
        this.log.push(new Moment(day, datetime, rawState, assumedState))
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
}
