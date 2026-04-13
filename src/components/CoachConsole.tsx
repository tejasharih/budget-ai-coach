import { useState } from "react";
import { askBudgetModel, type AiConfig } from "../lib/ai";
import { answerBudgetQuestion } from "../lib/coach";
import type { CategorySpend, RecurringCharge, Transaction } from "../lib/types";

type CoachConsoleProps = {
  transactions: Transaction[];
  categorySpend: CategorySpend[];
  recurringCharges: RecurringCharge[];
  aiEnabled: boolean;
  aiConfig: AiConfig;
};

const promptSuggestions = [
  "Where am I overspending?",
  "How much am I spending on takeout?",
  "What subscriptions should I review?",
  "Am I actually saving money this month?",
];

export const CoachConsole = ({
  transactions,
  categorySpend,
  recurringCharges,
  aiEnabled,
  aiConfig,
}: CoachConsoleProps) => {
  const [question, setQuestion] = useState(promptSuggestions[0]);
  const [answer, setAnswer] = useState(
    answerBudgetQuestion(promptSuggestions[0], { transactions, categorySpend, recurringCharges }),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const runQuestion = async (nextQuestion: string) => {
    setQuestion(nextQuestion);
    setError("");

    if (aiEnabled && aiConfig.apiKey.trim()) {
      setIsLoading(true);
      try {
        const modelAnswer = await askBudgetModel(aiConfig, {
          question: nextQuestion,
          transactions,
          categorySpend,
          recurringCharges,
        });
        setAnswer(modelAnswer);
      } catch (requestError) {
        const message =
          requestError instanceof Error ? requestError.message : "Live AI request failed.";
        setError(message);
        setAnswer(answerBudgetQuestion(nextQuestion, { transactions, categorySpend, recurringCharges }));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setAnswer(answerBudgetQuestion(nextQuestion, { transactions, categorySpend, recurringCharges }));
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Ask your budget</p>
          <h2>Prompt-style finance coach</h2>
        </div>
        <p className="muted compact">
          This simulates the product experience we can later upgrade into a real LLM-backed
          financial assistant.
        </p>
      </div>
      <div className="prompt-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about spending, savings, subscriptions, or overspending"
        />
        <button type="button" className="button button-primary" onClick={() => void runQuestion(question)}>
          {isLoading ? "Thinking..." : "Ask"}
        </button>
      </div>
      <div className="prompt-chips">
        {promptSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="chip"
            onClick={() => void runQuestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <article className="coach-answer">
        <p className="eyebrow">Answer</p>
        <p>{answer}</p>
        {error ? <p className="error-text">{error}</p> : null}
      </article>
    </section>
  );
};
