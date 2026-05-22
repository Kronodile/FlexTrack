const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env" });

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say 'hello'");
    const response = await result.response;
    console.log(`Model ${modelName} worked:`, response.text());
  } catch (error) {
    console.error(`Model ${modelName} failed:`, error.message);
  }
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-2.0-flash");
  await testModel("gemini-2.5-flash");
  await testModel("gemini-3.0-flash");
  await testModel("gemini-3-flash");
}
run();
