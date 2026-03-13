import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, Brain, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface QuizTabProps {
  quiz: QuizQuestion[];
}

const QuizTab = ({ quiz }: QuizTabProps) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === quiz[current].answer;
    if (isCorrect) setScore(s => s + 1);
    const newAnswers = [...answers, idx];
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-semibold">No quiz generated</p>
        <p className="text-xs mt-1">Try using "Educational Deep-Dive" mode.</p>
      </div>
    );
  }

  const pct = Math.round((score / quiz.length) * 100);

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 text-center space-y-6">
        <Trophy className={`h-16 w-16 mx-auto ${pct >= 70 ? "text-yellow-400" : "text-muted-foreground"}`} />
        <div>
          <h3 className="font-display font-black text-3xl text-foreground">
            {pct >= 90 ? "🎉 Outstanding!" : pct >= 70 ? "🎯 Well Done!" : "📚 Keep Learning!"}
          </h3>
          <p className="text-muted-foreground mt-2">You scored</p>
          <div className="text-6xl font-black text-primary my-4">{score}<span className="text-2xl text-muted-foreground">/{quiz.length}</span></div>
          <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${pct >= 70 ? "bg-gradient-to-r from-primary to-green-500" : "bg-gradient-to-r from-orange-500 to-yellow-500"}`} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{pct}% accuracy</p>
        </div>
        <Button variant="hero" onClick={handleRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Try Again
        </Button>
      </motion.div>
    );
  }

  const q = quiz[current];

  return (
    <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full transition-all duration-500" style={{ width: `${((current) / quiz.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0">{current + 1} / {quiz.length}</span>
        <span className="text-xs font-bold text-primary shrink-0">Score: {score}</span>
      </div>

      {/* Question */}
      <div className="glass-card rounded-2xl p-6">
        <p className="font-display font-bold text-base text-foreground leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          let variant = "bg-white/3 border-white/10 text-secondary-foreground hover:bg-white/8";
          if (selected !== null) {
            if (i === q.answer) variant = "bg-green-500/10 border-green-500/40 text-foreground";
            else if (i === selected && i !== q.answer) variant = "bg-red-500/10 border-red-500/40 text-foreground";
            else variant = "bg-white/2 border-white/5 text-muted-foreground opacity-50";
          }
          return (
            <motion.button key={i} whileHover={selected === null ? { scale: 1.01 } : {}} onClick={() => handleSelect(i)} className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${variant}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm border ${selected !== null && i === q.answer ? "bg-green-500/20 border-green-500/50 text-green-400" : selected !== null && i === selected ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-muted/30 border-white/10 text-muted-foreground"}`}>
                {selected !== null ? (i === q.answer ? <Check className="h-4 w-4" /> : i === selected ? <X className="h-4 w-4" /> : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
              </div>
              <span className="text-sm leading-relaxed">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`glass-card rounded-xl p-4 border ${selected === q.answer ? "border-green-500/20 bg-green-500/5" : "border-orange-500/20 bg-orange-500/5"}`}>
            <p className="text-sm leading-relaxed text-secondary-foreground">
              <span className="font-bold text-foreground">💡 Explanation: </span>{q.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {selected !== null && (
        <Button variant="hero" onClick={handleNext} className="w-full gap-2">
          {current + 1 >= quiz.length ? "See Results" : "Next Question"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
};

export default QuizTab;
