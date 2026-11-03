import { z } from "zod";

// A number field for forms whose custom message applies ONLY to "not a number" input.
// (zod 4 gotcha: z.number("msg") would use "msg" for EVERY failure, e.g. -5 would say "must be a number".
// Returning undefined from the error function falls back to each check's own message.)
//
// <input type="number" {...register("price", { valueAsNumber: true })}> yields NaN when the box is
// empty, so NaN is reported as "required" rather than a confusing "must be a number".
export const numberField = (label: string) =>
  z.number({
    error: (issue) => {
      if (issue.code !== "invalid_type") return undefined;
      return issue.input === undefined || Number.isNaN(issue.input)
        ? `${label} is required`
        : `${label} must be a number`;
    },
  });
