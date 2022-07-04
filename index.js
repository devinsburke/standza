let appConfig = null
let userConfig = null

const getNow = () => new Date(Date.now())

window.addEventListener('DOMContentLoaded', async () => {
	appConfig = await AppConfiguration.fromJson('./data/application.json', standzaAPI.writeFile)
	userConfig = await UserConfiguration.fromJson('./data/user.json', standzaAPI.writeFile)
	
	document.body.classList.add('loading')
	
	setupSettings()

	const drawer = new DrawerComponent(document.body, appConfig.tabs)
	const schedule = new ScheduleComponent(
		document.getElementById('schedule-list'),
		userConfig.schedule
	)
	const audio = new AudioComponent(document.body)

	const camera = new CameraProcessor(
		'video',
		document.getElementById('camera'),
		standzaAPI.estimatePose,
		standzaAPI.snapCameraImage
	)
	await camera.setupCamera()

	const vizManager = new VisualizationManager(
		document.getElementById('home'),
		appConfig.visualizations
	)
	const rules = new RuleEngine(
		userConfig.goals,
		appConfig.goals,
		appConfig.triggers,
		audio
	)

	const stateManager = new StateManager(
		camera,
		userConfig.schedule,
		userConfig.parameters,
		() => userConfig.refreshRate,
		() => userConfig.stateChangeTolerance
	)
	stateManager.log(getNow(), await camera.getCurrentPersonState())
	stateManager.hooks.push(s => rules.run(s))
	stateManager.hooks.push(s => vizManager.setData(s))
	await stateManager.run()
	document.body.classList.remove('loading')
})
