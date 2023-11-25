import pandas as pd
from datetime import datetime

trips = pd.read_csv("data/trip.csv")
trips["end_date"] = trips["end_date"].map(lambda s: datetime.strptime(s, "%m/%d/%Y %H:%M").date())

total_duration_per_day = trips.groupby(['end_date', 'bike_id'])['duration'].sum().reset_index(name='total_duration')

total_duration_per_day.to_csv("data/bikes_usage.csv", index=False)