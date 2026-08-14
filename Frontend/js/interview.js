let questions = [];

let currentQuestion = 0;

const MAX_QUESTIONS = 5;


// =====================================================
// GET LOCAL STORAGE DATA
// =====================================================

const token =
    localStorage.getItem("token");

const sessionId =
    localStorage.getItem("session_id");

const category =
    localStorage.getItem("interview_category");


// =====================================================
// LOAD QUESTIONS
// =====================================================

async function loadQuestions() {

    try {

        // Check login
        if (!token) {

            window.location.href =
                "index.html";

            return;
        }


        // Check session
        if (!sessionId) {

            document.getElementById("message").innerHTML =
                "Interview session not found.";

            return;
        }


        // Check category
        if (!category) {

            document.getElementById("message").innerHTML =
                "Interview category not selected.";

            return;
        }


        // =================================================
        // REQUEST QUESTIONS
        // =================================================

        const response =
            await fetch(
                `http://127.0.0.1:5000/questions/${sessionId}`,
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


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!response.ok) {

            document.getElementById("message").innerHTML =
                data.message ||
                "Unable to load questions.";

            return;
        }


        // =================================================
        // STORE ONLY FIRST 5 QUESTIONS
        // =================================================

        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            document.getElementById("message").innerHTML =
                "Invalid questions received from server.";

            return;
        }


        questions =
            data.questions.slice(
                0,
                MAX_QUESTIONS
            );


        console.log(
            "Questions used for interview:",
            questions
        );


        // =================================================
        // CHECK QUESTIONS
        // =================================================

        if (questions.length === 0) {

            document.getElementById("message").innerHTML =
                "No questions found.";

            return;
        }


        // =================================================
        // START INTERVIEW
        // =================================================

        currentQuestion = 0;

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


// =====================================================
// DISPLAY CURRENT QUESTION
// =====================================================

function showQuestion() {

    const answerBox =
        document.getElementById("answer");

    const submitButton =
        document.getElementById("submitButton");

    const message =
        document.getElementById("message");


    // =================================================
    // QUESTIONS REMAINING
    // =================================================

    if (
        currentQuestion <
        questions.length
    ) {

        const question =
            questions[currentQuestion];


        // =================================================
        // PROGRESS
        // =================================================

        document.getElementById("progress").innerHTML =

            `${category} Question ${
                currentQuestion + 1
            } / ${questions.length}`;


        // =================================================
        // DISPLAY QUESTION
        // =================================================

        document.getElementById("questionText").innerHTML =
            question.question;


        // =================================================
        // CLEAR PREVIOUS ANSWER
        // =================================================

        answerBox.value = "";


        // =================================================
        // CLEAR MESSAGE
        // =================================================

        message.innerHTML = "";


        // =================================================
        // SHOW ANSWER BOX
        // =================================================

        answerBox.style.display =
            "block";


        // =================================================
        // SHOW SUBMIT BUTTON
        // =================================================

        submitButton.style.display =
            "inline-block";


        submitButton.disabled =
            false;


        return;
    }


    // =================================================
    // INTERVIEW COMPLETED
    // =================================================

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


// =====================================================
// SUBMIT ANSWER
// =====================================================

async function submitAnswer() {

    const answerBox =
        document.getElementById("answer");


    const answer =
        answerBox.value.trim();


    // =================================================
    // VALIDATE ANSWER
    // =================================================

    if (!answer) {

        alert(

            category === "Coding"

                ? "Please write your code."

                : "Please write an answer."

        );

        return;
    }


    // =================================================
    // GET CURRENT QUESTION
    // =================================================

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


    const submitButton =
        document.getElementById("submitButton");


    const message =
        document.getElementById("message");


    try {

        // =================================================
        // DISABLE SUBMIT BUTTON
        // =================================================

        submitButton.disabled =
            true;


        message.innerHTML =
            "Submitting answer...";


        // =================================================
        // STEP 1 — SAVE ANSWER
        // =================================================

        const submitResponse =
            await fetch(

                "http://127.0.0.1:5000/api/answer/submit-answer",

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


        // =================================================
        // CHECK SUBMISSION
        // =================================================

        if (!submitResponse.ok) {

            message.innerHTML =
                submitData.message ||
                "Answer submission failed.";

            submitButton.disabled =
                false;

            return;
        }


        // =================================================
        // GET ANSWER ID
        // =================================================

        const answerId =
            submitData.answer_id;


        if (!answerId) {

            message.innerHTML =
                "Answer saved, but answer ID was not returned.";

            submitButton.disabled =
                false;

            return;
        }


        // =================================================
        // STEP 2 — AI EVALUATION
        // =================================================

        message.innerHTML =
            "🤖 AI evaluating answer...";


        const evaluationResponse =
            await fetch(

                `http://127.0.0.1:5000/api/answer/evaluate/${answerId}`,

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
            "Evaluation:",
            evaluationData
        );


        // =================================================
        // CHECK EVALUATION
        // =================================================

        if (!evaluationResponse.ok) {

            message.innerHTML =
                evaluationData.message ||
                "Evaluation failed.";

            submitButton.disabled =
                false;

            return;
        }


        // =================================================
        // GET EVALUATION
        // =================================================

        const evaluation =
            evaluationData.evaluation;


        if (!evaluation) {

            message.innerHTML =
                "AI evaluation was not returned.";

            submitButton.disabled =
                false;

            return;
        }


        // =================================================
        // STEP 3 — DISPLAY AI EVALUATION
        // =================================================

        let evaluationHTML = `

            <strong>
                🤖 AI Evaluation
            </strong>

            <br><br>

            <strong>
                Score:
            </strong>

            ${evaluation.score}/10

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

        `;


        // =================================================
        // STEP 4 — CODING REFERENCE SOLUTION
        // =================================================

        if (
            category === "Coding" &&
            question.solution
        ) {

            evaluationHTML += `

                <br><br>

                <hr>

                <br>

                <strong>
                    💡 Correct Reference Solution
                </strong>

                <br><br>

                <pre
                    style="
                        text-align:left;
                        background:#f4f4f4;
                        padding:15px;
                        border-radius:8px;
                        overflow-x:auto;
                    "
                >${escapeHTML(
                    question.solution
                )}</pre>

            `;
        }


        // =================================================
        // STEP 5 — NEXT QUESTION
        // =================================================

        evaluationHTML += `

            <br><br>

            <button
                onclick="nextQuestion()"
            >
                Next Question →
            </button>

        `;


        message.innerHTML =
            evaluationHTML;


        // =================================================
        // HIDE ANSWER BOX
        // =================================================

        answerBox.style.display =
            "none";


        // =================================================
        // HIDE SUBMIT BUTTON
        // =================================================

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
    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;
}


// =====================================================
// NEXT QUESTION
// =====================================================

function nextQuestion() {

    currentQuestion++;

    showQuestion();
}


// =====================================================
// GENERATE REPORT
// =====================================================

async function generateReport() {

    try {

        // =================================================
        // GENERATE REPORT
        // =================================================

        const response =
            await fetch(

                `http://127.0.0.1:5000/api/report/generate/${sessionId}`,

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


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!response.ok) {

            document.getElementById("message").innerHTML =
                data.message ||
                "Report generation failed.";

            return;
        }


        // =================================================
        // SAVE REPORT ID
        // =================================================

        localStorage.setItem(

            "report_id",

            data.report_id

        );


        // =================================================
        // OPEN REPORT PAGE
        // =================================================

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


// =====================================================
// START INTERVIEW
// =====================================================

loadQuestions();