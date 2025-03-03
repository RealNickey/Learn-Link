import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const FlashCards = ({ isOpen, onClose }) => {
  const [cards, setCards] = useState([{ front: "", back: "", isFlipped: false }]);
  const [activeCard, setActiveCard] = useState(0);

  const handleCardChange = (index, side, value) => {
    const newCards = [...cards];
    newCards[index][side] = value;
    setCards(newCards);
  };

  const addCard = () => {
    setCards([...cards, { front: "", back: "", isFlipped: false }]);
  };

  const toggleCard = (index) => {
    const newCards = [...cards];
    newCards[index].isFlipped = !newCards[index].isFlipped;
    setCards(newCards);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-neutral-900 rounded-lg p-6 w-[90%] max-w-2xl relative z-[10000]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Flash Cards</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full aspect-[3/2] perspective-1000">
            <div
              className={cn(
                "w-full h-full transition-all duration-500 preserve-3d cursor-pointer",
                cards[activeCard]?.isFlipped && "rotate-y-180"
              )}
              onClick={() => toggleCard(activeCard)}
            >
              {/* Front of card */}
              <div className="absolute inset-0 backface-hidden">
                <textarea
                  className="w-full h-full p-4 bg-neutral-800 rounded-lg resize-none"
                  placeholder="Enter question or term..."
                  value={cards[activeCard]?.front || ""}
                  onChange={(e) =>
                    handleCardChange(activeCard, "front", e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Back of card */}
              <div className="absolute inset-0 rotate-y-180 backface-hidden">
                <textarea
                  className="w-full h-full p-4 bg-neutral-700 rounded-lg resize-none"
                  placeholder="Enter answer or explanation..."
                  value={cards[activeCard]?.back || ""}
                  onChange={(e) =>
                    handleCardChange(activeCard, "back", e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setActiveCard((prev) =>
                  prev > 0 ? prev - 1 : cards.length - 1
                )
              }
              className="px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setActiveCard((prev) =>
                  prev < cards.length - 1 ? prev + 1 : 0
                )
              }
              className="px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700"
            >
              Next
            </button>
            <button
              onClick={addCard}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Add Card
            </button>
          </div>

          <div className="text-sm text-neutral-400 mt-2">
            Click card to flip • {activeCard + 1} of {cards.length}
          </div>
        </div>
      </div>
    </div>
  );
};
