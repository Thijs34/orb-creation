import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
const db = window.db;

// DOM
const scene = document.getElementById("scene");
const orb = document.getElementById("orb");
const particlesContainer = document.getElementById("particles");
const floatingWordsContainer = document.getElementById("floatingWords");
const summaryBtn = document.getElementById("summaryBtn");
const modal = document.getElementById("summaryModal");
const closeBtn = document.querySelector(".close");
const summaryText = document.getElementById("summaryText");

let collectedFeedbacks = [];
let wordSpawner = null;

// ===========================
// Rating → Hue mapping
// ===========================
function ratingToHue(avg) {
  if (avg <= 1.5) return 0;   // red
  if (avg <= 2.5) return 30;  // orange
  if (avg <= 3.5) return 55;  // yellow
  if (avg <= 4.5) return 120; // green
  return 280;                 // purple
}

function applyHue(hue) {
  orb.style.setProperty("--hue", hue);
  scene.style.setProperty("--hue", hue);
  scene.style.setProperty("--accent", `hsl(${hue} 85% 55%)`);
  scene.style.setProperty("--accent-glow", `hsl(${hue} 85% 65%)`);
}

// ===========================
// Calm dots
// ===========================
function spawnCalmDot() {
  const dot = document.createElement("div");
  dot.className = "calm-dot";

  const size = 4 + Math.random() * 4;
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;

  const angle = Math.random() * Math.PI * 2;
  const distance = 110 + Math.random() * 25;
  const x = 160 + distance * Math.cos(angle);
  const y = 160 + distance * Math.sin(angle);
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;

  particlesContainer.appendChild(dot);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dot.style.opacity = 1;
      const driftX = (Math.random() - 0.5) * 12;
      const driftY = (Math.random() - 0.5) * 12;
      dot.style.transform = `translate(${driftX}px, ${driftY}px)`;
    });
  });

  setTimeout(() => {
    dot.style.opacity = 0;
    setTimeout(() => dot.remove(), 1500);
  }, 5000);
}

setInterval(spawnCalmDot, 1200);

// ===========================
// Floating words
// ===========================
function spawnWord(text) {
  if (floatingWordsContainer.children.length >= 4) return;
  let short = text.trim();
  if (short.length > 70) short = short.slice(0, 69) + "…";

  const word = document.createElement("div");
  word.className = "word";
  word.textContent = short;

  const rect = floatingWordsContainer.getBoundingClientRect();
  const x = Math.random() * (rect.width - 100) + 20;
  const y = Math.random() * (rect.height - 60) + 20;
  word.style.left = `${x}px`;
  word.style.top = `${y}px`;

  floatingWordsContainer.appendChild(word);
  setTimeout(() => word.remove(), 8000);
}

// ===========================
// Firestore updates
// ===========================
onSnapshot(collection(db, "feedbacks"), (snapshot) => {
  const ratings = [];
  const feedbacks = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.rating) ratings.push(Number(d.rating));
    if (d.feedback?.trim()) feedbacks.push(d.feedback);
  });

  collectedFeedbacks = feedbacks;

  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    applyHue(ratingToHue(avg));
  }

  if (feedbacks.length > 0 && !wordSpawner) {
    wordSpawner = setInterval(() => {
      if (collectedFeedbacks.length > 0) {
        const msg = collectedFeedbacks[Math.floor(Math.random() * collectedFeedbacks.length)];
        spawnWord(msg);
      }
    }, 5000);
  } else if (feedbacks.length === 0 && wordSpawner) {
    clearInterval(wordSpawner);
    wordSpawner = null;
  }
});

// ===========================
// Modal + Streaming summary
// ===========================
summaryBtn.onclick = async () => {
  modal.style.display = "block";
  summaryText.textContent = ""; // clear before streaming

  try {
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbacks: collectedFeedbacks }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      summaryText.innerHTML = marked.parse(buffer);
    }
  } catch (err) {
    console.error(err);
    summaryText.textContent = "Error loading summary.";
  }
};

closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};
