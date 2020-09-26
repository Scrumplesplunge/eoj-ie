Recently I started to get interested in lisp. I have looked at it before and
appreciated its simplicity, but this time I decided to try and implement my own
little dialect. The result is [here](demo.html) and can execute a few simple
operations.

  * Quoting, e.g. `'(+ 1 2)` evaluates to `(+ 1 2)` rather than `3`.
  * The `eval` form, e.g. `(eval '(+ 1 2))` evaluates to `3`.
  * The n-ary operators `+`, `-`, `*`, and `/`.
  * The `lambda` form, e.g. `(lambda (x) (* x x))`.
  * The `macro` form, which is similar to `lambda` except that its arguments are
    passed unevaluated.
  * The `with` form, which works as shown in the example.

Be warned that the code for the interpreter is not pretty. Probably best not to
try to read it.
