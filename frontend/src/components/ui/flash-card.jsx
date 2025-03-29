import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { X } from "lucide-react";

export function FlashCard({ isOpen, onClose, pdfData }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFlashcards = async () => {
      if (pdfData && isOpen) {
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append("pdf", pdfData);

          // Use the new endpoint for flashcards
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/generate-flashcards`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.flashcards && Array.isArray(data.flashcards)) {
            // Map the flashcards and add isFlipped property
            const flashcardData = data.flashcards.map((card) => ({
              ...card,
              isFlipped: false,
            }));

            setCards(flashcardData);
          } else {
            throw new Error("Invalid flashcard data received");
          }
        } catch (error) {
          console.error("Error loading flashcards:", error);
          // Keep default flashcards if there's an error
        }
        setLoading(false);
      }
    };

    loadFlashcards();
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
        .flashcard-loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        }
        .flashcard-loading {
          position: relative;
          width: 80px;
          height: 80px;
          animation: spin 1.5s linear infinite;
        }
        .flashcard-loading-inner {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #333;
          border-radius: 8px;
        }
        .flashcard-loading-inner.front {
          transform: rotateY(0deg);
        }
        .flashcard-loading-inner.back {
          transform: rotateY(180deg);
        }
        @keyframes spin {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
      `}</style>

      <div className="bg-background rounded-lg shadow-xl relative w-full max-w-[90vw] min-h-[600px] overflow-hidden">
        <Button
          variant="ghost"
          className="absolute right-2 top-2 hover:bg-muted z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <h2 className="text-xl font-bold mb-6 text-center pt-8">Flashcards</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[500px]">
            <div className="flashcard-loading-container">
              <div className="flashcard-loading">
                <div className="flashcard-loading-inner front"></div>
                <div className="flashcard-loading-inner back"></div>
              </div>
            </div>
            <p className="text-neutral-400 animate-pulse mt-4">
              Creating your flashcards...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-6 items-start min-h-[500px] p-4 justify-center min-w-max">
              {cards.map((card, index) => (
                <div key={index} className="flex-shrink-0 w-[400px] relative">
                  <div className="perspective">
                    <div
                      className={`flashcard-inner relative ${
                        card.isFlipped ? "flipped" : ""
                      }`}
                    >
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
                      {card.isFlipped ? "Show Question" : "Show Answer"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
