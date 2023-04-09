let path = "/admin/tournaments/90/raw"
let url = ""
chrome.runtime.onMessage.addListener(({message, data, sender}, message_sender) => {
  console.log(sender + ":" + message)
  if (sender == "content" && message == "leaderboard") {
		const tab_id = message_sender.tab.id
    let url = data.url + path
    const form_data = new URLSearchParams();
    const leaderboard = data.leaderboard
    form_data.append('data', JSON.stringify(leaderboard));
    console.log("fetching:" + url)
    chrome.tabs.sendMessage(tab_id, {message:"fetchStart", sender:"background"})
    fetch(url, {
      method: 'POST',
      body: form_data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(response => {
      if (!response.ok && !response.redirected) {
        throw new Error('Network response was not ok');
      }
			chrome.tabs.sendMessage(tab_id, {message:"fetchComplete", sender:"background"})
      console.log("done");
    })
    .catch(error => {
			chrome.tabs.sendMessage(tab_id, {message:"fetchError", sender:"background"})
      console.error('Error:', error);
    });
  }
});

