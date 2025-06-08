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
}

const App: React.FC = () => {
  const [time, setTime] = useState<number>(1500);
  const [active, setActive] = useState<boolean>(false);
  const [count] = useState<number>(0);
  const [onBreak] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>("#fff");

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (active) {
      // Create the worker using Vite's worker import syntax
      workerRef.current = new Worker(
        new URL("./timeWorker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      console.log("workerRef.current", workerRef.current);

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        console.log(event.data);
        setTime(event.data.time);
        document.title = event.data.formatTime;
      };

      const message: WorkerMessage = { command: "start", time, onBreak };
      workerRef.current.postMessage(message);
    } else if (!active && workerRef.current) {
      console.log("stopping");
      const message: WorkerMessage = { command: "stop" };
      workerRef.current.postMessage(message);
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Cleanup function
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [active, time, onBreak]);

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
    setActive(!active);
  };

  return (
    <div className="App" id="container">
      <h1>Pomodoro Timer</h1>
      <h2>
        {onBreak ? "Break: " : "Work: "}
        {formatTime()}
      </h2>
      <p>{`Pomodoros Completed: ${count}`}</p>
      <div className="button-row">
        <button onClick={toggleColor}>Change Color</button>
        <button onClick={handleToggleTimer}>
          {active ? "Pause" : "Start"}
        </button>
      </div>
      <div id="colorPicker" className="colorPicker">
        <CirclePicker color={bgColor} onChange={handleColorChange} />
      </div>
    </div>
  );
};

export default App;
