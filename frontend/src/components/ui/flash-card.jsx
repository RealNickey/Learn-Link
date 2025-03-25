import React, { useState, useEffect } from 'react';
import { Button } from "./button";
import { X } from "lucide-react";

export function FlashCard({ isOpen, onClose, pdfData }) {
  const [cards, setCards] = useState([
    {
      frontText: 'What is a Flash Card?',
      backText: 'A learning tool for memorization using cards with questions on one side and answers on the other.',
      isFlipped: false
    },
    {
      frontText: 'How to use Flash Cards?',
      backText: 'Click the button below to flip the card and reveal the answer!',
      isFlipped: false
    },
    {
      frontText: 'Upload a PDF to begin',
      backText: 'Select a PDF file to generate custom flash cards based on the content.',
      isFlipped: false
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      if (pdfData && isOpen) {
        setLoading(true);
        try {
          const response = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfFiles: [pdfData] })
          });
          const data = await response.json();
          
          // Transform quiz questions into flashcard format (take first 3)
          const flashcardData = data.questions.slice(0, 3).map(q => ({
            frontText: q.question,
            backText: `Answer: ${q.options[q.correctAnswer]}\n\nExplanation: ${q.explanation}`,
            isFlipped: false
          }));
          
          setCards(flashcardData);
        } catch (error) {
          console.error('Error loading questions:', error);
        }
        setLoading(false);
      }
    };

    loadQuestions();
  }, [pdfData, isOpen]);

  if (!isOpen) return null;

  const handleFlip = (index) => {
    const updatedCards = [...cards];
    updatedCards[index].isFlipped = !updatedCards[index].isFlipped;
    setCards(updatedCards);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-in fade-in">
      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 400px;
          text-align: center;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }
        .flashcard-inner.flipped {
          transform: rotateY(180deg);
        }
        .flashcard-front,
        .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        .flashcard-back {
          transform: rotateY(180deg);
        }
        .flashcard-text {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          white-space: pre-wrap;
          overflow-y: auto;
        }
      `}</style>

      <div className="bg-background p-8 rounded-lg shadow-xl relative max-w-[90vw] overflow-x-auto">
        <Button 
          variant="ghost" 
          className="absolute right-2 top-2 hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-bold mb-6 text-center">Flashcards</h2>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[500px]">
            <span>Loading questions...</span>
          </div>
        ) : (
          <div className="flex gap-6 items-start min-h-[500px] p-4 justify-center">
            {cards.map((card, index) => (
              <div key={index} className="flex-shrink-0 w-[400px] relative">
                <div className="perspective">
                  <div className={`flashcard-inner relative ${card.isFlipped ? 'flipped' : ''}`}>
                    <div className="flashcard-front absolute w-full">
                      <textarea
                        className="w-full h-[400px] p-6 rounded-lg bg-neutral-900 resize-none border border-neutral-800
                                  text-center flex items-center justify-center text-lg focus:ring-2 focus:ring-primary/50
                                  flashcard-text"
                        value={card.frontText}
                        readOnly
                      />
                    </div>
                    <div className="flashcard-back absolute w-full">
                      <textarea
                        className="w-full h-[400px] p-6 rounded-lg bg-neutral-900 resize-none border border-neutral-800
                                  text-center flex items-center justify-center text-lg focus:ring-2 focus:ring-primary/50
                                  flashcard-text"
                        value={card.backText}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={() => handleFlip(index)}
                    className="px-6 py-2 text-sm font-medium"
                  >
                    {card.isFlipped ? 'Show Question' : 'Show Answer'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
