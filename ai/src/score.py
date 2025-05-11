# train_model.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
import joblib
import math

# 1. 데이터 로드·전처리
df = pd.read_csv("서울시설공단_공영주차장_시간별_주차현황_20240331.csv", encoding="cp949")
df["시간대"] = pd.to_datetime(df["시간대"], format="%Y-%m-%d %H", errors='coerce')
df.dropna(subset=["시간대"], inplace=True)
df["시간"] = df["시간대"].dt.hour
df["요일"] = df["시간대"].dt.dayofweek
df["주차장명"] = df["주차장명"].str.strip().str.lower()
# 혼잡도 계산
df["혼잡도(%)"] = ((df["입차대수"] - df["출차대수"]) / df["주차면수"]) * 100
df["혼잡도(%)"] = df["혼잡도(%)"].clip(0,100)
# 시차 라그 생성
lags = [(7*24, "지난주_혼잡도"), (14*24, "지지난주_혼잡도"), (21*24, "지지지난주_혼잡도")]
for lag, col in lags:
    df[col] = df.groupby(["주차장명","요일","시간"])["혼잡도(%)"].shift(lag)
    df[col].fillna(method="ffill", inplace=True)
    df[col].fillna(df["혼잡도(%)"], inplace=True)
# 불필요 컬럼 제거 및 타입 최적화
df.drop(columns=["시간대"], inplace=True)
for c in df.select_dtypes(["int64","float64"]): df[c] = df[c].astype("float32")

# 2. 특징·전처리기 학습
features = ["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도","시간","요일"]
X = df[features].copy()
y = df["혼잡도(%)"].copy()
ordinal = OrdinalEncoder()
X[["요일"]] = ordinal.fit_transform(X[["요일"]])
numerical = [f for f in features if f != "요일"]
scaler = StandardScaler()
X[numerical] = scaler.fit_transform(X[numerical])
fit_columns = X.columns.tolist()

# 3. 모델 학습
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = XGBRegressor(n_estimators=300, max_depth=10, learning_rate=0.02, subsample=0.8, colsample_bytree=0.8, random_state=42)
model.fit(X_train, y_train)

# 4. 저장
joblib.dump(scaler, "scaler.joblib")
joblib.dump(ordinal, "ordinal.joblib")
joblib.dump(fit_columns, "fit_columns.joblib")
joblib.dump(model, "model.joblib")
print("모델 학습 완료, 파일 저장됨: scaler.joblib, ordinal.joblib, fit_columns.joblib, model.joblib")
