class Counter:
    def __init__(self, listener):
        self.value = 0
        self.listener = listener

    def increment(self):
        self.value += 1
        # Notify this synchronous local listener with the new value.
