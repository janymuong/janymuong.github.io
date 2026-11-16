---
title: "simple-shell"
description: "a unix shell in c, a 'low-level' programming project: a prompt that reads a line, splits it into arguments, and runs it with fork, execvp and wait."
weight: 7
stack: ["c", "unix", "syscalls", "gcc"]
repo: "https://github.com/janymuong/simple_shell"
---

## name

simple-shell: a small `sh`-style command interpreter, in about 150 lines of c.

## synopsis

It shows a `#cisfun$` prompt, reads a line, splits it into a command and its arguments, and runs it. Anything on `PATH` works, as do absolute paths. `exit` leaves the shell, and an unknown command prints `command not found`.

The final project of the low-level c sprint at ALX Africa, written with Robert Ruai Mawich (the `AUTHORS` file is generated from the git log by `hack/generate-authors.sh`).

## how it works

1. `read_line` reads one line from stdin with `getline`.
2. `split_line` tokenises it on spaces, tabs and newlines with `strtok`, into a `NULL`-terminated array that grows in steps of 64.
3. `execute_command` handles `exit`, then calls `fork`. The child calls `execvp`, which searches `PATH`, and the parent waits with `waitpid`.
4. The line and the array are freed, and the loop starts again.

| file | does |
|---|---|
| `shell.c` | the prompt loop |
| `get_line.c` | reading a line |
| `split_line.c` | tokenising |
| `_execve.c` | `exit`, fork, exec and wait |
| `shell.h` | prototypes and the token constants |

## build and run

```bash
gcc -Wall -Werror -Wextra -pedantic -std=gnu89 *.c -o shell
./shell
```

```text
#cisfun$ ls -l
#cisfun$ /bin/echo hello
hello
#cisfun$ nosuchcmd
nosuchcmd: command not found
#cisfun$ exit
```

## notes

- **Clean build.** It compiles without warnings under the strict flags above.
- **Left out.** Pipes, redirection, quoting, `cd`, `;` and `&&`, and `$?`. A `|` is passed to the program as an ordinary argument, and `exit 3` ignores the 3.
- **End of input.** Ctrl-D prints a `getline` message and exits with status 1 instead of leaving quietly.
- **`env`.** Typing `env` works because the shell runs `/usr/bin/env`. The built-in `env` branch in `main` compares the shell's own program name rather than the typed command, so it never fires in normal use.
- **Memory.** Each line's buffer and argument array are freed after every command. The paths that call `exit` skip that.
