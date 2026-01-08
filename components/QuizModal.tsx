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
  const allAnswered = answeredQuestions.every(a => a);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">知识自测</h2>
            <p className="text-sm text-slate-400 mt-1">{nodeTitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>Score: {score}/{answeredQuestions.filter(a => a).length}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">{currentQuestion.question}</h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showResult = showExplanation;

                    let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";
                    
                    if (!showResult) {
                      buttonClass += isSelected
                        ? "border-sky-500 bg-sky-500/10 text-white"
                        : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600";
                    } else {
                      if (isCorrect) {
                        buttonClass += "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-red-500 bg-red-500/10 text-red-300";
                      } else {
                        buttonClass += "border-slate-700 bg-slate-800/30 text-slate-400";
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
                          {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h4 className="text-sm font-semibold text-sky-400 mb-2">解析</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!showExplanation ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    提交答案
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
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
                isPerfect ? 'bg-emerald-500/10' : scorePercentage >= 60 ? 'bg-sky-500/10' : 'bg-slate-800'
              }`}>
                <Trophy className={`w-12 h-12 ${
                  isPerfect ? 'text-emerald-400' : scorePercentage >= 60 ? 'text-sky-400' : 'text-slate-600'
                }`} />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {isPerfect ? '完美掌握！' : scorePercentage >= 60 ? '不错的表现！' : '继续加油！'}
              </h3>
              
              <div className="text-4xl font-bold text-sky-400 mb-4">
                {score} / {questions.length}
              </div>

              <p className="text-slate-400 mb-8">
                {isPerfect 
                  ? '你已经完全掌握了这个知识点！' 
                  : scorePercentage >= 60 
                    ? '你对这个知识点有了很好的理解。' 
                    : '建议复习相关知识点后再次测试。'}
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>重新测试</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
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
