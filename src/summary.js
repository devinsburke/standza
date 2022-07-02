class Summary {
    constructor(parameters, moments) {
        const moment = moments[moments.length - 1]
        this.#summarizeMoments(moments)
        this.#injectSchedule(moment)
        this.#injectStates()
        this.#injectCurrentState(moment)
        this.#injectParameters(parameters)
    }

    #summarizeMoments(moments) {
        this['activity'] = []
        let f = moments[0]

        for (const m of [...moments, {timestamp: getNow()}])
            if (f.assumedState != m.assumedState) {
                const prefix = `states.${f.assumedState.toLowerCase()}`
                this[`${prefix}.total`] ??= 0
                this[`${prefix}.total`] += m.timestamp - f.timestamp
                this[`${prefix}.last`] = m.timestamp
                this['activity'].push({ state: f.assumedState, start: f.timestamp, end: m.timestamp })
                f = m
            }
    }

    #injectSchedule(moment) {
        const [dayStart, dayEnd] = moment.day.toDatetimeRange(moment.timestamp)
        this['timestamp'] = moment.timestamp
        this['schedule.day.start'] = dayStart
        this['schedule.day.end'] = dayEnd
        this['schedule.day.duration'] = dayEnd - dayStart
        this['schedule.day.elapsed'] = moment.timestamp - dayStart
        this['schedule.day.balance'] = dayEnd - moment.timestamp
        this['schedule.day.enabled'] = moment.day.Enabled
    }

    #injectStates() {
        for (const s in PersonState) {
            this[`states.${s.toLowerCase()}.total`] ??= 0
            this[`states.${s.toLowerCase()}.last`] ??= 0
            this[`states.${s.toLowerCase()}.since`] = this['timestamp'] - this[`states.${s.toLowerCase()}.last`]
            this[`states.${s.toLowerCase()}.potential`] = this['schedule.day.balance'] + this[`states.${s.toLowerCase()}.total`]

            this[`states.not${s}.total`] = 0
            this[`states.not${s}.last`] = 0
            for (const ns in PersonState) {
                if (ns != s) {
                    this[`states.not${s}.total`] += this[`states.${ns.toLowerCase()}.total`] || 0
                    if (this[`states.not${s}.last`] < this[`states.${ns.toLowerCase()}.last`])
                        this[`states.not${s}.last`] = this[`states.${ns.toLowerCase()}.last`]
                }
            }
            
            this[`states.not${s}.since`] = this['timestamp'] - this[`states.not${s}.last`]
            this[`states.not${s}.potential`] = this['schedule.day.balance'] + this[`states.not${s}.total`]
        }
    }

    #injectCurrentState(moment) {
        this['state.assumed'] = moment.assumedState
        this['state.raw'] = moment.rawState
        this['state.duration'] = this[`states.not${moment.assumedState}.since`]
    }

    #injectParameters(parameters) {
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
