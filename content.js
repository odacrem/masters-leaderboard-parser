let Extension = {status:"stopped"}
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

Extension.stop = function(interval) {
	Extension.button.textContent = "Start"
  Extension.status = "stopped"
  console.log("Extension url:" + Extension.url + ":" + "interval:" + Extension.interval + " stopped")
  clearInterval(Extension.interval)
  delete Extension.interval
}

Extension.run = function() {
	let url = Extension.url
  Extension.status = "running"
  let leaderboard = parseLeaderboard()
  let data = {
		url,
    leaderboard
  }
  chrome.runtime.sendMessage({message:"leaderboard", data, sender:"content"})
}

Extension.start = function() {
	let url = document.getElementById('url').value
	Extension.url = url
	Extension.button.textContent = "Stop"
  Extension.run()
  const intervalTime = 2 * 60 * 1000;
  let interval = setInterval(function() {
    Extension.run()
  }, intervalTime)
  Extension.interval = interval
  console.log("Extension url:" + url + ":" + "interval:" + interval + " started")
}

chrome.runtime.onMessage.addListener(({message, sender, data}) => {
  if (message == "stop") {
    Extension.stop(data.interval)
  }
  if (message == "start") {
    Extension.start()
  }
})

setInterval(function() {
  console.log("Extension:" + Extension.status + ":" + Extension.interval)
},5000)

const div = document.createElement('div');

const input = document.createElement('input');
input.setAttribute("type","text")
input.value = "http://localhost:3000"
input.setAttribute("id","url")

const button = document.createElement('button');
button.textContent = 'Start';
button.setAttribute("id", "button")

// add an event listener to the button
button.addEventListener('click', () => {
	if (Extension.interval) {
		Extension.stop()
	} else {
		Extension.start()
	}
});
div.appendChild(input)
div.appendChild(button)

// set the position and top/left CSS properties
div.style.position = 'fixed';
div.style.top = '10px';
div.style.left = '10px';
div.style.zIndex = 1000;

// append the button to the body of the page
document.body.appendChild(div);
Extension.button = button
