The other day, somebody at work challenged me to get comparisons like Python to
work in C++. Well, challenge accepted:

    #include "hacky_comparison.h"
    ...
    if (COMPARE(0 < i < 10)) {
      ...
    }

For those who are unfamiliar with python comparisons, they allow you to chain
several comparisons together in a more intuitive manner than C++:

    // C++
    if (0 <= i && i < 10) {
      ...
    }

    # Python
    if 0 <= i < 10:
      pass

If you were to write something like the python comparison above in C++, you
would probably find that it compiles (possibly with warnings) but has very
unexpected results. So, how can we make comparisons like this work in C++?

Firstly, I should mention that the solution that I created is flawed, and has
some very subtle differences from the python comparisons that cannot be easily
remedied. These differences only really occur in the less common cases, and
I will mention them when we get to them.

Secondly, I should warn that putting code like this in any serious projects is
likely to result in you being lynched by coworkers or friends. It's probably not
a good idea to try and make the language appear to be capable of something that
it is not capable of, but hey, that's what makes this a hack!

Warnings out of the way, the first thing to do is examine how C++ parses such
expressions so that we can find some way of hacking around it. In particular, we
need to examine the [operator precedence and associativity][1] of the comparison
operators that we are interested in.

I will be talking about comparison operators a lot, so I will use the following
groupings to keep things simple:

  * The **equality operator** is `==`.
  * The **order operators** are `<`, `>`, `<=`, and `>=`.

In C++, the order operators have the same precedence as each other. However, the
order operators have slightly higher precedence than the equality operator. All
of these operators associate left to right. If any of this sounds unfamiliar,
you might want to check out the link above, or you can try to grok it from these
examples:

    // Operators from the same group associate left-to-right.
    (a < b < c)    =>  ((a < b) < c)
    (a <= b < c)   =>  ((a <= b) < c)
    (a == b == c)  =>  ((a == b) == c)

    // Operators from different groups bracket based on precedence.
    (a < b == c)   =>  ((a < b) == c)
    (a == b < c)   =>  (a == (b < c))

So, notice how if we stick within one operator group, we always see brackets on
the left hand side. This is what we will exploit.

"But wait," you might be thinking, "surely if we calculate `a < b` first, then
we only have a boolean value left over to compare against `c`!". Well, you would
be correct if the type we are comparing had a sensible definition of `<`, but we
are talking about a hack here!

To make these comparisons work, we wrap up the items from our comparison in
a special type:

    template <typename T>
    struct Intermediate {
      operator bool() { return result; }
      T value;
      bool result;
    };

Next, we define our operators for comparing an instance of `Intermediate<T>`
against an instance of `T`. To keep this concise, we can use a macro to remove
the manual boilerplate:

    #define DEFINE_OP(op)  \
      template <typename T>  \
      Intermediate<T> operator op(Intermediate<T> lhs, T rhs) {  \
        return Intermediate{rhs, lhs.result && lhs.value op rhs};  \
      }
    DEFINE_OP(<);
    DEFINE_OP(>);
    DEFINE_OP(<=);
    DEFINE_OP(>=);
    DEFINE_OP(==);
    #undef DEFINE_OP

Now, we can write something like:

    // Equivalent to 1 < 2 < 3 in Python:
    if (Intermediate<int>{1, true} < 2 < 3) {
      ...
    }

Which works as we would like! However, it's not that attractive. We have to have
this great big type wrapper around the first item. That's not good. To fix this,
we have to turn the hack up to 11:

    struct MakeInitial {} make_initial;

    template <typename T>
    Intermediate<T> operator<(MakeInitial _, T value) {
      return Intermediate<T>{value, true};
    }

Now, we have this singleton type `MakeInitial` and some operator for it which
produces our first element. Due to the precedence and associativity of the
operator `<`, this allows us to write something like:

    (make_initial < 1 < 2 < 3)  =>  (((make_initial < 1) < 2) < 3)

As you can see, the first thing to be evaluated is the magic `make_initial`
operator, which sets up our first element. All that remains is to hide away
these gritty internals in a macro:

    #define COMPARE(expr) (make_initial < expr)

Now we can finally write what we wanted from the start:

    if (COMPARE(1 < 2 < 3)) {
      ...
    }

Awesome! Now to start making heavy use of this in all my projects! But wait,
there is one small issue:

    COMPARE(false)
    =>
    (make_initial < false)
    =>
    Intermediate<T>{false, true}
    => (when converted to bool)
    true

To make this go away, all we have to do is introduce a special type for the
first element, update the `make_initial` operator, and add overloads for this
new type. Wrapping it all up in a namespace, this leaves us with:

    namespace wat {

    template <typename T>
    struct Initial {
      operator T() { return value; }
      T value;
    };
    
    template <typename T>
    Initial<T> operator<(MakeInitial _, T value) {
      return Initial<T>{value};
    }

    #define DEFINE_OP(op)  \
      template <typename T>
      Intermediate<T> operator op(Initial<T> lhs, T rhs) {
        return Intermediate<T>{rhs, lhs.value op rhs};
      }
      template <typename T>
      Intermediate<T> operator op(Intermediate<T> lhs, T rhs) {
        return Intermediate<T>{rhs, lhs.result && lhs.value op rhs};
      }
    DEFINE_OP(<);
    DEFINE_OP(>);
    DEFINE_OP(<=);
    DEFINE_OP(>=);
    DEFINE_OP(==);
    #undef DEFINE_OP

    }  // namespace wat

    #define COMPARE(expr) (wat::make_initial < expr)

Job done.

[1]: http://en.cppreference.com/w/cpp/language/operator_precedence
