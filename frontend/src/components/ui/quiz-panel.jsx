import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import "./../../styles/quiz-panel.css"; // We'll create this next

const QuizPanel = ({ quiz, isOpen, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const containerRef = useRef(null);

  // Reset state when quiz changes or closes/opens
  useEffect(() => {
    if (isOpen && quiz) {
      setCurrentQuestion(0);
      setUserAnswers({});
      setIsSubmitted(false);
      setScore(null);
    }
  }, [quiz, isOpen]);

  // Scroll to top when changing questions
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentQuestion]);

  if (!quiz?.questions) return null;

  const handleAnswer = (questionIndex, answerIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const isQuizComplete = Object.keys(userAnswers).length === quiz.questions.length;

  const evaluateQuiz = () => {
    const totalQuestions = quiz.questions.length;
    const correctAnswers = quiz.questions.reduce((count, question, index) => {
      return count + (userAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);

    setScore((correctAnswers / totalQuestions) * 100);
    setIsSubmitted(true);
  };

  // Get source file if available
  const getCurrentSource = () => {
    if (!quiz?.questions?.[currentQuestion]?.source) return null;
    return quiz.questions[currentQuestion].source;
  };

  const getButtonStyle = (questionIndex, optionIndex) => {
    if (!isSubmitted) return {};

    const isCorrectAnswer = quiz.questions[questionIndex].correctAnswer === optionIndex;
    const isUserAnswer = userAnswers[questionIndex] === optionIndex;

    if (isCorrectAnswer) {
      return {
        backgroundColor: "rgba(74, 222, 128, 0.2)",
        borderColor: "#4ade80",
        color: "#4ade80",
      };
    }
    if (isUserAnswer && !isCorrectAnswer) {
      return {
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        borderColor: "#ef4444",
        color: "#ef4444",
      };
    }
    return {};
  };

  // Function to handle source display
  const getSourceInfo = (question) => {
    if (!question?.source || question.source === 'undefined' || question.source === 'General') {
      return null;
    }
    return <p className="source-file">From: {question.source}</p>;
  };

  // Function to display question count
  const getQuestionCountText = (index, total) => {
    return `Question ${index + 1} of ${total}`;
  };

  return (
    <div className={`quiz-panel ${isOpen ? "open" : ""}`}>
      <div className="quiz-content">
        <div className="quiz-header">
          <h2>AI Generated Quiz</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        {isSubmitted && (
          <div className="quiz-result">
            <h3>Quiz Result</h3>
            <p className="score">Score: {score.toFixed(1)}%</p>
          </div>
        )}

        <div className="question-container" ref={containerRef}>
          {isSubmitted ? (
            // Show all 5 questions after submission
            quiz.questions.map((question, qIndex) => (
              <div key={qIndex} className="question">
                <h3>{getQuestionCountText(qIndex, quiz.questions.length)}</h3>
                {getSourceInfo(question)}
                <p className="question-text">{question.question}</p>
                <div className="options-grid">
                  {question.options.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      disabled
                      style={getButtonStyle(qIndex, index)}
                      className={`option-button ${
                        question.correctAnswer === index ? "correct" : 
                        userAnswers[qIndex] === index ? "incorrect" : ""
                      }`}
                    >
                      {option}
                      {question.correctAnswer === index && 
                        <span className="check-mark">✓</span>}
                      {userAnswers[qIndex] === index && 
                      question.correctAnswer !== index && 
                        <span className="cross-mark">✗</span>}
                    </Button>
                  ))}
                </div>
                {question.explanation && (
                  <div className="explanation">
                    <p><strong>Explanation:</strong> {question.explanation}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Show current question before submission
            <div className="question">
              <h3>{getQuestionCountText(currentQuestion, quiz.questions.length)}</h3>
              {getSourceInfo(quiz.questions[currentQuestion])}
              <p className="question-text">{quiz.questions[currentQuestion].question}</p>
              <div className="options-grid">
                {quiz.questions[currentQuestion].options.map(
                  (option, index) => (
                    <Button
                      key={index}
                      variant={
                        userAnswers[currentQuestion] === index
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => handleAnswer(currentQuestion, index)}
                      className="option-button"
                    >
                      {option}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
        <div className="navigation-buttons">
          {!isSubmitted ? (
            <>
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={
                  currentQuestion === quiz.questions.length - 1
                    ? evaluateQuiz
                    : () => setCurrentQuestion((prev) => prev + 1)
                }
                disabled={currentQuestion === quiz.questions.length - 1 && !isQuizComplete}
              >
                {currentQuestion === quiz.questions.length - 1 ? "Submit" : "Next"}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Close Quiz</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPanel;
