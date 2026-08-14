const token = localStorage.getItem("token");

const reportId = localStorage.getItem("report_id");


// =====================================================
// LOAD REPORT
// =====================================================

async function loadReport() {

    if (!token) {

        window.location.href = "index.html";

        return;
    }


    if (!reportId) {

        document.getElementById("score").innerHTML =
            "Report not found.";

        return;
    }


    try {

        const response = await fetch(
            `http://127.0.0.1:5000/api/report/${reportId}`,
            {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        const data = await response.json();


        console.log(
            "Report:",
            data
        );


        if (!response.ok) {

            document.getElementById("score").innerHTML =
                data.message ||
                "Failed to load report.";

            return;
        }


        document.getElementById("score").innerHTML =
            `
            Average Score:
            ${data.average_score}/10
            `;


        document.getElementById("questions").innerHTML =
            `
            Questions Attempted:
            ${data.answered_questions}
            /
            ${data.total_questions}
            `;


        document.getElementById("strengths").innerHTML =
            data.strengths ||
            "No strengths available";


        document.getElementById("improvements").innerHTML =
            data.improvements ||
            "No improvements available";


        document.getElementById("recommendation").innerHTML =
            data.recommendation ||
            "No recommendation available";


    } catch (error) {

        console.error(
            "Report Error:",
            error
        );


        document.getElementById("score").innerHTML =
            "Failed to load report.";

    }

}



// =====================================================
// DOWNLOAD PDF
// =====================================================

async function downloadReport() {

    const currentToken =
        localStorage.getItem("token");

    const currentReportId =
        localStorage.getItem("report_id");


    if (!currentToken) {

        window.location.href =
            "index.html";

        return;
    }


    if (!currentReportId) {

        alert(
            "Report not found."
        );

        return;
    }


    try {

        const response = await fetch(

            `http://127.0.0.1:5000/api/pdf/report/${currentReportId}`,

            {
                method: "GET",

                headers: {

                    "Authorization":
                        "Bearer " + currentToken

                }

            }

        );


        if (!response.ok) {

            let message =
                "Failed to download PDF.";

            try {

                const data =
                    await response.json();

                message =
                    data.message ||
                    message;

            } catch (error) {

                console.error(
                    "PDF Error Response:",
                    error
                );

            }


            alert(message);

            return;
        }


        // Convert response to PDF blob

        const blob =
            await response.blob();


        // Create temporary download URL

        const url =
            window.URL.createObjectURL(blob);


        // Create download link

        const link =
            document.createElement("a");


        link.href =
            url;


        link.download =
            `Interview_Report_${currentReportId}.pdf`;


        document.body.appendChild(link);


        link.click();


        link.remove();


        // Clean up

        window.URL.revokeObjectURL(url);


    } catch (error) {

        console.error(
            "PDF Download Error:",
            error
        );


        alert(
            "Failed to download PDF."
        );

    }

}



// =====================================================
// START
// =====================================================

loadReport();