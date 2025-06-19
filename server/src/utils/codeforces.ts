export namespace Codeforces {
  export interface Problem {
    contestId?: number;
    problemSetName?: string;
    index: string;
    name: string;
    type: "PROGRAMMING" | "QUESTION";
    points: number;
    rating?: number;
    tags: string[];
  }

  export interface ProblemStatistics {
    contestId?: number;
    index: string;
    solvedCount: number;
  }

  export interface Submission {
    id: number;
    contestId?: number;
    creationTimeSeconds: number;
    relativeTimeSeconds: number;
    problem: Problem;
    author: Party;
    programmingLanguage: string;
    verdict?:
      | "FAILED"
      | "OK"
      | "PARTIAL"
      | "COMPILATION_ERROR"
      | "RUNTIME_ERROR"
      | "WRONG_ANSWER"
      | "TIME_LIMIT_EXCEEDED"
      | "MEMORY_LIMIT_EXCEEDED"
      | "IDLENESS_LIMIT_EXCEEDED"
      | "SECURITY_VIOLATED"
      | "CRASHED"
      | "INPUT_PREPARATION_CRASHED"
      | "CHALLENGED"
      | "SKIPPED"
      | "TESTING"
      | "REJECTED"
      | "SUBMITTED";
    testset:
      | "SAMPLES"
      | "PRETESTS"
      | "TESTS"
      | "CHALLENGES"
      | "TESTS1"
      | "TESTS2"
      | "TESTS3"
      | "TESTS4"
      | "TESTS5"
      | "TESTS6"
      | "TESTS7"
      | "TESTS8"
      | "TESTS9"
      | "TESTS10";
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
    points: number;
  }

  export interface Party {
    contestId?: number;
    members: Member[];
    participantType:
      | "CONTESTANT"
      | "PRACTICE"
      | "VIRTUAL"
      | "MANAGER"
      | "OUT_OF_COMPETITION";
    teamId?: number;
    teamName?: string;
    ghost: boolean;
    room?: number;
    startTimeSeconds?: number;
  }

  export interface Member {
    handle: string;
    name?: string;
  }

  export interface User {
    handle: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    contribution: number;
    rank: string;
    rating: number;
    maxRank: string;
    maxRating: number;
    lastOnlineTimeSeconds: number;
    registrationTimeSeconds: number;
    friendOfCount: number;
    avatar: string;
    titlePhoto: string;
  }
}

export class CFClient {
  private baseUrl: string;
  private lastRequestTime: number = 0;
  private readonly minInterval: number = 2000; // 2 seconds in milliseconds

  constructor(baseUrl: string = "https://codeforces.com/api/") {
    this.baseUrl = baseUrl;
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private async request<T>(
    endpoint: string,
    params: Record<string, string | number | undefined> = {}
  ): Promise<T> {
    await this.waitForRateLimit();

    const url = new URL(endpoint, this.baseUrl);
    Object.keys(params).forEach(
      (key) =>
        params[key] &&
        url.searchParams.append(key, params[key] as unknown as string)
    );

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Error fetching ${url}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status !== "OK") {
        if (data.comment === "Call limit exceeded") {
          // If we still hit rate limit, wait longer and potentially retry
          console.warn("Rate limit exceeded despite throttling");
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
          throw new Error(
            "Rate limit exceeded - consider reducing request frequency"
          );
        }
        throw new Error(`Codeforces API error: ${data.comment}`);
      }

      return data.result;
    } catch (error) {
      this.lastRequestTime = Date.now();
      throw error;
    }
  }

  async getUserInfo(handle: string): Promise<Codeforces.User> {
    return (
      await this.request<Codeforces.User[]>("user.info", { handles: handle })
    )[0];
  }

  async getProblemList(tags: string[] = []) {
    return this.request<{
      problems: Codeforces.Problem[];
      problemStatistics: Codeforces.ProblemStatistics[];
    }>("problemset.problems", {
      tags: tags.join(";"),
    });
  }

  async getSubmissions(handle: string, from?: number, count?: number) {
    return this.request<Codeforces.Submission[]>("user.status", {
      handle,
      from,
      count,
    });
  }

  async chooseProblems(minRating: number, maxRating: number, count: number) {
    const problems = await this.getProblemList();
    const filteredProblems = problems.problems.filter(
      (p) =>
        p.rating !== undefined &&
        p.rating >= minRating &&
        p.rating <= maxRating &&
        p.type === "PROGRAMMING" &&
        !p.tags.includes("*special")
    );

    if (filteredProblems.length < count) {
      throw new Error(
        `Not enough problems found in the specified rating range (${minRating}-${maxRating}).`
      );
    }

    // Shuffle the filtered problems and select the first 'count' problems
    const shuffled = filteredProblems.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

export const cf = new CFClient();
