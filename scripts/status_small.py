import os
import pandas as pd
from itertools import pairwise
from datetime import datetime

# Assumes status.csv is split using the 'split' command into parts inside the 'status' folder

status_file = lambda f: os.path.join("data/status", f)
status_blocks = sorted(os.listdir("data/status"))

status_0 = pd.read_csv(status_file(status_blocks[0]), header=0)
columns = status_0.columns

status = pd.DataFrame([], columns=["station_id", "date", "bikes_available_sum", "bikes_available_size", "docks_available_sum", "docks_available_size"])
n_blocks_per_read = 100

parts = []
for span_begin, span_end in pairwise(range(0, len(status_blocks) + n_blocks_per_read, n_blocks_per_read)):
    print(f"Concatenating blocks {span_begin:4}-{span_end:4} | Total rows: {status.shape[0]:>6}", end="\r")
    tmp = pd.concat(
        [
            # The first file "xaa" has a header, we can just skip it since we already know it
            pd.read_csv(status_file(f), names=columns, skiprows=1 if f == "xaa" else 0)
            for f in status_blocks[span_begin:span_end]
        ],
        axis=0,
        ignore_index=True
    )

    tmp["date"] = tmp["time"].map(lambda v: datetime.strptime(v.split(" ")[0].replace("-", "/"), "%Y/%m/%d").date().isoformat())
    tmp = (tmp
        .drop("time", axis=1)
        .groupby(["station_id", "date"])
        # We have to aggregate each part with the sum
        # (and number of values of that sum) because each block
        # may not have all the data for each day-station pair,
        # so we can't just do the mean yet
        .agg(["sum", "size"])
        .reset_index()
    )
    tmp.columns = tmp.columns.to_flat_index()
    tmp.rename(inplace=True, columns={
        ("station_id", ""): "station_id",
        ("date", ""): "date",
        ("bikes_available", "sum"): "bikes_available_sum",
        ("bikes_available", "size"): "bikes_available_size",
        ("docks_available", "sum"): "docks_available_sum",
        ("docks_available", "size"): "docks_available_size",
    })

    status = pd.concat([status, tmp], axis=0, ignore_index=True)

status["bikes_available_avg"] = status["bikes_available_sum"] / status["bikes_available_size"]
status["docks_available_avg"] = status["docks_available_sum"] / status["docks_available_size"]
status.drop(inplace=True, columns=["bikes_available_sum", "bikes_available_size", "docks_available_sum", "docks_available_size"])

status.to_csv("data/status_small.csv", index=False)