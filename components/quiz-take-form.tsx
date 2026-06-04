"use client";

import { Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { submitQuizAction } from "@/app/actions";

type Question = {
  id: string;
  question: string;
  options: string[];
};

export function QuizTakeForm({
  quizId,
  timeLimitSeconds,
  questions
}: {
  quizId: string;
  timeLimitSeconds: number;
  questions: Question[];
}) {
  const [remaining, setRemaining] = useState(timeLimitSeconds);
  const disabled = remaining <= 0;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const label = useMemo(() => {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [remaining]);

  return (
    <form action={submitQuizAction} className="space-y-4">
      <input type="hidden" name="quiz_id" value={quizId} />
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ring-1 ${disabled ? "bg-rose/10 text-rose ring-rose/15" : "bg-primary/10 text-primary ring-primary/15"}`}>
        <Timer className="h-4 w-4" aria-hidden />
        {label}
      </div>
      {questions.map((question, index) => (
        <fieldset key={question.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" disabled={disabled}>
          <legend className="px-1 text-sm font-bold text-ink">
            {index + 1}. {question.question}
          </legend>
          <div className="mt-3 grid gap-2">
            {question.options.map((option, optionIndex) => (
              <label key={option} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition hover:border-primary/35 hover:bg-mist">
                <input
                  type="radio"
                  name={`answer_${question.id}`}
                  value={optionIndex}
                  required
                  className="h-4 w-4 border-slate-300"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button className="btn-primary w-full" disabled={disabled}>
        {disabled ? "Hết giờ" : "Nộp quiz"}
      </button>
    </form>
  );
}
