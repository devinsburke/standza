class StateManager {
    constructor(activityLog, camera, ruleEngine, visualizationManager, refreshInterval) {
        this.enabled = false
        this.currentState = null
        this.activity = activityLog
        this.camera = camera
        this.visualizationManager = visualizationManager
        this.refreshInterval = refreshInterval
        this.ruleEngine = ruleEngine
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

            const activitySummary = this.activity.getSummary()
            if (this.activity.schedule.isScheduledOn(getNow()))
                this.ruleEngine.run(activitySummary)

            this.visualizationManager.setData(activitySummary)
            
            setTimeout((async() => await this.run()), this.refreshInterval)
        }
    }

    // getAnalyticsData() {
    //     const hoursWorked = this.activity.getMinutesInState(['Standing', 'Sitting']) / 60.00
    //     const hoursGoal = this.ruleEngine.getParameterInHours('param-work-day-minimum')
    //     const hoursStood = this.activity.getMinutesInState(['Standing']) / 60.00
    //     const standGoal = this.ruleEngine.getParameterInHours('param-stand-day-minimum')
        
    //     return {
    //         'Data Points': {
    //             'Hours Standing': hoursStood,
    //             'Hours Working': hoursWorked,
    //             'Day Hours Remaining': this.activity.getMinutesRemainingInDay() / 60.00,
    //             'Stand Hours Remaining': Math.max(standGoal - hoursStood, 0),
    //             'Work Hours Remaining': Math.max(hoursGoal - hoursWorked, 0),
    //             'Maximum Break Time': this.ruleEngine.getParameterInHours('param-absent-now-maximum') * 60.0,
    //             'Minimum Hours Standing': standGoal,
    //             'Minimum Hours Working': this.ruleEngine.getParameterInHours('param-work-day-minimum'),
    //             'Current State': this.activity.getCurrentState(true),
    //             'Raw State': this.activity.getCurrentState(false),
    //             'Breaks Taken': this.activity.getStateOccurrences(['Absent']).map(o => {
    //                 const obj = {}
    //                 obj[o.timestamp.toLocaleString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' })] = o.duration
    //                 return obj
    //             }),
    //         },
    //         'Goal Progress': {
    //             //'Ensure I work a full day': 'In Progress',
    //             //'Stop working the earliest I can': 'In Progress',
    //             //'Stand a minimum amount each day': 'Completed',
    //             //'Regularly switch to standing': 'Disabled',
    //             //'Regularly take a break and walk away': 'Failed',
    //             //'Ensure I am never away too long': 'Failed'
    //         }
    //     }
    // }
}
