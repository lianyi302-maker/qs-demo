import { questions, resultContents, resultOrder, type ResultType } from "./data/quizData";

export type Answers = Record<string, ResultType>;

export type ScoreResult = {
  counts: Record<ResultType, number>;
  topTypes: ResultType[];
  secondaryTypes: ResultType[];
  primaryType: ResultType;
  isPairTie: boolean;
  isMultiTie: boolean;
};

export function getEmptyCounts(): Record<ResultType, number> {
  return { H: 0, A: 0, M: 0, S: 0, B: 0 };
}

export function calculateResult(answers: Answers): ScoreResult {
  const counts = getEmptyCounts();

  questions.forEach((question) => {
    const selectedType = answers[question.id];
    if (selectedType) {
      counts[selectedType] += 1;
    }
  });

  const maxScore = Math.max(...resultOrder.map((type) => counts[type]));
  const topTypes = resultOrder.filter((type) => counts[type] === maxScore);
  const primaryType = topTypes[0];

  const remainingScores = resultOrder
    .filter((type) => !topTypes.includes(type))
    .map((type) => counts[type]);
  const secondScore = remainingScores.length > 0 ? Math.max(...remainingScores) : 0;
  const secondaryTypes =
    secondScore > 0
      ? resultOrder.filter((type) => !topTypes.includes(type) && counts[type] === secondScore)
      : [];

  return {
    counts,
    topTypes,
    secondaryTypes,
    primaryType,
    isPairTie: topTypes.length === 2,
    isMultiTie: topTypes.length >= 3,
  };
}

export function getTypeNames(types: ResultType[]): string {
  return types.map((type) => resultContents[type].name).join(" + ");
}
