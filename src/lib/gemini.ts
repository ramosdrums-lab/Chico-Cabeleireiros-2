import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

// Ensure process.env.GEMINI_API_KEY is defined in your environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY not found in environment. Smart Assistant will be disabled.");
}

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const SALON_TOOLS: FunctionDeclaration[] = [
  {
    name: "get_salon_info",
    description: "Retorna informações básicas sobre o salão, como morada, contacto e profissional.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_services",
    description: "Lista todos os serviços disponíveis no salão com preços e durações.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "check_availability",
    description: "Verifica os horários disponíveis para uma data específica.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "Data no formato YYYY-MM-DD",
        },
      },
      required: ["date"],
    },
  },
];
