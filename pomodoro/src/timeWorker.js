/* eslint-disable */

let time = 1500;
let onBreak = false;
let active = false;

const formatTime = () => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

self.onmessage = (event) => {
  if (event.data.onBreak) {
    onBreak = true;
  }
  if (event.data.command === 'start') {
    time = event.data.time;
    active = true;
    // Start the timer...
  } else if (event.data.command === 'stop') {
    console.log('stopping')
    clearInterval(interval);
  }
};

const interval = setInterval(() => {
  if (active) {
    time--;
    self.postMessage({
      time: time,
      formatTime: onBreak ? `Break ${time}` : `Work: ${formatTime()}`,
    });
  }
}, 1000);
