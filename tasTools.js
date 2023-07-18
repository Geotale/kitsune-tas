{
	/* If something to reset exists, reset it */
	/*
 		Executing the restore function more than once shouldn't 
	 	cause any issues!
	*/
	if (window.restoreOverride) {
		window.restoreOverride();
	}


	/* Primarily for setting inputs */
	/* Currently unfinished and unused */
	const prevGetGamepads = navigator.getGamepads.bind(navigator);

	const inputs = [];
	let frame = 0;

	const defaultInput = {
		mouse: [0, 0],
		click: false,
		axes: [0, 0],
		action: false,
		pause: false
	};

	const gamepads = [
		{
			axes: [0, 0],
			buttons: [
				{
					pressed: false
				},
				{
					pressed: false
				}
			]
		}
	];
	
	function pressInput (frame) {
		const input = (frame < 0 || frame >= inputs.length ? defaultInput : inputs[frame]);
		
		gamepads[0].axes = input.axes;
		gamepads[0].buttons[0].pressed = input.action;
		gamepads[0].buttons[1].pressed = input.pause;
	}

	navigator.getGamepads = function () {
		return gamepads;
	};
	
	/* Primarily for controlling speed / pausing */
	const fps = 30;
	
	let speed = 1;
	let tooFastFrames = 0;
	
	let id = 0;

	let curDateNow = Date.now();
	let curPerformanceNow = performance.now();

	const prevDateNow = Date.now.bind(Date);
	const prevPerformanceNow = performance.now.bind(performance);
	const prevRequestAnimFrame = requestAnimationFrame;
	const prevCancelAnimFrame = cancelAnimationFrame;
	const prevSetTimeout = setTimeout;
	const prevClearTimeout = clearTimeout;
	const prevSetInterval = setInterval;
	const prevClearInterval = clearInterval;

	Date.now = function () {
		return curDateNow;
	};
	performance.now = function () {
		return curPerformanceNow;
	};


	/* All callbacks */
	const queue = {};
	let running = true;

	let prevTime = curPerformanceNow;
	let realPrevTime = curPerformanceNow;
	let secondStart = curPerformanceNow;
	let count = 1;
	let count2 = 0;
	function refresh () {
		if (!running) {
			return;
		}
		prevRequestAnimFrame(refresh);
		
		const curTime = prevPerformanceNow();
		const interval = 1000 / (fps * speed);
		
		if (running && curTime - prevTime >= interval) {
			for (let j = 0; j <= tooFastFrames && curTime - prevTime >= interval; j++) {
				pressInput(frame);
				prevTime += interval;
				curDateNow += 1000 / fps;
				curPerformanceNow += 1000 / fps;
	
				realPrevTime = curTime;
				
				for (const i in queue) {
					queue[i].delay -= 1000 / fps;
					
					if (queue[i].delay <= 0) {
						/* Done in this order for setInterval to be nicer */
						const callback = queue[i].callback;
						delete queue[i];
						callback();
					}
				}
				frame++;
			}

			if (curTime - prevTime > interval) {
				prevTime = curTime;
			}
		}
	}
	refresh();
	
	
	window.requestAnimationFrame = function (callback) {
		const reqID = id++;
		
		queue[reqID] = {
			callback: () => { callback(curDateNow) },
			delay: 0
		};
		return reqID;
	};

	window.cancelAnimationFrame = function (id) {
		delete queue[id];
	};

	window.setTimeout = function (callback, delay, ...params) {
		const reqID = id++;

		queue[reqID] = {
			callback: () => { callback(...params) },
			delay: delay
		};
	};

	window.clearTimeout = function (id) {
		delete queue[id];
	};
	
	window.setInterval = function (callback, delay, ...params) {
		const reqID = id++;

		function intervalCallback () {
			queue[reqID] = {
				callback: () => { (running ? intervalCallback() : setInterval(...arguments)); callback(...params) },
				delay: delay
			};
		}
		intervalCallback();

		return reqID;
	};

	window.clearInterval = function (id) {
		delete queue[id];
	};



	/* Primarily for savestates */
	const mappings = Wv.Jc.Dk.Jc;
	mappings.Ea[5].splice(mappings.Ea[5].indexOf(49), 1);
	delete mappings.tb[49];
	
	const states = [null, null, null, null, null];
	
	function SaveState () {
		const context = so.d1;
	
		const storage = {};
		for (const key in localStorage) {
			if (key.startsWith("KITSUNE_")) {
				storage[key] = localStorage.getItem(key);
			}
		}

		const mainCtx = context.split(":")[0].split("@")[0];
		switch (mainCtx) {
			case "overworld": {
				const scene = Wv.ha.children[0].o;
				const LuckyPosInfo = scene.instance;
				const LuckyVelInfo = LuckyPosInfo.ec.get(M);
			
				const pos = new Ge(LuckyPosInfo.tb.x, LuckyPosInfo.tb.y);
				const scroll = { x: scene.x, y: scene.y };
				const cooldown = LuckyPosInfo.ec.get(Bi).Rea;
				const velocity = new Ge(LuckyVelInfo.velocity.x, LuckyVelInfo.velocity.y);
				const direction = LuckyPosInfo.ec.get(bi).direction;

				return {
					context,
					mainCtx,
					pos,
					scroll,
					cooldown,
					velocity,
					direction,
					storage
				};
			}
				
			case "interior": {
				const scene = Wv.Jc.tb.$e;
				const LuckyPosInfo = scene.get(li)[0];
			
				const pos = new Ge(LuckyPosInfo.x, LuckyPosInfo.y);

				return {
					context,
					mainCtx,
					pos,
					storage
				};
			}				
				
			default: {
				throw new Error(`Unable to create savestate for context '${mainCtx}'`);
			}
		}
	}
	
	function LoadState (state) {
		function finishLoadState () {
			switch (state.mainCtx) {
				case "overworld": {
					if (!(Wv.ha.children[0].o?.instance?.ec)) {
						requestAnimationFrame(finishLoadState);
						return;
					}
					const scene = Wv.ha.children[0].o;
					const LuckyPosInfo = scene.instance;
					const LuckyVelInfo = LuckyPosInfo.ec.get(M);
				
					LuckyPosInfo.tb = new Ge(state.pos.x, state.pos.y);
					scene.x = state.scroll.x;
					scene.y = state.scroll.y;
					LuckyPosInfo.ec.get(Bi).Rea = state.cooldown;
					LuckyVelInfo.velocity = new Ge(state.velocity.x, state.velocity.y);
					LuckyPosInfo.ec.get(bi).direction = state.direction;
					
					break;
				}

				case "interior": {
					if (!(Wv.Jc.tb.$e?.get(li)?.[0])) {
						requestAnimationFrame(finishLoadState);
						return;
					}
					const scene = Wv.Jc.tb.$e;
					const LuckyPosInfo = scene.get(li)[0];
				
					LuckyPosInfo.x = state.pos.x;
					LuckyPosInfo.y = state.pos.y;
					break;
				}
					
				default: {
					throw new Error(`Unable to load savestate for context '${state.mainCtx}'`);
				}
			}
		}

		let mainCtx = "";
		if (so.d1 !== state.context) {
			let ctx = state.context;
			const args = [];
			
			if (ctx.includes("@")) {
				const split = ctx.split("@");
				args.unshift(split[1]);
				ctx = split[0];
			}
			if (ctx.includes(":")) {
				const split = ctx.split(":");
				args.unshift(split[1]);
				ctx = split[0];
			}
			args.unshift(ctx);

			const prevMainCtx = so.d1.split(":")[0].split("@")[0];
			if (prevMainCtx !== "overworld" || state.mainCtx !== "overworld") {
				Mq(Wv.Jc, new $n(...args));
			}
			finishLoadState();
		} else {
			finishLoadState();
		}
		
		const storage = {};
		for (const key in localStorage) {
			if (key.startsWith("KITSUNE_")) {
				localStorage.removeItem(key);
			}
		}
		for (const key in state.storage) {
			localStorage.setItem(key, state.storage[key]);
		}
	}

	
	const keydown = function (evt) {
		if ("0123456789".includes(evt.key)) {
			const idx = (+evt.key + 9) % 10;

			if (idx < 5) {
				evt.preventDefault();
				states[idx] = SaveState();
			} else {
				if (states[idx] !== null) {
					evt.preventDefault();
					LoadState(states[idx - 5]);
				}
			}
		}
	};
	document.getElementById("hplogo2").addEventListener("keydown", keydown);


	/* For restoring the game back to its previous state */
	/* Used when either rerunning the code, or simply removing it */
	window.restoreOverride = function () {
		running = false;
		navigator.getGamepads = prevGetGamepads;
		Date.now = prevDateNow.bind(Date);
		performance.now = prevPerformanceNow.bind(performance);
		window.requestAnimationFrame = prevRequestAnimFrame;
		window.cancelAnimationFrame = prevCancelAnimFrame;
		window.setTimeout = prevSetTimeout;
		window.clearTimeout = prevClearTimeout;
		window.setInterval = prevSetInterval;
		window.clearInterval = prevClearInterval;
		document.getElementById("hplogo2").removeEventListener("keydown", keydown);
		
		for (const i in queue) {
			queue[i].callback();
			delete queue[i];
		}
	};
}
