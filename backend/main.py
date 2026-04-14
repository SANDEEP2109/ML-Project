import json
import numpy as np
 
@app.post('/analyse')
async def analyse(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
 
    # Numeric columns only
    num_df = df.select_dtypes(include=[np.number])
 
    # 1. Histogram data — value distribution per numeric column
    histograms = {}
    for col in num_df.columns:
        counts, bin_edges = np.histogram(num_df[col].dropna(), bins=20)
        histograms[col] = {
            'counts': counts.tolist(),
            'bins': [round(float(b), 4) for b in bin_edges[:-1]]
        }
 
    # 2. Correlation matrix
    corr = num_df.corr().round(2)
    correlation = {
        'columns': list(corr.columns),
        'matrix': corr.fillna(0).values.tolist()
    }
 
    # 3. Scatter — return first 200 rows of all numeric cols for flexibility
    scatter_data = num_df.head(200).fillna(0).to_dict(orient='records')
 
    # 4. Missing values per column
    missing = [
        {'column': col, 'missing': int(df[col].isnull().sum()),
         'pct': round(df[col].isnull().sum() / len(df) * 100, 1)}
        for col in df.columns
    ]
 
    # 5. Box plot stats per numeric column
    boxplots = {}
    for col in num_df.columns:
        s = num_df[col].dropna()
        q1  = float(s.quantile(0.25))
        q3  = float(s.quantile(0.75))
        iqr = q3 - q1
        boxplots[col] = {
            'min':    round(float(s.min()), 4),
            'q1':     round(q1, 4),
            'median': round(float(s.median()), 4),
            'q3':     round(q3, 4),
            'max':    round(float(s.max()), 4),
            'outliers': [round(float(v), 4) for v in s[(s < q1 - 1.5*iqr) | (s > q3 + 1.5*iqr)].head(50)]
        }
 
    return {
        'numeric_columns': list(num_df.columns),
        'histograms': histograms,
        'correlation': correlation,
        'scatter_data': scatter_data,
        'missing': missing,
        'boxplots': boxplots
    }
