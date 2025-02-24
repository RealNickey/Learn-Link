import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';

const QuizPanel = ({ quiz, isOpen, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const containerRef = useRef(null);

  // Add this useEffect to handle scrolling
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentQuestion]);

  if (!isOpen) return null;

  const handleAnswer = (questionIndex, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const isQuizComplete = quiz?.questions && 
    Object.keys(userAnswers).length === quiz.questions.length;

  const evaluateQuiz = () => {
    const totalQuestions = quiz.questions.length;
    const correctAnswers = quiz.questions.reduce((count, question, index) => {
      return count + (userAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    setScore((correctAnswers / totalQuestions) * 100);
    setIsSubmitted(true);
  };

  const getAnswerStatus = (questionIndex, optionIndex) => {
    if (!isSubmitted) return '';
    if (quiz.questions[questionIndex].correctAnswer === optionIndex) {
      return 'correct';
    }
    if (userAnswers[questionIndex] === optionIndex) {
      return 'incorrect';
    }
    return '';
  };

  return (
    <div className={`quiz-panel ${isOpen ? 'open' : ''}`}>
      <div className="quiz-content">
        <button className="close-button" onClick={onClose}>×</button>
        {quiz?.questions ? (
          <>
            {isSubmitted && (
              <div className="quiz-result">
                <h2>Quiz Result</h2>
                <p className="score">Score: {score.toFixed(1)}%</p>
              </div>
            )}
            <div className="question-container" ref={containerRef}>
              {isSubmitted ? (
                // Show all questions after submission
                quiz.questions.map((question, qIndex) => (
                  <div 
                    key={qIndex} 
                    className="question"
                    style={{ marginBottom: '2rem' }}
                  >
                    <h3>Question {qIndex + 1}/{quiz.questions.length}</h3>
                    <p>{question.question}</p>
                    <div className="options-grid">
                      {question.options.map((option, index) => (
                        <Button
                          key={index}
                          variant={getAnswerStatus(qIndex, index)}
                          disabled
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    <div className="answer-explanation">
                      <p className="explanation-text">
                        Correct Answer: {question.options[question.correctAnswer]}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                // Show only current question before submission
                <div className="question">
                  <h3>Question {currentQuestion + 1}/{quiz.questions.length}</h3>
                  <p>{quiz.questions[currentQuestion].question}</p>
                  <div className="options-grid">
                    {quiz.questions[currentQuestion].options.map((option, index) => (
                      <Button
                        key={index}
                        variant={userAnswers[currentQuestion] === index ? "secondary" : "outline"}
                        onClick={() => handleAnswer(currentQuestion, index)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="navigation-buttons">
              {!isSubmitted ? (
                // Show navigation and submit buttons before submission
                <>
                  <Button 
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  {isQuizComplete && (
                    <Button 
                      variant="default"
                      onClick={evaluateQuiz}
                    >
                      Submit Quiz
                    </Button>
                  )}
                  <Button 
                    onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                    disabled={currentQuestion === quiz.questions.length - 1}
                  >
                    Next
                  </Button>
                </>
              ) : (
                // Show only close button after submission
                <Button 
                  variant="secondary"
                  onClick={onClose}
                  className="close-quiz-button"
                >
                  Close Quiz
                </Button>
              )}
            </div>
          </>
        ) : (
          <p>No quiz available</p>
        )}
      </div>
    </div>
  );
};

export default QuizPanel;
