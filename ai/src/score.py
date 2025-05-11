
# inference_server.py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import json
import math
import pandas as pd
import numpy as np
import joblib

# 1) 전처리기·모델 로드
scaler      = joblib.load("scaler.joblib")
ordinal     = joblib.load("ordinal.joblib")
fit_columns = joblib.load("fit_columns.joblib")
model       = joblib.load("model.joblib")

# 2) 정적 정보 로드
df_static = pd.read_csv("서울시_공영주차장_최종.csv", encoding="cp949")
df_static["주차장명"] = df_static["주차장명"].str.strip().str.lower()

# 3) 헬퍼 함수 정의
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1,phi2 = map(math.radians, (lat1,lat2))
    dphi = math.radians(lat2-lat1)
    dlambda = math.radians(lon2-lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def calculate_fee(row,duration):
    base = row.get("기본 주차 요금",0) or 0
    t0 = row.get("기본 주차 시간(분 단위)",0) or 0
    extra = row.get("추가 단위 요금",0) or 0
    dt = row.get("추가 단위 시간(분 단위)",5) or 5
    cap = row.get("일 최대 요금", base) or base
    if duration<=t0: return base
    over = duration-t0
    units = math.ceil(over/dt)
    return min(base+units*extra, cap)

def predict_congestion(name,weekday,hour):
    wd = (weekday-1)%7
    # df 시간렬 데이터는 메모리 상 df 변수로 로드되어 있어야 함
    filt = df[(df["주차장명"]==name.lower())&(df["요일"]==wd)&(df["시간"]==hour)]
    if filt.empty:
        filt = df[df["주차장명"]==name.lower()]
    avg = filt[["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"]].mean()
    inp = pd.DataFrame([avg.values],columns=["주차면수","입차대수","출차대수","지난주_혼잡도","지지난주_혼잡도","지지지난주_혼잡도"])
    inp["시간"] = hour; inp["요일"] = wd
    inp = inp.reindex(columns=fit_columns)
    inp[["요일"]] = ordinal.transform(inp[["요일"]])
    num_cols = [c for c in fit_columns if c!="요일"]
    inp[num_cols] = scaler.transform(inp[num_cols])
    return float(model.predict(inp)[0])

def recommend(candidates,duration=120,lat0=None,lon0=None):
    results_raw=[]
    for c in candidates:
        name,rev,wd,hr=c["p_id"],c.get("review",0),c.get("weekday",1),c.get("hour",0)
        cong=predict_congestion(name,wd,hr)
        cs = np.clip(100-cong,0,100)
        row = df_static[df_static["주차장명"]==name.lower()]
        if not row.empty and lat0 is not None:
            lat,lon=row[["위도","경도"]].iloc[0]
            dist=haversine(lat0,lon0,lat,lon)
        else:
            dist=0
        fee=calculate_fee(row.iloc[0] if not row.empty else {},duration)
        rs=np.clip(rev,0,5)/5*100
        results_raw.append({"p_id":name,"cs":cs,"dist":dist,"fee":fee,"rs":rs})
    fees=[r["fee"] for r in results_raw]; dists=[r["dist"] for r in results_raw]
    minf,maxf=(min(fees),max(fees)) if fees else (0,1)
    mind,maxd=(min(dists),max(dists)) if dists else (0,1)
    scenarios={"혼잡도우선":{"w_c":0.8,"w_d":0.1,"w_f":0.05,"w_r":0.05},
               "거리우선":{"w_c":0.5,"w_d":0.3,"w_f":0.1,"w_r":0.1},
               "요금우선":{"w_c":0.5,"w_d":0.1,"w_f":0.3,"w_r":0.1},
               "리뷰우선":{"w_c":0.5,"w_d":0.1,"w_f":0.1,"w_r":0.3}}
    out={}
    for key,w in scenarios.items():
        tmp=[]
        for r in results_raw:
            fs=(maxf-r["fee"])/(maxf-minf)*100 if maxf>minf else 0
            ds=(maxd-r["dist"])/(maxd-mind)*100 if maxd>mind else 0
            sc=w["w_c"]*r["cs"]+w["w_d"]*ds+w["w_f"]*fs+w["w_r"]*r["rs"]
            tmp.append({"p_id":r["p_id"],"score":sc})
        out[key]=tmp
    return out

# 표 출력 + JSON 리턴

def main():
    try: data=json.load(sys.stdin)
    except:
        data={"candidates":[
            {"p_id":"복정역","review":4.2,"weekday":3,"hour":14},
            {"p_id":"볕우물","review":3.5,"weekday":3,"hour":14},
            {"p_id":"용산주차빌딩","review":4.9,"weekday":3,"hour":14}
        ],"parking_duration":120,"base_lat":37.450,"base_lon":127.129}
    res=recommend(data["candidates"],data.get("parking_duration",120),data.get("base_lat"),data.get("base_lon"))

    # JSON 출력
    json.dump(
        [
            {"p_id":item["p_id"],"주차장명": item["p_id"],**{k:round(next(x["score"] for x in res[k] if x["p_id"]==item["p_id"]),2) for k in res}}
            for item in res["혼잡도우선"]],
        sys.stdout,ensure_ascii=False,indent=2
    )

if __name__=="__main__": main()