// Source(s) used as refrence: 
//  - https://tldp.org/LDP/lpg/node11.html
//  - https://en.cppreference.com/c/chrono/clock

#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

long long sum_nums(long long *nums, int n) {
    long long count = 0;

    for (int i=0; i<n; i++) {
        count = count + nums[i];
    }

    return count;
}


int main(){
    // Lists
    int len_per_list = 10000000;
    int max_num = 1000;
    long long *sub_list1 = malloc(sizeof(long long)* len_per_list);
    long long *sub_list2 = malloc(sizeof(long long)* len_per_list);;

    for (int i=0; i<len_per_list; i++) {
        sub_list1[i] = rand() % max_num;
        sub_list2[i] = rand() % max_num;
    }

    // Time
    srand(time(NULL));
    struct timespec start, end;
    double elapsed_time;

    // Display basics
    printf("Number Range 0-%i (exclusive)\n", max_num);
    printf("Total Numbers Per List: %i\n", len_per_list);
    printf("\n");
    
    // Init sum
    long long sum_of_nums = 0;

    // Non Parallelization
    clock_gettime(CLOCK_MONOTONIC, &start);

    long long sum1 = sum_nums(sub_list1, len_per_list);
    long long sum2 = sum_nums(sub_list2, len_per_list);
    sum_of_nums = sum1 + sum2;

    clock_gettime(CLOCK_MONOTONIC, &end);
    elapsed_time = (end.tv_sec - start.tv_sec) + ((end.tv_nsec - start.tv_nsec) / 1000000000.0);

    printf("No Parallelization\n");
    printf("Sum of Nums: %lli\n", sum_of_nums);
    printf("Time: %f seconds\n", elapsed_time);
    printf("\n");

    // Reset
    sum_of_nums = 0;

    // Parallelization
    clock_gettime(CLOCK_MONOTONIC, &start);

    // Pipe
    int fd[2];
    pipe(fd);

    // Fork to cause parallezation
    int pid = fork();

    // Add correct list
    if (pid == 0) { // Child
        close(fd[0]); // Close read
        long long loc_sum = sum_nums(sub_list1,
            len_per_list
        );
        write(fd[1], &loc_sum, sizeof(loc_sum));
    } else { // Parremt
        close(fd[1]); // Close write
        long long loc_sum = sum_nums(
            sub_list2,
            len_per_list
        );
        read(fd[0], &sum_of_nums, sizeof(sum_of_nums));
        wait(NULL);
        sum_of_nums = sum_of_nums + loc_sum;

        clock_gettime(CLOCK_MONOTONIC, &end);
        elapsed_time = (end.tv_sec - start.tv_sec) + ((end.tv_nsec - start.tv_nsec) / 1000000000.0);

        printf("Parallelization\n");
        printf("Sum of Nums: %lli\n", sum_of_nums);
        printf("Time: %f seconds\n", elapsed_time);
        printf("\n");
    }

    // Clean up
    free(sub_list1);
    free(sub_list2);

    return 0;
}