class StateManager {
    constructor(activityLog, camera, ruleEngine, visualizationManager, refreshInterval) {
        this.enabled = false
        this.currentState = null
        this.activity = activityLog
        this.camera = camera
        this.visualizationManager = visualizationManager
        this.refreshInterval = refreshInterval
        this.ruleEngine = ruleEngine
        this.ruleEngine.assignArgumentFunctions(this.functionFactory())
        this.snapshot = {}
        this.#refreshSnapshot()
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
            this.activity.addMoment(getNow(), rawState, this.currentState)

            if (this.currentState != rawState) {
                // Update significance of near-latest entries if appropriate.
                const endIdx = this.activity.getIndexOfLatest()
                const startIdx = this.activity.getStartIndexOf(endIdx)
                if (this.activity.isMeetSignificance(startIdx)) {
                    this.activity.updateAssumedState(startIdx, endIdx, rawState)
                    this.currentState = rawState
                    this.ruleEngine.removeTriggerHolds(this.currentState)
                }
            }
            
            if (this.activity.schedule.isScheduledOn(getNow()))
                this.ruleEngine.run()

            this.visualizationManager.setData(this.getAnalyticsData())
            
            setTimeout((async() => await this.run()), this.refreshInterval)
        }
    }

    functionFactory() {
        return {
            is_state: (arg) => arg.includes(this.currentState),
            from_schedule: (arg) => this.activity.schedule.toMap(getNow())[arg[0]],
            daily_time: (arg) => this.activity.getMinutesInState(arg),
            maximum_daily_time: (arg) => this.activity.getMaximumPossibleMinutesInState(arg),
            time_since: (arg) => this.activity.getMinutesSinceState(arg)
        }
    }

    #refreshSnapshot() {
        this.snapshot['timestamp'] = null
        this.snapshot['rawState'] = null
        this.snapshot['assumedState'] = null
        this.snapshot['scheduleStart'] = null
        this.snapshot['scheduleEnd'] = null
        this.snapshot['stateChanges'] = [
            {'timestamp': null, 'state': 'Sitting'},
            {'timestamp': null, 'state': 'Sitting'},
            {'timestamp': null, 'state': 'Sitting'}
        ]
        this.snapshot['parameters'] = {
            'stand-goal': 0,
            'work-goal': 0,
        }
    }

    getAnalyticsData() {
        const hoursWorked = this.activity.getMinutesInState(['Standing', 'Sitting']) / 60.00
        const hoursGoal = this.ruleEngine.getParameterInHours('work_day_minimum')
        const hoursStood = this.activity.getMinutesInState(['Standing']) / 60.00
        const standGoal = this.ruleEngine.getParameterInHours('stand_day_minimum')
        
        return {
            'Data Points': {
                'Hours Standing': hoursStood,
                'Hours Working': hoursWorked,
                'Day Hours Remaining': this.activity.getMinutesRemainingInDay() / 60.00,
                'Stand Hours Remaining': Math.max(standGoal - hoursStood, 0),
                'Work Hours Remaining': Math.max(hoursGoal - hoursWorked, 0),
                'Maximum Break Time': this.ruleEngine.getParameterInHours('away_now_maximum') * 60.0,
                'Minimum Hours Standing': standGoal,
                'Minimum Hours Working': this.ruleEngine.getParameterInHours('work_day_minimum'),
                'Current State': this.activity.getCurrentState(true),
                'Raw State': this.activity.getCurrentState(false),
                'Breaks Taken': this.activity.getStateOccurrences(['Absent']).map(o => {
                    const obj = {}
                    obj[o.timestamp.toLocaleString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' })] = o.duration
                    return obj
                }),
            },
            'Goal Progress': {
                //'Ensure I work a full day': 'In Progress',
                //'Stop working the earliest I can': 'In Progress',
                //'Stand a minimum amount each day': 'Completed',
                //'Regularly switch to standing': 'Disabled',
                //'Regularly take a break and walk away': 'Failed',
                //'Ensure I am never away too long': 'Failed'
            }
        }
    }
}
