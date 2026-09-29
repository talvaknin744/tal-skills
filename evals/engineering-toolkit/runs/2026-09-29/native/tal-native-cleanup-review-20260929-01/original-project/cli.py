import argparse


parser = argparse.ArgumentParser()
parser.add_argument("--mode", choices=["legacy", "current"], required=True)
args = parser.parse_args()
print(f"ready ({args.mode})")
