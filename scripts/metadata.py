import json
import pandas as pd
from datetime import datetime

status_small = pd.read_csv("data/status_small.csv")
trip_small = pd.read_csv("data/trip_small.csv")
station = pd.read_csv("data/station.csv")

station["installation_date"] = station["installation_date"].map(lambda s: datetime.strptime(s, "%m/%d/%Y").date().isoformat())

stations = {s["id"]: {k: s[k] for k in s.keys() if k != "id"} for _, s in station.iterrows()}

# Yes these are strings, but they are ordered in a way that allows these ordinal comparisons to make sense (YYYY-mm-dd)
max_date = max(
    status_small["date"].max(),
    trip_small["start_date"].max(),
    trip_small["end_date"].max(),
    station["installation_date"].max(),
)

min_date = min(
    status_small["date"].min(),
    trip_small["start_date"].min(),
    trip_small["end_date"].min(),
    station["installation_date"].min(),
)

metadata = {
    "date_min": min_date,
    "date_max": max_date,
    "stations": stations,
}

with open("data/metadata.json", "wt") as f:
    f.write(json.dumps(metadata, indent=4))