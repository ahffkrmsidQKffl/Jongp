# inference_server.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import math
import pandas as pd
import numpy as np
import joblib

# 시간별 주차현황 데이터 로드·전처리 (학습과 동일)
df = pd.read_csv("서울시설공단_공영주차장_시간별_주차현황_20240331.csv", encoding="cp949")
df["시간대"] = pd.to_datetime(df["시간대"], format="%Y-%m-%d %H", errors='coerce')
df.dropna(subset=["시간대"], inplace=True)
df["시간"] = df["시간대"].dt.hour
df["요일"] = df["시간대"].dt.dayofweek
df["주차장명"] = df["주차장명"].str.strip().str.lower()
df["혼잡도(%)"] = ((df["입차대수"] - df["출차대수"]) / df["주차면수"] * 100).clip(0,100)
# lag features 생성
lags = [(7*24, "지난주_혼잡도"), (14*24, "지지난주_혼잡도"), (21*24, "지지지난주_혼잡도")]
for lag, col in lags:
    df[col] = df.groupby(["주차장명","요일","시간"])["혼잡도(%)"].shift(lag)
    df[col].fillna(method="ffill", inplace=True)
    df[col].fillna(df["혼잡도(%)"], inplace=True)
# 불필요 컬럼 및 타입
df.drop(columns=["시간대"], inplace=True)
for c in df.select_dtypes(["int64","float64"]): df[c] = df[c].astype("float32")

# 전처리기·모델 
scaler      = joblib.load("scaler.joblib")
ordinal     = joblib.load("ordinal.joblib")
fit_columns = joblib.load("fit_columns.joblib")
model       = joblib.load("model.joblib")

# 데이터
df_static = pd.read_csv("서울시_공영주차장_최종.csv", encoding="cp949")
df_static["주차장명"] = df_static["주차장명"].str.strip().str.lower()

# 헬퍼 함수 정의
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1,phi2 = map(math.radians, (lat1,lat2))
    dphi = math.radians(lat2-lat1)
    dlambda = math.radians(lon2-lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def calculate_fee(row, duration):
    base = row.get("기본 주차 요금",0) or 0
    t0   = row.get("기본 주차 시간(분 단위)",0) or 0
    extra= row.get("추가 단위 요금",0) or 0
    dt   = row.get("추가 단위 시간(분 단위)",5) or 5
    cap  = row.get("일 최대 요금", base) or base
    if duration <= t0:
        return base
    over  = duration - t0
    units = math.ceil(over / dt)
    return min(base + units * extra, cap)

def predict_congestion(name, weekday, hour):
    wd     = (weekday - 1) % 7
    filt   = df[(df["주차장명"]==name.lower()) & (df["요일"]==wd) & (df["시간"]==hour)]
    if filt.empty:
        filt = df[df["주차장명"]==name.lower()]
    avg = filt[["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"]].mean()
    inp = pd.DataFrame([[avg[col] for col in ["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"]]],
                       columns=["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"])
    inp["시간"] = hour; inp["요일"] = wd
    inp = inp.reindex(columns=fit_columns)
    inp[["요일"]] = ordinal.transform(inp[["요일"]])
    nums = [c for c in fit_columns if c != "요일"]
    inp[nums] = scaler.transform(inp[nums])
    return float(model.predict(inp)[0])

def recommend(candidates, duration=120, lat0=None, lon0=None):
    raw=[]
    for c in candidates:
        name,rev,wd,hr = c["p_id"], c.get("review",0), c.get("weekday",1), c.get("hour",0)
        cong = predict_congestion(name, wd, hr)
        cs   = np.clip(100-cong,0,100)
        row  = df_static[df_static["주차장명"]==name.lower()]
        if not row.empty and lat0 is not None and lon0 is not None:
            lat,lon = row[["위도","경도"]].iloc[0]
            dist    = haversine(lat0,lon0,lat,lon)
        else:
            dist    = 0
        fee    = calculate_fee(row.iloc[0] if not row.empty else {}, duration)
        rs     = np.clip(rev,0,5)/5*100
        raw.append({"p_id":name,"cs":cs,"dist":dist,"fee":fee,"rs":rs})
    fees  = [r["fee"] for r in raw]; dists=[r["dist"] for r in raw]
    minf,maxf = (min(fees),max(fees)) if fees else (0,1)
    mind,maxd = (min(dists),max(dists)) if dists else (0,1)
    scenarios={"혼잡도우선":{"w_c":0.8,"w_d":0.1,"w_f":0.05,"w_r":0.05},
               "거리우선":  {"w_c":0.5,"w_d":0.3,"w_f":0.1, "w_r":0.1},
               "요금우선":  {"w_c":0.5,"w_d":0.1,"w_f":0.3, "w_r":0.1},
               "리뷰우선":  {"w_c":0.5,"w_d":0.1,"w_f":0.1, "w_r":0.3}}
    out={}
    for key,w in scenarios.items():
        temp=[]
        for r in raw:
            fs =(maxf - r["fee"]) / (maxf-minf)*100 if maxf>minf else 0
            ds =(maxd - r["dist"]) / (maxd-mind)*100 if maxd>mind else 0
            sc = w["w_c"]*r["cs"] + w["w_d"]*ds + w["w_f"]*fs + w["w_r"]*r["rs"]
            temp.append({"p_id":r["p_id"],"score":sc})
        out[key]=temp
    return out

# 출력 + JSON 리턴
def main():
    try: data=json.load(sys.stdin)
        #예시 데이터
    except: data={"candidates":[
        {"p_id":"복정역","review":4.2,"weekday":3,"hour":14},
        {"p_id":"볕우물","review":3.5,"weekday":3,"hour":14},
        {"p_id":"용산주차빌딩","review":4.9,"weekday":3,"hour":14}
    ],"parking_duration":120,"base_lat":37.450,"base_lon":127.129}
    res=recommend(data["candidates"],data.get("parking_duration",120),data.get("base_lat"),data.get("base_lon"))
    print("주차장명\t혼잡도우선\t거리우선\t요금우선\t리뷰우선")
    for item in res["혼잡도우선"]:
        pid=item["p_id"]
        scores={k: next(x["score"] for x in res[k] if x["p_id"]==pid) for k in res}
        print(f"{pid}\t{scores['혼잡도우선']:.2f}\t{scores['거리우선']:.2f}\t{scores['요금우선']:.2f}\t{scores['리뷰우선']:.2f}")
    json.dump([{"p_id":i["p_id"], **{k:round(next(x["score"] for x in res[k] if x["p_id"]==i["p_id"]),2) for k in res}} for i in res["혼잡도우선"]], sys.stdout, ensure_ascii=False, indent=2)

if __name__=="__main__": main()
