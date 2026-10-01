# Response mapping correction
A response mapping currently emits {"customer_nmae": customer.name}. The requested API change corrects the key to customer_name. There is no numeric scan, bounded structure, sharing issue, memory budget or performance objective in this task. The value expression remains customer.name.
