/*

The following code SNIPPET is from the AFCT Dashboard, which can be found with the following link:
https://github.com/PennStateCS/AFCT

The co-authors of this specific piece were:
Jeffrey Chiampi and Edwin Kimsal

The file path for the following code is:
src/lib/submission-worker.ts

This was a section of the AFCT Dashboard.
Specifically, it was used by the auto-gradder to handle multiple submissions via asynchounous concurrency

Please note the void on this file's line 32 calling the async function starting on line 37.

*/

// Concurrency is the number of live worker loops (each handles one submission at
// a time). desiredWorkers and maxAttempts are refreshed from SystemSettings, so
// an admin can retune the queue without a restart; see refreshQueueSettings().
let loopCount = 0;
let desiredWorkers = DEFAULT_SUBMISSION_MAX_CONCURRENT;
let maxAttempts = DEFAULT_SUBMISSION_MAX_ATTEMPTS;


// Spawn loops until we're running `desiredWorkers` of them. Scaling down is
// handled by each loop retiring itself (see runWorkerLoop).
function ensureWorkers() {
  while (loopCount < desiredWorkers) {
    loopCount++;
    void runWorkerLoop();
  }
}


async function runWorkerLoop() {
  // Scale down: if concurrency was lowered, retire this loop.
  if (loopCount > desiredWorkers) {
    loopCount--;
    return;
  }

  // ...

  try {
    // Staff evaluator trials come first: somebody is watching that page, and the
    // ceiling inside claimAndRunTrial is what stops them crowding out grading.
    if (await claimAndRunTrial(desiredWorkers)) {
      lastWorkAt = Date.now();
      scheduleAsync(runWorkerLoop, LOOP_DELAY_MS.NEXT);
      return;
    }

    // Fairness: a student who already has a submission being processed is skipped
    // so one student cannot occupy multiple worker slots at once.
    const inFlight = await prisma.submission.findMany({
      where: { status: 'PROCESSING' },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    const busyStudentIds = inFlight.map((s) => s.studentId);

    // Priority: nearest deadline first, then FIFO.
    const nextSubmission = await prisma.submission.findFirst({
      where: {
        status: 'PENDING',
        // Only add the filter when we have ids; an empty notIn is a Prisma footgun.
        ...(busyStudentIds.length ? { studentId: { notIn: busyStudentIds } } : {}),
      },
      orderBy: [{ assignmentProblem: { assignment: { dueDate: 'asc' } } }, { submittedAt: 'asc' }],
      select: { id: true, attempts: true },
    });

    // No work to be done
    if (nextSubmission === null) {
      scheduleAsync(runWorkerLoop, idleDelayMs());
      return;
    }

    // The queue is not empty, so drop every loop back to the shortest wait. This is
    // set on finding a row rather than on winning the claim: losing the race still
    // means there is work about, and that loop should come back promptly.
    lastWorkAt = Date.now();

    // Poison-pill guard: a submission that has been claimed too many times keeps
    // failing (or keeps getting reaped); fail it rather than retry forever.
    if (nextSubmission.attempts >= maxAttempts) {
      const failed = await prisma.submission.updateMany({
        where: { id: nextSubmission.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          feedback: 'Autograder gave up after too many failed attempts.',
        },
      });
      // A student's submission can no longer be graded; surface it for staff.
      if (failed.count > 0) {
        const info = await prisma.submission.findUnique({
          where: { id: nextSubmission.id },
          select: {
            id: true,
            studentId: true,
            courseId: true,
            assignmentId: true,
            problemId: true,
          },
        });
        if (info) {
          await logSubmissionActivity(info, 'SUBMISSION_FAILED_PERMANENTLY', 'ERROR', {
            attempts: nextSubmission.attempts,
            reason: 'exceeded max attempts',
          });
        }
      }
      scheduleAsync(runWorkerLoop, LOOP_DELAY_MS.NEXT);
      return;
    }

    // null means another loop/instance beat us to it. Move on.
    const token = await claimSubmission(nextSubmission.id);
    if (!token) {
      scheduleAsync(runWorkerLoop, LOOP_DELAY_MS.NEXT);
      return;
    }

    // Hold this loop until the evaluation finishes: one loop, one submission,
    // so the live loop count is the real concurrency limit.
    await evaluateSubmission(nextSubmission.id, token);

    // Move to next check
    scheduleAsync(runWorkerLoop, LOOP_DELAY_MS.NEXT);
    return;
  } catch (error) {
    console.error('[SubmissionWorker] Database or loop error:', error);
    await logQueueEvent('SUBMISSION_QUEUE_ERROR', 'ERROR', {
      error: errMessage(error),
    });
    scheduleAsync(runWorkerLoop, LOOP_DELAY_MS.ERROR);
    return;
  }
}