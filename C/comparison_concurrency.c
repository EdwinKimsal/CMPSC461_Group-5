#include <pthread.h>
#include <stdio.h>
#include <time.h>
#include <unistd.h>


void* worker(void* arg) {
    int loc_stall_time = *(int*)(arg);

    printf("[%lu] Worker started\n", pthread_self());
    sleep(loc_stall_time);
    printf("[%lu] Worker ended\n", pthread_self());

    return NULL;
}


void main() {
    // Set number of workers and wait time
    int n = 3;
    int general_stall_time = 3;
    int thread_stall_time = 1;
    

    // Set time tracking system
    time_t start_time = time(NULL);
    time_t end_time = time(NULL);
    int seconds_elapsed = (int)(end_time-start_time);

    // Simulate concurrency
    pthread_t loc_threads[n]; // Allocate for threads
    while (seconds_elapsed < general_stall_time) {
        // Create workers
        for (int i=0; i<n; i++) {
            pthread_create(&loc_threads[i], NULL, worker, &thread_stall_time);
        }

        // Wait for workers to finish
        for (int i=0; i<n; i++) {
            pthread_join(loc_threads[i], NULL);
        }

        end_time = time(NULL);
        seconds_elapsed = (int)end_time-start_time;
    }

    // Finished
    printf("\n");
    printf("%i worker(s) existed for %i seconds + final wait time\n", n, general_stall_time);
}