let path = "/admin/tournaments/90/raw"
let url = ""
chrome.runtime.onMessage.addListener(({message, data, sender}) => {
  console.log(sender + ":" + message)
  if (sender == "popup") {
    url = data.url + path
    return
  }
  if (sender == "content" && message == "leaderboard") {
    let url = data.url + path
    const form_data = new URLSearchParams();
    const leaderboard = data.leaderboard
    form_data.append('data', JSON.stringify(leaderboard));
    console.log("fetching:" + url)
    chrome.runtime.sendMessage({message:"fetchStart", sender:"background"})
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
      chrome.runtime.sendMessage({message:"fetchComplete", sender:"background"})
      console.log("done");
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
});

