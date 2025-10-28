document.addEventListener("DOMContentLoaded", function () {
  const cake = document.querySelector(".cake");
  const candleCountDisplay = document.getElementById("candleCount");
  const messageContainer = document.getElementById("message-container"); 
  
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;

  // --- LOCAL STORAGE KEY ---
  const CANDLE_STORAGE_KEY = "virtualCakeCandles";
  const INITIAL_CANDLE_COUNT = 18; // Set for the 18th birthday!

  // --- HEART SHAPE COORDINATES ---
  // These 18 coordinate pairs (left, top) form a heart shape on the 250px wide cake.
  const HEART_COORDINATES = [
    // Top Curves
    [90, -15], [110, -25], [130, -25], [150, -15],
    // Sides of the 'V'
    [70, 0], [170, 0], 
    [50, 15], [190, 15],
    [40, 30], [200, 30],
    // Point of the Heart
    [125, 60], 
    // Mid-Sides (forming the central dip)
    [125, -15], 
    // Additional points for a fuller shape
    [100, 5], [150, 5],
    [80, 20], [170, 20],
    [125, 40],
    [140, 45]
  ];

  // --- HELPER FUNCTIONS ---

  function loadCandles() {
    const storedCandles = localStorage.getItem(CANDLE_STORAGE_KEY);
    
    if (storedCandles) {
      const positions = JSON.parse(storedCandles);
      
      if (positions.length > 0) {
          positions.forEach(pos => {
            addCandle(pos.left, pos.top, false); 
          });
      } else {
          setInitialCandles(INITIAL_CANDLE_COUNT);
      }
    } else {
        setInitialCandles(INITIAL_CANDLE_COUNT);
    }
    updateMessageVisibility();
  }

  /**
   * Generates initial candles using the fixed HEART_COORDINATES array.
   */
  function setInitialCandles(count) {
      // Loop through the fixed heart coordinates
      HEART_COORDINATES.forEach(coords => {
          const [left, top] = coords;
          addCandle(left, top, true);
      });
      console.log(`Set ${count} initial candles in a heart shape!`);
  }

  function saveCandles() {
    const positionsToSave = candles.map(candle => ({
      left: parseFloat(candle.style.left),
      top: parseFloat(candle.style.top)
    }));
    localStorage.setItem(CANDLE_STORAGE_KEY, JSON.stringify(positionsToSave));
  }
  
  function updateMessageVisibility() {
      const activeCandles = candles.filter(
          (candle) => !candle.classList.contains("out")
      ).length;

      // If all candles are out (count is 0), show the message
      if (candles.length > 0 && activeCandles === 0) {
          messageContainer.classList.add("show");
      } else {
          messageContainer.classList.remove("show");
      }
  }

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    candleCountDisplay.textContent = activeCandles;
    
    updateMessageVisibility(); 
  }

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
    
    if (shouldSave) {
        saveCandles();
    }
  }

  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
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
        if (!candle.classList.contains("out") && Math.random() > 0.5) {
          candle.classList.add("out");
          blownOut++;
        }
      });
    }

    if (blownOut > 0) {
      updateCandleCount();
    }
  }
  
  // --- INITIALIZATION ---
  
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
        setInterval(blowOutCandles, 200);
      })
      .catch(function (err) {
        console.log("Unable to access microphone: " + err);
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
});
