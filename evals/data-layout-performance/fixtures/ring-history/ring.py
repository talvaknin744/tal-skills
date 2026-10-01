class Ring:
    def __init__(self, capacity):
        self.capacity = capacity
        self.head = 0
        self.price = [0.0] * capacity
        self.size = [0] * capacity

    def append(self, price, size):
        slot = self.head % self.capacity
        self.price[slot] = price
        self.size[slot] = size
        self.head += 1

    def vwap_last(self, count):
        start = max(0, self.head - count)
        positions = [i % self.capacity for i in range(start, self.head)]
        total = sum(self.price[i] * self.size[i] for i in positions)
        volume = sum(self.size[i] for i in positions)
        return total / volume
