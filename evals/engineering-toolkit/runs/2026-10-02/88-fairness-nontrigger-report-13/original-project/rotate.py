def rotate_once(labels):
    ordered = sorted(set(labels))
    return ordered[1:] + ordered[:1]
