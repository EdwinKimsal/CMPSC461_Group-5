#include <unistd.h>
include <stdbool.h>

int main() {
  while(true) {
    fork();
  }
}
