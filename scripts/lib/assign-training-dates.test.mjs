import { describe, expect, it } from "vitest";
import { assignTrainingSessionDates } from "./assign-training-dates.mjs";

describe("assignTrainingSessionDates", () => {
  it("assigns every session a date when counts match exactly", () => {
    const dates = ["2024-01-01", "2024-02-01", "2024-03-01"];
    expect(assignTrainingSessionDates(3, dates)).toEqual(dates);
  });

  it("marks the oldest excess sessions as unknown (null) when there are fewer measurements", () => {
    const dates = ["2024-01-01", "2024-02-01", "2024-03-01"];
    expect(assignTrainingSessionDates(5, dates)).toEqual([
      null,
      null,
      "2024-01-01",
      "2024-02-01",
      "2024-03-01",
    ]);
  });

  it("uses only the most recent measurements when there are more than sessions", () => {
    const dates = ["2024-01-01", "2024-02-01", "2024-03-01", "2024-04-01"];
    expect(assignTrainingSessionDates(2, dates)).toEqual(["2024-03-01", "2024-04-01"]);
  });

  it("returns all-null when there are no measurements at all", () => {
    expect(assignTrainingSessionDates(3, [])).toEqual([null, null, null]);
  });

  it("returns an empty array for zero sessions", () => {
    expect(assignTrainingSessionDates(0, ["2024-01-01"])).toEqual([]);
  });
});
