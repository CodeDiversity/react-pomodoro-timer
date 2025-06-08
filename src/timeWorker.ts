interface WorkerMessage {
  command: 'start' | 'stop';
  time?: number;
  onBreak?: boolean;
}

interface WorkerResponse {
  time: number;
  formatTime: string;
}

let time = 1500;
let onBreak = false;
let active = false;
let interval: number | null = null;

const formatTime = (): string => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  if (event.data.onBreak) {
    onBreak = true;
  }

  if (event.data.command === 'start') {
    time = event.data.time || 1500;
    active = true;

    if (interval) {
      clearInterval(interval);
    }

    interval = setInterval(() => {
      if (active && time > 0) {
        time--;
        const response: WorkerResponse = {
          time: time,
          formatTime: onBreak ? `Break: ${formatTime()}` : `Work: ${formatTime()}`,
        };
        self.postMessage(response);
      }
    }, 1000);
  } else if (event.data.command === 'stop') {
    console.log('stopping');
    active = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
}; 