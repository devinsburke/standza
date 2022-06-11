var tabs = ['home','progress','calendar','settings','preview']
var AppConfig = null
var UserConfig = null
var stateManager = null
var visualizationManager = null

const getNow = () => new Date(Date.now())
const dateutil = {
	toHMS: (ms) => new Date(ms).toISOString().substring(11, 19)
}

function changeTab(tabName) {
	document.querySelectorAll('.selected-tab').forEach(b => b.classList.remove('selected-tab'))
	document.getElementById('tab-' + tabName).classList.add('selected-tab')
	const container = document.getElementById('content-container')
	tabs.forEach(t => container.classList.remove(t))
	container.classList.add(tabName)
}

(async () => {
	AppConfig = await AppConfiguration.fromJson("./data/application.json")
	UserConfig = await UserConfiguration.fromJson("./data/user.json")
	setupSchedule(UserConfig.schedule)
	setupSettings()

	// TODO: Remove window.visualizationManager references in favor of dependency injection.
	visualizationManager = new VisualizationManager(AppConfig.Visualizations)
	stateManager = new StateManager(
		new ActivityLog(
			UserConfig.schedule,
			UserConfig.stateChangeTolerance
		),
		new CameraProcessor(
			'video',
			document.getElementById('capture-wrapper'),
			window.picamera,
			window.tensorflow
		),
		new RuleEngine(
			UserConfig.goals,
			AppConfig.Goals,
			AppConfig.Triggers,
			new AudioPlayer(
				document.getElementById('audio-container'),
				'./audio/${soundId}.mp3'
			)
		),
		visualizationManager,
		UserConfig.parameters,
		UserConfig.refreshInterval
	)
	stateManager.ruleEngine.audioPlayer.buildChime('.chime')
	await stateManager.camera.setupCamera()
	await stateManager.start()
})();
