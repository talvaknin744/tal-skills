# This notebook cell only transforms an in-memory list.
values = [1, 2, 3, 4]
result = [value * 2 for value in values if value % 2 == 0]
print(result)
