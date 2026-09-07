// ============================================================
// INTERVO - INTERVIEW
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const API_BASE_URL =
    "https://intervo-backend-okao.onrender.com";

const INTERVIEW_API =
    `${API_BASE_URL}/api/interview`;

const ANSWER_API =
    `${API_BASE_URL}/api/answer`;

const REPORT_API =
    `${API_BASE_URL}/api/report`;


// ============================================================
// INTERVIEW STATE
// ============================================================

let questions = [];

let currentQuestion = 0;

const MAX_QUESTIONS = 5;


// ============================================================
// FOLLOW-UP STATE
// ============================================================

let isFollowUpQuestion = false;

let followUpUsed = false;

let pendingFollowUp = null;


// ============================================================
// TIMER STATE
// ============================================================

let questionTimerInterval = null;

let questionStartTime = null;

let questionElapsedSeconds = 0;


// ============================================================
// LOCAL STORAGE
// ============================================================

const token =
    localStorage.getItem("token");

const sessionId =
    localStorage.getItem("session_id");

const category =
    localStorage.getItem("interview_category");


// ============================================================
// SAFE RESPONSE READER
// ============================================================

async function getResponseData(response) {

    const contentType =
        response.headers.get("content-type") || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            return await response.json();

        }

        catch (error) {

            console.error(
                "JSON parsing error:",
                error
            );

            return {
                message:
                    "Invalid JSON response from server."
            };
        }
    }


    const text =
        await response.text();


    return {
        message:
            text ||
            "Unexpected server response."
    };
}


// ============================================================
// AUTHENTICATION CHECK
// ============================================================

function checkAuthentication() {

    if (!token) {

        console.error(
            "Authentication token not found."
        );

        window.location.href =
            "index.html";

        return false;
    }

    return true;
}


// ============================================================
// LOAD QUESTIONS
// ============================================================

async function loadQuestions() {

    const message =
        document.getElementById(
            "message"
        );

    const questionText =
        document.getElementById(
            "questionText"
        );


    console.log(
        "========================================"
    );

    console.log(
        "INTERVO - LOADING QUESTIONS"
    );

    console.log(
        "API:",
        INTERVIEW_API
    );

    console.log(
        "Session ID:",
        sessionId
    );

    console.log(
        "Category:",
        category
    );

    console.log(
        "Token exists:",
        !!token
    );

    console.log(
        "========================================"
    );


    try {

        // ----------------------------------------------------
        // AUTH CHECK
        // ----------------------------------------------------

        if (!checkAuthentication()) {
            return;
        }


        // ----------------------------------------------------
        // SESSION CHECK
        // ----------------------------------------------------

        if (!sessionId) {

            console.error(
                "session_id missing from localStorage."
            );

            questionText.textContent =
                "Interview session not found.";

            message.textContent =
                "Please start the interview again.";

            return;
        }


        // ----------------------------------------------------
        // CATEGORY CHECK
        // ----------------------------------------------------

        if (!category) {

            console.error(
                "interview_category missing."
            );

            questionText.textContent =
                "Interview category not found.";

            message.textContent =
                "Please select an interview category.";

            return;
        }


        // ----------------------------------------------------
        // SHOW LOADING
        // ----------------------------------------------------

        questionText.textContent =
            "⏳ Loading your interview questions...";

        message.textContent =
            "Connecting to interview server...";


        // ----------------------------------------------------
        // FETCH QUESTIONS
        // ----------------------------------------------------

        const url =
            `${INTERVIEW_API}/questions/${sessionId}`;


        console.log(
            "Fetching:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        console.log(
            "Questions HTTP status:",
            response.status
        );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Questions API response:",
            data
        );


        // ----------------------------------------------------
        // HTTP ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            questionText.textContent =
                "Unable to load interview questions.";

            message.textContent =
                data.message ||
                `Server returned ${response.status}.`;

            return;
        }


        // ----------------------------------------------------
        // VALIDATE RESPONSE
        // ----------------------------------------------------

        if (!data) {

            questionText.textContent =
                "No response received.";

            message.textContent =
                "The interview server returned an empty response.";

            return;
        }


        if (!Array.isArray(data.questions)) {

            console.error(
                "Expected data.questions to be an array.",
                data
            );

            questionText.textContent =
                "Invalid questions received.";

            message.textContent =
                "The server did not return questions in the expected format.";

            return;
        }


        // ----------------------------------------------------
        // TAKE FIRST 5 QUESTIONS
        // ----------------------------------------------------

        questions =
            data.questions.slice(
                0,
                MAX_QUESTIONS
            );


        console.log(
            "Questions received:",
            questions
        );


        // ----------------------------------------------------
        // NO QUESTIONS
        // ----------------------------------------------------

        if (!questions.length) {

            questionText.textContent =
                "No interview questions found.";

            message.textContent =
                "Questions may not have been generated for this session.";

            return;
        }


        // ----------------------------------------------------
        // RESET STATE
        // ----------------------------------------------------

        currentQuestion = 0;

        isFollowUpQuestion = false;

        followUpUsed = false;

        pendingFollowUp = null;


        // Reset timer completely
        resetQuestionTimer();


        // ----------------------------------------------------
        // CLEAR MESSAGE
        // ----------------------------------------------------

        message.textContent =
            "";


        // ----------------------------------------------------
        // SHOW FIRST QUESTION
        // ----------------------------------------------------

        showQuestion();

    }

    catch (error) {

        console.error(
            "LOAD QUESTIONS ERROR:",
            error
        );


        questionText.textContent =
            "Unable to load interview questions.";

        message.textContent =
            "Failed to connect to the interview server.";
    }
}


// ============================================================
// GET QUESTION TEXT
// ============================================================

function getQuestionText(question) {

    if (!question) {
        return "";
    }


    return (
        question.question ||
        question.question_text ||
        question.text ||
        ""
    );
}


// ============================================================
// SHOW QUESTION
// ============================================================

function showQuestion() {

    const answerBox =
        document.getElementById(
            "answer"
        );

    const submitButton =
        document.getElementById(
            "submitButton"
        );

    const message =
        document.getElementById(
            "message"
        );

    const questionTextElement =
        document.getElementById(
            "questionText"
        );

    const progress =
        document.getElementById(
            "progress"
        );


    // ========================================================
    // INTERVIEW COMPLETE
    // ========================================================

    if (
        currentQuestion >=
        questions.length
    ) {

        completeInterview();

        return;
    }


    const question =
        questions[currentQuestion];


    const text =
        getQuestionText(question);


    // --------------------------------------------------------
    // VALIDATE QUESTION
    // --------------------------------------------------------

    if (!text) {

        console.error(
            "Question object does not contain question text:",
            question
        );

        questionTextElement.textContent =
            "Invalid question received.";

        message.textContent =
            "The server returned a question without text.";

        return;
    }


    // --------------------------------------------------------
    // RESET FOLLOW-UP STATE
    // --------------------------------------------------------

    isFollowUpQuestion = false;

    followUpUsed = false;

    pendingFollowUp = null;


    // --------------------------------------------------------
    // PROGRESS
    // --------------------------------------------------------

    progress.textContent =
        `${category} Question ${currentQuestion + 1} / ${questions.length}`;


    // --------------------------------------------------------
    // QUESTION
    // --------------------------------------------------------

    questionTextElement.textContent =
        text;


    // --------------------------------------------------------
    // ANSWER TIPS
    // --------------------------------------------------------

    addAnswerTipsButton();


    // --------------------------------------------------------
    // RESET ANSWER
    // --------------------------------------------------------

    answerBox.value = "";

    answerBox.style.display =
        "block";


    // --------------------------------------------------------
    // SHOW SUBMIT
    // --------------------------------------------------------

    submitButton.style.display =
        "inline-block";

    submitButton.disabled =
        false;


    // --------------------------------------------------------
    // CLEAR MESSAGE
    // --------------------------------------------------------

    message.textContent =
        "";


    // --------------------------------------------------------
    // START TIMER FOR EVERY CATEGORY
    // --------------------------------------------------------

    startQuestionTimer();
}


// ============================================================
// COMPLETE INTERVIEW
// ============================================================

function completeInterview() {

    const answerBox =
        document.getElementById(
            "answer"
        );

    const submitButton =
        document.getElementById(
            "submitButton"
        );

    const questionText =
        document.getElementById(
            "questionText"
        );

    const progress =
        document.getElementById(
            "progress"
        );

    const message =
        document.getElementById(
            "message"
        );


    resetQuestionTimer();


    progress.textContent =
        "Interview Completed";


    questionText.textContent =
        "🎉 Congratulations! Interview completed.";


    answerBox.style.display =
        "none";


    submitButton.style.display =
        "none";


    removeAnswerTips();


    message.textContent =
        "Generating your interview report...";


    generateReport();
}


// ============================================================
// ANSWER TIPS BUTTON
// ============================================================

function addAnswerTipsButton() {

    removeAnswerTips();


    const questionText =
        document.getElementById(
            "questionText"
        );


    if (!questionText) {
        return;
    }


    const button =
        document.createElement(
            "button"
        );


    button.id =
        "answerTipsButton";


    button.type =
        "button";


    button.className =
        "answer-tips-button";


    button.textContent =
        "💡 Answer Tips";


    button.addEventListener(
        "click",
        showAnswerTips
    );


    questionText.insertAdjacentElement(
        "afterend",
        button
    );
}


// ============================================================
// REMOVE ANSWER TIPS
// ============================================================

function removeAnswerTips() {

    const button =
        document.getElementById(
            "answerTipsButton"
        );


    if (button) {
        button.remove();
    }


    const tips =
        document.getElementById(
            "answerTips"
        );


    if (tips) {
        tips.remove();
    }
}


// ============================================================
// SHOW ANSWER TIPS
// ============================================================

async function showAnswerTips() {

    const existingTips =
        document.getElementById(
            "answerTips"
        );


    // Toggle off
    if (existingTips) {

        existingTips.remove();

        return;
    }


    const button =
        document.getElementById(
            "answerTipsButton"
        );


    const question =
        questions[currentQuestion];


    if (!button || !question) {
        return;
    }


    const text =
        getQuestionText(question);


    button.disabled =
        true;


    button.textContent =
        "⏳ Generating Tips...";


    try {

        const response =
            await fetch(
                `${INTERVIEW_API}/answer-tips`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        question:
                            text,

                        category:
                            category

                    })
                }
            );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Answer Tips Response:",
            data
        );


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to generate answer tips."
            );

            return;
        }


        const tips =
            Array.isArray(data.tips)
                ? data.tips
                : [];


        if (!tips.length) {

            alert(
                "No answer tips were generated."
            );

            return;
        }


        const container =
            document.createElement(
                "div"
            );


        container.id =
            "answerTips";


        container.className =
            "answer-tips";


        container.innerHTML = `

            <div class="answer-tips-header">
                💡 <strong>Answer Tips</strong>
            </div>

            <ul>
                ${tips
                    .map(
                        tip =>
                            `<li>${escapeHTML(tip)}</li>`
                    )
                    .join("")
                }
            </ul>

        `;


        button.insertAdjacentElement(
            "afterend",
            container
        );

    }

    catch (error) {

        console.error(
            "Answer Tips Error:",
            error
        );


        alert(
            "Unable to connect to the interview server."
        );
    }

    finally {

        button.disabled =
            false;

        button.textContent =
            "💡 Answer Tips";
    }
}


// ============================================================
// START QUESTION TIMER
// ============================================================
//
// IMPORTANT:
// Timer now works for ALL categories.
//
// HR
// Technical
// Coding
// Behavioral
// Any future category
//
// Timer starts whenever a new question is displayed.
// ============================================================

function startQuestionTimer() {

    // Stop any old timer
    stopQuestionTimer();


    // Reset elapsed time
    questionElapsedSeconds =
        0;


    // Store exact start time
    questionStartTime =
        Date.now();


    const timer =
        getTimerElement();


    const display =
        document.getElementById(
            "timerDisplay"
        );


    // Even if timer UI doesn't exist,
    // we still keep calculating the time.
    if (timer) {

        timer.style.display =
            "inline-flex";
    }


    if (display) {

        display.textContent =
            "00:00";
    }


    // Start updating every second
    questionTimerInterval =
        setInterval(
            updateTimer,
            1000
        );
}


// ============================================================
// GET TIMER ELEMENT
// ============================================================
//
// Supports BOTH:
//
// 1. New ID: interviewTimer
// 2. Existing ID: codingTimer
//
// So you don't have to immediately change your HTML.
// ============================================================

function getTimerElement() {

    return (
        document.getElementById(
            "interviewTimer"
        ) ||

        document.getElementById(
            "codingTimer"
        )
    );
}


// ============================================================
// RESUME TIMER
// ============================================================

function resumeQuestionTimer() {

    // Already running
    if (questionTimerInterval) {
        return;
    }


    // If timer was never started,
    // start a completely new timer.
    if (!questionStartTime) {

        startQuestionTimer();

        return;
    }


    // Continue from previous elapsed time
    questionStartTime =
        Date.now() -
        (
            questionElapsedSeconds *
            1000
        );


    questionTimerInterval =
        setInterval(
            updateTimer,
            1000
        );
}


// ============================================================
// UPDATE TIMER
// ============================================================

function updateTimer() {

    if (!questionStartTime) {
        return;
    }


    questionElapsedSeconds =
        Math.floor(
            (
                Date.now() -
                questionStartTime
            ) / 1000
        );


    updateTimerDisplay();
}


// ============================================================
// UPDATE TIMER DISPLAY
// ============================================================

function updateTimerDisplay() {

    const display =
        document.getElementById(
            "timerDisplay"
        );


    if (!display) {
        return;
    }


    const minutes =
        Math.floor(
            questionElapsedSeconds /
            60
        );


    const seconds =
        questionElapsedSeconds %
        60;


    display.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// ============================================================
// STOP TIMER
// ============================================================

function stopQuestionTimer() {

    // First calculate the latest time
    // before stopping the interval.
    if (questionStartTime) {

        questionElapsedSeconds =
            Math.floor(
                (
                    Date.now() -
                    questionStartTime
                ) / 1000
            );

        updateTimerDisplay();
    }


    if (questionTimerInterval) {

        clearInterval(
            questionTimerInterval
        );

        questionTimerInterval =
            null;
    }
}


// ============================================================
// RESET TIMER
// ============================================================

function resetQuestionTimer() {

    stopQuestionTimer();


    questionStartTime =
        null;


    questionElapsedSeconds =
        0;


    updateTimerDisplay();
}


// ============================================================
// HIDE TIMER
// ============================================================

function hideQuestionTimer() {

    stopQuestionTimer();


    const timer =
        getTimerElement();


    if (timer) {

        timer.style.display =
            "none";
    }
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(totalSeconds) {

    const safeSeconds =
        Math.max(
            0,
            Number(totalSeconds) || 0
        );


    const minutes =
        Math.floor(
            safeSeconds / 60
        );


    const seconds =
        safeSeconds % 60;


    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );
}


// ============================================================
// SUBMIT ANSWER
// ============================================================

async function submitAnswer() {

    const answerBox =
        document.getElementById(
            "answer"
        );

    const submitButton =
        document.getElementById(
            "submitButton"
        );

    const message =
        document.getElementById(
            "message"
        );


    const answer =
        answerBox.value.trim();


    // --------------------------------------------------------
    // VALIDATE ANSWER
    // --------------------------------------------------------

    if (!answer) {

        alert(
            category === "Coding"
                ? "Please write your code."
                : "Please write an answer."
        );

        return;
    }


    const question =
        questions[currentQuestion];


    if (!question) {

        console.error(
            "Current question not found."
        );

        return;
    }


    const questionId =
        question.id;


    if (!questionId) {

        console.error(
            "Question ID missing:",
            question
        );

        message.textContent =
            "Question ID is missing.";

        return;
    }


    // --------------------------------------------------------
    // STOP TIMER
    // --------------------------------------------------------

    stopQuestionTimer();


    // IMPORTANT:
    // Capture the final time BEFORE API calls.
    const timeUsed =
        questionElapsedSeconds;


    const formattedTime =
        formatTime(
            timeUsed
        );


    console.log(
        "Question time used:",
        timeUsed,
        "seconds"
    );


    try {

        submitButton.disabled =
            true;


        message.textContent =
            "Submitting answer...";


        // ====================================================
        // SAVE ANSWER
        // ====================================================

        const submitResponse =
            await fetch(
                `${ANSWER_API}/submit-answer`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        question_id:
                            questionId,

                        answer:
                            answer

                    })
                }
            );


        const submitData =
            await getResponseData(
                submitResponse
            );


        console.log(
            "Submit Answer Response:",
            submitData
        );


        if (!submitResponse.ok) {

            message.textContent =
                submitData.message ||
                "Answer submission failed.";

            submitButton.disabled =
                false;


            resumeQuestionTimer();

            return;
        }


        const answerId =
            submitData.answer_id;


        if (!answerId) {

            message.textContent =
                "Answer saved, but answer ID was not returned.";

            submitButton.disabled =
                false;


            resumeQuestionTimer();

            return;
        }


        // ====================================================
        // AI EVALUATION
        // ====================================================

        message.textContent =
            "🤖 AI evaluating your answer...";


        const evaluationResponse =
            await fetch(
                `${ANSWER_API}/evaluate/${answerId}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const evaluationData =
            await getResponseData(
                evaluationResponse
            );


        console.log(
            "Evaluation Response:",
            evaluationData
        );


        if (!evaluationResponse.ok) {

            message.textContent =
                evaluationData.message ||
                "AI evaluation failed.";

            submitButton.disabled =
                false;


            resumeQuestionTimer();

            return;
        }


        const evaluation =
            evaluationData.evaluation;


        if (!evaluation) {

            message.textContent =
                "AI evaluation was not returned.";

            submitButton.disabled =
                false;


            resumeQuestionTimer();

            return;
        }


        // ====================================================
        // BUILD EVALUATION
        // ====================================================

        let evaluationHTML = `

            <div class="ai-evaluation">

                <strong>
                    🤖 AI Evaluation
                </strong>

                <br><br>

                <strong>
                    Score:
                </strong>

                ${escapeHTML(
                    String(
                        evaluation.score ?? 0
                    )
                )}/10

                <br><br>

                <strong>
                    Feedback:
                </strong>

                <br>

                ${escapeHTML(
                    evaluation.feedback || ""
                )}

                <br><br>

                <strong>
                    Strengths:
                </strong>

                <br>

                ${escapeHTML(
                    evaluation.strengths || ""
                )}

                <br><br>

                <strong>
                    Improvements:
                </strong>

                <br>

                ${escapeHTML(
                    evaluation.improvements || ""
                )}

                <br><br>

                <div class="question-time-result">

                    <strong>
                        ⏱️ Time Used:
                    </strong>

                    ${formattedTime}

                </div>

            </div>

        `;


        // ====================================================
        // CODING SOLUTION
        // ====================================================

        if (
            category === "Coding" &&
            !isFollowUpQuestion &&
            question.solution
        ) {

            evaluationHTML += `

                <br>
                <hr>
                <br>

                <strong>
                    💡 Correct Reference Solution
                </strong>

                <br><br>

                <pre class="reference-solution">${escapeHTML(
                    question.solution
                )}</pre>

            `;
        }


        // ====================================================
        // FOLLOW-UP
        // ====================================================

        if (
            category !== "Coding" &&
            !isFollowUpQuestion &&
            !followUpUsed
        ) {

            const generatedFollowUp =
                evaluationData.follow_up_question;


            if (
                generatedFollowUp &&
                typeof generatedFollowUp === "string" &&
                generatedFollowUp.trim()
            ) {

                pendingFollowUp =
                    generatedFollowUp.trim();


                evaluationHTML += `

                    <br><br>

                    <div class="follow-up-notice">

                        🤖 <strong>
                            AI wants to know more
                        </strong>

                        <br><br>

                        The interviewer has a follow-up
                        question based on your answer.

                    </div>

                    <br>

                    <button
                        type="button"
                        class="follow-up-button"
                        onclick="continueWithFollowUp()"
                    >
                        Continue with Follow-up →
                    </button>

                `;

            }

            else {

                evaluationHTML += `

                    <br><br>

                    <button
                        type="button"
                        class="next-question-button"
                        onclick="nextQuestion()"
                    >
                        Next Question →
                    </button>

                `;
            }

        }

        else {

            evaluationHTML += `

                <br><br>

                <button
                    type="button"
                    class="next-question-button"
                    onclick="nextQuestion()"
                >
                    Next Question →
                </button>

            `;
        }


        // ====================================================
        // DISPLAY EVALUATION
        // ====================================================

        message.innerHTML =
            evaluationHTML;


        answerBox.style.display =
            "none";


        submitButton.style.display =
            "none";


        removeAnswerTips();

    }

    catch (error) {

        console.error(
            "SUBMIT ANSWER ERROR:",
            error
        );


        message.textContent =
            "Something went wrong. Please try again.";


        submitButton.disabled =
            false;


        resumeQuestionTimer();
    }
}


// ============================================================
// FOLLOW-UP QUESTION
// ============================================================

function continueWithFollowUp() {

    if (!pendingFollowUp) {

        console.error(
            "Follow-up question missing."
        );

        nextQuestion();

        return;
    }


    const followUp =
        pendingFollowUp;


    pendingFollowUp =
        null;


    showFollowUpQuestion(
        followUp
    );
}


// ============================================================
// SHOW FOLLOW-UP QUESTION
// ============================================================

function showFollowUpQuestion(
    followUpQuestion
) {

    const answerBox =
        document.getElementById(
            "answer"
        );

    const submitButton =
        document.getElementById(
            "submitButton"
        );

    const message =
        document.getElementById(
            "message"
        );

    const questionText =
        document.getElementById(
            "questionText"
        );

    const progress =
        document.getElementById(
            "progress"
        );


    isFollowUpQuestion =
        true;


    followUpUsed =
        true;


    progress.textContent =
        `${category} • AI Follow-up`;


    questionText.innerHTML = `

        <span class="follow-up-label">
            🤖 AI Follow-up Question
        </span>

        <br><br>

        ${escapeHTML(
            followUpQuestion
        )}

    `;


    removeAnswerTips();


    answerBox.value =
        "";


    answerBox.style.display =
        "block";


    submitButton.style.display =
        "inline-block";


    submitButton.disabled =
        false;


    message.textContent =
        "";


    // ========================================================
    // START TIMER FOR FOLLOW-UP TOO
    // ========================================================

    startQuestionTimer();
}


// ============================================================
// NEXT QUESTION
// ============================================================

function nextQuestion() {

    // Make sure current timer is stopped
    resetQuestionTimer();


    currentQuestion++;


    isFollowUpQuestion =
        false;


    followUpUsed =
        false;


    pendingFollowUp =
        null;


    showQuestion();
}


// ============================================================
// GENERATE REPORT
// ============================================================

async function generateReport() {

    try {

        hideQuestionTimer();


        if (!sessionId) {

            console.error(
                "Session ID missing."
            );

            return;
        }


        const response =
            await fetch(
                `${REPORT_API}/generate/${sessionId}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await getResponseData(
                response
            );


        console.log(
            "Report Response:",
            data
        );


        if (!response.ok) {

            document.getElementById(
                "message"
            ).textContent =
                data.message ||
                "Report generation failed.";

            return;
        }


        if (data.report_id) {

            localStorage.setItem(
                "report_id",
                data.report_id
            );
        }


        window.location.href =
            "report.html";

    }

    catch (error) {

        console.error(
            "REPORT ERROR:",
            error
        );


        document.getElementById(
            "message"
        ).textContent =
            "Unable to generate report.";
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            text ?? ""
        );


    return div.innerHTML;
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "========================================"
        );

        console.log(
            "INTERVO interview.js loaded successfully."
        );

        console.log(
            "Category:",
            category
        );

        console.log(
            "Session:",
            sessionId
        );

        console.log(
            "========================================"
        );


        loadQuestions();
    }
);