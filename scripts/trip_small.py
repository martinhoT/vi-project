import pandas as pd
from datetime import datetime

trip = pd.read_csv("data/trip.csv")

trip_small = trip.drop(["zip_code", "id", "start_station_name", "end_station_name", "bike_id"], axis=1)

trip_small["start_date"] = trip_small["start_date"].map(lambda s: datetime.strptime(s, "%m/%d/%Y %H:%M").date())
trip_small["end_date"] = trip_small["end_date"].map(lambda s: datetime.strptime(s, "%m/%d/%Y %H:%M").date())

trip_simple_final = (trip_small
    .groupby(by=["start_station_id", "end_station_id", "start_date", "end_date", "subscription_type"])
    .agg(["mean", "size"])
    .reset_index()
)

trip_simple_final.columns = trip_simple_final.columns.to_flat_index()

trip_simple_final.rename(columns={
    ("start_station_id", ""): "start_station_id",
    ("end_station_id", ""): "end_station_id",
    ("start_date", ""): "start_date",
    ("end_date", ""): "end_date",
    ("subscription_type", ""): "subscription_type",
    ("duration", "mean"): "duration_avg",
    ("duration", "size"): "total_trips",
}).to_csv("data/trip_small.csv", index=False)