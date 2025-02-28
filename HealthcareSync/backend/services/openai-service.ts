import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Log OpenAI configuration status without exposing the key
console.log("OpenAI API Configuration Status:", {
  keyConfigured: !!process.env.OPENAI_API_KEY,
  keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 3)
});

export async function generateHealthPrediction(patientData: {
  symptoms: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
  };
}) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("The AI service is not properly configured");
    }

    // Log the input data for debugging
    console.log("Generating health prediction for patient data:", {
      symptomsCount: patientData.symptoms?.length || 0,
      symptoms: patientData.symptoms,
      vitalSigns: patientData.vitalSigns
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a healthcare AI assistant that helps analyze patient data and provide health insights. Be concise and professional in your analysis."
        },
        {
          role: "user",
          content: `Please analyze the following patient data and provide health insights and recommendations:
          Current Symptoms: ${patientData.symptoms.join(", ")}
          Vital Signs:
          - Blood Pressure: ${patientData.vitalSigns.bloodPressure}
          - Heart Rate: ${patientData.vitalSigns.heartRate}
          - Temperature: ${patientData.vitalSigns.temperature}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log("Successfully generated prediction");
    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error("Error generating health prediction:", error);
    if (error.code === 'insufficient_quota') {
      throw new Error("The AI service is temporarily unavailable. Please try again later or contact support.");
    }

    throw new Error("Unable to generate prediction at this time. Please try again later.");
  }
}

export interface HealthPredictionInput {
  symptoms: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
  };
}