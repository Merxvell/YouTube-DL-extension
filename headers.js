var tabId = parseInt(window.location.search.substring(1));
var mimeAudio = "mime=audio";
var mimeVideo = "mime=video";
var regexAudio = new RegExp("(https|http)://r[0-9]*---[a-zA-Z0-9!@#$%^*&()_+-=./?]*" + mimeAudio + "[a-zA-Z0-9!@#$%^*&()_+-=./?]*", "g")
var regexVideo = new RegExp("(https|http)://r[0-9]*---[a-zA-Z0-9!@#$%^*&()_+-=./?]*" + mimeVideo + "[a-zA-Z0-9!@#$%^*&()_+-=./?]*", "g")
var rangeDetection = new RegExp("range=[0-9]*-[0-9]*&")
var requestAudio = [];
var requestVideo = [];
var audio = document.getElementById("audio");
var video = document.getElementById("video");



window.addEventListener("load", function () {
  chrome.debugger.sendCommand({
    tabId: tabId
  }, "Network.enable");
  chrome.debugger.onEvent.addListener(onEvent);

});

window.addEventListener("unload", function () {
  chrome.debugger.detach({
    tabId: tabId
  });
});

var requests = {};

//this is the meat of the application
//will take in network requests and filter them
//via regexAudio and regexVideo. 
//ONLY WORKS ON THE TAB YOU ACTIVATE THE EXTENSION ON
//WILL NOT BE AFFECTED BY ANOTHER TAB
//network requests start after if (message == "Network.requestWillBeSent")
//if(!requestDiv){...} will monitor all requests
//afterwards if it matches the regex for audio or video
//what happens is it's pushed into the proper array depending on which is matches
//after getting 3 (this is an attempt to combat ads but fails)
//the download links will appear and the video & audio will be available for downloading
//link is constructed via eliminating the range parameter in the link
function onEvent(debuggeeId, message, params) {

  if (tabId != debuggeeId.tabId)
    return;

  if (message == "Network.requestWillBeSent") {
    var requestDiv = requests[params.requestId];
    console.log(requestAudio.length);
    console.log(requestVideo.length);

    if (!requestDiv) {
      //check if it matches regex audio
      if (regexAudio.test(params.request.url)) {
        requestAudio.push(String(params.request.url));


        if (requestAudio.length > 2) {
          var audio = document.getElementById("audio");
          var audioString = String(requestAudio[2]);
          var updatedLink = audioString.replace(rangeDetection,"");
          audio.style.display = "block";
          audio.href = updatedLink;
        }else{
          var audio = document.getElementById("audio");
          audio.style.display = "none";
        }
      } else if (regexVideo.test(params.request.url)) {
        requestVideo.push(String(params.request.url));
        
        if (requestVideo.length > 2) {
          var video = document.getElementById("video");
          var videoString = String(requestVideo[2]);
          var updatedLink = videoString.replace(rangeDetection,"");
          video.style.display = "block";
          video.href = updatedLink;
        }else{
          var video = document.getElementById("video");
          video.style.display = "none";
        }
      }
    }

    //keep
    if (params.redirectResponse)
      appendResponse(params.requestId, params.redirectResponse);



    //not super important to document
    // requestDiv.appendChild(requestLine);
    document.getElementById("links").appendChild(requestDiv);
  } else if (message == "Network.responseReceived") {
    appendResponse(params.requestId, params.response);
  }
}


//should only activate when the tab changes
//ex load a new video
//resets arrays so you can download the proper video and audio
chrome.tabs.onUpdated.addListener(
  function(tabId) {
    requestAudio = [];
    requestVideo = [];
  }
);