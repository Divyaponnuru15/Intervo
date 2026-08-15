//
// INTERVO - VOICE INTERVIEW
//

let questions = [];

let currentQuestion = 0;

const MAX_QUESTIONS = 5;

let recognition = null;

let isListening = false;

let isReadingQuestion = false;


// =========================================================
// LOCAL STORAGE
// =========================================================

const token =
    localStorage.getItem("token");

const sessionId =
    localStorage.getItem("session_id");

const category =
    localStorage.getItem("interview_category");


// =========================================================
// GET ELEMENTS
// =========================================================

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

const readAloudButton =
    document.getElementById("readAloudButton");

const voiceMessage =
    document.getElementById("voiceMessage");

const evaluationSection =
    document.getElementById("evaluationSection");

const evaluationContent =
    document.getElementById("evaluationContent");

const nextQuestionButton =
    document.getElementById("nextQuestionButton");


// =========================================================
// CHECK REQUIRED ELEMENTS
// =========================================================

if (
    !questionText ||
    !progress ||
    !interviewType ||
    !voiceAnswer ||
    !startVoiceButton ||
    !stopVoiceButton ||
    !clearVoiceButton ||
    !submitVoiceButton ||
    !readAloudButton ||
    !voiceMessage ||
    !evaluationSection ||
    !evaluationContent ||
    !nextQuestionButton
) {

    console.error(
        "Voice Interview: Required HTML elements are missing."
    );

}


// =========================================================
// CHECK LOGIN
// =========================================================

if (!token) {

    window.location.href =
        "index.html";

}


// =========================================================
// CHECK SESSION
// =========================================================

if (!sessionId) {

    voiceMessage.textContent =
        "Interview session not found.";

}


// =========================================================
// CHECK CATEGORY
// =========================================================

if (!category) {

    voiceMessage.textContent =
        "Interview category not selected.";

} else {

    interviewType.textContent =
        `${category} Interview`;

}


// =========================================================
// LOAD QUESTIONS
// =========================================================

async function loadQuestions() {

    try {

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


        if (!response.ok) {

            voiceMessage.textContent =
                data.message ||
                "Unable to load questions.";

            return;

        }


        if (
            !data.questions ||
            !Array.isArray(data.questions)
        ) {

            voiceMessage.textContent =
                "Invalid questions received from server.";

            return;

        }


        questions =
            data.questions.slice(
                0,
                MAX_QUESTIONS
            );


        console.log(
            "Voice Interview Questions:",
            questions
        );


        if (questions.length === 0) {

            voiceMessage.textContent =
                "No questions found.";

            return;

        }


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


// =========================================================
// SHOW QUESTION
// =========================================================

function showQuestion() {

    if (
        currentQuestion >=
        questions.length
    ) {

        completeInterview();

        return;

    }


    const question =
        questions[currentQuestion];


    if (!question) {

        console.error(
            "Question not found."
        );

        return;

    }


    // Stop speech recognition

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


    // Stop text-to-speech

    stopReadingQuestion();


    isListening =
        false;


    // Update progress

    progress.textContent =
        `Question ${currentQuestion + 1} / ${questions.length}`;


    // Display question

    questionText.textContent =
        question.question;


    // Reset answer

    clearVoiceAnswer();


    // Reset evaluation

    evaluationSection.style.display =
        "none";

    evaluationContent.innerHTML =
        "";


    // Show controls

    startVoiceButton.style.display =
        "inline-block";

    stopVoiceButton.style.display =
        "inline-block";

    clearVoiceButton.style.display =
        "inline-block";

    submitVoiceButton.style.display =
        "inline-block";

    readAloudButton.style.display =
        "inline-block";


    // Reset buttons

    startVoiceButton.disabled =
        false;

    stopVoiceButton.disabled =
        true;

    clearVoiceButton.disabled =
        false;

    submitVoiceButton.disabled =
        true;

    readAloudButton.disabled =
        false;


    startVoiceButton.textContent =
        "🎙️ Start Speaking";

    readAloudButton.textContent =
        "🔊 Read Aloud";


    voiceMessage.textContent =
        "Click Read Aloud to hear the question or Start Speaking to answer.";


    nextQuestionButton.style.display =
        "none";

}


// =========================================================
// READ QUESTION ALOUD
// =========================================================

function readQuestionAloud() {

    if (
        !("speechSynthesis" in window)
    ) {

        voiceMessage.textContent =
            "Text-to-speech is not supported in this browser.";

        return;

    }


    const question =
        questions[currentQuestion];


    if (!question) {

        return;

    }


    // Stop existing speech

    window.speechSynthesis.cancel();


    const text =
        question.question;


    if (!text) {

        return;

    }


    const speech =
        new SpeechSynthesisUtterance(
            text
        );


    speech.lang =
        "en-US";

    speech.rate =
        0.9;

    speech.pitch =
        1;

    speech.volume =
        1;


    isReadingQuestion =
        true;


    readAloudButton.disabled =
        true;

    readAloudButton.textContent =
        "🔊 Reading...";


    voiceMessage.textContent =
        "🔊 Reading the interview question...";


    speech.onend =
        function () {

            isReadingQuestion =
                false;

            readAloudButton.disabled =
                false;

            readAloudButton.textContent =
                "🔊 Read Aloud";

            voiceMessage.textContent =
                "Question read aloud. Click Start Speaking to answer.";

        };


    speech.onerror =
        function () {

            isReadingQuestion =
                false;

            readAloudButton.disabled =
                false;

            readAloudButton.textContent =
                "🔊 Read Aloud";

            voiceMessage.textContent =
                "Unable to read the question aloud.";

        };


    window.speechSynthesis.speak(
        speech
    );

}


// =========================================================
// STOP READING QUESTION
// =========================================================

function stopReadingQuestion() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }


    isReadingQuestion =
        false;


    if (readAloudButton) {

        readAloudButton.disabled =
            false;

        readAloudButton.textContent =
            "🔊 Read Aloud";

    }

}


// =========================================================
// READ ALOUD BUTTON
// =========================================================

readAloudButton.addEventListener(
    "click",
    function () {

        if (isReadingQuestion) {

            stopReadingQuestion();

            voiceMessage.textContent =
                "Question reading stopped.";

            return;

        }


        readQuestionAloud();

    }
);


// =========================================================
// SPEECH RECOGNITION
// =========================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


// =========================================================
// CHECK BROWSER SUPPORT
// =========================================================

if (!SpeechRecognition) {

    voiceMessage.textContent =
        "Voice recognition is not supported in this browser. Please use Google Chrome.";

    startVoiceButton.disabled =
        true;

    stopVoiceButton.disabled =
        true;

} else {

    recognition =
        new SpeechRecognition();


    recognition.continuous =
        true;

    recognition.interimResults =
        true;

    recognition.lang =
        "en-US";


    // =====================================================
    // RECOGNITION START
    // =====================================================

    recognition.onstart =
        function () {

            isListening =
                true;


            // Stop question reading

            stopReadingQuestion();


            startVoiceButton.disabled =
                true;

            stopVoiceButton.disabled =
                false;

            clearVoiceButton.disabled =
                false;

            submitVoiceButton.disabled =
                true;


            startVoiceButton.textContent =
                "🎙️ Listening...";


            voiceMessage.textContent =
                "🎙️ Listening... Speak your answer.";

        };


    // =====================================================
    // RECOGNITION RESULT
    // =====================================================

    recognition.onresult =
        function (event) {

            let finalTranscript =
                "";

            let interimTranscript =
                "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const transcript =
                    event.results[i][0].transcript;


                if (
                    event.results[i].isFinal
                ) {

                    finalTranscript +=
                        transcript + " ";

                } else {

                    interimTranscript +=
                        transcript;

                }

            }


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


            const savedText =
                voiceAnswer.dataset.finalText ||
                "";


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


            if (
                savedText.trim() ||
                interimTranscript.trim()
            ) {

                submitVoiceButton.disabled =
                    false;

            }

        };


    // =====================================================
    // RECOGNITION END
    // =====================================================

    recognition.onend =
        function () {

            isListening =
                false;


            startVoiceButton.disabled =
                false;

            stopVoiceButton.disabled =
                true;

            clearVoiceButton.disabled =
                false;


            startVoiceButton.textContent =
                "🎙️ Start Speaking";


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


    // =====================================================
    // RECOGNITION ERROR
    // =====================================================

    recognition.onerror =
        function (event) {

            console.error(
                "Speech Recognition Error:",
                event.error
            );


            isListening =
                false;


            startVoiceButton.disabled =
                false;

            stopVoiceButton.disabled =
                true;

            clearVoiceButton.disabled =
                false;


            startVoiceButton.textContent =
                "🎙️ Start Speaking";


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


// =========================================================
// START VOICE BUTTON
// =========================================================

startVoiceButton.addEventListener(
    "click",
    function () {

        if (!recognition) {

            voiceMessage.textContent =
                "Voice recognition is not available.";

            return;

        }


        if (isListening) {

            return;

        }


        // Stop question reading

        stopReadingQuestion();


        try {

            const existingText =
                voiceAnswer.dataset.finalText ||
                "";


            if (!existingText.trim()) {

                voiceAnswer.textContent =
                    "Listening...";

            }


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


// =========================================================
// STOP VOICE BUTTON
// =========================================================

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


// =========================================================
// CLEAR TEXT BUTTON
// =========================================================

clearVoiceButton.addEventListener(
    "click",
    function () {

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


        clearVoiceAnswer();


        voiceMessage.textContent =
            "Answer cleared.";

    }
);


// =========================================================
// CLEAR VOICE ANSWER
// =========================================================

function clearVoiceAnswer() {

    voiceAnswer.textContent =
        "Your spoken answer will appear here...";


    voiceAnswer.dataset.finalText =
        "";


    submitVoiceButton.disabled =
        true;


    isListening =
        false;

}


// =========================================================
// SUBMIT BUTTON
// =========================================================

submitVoiceButton.addEventListener(
    "click",
    submitVoiceAnswer
);


// =========================================================
// SUBMIT VOICE ANSWER
// =========================================================

async function submitVoiceAnswer() {

    const answer =
        (
            voiceAnswer.dataset.finalText ||
            ""
        ).trim();


    if (!answer) {

        alert(
            "Please speak your answer first."
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


    try {

        submitVoiceButton.disabled =
            true;

        startVoiceButton.disabled =
            true;

        stopVoiceButton.disabled =
            true;

        clearVoiceButton.disabled =
            true;

        readAloudButton.disabled =
            true;


        voiceMessage.textContent =
            "Submitting your answer...";


        // =================================================
        // SAVE ANSWER
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
            "Voice Submit Response:",
            submitData
        );


        if (!submitResponse.ok) {

            voiceMessage.textContent =
                submitData.message ||
                "Answer submission failed.";


            submitVoiceButton.disabled =
                false;

            clearVoiceButton.disabled =
                false;

            readAloudButton.disabled =
                false;

            return;

        }


        const answerId =
            submitData.answer_id;


        if (!answerId) {

            voiceMessage.textContent =
                "Answer saved, but answer ID was not returned.";


            submitVoiceButton.disabled =
                false;

            clearVoiceButton.disabled =
                false;

            readAloudButton.disabled =
                false;

            return;

        }


        // =================================================
        // AI EVALUATION
        // =================================================

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


        if (!evaluationResponse.ok) {

            voiceMessage.textContent =
                evaluationData.message ||
                "AI evaluation failed.";


            submitVoiceButton.disabled =
                false;

            clearVoiceButton.disabled =
                false;

            readAloudButton.disabled =
                false;

            return;

        }


        const evaluation =
            evaluationData.evaluation;


        if (!evaluation) {

            voiceMessage.textContent =
                "AI evaluation was not returned.";


            submitVoiceButton.disabled =
                false;

            clearVoiceButton.disabled =
                false;

            readAloudButton.disabled =
                false;

            return;

        }


        displayEvaluation(
            evaluation,
            question
        );


        startVoiceButton.style.display =
            "none";

        stopVoiceButton.style.display =
            "none";

        clearVoiceButton.style.display =
            "none";

        submitVoiceButton.style.display =
            "none";

        readAloudButton.style.display =
            "none";


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

        readAloudButton.disabled =
            false;

    }

}


// =========================================================
// DISPLAY AI EVALUATION
// =========================================================

function displayEvaluation(
    evaluation,
    question
) {

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


    evaluationContent.innerHTML =
        evaluationHTML;


    evaluationSection.style.display =
        "block";


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


// =========================================================
// NEXT QUESTION
// =========================================================

nextQuestionButton.addEventListener(
    "click",
    function () {

        stopReadingQuestion();

        currentQuestion++;

        showQuestion();

    }
);


// =========================================================
// COMPLETE INTERVIEW
// =========================================================

function completeInterview() {

    stopReadingQuestion();


    progress.textContent =
        "Interview Completed";


    questionText.textContent =
        "🎉 Congratulations! Interview completed.";


    voiceAnswer.style.display =
        "none";


    startVoiceButton.style.display =
        "none";

    stopVoiceButton.style.display =
        "none";

    clearVoiceButton.style.display =
        "none";

    submitVoiceButton.style.display =
        "none";

    readAloudButton.style.display =
        "none";


    evaluationSection.style.display =
        "none";


    voiceMessage.textContent =
        "Generating your interview report...";


    generateReport();

}


// =========================================================
// GENERATE REPORT
// =========================================================

async function generateReport() {

    try {

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


        if (!response.ok) {

            voiceMessage.textContent =
                data.message ||
                "Report generation failed.";

            return;

        }


        localStorage.setItem(
            "report_id",
            data.report_id
        );


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


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


// =========================================================
// START INTERVIEW
// =========================================================

loadQuestions();