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
  age: number;
  medicalHistory: string;
  symptoms: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
  };
}) {
  try {
    console.log("Generating health prediction for patient data:", {
      age: patientData.age,
      hasHistory: !!patientData.medicalHistory,
      symptomsCount: patientData.symptoms.length,
      vitalSigns: patientData.vitalSigns
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a healthcare AI assistant that helps analyze patient data and provide health insights. Be concise and professional in your analysis."
        },
        {
          role: "user",
          content: `Please analyze the following patient data and provide health insights and recommendations:
          Age: ${patientData.age}
          Medical History: ${patientData.medicalHistory}
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
  } catch (error) {
    console.error("Error generating health prediction:", error);
    throw new Error("Failed to generate health prediction");
  }
}