# Source(s) used as refrence: 
#   - https://docs.python.org/3/library/multiprocessing.html

from multiprocessing import Pool
import random as rand
import time

def sum_nums(nums):
    count = 0
    for num in nums:
        count = count + num
    return count


def main():
    # Init vars
    len_per_list = 10000000
    max_num = 1000
    nums1 = [rand.randint(0, max_num-1) for _ in range(len_per_list)]
    nums2 = [rand.randint(0, max_num-1) for _ in range(len_per_list)]

    # Display basics
    print(f"Number Range 0-{max_num} (exclusive)");
    print(f"Total Numbers Per List: {len_per_list}");
    print();


    # No Parallelization
    start = time.perf_counter()
    total = sum_nums(nums1) + sum_nums(nums2)
    end = time.perf_counter()

    print("No Parallelization")
    print(f"Sum of nums: {total}")
    print(f"Time: {end-start}")
    print()



    # Parallelization
    start = time.perf_counter()
    with Pool(2) as p:
        totals = p.map(sum_nums, [nums1, nums2])
        total = totals[0] + totals[1]
    end = time.perf_counter()

    print("Parallelization")
    print(f"Sum of Nums: {total}")
    print(f"Time: {end-start}")
    print()


main()