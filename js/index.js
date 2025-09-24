// DOM elements
const submitBtn = document.getElementById("submitFeedback");
const popup = document.getElementById("popup");
const closePopupBtn = document.getElementById("closePopupBtn");
const feedbackText = document.getElementById("feedbackText");
const ratingButtons = document.querySelectorAll(".rating-emoji");

let selectedRating = null;

// Select rating
ratingButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    selectedRating = index + 1;
    ratingButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

// Submit feedback
submitBtn.addEventListener("click", async () => {
  if (!selectedRating) {
    alert("Please select a rating first!");
    return;
  }

  const feedback = feedbackText.value.trim();

  try {
    await addDoc(collection(window.db, "feedbacks"), {
      rating: selectedRating,
      feedback,
      timestamp: new Date()
    });
    showPopup();
    feedbackText.value = "";
    ratingButtons.forEach(b => b.classList.remove("selected"));
    selectedRating = null;
  } catch (err) {
    console.error(err);
    alert("Error submitting feedback.");
  }
});

// Popup
function showPopup() { popup.style.display = "flex"; }
function closePopup() { popup.style.display = "none"; }

closePopupBtn.addEventListener("click", closePopup);
window.addEventListener("click", (e) => {
  if (e.target === popup) closePopup();
});
