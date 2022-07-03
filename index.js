let AppConfig = null
let UserConfig = null

const getNow = () => new Date(Date.now())

window.addEventListener('DOMContentLoaded', async () => {
	AppConfig = await AppConfiguration.fromJson('./data/application.json', standzaAPI.writeFile)
	UserConfig = await UserConfiguration.fromJson('./data/user.json', standzaAPI.writeFile)
	
	document.body.classList.add('loading')
	
	setupSettings()

	const drawer = new DrawerComponent(document.body, AppConfig.tabs)
	const schedule = new ScheduleComponent(
		document.getElementById('schedule-list'),
		UserConfig.schedule
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
		AppConfig.Visualizations
	)
	const rules = new RuleEngine(
		UserConfig.goals,
		AppConfig.Goals,
		AppConfig.Triggers,
		audio
	)

	const stateManager = new StateManager(
		camera,
		UserConfig.schedule,
		UserConfig.parameters,
		() => UserConfig.refreshRate,
		() => UserConfig.stateChangeTolerance
	)
	stateManager.log(getNow(), await camera.getCurrentPersonState())
	stateManager.hooks.push(s => rules.run(s))
	stateManager.hooks.push(s => vizManager.setData(s))
	await stateManager.run()
	document.body.classList.remove('loading')
})
