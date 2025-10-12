import { RequestHandler } from "express";

export const validateHandle: RequestHandler = (req, res, next) => {
  const { handle } = req.body;

  if (!handle) {
    res.status(400).json({ error: "Handle is required" });
    return;
  }

  next();
};

export const validateBattleCreation: RequestHandler = (req, res, next) => {
  const details = req.body;

  if (
    !details ||
    !details.name ||
    !details.startTime ||
    !details.duration ||
    !details.minRating ||
    !details.maxRating ||
    !details.problemCount
  ) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const startTime = new Date(details.startTime);
  if (isNaN(startTime.getTime())) {
    res.status(400).json({ error: "Invalid start time" });
    return;
  }

  if (startTime.getTime() < new Date().getTime() + 0.5 * 60 * 1000) {
    res.status(400).json({
      error: "Start time must be at least 30 seconds in the future",
    });
    return;
  }

  if (details.duration <= 10 || details.duration >= 300) {
    res.status(400).json({
      error: "Duration must be more than 10 minutes and less than 300 minutes",
    });
    return;
  }

  if (details.minRating < 0 || details.maxRating < 0) {
    res.status(400).json({ error: "Ratings must be non-negative" });
    return;
  }

  if (details.minRating > details.maxRating - 100) {
    res.status(400).json({
      error: "Rating range should be at least 100 rating points.",
    });
    return;
  }

  if (details.problemCount <= 2 || details.problemCount > 10) {
    res.status(400).json({
      error: "Problem count must be between 3 and 10",
    });
    return;
  }

  next();
};
