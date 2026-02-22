import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { InventoryItem, MaintenanceTask } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- CHAT AVEC CONTEXTE (Suggestion #4) ---
export const generateChatResponse = async (
  prompt: string, 
  history: { role: string; parts: [{ text: string }] }[],
  inventoryContext?: string
): Promise<string> => {
  try {
    const ai = getClient();
    
    let systemInstruction = "Tu es un assistant de gestion d'inventaire utile et précis.";
    if (inventoryContext) {
        systemInstruction += `\nVoici les données actuelles de l'inventaire de l'utilisateur (en JSON) pour répondre à ses questions : \n${inventoryContext}\n Si l'utilisateur demande "Où est mon câble ?", cherche dans ces données.`;
    }

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: history,
    });
    
    const result = await chat.sendMessage({ message: prompt });
    return result.text || "Aucune réponse générée.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export const generateImageFromText = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
           aspectRatio: "1:1",
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
         if (part.inlineData) {
             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
         }
      }
    }
    throw new Error("Aucune image générée dans la réponse.");

  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const analyzeImageForInventory = async (base64Image: string, currency: string = 'EUR'): Promise<any> => {
  try {
    const ai = getClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)?.[1] || 'image/png';

    const prompt = `
      Tu es un expert en évaluation d'objets pour inventaire. Analyse cette image et extrait les informations suivantes au format JSON strict.
      
      Champs requis dans le JSON :
      - name (string): Nom court et précis.
      - category (string): Catégorie générale.
      - brand (string): La marque visible ou estimée.
      - condition (string): État visuel (Neuf, Excellent, Bon, Moyen, À rénover).
      - purchasePrice (number): Prix neuf estimé (en ${currency}).
      - resaleValue (number): Prix occasion estimé (en ${currency}).
      - description (string): Courte description.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: `image/${mimeType}` } },
          { text: prompt },
        ],
      },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Inventory Analysis Error:", error);
    throw error;
  }
};

// --- SUGGESTION #3: ROOM SCANNER (Batch Add) ---
export const analyzeRoomImage = async (base64Image: string, currency: string = 'EUR'): Promise<any[]> => {
  try {
    const ai = getClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)?.[1] || 'image/png';

    const prompt = `
      Analyse cette image d'une pièce ou d'un ensemble d'objets. Détecte TOUS les objets distincts visibles (jusqu'à 10 max).
      Retourne une liste JSON d'objets.
      Format attendu:
      [
        {
          "name": "Canapé cuir",
          "category": "Mobilier",
          "brand": "Ikea",
          "condition": "Bon",
          "purchasePrice": 500,
          "resaleValue": 200
        },
        ...
      ]
      Note: Les prix doivent être en ${currency}.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: `image/${mimeType}` } },
          { text: prompt },
        ],
      },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Room Analysis Error:", error);
    throw error;
  }
};

// --- SUGGESTION #2: INVOICE OCR ---
export const analyzeInvoiceImage = async (base64Image: string): Promise<any> => {
  try {
    const ai = getClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)?.[1] || 'image/png';

    const prompt = `
      Analyse cette facture/garantie. Extrait les informations clés.
      Retourne un JSON :
      {
        "storeName": "Nom du magasin",
        "purchaseDate": "YYYY-MM-DD",
        "totalAmount": number,
        "items": ["item1", "item2"],
        "warrantyEnd": "YYYY-MM-DD" (si trouvé, sinon null)
      }
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: `image/${mimeType}` } },
          { text: prompt },
        ],
      },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Invoice Analysis Error:", error);
    throw error;
  }
};

export const analyzeImageForBarcode = async (base64Image: string): Promise<any> => {
  try {
    const ai = getClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    const mimeType = base64Image.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)?.[1] || 'image/png';

    const prompt = `
      Cherche un code-barres. Si trouvé, extrait la valeur. Identifie le produit.
      JSON:
      {
        "barcode": "12345" | null,
        "name": "Produit",
        "brand": "Marque",
        "category": "Catégorie",
        "description": "Desc"
      }
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: `image/${mimeType}` } },
          { text: prompt },
        ],
      },
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Barcode Error:", error);
    throw error;
  }
};

export const evaluateItemMarketValue = async (item: InventoryItem, currency: string = 'EUR'): Promise<{ newPrice: number, usedPrice: number, sources: string }> => {
  try {
    const ai = getClient();
    const prompt = `
      Donne la valeur marché actuelle (en ${currency}) pour : ${item.name} (${item.brand}, ${item.condition}).
      JSON: { "newPrice": number, "usedPrice": number, "sources": "string summary" }
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Valuation Error:", error);
    return { newPrice: item.purchasePrice, usedPrice: item.resaleValue, sources: "Erreur" };
  }
};

// --- SUGGESTION #9: MAINTENANCE PLAN ---
export const generateMaintenancePlan = async (item: InventoryItem): Promise<MaintenanceTask[]> => {
  try {
    const ai = getClient();
    const prompt = `
      Génère un plan de maintenance préventive pour cet objet : ${item.name} (${item.category}).
      Liste 3 à 5 tâches d'entretien recommandées pour prolonger sa durée de vie.
      
      Retourne un JSON Array strict :
      [
        {
          "task": "Détartrage complet",
          "frequency": "Trimestriel"
        },
        ...
      ]
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const tasks = JSON.parse(response.text || "[]");
    return tasks.map((t: any) => ({
        id: Date.now().toString() + Math.random().toString(),
        task: t.task,
        frequency: t.frequency,
        isDone: false
    }));
  } catch (error) {
    console.error("Maintenance Gen Error:", error);
    return [];
  }
};

// --- SUGGESTION #5: SALES AD ---
export const generateSalesAd = async (item: InventoryItem, currency: string = 'EUR'): Promise<{ title: string, description: string, recommendedPrice: number }> => {
  try {
    const ai = getClient();
    const prompt = `
      Rédige une annonce de vente attractive pour : ${item.name} (${item.brand}, état ${item.condition}).
      Utilise des techniques de copywriting (AIDA). Suggère un prix psychologique (en ${currency}).
      JSON: { "title": "...", "description": "...", "recommendedPrice": number }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { title: "Erreur", description: "Erreur", recommendedPrice: 0 }; }
};

// --- SUGGESTION #10: UPGRADE COMPARATOR ---
export const compareUpgrade = async (item: InventoryItem, currency: string = 'EUR'): Promise<{ currentModel: string, newModel: string, improvements: string[], priceDiff: number, verdict: string }> => {
   try {
    const ai = getClient();
    const prompt = `
      Compare cet objet (${item.name}) avec le dernier modèle équivalent sorti sur le marché.
      Est-ce que ça vaut le coup de changer ?
      JSON: { "currentModel": "${item.name}", "newModel": "Nom du nouveau", "improvements": ["point 1", "point 2"], "priceDiff": number (coût upgrade estimé en ${currency}), "verdict": "Garder ou Changer" }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { throw e; }
};