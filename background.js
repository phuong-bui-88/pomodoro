// Background script - handles timer that runs continuously
let timerState = {
    isRunning: false,
    isWorkSession: true,
    timeRemaining: 20 * 60,
    workDuration: 20 * 60,
    breakDuration: 5 * 60,
    sessionsDone: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    lastUpdateTime: Date.now()
};

let timerInterval = null;

chrome.runtime.onInstalled.addListener(() => {
    console.log('Pomodoro Timer extension installed');
    loadState();
});

function saveState() {
    chrome.storage.local.set({ timerState: timerState });
}

function loadState() {
    chrome.storage.local.get(['timerState'], function (data) {
        if (data.timerState) {
            timerState = data.timerState;
            // If timer was running, resume it
            if (timerState.isRunning) {
                const timeSinceLastSave = Math.floor((Date.now() - timerState.lastUpdateTime) / 1000);
                timerState.timeRemaining = Math.max(0, timerState.timeRemaining - timeSinceLastSave);
                startTimer();
            } else {
                updateBadgeDisplay();
            }
        }
    });
}

function getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function incrementDailyPomodoro() {
    const dateString = getDateString();
    chrome.storage.local.get(['dailyPomodoros'], function (data) {
        const dailyPomodoros = data.dailyPomodoros || {};
        dailyPomodoros[dateString] = (dailyPomodoros[dateString] || 0) + 1;
        chrome.storage.local.set({ dailyPomodoros: dailyPomodoros });
    });
}

function startTimer() {
    if (timerInterval) return;

    timerState.isRunning = true;
    timerState.lastUpdateTime = Date.now();
    saveState();

    timerInterval = setInterval(function () {
        timerState.timeRemaining = timerState.timeRemaining - 1;
        timerState.lastUpdateTime = Date.now();
        updateBadgeDisplay();

        if (timerState.timeRemaining <= 0) {
            sessionComplete();
        }
    }, 1000);
}

function pauseTimer() {
    timerState.isRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerState.lastUpdateTime = Date.now();
    saveState();
    updateBadgeDisplay();
}

function resetTimer() {
    timerState.isRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerState.timeRemaining = timerState.isWorkSession ? timerState.workDuration : timerState.breakDuration;
    timerState.lastUpdateTime = Date.now();
    saveState();
    chrome.action.setBadgeText({ text: "" });
}

function sessionComplete() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerState.isRunning = false;

    // Announce session completion
    announceSession(timerState.isWorkSession);

    if (timerState.isWorkSession) {
        timerState.sessionsDone = timerState.sessionsDone + 1;
        timerState.totalWorkTime = timerState.totalWorkTime + timerState.workDuration;
        incrementDailyPomodoro();
        timerState.isWorkSession = false;
        timerState.timeRemaining = timerState.breakDuration;
    } else {
        timerState.totalBreakTime = timerState.totalBreakTime + timerState.breakDuration;
        timerState.isWorkSession = true;
        timerState.timeRemaining = timerState.workDuration;
    }

    timerState.lastUpdateTime = Date.now();
    saveState();
    updateBadgeDisplay();
}

function announceSession(wasWorkSession) {
    try {
        const message = wasWorkSession ? "Time for a break!" : "Break is over, time to work!";
        const totalCompleteText = `Total Complete: ${timerState.sessionsDone}`;
        const fullMessage = message + "\n" + totalCompleteText;

        // Show desktop notification
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon-128.png",
            title: wasWorkSession ? "Break Time!" : "Work Time!",
            message: fullMessage,
            priority: 2,
            requireInteraction: true
        });

        // Try to find open popup tab and send audio/speech message
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "playTimerAlert",
                    message: message,
                    wasWorkSession: wasWorkSession
                }).catch(() => {
                    // Tab doesn't have content script, ignore error
                });
            });
        });
    } catch (e) {
        console.log("Announcement error: " + e);
    }
}

function updateBadgeDisplay() {
    if (timerState.isRunning) {
        const minutes = Math.floor(timerState.timeRemaining / 60);
        const seconds = timerState.timeRemaining % 60;
        const badgeText = minutes + ":" + String(seconds).padStart(2, "0");
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: timerState.isWorkSession ? "#FF7F50" : "#4CAF50" });
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getState') {
        sendResponse({ state: timerState });
    } else if (request.action === 'startTimer') {
        timerState.workDuration = request.workDuration || timerState.workDuration;
        timerState.breakDuration = request.breakDuration || timerState.breakDuration;
        startTimer();
        sendResponse({ success: true });
    } else if (request.action === 'pauseTimer') {
        pauseTimer();
        sendResponse({ success: true });
    } else if (request.action === 'resetTimer') {
        resetTimer();
        sendResponse({ success: true });
    } else if (request.action === 'updateSettings') {
        timerState.workDuration = request.workDuration || timerState.workDuration;
        timerState.breakDuration = request.breakDuration || timerState.breakDuration;
        if (!timerState.isRunning) {
            timerState.timeRemaining = timerState.isWorkSession ? timerState.workDuration : timerState.breakDuration;
        }
        saveState();
        sendResponse({ success: true });
    } else if (request.action === 'toggleSession') {
        if (!timerState.isRunning) {
            timerState.isWorkSession = request.isWorkSession;
            timerState.timeRemaining = timerState.isWorkSession ? timerState.workDuration : timerState.breakDuration;
        }
        saveState();
        sendResponse({ success: true });
    } else if (request.action === 'showNotification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: request.iconUrl || 'icons/icon-128.png',
            title: request.title,
            message: request.message,
            priority: 2
        });
    } else if (request.action === 'resetStats') {
        timerState.sessionsDone = 0;
        timerState.totalWorkTime = 0;
        timerState.totalBreakTime = 0;
        chrome.storage.local.set({ dailyPomodoros: {} });
        saveState();
        sendResponse({ success: true });
    }
});

