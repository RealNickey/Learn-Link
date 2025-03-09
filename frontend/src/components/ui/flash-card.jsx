import React, { useState } from 'react';
import { Button } from "./button";
import { X, Plus } from "lucide-react";

export function FlashCard({ isOpen, onClose }) {
  const [cards, setCards] = useState([{ frontText: '', backText: '', isFlipped: false }]);

  if (!isOpen) return null;

  const addNewCard = () => {
    setCards([...cards, { frontText: '', backText: '', isFlipped: false }]);
  };

  const handleFlip = (index) => {
    const updatedCards = [...cards];
    updatedCards[index].isFlipped = !updatedCards[index].isFlipped;
    setCards(updatedCards);
  };

  const updateCardText = (index, side, text) => {
    const updatedCards = [...cards];
    updatedCards[index][side] = text;
    setCards(updatedCards);
  };

  const deleteCard = (indexToDelete) => {
    setCards(cards.filter((_, index) => index !== indexToDelete));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-in fade-in">
      <div className="bg-background p-8 rounded-lg shadow-xl relative max-w-[90vw] overflow-x-auto">
        <Button 
          variant="ghost" 
          className="absolute right-2 top-2 hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-bold mb-6 text-center">Flashcards</h2>
        
        <div className="flex gap-6 items-start min-h-[500px] p-4">
          {cards.map((card, index) => (
            <div key={index} className="flex-shrink-0 w-[400px] relative">
              <div className="perspective">
                <div className={`flashcard-inner relative ${card.isFlipped ? 'flipped' : ''}`}>
                  <div className="flashcard-front absolute w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-50 h-6 w-6 bg-neutral-800/50 hover:bg-neutral-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <textarea
                      className="w-full h-[400px] p-6 rounded-lg bg-neutral-900 resize-none border border-neutral-800
                                text-center flex items-center justify-center text-lg focus:ring-2 focus:ring-primary/50
                                flashcard-text"
                      placeholder="Enter your question..."
                      value={card.frontText}
                      onChange={(e) => updateCardText(index, 'frontText', e.target.value)}
                    />
                  </div>
                  <div className="flashcard-back absolute w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-50 h-6 w-6 bg-neutral-800/50 hover:bg-neutral-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(index);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <textarea
                      className="w-full h-[400px] p-6 rounded-lg bg-neutral-900 resize-none border border-neutral-800
                                text-center flex items-center justify-center text-lg focus:ring-2 focus:ring-primary/50
                                flashcard-text"
                      placeholder="Enter your answer..."
                      value={card.backText}
                      onChange={(e) => updateCardText(index, 'backText', e.target.value)}
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
          
          <div className="flex-shrink-0 w-[400px] h-[400px] flex items-center justify-center">
            <Button
              onClick={addNewCard}
              variant="outline"
              className="w-full h-full flex flex-col gap-4 items-center justify-center border-dashed border-2"
            >
              <Plus className="h-12 w-12" />
              <span>Add New Card</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
