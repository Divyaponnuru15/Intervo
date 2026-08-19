// ============================================================
// INTERVO - INTERVIEW
// ============================================================

let questions = [];

let currentQuestion = 0;

const MAX_QUESTIONS = 5;


// ============================================================
// FOLLOW-UP STATE
// ============================================================

// Whether the currently displayed question is a follow-up
let isFollowUpQuestion = false;

// Main/original question text
let mainQuestionText = "";

// Current follow-up question text
let followUpQuestionText = "";

// Only one follow-up per main question
let followUpUsed = false;

// Follow-up waiting to be displayed
let pendingFollowUp = null;


// ============================================================
// QUESTION TIMER
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
// QUESTION TIMER
// ============================================================

function startQuestionTimer() {

    clearInterval(questionTimerInterval);

    questionTimerInterval = null;

    questionElapsedSeconds = 0;

    questionStartTime = Date.now();


    const timer =
        document.getElementById("codingTimer");

    const timerDisplay =
        document.getElementById("timerDisplay");


    if (!timer || !timerDisplay) {
        return;
    }


    timer.style.display = "inline-flex";

    timerDisplay.textContent = "00:00";


    questionTimerInterval =
        setInterval(() => {

            questionElapsedSeconds =
                Math.floor(
                    (
                        Date.now() -
                        questionStartTime
                    ) / 1000
                );

            updateTimerDisplay();

        }, 1000);
}


// ============================================================
// RESUME TIMER
// ============================================================

function resumeQuestionTimer() {

    if (questionTimerInterval) {
        return;
    }


    questionStartTime =
        Date.now() -
        (
            questionElapsedSeconds * 1000
        );


    questionTimerInterval =
        setInterval(() => {

            questionElapsedSeconds =
                Math.floor(
                    (
                        Date.now() -
                        questionStartTime
                    ) / 1000
                );

            updateTimerDisplay();

        }, 1000);
}


// ============================================================
// UPDATE TIMER
// ============================================================

function updateTimerDisplay() {

    const timerDisplay =
        document.getElementById("timerDisplay");


    if (!timerDisplay) {
        return;
    }


    const minutes =
        Math.floor(
            questionElapsedSeconds / 60
        );


    const seconds =
        questionElapsedSeconds % 60;


    timerDisplay.textContent =
        String(minutes).padStart(2, "0")
        +
        ":"
        +
        String(seconds).padStart(2, "0");
}


// ============================================================
// STOP TIMER
// ============================================================

function stopQuestionTimer() {

    clearInterval(
        questionTimerInterval
    );

    questionTimerInterval = null;
}


// ============================================================
// HIDE TIMER
// ============================================================

function hideQuestionTimer() {

    stopQuestionTimer();


    const timer =
        document.getElementById("codingTimer");


    if (!timer) {
        return;
    }


    timer.style.display = "none";
}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(totalSeconds) {

    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (
        String(minutes).padStart(2, "0")
        +
        ":"
        +
        String(seconds).padStart(2, "0")
    );
}


// ============================================================
// LOAD QUESTIONS
// ============================================================

async function loadQuestions() {

    try {

        // ====================================================
        // LOGIN CHECK
        // ====================================================

        if (!token) {

            window.location.href =
                "index.html";

            return;
        }


        // ====================================================
        // SESSION CHECK
        // ====================================================

        if (!sessionId) {

            document.getElementById("message").innerHTML =
                "Interview session not found.";

            return;
        }


        // ====================================================
        // CATEGORY CHECK
        // ====================================================

        if (!category) {

            document.getElementById("message").innerHTML =
                "Interview category not selected.";

            return;
        }


        // ====================================================
        // GET QUESTIONS
        // ====================================================

        const response =
            await fetch(
                `https://intervo-backend-okao.onrender.com/questions/${sessionId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "Questions Response:",
            data
        );


        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.ok) {

            document.getElementById("message").innerHTML =
                data.message ||
                "Unable to load questions.";

            return;
        }


        // ====================================================
        // CHECK QUESTION FORMAT
        // ====================================================

        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            document.getElementById("message").innerHTML =
                "Invalid questions received from server.";

            return;
        }


        // ====================================================
        // FIRST 5 QUESTIONS
        // ====================================================

        questions =
            data.questions.slice(
                0,
                MAX_QUESTIONS
            );


        console.log(
            "Questions used:",
            questions
        );


        if (questions.length === 0) {

            document.getElementById("message").innerHTML =
                "No questions found.";

            return;
        }


        // ====================================================
        // INITIALIZE INTERVIEW
        // ====================================================

        currentQuestion = 0;

        isFollowUpQuestion = false;

        followUpUsed = false;

        followUpQuestionText = "";

        pendingFollowUp = null;


        showQuestion();

    }

    catch (error) {

        console.error(
            "Load Questions Error:",
            error
        );


        document.getElementById("message").innerHTML =
            "Failed to connect to server.";
    }
}


// ============================================================
// SHOW MAIN QUESTION
// ============================================================

function showQuestion() {

    const answerBox =
        document.getElementById("answer");

    const submitButton =
        document.getElementById("submitButton");

    const message =
        document.getElementById("message");


    // ========================================================
    // QUESTIONS REMAIN
    // ========================================================

    if (
        currentQuestion <
        questions.length
    ) {

        const question =
            questions[currentQuestion];


        // ====================================================
        // RESET FOLLOW-UP STATE
        // ====================================================

        isFollowUpQuestion = false;

        followUpUsed = false;

        followUpQuestionText = "";

        pendingFollowUp = null;


        mainQuestionText =
            question.question;


        // ====================================================
        // PROGRESS
        // ====================================================

        document.getElementById("progress").innerHTML =
            `${escapeHTML(category)} Question ${
                currentQuestion + 1
            } / ${questions.length}`;


        // ====================================================
        // START TIMER
        // ====================================================

        startQuestionTimer();


        // ====================================================
        // DISPLAY QUESTION
        // ====================================================

        document.getElementById("questionText").innerHTML =
            escapeHTML(
                question.question
            );


        // ====================================================
        // CLEAR ANSWER
        // ====================================================

        answerBox.value = "";


        // ====================================================
        // CLEAR MESSAGE
        // ====================================================

        message.innerHTML = "";


        // ====================================================
        // SHOW ANSWER BOX
        // ====================================================

        answerBox.style.display =
            "block";


        // ====================================================
        // SHOW SUBMIT
        // ====================================================

        submitButton.style.display =
            "inline-block";

        submitButton.disabled =
            false;


        return;
    }


    // ========================================================
    // INTERVIEW COMPLETED
    // ========================================================

    hideQuestionTimer();


    document.getElementById("progress").innerHTML =
        "Interview Completed";


    document.getElementById("questionText").innerHTML =
        "🎉 Congratulations! Interview completed.";


    answerBox.style.display =
        "none";


    submitButton.style.display =
        "none";


    message.innerHTML =
        "Generating your interview report...";


    generateReport();
}


// ============================================================
// SHOW FOLLOW-UP QUESTION
// ============================================================

function showFollowUpQuestion(
    followUpQuestion
) {

    const answerBox =
        document.getElementById("answer");

    const submitButton =
        document.getElementById("submitButton");

    const message =
        document.getElementById("message");


    // ========================================================
    // UPDATE FOLLOW-UP STATE
    // ========================================================

    isFollowUpQuestion = true;

    followUpUsed = true;

    followUpQuestionText =
        followUpQuestion;


    // ========================================================
    // START TIMER
    // ========================================================

    startQuestionTimer();


    // ========================================================
    // PROGRESS
    // ========================================================

    document.getElementById("progress").innerHTML =
        `${escapeHTML(category)} • AI Follow-up`;


    // ========================================================
    // DISPLAY FOLLOW-UP
    // ========================================================

    document.getElementById("questionText").innerHTML = `

        <span class="follow-up-label">
            🤖 AI Follow-up Question
        </span>

        <br><br>

        ${escapeHTML(
            followUpQuestion
        )}

    `;


    // ========================================================
    // CLEAR ANSWER
    // ========================================================

    answerBox.value = "";


    // ========================================================
    // CLEAR MESSAGE
    // ========================================================

    message.innerHTML = "";


    // ========================================================
    // SHOW ANSWER
    // ========================================================

    answerBox.style.display =
        "block";


    submitButton.style.display =
        "inline-block";

    submitButton.disabled =
        false;
}


// ============================================================
// SUBMIT ANSWER
// ============================================================

async function submitAnswer() {

    const answerBox =
        document.getElementById("answer");

    const submitButton =
        document.getElementById("submitButton");

    const message =
        document.getElementById("message");


    const answer =
        answerBox.value.trim();


    // ========================================================
    // VALIDATE ANSWER
    // ========================================================

    if (!answer) {

        alert(
            category === "Coding"
                ? "Please write your code."
                : "Please write an answer."
        );

        return;
    }


    // ========================================================
    // GET MAIN QUESTION
    // ========================================================

    const question =
        questions[currentQuestion];


    if (!question) {

        console.error(
            "Current question not found."
        );

        return;
    }


    // ========================================================
    // STOP TIMER
    // ========================================================

    stopQuestionTimer();


    const timeUsed =
        questionElapsedSeconds;


    const formattedTime =
        formatTime(timeUsed);


    // ========================================================
    // QUESTION ID
    // ========================================================

    const questionId =
        question.id;


    try {

        // ====================================================
        // DISABLE SUBMIT
        // ====================================================

        submitButton.disabled =
            true;


        message.innerHTML =
            "Submitting answer...";


        // ====================================================
        // STEP 1 — SAVE ANSWER
        // ====================================================

        const submitResponse =
            await fetch(
                "https://intervo-backend-okao.onrender.com/api/answer/submit-answer",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            "Bearer " + token
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
            await submitResponse.json();


        console.log(
            "Submit Response:",
            submitData
        );


        // ====================================================
        // CHECK SUBMISSION
        // ====================================================

        if (!submitResponse.ok) {

            message.innerHTML =
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

            message.innerHTML =
                "Answer saved, but answer ID was not returned.";

            submitButton.disabled =
                false;

            resumeQuestionTimer();

            return;
        }


        // ====================================================
        // STEP 2 — AI EVALUATION
        // ====================================================

        message.innerHTML =
            "🤖 AI evaluating your answer...";


        const evaluationResponse =
            await fetch(
                `https://intervo-backend-okao.onrender.com/api/answer/evaluate/${answerId}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const evaluationData =
            await evaluationResponse.json();


        console.log(
            "Evaluation Response:",
            evaluationData
        );


        // ====================================================
        // CHECK EVALUATION
        // ====================================================

        if (!evaluationResponse.ok) {

            message.innerHTML =
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

            message.innerHTML =
                "AI evaluation was not returned.";

            submitButton.disabled =
                false;

            resumeQuestionTimer();

            return;
        }


        // ====================================================
        // BUILD EVALUATION UI
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
                        evaluation.score ?? "0"
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
        // CODING REFERENCE SOLUTION
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
        // STEP 3 — FOLLOW-UP
        // ====================================================

        if (
            category !== "Coding" &&
            !isFollowUpQuestion &&
            !followUpUsed
        ) {

            message.innerHTML =
                evaluationHTML +
                `

                    <br><br>

                    <div class="follow-up-loading">

                        🤖 Checking whether the interviewer
                        wants to ask a follow-up...

                    </div>

                `;


            // ==================================================
            // REQUEST FOLLOW-UP
            // ==================================================

            const followUpResponse =
                await fetch(
                    `https://intervo-backend-okao.onrender.com/api/answer/follow-up/${answerId}`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                "Bearer " + token
                        }
                    }
                );


            const followUpData =
                await followUpResponse.json();


            console.log(
                "Follow-up Response:",
                followUpData
            );


            // ==================================================
            // FOLLOW-UP ERROR
            // ==================================================

            if (!followUpResponse.ok) {

                console.error(
                    "Follow-up Error:",
                    followUpData
                );


                evaluationHTML += `

                    <br><br>

                    <button
                        class="next-question-button"
                        onclick="nextQuestion()"
                    >
                        Next Question →
                    </button>

                `;


                message.innerHTML =
                    evaluationHTML;

            }


            // ==================================================
            // FOLLOW-UP AVAILABLE
            // ==================================================

            else if (
                followUpData.follow_up === true &&
                followUpData.question
            ) {

                pendingFollowUp =
                    followUpData.question;


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
                        class="follow-up-button"
                        onclick="continueWithFollowUp()"
                    >
                        Continue with Follow-up →
                    </button>

                `;


                message.innerHTML =
                    evaluationHTML;

            }


            // ==================================================
            // NO FOLLOW-UP
            // ==================================================

            else {

                evaluationHTML += `

                    <br><br>

                    <button
                        class="next-question-button"
                        onclick="nextQuestion()"
                    >
                        Next Question →
                    </button>

                `;


                message.innerHTML =
                    evaluationHTML;
            }

        }


        // ====================================================
        // FOLLOW-UP ANSWER
        // ====================================================

        else {

            evaluationHTML += `

                <br><br>

                <button
                    class="next-question-button"
                    onclick="nextQuestion()"
                >
                    Next Question →
                </button>

            `;


            message.innerHTML =
                evaluationHTML;
        }


        // ====================================================
        // HIDE ANSWER BOX
        // ====================================================

        answerBox.style.display =
            "none";


        // ====================================================
        // HIDE SUBMIT
        // ====================================================

        submitButton.style.display =
            "none";

    }

    catch (error) {

        console.error(
            "Answer Error:",
            error
        );


        message.innerHTML =
            "Something went wrong. Please try again.";

        submitButton.disabled =
            false;

        resumeQuestionTimer();
    }
}


// ============================================================
// CONTINUE WITH FOLLOW-UP
// ============================================================

function continueWithFollowUp() {

    if (!pendingFollowUp) {

        console.error(
            "Follow-up question not found."
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
// NEXT QUESTION
// ============================================================

function nextQuestion() {

    currentQuestion++;

    isFollowUpQuestion =
        false;

    followUpUsed =
        false;

    followUpQuestionText =
        "";

    pendingFollowUp =
        null;


    showQuestion();
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;
}


// ============================================================
// GENERATE REPORT
// ============================================================

async function generateReport() {

    try {

        hideQuestionTimer();


        const response =
            await fetch(
                `https://intervo-backend-okao.onrender.com/api/report/generate/${sessionId}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "Report:",
            data
        );


        if (!response.ok) {

            document.getElementById("message").innerHTML =
                data.message ||
                "Report generation failed.";

            return;
        }


        // ====================================================
        // SAVE REPORT ID
        // ====================================================

        if (data.report_id) {

            localStorage.setItem(
                "report_id",
                data.report_id
            );
        }


        // ====================================================
        // OPEN REPORT
        // ====================================================

        window.location.href =
            "report.html";

    }

    catch (error) {

        console.error(
            "Report Error:",
            error
        );


        document.getElementById("message").innerHTML =
            "Unable to generate report.";
    }
}


// ============================================================
// START INTERVIEW
// ============================================================

loadQuestions();