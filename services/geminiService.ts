
import { GoogleGenAI, Type } from "@google/genai";
import { AuraAnalysis, GoalType, MacroStats, PantryItem, UserProfile, MealPlanEntry, ShoppingItem, BioFeedbackEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a hyper-realistic photographic asset for the UI background.
 */
export const generateUIAsset = async (subject: string, isEvening: boolean): Promise<string | undefined> => {
  try {
    const prompt = `Hyper-realistic minimalist professional food photography of ${subject}. 
    ${isEvening ? 'Dramatic low-key lighting, deep shadows, isolated on a pure black background' : 'Bright clean studio lighting, soft shadows, isolated on a pure white background'}. 
    Macro focus, 8k resolution, organic textures, luxury aesthetic. No humans.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error(`Asset generation for ${subject} failed`, error);
    return undefined;
  }
};

export const generateMealVisualization = async (mealName: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-end minimalist professional food photography of ${mealName}. Neutral stone background, dramatic soft side-lighting, organic textures, elite culinary aesthetic. No humans, just the raw ingredients or plated dish.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed", error);
    return undefined;
  }
};

export const generateShoppingListFromPlan = async (
  mealPlan: MealPlanEntry[],
  pantry: PantryItem[]
): Promise<ShoppingItem[]> => {
  const pantryList = pantry.map(p => p.name).join(", ");
  const planList = mealPlan.map(m => `${m.mealName}: ${m.ingredients.join(", ")}`).join("; ");

  const systemInstruction = `You are SEED, an elite culinary strategist. 
Compare the requested Meal Plan against the user's current Pantry. 
Identify exactly what ingredients are missing to complete the planned meals.
Group items by category (e.g., Produce, Protein, Grains).
Exclude staples the user already has.
OUTPUT ONLY JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Pantry: ${pantryList}. Meal Plan: ${planList}. Generate shopping list.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            isPurchased: { type: Type.BOOLEAN }
          },
          required: ["id", "name", "category", "isPurchased"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeMealWithAura = async (
  mealDescription: string,
  userGoal: GoalType,
  targets: MacroStats,
  pantry: PantryItem[],
  profile: UserProfile,
  history: AuraAnalysis[],
  bioFeedback: BioFeedbackEntry[]
): Promise<AuraAnalysis> => {
  const pantryList = pantry.map(p => p.name).join(", ");
  const recentMeals = history.slice(0, 5).map(m => `${m.mealName} (${m.stats.kcal}kcal)`).join(", ");
  const recentSymptoms = bioFeedback.slice(0, 5).map(s => `Energy: ${s.energy}, Bloating: ${s.bloating}, Notes: ${s.notes}`).join("; ");
  
  const heightM = profile.heightCm / 100;
  const bmi = profile.weightKg / (heightM * heightM);
  let bmiCategory = "";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Healthy weight";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obesity";

  const systemInstruction = `You are "SEED," a luxury nutrition concierge and elite metabolic scientist.
Your persona: Professional, minimalist, and analytical.

TASKS:
1. Analyze meal calories and macros.
2. Calculate a "Sustenance Score" (0-100) based on whole/plant-based vs processed.
3. Calculate "Metabolic Flexibility": Predict how this specific meal affects tomorrow's energy.
4. CORRELATE: Compare this meal with RECENT SYMPTOMS and MEALS. 
   - Identify potential sensitivities (e.g., "Dairy seems linked to bloating 2h after intake").
   - Mention these findings in 'correlationAnalysis'.
5. Provide a "Metabolic Prescription".
6. Suggest a meal from [AVAILABLE_RESOURCES].

USER CONTEXT:
- BMI: ${bmi.toFixed(1)} (${bmiCategory})
- Goal: ${userGoal}
- Recent Symptoms: ${recentSymptoms || 'None logged'}
- Recent Meals: ${recentMeals || 'None logged'}
- Available Resources: ${pantryList}

STRICT JSON OUTPUT FORMAT REQUIRED.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this intake: ${mealDescription}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mealName: { type: Type.STRING },
          stats: {
            type: Type.OBJECT,
            properties: {
              kcal: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            },
            required: ["kcal", "protein", "carbs", "fat"]
          },
          sustenanceScore: { type: Type.NUMBER },
          goalAlignment: { type: Type.NUMBER },
          correlationAnalysis: { type: Type.STRING, description: "Correlate meal ingredients with symptoms history." },
          metabolicFlexibility: {
            type: Type.OBJECT,
            properties: {
              stabilityRating: { type: Type.NUMBER },
              forecast: { type: Type.STRING },
              proactiveProtocol: { type: Type.STRING }
            },
            required: ["stabilityRating", "forecast", "proactiveProtocol"]
          },
          eliteAdjustment: {
            type: Type.OBJECT,
            properties: {
              add: { type: Type.STRING },
              reduce: { type: Type.STRING }
            }
          },
          metabolicPrescription: {
            type: Type.OBJECT,
            properties: {
              dailyKcalTarget: { type: Type.NUMBER },
              mealFrequency: { type: Type.STRING },
              bmiDirective: { type: Type.STRING },
              focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["dailyKcalTarget", "mealFrequency", "bmiDirective", "focusAreas"]
          },
          resourceRecipe: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            }
          },
          insight: {
            type: Type.OBJECT,
            properties: {
              performanceNote: { type: Type.STRING },
              quote: { type: Type.STRING },
              theme: { type: Type.STRING, enum: ["#86A789", "#D2B48C", "#E2725B"] }
            }
          }
        },
        required: ["mealName", "stats", "sustenanceScore", "goalAlignment", "metabolicFlexibility", "eliteAdjustment", "metabolicPrescription", "resourceRecipe", "insight"]
      }
    }
  });

  const analysis = JSON.parse(response.text) as AuraAnalysis;
  
  // Generate visualization for the meal
  analysis.visualizationUrl = await generateMealVisualization(analysis.mealName);
  
  return analysis;
};
