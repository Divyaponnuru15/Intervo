// 
// INTERVO - VOICE INTERVIEW
// 


// 
// INTERVIEW SETTINGS
// 

let questions = [];

let currentQuestion = 0;

const MAX_QUESTIONS = 5;

let recognition = null;

let isListening = false;


// 
// LOCAL STORAGE
// 

const token =
    localStorage.getItem("token");

const sessionId =
    localStorage.getItem("session_id");

const category =
    localStorage.getItem("interview_category");


// 
// GET ELEMENTS
// 

const questionText =
    document.getElementById("questionText");

const progress =
    document.getElementById("progress");

const interviewType =
    document.getElementById("interviewType");

const voiceAnswer =
    document.getElementById("voiceAnswer");

const startVoiceButton =
    document.getElementById("startVoiceButton");

const stopVoiceButton =
    document.getElementById("stopVoiceButton");

const clearVoiceButton =
    document.getElementById("clearVoiceButton");

const submitVoiceButton =
    document.getElementById("submitVoiceButton");

const voiceMessage =
    document.getElementById("voiceMessage");

const evaluationSection =
    document.getElementById("evaluationSection");

const evaluationContent =
    document.getElementById("evaluationContent");

const nextQuestionButton =
    document.getElementById("nextQuestionButton");


// 
// CHECK REQUIRED ELEMENTS
// 

if (
    !questionText ||
    !progress ||
    !interviewType ||
    !voiceAnswer ||
    !startVoiceButton ||
    !stopVoiceButton ||
    !clearVoiceButton ||
    !submitVoiceButton ||
    !voiceMessage ||
    !evaluationSection ||
    !evaluationContent ||
    !nextQuestionButton
) {

    console.error(
        "Voice Interview: Required HTML elements are missing."
    );

}


// 
// CHECK LOGIN
// 

if (!token) {

    window.location.href =
        "index.html";

}


// 
// CHECK SESSION
// 

if (!sessionId) {

    voiceMessage.textContent =
        "Interview session not found.";

}


// 
// CHECK CATEGORY
// 

if (!category) {

    voiceMessage.textContent =
        "Interview category not selected.";

} else {

    interviewType.textContent =
        `${category} Interview`;

}


// 
// LOAD QUESTIONS
// 

async function loadQuestions() {

    try {

        // 
        // BASIC VALIDATION
        // 

        if (!token) {
            return;
        }

        if (!sessionId) {
            return;
        }

        if (!category) {
            return;
        }


        voiceMessage.textContent =
            "Loading interview questions...";


        // 
        // REQUEST QUESTIONS
        // 

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
            "Voice Questions Response:",
            data
        );


        // 
        // CHECK RESPONSE
        // 

        if (!response.ok) {

            voiceMessage.textContent =
                data.message ||
                "Unable to load questions.";

            return;

        }


        // 
        // VALIDATE QUESTIONS
        // 

        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            voiceMessage.textContent =
                "Invalid questions received from server.";

            return;

        }


        // 
        // STORE FIRST 5 QUESTIONS
        // 

        questions =
            data.questions.slice(
                0,
                MAX_QUESTIONS
            );


        console.log(
            "Voice Interview Questions:",
            questions
        );


        // 
        // CHECK QUESTIONS
        // 

        if (questions.length === 0) {

            voiceMessage.textContent =
                "No questions found.";

            return;

        }


        // 
        // START INTERVIEW
        // 

        currentQuestion = 0;

        showQuestion();

    }


    catch (error) {

        console.error(
            "Voice Question Error:",
            error
        );


        voiceMessage.textContent =
            "Failed to connect to server.";

    }

}


// 
// SHOW QUESTION
// 

function showQuestion() {

    // 
    // CHECK INTERVIEW COMPLETION
    // 

    if (
        currentQuestion >=
        questions.length
    ) {

        completeInterview();

        return;

    }


    // 
    // GET CURRENT QUESTION
    // 

    const question =
        questions[currentQuestion];


    if (!question) {

        console.error(
            "Question not found."
        );

        return;

    }


    // 
    // STOP ANY PREVIOUS RECOGNITION
    // 

    if (
        recognition &&
        isListening
    ) {

        try {

            recognition.stop();

        }

        catch (error) {

            console.log(
                "Recognition already stopped."
            );

        }

    }


    isListening =
        false;


    // 
    // UPDATE PROGRESS
    // 

    progress.textContent =
        `Question ${currentQuestion + 1} / ${questions.length}`;


    // 
    // DISPLAY QUESTION
    // 

    questionText.textContent =
        question.question;


    // 
    // CLEAR PREVIOUS ANSWER
    // 

    clearVoiceAnswer();


    // 
    // RESET EVALUATION
    // 

    evaluationSection.style.display =
        "none";

    evaluationContent.innerHTML =
        "";


    // 
    // SHOW VOICE CONTROLS
    // IMPORTANT FOR EVERY QUESTION
    // 

    startVoiceButton.style.display =
        "inline-block";

    stopVoiceButton.style.display =
        "inline-block";

    clearVoiceButton.style.display =
        "inline-block";

    submitVoiceButton.style.display =
        "inline-block";


    // 
    // RESET BUTTON STATES
    // 

    startVoiceButton.disabled =
        false;

    stopVoiceButton.disabled =
        true;

    clearVoiceButton.disabled =
        false;

    submitVoiceButton.disabled =
        true;


    // 
    // RESET START BUTTON TEXT
    // 

    startVoiceButton.textContent =
        "🎙️ Start Speaking";


    // 
    // RESET MESSAGE
    // 

    voiceMessage.textContent =
        "Click Start Speaking to answer.";


    // 
    // HIDE NEXT QUESTION
    // 

    nextQuestionButton.style.display =
        "none";

}


// 
// SPEECH RECOGNITION
// 

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


// 
// CHECK BROWSER SUPPORT
// 

if (!SpeechRecognition) {

    voiceMessage.textContent =
        "Voice recognition is not supported in this browser. Please use Google Chrome.";

    startVoiceButton.disabled =
        true;

    stopVoiceButton.disabled =
        true;


} else {


    // 
    // CREATE RECOGNITION
    // 

    recognition =
        new SpeechRecognition();


    // 
    // RECOGNITION SETTINGS
    // 

    recognition.continuous =
        true;

    recognition.interimResults =
        true;

    recognition.lang =
        "en-US";


    // 
    // START EVENT
    // 

    recognition.onstart =
        function () {

            isListening =
                true;


            // -----------------------------------------
            // BUTTON STATES
            // -----------------------------------------

            startVoiceButton.disabled =
                true;

            stopVoiceButton.disabled =
                false;

            clearVoiceButton.disabled =
                false;

            submitVoiceButton.disabled =
                true;


            // -----------------------------------------
            // BUTTON TEXT
            // -----------------------------------------

            startVoiceButton.textContent =
                "🎙️ Listening...";


            // -----------------------------------------
            // MESSAGE
            // -----------------------------------------

            voiceMessage.textContent =
                "🎙️ Listening... Speak your answer.";

        };


    // 
    // RESULT EVENT
    // 

    recognition.onresult =
        function (event) {

            let finalTranscript =
                "";

            let interimTranscript =
                "";


            // 
            // PROCESS SPEECH RESULTS
            // 

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const transcript =
                    event.results[i][0].transcript;


                // -----------------------------------------
                // FINAL SPEECH
                // -----------------------------------------

                if (
                    event.results[i].isFinal
                ) {

                    finalTranscript +=
                        transcript + " ";

                }


                // -----------------------------------------
                // LIVE / INTERIM SPEECH
                // -----------------------------------------

                else {

                    interimTranscript +=
                        transcript;

                }

            }


            // 
            // SAVE FINAL TEXT
            // 

            if (
                finalTranscript.trim()
            ) {

                const previousText =
                    voiceAnswer.dataset.finalText ||
                    "";


                voiceAnswer.dataset.finalText =
                    previousText +
                    finalTranscript;

            }


            // 
            // GET SAVED TEXT
            // 

            const savedText =
                voiceAnswer.dataset.finalText ||
                "";


            // 
            // DISPLAY TEXT
            // 

            if (
                savedText.trim() ||
                interimTranscript.trim()
            ) {

                voiceAnswer.textContent =
                    savedText +
                    interimTranscript;

            } else {

                voiceAnswer.textContent =
                    "Your spoken answer will appear here...";

            }


            // 
            // ENABLE SUBMIT
            // 

            if (
                savedText.trim() ||
                interimTranscript.trim()
            ) {

                submitVoiceButton.disabled =
                    false;

            }

        };


    // 
    // END EVENT
    // 

    recognition.onend =
        function () {

            isListening =
                false;


            // -----------------------------------------
            // RESET BUTTON STATES
            // -----------------------------------------

            startVoiceButton.disabled =
                false;

            stopVoiceButton.disabled =
                true;

            clearVoiceButton.disabled =
                false;


            // -----------------------------------------
            // RESET START BUTTON
            // -----------------------------------------

            startVoiceButton.textContent =
                "🎙️ Start Speaking";


            // -----------------------------------------
            // CHECK ANSWER
            // -----------------------------------------

            const savedText =
                (
                    voiceAnswer.dataset.finalText ||
                    ""
                ).trim();


            if (savedText) {

                submitVoiceButton.disabled =
                    false;


                voiceMessage.textContent =
                    "Speech captured. You can submit your answer.";

            } else {

                submitVoiceButton.disabled =
                    true;


                voiceMessage.textContent =
                    "No speech detected. Please try again.";

            }

        };


    // 
    // ERROR EVENT
    // 

    recognition.onerror =
        function (event) {

            console.error(
                "Speech Recognition Error:",
                event.error
            );


            isListening =
                false;


            // -----------------------------------------
            // RESET BUTTONS
            // -----------------------------------------

            startVoiceButton.disabled =
                false;

            stopVoiceButton.disabled =
                true;

            clearVoiceButton.disabled =
                false;


            startVoiceButton.textContent =
                "🎙️ Start Speaking";


            // -----------------------------------------
            // ERROR MESSAGES
            // -----------------------------------------

            if (
                event.error ===
                "not-allowed"
            ) {

                voiceMessage.textContent =
                    "🎤 Microphone permission denied. Please allow microphone access.";

            }


            else if (
                event.error ===
                "no-speech"
            ) {

                voiceMessage.textContent =
                    "No speech detected. Please try again.";

            }


            else if (
                event.error ===
                "audio-capture"
            ) {

                voiceMessage.textContent =
                    "Microphone could not be detected.";

            }


            else {

                voiceMessage.textContent =
                    "Voice recognition error. Please try again.";

            }

        };

}


// 
// START VOICE BUTTON
// 

startVoiceButton.addEventListener(
    "click",
    function () {

        // -----------------------------------------
        // CHECK RECOGNITION
        // -----------------------------------------

        if (!recognition) {

            voiceMessage.textContent =
                "Voice recognition is not available.";

            return;

        }


        // -----------------------------------------
        // PREVENT DUPLICATE START
        // -----------------------------------------

        if (isListening) {

            return;

        }


        try {

            // -----------------------------------------
            // CLEAR INTERIM STATE
            // -----------------------------------------

            const existingText =
                voiceAnswer.dataset.finalText ||
                "";


            if (!existingText.trim()) {

                voiceAnswer.textContent =
                    "Listening...";

            }


            // -----------------------------------------
            // START
            // -----------------------------------------

            recognition.start();

        }


        catch (error) {

            console.error(
                "Start Recognition Error:",
                error
            );

        }

    }
);


// 
// STOP VOICE BUTTON
// 

stopVoiceButton.addEventListener(
    "click",
    function () {

        if (!recognition) {

            return;

        }


        if (!isListening) {

            return;

        }


        try {

            recognition.stop();

        }

        catch (error) {

            console.error(
                "Stop Recognition Error:",
                error
            );

        }

    }
);


// 
// CLEAR TEXT BUTTON
// 

clearVoiceButton.addEventListener(
    "click",
    function () {

        // -----------------------------------------
        // STOP LISTENING
        // -----------------------------------------

        if (
            recognition &&
            isListening
        ) {

            try {

                recognition.stop();

            }

            catch (error) {

                console.log(
                    "Recognition already stopped."
                );

            }

        }


        // -----------------------------------------
        // CLEAR ANSWER
        // -----------------------------------------

        clearVoiceAnswer();


        // -----------------------------------------
        // MESSAGE
        // -----------------------------------------

        voiceMessage.textContent =
            "Answer cleared.";

    }
);


// 
// CLEAR VOICE ANSWER
// 

function clearVoiceAnswer() {

    // -----------------------------------------
    // RESET TEXT
    // -----------------------------------------

    voiceAnswer.textContent =
        "Your spoken answer will appear here...";


    // -----------------------------------------
    // CLEAR SAVED TEXT
    // -----------------------------------------

    voiceAnswer.dataset.finalText =
        "";


    // -----------------------------------------
    // DISABLE SUBMIT
    // -----------------------------------------

    submitVoiceButton.disabled =
        true;


    // -----------------------------------------
    // RESET LISTENING STATE
    // -----------------------------------------

    isListening =
        false;

}


// 
// SUBMIT BUTTON
// 

submitVoiceButton.addEventListener(
    "click",
    submitVoiceAnswer
);


// 
// SUBMIT VOICE ANSWER
// 

async function submitVoiceAnswer() {

    // 
    // GET FINAL ANSWER
    // 

    const answer =
        (
            voiceAnswer.dataset.finalText ||
            ""
        ).trim();


    // 
    // VALIDATE ANSWER
    // 

    if (!answer) {

        alert(
            "Please speak your answer first."
        );

        return;

    }


    // 
    // CURRENT QUESTION
    // 

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


    try {

        // 
        // DISABLE CONTROLS
        // 

        submitVoiceButton.disabled =
            true;

        startVoiceButton.disabled =
            true;

        stopVoiceButton.disabled =
            true;

        clearVoiceButton.disabled =
            true;


        voiceMessage.textContent =
            "Submitting your answer...";


        // 
        // STEP 1 — SAVE ANSWER
        // 

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
            "Voice Submit Response:",
            submitData
        );


        // 
        // CHECK SUBMISSION
        // 

        if (!submitResponse.ok) {

            voiceMessage.textContent =
                submitData.message ||
                "Answer submission failed.";


            submitVoiceButton.disabled =
                false;


            clearVoiceButton.disabled =
                false;


            return;

        }


        // 
        // GET ANSWER ID
        // 

        const answerId =
            submitData.answer_id;


        if (!answerId) {

            voiceMessage.textContent =
                "Answer saved, but answer ID was not returned.";


            submitVoiceButton.disabled =
                false;


            clearVoiceButton.disabled =
                false;


            return;

        }


        // 
        // STEP 2 — AI EVALUATION
        // 

        voiceMessage.textContent =
            "🤖 AI evaluating your spoken answer...";


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
            "Voice Evaluation:",
            evaluationData
        );


        // 
        // CHECK EVALUATION
        // 

        if (!evaluationResponse.ok) {

            voiceMessage.textContent =
                evaluationData.message ||
                "AI evaluation failed.";


            submitVoiceButton.disabled =
                false;


            clearVoiceButton.disabled =
                false;


            return;

        }


        // 
        // GET EVALUATION
        // 

        const evaluation =
            evaluationData.evaluation;


        if (!evaluation) {

            voiceMessage.textContent =
                "AI evaluation was not returned.";


            submitVoiceButton.disabled =
                false;


            clearVoiceButton.disabled =
                false;


            return;

        }


        // 
        // DISPLAY EVALUATION
        // 

        displayEvaluation(
            evaluation,
            question
        );


        // 
        // HIDE VOICE CONTROLS
        // 

        startVoiceButton.style.display =
            "none";

        stopVoiceButton.style.display =
            "none";

        clearVoiceButton.style.display =
            "none";

        submitVoiceButton.style.display =
            "none";


        // 
        // SUCCESS MESSAGE
        // 

        voiceMessage.textContent =
            "✅ Answer evaluated successfully.";

    }


    catch (error) {

        console.error(
            "Voice Answer Error:",
            error
        );


        voiceMessage.textContent =
            "Something went wrong. Please try again.";


        submitVoiceButton.disabled =
            false;


        clearVoiceButton.disabled =
            false;

    }

}


// 
// DISPLAY AI EVALUATION
// 

function displayEvaluation(
    evaluation,
    question
) {

    // 
    // BUILD EVALUATION HTML
    // 

    let evaluationHTML = `

        <div class="evaluation-score">

            <strong>
                Score:
            </strong>

            ${escapeHTML(
                String(
                    evaluation.score ?? "N/A"
                )
            )}/10

        </div>


        <div class="evaluation-item">

            <h3>
                💬 Feedback
            </h3>

            <p>
                ${escapeHTML(
                    evaluation.feedback || ""
                )}
            </p>

        </div>


        <div class="evaluation-item">

            <h3>
                💪 Strengths
            </h3>

            <p>
                ${escapeHTML(
                    evaluation.strengths || ""
                )}
            </p>

        </div>


        <div class="evaluation-item">

            <h3>
                📈 Improvements
            </h3>

            <p>
                ${escapeHTML(
                    evaluation.improvements || ""
                )}
            </p>

        </div>

    `;


    // 
    // CODING REFERENCE SOLUTION
    // 

    if (
        category === "Coding" &&
        question.solution
    ) {

        evaluationHTML += `

            <div class="evaluation-item">

                <h3>
                    💡 Correct Reference Solution
                </h3>

                <pre>${escapeHTML(
                    question.solution
                )}</pre>

            </div>

        `;

    }


    // 
    // DISPLAY EVALUATION
    // 

    evaluationContent.innerHTML =
        evaluationHTML;


    evaluationSection.style.display =
        "block";


    // 
    // NEXT QUESTION BUTTON
    // 

    if (
        currentQuestion <
        questions.length - 1
    ) {

        nextQuestionButton.textContent =
            "Next Question →";

    } else {

        nextQuestionButton.textContent =
            "Finish Interview →";

    }


    nextQuestionButton.style.display =
        "inline-block";

}


// 
// NEXT QUESTION BUTTON
// 

nextQuestionButton.addEventListener(
    "click",
    function () {

        currentQuestion++;

        showQuestion();

    }
);


// 
// COMPLETE INTERVIEW
// 

function completeInterview() {

    // 
    // UPDATE PROGRESS
    // 

    progress.textContent =
        "Interview Completed";


    // 
    // UPDATE QUESTION
    // 

    questionText.textContent =
        "🎉 Congratulations! Interview completed.";


    // 
    // HIDE ANSWER
    // 

    voiceAnswer.style.display =
        "none";


    // 
    // HIDE CONTROLS
    // 

    startVoiceButton.style.display =
        "none";

    stopVoiceButton.style.display =
        "none";

    clearVoiceButton.style.display =
        "none";

    submitVoiceButton.style.display =
        "none";


    // 
    // HIDE EVALUATION
    // 

    evaluationSection.style.display =
        "none";


    // 
    // MESSAGE
    // 

    voiceMessage.textContent =
        "Generating your interview report...";


    // 
    // GENERATE REPORT
    // 

    generateReport();

}


// 
// GENERATE REPORT
// 

async function generateReport() {

    try {

        // 
        // REQUEST REPORT
        // 

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
            "Voice Interview Report:",
            data
        );


        // 
        // CHECK RESPONSE
        // 

        if (!response.ok) {

            voiceMessage.textContent =
                data.message ||
                "Report generation failed.";

            return;

        }


        // 
        // SAVE REPORT ID
        // 

        localStorage.setItem(
            "report_id",
            data.report_id
        );


        // 
        // OPEN REPORT
        // 

        window.location.href =
            "report.html";

    }


    catch (error) {

        console.error(
            "Voice Report Error:",
            error
        );


        voiceMessage.textContent =
            "Unable to generate report.";

    }

}


// 
// ESCAPE HTML
// 

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


// 
// START INTERVIEW
// 

loadQuestions();