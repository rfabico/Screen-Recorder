const { desktopCapturer, ipcRenderer } = require('electron');

const { writeFile } = require('fs');


// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

// Buttons
const videoElement = document.querySelector('video');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('is-danger');
  startBtn.innerText = 'Start';
};

const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.addEventListener('click', getVideoSources);

// Get the available video sources
async function getVideoSources() {

  const sources = await desktopCapturer.getSources({
    types:['screen'],
    thumbnailSize: {width:maxWidth, height:maxHeight},
  });
  return sources.map(source => source.thumbnail)
    /*desktopCapturer.getSources({ types: ['window', 'screen'] })
        .then(async inputSources => {
            const sources = inputSources.map(source => ({ name: source.name, id: source.id }));
            // Send sources to main process via ipcRenderer
            return ipcRenderer.invoke('electron-menu', sources);
        })
        .catch(error => {
            console.error('Error getting video sources:', error);
        });*/
}

ipcRenderer.on('menuselect', (event, source) => {
    selectSource(source)
})
// Change the videoSource window to record
async function selectSource(source) {

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const filePath = await ipcRenderer.invoke('electron-dialog', 
    {'defaultPath': `myvid-${Date.now()}.webm`, 'buttonLabel': 'Save recorded video'}
  );

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }

}



/*// In the renderer process
const { ipcRenderer } = require('electron');
function sendCaptureAreaInfo(captureArea, windowId) {
  ipcRenderer.send('capture-area-info', { captureArea, windowId });
}
// In the main process
const { ipcMain } = require('electron');
ipcMain.on('capture-area-info', (event, { captureArea, windowId }) => {
  // Image processing based on capture area and window ID is performed here.
});*/
//Upon user selection of a capture area, the area information along with the ID of the capture window is sent to the main process. The main process uses this information to process the image of the selected area and perform necessary actions (e.g., image saving, OCR processing).