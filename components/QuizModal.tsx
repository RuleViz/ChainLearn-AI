import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Trophy, RefreshCw } from 'lucide-react';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  nodeTitle: string;
}

export const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, questions, nodeTitle }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false));
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSelectAnswer = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    setShowExplanation(true);
    
    const newAnsweredQuestions = [...answeredQuestions];
    newAnsweredQuestions[currentQuestionIndex] = true;
    setAnsweredQuestions(newAnsweredQuestions);

    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Array(questions.length).fill(false));
    setIsCompleted(false);
  };

  const handleClose = () => {
    handleRestart();
    onClose();
  };

  const scorePercentage = (score / questions.length) * 100;
  const isPerfect = score === questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">知识自测</h2>
            <p className="text-sm text-neutral-500 mt-1">{nodeTitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isCompleted ? (
            <>
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-neutral-500 mb-2">
                  <span>第 {currentQuestionIndex + 1} 题，共 {questions.length} 题</span>
                  <span>得分: {score}/{answeredQuestions.filter(a => a).length}</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showResult = showExplanation;

                    let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all ";
                    
                    if (!showResult) {
                      buttonClass += isSelected
                        ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300";
                    } else {
                      if (isCorrect) {
                        buttonClass += "border-green-500 bg-green-50 text-green-800";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-red-500 bg-red-50 text-red-800";
                      } else {
                        buttonClass += "border-neutral-200 bg-neutral-50 text-neutral-400";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={showExplanation}
                        className={buttonClass}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-neutral-700 mb-2">解析</h4>
                  <p className="text-neutral-600 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!showExplanation ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 text-white rounded-xl font-medium transition-colors"
                  >
                    提交答案
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors"
                  >
                    {isLastQuestion ? '查看结果' : '下一题'}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Results */
            <div className="text-center py-8">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isPerfect ? 'bg-green-50' : scorePercentage >= 60 ? 'bg-neutral-100' : 'bg-neutral-50'
              }`}>
                <Trophy className={`w-12 h-12 ${
                  isPerfect ? 'text-green-600' : scorePercentage >= 60 ? 'text-neutral-600' : 'text-neutral-400'
                }`} />
              </div>

              <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                {isPerfect ? '完美掌握！' : scorePercentage >= 60 ? '不错的表现！' : '继续加油！'}
              </h3>
              
              <div className="text-4xl font-bold text-neutral-900 mb-4">
                {score} / {questions.length}
              </div>

              <p className="text-neutral-500 mb-8">
                {isPerfect 
                  ? '你已经完全掌握了这个知识点！' 
                  : scorePercentage >= 60 
                    ? '你对这个知识点有了很好的理解。' 
                    : '建议复习相关知识点后再次测试。'}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>重新测试</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors"
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
