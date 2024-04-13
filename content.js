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
   let back_nine = false
   if (player_name.indexOf('*') != -1) {
     back_nine = true
   }
   player_name = player_name.replace("*","")
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
   let thru = 0
   let scores = Array.from(player_e.getElementsByClassName('score'))
   let sequence = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]
   if (back_nine) {
		sequence = [9,10,11,12,13,14,15,16,17,0,1,2,3,4,5,6,7,8]
   }
   for (const s of sequence) {
     let score_e = scores[s]
      if (score_e == undefined || score_e == null) {
				continue
      }
     let ou = score_e.firstChild.innerText
     let par = pars[s]
     index++
     if (ou == null || ou == undefined || ou == "") {
       player_data.scores[s] = null
     } else {
       ou = parseInt(ou)
       if (score_e.firstChild.getAttribute("class") == "data under") {
        ou = 0 - ou
       } else if (score_e.firstChild.getAttribute("class") == "data over") {
         ou = 0 + ou
       }
       let diff = -1 * (prior - ou)
       player_data.thru = s
       prior = ou
       player_data.scores[s] = (par + diff)
     }
   }
   data.push(player_data)
  }
  return data
}

Extension.stop = function(interval) {
	Extension.button.textContent = "Start"
	Extension.dot.style.backgroundColor = "red"
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
    leaderboard,
  }
  chrome.runtime.sendMessage({message:"leaderboard", data, sender:"content"})
}

Extension.start = function() {
	let url = document.getElementById('url').value
	Extension.url = url
	Extension.button.textContent = "Stop"
	Extension.dot.style.backgroundColor = "green"
  Extension.run()
  const intervalTime = 2 * 60 * 1000;
  let interval = setInterval(function() {
    Extension.run()
  }, intervalTime)
  Extension.interval = interval
  console.log("Extension url:" + url + ":" + "interval:" + interval + " started")
}

chrome.runtime.onMessage.addListener(({message, sender, data}) => {
	console.log("message:" + message)
  if (message == "stop") {
    Extension.stop(data.interval)
  }
  if (message == "start") {
    Extension.start()
  }
	if (message == "fetchStart") {
		Extension.button.setAttribute("disabled", true)
		Extension.button.textContent = "Updating..."
		Extension.dot.style.backgroundColor = "orange"
	}
	if (message == "fetchComplete" || message == "fetchError") {
		Extension.button.removeAttribute("disabled")
	  let content = Extension.status == "running" ? "Stop" : "Start"
		Extension.button.textContent = content
		Extension.dot.style.backgroundColor = Extension.status == "running" ? "green" : "red"
	}
})

Extension.setup = function() {
	const dot = document.createElement('span');
	dot.style.height='10px';
	dot.style.width='10px';
	dot.style.backgroundColor='red';
	dot.style.borderRadius='50%';
	dot.style.marginLeft='10px';
	dot.style.display='inline-block';

	const div = document.createElement('div');
	const input = document.createElement('input');
	input.setAttribute("type","text")
	input.value = "http://localhost:3000"
	input.setAttribute("id","url")
	const button = document.createElement('button');
	button.textContent = 'Start';
	button.setAttribute("id", "button")
	button.style.width='80px'
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
	div.appendChild(dot)

	// set the position and top/left CSS properties
	div.style.position = 'fixed';
	div.style.top = '0px';
	div.style.left = '0px';
	div.style.zIndex = 1000;
	div.style.backgroundColor = "white"
	div.style.padding = "10px"
	div.style.border = "1px solid black"


	// append the button to the body of the page
	document.body.appendChild(div);
	Extension.button = button
	Extension.dot = dot
}

Extension.setup()
