import yaml

config = dict()
path = "config.yml"

with open(path, "r") as f:
  config.update(yaml.load(f, Loader=yaml.FullLoader))
