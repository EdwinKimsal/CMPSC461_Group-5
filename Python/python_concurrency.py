import time
import threading

# function for printing thread work
def threading_task(name, thread_stall_time):
    # gets current thread address
    current_thread = threading.current_thread()

    print(f'Worker {name} Started\n{current_thread}')
    time.sleep(thread_stall_time)
    print(f'Worker {name} Stopped\n{current_thread}')


def main():

    # set worker number and wait times
    n = 3
    general_stall_time = 3
    thread_stall_time = 1

    # creates 3 workers
    for i in range(n):
        t = threading.Thread(target=threading_task, args=(i+1, thread_stall_time,))
        t.start()

    # joins 3 worker threads
    for j in range(n):
        t.join()


    print(f'\n{n} workers existed for {general_stall_time} seconds + final wait time')

main()