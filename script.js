document.addEventListener("DOMContentLoaded", function () {
  const cake = document.querySelector(".cake");
  const candleCountDisplay = document.getElementById("candleCount");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;

  // --- LOCAL STORAGE KEY ---
  const CANDLE_STORAGE_KEY = "virtualCakeCandles";
  const INITIAL_CANDLE_COUNT = 18; // Set for the 18th birthday!

  // --- HELPER FUNCTIONS ---

  /**
   * Loads candle data from Local Storage and draws them.
   * If storage is empty, it calls setInitialCandles(18).
   */
  function loadCandles() {
    const storedCandles = localStorage.getItem(CANDLE_STORAGE_KEY);
    
    if (storedCandles) {
      const positions = JSON.parse(storedCandles);
      
      // If data was found, draw the saved candles
      if (positions.length > 0) {
          positions.forEach(pos => {
            // false: do not save again, just draw
            addCandle(pos.left, pos.top, false); 
          });
      } else {
          // If storage contained an empty array, set the initial candles
          setInitialCandles(INITIAL_CANDLE_COUNT);
      }
    } else {
        // If storage was completely empty (true first visit), set the initial 18
        setInitialCandles(INITIAL_CANDLE_COUNT);
    }
  }

  /**
   * Generates initial candles in fixed random positions and saves them.
   * This is only called on the very first load for a new user.
   */
  function setInitialCandles(count) {
      for (let i = 0; i < count; i++) {
          // Generate semi-random positions within the cake bounds (left: 40px to 210px)
          const left = 40 + Math.random() * 170; 
          // Generate semi-random positions near the top of the icing (top: -10px to 10px)
          const top = -10 + Math.random() * 20; 
          
          // Add the candle and save it (true)
          addCandle(left, top, true);
      }
  }

  /**
   * Saves the current positions of all candles to Local Storage.
   */
  function saveCandles() {
    // 1. Map the current candle elements to an array of position objects
    const positionsToSave = candles.map(candle => ({
      // Get the 'left' and 'top' styles, convert them to numbers
      left: parseFloat(candle.style.left),
      top: parseFloat(candle.style.top)
    }));
    
    // 2. Convert the array to a JSON string and store it
    localStorage.setItem(CANDLE_STORAGE_KEY, JSON.stringify(positionsToSave));
  }
  
  // --- CORE FUNCTIONS ---

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    candleCountDisplay.textContent = activeCandles;
  }

  // Modified to include a 'shouldSave' parameter
  function addCandle(left, top, shouldSave = true) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
    
    // Save the entire candle list to storage if instructed
    if (shouldSave) {
        saveCandles();
    }
  }

  // Allow clicking to add more candles, which also saves them
  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    
    // true: adds a candle AND saves the updated list
    addCandle(left, top, true); 
  });

  function isBlowing() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;

    return average > 40; 
  }

  function blowOutCandles() {
    let blownOut = 0;

    if (isBlowing()) {
      candles.forEach((candle) => {
        // Only blow out a candle with a 50% chance when the user is blowing
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
        }
      });
    }

    // Update the count if any candles were blown out
    if (blownOut > 0) {
      updateCandleCount();
    }
  }
  
  // --- INITIALIZATION ---
  
  // Load any previously saved candles or set the initial 18 if empty.
  loadCandles(); 

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        // Start checking for 'blow' sound every 200ms
        setInterval(blowOutCandles, 200);
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
});
