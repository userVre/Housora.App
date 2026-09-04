/** Polls an already-created job. Never resubmits the paid request. */
export async function readAiResponse(response: Response): Promise<any> {
  const initial = await response.json();
  if (!response.ok) throw new Error(initial.error || "The task could not start.");
  if (response.status !== 202) return initial;
  if (!initial.requestId) throw new Error("Missing task reference. Check Recent tasks before trying again.");
  const started = Date.now();
  while (Date.now() - started < 10 * 60_000) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    try {
      const status = await fetch(`/api/ai/jobs?requestId=${encodeURIComponent(initial.requestId)}`, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
      const job = await status.json();
      if (!status.ok) continue;
      if (job.status === "success") return job.result;
      if (job.status === "failed") throw new Error(job.error || "The task failed.");
    } catch (error) {
      if (error instanceof Error && !["TypeError", "TimeoutError", "AbortError"].includes(error.name)) throw error;
    }
  }
  throw new Error("Your task is still available in Recent tasks. Check there before starting another request.");
}
