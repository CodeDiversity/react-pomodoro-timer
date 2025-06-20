import React, { useState, useEffect, useRef } from "react";
import { CirclePicker, ColorResult } from "react-color";
import "./App.scss";

interface WorkerMessage {
  command: "start" | "stop";
  time?: number;
  onBreak?: boolean;
}

interface WorkerResponse {
  time: number;
  formatTime: string;
  completed?: boolean;
}

const DURATION_OPTIONS = [
  { label: "15 minutes", value: 900 },
  { label: "20 minutes", value: 1200 },
  { label: "25 minutes", value: 1500 },
  { label: "30 minutes", value: 1800 },
  { label: "45 minutes", value: 2700 },
];

const App: React.FC = () => {
  const [time, setTime] = useState<number>(1500);
  const [duration, setDuration] = useState<number>(1500);
  const [active, setActive] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [onBreak] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>("#fff");
  const [lastCompletedDuration, setLastCompletedDuration] = useState<
    number | null
  >(null);
  const [currentSessionDuration, setCurrentSessionDuration] = useState<
    number | null
  >(null);

  const workerRef = useRef<Worker | null>(null);

  // Worker creation and cleanup (Single Responsibility: Worker lifecycle)
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Handle timer completion (Single Responsibility: Completion logic)
  const handleTimerCompletion = (): void => {
    setActive(false);
    setCount((prevCount) => prevCount + 1);
    setLastCompletedDuration(currentSessionDuration ?? duration);
  };

  // Setup worker message handler (Single Responsibility: Message handling)
  const setupWorkerMessageHandler = (worker: Worker): void => {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      console.log(event.data);
      setTime(event.data.time);
      document.title = event.data.formatTime;

      if (event.data.completed) {
        handleTimerCompletion();
      }
    };
  };

  // Create worker (Single Responsibility: Worker creation)
  const createWorker = (): Worker => {
    const worker = new Worker(new URL("./timeWorker.ts", import.meta.url), {
      type: "module",
    });
    setupWorkerMessageHandler(worker);
    return worker;
  };

  // Start timer (Single Responsibility: Starting timer)
  const startTimer = (): void => {
    workerRef.current ??= createWorker();
    const message: WorkerMessage = { command: "start", time: time, onBreak };
    workerRef.current.postMessage(message);
  };

  // Stop timer (Single Responsibility: Stopping timer)
  const stopTimer = (): void => {
    if (workerRef.current) {
      const message: WorkerMessage = { command: "stop" };
      workerRef.current.postMessage(message);
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  // Handle active state changes (Single Responsibility: Active state management)
  useEffect(() => {
    if (active) {
      startTimer();
    } else if (workerRef.current) {
      stopTimer();
    }
  }, [active]);

  const formatTime = (): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleColor = (): void => {
    const colorPicker = document.getElementById("colorPicker");
    if (colorPicker) {
      colorPicker.classList.toggle("colorPicker");
    }
  };

  const handleColorChange = (color: ColorResult): void => {
    const wrapper = document.getElementById("container");
    setBgColor(color.hex);
    toggleColor();
    if (wrapper) {
      wrapper.style.backgroundColor = color.hex;
    }
  };

  const handleToggleTimer = (): void => {
    if (!active) {
      // If we just completed a session, use that duration; otherwise use selected duration
      const nextDuration = lastCompletedDuration ?? duration;
      setTime(nextDuration);
      setCurrentSessionDuration(nextDuration);
      // Clear the completed duration once we start a new session
      setLastCompletedDuration(null);
    }
    setActive(!active);
  };

  const handleDurationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const newDuration = parseInt(event.target.value);
    setDuration(newDuration);
    if (!active) {
      setTime(newDuration);
    }
  };

  return (
    <div className="App" id="container">
      <h1>Pomodoro Timer</h1>
      <h2>
        {onBreak ? "Break: " : "Work: "}
        {formatTime()}
      </h2>
      <p>{`Pomodoros Completed: ${count}`}</p>
      <div className="controls">
        <div className="duration-selector">
          <label htmlFor="duration">Duration:</label>
          <select
            id="duration"
            value={duration}
            onChange={handleDurationChange}
            disabled={active}
            className="duration-dropdown"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="button-row">
          <button onClick={toggleColor}>Change Color</button>
          <button onClick={handleToggleTimer}>
            {active ? "Pause" : "Start"}
          </button>
        </div>
      </div>
      <div id="colorPicker" className="colorPicker">
        <CirclePicker color={bgColor} onChange={handleColorChange} />
      </div>
    </div>
  );
};

export default App;
