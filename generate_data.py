import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 100 days of transactions starting from Jan 1, 2026
dates = pd.date_range(start='2026-01-01', periods=100, freq='D')

data = {
    'date': dates,
    'description': np.random.choice([
        'Co-packer fee', 'Corrugated boxes', 'Salaries', 'Meta Ads', 'Warehouse utilities',
        'Flavor R&D', 'Freight forwarding', 'FDA Compliance', 'Mixing equipment', 'McKinsey Consulting'
    ], 100),
    # Realistic CPG variance
    'amount': np.random.normal(5000, 2000, 100).astype(int),
    'category': np.random.choice(['COGS', 'OpEx', 'SG&A', 'R&D'], 100)
}

df = pd.DataFrame(data)
# Ensure no negative amounts
df['amount'] = df['amount'].abs()
df.to_csv('sample_transactions.csv', index=False)
print("sample_transactions.csv generated successfully! 🚀")