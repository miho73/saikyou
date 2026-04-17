import os

import yaml

config = dict()

try:
  mode = os.environ["mode"]
except KeyError:
  raise EnvironmentError("Missing environmental variable: mode")

if mode == "dev":
  path = "config_dev.yml"
elif mode == "prod":
  path = "config_prod.yml"
else:
  raise EnvironmentError(f"Invalid mode: {mode}")

with open(path, "r") as f:
  config.update(yaml.load(f, Loader=yaml.FullLoader))
  ENV = config["env"]
