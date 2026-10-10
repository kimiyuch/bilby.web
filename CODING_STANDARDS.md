# Coding standards

Read during review.

- Clock and time logic (counting down, catching up, events, when to tick) belongs in `resources/js/play/kit`, with
  tests in `tests/js`. It's a port of BilbyKit in the bilby.app repo; a change on one side needs the same change and
  test on the other. Views and the store only call it.
