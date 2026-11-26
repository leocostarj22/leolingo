// Rascunho gerado por IA (Groq, modelo gratuito) em 2026-11-26T16:40:53.745Z.
// REVÊ E CORRIGE À MÃO antes de correr scripts/add-audio-dialogues.ts.
// Este ficheiro não é committado — é só um rascunho de trabalho.
import type { DraftEntry } from "./generate-audio-dialogues-draft";

export const draftDialogues: DraftEntry[] = [
  {
    "targetLevel": "BASIC",
    "targetGoal": "TRAVEL",
    "unitTitle": "Inglês em viagem",
    "lessonTitle": "Compras e dinheiro",
    "challenges": [
      {
        "type": "DIALOGUE",
        "question": "Leo: Excuse me, how much is this hat?\nJuba: It's five dollars.\nLeo: Can I pay with a credit card?\nJuba: Sure, that's fine.\nLeo: Here you go. Do I get any change?\nJuba: No change, the total is five dollars.",
        "options": []
      },
      {
        "type": "SELECT",
        "question": "Quanto custa o chapéu?",
        "options": [
          {
            "text": "$5",
            "correct": true
          },
          {
            "text": "$3",
            "correct": false
          },
          {
            "text": "$7",
            "correct": false
          }
        ]
      },
      {
        "type": "WRITE",
        "question": "Como Leo pede para pagar com cartão?",
        "options": [
          {
            "text": "Can I pay with a credit card?",
            "correct": true
          }
        ]
      },
      {
        "type": "SPEAK",
        "question": "Qual a resposta de Juba sobre o troco?",
        "options": [
          {
            "text": "No change, the total is five dollars.",
            "correct": true
          }
        ]
      }
    ]
  },
  {
    "targetLevel": "INTERMEDIATE",
    "targetGoal": "WORK",
    "unitTitle": "Inglês intermédio no trabalho",
    "lessonTitle": "Relatórios e dados",
    "challenges": [
      {
        "type": "DIALOGUE",
        "question": "Leo: Hey Juba, have you looked at the sales report for Q2?\nJuba: Yes, I saw it. Our revenue increased by 12% compared to Q1.\nLeo: That's great. The total sales reached $1.8 million, which is $200k more than last quarter.\nJuba: I also noticed that the number of new customers grew from 350 to 420.\nLeo: So we're on track to beat the annual target.",
        "options": []
      },
      {
        "type": "SELECT",
        "question": "Qual foi o aumento percentual da receita mencionado no diálogo?",
        "options": [
          {
            "text": "12%",
            "correct": true
          },
          {
            "text": "8%",
            "correct": false
          },
          {
            "text": "15%",
            "correct": false
          },
          {
            "text": "20%",
            "correct": false
          }
        ]
      },
      {
        "type": "WRITE",
        "question": "Quantos novos clientes foram adquiridos no trimestre, segundo Juba?",
        "options": [
          {
            "text": "420",
            "correct": true
          }
        ]
      },
      {
        "type": "SPEAK",
        "question": "Em inglês, diz a frase que o Leo disse sobre a meta anual.",
        "options": [
          {
            "text": "So we're on track to beat the annual target.",
            "correct": true
          }
        ]
      }
    ]
  },
  {
    "targetLevel": "ADVANCED",
    "targetGoal": "TRAVEL",
    "unitTitle": "Inglês avançado em viagem",
    "lessonTitle": "Storytelling e experiências",
    "challenges": [
      {
        "type": "DIALOGUE",
        "question": "Leo: Hey Juba, you won't believe the sunrise I witnessed over the cliffs of Santorini last summer.\nJuba: That sounds amazing! What made it stand out compared to other sunrises you've seen?\nLeo: The sky turned a gradient of violet and gold, and the whitewashed houses reflected the light like a watercolor painting.\nJuba: I can imagine. Did the experience change your perspective on traveling alone?\nLeo: Absolutely, it convinced me that solitude can amplify the sensory details, making every moment feel more profound.",
        "options": []
      },
      {
        "type": "SELECT",
        "question": "Qual foi a cor predominante descrita por Leo ao falar do céu?",
        "options": [
          {
            "text": "Vermelho",
            "correct": false
          },
          {
            "text": "Azul",
            "correct": false
          },
          {
            "text": "Violeta",
            "correct": true
          },
          {
            "text": "Verde",
            "correct": false
          }
        ]
      },
      {
        "type": "WRITE",
        "question": "Em inglês, escreve a frase final do Leo sobre viajar sozinho.",
        "options": [
          {
            "text": "It convinced me that solitude can amplify the sensory details, making every moment feel more profound.",
            "correct": true
          }
        ]
      },
      {
        "type": "SPEAK",
        "question": "Em inglês, pergunta à Juba como ela se sentiria ao assistir aquele nascer do sol.",
        "options": [
          {
            "text": "How would you feel watching that sunrise?",
            "correct": true
          }
        ]
      }
    ]
  }
];
