import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = 3000;

// Add middleware to parse JSON data
app.use(express.json());


const openai = new OpenAI({
    apiKey: "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", // Replace with your OpenAI API key
});

// Get the directory name using ES module compatible method
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const absolutePath = path.resolve(__dirname, 'public');

app.use(express.static(absolutePath));

app.get('/', (req, res) => {
    const filePath = path.join(absolutePath, 'chat.html');
    res.sendFile(filePath);
});

app.post('/get', async (req, res) => {
    console.log('Received request body:', req.body);
    const { msg, threadId } = req.body;
    const assistantId = "asst_FjMnuyEEDaxpUGM4OFB92b52";

    console.log(threadId)

    // You can now use the value of "msg" as needed
    console.log('Received message:', msg);

    if (!threadId) {
        console.log("hi")
        try {
            // Create a new thread if it doesn't exist
            const myThread = await openai.beta.threads.create();
            console.log("New thread created with ID: ", myThread.id, "\n");
            
            // Store the thread ID in localStorage
            threadId = myThread.id;
        } catch (error) {
            console.error("Error creating thread:", error);
            res.status(500).json({ error: "Internal server error" });
            return;
        }
    }

    const message = await openai.beta.threads.messages.create(
        threadId,
        {
          role: "user",
          content: msg
        }
      );

    const run = await openai.beta.threads.runs.create(
        threadId,
        { 
          assistant_id: assistantId,
        }
    );

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function checkRunStatus(threadId, runId) {
        while (true) {
            try {
                const run = await client.beta.threads.runs.retrieve({
                    thread_id: threadId,
                    run_id: runId
                });

                if (run.status === "completed") {
                    break;
                }

                await delay(500); // Delay for 0.5 seconds (500 milliseconds)
            } catch (error) {
                console.error("Error occurred:", error);
                break; // Exit the loop in case of an error
            }
        }
    }

    checkRunStatus(threadId, run.id)
        .then(async () => {
            console.log("Run completed!");

            // Fetch messages after the run is completed
            const messages = await openai.beta.threads.messages.list(
                threadId
            );
            console.log("Messages:", messages); // Process or handle the retrieved messages

            res.status(200).json({
                response: messages.data[0].content[0].text.value,
            });
        })
        .catch(err => {
            console.error("Error:", err);
            res.status(500).send("Error occurred");
        });

});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
