import { useEffect, useMemo, useState } from "react";
import {
  closingCopy,
  exitPrompt,
  progressPrompts,
  questions,
  quizMeta,
  resultContents,
  safetyCopy,
  secondaryTemplate,
  sharePageCopy,
  tieCopy,
  transitionCopy,
  type QuizOption,
  type ResultType,
} from "./data/quizData";
import { calculateResult, getTypeNames, type Answers } from "./scoring";

type Screen = "cover" | "intro" | "quiz" | "transition" | "result";
type OptionOrder = Record<string, string[]>;

function shuffleOptions(options: QuizOption[]): QuizOption[] {
  const copy = [...options];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function createOptionOrder(): OptionOrder {
  return questions.reduce<OptionOrder>((order, question) => {
    order[question.id] = shuffleOptions(question.options).map((option) => option.id);
    return order;
  }, {});
}

function getOrderedOptions(questionIndex: number, optionOrder: OptionOrder): QuizOption[] {
  const question = questions[questionIndex];
  const ids = optionOrder[question.id] ?? question.options.map((option) => option.id);
  return ids
    .map((id) => question.options.find((option) => option.id === id))
    .filter((option): option is QuizOption => Boolean(option));
}

export function App() {
  const [screen, setScreen] = useState<Screen>("cover");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [optionOrder, setOptionOrder] = useState<OptionOrder>(() => createOptionOrder());
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  const result = useMemo(() => calculateResult(answers), [answers]);
  const primaryContent = resultContents[result.primaryType];
  const currentQuestion = questions[questionIndex];
  const orderedOptions = getOrderedOptions(questionIndex, optionOrder);
  const progressValue = ((questionIndex + 1) / questions.length) * 100;
  const progressPrompt = progressPrompts[questionIndex + 1];

  useEffect(() => {
    if (screen !== "transition") {
      return;
    }
    const timer = window.setTimeout(() => setScreen("result"), 1600);
    return () => window.clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen, questionIndex]);

  const beginTest = () => {
    setQuestionIndex(0);
    setAnswers({});
    setOptionOrder(createOptionOrder());
    setSelectedOptionId(null);
    setShowExitPrompt(false);
    setScreen("intro");
  };

  const restartTest = () => {
    beginTest();
  };

  const selectOption = (option: QuizOption) => {
    if (selectedOptionId) {
      return;
    }
    setSelectedOptionId(option.id);
    setAnswers((current) => ({ ...current, [currentQuestion.id]: option.type }));

    window.setTimeout(() => {
      setSelectedOptionId(null);
      if (questionIndex === questions.length - 1) {
        setScreen("transition");
      } else {
        setQuestionIndex((index) => index + 1);
      }
    }, 300);
  };

  const goBack = () => {
    if (questionIndex === 0) {
      setScreen("intro");
      return;
    }
    setQuestionIndex((index) => index - 1);
  };

  if (screen === "cover") {
    return (
      <main className="app-shell cover-shell">
        <section className="hero-panel">
          <div className="mist mist-one" />
          <div className="mist mist-two" />
          <p className="eyebrow">{quizMeta.tag}</p>
          <h1>
            {quizMeta.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <div className="subtitle">
            {quizMeta.subtitle.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <button className="primary-button" type="button" onClick={beginTest}>
            {quizMeta.startButton}
          </button>
          <p className="fine-print">{quizMeta.footnote}</p>
        </section>
      </main>
    );
  }

  if (screen === "intro") {
    return (
      <main className="app-shell">
        <section className="page-panel intro-panel">
          <p className="eyebrow">开始之前</p>
          <h2>{quizMeta.instructionTitle}</h2>
          <div className="copy-block">
            {quizMeta.instructionBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="safe-note">
            <span>情绪安全提示</span>
            <p>如果某个场景让你想起不舒服的经历，可以随时暂停。停下来也是一种照顾自己的方式。</p>
          </div>
          <button className="primary-button" type="button" onClick={() => setScreen("quiz")}>
            {quizMeta.instructionButton}
          </button>
        </section>
      </main>
    );
  }

  if (screen === "quiz") {
    return (
      <main className="app-shell quiz-shell">
        <section className="quiz-panel">
          <header className="quiz-header">
            <button className="ghost-button" type="button" onClick={goBack}>
              返回
            </button>
            <span className="question-count">
              {questionIndex + 1} / {questions.length}
            </span>
            <button className="ghost-button" type="button" onClick={() => setShowExitPrompt(true)}>
              暂停
            </button>
          </header>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progressValue}%` }} />
          </div>
          <p className="progress-prompt">{progressPrompt}</p>

          <article className="question-card">
            <p className="question-title">{currentQuestion.title}</p>
            <p className="situation">{currentQuestion.situation}</p>
            <h2>{currentQuestion.prompt}</h2>
          </article>

          <div className="options-list">
            {orderedOptions.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const wasAnswered = answers[currentQuestion.id] === option.type;
              return (
                <button
                  className={`option-card ${isSelected ? "is-selected" : ""} ${wasAnswered ? "was-answered" : ""}`}
                  key={option.id}
                  type="button"
                  disabled={Boolean(selectedOptionId)}
                  onClick={() => selectOption(option)}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
        </section>

        {showExitPrompt && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="exit-title">
            <section className="exit-dialog">
              <h2 id="exit-title">{exitPrompt.title}</h2>
              <p>{exitPrompt.body}</p>
              <div className="dialog-actions">
                <button className="secondary-button" type="button" onClick={() => setShowExitPrompt(false)}>
                  {exitPrompt.continueLabel}
                </button>
                <button className="ghost-danger" type="button" onClick={() => setScreen("cover")}>
                  {exitPrompt.exitLabel}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }

  if (screen === "transition") {
    return (
      <main className="app-shell">
        <section className="page-panel transition-panel">
          <div className="soft-loader" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {transitionCopy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      </main>
    );
  }

  const secondaryTypes = result.secondaryTypes.filter((type) => type !== result.primaryType);
  const displayTitle = result.isPairTie
    ? `${resultContents[result.topTypes[0]].name} + ${resultContents[result.topTypes[1]].name}`
    : result.isMultiTie
      ? tieCopy.multiTitle
      : primaryContent.name;
  const displaySummary = result.isPairTie
    ? tieCopy.pairBody[0]
    : result.isMultiTie
      ? tieCopy.multiBody[0]
      : primaryContent.summary;

  return (
    <main className="app-shell result-shell">
      <section className="result-panel">
        <p className="eyebrow">你的关系保护方式是：</p>
        <h1>{displayTitle}</h1>
        {!result.isPairTie && !result.isMultiTie && <p className="keywords">{primaryContent.keywords}</p>}
        <p className="result-summary">{displaySummary}</p>

        {result.isPairTie && (
          <div className="tie-card">
            <h2>{tieCopy.pairTitle}</h2>
            <p>「{getTypeNames(result.topTypes)}」</p>
          </div>
        )}

        {result.isPairTie && (
          <div className="tie-types">
            {result.topTypes.map((type) => (
              <article className="tie-type-card" key={type}>
                <h2>{resultContents[type].name}</h2>
                <p className="keywords">{resultContents[type].keywords}</p>
                <p>{resultContents[type].summary}</p>
              </article>
            ))}
          </div>
        )}

        {!result.isPairTie && !result.isMultiTie && (
          <article className="concise-result-card">
            <h2>{primaryContent.sections[0].title}</h2>
            <p>{primaryContent.sections[0].body[0]}</p>
            <div className="mini-quote">
              {primaryContent.quote.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </article>
        )}

        {!result.isPairTie && !result.isMultiTie && (
          <details className="detail-reader">
            <summary>展开完整解读</summary>
            {primaryContent.sections.slice(1).map((section) => (
              <article className="text-section" key={section.title}>
                <h2>{section.title}</h2>
                {section.body.slice(0, 1).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}
          </details>
        )}

        {result.isMultiTie && (
          <article className="text-section">
            <h2>{tieCopy.multiTitle}</h2>
            {tieCopy.multiBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        )}

        {secondaryTypes.length > 0 && (
          <article className="secondary-card">
            <p>{secondaryTemplate.title}</p>
            <h2>{secondaryTypes.map((type) => resultContents[type].name).join(" + ")}</h2>
            {secondaryTemplate.paragraphs.slice(0, 1).map((paragraph) => (
              <p key={paragraph}>{paragraph.replace("{name}", secondaryTypes.map((type) => resultContents[type].name).join("、"))}</p>
            ))}
          </article>
        )}

        <article className="share-card" aria-label="分享卡">
          <p className="share-label">关系保护地图</p>
          <h2>{sharePageCopy.title.join("")}</h2>
          <p className="share-subtitle">{sharePageCopy.subtitle.join("")}</p>
          <div className="share-result">
            <span>我的结果</span>
            <strong>{displayTitle}</strong>
            {!result.isPairTie && !result.isMultiTie && <em>{primaryContent.keywords}</em>}
            <p>{result.isMultiTie ? tieCopy.multiBody[0] : result.isPairTie ? tieCopy.pairBody[0] : primaryContent.summary}</p>
          </div>
        </article>

        <article className="closing-card">
          <h2>{closingCopy.title}</h2>
          {closingCopy.paragraphs.slice(0, 1).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="support-note">{closingCopy.footnote}</p>
        </article>

        <p className="safety-line">{safetyCopy}</p>

        <div className="result-actions">
          <button className="primary-button" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            保存我的关系保护地图
          </button>
          <button className="secondary-button" type="button" onClick={restartTest}>
            再测一次
          </button>
          <button className="secondary-button" type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}>
            分享给朋友
          </button>
        </div>
      </section>
    </main>
  );
}
