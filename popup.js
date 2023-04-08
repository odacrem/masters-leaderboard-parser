const injectFunction = document.getElementById('inject-function');

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

chrome.runtime.onMessage.addListener(({message, sender, data}) => {
	console.log(message + ":" + sender)
	if (sender  == "content" && message == "started") {
		let {interval} = data
		injectFunction.innerText = "Stop:" + interval
		injectFunction.interval = interval
		chrome.storage.local.set({interval})
	}
	if (sender  == "content" && message == "stopped") {
		injectFunction.innerText = "Start"
		delete injectFunction.interval
		chrome.storage.local.remove(["interval"])
	}
	if (sender == "background" && message == "fetchStart") {
		document.body.style.backgroundColor = "yellow";
	}
	if (sender == "background" && message == "fetchComplete") {
		document.body.style.backgroundColor = "green";
	}
})

function showAlert(givenName) {
	chrome.runtime.onMessage.addListener(({message, sender, data}) => {
		console.log(message + ":" + sender)
		if (message == "stop") {
			aapp.stop(data.interval)
		}
		if (message == "start") {
			aapp.start()
		}
	})
	const parseLeaderboard = function() {
		let data = []
		let players_e = document.getElementsByClassName('playerRow')
		let holes_e = document.getElementsByClassName("par")[0].getElementsByClassName("hole")
		let pars =[]
		for (const hole of holes_e) {
		 let par = parseInt(hole.firstChild.innerText)
			pars.push(par)
		}
		for (const player_e of players_e) {
		 let player_name = player_e.getElementsByClassName('playerName')[0].lastChild.innerText.toLowerCase();
		 player_name = player_name.replace("(a)","")
		 player_name  = player_name.trim()
		 switch (player_name) {
			case "lee, m.w." :
				//player_name = ""
			 break;

		 }
		 //console.warn(player_name)
		 let player_data = {name:player_name, scores:[],thru:0}
		 let prior = player_e.getElementsByClassName('prior')[0].firstChild
		 if (prior.getAttribute("class") == "data under") {
			 prior = 0 - parseInt(prior.innerText)
		 } else if (prior.getAttribute("class") == "data over") {
			 prior = 0 + parseInt(prior.innerText)
		 } else {
				prior = 0
		 }
		 let last = prior
		 let index = 0
		 for (const score_e of player_e.getElementsByClassName('score')) {
			 let ou = score_e.firstChild.innerText
			 let par = pars[index]
			 index++
			 if (ou == null || ou == undefined || ou == "") {
				continue
			 }
			 ou = parseInt(ou)
			 if (score_e.firstChild.getAttribute("class") == "data under") {
				ou = 0 - ou
			 } else if (score_e.firstChild.getAttribute("class") == "data over") {
				 ou = 0 + ou
			 }
			 let diff = -1 * (prior - ou)
			 player_data.thru = index
			 prior = ou
			 player_data.scores.push(par + diff)
		 }
		 data.push(player_data)
		}
		return data
	}
	let aapp = {}
	aapp.stop = function(interval) {
		clearInterval(interval)
		delete aapp.interval
		chrome.runtime.sendMessage({message:"stopped", sender:"content"})
		console.log("interval:" + interval + " stopped")
	}
	aapp.start = function() {
		const intervalTime = 2 * 60 * 1000;
		let interval = setInterval(function() {
			let leaderboard = parseLeaderboard()
			let data = {
				leaderboard
			}
			chrome.runtime.sendMessage({message:"leaderboard", data, sender:"content"})
		}, intervalTime)
		aapp.interval = interval
		chrome.runtime.sendMessage({message:"started", data:{interval}, sender:"content"})
		console.log("interval:" + interval + " started")
	}
}
let init = false
injectFunction.addEventListener('click', async () => {
	const tab = await getCurrentTab();
	if (init == false) {
		const url = document.getElementById('4x4url').value
		await chrome.storage.local.set({ url })
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: showAlert,
			args: [url]
		});
		init = true
	}
	let result = await chrome.storage.local.get(["url", "interval"])
	if (result.interval == undefined) {
		console.log("start")
		chrome.tabs.sendMessage(tab.id, {message:"start", data:{...result}, sender:"popup"})
		chrome.runtime.sendMessage({message:"start", data:{...result}, sender:"popup"})
	} else {
		console.log("stop")
		let {interval} = result
		chrome.tabs.sendMessage(tab.id, { message:"stop", data:{interval}, sender:"popup"})
	}
});
window.onload = function() {
	chrome.storage.local.get(["url", "interval"]).then((result) => {
		let url = result.url || "http://localhost:3000"
		document.getElementById('4x4url').value = result.url
		let interval = result.interval
		if (interval != undefined) {
			injectFunction.interval = interval
			injectFunction.innerText = "Stop:" + interval
		}
	});
}
