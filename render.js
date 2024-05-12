console.log('👋 This message is being logged by "renderer.js", included via webpack');

const { ipcRenderer } = require('electron');
const { writeFile } = require('fs');

let mediaRecorder;
let recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  startRecording();
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

const selectMenu = document.getElementById('selectMenu')

async function getVideoSources() {
  //clear select menu if invoked to prevent appending to an existing list
    selectMenu.innerHTML = '';
    const inputSources = await ipcRenderer.invoke('getSources')
    console.log(inputSources);

    inputSources.forEach(source => {
      const element = document.createElement("option")
      element.value = source.id
      element.innerHTML = source.name
      selectMenu.appendChild(element)
    });
  }


  async function startRecording() {
    const screenId = selectMenu.options[selectMenu.selectedIndex].value
    
    // AUDIO WONT WORK ON MACOS
    const IS_MACOS = await ipcRenderer.invoke("getOperatingSystem") === 'darwin'
    console.log(await ipcRenderer.invoke('getOperatingSystem'))
    const audio = !IS_MACOS ? {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    } : false
  
    const constraints = {
      //adjust constraints here
      audio,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenId,
        }
      }
    };
  
    // Create a Stream
    const stream = await navigator.mediaDevices
      .getUserMedia(constraints);
  
    // Preview the source in a video element
    videoElement.srcObject = stream;
    //Fix audio recording issues (multiple & repeating) - muted works
    videoElement.muted = true;
    await videoElement.play();
  
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = stopRecording;
    mediaRecorder.start();
  }

function onDataAvailable(e) {
    recordedChunks.push(e.data);
}


async function stopRecording() {
    videoElement.srcObject = null

    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });
  
    const buffer = Buffer.from(await blob.arrayBuffer());
    recordedChunks = []

    const { canceled, filePath } =  await ipcRenderer.invoke('showSaveDialog')
    if(canceled) return
  
    if (filePath) {
      writeFile(filePath, buffer, () => console.log('video saved successfully!'));
    }
  }

  //TODO: pick quality, preview on source selection?, microphone capture? 