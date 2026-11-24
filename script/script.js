// Customize her name here (or pass ?name=HerName in the URL)
const DEFAULT_NAME = "there";

// Normalized crop boxes [sx, sy, sw, sh] for the 5 bouquets in assets/Pixel Art Bouquet Collection.png
const BOUQUET_SHEET_SRC = "assets/Pixel Art Bouquet Collection.png";
const bouquetSheetImg = new Image();
bouquetSheetImg.src = BOUQUET_SHEET_SRC;

const BOUQUETS = [
  {
    id: "pink-carnations",
    crop: [0.04, 0.03, 0.30, 0.46],
    name: "Pink Carnations & Baby's Breath",
    meaning: "Soft, sweet admiration wrapped in pink ribbon."
  },
  {
    id: "crimson-roses",
    crop: [0.35, 0.03, 0.30, 0.46],
    name: "Crimson Roses & Gold Wrap",
    meaning: "Bold, warm, and unmistakable attention."
  },
  {
    id: "sunflower-daisy",
    crop: [0.66, 0.03, 0.30, 0.46],
    name: "Sunflowers & White Daisies",
    meaning: "Bright energy that lights up a slow day."
  },
  {
    id: "pastel-tulips",
    crop: [0.18, 0.50, 0.31, 0.47],
    name: "Pink & Cream Tulips",
    meaning: "Clean, calm, and a little bit poetic."
  },
  {
    id: "lavender-wildflower",
    crop: [0.51, 0.50, 0.31, 0.47],
    name: "Lavender & Wildflower Set",
    meaning: "Cozy, low-key, and easy on the eyes."
  }
];

const QUESTIONS = [
  {
    id: "vibe",
    type: "choice",
    question: "Ideal hangout energy?",
    options: [
      "Chill coffee & kwentuhan",
      "Spontaneous food trip",
      "Quiet walk somewhere nice",
      "Cozy stay-in & movies"
    ]
  },
  {
    id: "comfortFood",
    type: "text",
    question: "Go-to comfort food after a long day?",
    placeholder: "e.g., Ramen, iced coffee, fries..."
  },
  {
    id: "favoritePlace",
    type: "text",
    question: "What's your favorite place to hang out or unwind?",
    placeholder: "e.g., Cozy cafe, seaside, quiet park, mall..."
  },
  {
    id: "bouquetPick",
    type: "bouquet",
    question: "Flowers for u — swipe through 5 bouquets & pick yours:"
  },
  {
    id: "passion",
    type: "textarea",
    question: "What's something you could talk about for hours?",
    placeholder: "Anything you lowkey love or geek out about..."
  },
  {
    id: "deeply",
    type: "yesno",
    question: "Pwede ba kita makilala nang deeply?"
  },
  {
    id: "askMe",
    type: "textarea",
    question: "Wildcard: One thing you want to know about me?",
    placeholder: "Your turn to ask me anything..."
  }
];

const NO_TEASES = [
  "Sure ka na ba diyan? Try again",
  "Lumiit na yung No oh... press Yes na lang",
  "Konti na lang mawawala na yung No!",
  "Last chance bago mag-disappear yung No"
];

const STORAGE_KEY = "forU_crush_answers_final";

let currentBeat = 0;
let currentCard = 0;
let answers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let noClicks = Number(answers._noClicks || 0);
let bouquetIndex = 0;
let touchStartX = 0;

// DOM Elements
const screens = {
  landing: document.getElementById("screen-landing"),
  letter: document.getElementById("screen-letter"),
  quiz: document.getElementById("screen-quiz"),
  summary: document.getElementById("screen-summary")
};

// Initialize Name from URL (?name=...) or Default
function initName() {
  const params = new URLSearchParams(window.location.search);
  const customName = params.get("name");
  document.getElementById("herNameDisplay").textContent =
    customName && customName.trim() ? customName.trim() : DEFAULT_NAME;
}

// Create Floating Petals
function initPetals() {
  const container = document.getElementById("petalsContainer");
  const count = 16;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("div");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${8 + Math.random() * 8}s`;
    petal.style.animationDelay = `${Math.random() * 6}s`;
    petal.style.transform = `scale(${0.7 + Math.random() * 0.6})`;
    container.appendChild(petal);
  }
}

// Switch Active Screen
function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

// Letter Beat Navigation
function updateBeatUI() {
  document.querySelectorAll(".beat").forEach((beat, idx) => {
    beat.classList.toggle("active", idx === currentBeat);
  });
  document.querySelectorAll(".dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx <= currentBeat);
  });

  const prevBtn = document.getElementById("prevBeatBtn");
  const nextBtn = document.getElementById("nextBeatBtn");
  prevBtn.disabled = currentBeat === 0;
  nextBtn.textContent = currentBeat === 2 ? "Get to Know You →" : "Next";
}

document.getElementById("openEnvelopeBtn").addEventListener("click", () => {
  showScreen("letter");
  updateBeatUI();
});

document.getElementById("prevBeatBtn").addEventListener("click", () => {
  if (currentBeat > 0) {
    currentBeat--;
    updateBeatUI();
  }
});

document.getElementById("nextBeatBtn").addEventListener("click", () => {
  if (currentBeat < 2) {
    currentBeat++;
    updateBeatUI();
  } else {
    showScreen("quiz");
    renderCard();
  }
});

// Save Answers to LocalStorage
function saveAnswers() {
  answers._noClicks = noClicks;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

// Draw exact cropped bouquet onto canvas
function drawBouquetCrop(canvas, bouquet) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const render = () => {
    const w = bouquetSheetImg.naturalWidth;
    const h = bouquetSheetImg.naturalHeight;
    if (!w || !h) return;

    const [nx, ny, nw, nh] = bouquet.crop;
    const sx = Math.round(nx * w);
    const sy = Math.round(ny * h);
    const sw = Math.round(nw * w);
    const sh = Math.round(nh * h);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const scale = Math.min(canvas.width / sw, canvas.height / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
    const dx = Math.round((canvas.width - dw) / 2);
    const dy = Math.round((canvas.height - dh) / 2);

    ctx.drawImage(bouquetSheetImg, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  if (bouquetSheetImg.complete && bouquetSheetImg.naturalWidth > 0) {
    render();
  } else {
    bouquetSheetImg.onload = render;
  }
}

// Render Interactive Card
function renderCard() {
  const item = QUESTIONS[currentCard];
  const container = document.getElementById("questionContainer");
  document.getElementById("cardCounter").textContent = `Card ${currentCard + 1} of ${QUESTIONS.length}`;

  const savedVal = answers[item.id] || "";
  let fieldHTML = "";

  if (item.type === "choice") {
    fieldHTML = `<div class="choice-list">
      ${item.options
        .map(
          (opt) => `
        <button type="button" class="choice-btn ${savedVal === opt ? "selected" : ""}" data-val="${opt}">
          ${opt}
        </button>`
        )
        .join("")}
    </div>`;
  } else if (item.type === "text") {
    fieldHTML = `<input type="text" class="text-input" id="cardInput" placeholder="${item.placeholder}" value="${String(savedVal).replace(/"/g, "&quot;")}" />`;
  } else if (item.type === "textarea") {
    fieldHTML = `<textarea class="text-input" id="cardInput" placeholder="${item.placeholder}">${savedVal}</textarea>`;
  } else if (item.type === "bouquet") {
    const currentB = BOUQUETS[bouquetIndex];
    const isPicked = savedVal === currentB.name;

    fieldHTML = `
      <div class="bouquet-stage ${isPicked ? "picked" : ""}" id="bouquetStage">
        <canvas class="bouquet-canvas" id="bouquetCanvas" width="320" height="320" aria-label="${currentB.name}"></canvas>
        <div class="bouquet-name">${currentB.name}</div>
        <p class="bouquet-meaning">${currentB.meaning}</p>

        <div class="bouquet-controls">
          <button type="button" class="bouquet-arrow" id="prevBouquetBtn" aria-label="Previous bouquet">‹</button>
          <div class="bouquet-dots">
            ${BOUQUETS.map(
              (_, i) =>
                `<button type="button" class="bouquet-dot ${i === bouquetIndex ? "active" : ""}" data-bidx="${i}" aria-label="Bouquet ${i + 1}"></button>`
            ).join("")}
          </div>
          <button type="button" class="bouquet-arrow" id="nextBouquetBtn" aria-label="Next bouquet">›</button>
        </div>

        <button type="button" class="btn ${isPicked ? "btn-primary" : "btn-ghost"} bouquet-select-btn" id="pickBouquetBtn">
          ${isPicked ? "Selected ✓" : "Pick This Bouquet"}
        </button>
        <p class="swipe-hint">Swipe left/right or tap arrows (${bouquetIndex + 1} / ${BOUQUETS.length})</p>
      </div>
    `;
  } else if (item.type === "yesno") {
    const noGone = noClicks >= 4;
    const noScale = Math.max(0, 1 - noClicks * 0.25);
    const yesScale = 1 + Math.min(noClicks, 4) * 0.08;
    const isYes = savedVal === "Yes";

    let teaseText = "";
    if (isYes) {
      teaseText = "Ayeee noted yan! Excited to know you more";
    } else if (noGone) {
      teaseText = "Wala nang No button haha. Yes na lang natira!";
    } else if (noClicks > 0) {
      teaseText = NO_TEASES[Math.min(noClicks - 1, NO_TEASES.length - 1)];
    }

    fieldHTML = `
      <div class="yesno-arena">
        <div class="yesno-buttons">
          <button
            type="button"
            class="btn-yes ${isYes ? "accepted" : ""}"
            id="yesBtn"
            style="transform: scale(${yesScale});"
          >
            ${isYes ? "Yes! ✓" : "Yes"}
          </button>
          ${
            noGone
              ? ""
              : `<button
                  type="button"
                  class="btn-no"
                  id="noBtn"
                  style="transform: scale(${noScale}); opacity: ${Math.max(0.15, noScale)};"
                >
                  No
                </button>`
          }
        </div>
        <p class="yesno-tease" id="yesnoTease">${teaseText}</p>
      </div>
    `;
  }

  container.innerHTML = `
    <h2 class="question-title">${item.question}</h2>
    ${fieldHTML}
  `;

  // Bind events by card type
  if (item.type === "choice") {
    container.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        answers[item.id] = btn.dataset.val;
        saveAnswers();
        renderCard();
      });
    });
  } else if (item.type === "text" || item.type === "textarea") {
    const input = document.getElementById("cardInput");
    input.addEventListener("input", (e) => {
      answers[item.id] = e.target.value;
      saveAnswers();
    });
  } else if (item.type === "bouquet") {
    drawBouquetCrop(document.getElementById("bouquetCanvas"), BOUQUETS[bouquetIndex]);

    const stage = document.getElementById("bouquetStage");
    document.getElementById("prevBouquetBtn").addEventListener("click", () => {
      bouquetIndex = (bouquetIndex - 1 + BOUQUETS.length) % BOUQUETS.length;
      renderCard();
    });
    document.getElementById("nextBouquetBtn").addEventListener("click", () => {
      bouquetIndex = (bouquetIndex + 1) % BOUQUETS.length;
      renderCard();
    });
    container.querySelectorAll(".bouquet-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        bouquetIndex = Number(dot.dataset.bidx);
        renderCard();
      });
    });
    document.getElementById("pickBouquetBtn").addEventListener("click", () => {
      answers[item.id] = BOUQUETS[bouquetIndex].name;
      saveAnswers();
      renderCard();
    });

    stage.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    stage.addEventListener("touchend", (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) {
        bouquetIndex = diff < 0
          ? (bouquetIndex + 1) % BOUQUETS.length
          : (bouquetIndex - 1 + BOUQUETS.length) % BOUQUETS.length;
        renderCard();
      }
    }, { passive: true });

    let mouseDownX = null;
    stage.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      mouseDownX = e.clientX;
    });

    stage.addEventListener("mouseup", (e) => {
      if (mouseDownX === null) return;
      const diff = e.clientX - mouseDownX;
      mouseDownX = null;
      if (Math.abs(diff) > 40) {
        bouquetIndex = diff < 0
          ? (bouquetIndex + 1) % BOUQUETS.length
          : (bouquetIndex - 1 + BOUQUETS.length) % BOUQUETS.length;
        renderCard();
      }
    });
  } else if (item.type === "yesno") {
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");

    yesBtn.addEventListener("click", () => {
      answers[item.id] = "Yes";
      saveAnswers();
      renderCard();
    });

    if (noBtn) {
      noBtn.addEventListener("click", () => {
        noClicks += 1;
        saveAnswers();
        renderCard();
      });
    }
  }

  document.getElementById("prevCardBtn").textContent =
    currentCard === 0 ? "← Letter" : "Previous";
  document.getElementById("nextCardBtn").textContent =
    currentCard === QUESTIONS.length - 1 ? "Finish" : "Next Card";
}

document.getElementById("backToLetterBtn").addEventListener("click", () => {
  showScreen("letter");
});

document.getElementById("prevCardBtn").addEventListener("click", () => {
  if (currentCard > 0) {
    currentCard--;
    renderCard();
  } else {
    showScreen("letter");
  }
});

document.getElementById("nextCardBtn").addEventListener("click", () => {
  if (currentCard < QUESTIONS.length - 1) {
    currentCard++;
    renderCard();
  } else {
    renderSummary();
    showScreen("summary");
  }
});

// Summary & Copy-to-Clipboard
function renderSummary() {
  const list = document.getElementById("summaryList");
  list.innerHTML = QUESTIONS.map((q) => {
    const raw = answers[q.id];
    const ans = raw && String(raw).trim() ? String(raw).trim() : "Skipped for now";
    return `
      <div class="summary-item">
        <div class="summary-q">${q.question}</div>
        <div class="summary-a">${ans}</div>
      </div>
    `;
  }).join("");
}

document.getElementById("editAnswersBtn").addEventListener("click", () => {
  currentCard = 0;
  showScreen("quiz");
  renderCard();
});

document.getElementById("copyAnswersBtn").addEventListener("click", async () => {
  const lines = QUESTIONS.map((q) => {
    const raw = answers[q.id];
    const ans = raw && String(raw).trim() ? String(raw).trim() : "—";
    return `• ${q.question}\n  → ${ans}`;
  });
  const textToCopy = `Here are my answers from the card:\n\n${lines.join("\n\n")}`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    document.getElementById("copyFeedback").textContent =
      "Copied! You can paste and send this straight to me.";
  } catch {
    document.getElementById("copyFeedback").textContent =
      "Could not auto-copy—feel free to screenshot this card!";
  }
});

// Gentle Web Audio Soft Chord Pad (No external MP3 required)
let audioCtx = null;
let isPlaying = false;
let chordInterval = null;

function playSoftChord() {
  if (!audioCtx) return;
  const chords = [
    [261.63, 329.63, 392.0, 493.88],
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 392.0]
  ];
  const chord = chords[Math.floor(Math.random() * chords.length)];
  const now = audioCtx.currentTime;

  chord.forEach((freq) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 4.3);
  });
}

document.getElementById("musicToggle").addEventListener("click", () => {
  const btn = document.getElementById("musicToggle");
  const label = document.getElementById("musicLabel");

  if (!isPlaying) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    isPlaying = true;
    btn.classList.add("playing");
    label.textContent = "Ambient On";
    playSoftChord();
    chordInterval = setInterval(playSoftChord, 4400);
  } else {
    isPlaying = false;
    btn.classList.remove("playing");
    label.textContent = "Ambient Off";
    clearInterval(chordInterval);
  }
});

// Boot
initName();
initPetals();