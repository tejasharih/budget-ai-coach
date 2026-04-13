import { format, isValid, parse, parseISO } from "date-fns";

export const formatTransactionDate = (value: string, output = "MMM d") => {
  const parsers = [
    () => parseISO(value),
    () => parse(value, "yyyy-MM-dd", new Date()),
    () => parse(value, "M/d/yyyy", new Date()),
    () => parse(value, "MM/dd/yyyy", new Date()),
  ];

  for (const parser of parsers) {
    const parsed = parser();
    if (isValid(parsed)) {
      return format(parsed, output);
    }
  }

  return value;
};
