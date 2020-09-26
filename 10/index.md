This weekend I decided to try and write my own regular expression engine, based
on two articles that I have read in the past: [Regular Expression Matching Can
Be Simple And Fast][1] and its follow-up [Regular Expression Matching: the
Virtual Machine Approach][2]. Check it out [here][3], or read on to see an
explanation.

[1]: https://swtch.com/~rsc/regexp/regexp1.html
[2]: https://swtch.com/~rsc/regexp/regexp2.html
[3]: demo.html

[see more]

The engine is broken into three main parts:

  * **parse.js**: Parse the regular expression syntax into an abstract tree.
  * **compile.js**: Generate VM code for the regular expression.
  * **run.js**: Execute VM code on a string.

The syntax is more like lex-style regular expressions than other styles. It has
quotation marks around literal sequences and characters in character sets. This
allows the regular expression to have insignificant whitespace and comments,
which can improve readability of the regex. Below is an example regular
expression:

    (  # Wrap everything in a group so that the full match is captured.
      "foo"                  # Literal sequence of characters.
      (['0'-'9', 'a'-'f']+)  # One or more hex digits.
      "bar"                  # Partially overlaps with hex digits.
    |
      "socks"
    )

The runtime implementation is similar to **Pike's Implementation** as described
in the second of the two articles mentioned above. Execution is broken into
"threads", which are effectively just active states in the abstract NFA of the
language. Each thread contains state describing subgroup matches, and the number
of threads is bounded by the number of instructions in the compiled regular
expression. If two threads have the same instruction address, they will
forevermore behave identically, so it is unnecessary to track both. The subgroup
match information for one thread is discarded. One could alternatively track
both threads and eventually have every possible subgroup matching available.
