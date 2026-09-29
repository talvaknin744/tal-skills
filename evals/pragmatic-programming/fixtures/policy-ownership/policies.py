def can_return(days_since_delivery):
    return 0 <= days_since_delivery <= 30


def can_submit_expense(days_since_expense):
    return 0 <= days_since_expense <= 30
