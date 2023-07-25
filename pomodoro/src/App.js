import React, { useState, useEffect, useRef } from 'react';
import { CirclePicker } from 'react-color';
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!./timeWorker.js';

import './App.scss';

function App() {
  const [time, setTime] = useState(1500);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [bgColor, setBgColor] = useState('#fff');

  const workerRef = useRef(null);

  useEffect(() => {
    // Create the worker when the component mounts
    if (!workerRef.current) {
      workerRef.current = new Worker();
    }
	console.log('workerRef.current', workerRef.current);

    if (active) {
      workerRef.current.onmessage = (event) => {
		console.log(event.data);
        setTime(event.data.time);
        document.title = event.data.formatTime;
      };
      workerRef.current.postMessage({ command: 'start', time, onBreak });
    } else if (!active) {
      console.log('stopping');
      workerRef.current.postMessage({ command: 'stop' });
	  workerRef.current.terminate();
	  workerRef.current = null;
    }

    // Terminate the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [active]); // Removed `time` from the dependency array

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const toggleColor = () => {
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.classList.toggle('colorPicker');
  };

  const handleColorChange = (color) => {
    const wrapper = document.getElementById('container');
    setBgColor(color.hex);
    toggleColor();
    wrapper.style.backgroundColor = color.hex;
  };

  return (
    <div className='App' id='container'>
      <h1>Pomodoro Timer</h1>
      <h2>
        {onBreak ? 'Break: ' : 'Work: '}
        {formatTime()}
      </h2>
      <p>{`Pomodoros Completed: ${count}`}</p>
      <div className='button-row'>
        <button onClick={() => toggleColor()}>Change Color</button>
        <button onClick={() => setActive(!active)}>
          {active ? 'Pause' : 'Start'}
        </button>
      </div>
      <div id='colorPicker' className='colorPicker'>
        <CirclePicker
          color={bgColor}
          onChange={(color) => handleColorChange(color)}
        />
      </div>
    </div>
  );
}

export default App;
