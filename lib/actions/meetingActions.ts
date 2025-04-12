"use server"

import { Role } from "@11labs/react";

const verifyAndGetQuestions = async (callId: string) => {
    try {
        const api = `${process.env.BACKEND_URL}/interview/verify-interview`;
        const interviewRes = await fetch(
            api,
            {
                method: "POST",
                body: JSON.stringify({
                    callId: callId
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }
        )

        if (interviewRes.status !== 200) {
            const interviewResData = await interviewRes.json();
            return {
                status: interviewResData.statusCode,
                message: interviewResData.message
            }
        }
        const interviewResData = await interviewRes.json();
        return {
            status: interviewResData.statusCode,
            message: interviewResData.message,
            prompt: `You are an interviewer. You need to ask questions and get the answers from user. You need to be very gentle and very specific to the questions.
                please ask the below questions one by one. You need to get answers before you ask next question.
                ${(interviewResData.data.question.questionList as string[]).map((q) => (
                `- ${q}`
            )).join("\n")}
            `
        }


    } catch (error) {
        return {
            status: 500,
            message: "Something went wrong"
        }
    }
}

const createTranscriptionAndSave = async (conversation: { message: string; source: Role }[], callId: string) => {
    try {
        const convString = conversation.map((conv) => `${conv.source}: ${conv.message}`).join("\n");
        const api = `${process.env.BACKEND_URL}/transcript/save-transcript`;
        const transcriptRes = await fetch(
            api,
            {
                method: "POST",
                body: JSON.stringify({
                    "transcript": convString,
                    "callId": callId
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }
        )

        if (transcriptRes.status !== 200) {
            const transcriptResData = await transcriptRes.json();
            return {
                status: transcriptResData.statusCode,
                message: transcriptResData.message
            }
        }
        const transcriptResData = await transcriptRes.json();
        return {
            status: transcriptResData.statusCode,
            message: transcriptResData.message
        }
    } catch (error) {
        console.error(error);
        return {
            status: 500,
            message: "Something went wrong"
        }
    }
}

export {
    verifyAndGetQuestions,
    createTranscriptionAndSave
}