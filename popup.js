class PomodoroTimer {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.syncWithBackground();
    this.startDisplayRefresh();
    this.setupMessageListener();
  }

  initializeElements() {
    this.timerDisplay = document.getElementById("timerDisplay");
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.workDurationSelect = document.getElementById("workDuration");
    this.breakDurationSelect = document.getElementById("breakDuration");
    this.toggleSwitch = document.getElementById("workBreakToggle");
    this.sessionLabel = document.getElementById("sessionLabel");
    this.pomodoroCountEl = document.getElementById("pomodoroCount");
    this.totalWorkTimeEl = document.getElementById("totalWorkTime");
    this.totalBreakTimeEl = document.getElementById("totalBreakTime");
    this.soundNotification = document.getElementById("soundNotification");
    this.desktopNotification = document.getElementById("desktopNotification");
    this.autoStartBreak = document.getElementById("autoStartBreak");
    this.resetStatsBtn = document.getElementById("resetStatsBtn");
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
  }

  setupMessageListener() {
    const self = this;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'playTimerAlert') {
        self.playTimerAlert(request.message, request.wasWorkSession);
      }
    });
  }

  playTimerAlert(message, wasWorkSession) {
    // Play sound
    this.playNotificationSound();
    
    // Sync with background to update UI to show new session
    this.syncWithBackground();

    // Play speech announcement
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      speechSynthesis.speak(utterance);
    } catch (e) {
      console.log("Speech error: " + e);
    }
  }

  playNotificationSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();

      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(context.destination);

          oscillator.frequency.value = 800;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0.3, context.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.3);
        }, i * 400);
      }
    } catch (e) {
      console.log("Sound error: " + e);
    }
  }

  setupEventListeners() {
    const self = this;
    this.startBtn.addEventListener("click", function () {
      self.start();
    });
    this.pauseBtn.addEventListener("click", function () {
      self.pause();
    });
    this.resetBtn.addEventListener("click", function () {
      self.reset();
    });
    this.workDurationSelect.addEventListener("change", function (e) {
      const newDuration = parseInt(e.target.value) * 60;
      chrome.runtime.sendMessage({
        action: "updateSettings",
        workDuration: newDuration,
        breakDuration: self.getCurrentBreakDuration()
      }, () => {
        self.syncWithBackground();
      });
    });
    this.breakDurationSelect.addEventListener("change", function (e) {
      const newDuration = parseInt(e.target.value) * 60;
      chrome.runtime.sendMessage({
        action: "updateSettings",
        workDuration: self.getCurrentWorkDuration(),
        breakDuration: newDuration
      }, () => {
        self.syncWithBackground();
      });
    });
    this.toggleSwitch.addEventListener("change", function (e) {
      chrome.runtime.sendMessage({
        action: "toggleSession",
        isWorkSession: e.target.checked
      }, () => {
        self.syncWithBackground();
      });
    });
    this.tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        self.switchTab(btn.dataset.tab);
      });
    });
    this.resetStatsBtn.addEventListener("click", function () {
      self.resetStats();
    });
  }

  switchTab(tabName) {
    this.tabBtns.forEach(function (btn) {
      btn.classList.remove("active");
    });
    this.tabContents.forEach(function (content) {
      content.classList.remove("active");
    });
    const activeBtn = document.querySelector("[data-tab=" + JSON.stringify(tabName) + "]");
    const activeContent = document.querySelector(".tab-content[data-tab=" + JSON.stringify(tabName) + "]");
    if (activeBtn) activeBtn.classList.add("active");
    if (activeContent) activeContent.classList.add("active");
    if (tabName === "stats") {
      this.updateStats();
    }
  }

  getCurrentWorkDuration() {
    return parseInt(this.workDurationSelect.value) * 60;
  }

  getCurrentBreakDuration() {
    return parseInt(this.breakDurationSelect.value) * 60;
  }

  start() {
    const self = this;
    chrome.runtime.sendMessage({
      action: "startTimer",
      workDuration: self.getCurrentWorkDuration(),
      breakDuration: self.getCurrentBreakDuration()
    }, () => {
      self.syncWithBackground();
    });
  }

  pause() {
    const self = this;
    chrome.runtime.sendMessage({ action: "pauseTimer" }, () => {
      self.syncWithBackground();
    });
  }

  reset() {
    const self = this;
    chrome.runtime.sendMessage({ action: "resetTimer" }, () => {
      self.syncWithBackground();
    });
  }

  syncWithBackground() {
    const self = this;
    chrome.runtime.sendMessage({ action: "getState" }, (response) => {
      if (response && response.state) {
        const state = response.state;
        this.updateUIFromState(state);
      }
    });
  }

  updateUIFromState(state) {
    // Update displays
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    const minuteStr = String(minutes).padStart(2, "0");
    const secondStr = String(seconds).padStart(2, "0");
    const displayText = minuteStr + ":" + secondStr;
    this.timerDisplay.textContent = displayText;
    this.sessionLabel.textContent = state.isWorkSession ? "Work" : "Break";

    // Update buttons
    if (state.isRunning) {
      this.startBtn.style.display = "none";
      this.pauseBtn.style.display = "flex";
      this.workDurationSelect.disabled = true;
      this.breakDurationSelect.disabled = true;
      this.toggleSwitch.disabled = true;
    } else {
      this.startBtn.style.display = "flex";
      this.pauseBtn.style.display = "none";
      this.workDurationSelect.disabled = false;
      this.breakDurationSelect.disabled = false;
      this.toggleSwitch.disabled = false;
    }

    // Update circle progress
    const totalTime = state.isWorkSession ? state.workDuration : state.breakDuration;
    const percentage = (state.timeRemaining / totalTime) * 100;
    const circle = document.querySelector(".circle-progress");
    if (circle) {
      const circumference = 2 * Math.PI * 95;
      const offset = circumference - (percentage / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    // Update toggle switch
    this.toggleSwitch.checked = state.isWorkSession;
    this.workDurationSelect.value = String(state.workDuration / 60);
    this.breakDurationSelect.value = String(state.breakDuration / 60);

    // Update session type for styling
    const sessionType = state.isWorkSession ? 'work' : 'break';
    document.querySelector('.container').setAttribute('data-session-type', sessionType);

    // Update stats
    this.pomodoroCountEl.textContent = String(state.sessionsDone);
    const workHours = Math.floor(state.totalWorkTime / 3600);
    const workMins = Math.floor((state.totalWorkTime % 3600) / 60);
    this.totalWorkTimeEl.textContent = workHours + "h " + workMins + "m";
    const breakHours = Math.floor(state.totalBreakTime / 3600);
    const breakMins = Math.floor((state.totalBreakTime % 3600) / 60);
    this.totalBreakTimeEl.textContent = breakHours + "h " + breakMins + "m";
  }

  startDisplayRefresh() {
    const self = this;
    setInterval(() => {
      self.syncWithBackground();
    }, 500); // Update display every 500ms to match background timer
  }

  resetStats() {
    const confirmed = confirm("Are you sure?");
    if (confirmed) {
      const self = this;
      chrome.runtime.sendMessage({ action: "resetStats" }, () => {
        self.syncWithBackground();
      });
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    new PomodoroTimer();
  });
} else {
  new PomodoroTimer();
}
